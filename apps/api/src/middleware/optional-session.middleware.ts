import { Response, NextFunction } from 'express';
import { SessionRequest } from './session.middleware';
import { verifySessionToken } from '../utils/crypto';
import { prisma } from '../config';

export async function optionalSession(req: SessionRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifySessionToken(token);
      req.session = {
        sessionId: payload.sessionId,
        restaurantId: payload.restaurantId,
        tableId: payload.tableId,
        tableLabel: payload.tableLabel,
      };
    }

    // If no session, resolve restaurantId from query param or default to first restaurant
    if (!req.session?.restaurantId) {
      const restaurantId = req.query.restaurantId as string | undefined;
      let restaurant;

      if (restaurantId) {
        restaurant = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: { id: true },
        });
      } else {
        restaurant = await prisma.restaurant.findFirst({
          select: { id: true },
        });
      }

      if (restaurant) {
        req.session = {
          sessionId: '',
          restaurantId: restaurant.id,
          tableId: '',
          tableLabel: '',
        };
      }
    }

    next();
  } catch {
    // Token invalid — continue without session, try fallback
    const restaurant = await prisma.restaurant.findFirst({
      select: { id: true },
    });
    if (restaurant) {
      req.session = {
        sessionId: '',
        restaurantId: restaurant.id,
        tableId: '',
        tableLabel: '',
      };
    }
    next();
  }
}
