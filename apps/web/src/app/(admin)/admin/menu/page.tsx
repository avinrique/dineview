'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Plus, Search } from 'lucide-react';
import { hasPermission, type UserRole } from '@dineview/shared';
import { useGetAdminDishesQuery, useToggleAvailabilityMutation, useDeleteDishMutation } from '@/store/api/menu-api';
import { useAppDispatch, useAppSelector } from '@/store';
import { notify } from '@/store/slices/ui-slice';
import { useAdminCurrency } from '@/hooks/use-admin-currency';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DishImage } from '@/components/customer/dish-image';
import { formatPrice, hasArModel, cn } from '@/lib/utils';

export default function AdminMenuPage() {
  const dispatch = useAppDispatch();
  const currency = useAdminCurrency();
  const role = (useAppSelector((s) => s.admin.user?.role) || 'WAITER') as UserRole;
  const canEdit = hasPermission(role, 'dish:write');
  const canToggle = hasPermission(role, 'dish:toggle_availability');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminDishesQuery({ page, limit: 50, search: search || undefined });
  const [toggleAvailability] = useToggleAvailabilityMutation();
  const [deleteDish] = useDeleteDishMutation();

  const dishes: any[] = data?.data || [];
  const meta = data?.meta;

  async function remove(dish: any) {
    if (!confirm(`Delete “${dish.name}”?`)) return;
    try {
      const res = await deleteDish(dish.id).unwrap();
      dispatch(notify(res.data?.archived ? 'info' : 'success', res.message, 6000));
    } catch (err: any) {
      dispatch(notify('error', err?.data?.message || 'Could not delete the dish'));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
          <p className="text-sm text-gray-500">Dishes with a 3D model can be viewed in AR by guests.</p>
        </div>
        {canEdit && (
          <Link href="/admin/menu/new" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add dish
          </Link>
        )}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search dishes"
          className="input pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-3 font-medium">Dish</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Available</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <DishImage src={dish.imageUrl} alt={dish.name} className="h-11 w-11 shrink-0 rounded-lg" iconClassName="h-4 w-4" />
                        <div>
                          <p className="font-medium text-gray-900">{dish.name}</p>
                          {hasArModel(dish) ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                              <Box className="h-3 w-3 text-brand-500" /> 3D / AR ready
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No 3D model</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{dish.category?.name}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatPrice(Number(dish.price), currency)}</td>
                    <td className="px-4 py-3">
                      <button
                        disabled={!canToggle}
                        onClick={() => toggleAvailability({ id: dish.id, isAvailable: !dish.isAvailable })}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed',
                          dish.isAvailable ? 'bg-green-500' : 'bg-gray-300',
                        )}
                        aria-label={dish.isAvailable ? 'Mark unavailable' : 'Mark available'}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                            dish.isAvailable ? 'translate-x-6' : 'translate-x-1',
                          )}
                        />
                      </button>
                    </td>
                    <td className="space-x-3 px-4 py-3 text-right">
                      {canEdit && (
                        <>
                          <Link href={`/admin/menu/${dish.id}/edit`} className="text-sm text-brand-600 hover:underline">
                            Edit
                          </Link>
                          <button onClick={() => remove(dish)} className="text-sm text-red-600 hover:underline">
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {dishes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">No dishes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages} ({meta.total} dishes)
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost text-sm">
                  Previous
                </button>
                <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="btn-ghost text-sm">
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
