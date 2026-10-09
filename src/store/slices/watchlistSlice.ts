import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { WatchlistItem } from '../../types';

interface WatchlistState {
  items: WatchlistItem[];
  loading: boolean;
}

const initialState: WatchlistState = {
  items: [],
  loading: false,
};

export const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setWatchlist: (state, action: PayloadAction<WatchlistItem[]>) => {
      state.items = action.payload;
    },
    addItem: (state, action: PayloadAction<WatchlistItem>) => {
      state.items.push(action.payload);
    },
    updateItemStatus: (
      state,
      action: PayloadAction<{ id: string; watched: boolean; starRating?: number }>
    ) => {
      const item = state.items.find((i) => i._id === action.payload.id);
      if (item) {
        item.watched = action.payload.watched;
        if (action.payload.starRating !== undefined) {
          item.starRating = action.payload.starRating;
        }
      }
    },
    setWatchlistLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setWatchlist, addItem, updateItemStatus, setWatchlistLoading } =
  watchlistSlice.actions;

export default watchlistSlice.reducer;
