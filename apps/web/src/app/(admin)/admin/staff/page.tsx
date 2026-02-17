'use client';

import { useState } from 'react';
import { useGetStaffQuery, useCreateStaffMutation, useDeleteStaffMutation } from '@/store/api/admin-api';
import { ROLE_LABELS } from '@dineview/shared';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminStaffPage() {
  const { data, isLoading } = useGetStaffQuery(undefined);
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [deleteStaff] = useDeleteStaffMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'WAITER' });
  const [error, setError] = useState('');

  const staff = data?.data || [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createStaff(form).unwrap();
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'WAITER' });
      setShowForm(false);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to create staff');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" required minLength={8} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                <option value="WAITER">Waiter</option>
                <option value="KITCHEN_STAFF">Kitchen Staff</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : 'Create Staff Member'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Role</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((member: any) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{member.firstName} {member.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{(ROLE_LABELS as any)[member.role] || member.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { if (confirm('Remove this staff member?')) deleteStaff(member.id); }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
