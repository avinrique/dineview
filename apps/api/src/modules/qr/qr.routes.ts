import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import * as qrController from './qr.controller';

export const qrRouter = Router();

qrRouter.use(authenticate, requireTenant);

qrRouter.post('/tables/:tableId/generate', requirePermission('qr:write'), qrController.generate);
qrRouter.get('/tables/:tableId', requirePermission('qr:read'), qrController.getForTable);
qrRouter.post('/tables/:tableId/regenerate', requirePermission('qr:write'), qrController.regenerate);
