import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DishImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}

/** Dish photo, or a soft branded placeholder when the dish has none. */
export function DishImage({ src, alt, className, iconClassName }: DishImageProps) {
  if (src) {
    // Transparent PNG cut-outs (renders of the 3D model) are shown whole on the
    // warm stage backdrop; photos fill the frame.
    const cutout = /\.png($|\?)/i.test(src);
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn('bg-stage', cutout ? 'object-contain p-[7%] drop-shadow-md' : 'object-cover', className)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn('flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-100', className)}
    >
      <UtensilsCrossed className={cn('h-7 w-7 text-brand-300', iconClassName)} />
    </div>
  );
}
