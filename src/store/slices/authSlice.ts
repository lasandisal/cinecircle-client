import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import {
  authService,
  type RegisterPayload,
  type LoginPayload,
  type AuthResponseData,
} from '../../services/auth.service';
import { userService } from '../../services/user.service';
import { rotateAuthScope } from '../../services/requestCache';
import { readAuthHint } from '../../services/authHint';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Last known profile, used only so the first paint after a refresh shows the
// member UI instead of a guest navbar that flips a moment later. The HttpOnly
// cookie is still the real credential and /auth/me revalidates it on mount.
const hintedUser = readAuthHint();

const initialState: AuthState = {
  user: hintedUser,
  isAuthenticated: Boolean(hintedUser),
  loading: false,
  error: null,
  // `isInitialized` stays false until the server confirms the session, so
  // protected routes never render on the strength of the local hint alone.
  isInitialized: false,
};

// Async Thunks
export const registerUser = createAsyncThunk<
  AuthResponseData,
  RegisterPayload,
  { rejectValue: string }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { profileImage, ...credentials } = payload;
    const data = await authService.register(credentials);
    // A new session must not read responses cached while signed out.
    rotateAuthScope();

    // Upload after the session cookie is on the response so /users/avatar is
    // authenticated. Doing it here (not in the page) means GuestRoute can
    // unmount RegisterPage without dropping the file.
    if (profileImage) {
      try {
        const avatar = await userService.uploadAvatar(profileImage);
        const updated = await userService.updateProfile({ avatar });
        if (updated) data.user = { ...data.user, ...updated };
      } catch (uploadError) {
        console.error('Profile image upload failed after registration:', uploadError);
      }
    }

    return data;
  } catch (err: any) {
    const message = err.response?.data?.error || 'Registration failed. Please try again.';
    return rejectWithValue(message);
  }
});

export const loginUser = createAsyncThunk<
  AuthResponseData,
  LoginPayload,
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const data = await authService.login(payload);
    rotateAuthScope();
    return data;
  } catch (err: any) {
    const message = err.response?.data?.error || 'Login failed. Please check your credentials.';
    return rejectWithValue(message);
  }
});

export const fetchCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: { message: string; status?: number } }
>('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    // Always bypass the response cache here. Identity is the one thing that
    // must never be served stale: the hint used for the first paint can be a
    // moment old, so the bootstrap call is the authoritative check.
    return await authService.getMe({ fresh: true });
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.error || 'Session expired. Please sign in again.',
      status: err.response?.status,
    });
  }
});

/**
 * Re-read the signed-in account from the API, bypassing the response cache.
 *
 * The session cookie is shared by every tab of a browser, so signing in as a
 * different account in another tab silently changes who this tab is
 * authenticated as. Calling this on focus keeps the rendered user (and the
 * host-only controls that depend on it) aligned with the real cookie.
 */
export const refreshCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: { message: string; status?: number } }
>('auth/refreshMe', async (_, { rejectWithValue }) => {
  try {
    return await authService.getMe({ fresh: true });
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.error || 'Could not refresh session.',
      status: err.response?.status,
    });
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isInitialized = true;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      state.isInitialized = true;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Registration failed.';
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      state.isInitialized = true;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Login failed.';
    });

    // Fetch Current User
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      const status = action.payload?.status;

      // Only clear the session when the server explicitly rejected the cookie.
      // A cold-start network error or a 5xx must not sign a member out.
      if (status === 401 || status === 403 || status === 404) {
        state.user = null;
        state.isAuthenticated = false;
      }

      // Either way the bootstrap is over, so protected routes stop spinning.
      state.isInitialized = true;
    });

    // Refresh current user (focus / visibility revalidation)
    builder.addCase(refreshCurrentUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    });
    builder.addCase(refreshCurrentUser.rejected, (state, action) => {
      // Only sign the UI out when the server confirms the cookie is gone.
      // A network hiccup must not drop a signed-in member.
      if (action.payload?.status === 401 || action.payload?.status === 404) {
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      }
    });
  },
});

export const { setCredentials, logout, updateUser, clearError } = authSlice.actions;
export default authSlice.reducer;
