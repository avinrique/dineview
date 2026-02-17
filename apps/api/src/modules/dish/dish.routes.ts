import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate';
import { createDishSchema, updateDishSchema, toggleAvailabilitySchema } from '@dineview/shared';
import * as dishController from './dish.controller';

export const dishRouter = Router();

dishRouter.use(authenticate, requireTenant);

dishRouter.get('/', requirePermission('dish:read'), dishController.getAll);
dishRouter.post('/', requirePermission('dish:write'), validate(createDishSchema), dishController.create);
dishRouter.get('/:id', requirePermission('dish:read'), dishController.getById);
dishRouter.patch('/:id', requirePermission('dish:write'), validate(updateDishSchema), dishController.update);
dishRouter.delete('/:id', requirePermission('dish:write'), dishController.remove);
dishRouter.patch('/:id/availability', requirePermission('dish:toggle_availability'), validate(toggleAvailabilitySchema), dishController.toggleAvailability);
