import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate';
import { createTableSchema, updateTableSchema } from '@dineview/shared';
import * as tableController from './table.controller';

export const tableRouter = Router();

tableRouter.use(authenticate, requireTenant);

tableRouter.get('/', requirePermission('table:read'), tableController.getAll);
tableRouter.post('/', requirePermission('table:write'), validate(createTableSchema), tableController.create);
tableRouter.get('/:id', requirePermission('table:read'), tableController.getById);
tableRouter.patch('/:id', requirePermission('table:write'), validate(updateTableSchema), tableController.update);
tableRouter.delete('/:id', requirePermission('table:write'), tableController.remove);
