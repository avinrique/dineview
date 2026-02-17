import { Router } from 'express';
import { prisma, redis } from '../../config';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisOk = (await redis.ping()) === 'PONG';

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: redisOk ? 'connected' : 'disconnected',
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      },
    });
  }
});
