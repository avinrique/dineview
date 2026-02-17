import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as assetService from './asset.service';
import { sendSuccess, sendCreated } from '../../utils/api-response';

export async function getUploadUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await assetService.getUploadPresigned(
      req.user!.restaurantId!,
      req.body.fileName,
      req.body.contentType,
    );
    sendCreated(res, result);
  } catch (error) { next(error); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const asset = await assetService.updateAsset(req.user!.restaurantId!, req.params.id as string, req.body);
    sendSuccess(res, { data: asset, message: 'Asset updated' });
  } catch (error) { next(error); }
}

export async function linkToDish(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const asset = await assetService.linkAssetToDish(
      req.user!.restaurantId!,
      req.params.id as string,
      req.params.dishId as string,
    );
    sendSuccess(res, { data: asset, message: 'Asset linked to dish' });
  } catch (error) { next(error); }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const asset = await assetService.getAssetById(req.user!.restaurantId!, req.params.id as string);
    sendSuccess(res, { data: asset });
  } catch (error) { next(error); }
}
