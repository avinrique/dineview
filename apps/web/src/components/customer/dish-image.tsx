import { cn } from '@/lib/utils';
import { paletteFor } from '@/components/customer/dish-tile';

interface DishImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Classes for the monogram shown when there's no photo (e.g. its text size). */
  placeholderClassName?: string;
}

/** Dish photo, or a soft branded placeholder when the dish has none. */
export function DishImage({ src, alt, className, placeholderClassName }: DishImageProps) {
  if (src) {
    // Transparent PNG cut-outs (renders of the 3D model) are shown whole on the
    // warm stage backdrop; photos fill the frame. The wrapper makes the
    // percentage padding relative to the thumbnail, not the surrounding row.
    const cutout = /\.png($|\?)/i.test(src);
    return (
      <span className={cn('block overflow-hidden bg-stage', className)}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn('h-full w-full', cutout ? 'object-contain p-[8%] drop-shadow-md' : 'object-cover')}
        />
      </span>
    );
  }
  // No photo yet: the same paper-tone monogram as the menu's text-only tiles
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn('flex items-center justify-center bg-gradient-to-br', paletteFor(alt), className)}
    >
      <span className={cn('font-display text-2xl text-gray-900/75', placeholderClassName)}>{alt.charAt(0)}</span>
    </div>
  );
}
