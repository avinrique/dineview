import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as categoryService from './category.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getAllCategories(req.user!.restaurantId!);
    sendSuccess(res, { data: categories });
  } catch (error) { next(error); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.createCategory(req.user!.restaurantId!, req.body);
    sendCreated(res, category);
  } catch (error) { next(error); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.getCategoryById(req.user!.restaurantId!, req.params.id as string);
    sendSuccess(res, { data: category });
  } catch (error) { next(error); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.updateCategory(req.user!.restaurantId!, req.params.id as string, req.body);
    sendSuccess(res, { data: category, message: 'Category updated' });
  } catch (error) { next(error); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(req.user!.restaurantId!, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function reorder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await categoryService.reorderCategories(req.user!.restaurantId!, req.body.categories);
    sendSuccess(res, { message: 'Categories reordered' });
  } catch (error) { next(error); }
}
