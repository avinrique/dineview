import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { apiSlice } from './api/api-slice';
import cartReducer from './slices/cart-slice';
import menuReducer from './slices/menu-slice';
import orderReducer from './slices/order-slice';
import sessionReducer from './slices/session-slice';
import uiReducer from './slices/ui-slice';
import adminReducer from './slices/admin-slice';
import { loadPersistedState, persistState } from './persist';

const isBrowser = typeof window !== 'undefined';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    cart: cartReducer,
    menu: menuReducer,
    order: orderReducer,
    session: sessionReducer,
    ui: uiReducer,
    admin: adminReducer,
  },
  preloadedState: isBrowser ? loadPersistedState() : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

if (isBrowser) {
  persistState(store);
  // Enables refetchOnFocus / refetchOnReconnect (phone tab coming back to the foreground)
  setupListeners(store.dispatch);
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
