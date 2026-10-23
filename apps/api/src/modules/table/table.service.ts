import { prisma, getIO } from '../../config';
import { ApiError } from '../../utils/api-error';
import type { CreateTableInput, UpdateTableInput } from '@dineview/shared';

export async function getAllTables(restaurantId: string) {
  return prisma.table.findMany({
    where: { restaurantId },
    orderBy: { label: 'asc' },
    include: {
      qrCodes: { where: { isActive: true }, take: 1 },
      tableSessions: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: {
          orders: {
            where: { status: { not: 'CANCELLED' } },
            select: { id: true, status: true, total: true },
          },
        },
      },
    },
  });
}

export async function createTable(restaurantId: string, input: CreateTableInput) {
  const existing = await prisma.table.findFirst({
    where: { label: input.label, restaurantId },
  });
  if (existing) {
    throw ApiError.conflict(`Table "${input.label}" already exists`);
  }

  return prisma.table.create({
    data: { ...input, restaurantId },
  });
}

export async function getTableById(restaurantId: string, id: string) {
  const table = await prisma.table.findFirst({
    where: { id, restaurantId },
    include: {
      qrCodes: true,
      tableSessions: {
        where: { status: 'ACTIVE' },
        include: { orders: true },
      },
    },
  });
  if (!table) throw ApiError.notFound('Table not found');
  return table;
}

export async function updateTable(restaurantId: string, id: string, input: UpdateTableInput) {
  const table = await prisma.table.findFirst({ where: { id, restaurantId } });
  if (!table) throw ApiError.notFound('Table not found');

  return prisma.table.update({
    where: { id },
    data: input,
  });
}

export async function deleteTable(restaurantId: string, id: string) {
  const table = await prisma.table.findFirst({ where: { id, restaurantId } });
  if (!table) throw ApiError.notFound('Table not found');

  const activeSessions = await prisma.tableSession.count({
    where: { tableId: id, status: 'ACTIVE' },
  });
  if (activeSessions > 0) {
    throw ApiError.conflict('Cannot delete table with active sessions');
  }

  await prisma.table.delete({ where: { id } });
}

const IN_PROGRESS = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] as const;

// Settles the table: served orders are marked paid and the session is closed,
// so the next scan of this table's QR code starts a fresh session.
export async function closeTableSession(restaurantId: string, tableId: string, userId: string) {
  const session = await prisma.tableSession.findFirst({
    where: { tableId, restaurantId, status: 'ACTIVE' },
    include: { orders: true, table: true },
  });
  if (!session) throw ApiError.notFound('This table has no open session');

  const inProgress = session.orders.filter((o) => (IN_PROGRESS as readonly string[]).includes(o.status));
  if (inProgress.length > 0) {
    throw ApiError.conflict(
      `${inProgress.length} order(s) still in progress. Serve or cancel them before closing the table.`,
    );
  }

  const served = session.orders.filter((o) => o.status === 'SERVED');
  const now = new Date();

  await prisma.$transaction([
    ...served.map((o) =>
      prisma.order.update({
        where: { id: o.id },
        data: {
          status: 'PAID',
          paidAt: now,
          statusLogs: { create: { fromStatus: 'SERVED', toStatus: 'PAID', changedById: userId } },
        },
      }),
    ),
    prisma.tableSession.update({
      where: { id: session.id },
      data: { status: 'CLOSED', endedAt: now },
    }),
  ]);

  const total = session.orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.total), 0);

  try {
    const event = { sessionId: session.id, tableId, tableLabel: session.table.label };
    const io = getIO();
    io.to(`restaurant:${restaurantId}`).emit('session:closed', event);
    io.to(`restaurant:${restaurantId}:table:${tableId}`).emit('session:closed', event);
  } catch {
    // Socket not initialized
  }

  return { sessionId: session.id, paidOrders: served.length, total: Math.round(total * 100) / 100 };
}
