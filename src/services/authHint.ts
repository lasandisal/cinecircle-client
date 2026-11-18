import type { User } from '../types';

/**
 * Non-sensitive snapshot of the signed-in member.
 *
 * Why this exists: the credential is an HttpOnly cookie, so JavaScript cannot
 * inspect it during the first render after a refresh. Without a hint the store
 * starts as "guest", the navbar renders Sign In / Get Started, and the home
 * page renders the guest hero - then /auth/me answers and the UI flips to the
 * member view. That flash looks like "logged out, then instantly logged in".
 *
 * This stores ONLY the public profile fields the UI already renders (name,
 * avatar, role, ...). The JWT is never stored here and remains unreadable by
 * JavaScript. The API is still the authority: App revalidates /auth/me on every
 * load and the hint is cleared on logout or a 401.
 */

const AUTH_HINT_KEY = 'cinecircle_auth_hint_v1';

type StoredHint = { user?: User };

export const readAuthHint = (): User | null => {
  try {
    const raw = localStorage.getItem(AUTH_HINT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredHint;
    const user = parsed?.user;
    if (!user || typeof user !== 'object' || typeof user._id !== 'string') {
      return null;
    }
    return user;
  } catch {
    // Storage blocked / corrupted value: treat as a guest and let /auth/me
    // decide. The only cost is the one-time flash this hint exists to avoid.
    return null;
  }
};

export const writeAuthHint = (user: User): void => {
  try {
    localStorage.setItem(AUTH_HINT_KEY, JSON.stringify({ user }));
  } catch {
    // Quota or private mode: not fatal, the app still works.
  }
};

export const clearAuthHint = (): void => {
  try {
    localStorage.removeItem(AUTH_HINT_KEY);
  } catch {
    // Ignore.
  }
};
