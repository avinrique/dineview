import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  specialNotes?: string;
}

interface CartState {
  items: CartItem[];
  specialNotes: string;
}

const initialState: CartState = {
  items: [],
  specialNotes: '',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, 'quantity'>>) => {
      const existing = state.items.find((i) => i.dishId === action.payload.dishId);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.dishId !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ dishId: string; quantity: number }>) => {
      const item = state.items.find((i) => i.dishId === action.payload.dishId);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i.dishId !== action.payload.dishId);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
    },
    updateItemNotes: (state, action: PayloadAction<{ dishId: string; notes: string }>) => {
      const item = state.items.find((i) => i.dishId === action.payload.dishId);
      if (item) {
        item.specialNotes = action.payload.notes;
      }
    },
    setOrderNotes: (state, action: PayloadAction<string>) => {
      state.specialNotes = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.specialNotes = '';
    },
  },
});

export const { addItem, removeItem, updateQuantity, updateItemNotes, setOrderNotes, clearCart } =
  cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

export default cartSlice.reducer;
