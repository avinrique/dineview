import { cn } from '@/lib/utils';

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Restaurant monogram used as the profile picture. */
export function RestaurantAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 font-display text-white',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
