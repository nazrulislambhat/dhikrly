import type { DayLog, SalahSettings, PrayerName } from '@/types/salah';

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
};

export function getSalahSettings(): SalahSettings {
  return loadSalah<SalahSettings>(SETTINGS_KEY, DEFAULT_SALAH_SETTINGS);
}

export function saveSalahSettings(s: SalahSettings): void {
  saveSalah(SETTINGS_KEY, s);
}

export function computeDayScore(log: DayLog): number {
  const prayers = Object.values(log.prayers) as (string | null)[];
  const prayed = prayers.filter(p => p === 'prayed' || p === 'jamah').length;
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
