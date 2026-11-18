import { useCallback, useRef, useState } from 'react';

/**
 * Tracks in-flight mutations by key so buttons can dim and ignore repeat
 * clicks while their request is still running.
 *
 * A `Set` in a ref mirrors the state because React batches updates: without
 * the ref, two clicks inside the same frame would both see the old value and
 * fire two requests before the button re-renders as disabled.
 *
 * Preferred usage:
 *   const { run, isPending } = usePendingActions();
 *   <button
 *     disabled={isPending(`like:${id}`)}
 *     onClick={() => run(`like:${id}`, () => api.like(id))}
 *   />
 *
 * For handlers that already own a try/catch, use begin/end:
 *   if (!begin(key)) return;
 *   try { ... } finally { end(key); }
 */
export const usePendingActions = () => {
  const inFlight = useRef<Set<string>>(new Set());
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const begin = useCallback((key: string): boolean => {
    if (inFlight.current.has(key)) return false;
    inFlight.current.add(key);
    setPending(new Set(inFlight.current));
    return true;
  }, []);

  const end = useCallback((key: string): void => {
    inFlight.current.delete(key);
    setPending(new Set(inFlight.current));
  }, []);

  const run = useCallback(
    async <T,>(key: string, task: () => Promise<T>): Promise<T | undefined> => {
      if (!begin(key)) return undefined;
      try {
        return await task();
      } finally {
        end(key);
      }
    },
    [begin, end]
  );

  const isPending = useCallback((key: string) => pending.has(key), [pending]);

  return { begin, end, run, isPending };
};
