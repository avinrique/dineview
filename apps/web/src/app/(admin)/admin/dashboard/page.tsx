'use client';

import Link from 'next/link';
import { ChefHat, ClipboardList, QrCode, UtensilsCrossed } from 'lucide-react';
import { ORDER_STATE_LABELS } from '@dineview/shared';
import { useGetDashboardQuery, useGetRevenueQuery } from '@/store/api/admin-api';
import { useGetAdminOrdersQuery } from '@/store/api/order-api';
import { useAppSelector } from '@/store';
import { useAdminCurrency } from '@/hooks/use-admin-currency';
import { useNow } from '@/hooks/use-now';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { formatPrice, getRelativeTime, shortOrderNumber } from '@/lib/utils';

const statusVariants: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  PLACED: 'info',
  ACCEPTED: 'info',
  PREPARING: 'warning',
  READY: 'success',
  SERVED: 'success',
  PAID: 'default',
  CANCELLED: 'danger',
};

export default function DashboardPage() {
  const currency = useAdminCurrency();
  const now = useNow();
  const restaurantName = useAppSelector((s) => s.admin.user?.restaurantName);
  const { data, isLoading } = useGetDashboardQuery(undefined, { pollingInterval: 60000 });
  const { data: revenue } = useGetRevenueQuery(14);
  const { data: recent } = useGetAdminOrdersQuery({ limit: 6 });

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  const stats = data?.data;
  const cards = [
    { label: 'Orders today', value: stats?.todayOrders ?? 0 },
    { label: 'Revenue today', value: formatPrice(stats?.todayRevenue || 0, currency) },
    { label: 'In the kitchen', value: stats?.activeOrders ?? 0 },
    { label: 'Occupied tables', value: stats?.activeSessions ?? 0 },
  ];

  const shortcuts = [
    { href: '/admin/kitchen', label: 'Kitchen display', icon: ChefHat },
    { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/tables', label: 'Table QR codes', icon: QrCode },
    { href: '/admin/menu', label: 'Menu & 3D models', icon: UtensilsCrossed },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{restaurantName || 'Dashboard'}</h1>
        <p className="text-sm text-gray-500">Today at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-3">
          <h2 className="text-lg font-semibold">Revenue per day</h2>
          <p className="mb-5 text-sm text-gray-500">Last 14 days</p>
          <RevenueChart data={revenue?.data || []} currency={currency} height={180} />
        </div>

        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">All orders</Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {(recent?.data || []).map((order: any) => (
              <li key={order.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Table {order.session?.table?.label} · #{shortOrderNumber(order.orderNumber)}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {getRelativeTime(order.placedAt, now)} · {order.items?.map((i: any) => `${i.quantity}× ${i.dish?.name}`).join(', ')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold">{formatPrice(Number(order.total), currency)}</span>
                  <Badge variant={statusVariants[order.status] || 'default'}>{(ORDER_STATE_LABELS as any)[order.status]}</Badge>
                </div>
              </li>
            ))}
            {(recent?.data || []).length === 0 && <li className="py-8 text-center text-sm text-gray-500">No orders yet</li>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="card flex items-center gap-3 p-4 text-sm font-medium text-gray-700 hover:ring-1 hover:ring-brand-200">
            <Icon className="h-5 w-5 text-brand-500" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
