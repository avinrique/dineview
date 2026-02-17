'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { useCreateOrderMutation } from '@/store/api/order-api';
import { useAppDispatch } from '@/store';
import { addActiveOrder } from '@/store/slices/order-slice';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, total, itemCount, orderNotes, updateQuantity, removeItem, setOrderNotes, clearCart } = useCart();
  const { currency, settings } = useSession();
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
      router.push('/orders');
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to place order');
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some dishes from the menu</p>
          <button onClick={() => router.push('/menu')} className="btn-primary">
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Your Cart ({itemCount})</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {items.map((item) => (
          <div key={item.dishId} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-sm text-brand-600 font-medium">
                {formatPrice(item.price, currency)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              >
                -
              </button>
              <span className="font-semibold w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 hover:bg-brand-200"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.dishId)}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}

        {/* Order notes */}
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes</label>
          <textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any special requests..."
            className="input h-20 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}
      </div>

      {/* Order summary & Place order */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 p-4">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(total, currency)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
              <span>{formatPrice(tax, currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span className="text-brand-600">{formatPrice(grandTotal, currency)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isLoading}
            className="btn-primary w-full py-3 text-base"
          >
            {isLoading ? 'Placing Order...' : `Place Order - ${formatPrice(grandTotal, currency)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
