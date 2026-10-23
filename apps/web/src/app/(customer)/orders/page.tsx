'use client';

import Link from 'next/link';
import { Check, ReceiptText, ChefHat } from 'lucide-react';
import { ORDER_STATE_LABELS } from '@dineview/shared';
import { useGetSessionOrdersQuery } from '@/store/api/order-api';
import { useSession } from '@/hooks/use-session';
import { formatPrice, getRelativeTime, shortOrderNumber, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/customer/page-header';

const STEPS = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] as const;
const STEP_LABELS: Record<string, string> = {
  PLACED: 'Sent',
  ACCEPTED: 'Accepted',
  PREPARING: 'Cooking',
  READY: 'Ready',
  SERVED: 'Served',
};

const statusVariants: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  PLACED: 'info',
  ACCEPTED: 'info',
  PREPARING: 'warning',
  READY: 'success',
  SERVED: 'success',
  PAID: 'default',
  CANCELLED: 'danger',
};

function Progress({ status }: { status: string }) {
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);
  const reached = status === 'PAID' ? STEPS.length - 1 : current;
  return (
    <div className="mb-4 flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= reached;
        return (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={cn('h-0.5 flex-1', i === 0 ? 'opacity-0' : done ? 'bg-brand-500' : 'bg-gray-200')} />
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white transition-colors',
                  done ? 'bg-brand-500' : 'bg-gray-200',
                  i === current && status !== 'SERVED' && 'ring-4 ring-brand-100',
                )}
              >
                {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </div>
              <div
                className={cn('h-0.5 flex-1', i === STEPS.length - 1 ? 'opacity-0' : i < reached ? 'bg-brand-500' : 'bg-gray-200')}
              />
            </div>
            <span className={cn('mt-1 text-[10px] font-medium', done ? 'text-gray-900' : 'text-gray-400')}>
              {STEP_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { currency } = useSession();
  // Socket pushes refresh this instantly; polling is a fallback for flaky networks.
  const { data, isLoading } = useGetSessionOrdersQuery(undefined, { pollingInterval: 20000, refetchOnFocus: true });

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const orders = data?.data || [];
  const tableTotal = orders
    .filter((o: any) => o.status !== 'CANCELLED')
    .reduce((sum: number, o: any) => sum + Number(o.total), 0);

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-24">
      <PageHeader
        title="My orders"
        subtitle={orders.length > 0 ? `Table total so far ${formatPrice(tableTotal, currency)}` : undefined}
      />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white ring-1 ring-gray-100">
              <ReceiptText className="h-8 w-8 text-gray-300" />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">No orders yet</h2>
            <p className="mb-5 text-gray-500">Orders you place will show up here with live updates.</p>
            <Link href="/menu" className="inline-block rounded-full bg-gray-900 px-6 py-3 font-semibold text-white">Browse the menu</Link>
          </div>
        ) : (
          orders.map((order: any) => (
            <div key={order.id} className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] ring-1 ring-gray-100">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900">Order #{shortOrderNumber(order.orderNumber)}</span>
                  <span className="ml-2 text-sm text-gray-500">{getRelativeTime(order.placedAt)}</span>
                </div>
                <Badge variant={statusVariants[order.status] || 'default'}>
                  {(ORDER_STATE_LABELS as any)[order.status] || order.status}
                </Badge>
              </div>

              {order.status === 'CANCELLED' ? (
                <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">This order was cancelled. Please ask a waiter.</p>
              ) : (
                <Progress status={order.status} />
              )}

              {order.status === 'PREPARING' && (
                <p className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
                  <ChefHat className="h-4 w-4" /> The kitchen is preparing your food
                </p>
              )}

              <div className="space-y-1.5">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      <span className="font-medium text-gray-900">{item.quantity}×</span> {item.dish?.name}
                    </span>
                    <span className="text-gray-500">{formatPrice(Number(item.subtotal), currency)}</span>
                  </div>
                ))}
              </div>

              {order.specialNotes && <p className="mt-2 text-xs italic text-gray-500">“{order.specialNotes}”</p>}

              <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{formatPrice(Number(order.total), currency)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
