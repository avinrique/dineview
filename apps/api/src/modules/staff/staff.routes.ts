import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate';
import { createUserSchema } from '@dineview/shared';
import * as staffController from './staff.controller';

export const staffRouter = Router();

staffRouter.use(authenticate, requireTenant);

staffRouter.get('/', requirePermission('staff:read'), staffController.getAll);
staffRouter.post('/', requirePermission('staff:write'), validate(createUserSchema), staffController.create);
staffRouter.get('/:id', requirePermission('staff:read'), staffController.getById);
staffRouter.delete('/:id', requirePermission('staff:write'), staffController.remove);
