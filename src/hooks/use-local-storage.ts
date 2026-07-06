'use client';

import { useSyncExternalStore, useCallback, useRef } from 'react';

/**
 * Persists state in localStorage with SSR safety.
 *
 * Uses `useSyncExternalStore` to read from localStorage without triggering
 * a cascading re-render on mount. Falls back to `initialValue` on the server.
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'dark');
 * const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebar', true);
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Cache the parsed value + raw string to provide stable references
  const cacheRef = useRef<{ value: T; raw: string | null }>({
    value: initialValue,
    raw: null,
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      // React to storage events from other tabs
      const storageHandler = (e: StorageEvent) => {
        if (e.key === key || e.key === null) {
          cacheRef.current = { value: initialValue, raw: null }; // bust cache
          onStoreChange();
        }
      };
      // React to writes from the same tab (dispatched by setValue)
      const customHandler = () => {
        cacheRef.current = { value: initialValue, raw: null }; // bust cache
        onStoreChange();
      };
      window.addEventListener('storage', storageHandler);
      window.addEventListener(`ls:${key}`, customHandler);
      return () => {
        window.removeEventListener('storage', storageHandler);
        window.removeEventListener(`ls:${key}`, customHandler);
      };
    },
    [key, initialValue]
  );

  const getSnapshot = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== cacheRef.current.raw) {
        cacheRef.current = {
          value: raw ? (JSON.parse(raw) as T) : initialValue,
          raw,
        };
      }
      return cacheRef.current.value;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const getServerSnapshot = useCallback((): T => initialValue, [initialValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const currentRaw = window.localStorage.getItem(key);
        const current = currentRaw
          ? (JSON.parse(currentRaw) as T)
          : initialValue;
        const valueToStore =
          newValue instanceof Function ? newValue(current) : newValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(new CustomEvent(`ls:${key}`));
      } catch (error) {
        console.warn(`useLocalStorage: failed to write key "${key}"`, error);
      }
    },
    [key, initialValue]
  );

  return [value, setValue];
}