'use client';

import { useState } from 'react';
import { ORDER_STATE_LABELS, ORDER_STATE_TRANSITIONS } from '@dineview/shared';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/order-api';
import { useAppDispatch } from '@/store';
import { notify } from '@/store/slices/ui-slice';
import { useAdminCurrency } from '@/hooks/use-admin-currency';
import { useNow } from '@/hooks/use-now';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatPrice, getRelativeTime, shortOrderNumber, cn } from '@/lib/utils';

const COLUMNS = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] as const;
const colStyles: Record<string, string> = {
  PLACED: 'border-sky-400',
  ACCEPTED: 'border-violet-400',
  PREPARING: 'border-amber-400',
  READY: 'border-emerald-400',
  SERVED: 'border-indigo-400',
};
const nextLabel: Record<string, string> = {
  ACCEPTED: 'Accept',
  PREPARING: 'Start cooking',
  READY: 'Mark ready',
  SERVED: 'Served',
  PAID: 'Mark paid',
};

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch();
  const currency = useAdminCurrency();
  const now = useNow();
  const { data, isLoading } = useGetAdminOrdersQuery(
    { status: COLUMNS.join(','), limit: 100 },
    { pollingInterval: 30000 },
  );
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [busy, setBusy] = useState<string | null>(null);

  async function move(orderId: string, status: string) {
    setBusy(orderId);
    try {
      await updateStatus({ id: orderId, status }).unwrap();
    } catch (err: any) {
      dispatch(notify('error', err?.data?.message || 'Could not update the order'));
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  const orders: any[] = data?.data || [];
  const grouped: Record<string, any[]> = Object.fromEntries(COLUMNS.map((c) => [c, []]));
  for (const order of orders) grouped[order.status]?.push(order);
  for (const col of COLUMNS) grouped[col]!.sort((a, b) => +new Date(a.placedAt) - +new Date(b.placedAt));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">{orders.length} open</p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
        <div className="grid min-w-[1100px] grid-cols-5 gap-4">
          {COLUMNS.map((col) => (
            <div key={col}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                {(ORDER_STATE_LABELS as any)[col]}
                <span className="rounded-full bg-gray-200 px-1.5 text-xs text-gray-600">{grouped[col]!.length}</span>
              </h3>
              <div className="space-y-3">
                {grouped[col]!.map((order) => {
                  const next = (ORDER_STATE_TRANSITIONS as any)[col]?.find((s: string) => s !== 'CANCELLED');
                  return (
                    <div key={order.id} className={cn('rounded-xl border-l-4 bg-white p-3 shadow-sm', colStyles[col])}>
                      <div className="mb-1 flex items-start justify-between">
                        <span className="font-semibold">Table {order.session?.table?.label || '?'}</span>
                        <span className="text-xs text-gray-500">{getRelativeTime(order.placedAt, now)}</span>
                      </div>
                      <p className="mb-2 font-mono text-xs text-gray-400">#{shortOrderNumber(order.orderNumber)}</p>
                      <div className="mb-3 space-y-0.5">
                        {order.items?.map((item: any) => (
                          <p key={item.id} className="text-sm text-gray-700">
                            {item.quantity}× {item.dish?.name}
                          </p>
                        ))}
                      </div>
                      {order.specialNotes && <p className="mb-2 text-xs italic text-amber-700">“{order.specialNotes}”</p>}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold">{formatPrice(Number(order.total), currency)}</span>
                        <div className="flex gap-1.5">
                          {col === 'PLACED' && (
                            <button
                              disabled={busy === order.id}
                              onClick={() => move(order.id, 'CANCELLED')}
                              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          )}
                          {next && (
                            <button
                              disabled={busy === order.id}
                              onClick={() => move(order.id, next)}
                              className="rounded bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                            >
                              {nextLabel[next] ?? next}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {grouped[col]!.length === 0 && (
                  <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400">No orders</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
