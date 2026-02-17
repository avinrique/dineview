import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as qrService from './qr.service';
import { sendSuccess, sendCreated } from '../../utils/api-response';

export async function generate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const qr = await qrService.generateQr(req.user!.restaurantId!, req.params.tableId as string);
    sendCreated(res, qr);
  } catch (error) {
    next(error);
  }
}

export async function getForTable(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const qrCodes = await qrService.getQrForTable(req.user!.restaurantId!, req.params.tableId as string);
    sendSuccess(res, { data: qrCodes });
  } catch (error) {
    next(error);
  }
}

export async function regenerate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const qr = await qrService.regenerateQr(req.user!.restaurantId!, req.params.tableId as string);
    sendCreated(res, qr);
  } catch (error) {
    next(error);
  }
}
