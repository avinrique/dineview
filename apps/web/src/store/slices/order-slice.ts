import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OrderState {
  activeOrderIds: string[];
  lastOrderId: string | null;
}

const initialState: OrderState = {
  activeOrderIds: [],
  lastOrderId: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    addActiveOrder: (state, action: PayloadAction<string>) => {
      if (!state.activeOrderIds.includes(action.payload)) {
        state.activeOrderIds.push(action.payload);
      }
      state.lastOrderId = action.payload;
    },
    removeActiveOrder: (state, action: PayloadAction<string>) => {
      state.activeOrderIds = state.activeOrderIds.filter((id) => id !== action.payload);
    },
    setLastOrderId: (state, action: PayloadAction<string>) => {
      state.lastOrderId = action.payload;
    },
  },
});

export const { addActiveOrder, removeActiveOrder, setLastOrderId } = orderSlice.actions;
export default orderSlice.reducer;
