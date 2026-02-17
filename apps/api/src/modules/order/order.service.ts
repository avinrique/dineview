import { prisma, redis } from '../../config';
import { getIO } from '../../config/socket';
import { ApiError } from '../../utils/api-error';
import { generateOrderNumber, ORDER_STATE_TRANSITIONS } from '@dineview/shared';
import type { OrderStatus, CreateOrderInput, UpdateOrderStatusInput } from '@dineview/shared';

interface SessionInfo {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  tableLabel: string;
}

export async function createOrder(session: SessionInfo, input: CreateOrderInput) {
  // Fetch dishes and validate
  const dishIds = input.items.map((i) => i.dishId);
  const dishes = await prisma.dish.findMany({
    where: {
      id: { in: dishIds },
      restaurantId: session.restaurantId,
      isAvailable: true,
    },
  });

  if (dishes.length !== dishIds.length) {
    throw ApiError.badRequest('One or more dishes are unavailable');
  }

  const dishMap = new Map(dishes.map((d) => [d.id, d]));

  // Calculate totals
  let subtotal = 0;
  const orderItems = input.items.map((item) => {
    const dish = dishMap.get(item.dishId)!;
    const unitPrice = Number(dish.price);
    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;
    return {
      dishId: item.dishId,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
      specialNotes: item.specialNotes || null,
    };
  });

  // Get restaurant settings for tax
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
  });
  const settings = (restaurant?.settings as any) || {};
  const taxRate = (settings.taxRate || 0) / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      status: 'PLACED',
      specialNotes: input.specialNotes || null,
      subtotal,
      tax,
      total,
      sessionId: session.sessionId,
      restaurantId: session.restaurantId,
      items: {
        create: orderItems,
      },
      statusLogs: {
        create: {
          toStatus: 'PLACED',
        },
      },
    },
    include: {
      items: {
        include: {
          dish: { select: { name: true, imageUrl: true } },
        },
      },
    },
  });

  // Emit WebSocket event
  try {
    const io = getIO();
    const event = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      tableId: session.tableId,
      tableLabel: session.tableLabel,
      items: order.items.map((i) => ({
        dishName: i.dish.name,
        quantity: i.quantity,
      })),
      total: Number(order.total),
      placedAt: order.placedAt.toISOString(),
    };
    io.to(`restaurant:${session.restaurantId}`).emit('order:new', event);
    io.to(`restaurant:${session.restaurantId}:kitchen`).emit('order:new', event);
  } catch {
    // Socket not initialized in tests
  }

  return order;
}

export async function getOrdersBySession(sessionId: string) {
  return prisma.order.findMany({
    where: { sessionId },
    orderBy: { placedAt: 'desc' },
    include: {
      items: {
        include: {
          dish: { select: { name: true, imageUrl: true } },
        },
      },
      statusLogs: { orderBy: { changedAt: 'asc' } },
    },
  });
}

export async function getAllOrders(
  restaurantId: string,
  opts: { skip: number; limit: number; status?: string },
) {
  const where: any = { restaurantId };
  if (opts.status) {
    where.status = opts.status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: opts.skip,
      take: opts.limit,
      orderBy: { placedAt: 'desc' },
      include: {
        items: {
          include: {
            dish: { select: { name: true, imageUrl: true } },
          },
        },
        session: {
          include: {
            table: { select: { label: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

export async function getOrderById(restaurantId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      items: {
        include: {
          dish: { select: { name: true, imageUrl: true, price: true } },
        },
      },
      session: {
        include: { table: true },
      },
      statusLogs: {
        orderBy: { changedAt: 'asc' },
        include: {
          changedBy: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  return order;
}

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  input: UpdateOrderStatusInput,
  userId: string,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      session: { include: { table: true } },
    },
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Validate state transition
  const currentStatus = order.status as OrderStatus;
  const allowedTransitions = ORDER_STATE_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(input.status as OrderStatus)) {
    throw ApiError.badRequest(
      `Cannot transition from ${currentStatus} to ${input.status}`,
    );
  }

  // Build timestamp update
  const timestampField: Record<string, string> = {
    ACCEPTED: 'acceptedAt',
    PREPARING: 'preparingAt',
    READY: 'readyAt',
    SERVED: 'servedAt',
    PAID: 'paidAt',
  };
  const updateData: any = { status: input.status };
  const tsField = timestampField[input.status];
  if (tsField) {
    updateData[tsField] = new Date();
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...updateData,
      statusLogs: {
        create: {
          fromStatus: currentStatus,
          toStatus: input.status as any,
          note: input.note || null,
          changedById: userId,
        },
      },
    },
    include: {
      items: {
        include: { dish: { select: { name: true } } },
      },
      session: { include: { table: true } },
    },
  });

  // Emit WebSocket event
  try {
    const io = getIO();
    const event = {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      fromStatus: currentStatus,
      toStatus: input.status,
      tableId: order.session.tableId,
      tableLabel: order.session.table.label,
      changedAt: new Date().toISOString(),
    };
    io.to(`restaurant:${restaurantId}`).emit('order:status_changed', event);
    io.to(`restaurant:${restaurantId}:table:${order.session.tableId}`).emit('order:status_changed', event);

    // Invalidate menu cache if order completed
    if (input.status === 'PAID') {
      await redis.del(`menu:${restaurantId}`);
    }
  } catch {
    // Socket not initialized
  }

  return updated;
}
