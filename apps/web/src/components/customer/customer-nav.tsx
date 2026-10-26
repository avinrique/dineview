'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, ReceiptText, BellRing } from 'lucide-react';
import { useAppSelector } from '@/store';
import { useGetSessionOrdersQuery } from '@/store/api/order-api';
import { cn } from '@/lib/utils';

const ACTIVE = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'];

const tabs = [
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/orders', label: 'My orders', icon: ReceiptText },
  { href: '/actions', label: 'Service', icon: BellRing },
];

export function CustomerNav() {
  const pathname = usePathname();
  const { data } = useGetSessionOrdersQuery(undefined);
  const activeOrders = (data?.data || []).filter((o: any) => ACTIVE.includes(o.status)).length;
  const dark = useAppSelector((s) => s.ui.immersive);

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl pb-safe',
        dark ? 'border-cream/10 bg-ink/90' : 'border-gray-100 bg-white/90',
      )}
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 pt-2.5 transition-colors',
                dark
                  ? cn('font-mono text-[10px] uppercase tracking-[0.16em]', active ? 'text-cream' : 'text-cream/45 hover:text-cream/70')
                  : cn('text-[11px] font-medium', active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'),
              )}
            >
              {dark && active && <span className="absolute top-0 h-px w-8 bg-ember" />}
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 1.8} />
              {label}
              {href === '/orders' && activeOrders > 0 && (
                <span
                  className={cn(
                    'absolute top-1.5 left-1/2 ml-2 min-w-[18px] rounded-full px-1 text-center text-[10px] font-bold leading-[18px] ring-2',
                    dark ? 'bg-ember text-ink ring-ink' : 'bg-red-500 text-white ring-white',
                  )}
                >
                  {activeOrders}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
