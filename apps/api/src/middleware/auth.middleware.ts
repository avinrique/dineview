import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { verifyAccessToken } from '../utils/crypto';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    restaurantId: string | null;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      restaurantId: payload.restaurantId,
    };

    next();
  } catch (error: any) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Invalid or expired token'));
    }
  }
}
