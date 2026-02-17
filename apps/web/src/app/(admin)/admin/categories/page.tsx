'use client';

import { useState } from 'react';
import { useGetAdminCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation } from '@/store/api/menu-api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminCategoriesPage() {
  const { data, isLoading } = useGetAdminCategoriesQuery(undefined);
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const categories = data?.data || [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCategory({ name, description: description || undefined }).unwrap();
      setName(''); setDescription(''); setShowForm(false);
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input max-w-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input max-w-sm" />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat: any, idx: number) => (
            <div key={cat.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-mono text-sm w-6">{idx + 1}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                  <p className="text-xs text-gray-400">{cat._count?.dishes || 0} dishes</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`w-3 h-3 rounded-full ${cat.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <button
                  onClick={() => { if (confirm('Delete category?')) deleteCategory(cat.id); }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
