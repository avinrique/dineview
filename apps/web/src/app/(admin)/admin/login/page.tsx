'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '@/store/api/admin-api';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/slices/admin-slice';

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials({
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
      }));
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dine<span className="text-brand-500">View</span>
          </h1>
          <p className="text-gray-500 mt-2">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Demo: owner@bellavista.com / password123
          </p>
        </form>
      </div>
    </div>
  );
}
