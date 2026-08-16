import { useState, useEffect, useCallback } from "react";

/**
 * Typed localStorage hook with:
 * - SSR safety (no window access during server render)
 * - JSON parse error guard (corrupt data falls back to initialValue)
 * - Writes are synchronous so the value is immediately available to other
 *   code in the same tick, but the state update is async as usual.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Keep in sync if another tab writes the same key
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== key) return;
      try {
        setValue(e.newValue !== null ? (JSON.parse(e.newValue) as T) : initialValue);
      } catch {
        setValue(initialValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, initialValue]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage quota exceeded — silently ignore
        }
        return resolved;
      });
    },
    [key],
  );

  const remove = useCallback(() => {
    window.localStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, set, remove] as const;
}
