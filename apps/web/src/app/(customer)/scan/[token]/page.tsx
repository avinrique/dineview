'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { scanQrCode } from '@/lib/api-client';
import { reauthenticateSocket } from '@/lib/socket-client';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSession } from '@/store/slices/session-slice';
import { clearCart } from '@/store/slices/cart-slice';
import { apiSlice } from '@/store/api/api-slice';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Only allow in-app redirects (e.g. a QR that opens a specific dish).
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/menu';
}

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.session);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const token = params.token as string;
    if (!token || started.current) return;
    started.current = true;

    scanQrCode(token)
      .then((res) => {
        const { restaurant, table } = res.data;
        // A different table means a different bill: start with an empty cart.
        if (current.restaurantId !== restaurant.id || current.tableId !== table.id) {
          dispatch(clearCart());
        }
        dispatch(apiSlice.util.resetApiState());
        dispatch(
          setSession({
            sessionToken: res.data.sessionToken,
            restaurant,
            table,
            session: res.data.session,
          }),
        );
        reauthenticateSocket();
        router.replace(safeNext());
      })
      .catch((err) => {
        setError(err.message || 'Invalid QR code');
      });
  }, [params.token, router, dispatch, current.restaurantId, current.tableId]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
            <QrCode className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">This QR code isn’t working</h1>
          <p className="mb-6 text-gray-600">{error}. Please ask a member of staff for help.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-lg text-gray-600">Setting up your table…</p>
      </div>
    </div>
  );
}
