import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MenuState {
  activeCategory: string | null;
  searchQuery: string;
}

const initialState: MenuState = {
  activeCategory: null,
  searchQuery: '',
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setActiveCategory: (state, action: PayloadAction<string | null>) => {
      state.activeCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { setActiveCategory, setSearchQuery } = menuSlice.actions;
export default menuSlice.reducer;
