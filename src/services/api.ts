import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://cinecircle-server.vercel.app/api');

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

// No request interceptor is needed any more: there is no token for JavaScript
// to attach, which is the point of the cookie migration.
