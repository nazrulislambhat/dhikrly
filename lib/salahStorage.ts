import type {
  DayLog,
  SalahSettings,
  PrayerStatus,
  LocalMasjidSettings,
  LocalMasjidItem,
} from '@/types/salah';
import { MAX_LOCAL_MASJIDS } from '@/types/salah';

/** Delayed counts as prayed — the prayer was performed, just not on time */
export const isPrayed = (s: PrayerStatus): boolean =>
  s === 'prayed' || s === 'jamah' || s === 'delayed';

const LOG_KEY = 'salah_log_v1';
const SETTINGS_KEY = 'salah_settings_v1';

function ls(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function loadSalah<T>(key: string, fallback: T): T {
  try {
    const raw = ls()?.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function saveSalah(key: string, val: unknown): void {
  try { ls()?.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

export function emptyDay(date: string): DayLog {
  return {
    date,
    prayers: { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null },
    sunnah: { fajrPre: false, dhuhrPre: false, dhuhrPost: false, asrPre: false, maghribPost: false, ishaPost: false },
    tahajjud: { prayed: false, rakats: 0, durationMinutes: 0 },
    nafl: { ishraq: false, duha: false, awwabin: false },
  };
}

export function getAllLogs(): Record<string, DayLog> {
  return loadSalah<Record<string, DayLog>>(LOG_KEY, {});
}

export function getDayLog(date: string): DayLog {
  const all = getAllLogs();
  return all[date] ?? emptyDay(date);
}

export function saveDayLog(log: DayLog): void {
  const all = getAllLogs();
  all[log.date] = log;
  const keys = Object.keys(all).sort();
  if (keys.length > 120) keys.slice(0, keys.length - 120).forEach(k => delete all[k]);
  saveSalah(LOG_KEY, all);
}

export const DEFAULT_SALAH_SETTINGS: SalahSettings = {
  calcMethod: 'Karachi',
  asrMethod: 'Standard',
  trackSunnah: true,
  trackTahajjud: true,
  trackNafl: true,
  tahajjudNotif: false,
  location: null,
  localMasjid: null,
  localMasjids: [],
  selectedMasjidId: null,
};

export function getSalahSettings(): SalahSettings {
  return loadSalah<SalahSettings>(SETTINGS_KEY, DEFAULT_SALAH_SETTINGS);
}

export function saveSalahSettings(s: SalahSettings): void {
  saveSalah(SETTINGS_KEY, s);
}

/** Returns the list of up to 5 local masjids */
export function getLocalMasjidsList(settings?: SalahSettings): LocalMasjidItem[] {
  const s = settings ?? getSalahSettings();
  if (s.localMasjids && Array.isArray(s.localMasjids) && s.localMasjids.length > 0) {
    return s.localMasjids.slice(0, MAX_LOCAL_MASJIDS);
  }
  if (s.localMasjid?.masjids && Array.isArray(s.localMasjid.masjids) && s.localMasjid.masjids.length > 0) {
    return s.localMasjid.masjids.slice(0, MAX_LOCAL_MASJIDS);
  }
  // Migration fallback from single localMasjid if exists
  if (s.localMasjid && s.localMasjid.masjidName) {
    return [
      {
        id: s.localMasjid.selectedId || 'masjid_default',
        name: s.localMasjid.masjidName,
        label: 'Primary',
        notes: s.localMasjid.notes,
        timings: s.localMasjid.timings || {},
        updatedAt: s.localMasjid.updatedAt || new Date().toISOString(),
      },
    ];
  }
  return [];
}

/** Returns the active / selected masjid */
export function getActiveLocalMasjid(settings?: SalahSettings): LocalMasjidItem | null {
  const s = settings ?? getSalahSettings();
  const list = getLocalMasjidsList(s);
  if (list.length === 0) return null;
  const activeId = s.selectedMasjidId ?? s.localMasjid?.selectedId;
  const found = list.find((m) => m.id === activeId);
  return found ?? list[0];
}

/** Save list of up to 5 local masjids and active selection */
export function saveLocalMasjidsList(
  masjids: LocalMasjidItem[],
  selectedId?: string | null,
): void {
  const current = getSalahSettings();
  const capped = masjids.slice(0, MAX_LOCAL_MASJIDS);
  const activeId = selectedId !== undefined ? selectedId : (current.selectedMasjidId ?? capped[0]?.id ?? null);
  const activeMasjid = capped.find((m) => m.id === activeId) ?? capped[0] ?? null;

  const updated: SalahSettings = {
    ...current,
    localMasjids: capped,
    selectedMasjidId: activeId,
    // Keep localMasjid in sync for backward compatibility
    localMasjid: activeMasjid
      ? {
          enabled: true,
          masjidName: activeMasjid.name,
          notes: activeMasjid.notes,
          timings: activeMasjid.timings,
          updatedAt: activeMasjid.updatedAt,
          masjids: capped,
          selectedId: activeId,
        }
      : null,
  };

  saveSalahSettings(updated);
}

export function getLocalMasjidSettings(): LocalMasjidSettings | null {
  const active = getActiveLocalMasjid();
  if (!active) return null;
  const all = getLocalMasjidsList();
  return {
    enabled: true,
    masjidName: active.name,
    notes: active.notes,
    timings: active.timings,
    updatedAt: active.updatedAt,
    masjids: all,
    selectedId: active.id,
  };
}

export function saveLocalMasjidSettings(localMasjid: LocalMasjidSettings | null): void {
  if (!localMasjid) {
    saveLocalMasjidsList([], null);
    return;
  }
  if (localMasjid.masjids && localMasjid.masjids.length > 0) {
    saveLocalMasjidsList(localMasjid.masjids, localMasjid.selectedId);
    return;
  }
  const item: LocalMasjidItem = {
    id: localMasjid.selectedId || 'masjid_default',
    name: localMasjid.masjidName,
    notes: localMasjid.notes,
    timings: localMasjid.timings || {},
    updatedAt: localMasjid.updatedAt || new Date().toISOString(),
  };
  saveLocalMasjidsList([item], item.id);
}

export function computeDayScore(log: DayLog): number {
  const prayers = Object.values(log.prayers);
  const prayed = prayers.filter(p => isPrayed(p)).length;
  return prayed / 5;
}

export function getRecentLogs(days: number): DayLog[] {
  const all = getAllLogs();
  const result: DayLog[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(all[key] ?? emptyDay(key));
  }
  return result;
}
