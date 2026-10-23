/**
 * Resets the demo restaurant to a clean, presentable state:
 *  - removes every order and table session (no stale tickets on the kitchen display)
 *  - generates sample order history for the past N days (default 30) so the
 *    dashboard and analytics have something to show
 *
 * The history is generated sample data for demos only, never real sales.
 *
 *   pnpm --filter @dineview/api demo:reset            # 30 days of history
 *   pnpm --filter @dineview/api demo:reset -- --days 0  # just clear
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const slug = process.env.DEMO_RESTAURANT_SLUG || 'bella-vista';
const daysArg = process.argv.indexOf('--days');
const days = daysArg > -1 ? Number(process.argv[daysArg + 1]) : 30;

// Deterministic pseudo-random so every reset produces the same charts
let seed = 42;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;

async function main() {
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) throw new Error(`Restaurant "${slug}" not found. Run the seed first.`);
  const rid = restaurant.id;

  const deleted = await prisma.$transaction([
    prisma.orderStatusLog.deleteMany({ where: { order: { restaurantId: rid } } }),
    prisma.orderItem.deleteMany({ where: { order: { restaurantId: rid } } }),
    prisma.order.deleteMany({ where: { restaurantId: rid } }),
    prisma.tableSession.deleteMany({ where: { restaurantId: rid } }),
  ]);
  console.log(`🧹 Cleared ${deleted[2].count} orders and ${deleted[3].count} table sessions`);

  const tables = await prisma.table.findMany({ where: { restaurantId: rid, isActive: true } });
  const dishes = await prisma.dish.findMany({ where: { restaurantId: rid, isAvailable: true } });
  const taxRate = ((restaurant.settings as any)?.taxRate || 0) / 100;
  // Weekends are busier
  const baseOrders = [14, 8, 9, 10, 11, 16, 18];

  let created = 0;
  for (let d = days; d >= 1; d--) {
    const day = new Date();
    day.setDate(day.getDate() - d);
    const count = Math.round(baseOrders[day.getDay()]! * (0.7 + rand() * 0.6));

    for (let i = 0; i < count; i++) {
      const placedAt = new Date(day);
      placedAt.setHours(11 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
      const servedAt = new Date(placedAt.getTime() + (12 + rand() * 20) * 60000);
      const paidAt = new Date(servedAt.getTime() + (20 + rand() * 40) * 60000);

      const lines = new Map<string, number>();
      const itemCount = 1 + Math.floor(rand() * 4);
      for (let k = 0; k < itemCount; k++) {
        const dish = pick(dishes);
        lines.set(dish.id, (lines.get(dish.id) || 0) + 1 + (rand() < 0.2 ? 1 : 0));
      }
      const items = [...lines].map(([dishId, quantity]) => {
        const unitPrice = Number(dishes.find((x) => x.id === dishId)!.price);
        return { dishId, quantity, unitPrice, subtotal: unitPrice * quantity };
      });
      const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
      const tax = Math.round(subtotal * taxRate * 100) / 100;

      const session = await prisma.tableSession.create({
        data: {
          restaurantId: rid,
          tableId: pick(tables).id,
          status: 'CLOSED',
          guestCount: 1 + Math.floor(rand() * 4),
          startedAt: new Date(placedAt.getTime() - 5 * 60000),
          endedAt: paidAt,
        },
      });

      await prisma.order.create({
        data: {
          restaurantId: rid,
          sessionId: session.id,
          orderNumber: `ORD-${placedAt.toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(rand() * 36 ** 4).toString(36).toUpperCase().padStart(4, '0')}`,
          status: 'PAID',
          subtotal,
          tax,
          total: subtotal + tax,
          placedAt,
          acceptedAt: new Date(placedAt.getTime() + 60000),
          preparingAt: new Date(placedAt.getTime() + 3 * 60000),
          readyAt: new Date(servedAt.getTime() - 2 * 60000),
          servedAt,
          paidAt,
          items: { create: items },
          statusLogs: { create: [{ toStatus: 'PLACED', changedAt: placedAt }, { fromStatus: 'SERVED', toStatus: 'PAID', changedAt: paidAt }] },
        },
      });
      created++;
    }
  }
  if (days > 0) console.log(`📈 Generated ${created} sample orders over the past ${days} days`);

  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  await redis.del(`menu:${rid}`);
  redis.disconnect();
  console.log('✅ Demo reset complete. The kitchen display is empty and every table is free.');
}

main()
  .catch((e) => {
    console.error('❌ Demo reset failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
