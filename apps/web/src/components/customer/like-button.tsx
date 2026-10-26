'use client';

import { Heart } from 'lucide-react';
import { useLikes } from '@/hooks/use-likes';
import { cn } from '@/lib/utils';

export function LikeButton({ id, className }: { id: string; className?: string }) {
  const { isLiked, toggle } = useLikes();
  const liked = isLiked(id);
  return (
    <button
      onClick={() => toggle(id)}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
      className={cn('flex items-center justify-center', className)}
    >
      <Heart key={String(liked)} className={cn('h-[18px] w-[18px]', liked ? 'fill-ember text-ember animate-heart-pop' : 'text-cream')} />
    </button>
  );
}
