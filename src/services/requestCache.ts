import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from './api';

type CacheOptions = {
  ttlMs?: number;
  staleWhileRevalidateMs?: number;
  persist?: boolean;
};

type CacheEntry = {
  response: AxiosResponse;
  expiresAt: number;
  staleUntil: number;
};

type PersistedCacheEntry = {
  data: unknown;
  status: number;
  statusText: string;
  headers: AxiosResponse['headers'];
  expiresAt: number;
  staleUntil: number;
};

const STORAGE_PREFIX = 'cinecircle_api_cache_v1:';
const memoryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<AxiosResponse>>();

const stableSerialize = (value: unknown): string => {
  if (value === undefined) return '';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
    .join(',')}}`;
};

const getAuthScope = (): string => {
  const token = localStorage.getItem('cinecircle_token');
  return token ? `user:${token.slice(-16)}` : 'guest';
};

const createKey = (url: string, config: AxiosRequestConfig | undefined, persist: boolean): string =>
  `${persist ? 'public' : getAuthScope()}:${url}:${stableSerialize(config?.params)}`;

const readPersisted = (key: string): CacheEntry | undefined => {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return undefined;
    const persisted = JSON.parse(raw) as PersistedCacheEntry;
    if (!persisted || !persisted.expiresAt || !persisted.staleUntil) return undefined;
    return {
      response: {
        data: persisted.data,
        status: persisted.status,
        statusText: persisted.statusText,
        headers: persisted.headers,
        config: {},
      } as AxiosResponse,
      expiresAt: persisted.expiresAt,
      staleUntil: persisted.staleUntil,
    };
  } catch {
    return undefined;
  }
};

const writePersisted = (key: string, entry: CacheEntry): void => {
  try {
    const persisted: PersistedCacheEntry = {
      data: entry.response.data,
      status: entry.response.status,
      statusText: entry.response.statusText,
      headers: entry.response.headers,
      expiresAt: entry.expiresAt,
      staleUntil: entry.staleUntil,
    };
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(persisted));
  } catch {
    // Cache persistence is an optimization; quota and private-mode errors
    // must not affect the request itself.
  }
};

const request = <T>(
  key: string,
  url: string,
  config: AxiosRequestConfig | undefined,
  options: Required<CacheOptions>
): Promise<AxiosResponse<T>> => {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<AxiosResponse<T>>;

  const promise = api.get<T>(url, config).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);

  promise.then(
    (response) => {
      const now = Date.now();
      const entry: CacheEntry = {
        response,
        expiresAt: now + options.ttlMs,
        staleUntil: now + options.ttlMs + options.staleWhileRevalidateMs,
      };
      memoryCache.set(key, entry);
      if (options.persist) writePersisted(key, entry);
    },
    () => undefined
  );

  return promise;
};

export const cachedGet = async <T = any>(
  url: string,
  config?: AxiosRequestConfig,
  options: CacheOptions = {}
): Promise<AxiosResponse<T>> => {
  const resolved: Required<CacheOptions> = {
    ttlMs: options.ttlMs ?? 30_000,
    staleWhileRevalidateMs: options.staleWhileRevalidateMs ?? 120_000,
    persist: options.persist ?? false,
  };
  const key = createKey(url, config, resolved.persist);
  const now = Date.now();
  let entry = memoryCache.get(key);

  if (!entry && resolved.persist) {
    entry = readPersisted(key);
    if (entry) memoryCache.set(key, entry);
  }

  if (entry && now < entry.expiresAt) {
    return entry.response as AxiosResponse<T>;
  }

  if (entry && now < entry.staleUntil) {
    void request<T>(key, url, config, resolved).catch(() => undefined);
    return entry.response as AxiosResponse<T>;
  }

  return request<T>(key, url, config, resolved);
};

export const invalidateCache = (patterns: string[] = []): void => {
  if (patterns.length === 0) {
    memoryCache.clear();
    inFlight.clear();
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
    return;
  }

  for (const key of memoryCache.keys()) {
    if (patterns.some((pattern) => key.includes(pattern))) memoryCache.delete(key);
  }
  Object.keys(sessionStorage)
    .filter(
      (key) =>
        key.startsWith(STORAGE_PREFIX) &&
        patterns.some((pattern) => key.includes(pattern))
    )
    .forEach((key) => sessionStorage.removeItem(key));
};

export const refreshCache = (patterns: string[] = []): void => {
  invalidateCache(patterns);
};

/**
 * Drop every cached response that belongs to the CURRENT auth scope.
 *
 * Critical for access control: the cache lives in sessionStorage, which
 * survives a logout. Without this, the next person to sign in on the same
 * browser would read the previous user's cached responses (e.g. their watch
 * circles and their join codes) before the first network request lands.
 */
export const clearAuthScopedCache = (): void => {
  const scope = getAuthScope();
  const prefix = `${scope}:`;

  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith(STORAGE_PREFIX) && key.includes(prefix)) {
      sessionStorage.removeItem(key);
    }
  }
};

/** Nuclear option - wipe every cached response (public + user scoped). */
export const clearAllCache = (): void => {
  invalidateCache([]);
};
