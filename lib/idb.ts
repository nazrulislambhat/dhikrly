/**
 * Dhikrly Local-First IndexedDB Engine
 * High-performance, quota-free asynchronous storage with zero dependencies.
 */

const DB_NAME = 'dhikrly_local_db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

export function isIdbSupported(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!isIdbSupported()) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Get an item from IndexedDB
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  if (!isIdbSupported()) return null;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result !== undefined ? (req.result as T) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Set an item in IndexedDB
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  if (!isIdbSupported()) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to set ${key}:`, err);
  }
}

/**
 * Delete an item from IndexedDB
 */
export async function idbDel(key: string): Promise<void> {
  if (!isIdbSupported()) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to delete ${key}:`, err);
  }
}

/**
 * Get all key-value entries from IndexedDB
 */
export async function idbGetAll(): Promise<Record<string, unknown>> {
  if (!isIdbSupported()) return {};
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      const results: Record<string, unknown> = {};

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          results[cursor.key.toString()] = cursor.value;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
}

/**
 * Request persistent browser storage to prevent mobile browser storage eviction
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Automatically migrate all existing localStorage records into IndexedDB
 * Ensures 100% zero data loss when users upgrade
 */
export async function autoMigrateLocalStorageToIdb(): Promise<number> {
  if (typeof window === 'undefined') return 0;

  let migratedCount = 0;
  try {
    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('duas_') ||
          key.startsWith('dhikrly_') ||
          key.startsWith('salah_') ||
          key.startsWith('tasbih_') ||
          key.startsWith('qada_') ||
          key.startsWith('jumuah_'))
      ) {
        keysToMigrate.push(key);
      }
    }

    for (const key of keysToMigrate) {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          // Only write if not already in IndexedDB
          const existing = await idbGet(key);
          if (existing === null) {
            await idbSet(key, parsed);
            migratedCount++;
          }
        }
      } catch {
        // Skip unparseable items
      }
    }

    if (migratedCount > 0) {
      console.log(`[Storage Migration] Successfully migrated ${migratedCount} local records to IndexedDB.`);
    }
  } catch (err) {
    console.warn('[Storage Migration] Error during localStorage migration:', err);
  }

  return migratedCount;
}
