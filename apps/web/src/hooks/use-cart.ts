'use client';

import { useAppSelector, useAppDispatch } from '@/store';
import {
  addItem,
  removeItem,
  updateQuantity,
  updateItemNotes,
  setOrderNotes,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  type CartItem,
} from '@/store/slices/cart-slice';

export function useCart() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const orderNotes = useAppSelector((s) => s.cart.specialNotes);

  return {
    items,
    total,
    itemCount,
    orderNotes,
    addItem: (item: Omit<CartItem, 'quantity'>) => dispatch(addItem(item)),
    removeItem: (dishId: string) => dispatch(removeItem(dishId)),
    updateQuantity: (dishId: string, quantity: number) =>
      dispatch(updateQuantity({ dishId, quantity })),
    updateItemNotes: (dishId: string, notes: string) =>
      dispatch(updateItemNotes({ dishId, notes })),
    setOrderNotes: (notes: string) => dispatch(setOrderNotes(notes)),
    clearCart: () => dispatch(clearCart()),
  };
}
