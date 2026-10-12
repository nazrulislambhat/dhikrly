import { emptyDay } from './salahStorage';
import type { DayLog, PrayerName, PrayerStatus } from '../types/salah';
import { PRAYERS, SUNNAH_DEF } from '../types/salah';

export type PracticeArea = 'adhkar' | 'salah';

export interface PracticeEntry {
  date: string;
  area: PracticeArea;
  item_key: string;
  value: unknown;
  updated_at: string;
}

export interface PracticeEntryWrite extends PracticeEntry {
  user_id: string;
}

export function adhkarEntries(
  date: string,
  checked: Record<string, boolean>,
  updatedAt = new Date().toISOString(),
): PracticeEntry[] {
  return Object.entries(checked).map(([item_key, value]) => ({
    date,
    area: 'adhkar',
    item_key,
    value,
    updated_at: updatedAt,
  }));
}

export function checkedFromEntries(entries: PracticeEntry[]): Record<string, boolean> {
  const checked: Record<string, boolean> = {};
  for (const entry of entries) {
    if (entry.area === 'adhkar' && typeof entry.value === 'boolean') {
      checked[entry.item_key] = entry.value;
    }
  }
  return checked;
}

export function diffChecked(
  next: Record<string, boolean>,
  previous: Record<string, boolean>,
): Record<string, boolean> {
  const changed: Record<string, boolean> = {};
  for (const key of new Set([...Object.keys(next), ...Object.keys(previous)])) {
    if (key in next && next[key] !== previous[key]) changed[key] = next[key];
    else if (!(key in next) && previous[key] !== false) changed[key] = false;
  }
  return changed;
}

function salahValues(log: DayLog): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const prayer of PRAYERS) values[`prayer:${prayer}`] = log.prayers[prayer];
  for (const item of SUNNAH_DEF) values[`sunnah:${item.key}`] = log.sunnah[item.key];
  values['night:tahajjud'] = log.tahajjud;
  for (const [key, value] of Object.entries(log.nafl)) values[`nafl:${key}`] = value;
  return values;
}

export function salahEntries(
  log: DayLog,
  updatedAt = new Date().toISOString(),
): PracticeEntry[] {
  return Object.entries(salahValues(log)).map(([item_key, value]) => ({
    date: log.date,
    area: 'salah',
    item_key,
    value,
    updated_at: updatedAt,
  }));
}

export function diffSalah(
  next: DayLog,
  previous: DayLog,
): PracticeEntry[] {
  const nextValues = salahValues(next);
  const previousValues = salahValues(previous);
  const changed: PracticeEntry[] = [];
  for (const [item_key, value] of Object.entries(nextValues)) {
    if (JSON.stringify(value) !== JSON.stringify(previousValues[item_key])) {
      changed.push({
        date: next.date,
        area: 'salah',
        item_key,
        value,
        updated_at: new Date().toISOString(),
      });
    }
  }
  return changed;
}

export function salahFromEntries(date: string, entries: PracticeEntry[]): DayLog {
  const log = emptyDay(date);
  for (const entry of entries) {
    if (entry.area !== 'salah') continue;
    const [group, key] = entry.item_key.split(':', 2);
    if (group === 'prayer' && PRAYERS.includes(key as PrayerName)) {
      const value = entry.value;
      if (value === null || ['prayed', 'jamah', 'delayed', 'missed'].includes(String(value))) {
        log.prayers[key as PrayerName] = value as PrayerStatus;
      }
    } else if (group === 'sunnah' && key in log.sunnah && typeof entry.value === 'boolean') {
      log.sunnah[key as keyof DayLog['sunnah']] = entry.value;
    } else if (group === 'night' && key === 'tahajjud' && typeof entry.value === 'object' && entry.value !== null) {
      const value = entry.value as Partial<DayLog['tahajjud']>;
      log.tahajjud = {
        prayed: value.prayed === true,
        rakats: typeof value.rakats === 'number' ? value.rakats : 0,
        durationMinutes: typeof value.durationMinutes === 'number' ? value.durationMinutes : 0,
      };
    } else if (group === 'nafl' && key in log.nafl && typeof entry.value === 'boolean') {
      log.nafl[key as keyof DayLog['nafl']] = entry.value;
    }
  }
  return log;
}

export function latestPracticeEntries(entries: PracticeEntry[]): PracticeEntry[] {
  const latest = new Map<string, PracticeEntry>();
  for (const entry of entries) {
    const key = `${entry.date}:${entry.area}:${entry.item_key}`;
    const previous = latest.get(key);
    if (!previous || Date.parse(entry.updated_at) >= Date.parse(previous.updated_at)) {
      latest.set(key, entry);
    }
  }
  return [...latest.values()];
}
