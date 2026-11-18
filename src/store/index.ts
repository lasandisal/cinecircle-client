import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import recommendationReducer from './slices/recommendationSlice';
import sessionReducer from './slices/sessionSlice';
import watchlistReducer from './slices/watchlistSlice';
import { clearAuthHint, writeAuthHint } from '../services/authHint';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recommendation: recommendationReducer,
    session: sessionReducer,
    watchlist: watchlistReducer,
  },
});

/**
 * Mirror the auth slice into the small display hint read by `authSlice` at
 * startup. Keeping persistence here (instead of inside reducers) keeps the
 * reducers pure and gives exactly one write path: every login, profile update,
 * account switch and logout is reflected automatically.
 */
let lastHintedUser = store.getState().auth.user;
store.subscribe(() => {
  const { user, isAuthenticated } = store.getState().auth;
  const nextUser = isAuthenticated ? user : null;

  // Immer keeps the same reference when nothing changed, so this skips the
  // many unrelated dispatches (e.g. session/vote events).
  if (nextUser === lastHintedUser) return;
  lastHintedUser = nextUser;

  if (nextUser) writeAuthHint(nextUser);
  else clearAuthHint();
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { useAppDispatch, useAppSelector } from '../hooks/useAppRedux';
