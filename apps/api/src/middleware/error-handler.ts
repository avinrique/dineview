import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error';
import { logger } from '../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, path: req.path, method: req.method }, 'Request error');

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // body-parser errors (oversized upload, malformed JSON) carry their own status
  const status = (err as any).status ?? (err as any).statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return res.status(status).json({
      success: false,
      message: status === 413 ? 'File too large' : err.message,
      code: (err as any).type || 'BAD_REQUEST',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
