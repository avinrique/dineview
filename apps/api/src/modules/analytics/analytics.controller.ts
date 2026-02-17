import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as analyticsService from './analytics.service';
import { sendSuccess } from '../../utils/api-response';

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getDashboardStats(req.user!.restaurantId!);
    sendSuccess(res, { data });
  } catch (error) { next(error); }
}

export async function getRevenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getRevenueOverTime(req.user!.restaurantId!, days);
    sendSuccess(res, { data });
  } catch (error) { next(error); }
}

export async function getTopDishes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await analyticsService.getTopDishes(req.user!.restaurantId!, limit);
    sendSuccess(res, { data });
  } catch (error) { next(error); }
}
