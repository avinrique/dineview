'use client';

import { useState } from 'react';
import { useGetTablesQuery, useCreateTableMutation, useDeleteTableMutation, useGenerateQrMutation } from '@/store/api/admin-api';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminTablesPage() {
  const { data, isLoading } = useGetTablesQuery(undefined);
  const [createTable, { isLoading: creating }] = useCreateTableMutation();
  const [deleteTable] = useDeleteTableMutation();
  const [generateQr] = useGenerateQrMutation();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zone, setZone] = useState('');

  const tables = data?.data || [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTable({ label, capacity: Number(capacity), locationZone: zone || undefined }).unwrap();
      setLabel(''); setCapacity('4'); setZone(''); setShowForm(false);
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Table'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="input" placeholder="e.g., T7" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <input type="text" value={zone} onChange={(e) => setZone(e.target.value)} className="input" placeholder="e.g., Patio" />
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : 'Create Table'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table: any) => {
            const hasActiveSession = table.tableSessions?.length > 0;
            const activeOrders = table.tableSessions?.[0]?.orders?.length || 0;
            const hasQr = table.qrCodes?.length > 0;

            return (
              <div key={table.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{table.label}</h3>
                  <Badge variant={table.isActive ? 'success' : 'default'}>
                    {table.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>Capacity: {table.capacity} seats</p>
                  {table.locationZone && <p>Zone: {table.locationZone}</p>}
                  <p>
                    Status: {hasActiveSession
                      ? `Occupied (${activeOrders} active orders)`
                      : 'Available'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!hasQr && (
                    <button onClick={() => generateQr(table.id)} className="btn-secondary text-sm flex-1">
                      Generate QR
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('Delete table?')) deleteTable(table.id); }}
                    className="text-sm text-red-600 hover:underline px-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
