import {
  idbGet,
  idbSet,
  idbDel,
  idbGetAll,
  requestPersistentStorage,
  autoMigrateLocalStorageToIdb,
} from './idb';

export const STORAGE_KEY = 'duas_checked_v3';
export const SETTINGS_KEY = 'duas_settings_v3';
export const STREAK_KEY = 'duas_streak_v3';
export const CUSTOM_DUAS_KEY = 'duas_custom_v1';
export const NOTIFICATION_KEY = 'duas_notifications_v1';
export const NOTIF_FIRED_PREFIX = 'duas_notif_fired_';

export {
  idbGet,
  idbSet,
  idbDel,
  idbGetAll,
  requestPersistentStorage,
  autoMigrateLocalStorageToIdb,
};

/**
 * Synchronous read from localStorage (fastest initial render / SSR hydration safety)
 */
export function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Asynchronous read checking IndexedDB first, falling back to localStorage
 */
export async function loadAsync<T>(key: string, fallback: T): Promise<T> {
  if (typeof window === 'undefined') return fallback;
  try {
    const idbVal = await idbGet<T>(key);
    if (idbVal !== null && idbVal !== undefined) {
      return idbVal;
    }
    return load<T>(key, fallback);
  } catch {
    return fallback;
  }
}

/**
 * Synchronous save with automatic dual-write to IndexedDB
 * If localStorage quota is exceeded, writes seamlessly to IndexedDB without throwing
 */
export const save = (key: string, val: unknown): void => {
  if (typeof window === 'undefined') return;

  // 1. Dual-write to IndexedDB (unlimited quota, persistent)
  idbSet(key, val).catch(() => {
    // ignore
  });

  // 2. Write to localStorage for instant synchronous reads
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    // Storage quota exceeded in localStorage — safely absorbed by IndexedDB
    console.warn(`[Storage] localStorage quota reached for ${key}. Data preserved in IndexedDB.`, err);
  }
};

/**
 * Explicit asynchronous save to IndexedDB and localStorage
 */
export async function saveAsync(key: string, val: unknown): Promise<void> {
  if (typeof window === 'undefined') return;
  await idbSet(key, val);
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Quota handled
  }
}

/** Prune old daily entries, keeping only the last `maxDays` days. */
export function pruneOldEntries(
  key: string,
  maxDays = 365
): Record<string, Record<string, boolean>> {
  const all = load<Record<string, Record<string, boolean>>>(key, {});
  const keys = Object.keys(all).sort();
  if (keys.length > maxDays) {
    keys.slice(0, keys.length - maxDays).forEach((k) => delete all[k]);
    save(key, all);
  }
  return all;
}

/**
 * Initialize client storage: runs automatic migration from localStorage to IndexedDB
 * and requests persistent storage from browser
 */
let isInitialized = false;
export function initClientStorage(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  // Run in next idle tick so it never blocks UI rendering
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      autoMigrateLocalStorageToIdb();
      requestPersistentStorage();
    });
  } else {
    setTimeout(() => {
      autoMigrateLocalStorageToIdb();
      requestPersistentStorage();
    }, 1000);
  }
}
