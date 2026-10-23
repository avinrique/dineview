'use client';

import { Heart } from 'lucide-react';
import { useLikes } from '@/hooks/use-likes';
import { cn } from '@/lib/utils';

export function LikeButton({ id, className }: { id: string; className?: string }) {
  const { isLiked, toggle } = useLikes();
  const liked = isLiked(id);
  return (
    <button onClick={() => toggle(id)} aria-label={liked ? 'Unlike' : 'Like'} aria-pressed={liked} className="-m-1 p-1">
      <Heart
        key={String(liked)}
        className={cn('h-6 w-6', liked ? 'fill-red-500 text-red-500 animate-heart-pop' : 'text-gray-900', className)}
      />
    </button>
  );
}
