import { useEffect, useRef } from 'react';

/**
 * Runs a callback on a repeating interval.
 *
 * Pass `null` as the delay to pause the interval.
 * The callback ref is kept up-to-date without restarting the timer.
 *
 * @example
 * ```tsx
 * useInterval(() => {
 *   fetchLatestData();
 * }, isPolling ? 5000 : null);
 * ```
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}