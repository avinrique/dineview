'use client';

import { useGetDashboardQuery, useGetTopDishesQuery } from '@/store/api/admin-api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatPrice } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const { data: dashboard, isLoading: loadingDashboard } = useGetDashboardQuery(undefined);
  const { data: topDishes, isLoading: loadingDishes } = useGetTopDishesQuery(10);

  if (loadingDashboard) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  const dishes = topDishes?.data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Dishes */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Selling Dishes</h2>
          {loadingDishes ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {dishes.map((item: any, idx: number) => (
                <div key={item.dish?.id || idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-300 w-6">#{idx + 1}</span>
                    <span className="font-medium text-gray-900">{item.dish?.name || 'Unknown'}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.totalQuantity} sold</p>
                    <p className="text-sm text-gray-500">{formatPrice(item.totalRevenue)}</p>
                  </div>
                </div>
              ))}
              {dishes.length === 0 && (
                <p className="text-gray-500 text-center py-4">No order data yet</p>
              )}
            </div>
          )}
        </div>

        {/* Revenue placeholder */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Revenue Over Time</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Chart visualization placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
