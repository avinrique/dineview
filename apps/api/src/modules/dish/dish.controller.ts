import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as dishService from './dish.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response';
import { getPagination, getPaginationMeta } from '../../utils/pagination';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req);
    const search = req.query.search as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const { dishes, total } = await dishService.getAllDishes(req.user!.restaurantId!, { skip, limit, search, categoryId });
    sendSuccess(res, { data: dishes, meta: getPaginationMeta(total, page, limit) });
  } catch (error) { next(error); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dish = await dishService.createDish(req.user!.restaurantId!, req.body);
    sendCreated(res, dish);
  } catch (error) { next(error); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dish = await dishService.getDishById(req.user!.restaurantId!, req.params.id as string);
    sendSuccess(res, { data: dish });
  } catch (error) { next(error); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dish = await dishService.updateDish(req.user!.restaurantId!, req.params.id as string, req.body);
    sendSuccess(res, { data: dish, message: 'Dish updated' });
  } catch (error) { next(error); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await dishService.deleteDish(req.user!.restaurantId!, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function toggleAvailability(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dish = await dishService.toggleDishAvailability(req.user!.restaurantId!, req.params.id as string, req.body.isAvailable);
    sendSuccess(res, { data: dish, message: 'Availability updated' });
  } catch (error) { next(error); }
}
