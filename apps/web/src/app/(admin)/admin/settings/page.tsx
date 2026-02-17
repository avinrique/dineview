'use client';

import { useState, useEffect } from 'react';
import { useGetRestaurantQuery, useUpdateRestaurantMutation } from '@/store/api/admin-api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminSettingsPage() {
  const { data, isLoading } = useGetRestaurantQuery(undefined);
  const [updateRestaurant, { isLoading: updating }] = useUpdateRestaurantMutation();
  const [form, setForm] = useState({ name: '', address: '', currency: '', timezone: '', taxRate: '', enableAr: true });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (data?.data) {
      const r = data.data;
      const settings = r.settings as any || {};
      setForm({
        name: r.name || '',
        address: r.address || '',
        currency: r.currency || 'USD',
        timezone: r.timezone || 'UTC',
        taxRate: String(settings.taxRate ?? ''),
        enableAr: settings.enableAr ?? true,
      });
    }
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateRestaurant({
        name: form.name,
        address: form.address,
        currency: form.currency,
        timezone: form.timezone,
        settings: {
          taxRate: Number(form.taxRate) || 0,
          enableAr: form.enableAr,
        },
      }).unwrap();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {}
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Settings</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">General</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <input type="text" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="input" />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Features</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="input" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.enableAr} onChange={(e) => setForm({ ...form, enableAr: e.target.checked })} id="enableAr" />
              <label htmlFor="enableAr" className="text-sm text-gray-700">Enable AR Menu</label>
            </div>
          </div>
        </div>

        {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">Settings saved successfully!</div>}

        <button type="submit" disabled={updating} className="btn-primary">
          {updating ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
