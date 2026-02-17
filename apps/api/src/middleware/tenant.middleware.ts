import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from '../utils/api-error';

export function requireTenant(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user?.restaurantId) {
    return next(ApiError.forbidden('No restaurant context'));
  }
  next();
}
