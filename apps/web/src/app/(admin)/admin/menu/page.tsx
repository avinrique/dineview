'use client';

import { useState } from 'react';
import { useGetAdminDishesQuery, useToggleAvailabilityMutation, useDeleteDishMutation } from '@/store/api/menu-api';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function AdminMenuPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminDishesQuery({ page, limit: 20, search: search || undefined });
  const [toggleAvailability] = useToggleAvailabilityMutation();
  const [deleteDish] = useDeleteDishMutation();

  const dishes = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <Link href="/admin/menu/new" className="btn-primary">Add Dish</Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search dishes..."
          className="input max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Dish</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Price</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dishes.map((dish: any) => (
                <tr key={dish.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{dish.name}</p>
                        <p className="text-xs text-gray-500">{dish.allergens?.length || 0} allergens</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{dish.category?.name}</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatPrice(Number(dish.price))}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAvailability({ id: dish.id, isAvailable: !dish.isAvailable })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        dish.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dish.isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link href={`/admin/menu/${dish.id}/edit`} className="text-sm text-brand-600 hover:underline">
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Delete this dish?')) deleteDish(dish.id);
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && meta.totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <span className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages} ({meta.total} items)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-ghost text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="btn-ghost text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
