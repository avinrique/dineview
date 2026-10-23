import type { ReactNode } from 'react';
import { Box, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Soft paper tones for dishes without a photo, picked per category so a
// category reads as one colour in the grid
const PALETTES = [
  'from-[#fff4ea] to-[#f9d3b4]',
  'from-[#f1f7ec] to-[#cfe5c0]',
  'from-[#fff0f1] to-[#f6c1c8]',
  'from-[#eef4fd] to-[#c3d6f3]',
  'from-[#f7f0ff] to-[#dcc8f4]',
  'from-[#fffae6] to-[#f2e0a0]',
];

export function paletteFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

interface DishTileProps {
  dish: { id: string; name: string; imageUrl?: string | null; categoryId?: string; isFeatured?: boolean };
  ar?: boolean;
  /** Category name shown on text-only tiles. */
  category?: string;
  /** `large` for full-width feed / detail tiles, `thumb` for small circles (no badges). */
  size?: 'grid' | 'large' | 'thumb';
  /** Extra line under the name on text-only tiles (e.g. the price). */
  footer?: ReactNode;
  className?: string;
}

/**
 * Square dish media for the Instagram-style grid and feed: the dish cut-out on
 * the warm stage, or a typographic tile when the dish has no photo yet.
 */
export function DishTile({ dish, ar, category, size = 'grid', footer, className }: DishTileProps) {
  const large = size === 'large';
  const thumb = size === 'thumb';
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {dish.imageUrl ? (
        <img
          src={dish.imageUrl}
          alt={dish.name}
          loading="lazy"
          className={cn(
            'h-full w-full bg-stage',
            /\.png($|\?)/i.test(dish.imageUrl) ? 'object-contain p-[9%] drop-shadow-lg' : 'object-cover',
          )}
        />
      ) : (
        <div
          role="img"
          aria-label={dish.name}
          className={cn(
            'flex h-full w-full flex-col justify-between bg-gradient-to-br',
            paletteFor(dish.categoryId || dish.id),
            large ? 'p-7' : 'p-2.5',
            thumb && 'items-center justify-center p-0',
          )}
        >
          {thumb ? (
            <span className="font-display text-2xl text-gray-900/80">{dish.name.charAt(0)}</span>
          ) : (
            <>
              {category && (
                <span className={cn('font-semibold uppercase tracking-[0.18em] text-gray-900/45', large ? 'text-xs' : 'text-[8px]')}>
                  {category}
                </span>
              )}
              <span>
                <span
                  className={cn(
                    'block font-display font-medium leading-[1.05] text-gray-900',
                    large ? 'text-4xl' : 'line-clamp-3 text-[15px]',
                  )}
                >
                  {dish.name}
                </span>
                {footer && <span className="mt-1 block text-[11px] font-semibold text-gray-900/60">{footer}</span>}
              </span>
            </>
          )}
        </div>
      )}
      {ar && !thumb && (
        <span
          className={cn(
            'absolute right-1.5 top-1.5 flex items-center justify-center rounded-full bg-black/55 text-white backdrop-blur',
            large ? 'h-9 w-9' : 'h-6 w-6',
          )}
          aria-label="Can be viewed in AR"
        >
          <Box className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
        </span>
      )}
      {/* Top-right unless the AR badge is there (text tiles keep their label top-left) */}
      {dish.isFeatured && size === 'grid' && (
        <span
          className={cn(
            'absolute top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-amber-500 backdrop-blur',
            ar ? 'left-1.5' : 'right-1.5',
          )}
          aria-label="Chef’s pick"
        >
          <Star className="h-3.5 w-3.5 fill-current" />
        </span>
      )}
    </div>
  );
}
