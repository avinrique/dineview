import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { verifySessionToken } from '../utils/crypto';

export interface SessionRequest extends Request {
  session?: {
    sessionId: string;
    restaurantId: string;
    tableId: string;
    tableLabel: string;
  };
}

export function authenticateSession(req: SessionRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing session token');
    }

    const token = authHeader.substring(7);
    const payload = verifySessionToken(token);

    req.session = {
      sessionId: payload.sessionId,
      restaurantId: payload.restaurantId,
      tableId: payload.tableId,
      tableLabel: payload.tableLabel,
    };

    next();
  } catch (error: any) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Invalid or expired session'));
    }
  }
}
