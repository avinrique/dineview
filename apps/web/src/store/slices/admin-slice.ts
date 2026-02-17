import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    restaurantId: string | null;
  } | null;
}

const initialState: AdminState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
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
    clearCredentials: () => initialState,
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
});

export const { setCredentials, clearCredentials, updateTokens } = adminSlice.actions;
export default adminSlice.reducer;
