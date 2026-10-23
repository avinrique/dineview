import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SessionEndReason = 'closed' | 'expired';

export interface SessionState {
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
  /** Why the last session ended, so the customer sees a sensible message. */
  endedReason: SessionEndReason | null;
}

export const initialSessionState: SessionState = {
  sessionToken: null,
  restaurantId: null,
  restaurantName: null,
  tableId: null,
  tableLabel: null,
  sessionId: null,
  currency: 'USD',
  settings: null,
  endedReason: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState: initialSessionState,
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
      state.endedReason = null;
    },
    endSession: (_state, action: PayloadAction<SessionEndReason>) => ({
      ...initialSessionState,
      endedReason: action.payload,
    }),
    clearSession: () => initialSessionState,
  },
});

export const { setSession, endSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
