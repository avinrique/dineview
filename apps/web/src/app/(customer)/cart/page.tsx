'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { useCreateOrderMutation } from '@/store/api/order-api';
import { useAppDispatch } from '@/store';
import { addActiveOrder } from '@/store/slices/order-slice';
import { notify } from '@/store/slices/ui-slice';
import { formatPrice } from '@/lib/utils';
import { DishImage } from '@/components/customer/dish-image';
import { PageHeader } from '@/components/customer/page-header';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, total, itemCount, orderNotes, updateQuantity, removeItem, setOrderNotes, clearCart } = useCart();
  const { currency, settings, tableLabel } = useSession();
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [error, setError] = useState<string | null>(null);

  const taxRate = (settings?.taxRate || 0) / 100;
  const tax = total * taxRate;
  const grandTotal = total + tax;

  async function handlePlaceOrder() {
    try {
      setError(null);
      const result = await createOrder({
        items: items.map((i) => ({
          dishId: i.dishId,
          quantity: i.quantity,
          specialNotes: i.specialNotes,
        })),
        specialNotes: orderNotes || undefined,
      }).unwrap();

      dispatch(addActiveOrder(result.data.id));
      clearCart();
      dispatch(notify('success', 'Order sent to the kitchen'));
      router.push('/orders');
    } catch (err: any) {
      setError(err?.data?.message || 'We couldn’t place your order. Please try again.');
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50">
            <ShoppingBag className="h-9 w-9 text-brand-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Your order is empty</h1>
          <p className="mb-6 text-gray-600">Add a few dishes from the menu.</p>
          <Link href="/menu" className="inline-block rounded-full bg-gray-900 px-6 py-3 font-semibold text-white">Browse the menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white pb-56">
      <PageHeader back title="Your order" subtitle={`${itemCount} ${itemCount === 1 ? 'item' : 'items'} · Table ${tableLabel}`} />

      <div className="mx-auto max-w-lg px-4 py-2">
        {items.map((item) => (
          <div key={item.dishId} className="flex items-center gap-3 border-b border-gray-100 py-3">
            <DishImage src={item.imageUrl} alt={item.name} className="h-16 w-16 shrink-0 rounded-xl" placeholderClassName="text-2xl" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500">{formatPrice(item.price * item.quantity, currency)}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-0.5">
              <button
                onClick={() => (item.quantity === 1 ? removeItem(item.dishId) : updateQuantity(item.dishId, item.quantity - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full active:bg-gray-200"
                aria-label={item.quantity === 1 ? 'Remove' : 'Fewer'}
              >
                {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-red-500" /> : <Minus className="h-4 w-4" />}
              </button>
              <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.dishId, Math.min(20, item.quantity + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full active:bg-gray-200"
                aria-label="More"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <div className="pt-5">
          <label htmlFor="notes" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Notes for the kitchen</label>
          <textarea
            id="notes"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Allergies, no onions, extra spicy…"
            maxLength={1000}
            className="h-24 w-full resize-none rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm outline-none ring-gray-900 focus:ring-1"
          />
        </div>

        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 pt-4 pb-safe backdrop-blur-xl">
        <div className="mx-auto max-w-lg space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(total, currency)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({+(taxRate * 100).toFixed(3)}%)</span>
              <span>{formatPrice(tax, currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(grandTotal, currency)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isLoading}
            className="w-full rounded-full bg-gray-900 py-3.5 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? 'Sending to kitchen…' : `Place order · ${formatPrice(grandTotal, currency)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
