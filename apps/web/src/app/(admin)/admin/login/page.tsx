'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '@/store/api/admin-api';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCredentials } from '@/store/slices/admin-slice';
import { useMounted } from '@/hooks/use-mounted';
import { homeForRole } from '@/lib/roles';

const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

const demoAccounts = [
  { label: 'Owner', email: 'owner@bellavista.com' },
  { label: 'Kitchen', email: 'kitchen@bellavista.com' },
  { label: 'Waiter', email: 'waiter@bellavista.com' },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mounted = useMounted();
  const signedIn = useAppSelector((s) => s.admin.user);
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (mounted && signedIn) router.replace(homeForRole(signedIn.role));
  }, [mounted, signedIn, router]);

  async function signIn(credentials: { email: string; password: string }) {
    setError('');
    try {
      const result = await login(credentials).unwrap();
      dispatch(
        setCredentials({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          user: result.data.user,
        }),
      );
      router.replace(homeForRole(result.data.user.role));
    } catch (err: any) {
      setError(err?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Dine<span className="text-brand-500">View</span>
          </h1>
          <p className="mt-2 text-gray-500">Restaurant staff sign in</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            signIn({ email, password });
          }}
          className="card space-y-4"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@restaurant.com"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>

          {DEMO_ENABLED && (
            <div className="border-t pt-4">
              <p className="mb-2 text-center text-xs text-gray-400">Demo accounts (password123)</p>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    disabled={isLoading}
                    onClick={() => signIn({ email: a.email, password: 'password123' })}
                    className="rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
