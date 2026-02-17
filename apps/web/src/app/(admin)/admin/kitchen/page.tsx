'use client';

import { useEffect, useRef } from 'react';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/order-api';
import { useSocket } from '@/hooks/use-socket';
import { useAppSelector } from '@/store';
import { formatTime, getRelativeTime } from '@/lib/utils';
import { ORDER_STATE_LABELS } from '@dineview/shared';

const kitchenStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'];

function getTimerColor(placedAt: string): string {
  const diffMin = (Date.now() - new Date(placedAt).getTime()) / 60000;
  if (diffMin < 10) return 'text-green-600';
  if (diffMin < 20) return 'text-yellow-600';
  return 'text-red-600';
}

export default function KitchenDisplayPage() {
  const { data, isLoading, refetch } = useGetAdminOrdersQuery({ limit: 100 });
  const [updateStatus] = useUpdateOrderStatusMutation();
  const restaurantId = useAppSelector((s) => s.admin.user?.restaurantId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { on, joinKitchen } = useSocket();

  useEffect(() => {
    if (restaurantId) joinKitchen(restaurantId);
  }, [restaurantId, joinKitchen]);

  useEffect(() => {
    const unsub = on('order:new', () => {
      refetch();
      // Play alert sound
      try { audioRef.current?.play(); } catch {}
    });
    const unsub2 = on('order:status_changed', () => refetch());
    return () => { unsub(); unsub2(); };
  }, [on, refetch]);

  const orders = (data?.data || []).filter((o: any) => kitchenStatuses.includes(o.status));

  const statusMap: Record<string, string> = {
    PLACED: 'ACCEPTED',
    ACCEPTED: 'PREPARING',
    PREPARING: 'READY',
    READY: 'SERVED',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==" type="audio/wav" />
      </audio>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kitchen Display</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{orders.length} active orders</span>
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order: any) => (
          <div
            key={order.id}
            className={`rounded-xl p-4 border-2 ${
              order.status === 'PLACED' ? 'border-blue-500 bg-blue-900/30' :
              order.status === 'ACCEPTED' ? 'border-purple-500 bg-purple-900/30' :
              order.status === 'PREPARING' ? 'border-yellow-500 bg-yellow-900/30' :
              'border-green-500 bg-green-900/30'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono font-bold text-lg">#{order.orderNumber}</span>
                <p className="text-sm text-gray-400">Table {order.session?.table?.label || '?'}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-mono font-bold ${getTimerColor(order.placedAt)}`}>
                  {getRelativeTime(order.placedAt)}
                </span>
                <p className="text-xs text-gray-500">{formatTime(order.placedAt)}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="bg-white/10 text-white font-bold px-2 py-0.5 rounded text-sm min-w-[28px] text-center">
                    {item.quantity}x
                  </span>
                  <span className="text-sm">{item.dish?.name}</span>
                </div>
              ))}
            </div>

            {order.specialNotes && (
              <p className="text-xs text-yellow-300 bg-yellow-900/30 p-2 rounded mb-3">
                Note: {order.specialNotes}
              </p>
            )}

            <button
              onClick={async () => {
                const next = statusMap[order.status];
                if (next) {
                  await updateStatus({ id: order.id, status: next }).unwrap();
                }
              }}
              className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                order.status === 'PLACED' ? 'bg-purple-600 hover:bg-purple-700' :
                order.status === 'ACCEPTED' ? 'bg-yellow-600 hover:bg-yellow-700' :
                order.status === 'PREPARING' ? 'bg-green-600 hover:bg-green-700' :
                'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              → {(ORDER_STATE_LABELS as any)[statusMap[order.status]] || 'Done'}
            </button>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-500">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <p className="text-xl">No active orders</p>
            <p className="text-sm mt-2">New orders will appear here automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}
