import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { hasPermission, type Permission } from '@dineview/shared';
import type { UserRole } from '@dineview/shared';
import { ApiError } from '../utils/api-error';

export function requirePermission(...permissions: Permission[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    const userRole = req.user.role as UserRole;
    const hasAll = permissions.every((p) => hasPermission(userRole, p));

    if (!hasAll) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role'));
    }

    next();
  };
}
