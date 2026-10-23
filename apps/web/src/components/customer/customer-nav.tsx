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
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 pt-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {label}
              {href === '/orders' && activeOrders > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-2 min-w-[18px] rounded-full bg-brand-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
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
