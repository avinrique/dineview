import { Request, Response, NextFunction } from 'express';
import * as sessionService from './session.service';
import { sendSuccess } from '../../utils/api-response';

export async function scanQr(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await sessionService.handleQrScan(req.params.qrToken as string);
    sendSuccess(res, { data: result, message: 'Session created' });
  } catch (error) {
    next(error);
  }
}
