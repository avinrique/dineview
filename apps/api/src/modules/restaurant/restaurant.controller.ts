import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config';
import { ApiError } from '../../utils/api-error';
import { sendSuccess } from '../../utils/api-response';

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.user!.restaurantId! },
    });
    if (!restaurant) throw ApiError.notFound('Restaurant not found');
    sendSuccess(res, { data: restaurant });
  } catch (error) { next(error); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id: req.user!.restaurantId! },
      data: req.body,
    });
    sendSuccess(res, { data: restaurant, message: 'Restaurant updated' });
  } catch (error) { next(error); }
}
