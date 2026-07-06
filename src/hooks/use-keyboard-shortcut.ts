'use client';

import { useEffect } from 'react';

/**
 * Registers a keyboard shortcut (key + optional modifiers).
 *
 * @example
 * ```tsx
 * // Ctrl+K to open command palette
 * useKeyboardShortcut('k', () => setOpen(true), { ctrl: true });
 *
 * // Escape to close
 * useKeyboardShortcut('Escape', () => setOpen(false));
 *
 * // Ctrl+Shift+P for settings
 * useKeyboardShortcut('p', openSettings, { ctrl: true, shift: true });
 * ```
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  } = {}
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const keyMatch = e.key === key;
      const ctrlMatch = modifiers.ctrl ? e.ctrlKey : true;
      const shiftMatch = modifiers.shift ? e.shiftKey : true;
      const altMatch = modifiers.alt ? e.altKey : true;
      const metaMatch = modifiers.meta ? e.metaKey : true;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    key,
    callback,
    modifiers.ctrl,
    modifiers.shift,
    modifiers.alt,
    modifiers.meta,
  ]);
}