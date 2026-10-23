'use client';

import { useState } from 'react';
import { useGetRevenueQuery, useGetTopDishesQuery } from '@/store/api/admin-api';
import { useAdminCurrency } from '@/hooks/use-admin-currency';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { DishImage } from '@/components/customer/dish-image';
import { formatPrice, cn } from '@/lib/utils';

const RANGES = [7, 30, 90];

export default function AdminAnalyticsPage() {
  const currency = useAdminCurrency();
  const [days, setDays] = useState(30);
  const { data: revenue, isFetching: loadingRevenue } = useGetRevenueQuery(days);
  const { data: topDishes, isLoading: loadingDishes } = useGetTopDishesQuery(10);

  const dishes: any[] = topDishes?.data || [];
  const maxQty = Math.max(1, ...dishes.map((d) => d.totalQuantity || 0));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex rounded-lg bg-white p-1 shadow-sm ring-1 ring-gray-100">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={cn('rounded-md px-3 py-1 text-sm', days === r ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50')}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-3">
          <h2 className="text-lg font-semibold">Revenue per day</h2>
          <p className="mb-5 text-sm text-gray-500">Last {days} days, excluding cancelled orders</p>
          {loadingRevenue && !revenue ? (
            <div className="flex h-[200px] items-center justify-center"><LoadingSpinner /></div>
          ) : (
            <RevenueChart data={revenue?.data || []} currency={currency} />
          )}
        </div>

        <div className="card xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Top dishes</h2>
          {loadingDishes ? (
            <LoadingSpinner />
          ) : dishes.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No orders yet</p>
          ) : (
            <ol className="space-y-3">
              {dishes.map((item, idx) => (
                <li key={item.dish?.id || idx} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-semibold text-gray-400">{idx + 1}</span>
                  <DishImage src={item.dish?.imageUrl} alt={item.dish?.name || ''} className="h-9 w-9 shrink-0 rounded-lg" iconClassName="h-4 w-4" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-gray-900">{item.dish?.name || 'Removed dish'}</span>
                      <span className="whitespace-nowrap text-gray-500">{item.totalQuantity} sold</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#ea580c]" style={{ width: `${(item.totalQuantity / maxQty) * 100}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs text-gray-500">{formatPrice(item.totalRevenue, currency)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
