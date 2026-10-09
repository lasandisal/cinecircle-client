import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import recommendationReducer from './slices/recommendationSlice';
import sessionReducer from './slices/sessionSlice';
import watchlistReducer from './slices/watchlistSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recommendation: recommendationReducer,
    session: sessionReducer,
    watchlist: watchlistReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
