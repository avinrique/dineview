import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UiState {
  isSidebarOpen: boolean;
  notifications: Notification[];
  isLoading: boolean;
  /** Dark screens (the guest menu): the bottom nav goes dark too. */
  immersive: boolean;
}

const initialState: UiState = {
  isSidebarOpen: false,
  notifications: [],
  isLoading: false,
  immersive: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setImmersive: (state, action: PayloadAction<boolean>) => {
      state.immersive = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, addNotification, removeNotification, setLoading, setImmersive } =
  uiSlice.actions;

let nextId = 0;
/** Toast helper: `dispatch(notify('success', 'Saved'))` */
export function notify(type: Notification['type'], message: string, duration = 4000) {
  nextId += 1;
  return addNotification({ id: `n${Date.now()}-${nextId}`, type, message, duration });
}
export default uiSlice.reducer;
