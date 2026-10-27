import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    // Rupee menus don't show paise on round prices
    ...(currency === 'INR' && { trailingZeroDisplay: 'stripIfInteger' }),
  } as Intl.NumberFormatOptions).format(amount);
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getRelativeTime(date: Date | string, nowMs: number = Date.now()): string {
  const d = new Date(date);
  const diffMs = nowMs - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return formatDate(date);
}

/** `ORD-261023-45DQ` → `45DQ`: short enough to say out loud at the table. */
export function shortOrderNumber(orderNumber: string): string {
  return orderNumber.split('-').pop() || orderNumber;
}

export function hasArModel(dish: { arAsset?: { status?: string } | null }): boolean {
  return dish.arAsset?.status === 'READY';
}
