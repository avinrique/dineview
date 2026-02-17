'use client';

import { useState, useEffect } from 'react';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/order-api';
import { useSocket } from '@/hooks/use-socket';
import { useAppSelector } from '@/store';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatPrice, getRelativeTime } from '@/lib/utils';
import { ORDER_STATE_LABELS, ORDER_STATE_TRANSITIONS } from '@dineview/shared';

const statusColumns = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'];
const statusColors: Record<string, string> = {
  PLACED: 'border-blue-300 bg-blue-50',
  ACCEPTED: 'border-purple-300 bg-purple-50',
  PREPARING: 'border-yellow-300 bg-yellow-50',
  READY: 'border-green-300 bg-green-50',
  SERVED: 'border-indigo-300 bg-indigo-50',
};

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data, isLoading, refetch } = useGetAdminOrdersQuery({ status: statusFilter, limit: 50 });
  const [updateStatus] = useUpdateOrderStatusMutation();
  const restaurantId = useAppSelector((s) => s.admin.user?.restaurantId);
  const { on, joinRestaurant } = useSocket();

  useEffect(() => {
    if (restaurantId) joinRestaurant(restaurantId);
  }, [restaurantId, joinRestaurant]);

  useEffect(() => {
    const unsub1 = on('order:new', () => refetch());
    const unsub2 = on('order:status_changed', () => refetch());
    return () => { unsub1(); unsub2(); };
  }, [on, refetch]);

  async function handleAdvanceStatus(orderId: string, currentStatus: string) {
    const transitions = (ORDER_STATE_TRANSITIONS as any)[currentStatus] || [];
    const nextStatus = transitions[0];
    if (!nextStatus) return;
    try {
      await updateStatus({ id: orderId, status: nextStatus }).unwrap();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  const orders = data?.data || [];

  // Group orders by status for kanban view
  const grouped: Record<string, any[]> = {};
  for (const col of statusColumns) grouped[col] = [];
  for (const order of orders) {
    if (grouped[order.status]) grouped[order.status].push(order);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter(undefined)}
            className={`px-3 py-1 rounded-full text-sm ${!statusFilter ? 'bg-brand-500 text-white' : 'bg-gray-100'}`}
          >
            All
          </button>
          {statusColumns.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-sm ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-gray-100'}`}
            >
              {(ORDER_STATE_LABELS as any)[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-5 gap-4 overflow-x-auto">
        {statusColumns.map((col) => (
          <div key={col} className="min-w-[220px]">
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
              {(ORDER_STATE_LABELS as any)[col]}
              <span className="bg-gray-200 text-gray-600 text-xs px-1.5 rounded-full">
                {grouped[col].length}
              </span>
            </h3>
            <div className="space-y-3">
              {grouped[col].map((order: any) => (
                <div key={order.id} className={`card p-3 border-l-4 ${statusColors[col]}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm font-bold">#{order.orderNumber}</span>
                    <span className="text-xs text-gray-500">{getRelativeTime(order.placedAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Table {order.session?.table?.label || '?'}
                  </p>
                  <div className="space-y-1 mb-3">
                    {order.items?.map((item: any) => (
                      <p key={item.id} className="text-xs text-gray-700">
                        {item.quantity}x {item.dish?.name}
                      </p>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">{formatPrice(Number(order.total))}</span>
                    {(ORDER_STATE_TRANSITIONS as any)[col]?.[0] && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, col)}
                        className="text-xs bg-brand-500 text-white px-2 py-1 rounded hover:bg-brand-600"
                      >
                        → {(ORDER_STATE_LABELS as any)[(ORDER_STATE_TRANSITIONS as any)[col][0]]}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
