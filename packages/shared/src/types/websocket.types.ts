export interface ServerToClientEvents {
  'order:new': (data: OrderEvent) => void;
  'order:status_changed': (data: OrderStatusEvent) => void;
  'notification:waiter_call': (data: WaiterCallEvent) => void;
  'notification:bill_request': (data: BillRequestEvent) => void;
  'notification:acknowledged': (data: AcknowledgeEvent) => void;
  'menu:dish_availability': (data: DishAvailabilityEvent) => void;
  'session:started': (data: SessionEvent) => void;
  'session:closed': (data: SessionEvent) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join:restaurant': (restaurantId: string) => void;
  'join:table': (data: { restaurantId: string; tableId: string }) => void;
  'join:kitchen': (restaurantId: string) => void;
  'join:waiters': (restaurantId: string) => void;
  'notification:waiter_call': (data: { tableId: string; tableLabel: string; sessionId: string }) => void;
  'notification:bill_request': (data: { tableId: string; tableLabel: string; sessionId: string }) => void;
  'notification:acknowledge': (data: { notificationId: string }) => void;
}

export interface OrderEvent {
  orderId: string;
  orderNumber: string;
  status: string;
  tableId: string;
  tableLabel: string;
  items: { dishName: string; quantity: number }[];
  total: number;
  placedAt: string;
}

export interface OrderStatusEvent {
  orderId: string;
  orderNumber: string;
  fromStatus: string;
  toStatus: string;
  tableId: string;
  tableLabel: string;
  changedAt: string;
}

export interface WaiterCallEvent {
  notificationId: string;
  tableId: string;
  tableLabel: string;
  sessionId: string;
  timestamp: string;
}

export interface BillRequestEvent {
  notificationId: string;
  tableId: string;
  tableLabel: string;
  sessionId: string;
  timestamp: string;
}

export interface AcknowledgeEvent {
  notificationId: string;
  acknowledgedBy: string;
  timestamp: string;
}

export interface DishAvailabilityEvent {
  dishId: string;
  dishName: string;
  isAvailable: boolean;
}

export interface SessionEvent {
  sessionId: string;
  tableId: string;
  tableLabel: string;
}
