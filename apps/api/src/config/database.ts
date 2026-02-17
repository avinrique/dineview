import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function createTenantPrisma(restaurantId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ args, query }: { args: any; query: any }) {
        if (args.where) {
          args.where.restaurantId = restaurantId;
        }
        if (args.data && typeof args.data === 'object' && !args.data.restaurantId) {
          args.data.restaurantId = restaurantId;
        }
        return query(args);
      },
    },
  });
}
