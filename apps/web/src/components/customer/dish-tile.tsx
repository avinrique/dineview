import { Box, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Soft paper tones for dishes without a photo on light screens (cart, admin),
// picked per category so a category reads as one colour
const PALETTES = [
  'from-[#fff4ea] to-[#f9d3b4]',
  'from-[#f1f7ec] to-[#cfe5c0]',
  'from-[#fff0f1] to-[#f6c1c8]',
  'from-[#eef4fd] to-[#c3d6f3]',
  'from-[#f7f0ff] to-[#dcc8f4]',
  'from-[#fffae6] to-[#f2e0a0]',
];

/** Stable pick from `list` for a key, so a category always gets the same colour. */
export function pickFor<T>(key: string, list: readonly T[]): T {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return list[h % list.length]!;
}

export function paletteFor(key: string) {
  return pickFor(key, PALETTES);
}

interface DishTileProps {
  dish: {
    id: string;
    name: string;
    imageUrl?: string | null;
    categoryId?: string;
    isFeatured?: boolean;
    ingredients?: { name: string; isPrimary?: boolean }[];
  };
  ar?: boolean;
  /** Category name shown on text-only tiles. */
  category?: string;
  /** `large` for the full-width dish page tile. */
  size?: 'grid' | 'large';
  className?: string;
}

/**
 * Dish media on the dark menu: the dish cut-out on a warm stage, or, when the
 * dish has no photo yet, a typographic tile of what it's made with (the name
 * is always printed next to the tile).
 */
export function DishTile({ dish, ar, category, size = 'grid', className }: DishTileProps) {
  const large = size === 'large';
  const ingredients = [...(dish.ingredients || [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).map((i) => i.name);
  return (
    <div className={cn('relative overflow-hidden bg-stage-dark', className)}>
      {dish.imageUrl ? (
        <img
          src={dish.imageUrl}
          alt={dish.name}
          loading="lazy"
          className={cn(
            'h-full w-full',
            /\.png($|\?)/i.test(dish.imageUrl) ? 'object-contain p-[10%] drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)]' : 'object-cover',
          )}
        />
      ) : (
        <div role="img" aria-label={dish.name} className={cn('flex h-full w-full flex-col justify-between', large ? 'p-7' : 'p-3.5')}>
          {category && (
            <span className={cn('font-mono uppercase tracking-[0.2em] text-ember', large ? 'text-[11px]' : 'text-[9px]')}>{category}</span>
          )}
          <span>
            {ingredients.length > 0 ? (
              <>
                <span className={cn('block font-mono uppercase tracking-[0.2em] text-cream/40', large ? 'text-[11px]' : 'text-[9px]')}>
                  Made with
                </span>
                <span
                  className={cn(
                    'mt-1.5 block font-display italic leading-[1.1] text-cream/85',
                    large ? 'text-3xl' : 'line-clamp-4 text-[17px]',
                  )}
                >
                  {ingredients.join(', ')}
                </span>
              </>
            ) : (
              <span className={cn('block font-display font-medium leading-[1.02] text-cream', large ? 'text-4xl' : 'line-clamp-4 text-[19px]')}>
                {dish.name}
              </span>
            )}
          </span>
        </div>
      )}
      {ar && (
        <span
          className={cn(
            'absolute right-2 top-2 flex items-center gap-1 rounded-full border border-ember/40 bg-ink/70 font-mono uppercase tracking-[0.14em] text-ember backdrop-blur',
            large ? 'px-3 py-1.5 text-[11px]' : 'px-2 py-0.5 text-[9.5px]',
          )}
          aria-label="Can be viewed in AR"
        >
          <Box className={large ? 'h-3.5 w-3.5' : 'h-3 w-3'} /> 3D
        </span>
      )}
      {dish.isFeatured && size === 'grid' && dish.imageUrl && (
        <span
          className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-ember backdrop-blur"
          aria-label="Chef’s pick"
        >
          <Star className="h-3.5 w-3.5 fill-current" />
        </span>
      )}
    </div>
  );
}
