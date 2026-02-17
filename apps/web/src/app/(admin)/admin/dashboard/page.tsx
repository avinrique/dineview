'use client';

import { useGetDashboardQuery } from '@/store/api/admin-api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatPrice } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardQuery(undefined, { pollingInterval: 30000 });

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  const stats = data?.data;

  const cards = [
    { label: "Today's Orders", value: stats?.todayOrders || 0, icon: '📋', color: 'bg-blue-50 text-blue-700' },
    { label: "Today's Revenue", value: formatPrice(stats?.todayRevenue || 0), icon: '💰', color: 'bg-green-50 text-green-700' },
    { label: 'Active Sessions', value: stats?.activeSessions || 0, icon: '🪑', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Available Dishes', value: stats?.totalDishes || 0, icon: '🍽️', color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`card ${card.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="/admin/orders" className="btn-secondary text-center text-sm">View Orders</a>
          <a href="/admin/kitchen" className="btn-secondary text-center text-sm">Kitchen Display</a>
          <a href="/admin/menu" className="btn-secondary text-center text-sm">Manage Menu</a>
          <a href="/admin/tables" className="btn-secondary text-center text-sm">Manage Tables</a>
        </div>
      </div>
    </div>
  );
}
