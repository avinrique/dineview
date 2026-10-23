import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Instagram-style gradient ring around an avatar or story highlight. */
export function StoryRing({
  children,
  active = true,
  className,
}: {
  children: ReactNode;
  /** Gradient when active, a quiet grey ring otherwise. */
  active?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('block rounded-full p-[2.5px]', active ? 'bg-ig' : 'bg-gray-200', className)}>
      <span className="block h-full w-full overflow-hidden rounded-full border-[2.5px] border-white bg-white">{children}</span>
    </span>
  );
}
