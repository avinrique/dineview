'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { useSocket } from '@/hooks/use-socket';
import Link from 'next/link';

export default function ActionsPage() {
  const router = useRouter();
  const { tableId, tableLabel, sessionId } = useSession();
  const { socket } = useSocket();
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [cooldown, setCooldown] = useState<Record<string, boolean>>({});

  const handleCallWaiter = useCallback(() => {
    if (cooldown.waiter || !tableId || !tableLabel || !sessionId) return;

    socket.emit('notification:waiter_call', {
      tableId,
      tableLabel,
      sessionId,
    });

    setWaiterCalled(true);
    setCooldown((c) => ({ ...c, waiter: true }));

    setTimeout(() => {
      setWaiterCalled(false);
      setCooldown((c) => ({ ...c, waiter: false }));
    }, 30000);
  }, [socket, tableId, tableLabel, sessionId, cooldown.waiter]);

  const handleRequestBill = useCallback(() => {
    if (cooldown.bill || !tableId || !tableLabel || !sessionId) return;

    socket.emit('notification:bill_request', {
      tableId,
      tableLabel,
      sessionId,
    });

    setBillRequested(true);
    setCooldown((c) => ({ ...c, bill: true }));

    setTimeout(() => {
      setBillRequested(false);
      setCooldown((c) => ({ ...c, bill: false }));
    }, 60000);
  }, [socket, tableId, tableLabel, sessionId, cooldown.bill]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Actions</h1>
          <p className="text-sm text-gray-500">Table {tableLabel}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <button
          onClick={handleCallWaiter}
          disabled={cooldown.waiter}
          className={`w-full card p-6 text-center transition-all ${
            waiterCalled
              ? 'bg-green-50 border-green-200'
              : 'hover:shadow-md hover:border-brand-200'
          }`}
        >
          <div className="text-4xl mb-3">{waiterCalled ? '✅' : '🔔'}</div>
          <h2 className="text-lg font-bold text-gray-900">
            {waiterCalled ? 'Waiter Notified!' : 'Call Waiter'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {waiterCalled
              ? 'A waiter will be with you shortly'
              : 'Request assistance from a waiter'}
          </p>
          {cooldown.waiter && (
            <p className="text-xs text-gray-400 mt-2">Please wait before calling again</p>
          )}
        </button>

        <button
          onClick={handleRequestBill}
          disabled={cooldown.bill}
          className={`w-full card p-6 text-center transition-all ${
            billRequested
              ? 'bg-green-50 border-green-200'
              : 'hover:shadow-md hover:border-brand-200'
          }`}
        >
          <div className="text-4xl mb-3">{billRequested ? '✅' : '💳'}</div>
          <h2 className="text-lg font-bold text-gray-900">
            {billRequested ? 'Bill Requested!' : 'Request Bill'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {billRequested
              ? 'Your bill is being prepared'
              : 'Ask for your bill when you\'re ready to pay'}
          </p>
          {cooldown.bill && (
            <p className="text-xs text-gray-400 mt-2">Please wait before requesting again</p>
          )}
        </button>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-lg mx-auto flex">
          <Link href="/menu" className="flex-1 py-3 text-center text-sm text-gray-600 hover:text-brand-600">
            Menu
          </Link>
          <Link href="/orders" className="flex-1 py-3 text-center text-sm text-gray-600 hover:text-brand-600">
            Orders
          </Link>
          <Link href="/actions" className="flex-1 py-3 text-center text-sm font-semibold text-brand-600">
            Actions
          </Link>
        </div>
      </div>
    </div>
  );
}
