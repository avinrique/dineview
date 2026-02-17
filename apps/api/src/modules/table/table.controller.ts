import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as tableService from './table.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tables = await tableService.getAllTables(req.user!.restaurantId!);
    sendSuccess(res, { data: tables });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const table = await tableService.createTable(req.user!.restaurantId!, req.body);
    sendCreated(res, table);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const table = await tableService.getTableById(req.user!.restaurantId!, req.params.id as string);
    sendSuccess(res, { data: table });
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const table = await tableService.updateTable(req.user!.restaurantId!, req.params.id as string, req.body);
    sendSuccess(res, { data: table, message: 'Table updated' });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await tableService.deleteTable(req.user!.restaurantId!, req.params.id as string);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}
