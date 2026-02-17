import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate';
import { updateArAssetSchema } from '@dineview/shared';
import * as assetController from './asset.controller';

export const assetRouter = Router();

assetRouter.use(authenticate, requireTenant);

assetRouter.post('/upload', requirePermission('asset:write'), assetController.getUploadUrl);
assetRouter.put('/:id', requirePermission('asset:write'), validate(updateArAssetSchema), assetController.update);
assetRouter.post('/:id/link/:dishId', requirePermission('asset:write'), assetController.linkToDish);
assetRouter.get('/:id', requirePermission('asset:read'), assetController.getById);
