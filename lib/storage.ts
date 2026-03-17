export const STORAGE_KEY = 'duas_checked_v3';
export const SETTINGS_KEY = 'duas_settings_v3';
export const STREAK_KEY = 'duas_streak_v3';
export const CUSTOM_DUAS_KEY = 'duas_custom_v1';
export const NOTIFICATION_KEY = 'duas_notifications_v1';
export const NOTIF_FIRED_PREFIX = 'duas_notif_fired_';

export function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const save = (key: string, val: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Storage quota exceeded — fail silently
  }
};

/** Prune old daily entries, keeping only the last `maxDays` days. */
export function pruneOldEntries(
  key: string,
  maxDays = 90,
): Record<string, Record<string, boolean>> {
  const all = load<Record<string, Record<string, boolean>>>(key, {});
  const keys = Object.keys(all).sort();
  if (keys.length > maxDays) {
    keys.slice(0, keys.length - maxDays).forEach((k) => delete all[k]);
    save(key, all);
  }
  return all;
}
