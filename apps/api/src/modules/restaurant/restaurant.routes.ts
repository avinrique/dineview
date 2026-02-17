import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate';
import { updateRestaurantSchema } from '@dineview/shared';
import * as restaurantController from './restaurant.controller';

export const restaurantRouter = Router();

restaurantRouter.use(authenticate, requireTenant);

restaurantRouter.get('/', requirePermission('restaurant:read'), restaurantController.get);
restaurantRouter.patch('/', requirePermission('restaurant:write'), validate(updateRestaurantSchema), restaurantController.update);
