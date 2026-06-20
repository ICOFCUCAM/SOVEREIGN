import { useEffect, useRef, useState } from "react";

// Drop-in useState that autosaves to localStorage and recovers the value on the
// next visit (draft recovery). Returns a third element to clear the saved draft.
export function usePersistentState<T>(key: string, initial: T): [T, (v: T) => void, () => void] {
  const storageKey = `pp:draft:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s != null ? (JSON.parse(s) as T) : initial;
    } catch {
      return initial;
    }
  });

  const t = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* quota / private mode */ }
    }, 400);
    return () => { if (t.current) window.clearTimeout(t.current); };
  }, [storageKey, value]);

  const clear = () => { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } };
  return [value, setValue, clear];
}
