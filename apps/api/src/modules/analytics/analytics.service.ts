import { prisma } from '../../config';

export async function getDashboardStats(restaurantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, todayRevenue, activeSessions, totalDishes, activeOrders] = await Promise.all([
    prisma.order.count({
      where: { restaurantId, placedAt: { gte: today } },
    }),
    prisma.order.aggregate({
      where: { restaurantId, placedAt: { gte: today }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    }),
    prisma.tableSession.count({
      where: { restaurantId, status: 'ACTIVE' },
    }),
    prisma.dish.count({
      where: { restaurantId, isAvailable: true },
    }),
    prisma.order.count({
      where: { restaurantId, status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] } },
    }),
  ]);

  return {
    todayOrders,
    todayRevenue: Number(todayRevenue._sum.total || 0),
    activeSessions,
    totalDishes,
    activeOrders,
  };
}

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Aggregated live from orders (the DailyAnalytics rollup table is never populated).
export async function getRevenueOverTime(restaurantId: string, days: number) {
  const span = Math.min(Math.max(days, 1), 365);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (span - 1));
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { restaurantId, placedAt: { gte: startDate }, status: { not: 'CANCELLED' } },
    select: { placedAt: true, total: true, sessionId: true },
  });

  const buckets = new Map<string, { totalOrders: number; totalRevenue: number; sessions: Set<string> }>();
  for (let i = 0; i < span; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    buckets.set(localDateKey(d), { totalOrders: 0, totalRevenue: 0, sessions: new Set() });
  }
  for (const order of orders) {
    const bucket = buckets.get(localDateKey(order.placedAt));
    if (!bucket) continue;
    bucket.totalOrders += 1;
    bucket.totalRevenue += Number(order.total);
    bucket.sessions.add(order.sessionId);
  }

  return Array.from(buckets, ([date, b]) => ({
    date,
    totalOrders: b.totalOrders,
    totalRevenue: Math.round(b.totalRevenue * 100) / 100,
    avgOrderValue: b.totalOrders ? Math.round((b.totalRevenue / b.totalOrders) * 100) / 100 : 0,
    totalGuests: b.sessions.size,
  }));
}

export async function getTopDishes(restaurantId: string, limit: number) {
  const items = await prisma.orderItem.groupBy({
    by: ['dishId'],
    where: {
      order: { restaurantId, status: { not: 'CANCELLED' } },
    },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  const dishIds = items.map((i) => i.dishId);
  const dishes = await prisma.dish.findMany({
    where: { id: { in: dishIds } },
    select: { id: true, name: true, imageUrl: true },
  });

  const dishMap = new Map(dishes.map((d) => [d.id, d]));

  return items.map((item) => ({
    dish: dishMap.get(item.dishId),
    totalQuantity: item._sum.quantity,
    totalRevenue: Number(item._sum.subtotal),
  }));
}
