import type { OrderStatus } from '../types/order.types';

export const ORDER_STATES: OrderStatus[] = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'SERVED',
  'PAID',
];

export const ORDER_STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['SERVED'],
  SERVED: ['PAID'],
  PAID: [],
  CANCELLED: [],
};

export const ORDER_STATE_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATE_COLORS: Record<OrderStatus, string> = {
  PLACED: '#3B82F6',
  ACCEPTED: '#8B5CF6',
  PREPARING: '#F59E0B',
  READY: '#10B981',
  SERVED: '#6366F1',
  PAID: '#6B7280',
  CANCELLED: '#EF4444',
};
