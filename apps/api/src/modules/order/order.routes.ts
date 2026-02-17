import { Router } from 'express';
import { authenticateSession } from '../../middleware/session.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '@dineview/shared';
import * as orderController from './order.controller';

export const orderRouter = Router();

// Customer routes (session auth)
orderRouter.post('/', authenticateSession, validate(createOrderSchema), orderController.createOrder);
orderRouter.get('/my', authenticateSession, orderController.getSessionOrders);

// Admin routes (JWT auth)
orderRouter.get('/admin', authenticate, requirePermission('order:read'), orderController.getAllOrders);
orderRouter.get('/admin/:orderId', authenticate, requirePermission('order:read'), orderController.getOrderById);
orderRouter.patch('/admin/:orderId/status', authenticate, requirePermission('order:update_status'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);
