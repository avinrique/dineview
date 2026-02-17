import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
  sessionToken: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  tableId: string | null;
  tableLabel: string | null;
  sessionId: string | null;
  currency: string;
  settings: {
    taxRate: number;
    enableAr: boolean;
    primaryColor: string;
    secondaryColor: string;
  } | null;
}

const initialState: SessionState = {
  sessionToken: null,
  restaurantId: null,
  restaurantName: null,
  tableId: null,
  tableLabel: null,
  sessionId: null,
  currency: 'USD',
  settings: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<{
      sessionToken: string;
      restaurant: { id: string; name: string; currency: string; settings: any };
      table: { id: string; label: string };
      session: { id: string };
    }>) => {
      const { sessionToken, restaurant, table, session } = action.payload;
      state.sessionToken = sessionToken;
      state.restaurantId = restaurant.id;
      state.restaurantName = restaurant.name;
      state.currency = restaurant.currency;
      state.settings = restaurant.settings;
      state.tableId = table.id;
      state.tableLabel = table.label;
      state.sessionId = session.id;
    },
    clearSession: () => initialState,
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
