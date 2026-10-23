'use client';

import { useState } from 'react';
import { ChefHat, Clock, X } from 'lucide-react';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/order-api';
import { useAppDispatch } from '@/store';
import { notify } from '@/store/slices/ui-slice';
import { useNow } from '@/hooks/use-now';
import { useSocket } from '@/hooks/use-socket';
import { formatTime, shortOrderNumber, cn } from '@/lib/utils';

const COLUMNS = [
  { status: 'PLACED', title: 'New', next: 'ACCEPTED', action: 'Accept', tone: 'border-sky-500', button: 'bg-sky-600 hover:bg-sky-500' },
  { status: 'ACCEPTED', title: 'Accepted', next: 'PREPARING', action: 'Start cooking', tone: 'border-violet-500', button: 'bg-violet-600 hover:bg-violet-500' },
  { status: 'PREPARING', title: 'Cooking', next: 'READY', action: 'Mark ready', tone: 'border-amber-500', button: 'bg-amber-600 hover:bg-amber-500' },
  { status: 'READY', title: 'Ready to serve', next: 'SERVED', action: 'Served', tone: 'border-emerald-500', button: 'bg-emerald-600 hover:bg-emerald-500' },
] as const;

function elapsedMinutes(placedAt: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(placedAt).getTime()) / 60000));
}

function timerColor(min: number) {
  if (min < 10) return 'text-emerald-400';
  if (min < 20) return 'text-amber-400';
  return 'text-red-400';
}

export default function KitchenDisplayPage() {
  const dispatch = useAppDispatch();
  const now = useNow(15_000);
  const { connected } = useSocket();
  // Live updates arrive over the socket (see StaffAlerts); polling is a safety net.
  const { data, isLoading } = useGetAdminOrdersQuery(
    { status: 'PLACED,ACCEPTED,PREPARING,READY', limit: 100 },
    { pollingInterval: 30000 },
  );
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [busy, setBusy] = useState<string | null>(null);

  const orders: any[] = [...(data?.data || [])].sort(
    (a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime(),
  );

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

  return (
    <div className="-m-4 min-h-[calc(100vh-3.5rem)] bg-gray-950 p-4 text-white md:-m-6 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="h-7 w-7 text-brand-400" />
          <h1 className="text-2xl font-bold">Kitchen display</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{orders.length} active</span>
          <span className={cn('h-2.5 w-2.5 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600')} />
          <span className="hidden sm:inline">{connected ? 'Live' : 'Reconnecting…'}</span>
        </div>
      </div>

      {isLoading ? (
        <p className="py-20 text-center text-gray-500">Loading orders…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <section key={col.status} className="flex min-w-0 flex-col rounded-2xl bg-gray-900/60 p-3">
                <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  {col.title}
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{colOrders.length}</span>
                </h2>
                <div className="space-y-3">
                  {colOrders.length === 0 && <p className="px-1 py-6 text-center text-sm text-gray-600">Nothing here</p>}
                  {colOrders.map((order) => {
                    const min = elapsedMinutes(order.placedAt, now);
                    return (
                      <article key={order.id} className={cn('rounded-xl border-l-4 bg-gray-800 p-4 animate-slide-up', col.tone)}>
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-lg font-bold">Table {order.session?.table?.label || '?'}</p>
                            <p className="font-mono text-xs text-gray-400">#{shortOrderNumber(order.orderNumber)} · {formatTime(order.placedAt)}</p>
                          </div>
                          <span className={cn('flex items-center gap-1 font-mono text-sm font-bold', timerColor(min))}>
                            <Clock className="h-3.5 w-3.5" />
                            {min}m
                          </span>
                        </div>

                        <ul className="mb-3 space-y-1.5">
                          {order.items?.map((item: any) => (
                            <li key={item.id} className="flex gap-2 text-sm">
                              <span className="min-w-[28px] rounded bg-white/10 px-1.5 text-center font-bold">{item.quantity}×</span>
                              <span>
                                {item.dish?.name}
                                {item.specialNotes && <span className="block text-xs text-amber-300">{item.specialNotes}</span>}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {order.specialNotes && (
                          <p className="mb-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-200">Note: {order.specialNotes}</p>
                        )}

                        <div className="flex gap-2">
                          <button
                            disabled={busy === order.id}
                            onClick={() => move(order.id, col.next)}
                            className={cn('flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50', col.button)}
                          >
                            {col.action}
                          </button>
                          {col.status === 'PLACED' && (
                            <button
                              disabled={busy === order.id}
                              onClick={() => move(order.id, 'CANCELLED')}
                              className="rounded-lg bg-gray-700 px-3 text-gray-300 hover:bg-gray-600"
                              aria-label="Cancel order"
                              title="Cancel order"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
