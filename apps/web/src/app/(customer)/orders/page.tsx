'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetSessionOrdersQuery } from '@/store/api/order-api';
import { useSocket } from '@/hooks/use-socket';
import { useSession } from '@/hooks/use-session';
import { formatPrice, formatTime, getRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ORDER_STATE_LABELS } from '@dineview/shared';
import Link from 'next/link';

const statusVariants: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  PLACED: 'info',
  ACCEPTED: 'info',
  PREPARING: 'warning',
  READY: 'success',
  SERVED: 'success',
  PAID: 'default',
  CANCELLED: 'danger',
};

export default function OrdersPage() {
  const router = useRouter();
  const { currency, restaurantId, tableId } = useSession();
  const { data, isLoading, refetch } = useGetSessionOrdersQuery(undefined, {
    pollingInterval: 30000,
  });
  const { on, joinTable } = useSocket();

  useEffect(() => {
    if (restaurantId && tableId) {
      joinTable(restaurantId, tableId);
    }
  }, [restaurantId, tableId, joinTable]);

  useEffect(() => {
    const unsub = on('order:status_changed', () => {
      refetch();
    });
    return unsub;
  }, [on, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const orders = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/menu')} className="text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Your Orders</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-4">Your orders will appear here</p>
            <Link href="/menu" className="btn-primary">Browse Menu</Link>
          </div>
        ) : (
          orders.map((order: any) => (
            <div key={order.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {getRelativeTime(order.placedAt)}
                  </span>
                </div>
                <Badge variant={statusVariants[order.status] || 'default'}>
                  {(ORDER_STATE_LABELS as any)[order.status] || order.status}
                </Badge>
              </div>

              {/* Status timeline */}
              {order.statusLogs?.length > 0 && (
                <div className="flex gap-1 mb-3">
                  {['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].map((s) => {
                    const reached = order.statusLogs.some((log: any) => log.toStatus === s);
                    return (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          reached ? 'bg-brand-500' : 'bg-gray-200'
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Items */}
              <div className="space-y-1">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {item.dish?.name}
                    </span>
                    <span className="text-gray-500">
                      {formatPrice(Number(item.subtotal), currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-brand-600">
                  {formatPrice(Number(order.total), currency)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-lg mx-auto flex">
          <Link href="/menu" className="flex-1 py-3 text-center text-sm text-gray-600 hover:text-brand-600">
            Menu
          </Link>
          <Link href="/orders" className="flex-1 py-3 text-center text-sm font-semibold text-brand-600">
            Orders
          </Link>
          <Link href="/actions" className="flex-1 py-3 text-center text-sm text-gray-600 hover:text-brand-600">
            Actions
          </Link>
        </div>
      </div>
    </div>
  );
}
