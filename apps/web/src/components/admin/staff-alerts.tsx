'use client';

import { useEffect, useState } from 'react';
import { BellRing, CreditCard, X } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { apiSlice } from '@/store/api/api-slice';
import { notify } from '@/store/slices/ui-slice';
import { useSocket } from '@/hooks/use-socket';
import { playChime } from '@/lib/chime';
import { shortOrderNumber } from '@/lib/utils';

interface Alert {
  id: string;
  kind: 'waiter_call' | 'bill_request';
  tableLabel: string;
  timestamp: string;
}

/**
 * Restaurant-wide live feed for staff: refreshes order/table data, chimes on
 * new orders, and shows waiter calls / bill requests until someone responds.
 */
export function StaffAlerts({ restaurantId, receivesTableRequests }: { restaurantId: string; receivesTableRequests: boolean }) {
  const dispatch = useAppDispatch();
  const { socket, on, joinRestaurant, joinWaiters } = useSocket();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    joinRestaurant(restaurantId);
    if (receivesTableRequests) joinWaiters(restaurantId);
  }, [restaurantId, receivesTableRequests, joinRestaurant, joinWaiters]);

  useEffect(() => {
    const addAlert = (kind: Alert['kind']) => (e: { notificationId: string; tableLabel: string; timestamp: string }) => {
      playChime();
      setAlerts((a) => [...a.filter((x) => x.id !== e.notificationId), { id: e.notificationId, kind, tableLabel: e.tableLabel, timestamp: e.timestamp }]);
    };
    const offs = [
      on('order:new', (e) => {
        playChime();
        dispatch(apiSlice.util.invalidateTags(['Orders', 'Tables', 'Analytics']));
        dispatch(notify('info', `New order #${shortOrderNumber(e.orderNumber)} from table ${e.tableLabel}`, 6000));
      }),
      on('order:status_changed', () => dispatch(apiSlice.util.invalidateTags(['Orders', 'Tables', 'Analytics']))),
      on('session:started', () => dispatch(apiSlice.util.invalidateTags(['Tables', 'Analytics']))),
      on('session:closed', () => dispatch(apiSlice.util.invalidateTags(['Tables', 'Orders', 'Analytics']))),
      on('notification:waiter_call', addAlert('waiter_call')),
      on('notification:bill_request', addAlert('bill_request')),
      on('notification:acknowledged', (e) => setAlerts((a) => a.filter((x) => x.id !== e.notificationId))),
    ];
    return () => offs.forEach((off) => off());
  }, [on, dispatch]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[55] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {alerts.map((alert) => {
        const Icon = alert.kind === 'bill_request' ? CreditCard : BellRing;
        return (
          <div key={alert.id} className="flex items-center gap-3 rounded-2xl bg-gray-900 p-4 text-white shadow-2xl animate-slide-up">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Table {alert.tableLabel}</p>
              <p className="text-sm text-white/70">{alert.kind === 'bill_request' ? 'Asked for the bill' : 'Is calling a waiter'}</p>
            </div>
            <button
              onClick={() => socket.emit('notification:acknowledge', { notificationId: alert.id })}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            >
              On my way
            </button>
            <button
              onClick={() => setAlerts((a) => a.filter((x) => x.id !== alert.id))}
              className="text-white/50 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
