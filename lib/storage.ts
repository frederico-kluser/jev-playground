/**
 * Safe localStorage access.
 *
 * Reading `window.localStorage` throws a SecurityError when site data is
 * blocked (common on hardened corporate browsers). Every storage touch in this
 * app goes through these helpers: they never throw and degrade to an in-memory
 * map, so the playground keeps working for the session instead of blanking.
 */

const memoryFallback = new Map<string, string>();

/** Reads a raw string; `null` when absent or storage is unavailable. */
export function safeGet(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) return value;
    } catch {
      /* fall through to memory */
    }
  }
  return memoryFallback.get(key) ?? null;
}

/** Writes a raw string. Silently degrades to memory when storage is blocked. */
export function safeSet(key: string, value: string): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, value);
      memoryFallback.delete(key);
      return;
    } catch {
      /* fall through to memory */
    }
  }
  memoryFallback.set(key, value);
}

/** Removes a key from persistent storage and the memory fallback. */
export function safeRemove(key: string): void {
  memoryFallback.delete(key);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** JSON convenience reader; `null` on absence or malformed payloads. */
export function safeGetJson<T>(key: string): T | null {
  const raw = safeGet(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** JSON convenience writer; no-op when the value cannot be serialized. */
export function safeSetJson(key: string, value: unknown): void {
  try {
    safeSet(key, JSON.stringify(value));
  } catch {
    /* ignore circular / non-serializable values */
  }
}