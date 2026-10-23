import express, { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { sendCreated } from '../../utils/api-response';
import { saveUpload, MAX_UPLOAD_BYTES } from './upload.service';

export const uploadRouter = Router();

uploadRouter.use(authenticate, requireTenant);

// POST /admin/uploads?filename=dish.jpg  (raw file bytes as the body)
uploadRouter.post(
  '/',
  requirePermission('dish:write'),
  express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const fileName = String(req.query.filename || '');
      const result = await saveUpload(req.user!.restaurantId!, fileName, req.body);
      sendCreated(res, result, 'File uploaded');
    } catch (error) {
      next(error);
    }
  },
);
