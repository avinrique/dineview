'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, CreditCard, CheckCircle2 } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';

type Kind = 'waiter' | 'bill';

const COOLDOWN_MS: Record<Kind, number> = { waiter: 30_000, bill: 60_000 };

export default function ActionsPage() {
  const { tableId, tableLabel, sessionId } = useSession();
  const { socket, on, connected } = useSocket();
  const [sent, setSent] = useState<Record<Kind, 'idle' | 'sent' | 'acknowledged'>>({ waiter: 'idle', bill: 'idle' });

  useEffect(() => {
    return on('notification:acknowledged', (e) => {
      const kind: Kind = e.kind === 'bill_request' ? 'bill' : 'waiter';
      setSent((s) => ({ ...s, [kind]: 'acknowledged' }));
    });
  }, [on]);

  const request = useCallback(
    (kind: Kind) => {
      if (sent[kind] !== 'idle' || !tableId || !tableLabel || !sessionId) return;
      socket.emit(kind === 'waiter' ? 'notification:waiter_call' : 'notification:bill_request', {
        tableId,
        tableLabel,
        sessionId,
      });
      setSent((s) => ({ ...s, [kind]: 'sent' }));
      setTimeout(() => setSent((s) => ({ ...s, [kind]: 'idle' })), COOLDOWN_MS[kind]);
    },
    [socket, sent, tableId, tableLabel, sessionId],
  );

  const cards: { kind: Kind; icon: typeof BellRing; title: string; idle: string; sent: string; ack: string }[] = [
    {
      kind: 'waiter',
      icon: BellRing,
      title: 'Call a waiter',
      idle: 'Need something? We’ll send someone over.',
      sent: 'Request sent, waiting for staff…',
      ack: 'A waiter is on the way',
    },
    {
      kind: 'bill',
      icon: CreditCard,
      title: 'Request the bill',
      idle: 'Ready to pay? We’ll bring the bill to your table.',
      sent: 'Request sent, waiting for staff…',
      ack: 'Your bill is on its way',
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto max-w-lg px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Service</h1>
          <p className="text-sm text-gray-500">Table {tableLabel}</p>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {cards.map(({ kind, icon: Icon, title, idle, sent: sentText, ack }) => {
          const state = sent[kind];
          return (
            <button
              key={kind}
              onClick={() => request(kind)}
              disabled={state !== 'idle' || !connected}
              className={cn(
                'flex w-full items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 transition',
                state === 'acknowledged' ? 'ring-green-200 bg-green-50' : state === 'sent' ? 'ring-brand-200' : 'ring-gray-100 active:scale-[0.99]',
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  state === 'acknowledged' ? 'bg-green-100 text-green-600' : 'bg-brand-50 text-brand-500',
                )}
              >
                {state === 'acknowledged' ? <CheckCircle2 className="h-6 w-6" /> : <Icon className={cn('h-6 w-6', state === 'sent' && 'animate-pulse')} />}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500">{state === 'acknowledged' ? ack : state === 'sent' ? sentText : idle}</p>
              </div>
            </button>
          );
        })}
        {!connected && <p className="text-center text-xs text-gray-400">Connecting to the restaurant…</p>}
      </div>
    </div>
  );
}
