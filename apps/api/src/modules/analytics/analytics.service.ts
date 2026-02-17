import { prisma } from '../../config';

export async function getDashboardStats(restaurantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, todayRevenue, activeSessions, totalDishes] = await Promise.all([
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
  ]);

  return {
    todayOrders,
    todayRevenue: Number(todayRevenue._sum.total || 0),
    activeSessions,
    totalDishes,
  };
}

export async function getRevenueOverTime(restaurantId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return prisma.dailyAnalytics.findMany({
    where: {
      restaurantId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      totalOrders: true,
      totalRevenue: true,
      avgOrderValue: true,
      totalGuests: true,
    },
  });
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
