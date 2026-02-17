import { prisma } from '../../config';
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
        include: { orders: { where: { status: { notIn: ['PAID', 'CANCELLED'] } } } },
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
