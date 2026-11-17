import axios from 'axios';

const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const isLoopback = (hostname: string): boolean =>
  hostname === 'localhost' || hostname === '127.0.0.1';

/**
 * Resolve the API base URL.
 *
 * Production frontend and API sit on different vercel.app subdomains (the
 * public suffix list treats those as different sites). A Set-Cookie from the
 * API is then a third-party cookie, which Chrome will not store or send — so
 * register/login succeed and the very next call (avatar, onboarding, /auth/me)
 * comes back 401.
 *
 * Talking to `/api` on the page origin keeps the session cookie first-party.
 * Vercel rewrites that path to the real API (see cinecircle-fe/vercel.json).
 * Local Vite still calls localhost:5000 directly (same-site, different port).
 */
const resolveApiBaseUrl = (configured: string): string => {
  if (typeof window === 'undefined' || !configured.startsWith('http')) {
    return configured;
  }

  try {
    const apiUrl = new URL(configured);
    if (apiUrl.origin === window.location.origin) return configured;
    if (isLoopback(apiUrl.hostname) && isLoopback(window.location.hostname)) {
      return configured;
    }
    return '/api';
  } catch {
    return configured;
  }
};

export const API_BASE_URL = resolveApiBaseUrl(configuredApiBaseUrl);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // The session JWT lives in an HttpOnly cookie set by the API. `withCredentials`
  // makes the browser store that cookie and send it on every request.
  withCredentials: true,
  // Never let a stalled request hang the UI forever (the auth bootstrap waits
  // on /auth/me before deciding whether a protected page may render).
  timeout: 45_000,
});

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    // Instance default is application/json; FormData needs the browser to set
    // multipart/form-data with the correct boundary.
    config.headers.set('Content-Type', false);
  }
  return config;
});

// No request interceptor is needed any more: there is no token for JavaScript
// to attach, which is the point of the cookie migration.
