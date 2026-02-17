import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import { env } from './config/env';
import { logger } from './config/logger';
import { globalLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error-handler';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  // Request ID
  app.use((req, _res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID();
    next();
  });

  // Logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: Date.now() - start,
        requestId: req.headers['x-request-id'],
      });
    });
    next();
  });

  // Security
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use(globalLimiter);

  // Routes
  app.use('/api/v1', apiRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      code: 'NOT_FOUND',
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
