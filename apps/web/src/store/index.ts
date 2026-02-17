import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { apiSlice } from './api/api-slice';
import cartReducer from './slices/cart-slice';
import menuReducer from './slices/menu-slice';
import orderReducer from './slices/order-slice';
import sessionReducer from './slices/session-slice';
import uiReducer from './slices/ui-slice';
import adminReducer from './slices/admin-slice';

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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
