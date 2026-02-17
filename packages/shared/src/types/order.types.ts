export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  specialNotes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  placedAt: Date;
  acceptedAt: Date | null;
  preparingAt: Date | null;
  readyAt: Date | null;
  servedAt: Date | null;
  paidAt: Date | null;
  sessionId: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  statusLogs?: OrderStatusLog[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialNotes: string | null;
  orderId: string;
  dishId: string;
  dish?: import('./menu.types').Dish;
}

export interface OrderStatusLog {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedAt: Date;
  note: string | null;
  orderId: string;
  changedById: string | null;
}

export interface CreateOrderRequest {
  items: { dishId: string; quantity: number; specialNotes?: string }[];
  specialNotes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}
