import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import * as analyticsController from './analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate, requireTenant, requirePermission('analytics:read'));

analyticsRouter.get('/dashboard', analyticsController.getDashboard);
analyticsRouter.get('/revenue', analyticsController.getRevenue);
analyticsRouter.get('/top-dishes', analyticsController.getTopDishes);
