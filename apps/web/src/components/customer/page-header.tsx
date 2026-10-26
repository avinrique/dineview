'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

/** Slim top bar used across the guest pages. */
export function PageHeader({
  title,
  subtitle,
  back = false,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: boolean;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-2">
        <div className="flex w-12 justify-center">
          {back && (
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
              aria-label="Back"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[15px] font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex w-12 justify-center">{right}</div>
      </div>
    </header>
  );
}
