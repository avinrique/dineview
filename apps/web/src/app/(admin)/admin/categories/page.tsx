'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
} from '@/store/api/menu-api';
import { useAppDispatch } from '@/store';
import { notify } from '@/store/slices/ui-slice';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

export default function AdminCategoriesPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAdminCategoriesQuery(undefined);
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [reorderCategories] = useReorderCategoriesMutation();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string; description: string } | null>(null);

  const categories: any[] = data?.data || [];

  async function run(action: () => Promise<unknown>, success?: string) {
    try {
      await action();
      if (success) dispatch(notify('success', success));
    } catch (err: any) {
      dispatch(notify('error', err?.data?.message || 'Something went wrong'));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await run(
      () => createCategory({ name, description: description || undefined, sortOrder: categories.length }).unwrap(),
      'Category added',
    );
    setName('');
    setDescription('');
    setShowForm(false);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    const order = [...categories];
    [order[index], order[target]] = [order[target], order[index]];
    run(() => reorderCategories({ categories: order.map((c, i) => ({ id: c.id, sortOrder: i })) }).unwrap());
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Sections of the menu, in the order guests see them.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Add category'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" required maxLength={100} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" maxLength={500} />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, idx) => (
            <div key={cat.id} className={cn('card flex items-center gap-4 p-4', !cat.isActive && 'opacity-60')}>
              <div className="flex flex-col">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === categories.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              {editing && editing.id === cat.id ? (
                <form
                  className="flex flex-1 flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await run(
                      () => updateCategory({ id: cat.id, name: editing.name, description: editing.description || undefined }).unwrap(),
                      'Category updated',
                    );
                    setEditing(null);
                  }}
                >
                  <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input max-w-[200px] py-1.5" required />
                  <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input flex-1 py-1.5" placeholder="Description" />
                  <button type="submit" className="btn-primary py-1.5 text-sm">Save</button>
                  <button type="button" onClick={() => setEditing(null)} className="btn-ghost py-1.5 text-sm">Cancel</button>
                </form>
              ) : (
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {cat.name}
                    {!cat.isActive && <span className="ml-2 text-xs font-normal text-gray-500">(hidden from guests)</span>}
                  </h3>
                  {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                  <p className="text-xs text-gray-400">{cat._count?.dishes || 0} dishes</p>
                </div>
              )}

              {editing?.id !== cat.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing({ id: cat.id, name: cat.name, description: cat.description || '' })}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Rename"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => run(() => updateCategory({ id: cat.id, isActive: !cat.isActive }).unwrap())}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label={cat.isActive ? 'Hide from menu' : 'Show on menu'}
                    title={cat.isActive ? 'Hide from menu' : 'Show on menu'}
                  >
                    {cat.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete “${cat.name}”?`)) run(() => deleteCategory(cat.id).unwrap(), 'Category deleted');
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
