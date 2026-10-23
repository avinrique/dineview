import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AdminState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    restaurantId: string | null;
    restaurantName?: string | null;
    currency?: string;
  } | null;
}

export const initialAdminState: AdminState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState: initialAdminState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      user: AdminState['user'];
    }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    clearCredentials: () => initialAdminState,
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setRestaurantInfo: (state, action: PayloadAction<{ restaurantName: string; currency: string }>) => {
      if (state.user) {
        state.user.restaurantName = action.payload.restaurantName;
        state.user.currency = action.payload.currency;
      }
    },
  },
});

export const { setCredentials, clearCredentials, updateTokens, setRestaurantInfo } = adminSlice.actions;
export default adminSlice.reducer;
