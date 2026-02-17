import { Response, NextFunction } from 'express';
import { SessionRequest } from '../../middleware/session.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as orderService from './order.service';
import { sendSuccess, sendCreated } from '../../utils/api-response';
import { getPagination, getPaginationMeta } from '../../utils/pagination';

export async function createOrder(req: SessionRequest, res: Response, next: NextFunction) {
  try {
    const order = await orderService.createOrder(req.session!, req.body);
    sendCreated(res, order, 'Order placed successfully');
  } catch (error) {
    next(error);
  }
}

export async function getSessionOrders(req: SessionRequest, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.getOrdersBySession(req.session!.sessionId);
    sendSuccess(res, { data: orders });
  } catch (error) {
    next(error);
  }
}

export async function getAllOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req);
    const status = req.query.status as string | undefined;
    const { orders, total } = await orderService.getAllOrders(
      req.user!.restaurantId!,
      { skip, limit, status },
    );
    sendSuccess(res, {
      data: orders,
      meta: getPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await orderService.getOrderById(
      req.user!.restaurantId!,
      req.params.orderId as string,
    );
    sendSuccess(res, { data: order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await orderService.updateOrderStatus(
      req.user!.restaurantId!,
      req.params.orderId as string,
      req.body,
      req.user!.id,
    );
    sendSuccess(res, { data: order, message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
}
