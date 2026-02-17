import { Response, NextFunction } from 'express';
import { SessionRequest } from '../../middleware/session.middleware';
import * as menuService from './menu.service';
import { sendSuccess } from '../../utils/api-response';

export async function getMenu(req: SessionRequest, res: Response, next: NextFunction) {
  try {
    const menu = await menuService.getFullMenu(req.session!.restaurantId);
    sendSuccess(res, { data: menu });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryBySlug(req: SessionRequest, res: Response, next: NextFunction) {
  try {
    const category = await menuService.getCategoryBySlug(
      req.session!.restaurantId,
      req.params.slug as string,
    );
    sendSuccess(res, { data: category });
  } catch (error) {
    next(error);
  }
}

export async function getDishDetail(req: SessionRequest, res: Response, next: NextFunction) {
  try {
    const dish = await menuService.getDishDetail(
      req.session!.restaurantId,
      req.params.dishId as string,
    );
    sendSuccess(res, { data: dish });
  } catch (error) {
    next(error);
  }
}
