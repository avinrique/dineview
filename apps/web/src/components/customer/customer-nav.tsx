'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, ReceiptText, BellRing } from 'lucide-react';
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

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-100 bg-white/90 backdrop-blur-xl pb-safe">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 pt-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 1.8} />
              {label}
              {href === '/orders' && activeOrders > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-2 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
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
