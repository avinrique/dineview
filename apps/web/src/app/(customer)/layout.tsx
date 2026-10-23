'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QrCode, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { apiSlice } from '@/store/api/api-slice';
import { endSession } from '@/store/slices/session-slice';
import { clearCart } from '@/store/slices/cart-slice';
import { notify } from '@/store/slices/ui-slice';
import { useMounted } from '@/hooks/use-mounted';
import { useSocket } from '@/hooks/use-socket';
import { shortOrderNumber } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import { CustomerNav } from '@/components/customer/customer-nav';

const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';
const TAB_ROUTES = ['/menu', '/orders', '/actions'];

const statusMessages: Record<string, { type: 'success' | 'info' | 'warning'; text: string }> = {
  ACCEPTED: { type: 'info', text: 'The kitchen accepted your order' },
  PREPARING: { type: 'info', text: 'Your order is being prepared' },
  READY: { type: 'success', text: 'Your order is ready and on its way!' },
  SERVED: { type: 'success', text: 'Enjoy your meal!' },
  CANCELLED: { type: 'warning', text: 'Your order was cancelled. Please ask a waiter.' },
};

/** Live updates for the guest's table: order progress, staff replies, table closed. */
function TableLiveUpdates({ restaurantId, tableId }: { restaurantId: string; tableId: string }) {
  const dispatch = useAppDispatch();
  const { on, joinTable } = useSocket();

  useEffect(() => {
    joinTable(restaurantId, tableId);
  }, [restaurantId, tableId, joinTable]);

  useEffect(() => {
    const offs = [
      on('order:status_changed', (e) => {
        dispatch(apiSlice.util.invalidateTags(['Orders']));
        const msg = statusMessages[e.toStatus];
        if (msg) dispatch(notify(msg.type, `#${shortOrderNumber(e.orderNumber)}: ${msg.text}`, 6000));
      }),
      on('notification:acknowledged', (e) => {
        dispatch(
          notify('success', e.kind === 'bill_request' ? 'Your bill is on its way' : 'A waiter is on the way', 6000),
        );
      }),
      on('session:closed', () => {
        dispatch(endSession('closed'));
        dispatch(clearCart());
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [on, dispatch]);

  return null;
}

function NoSession({ reason }: { reason: 'closed' | 'expired' | null }) {
  const title =
    reason === 'closed' ? 'Thanks for dining with us!' : reason === 'expired' ? 'Your session has expired' : 'Welcome';
  const body =
    reason === 'closed'
      ? 'Your table has been closed. Scan the QR code again whenever you’d like to order.'
      : 'Scan the QR code on your table to see the menu and order from your phone.';

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-brand-50 to-white p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-brand-100">
          <QrCode className="h-10 w-10 text-brand-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mb-8 text-gray-600">{body}</p>
        {DEMO_ENABLED && (
          <Link href="/scan/demo" className="btn-primary inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Open the demo table
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const pathname = usePathname();
  const { sessionToken, restaurantId, tableId, endedReason } = useAppSelector((s) => s.session);

  if (!mounted) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // The scan page creates the session, so it renders without one.
  if (pathname.startsWith('/scan/')) return <>{children}</>;

  if (!sessionToken || !restaurantId || !tableId) return <NoSession reason={endedReason} />;

  return (
    <>
      <TableLiveUpdates restaurantId={restaurantId} tableId={tableId} />
      <Toaster />
      {children}
      {TAB_ROUTES.includes(pathname) && <CustomerNav />}
    </>
  );
}
