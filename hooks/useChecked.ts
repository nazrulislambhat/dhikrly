'use client';

import { useState, useEffect, useCallback } from 'react';
import { load, save, pruneOldEntries, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';

export function useChecked(totalDuas: number) {
  const today = getTodayKey();

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
    return all[today] ?? {};
  });

  useEffect(() => {
    const all = pruneOldEntries(STORAGE_KEY, 90);
    all[today] = checked;
    save(STORAGE_KEY, all);
  }, [checked, today]);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const reset = useCallback(() => {
    setChecked({});
  }, []);

  /** Mark all duas as complete for a specific day (missed-day recovery). */
  const markDayComplete = useCallback((dayKey: string, duaIds: string[]) => {
    const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
    const dayChecked: Record<string, boolean> = {};
    duaIds.forEach((id) => {
      dayChecked[id] = true;
    });
    all[dayKey] = dayChecked;
    save(STORAGE_KEY, all);
  }, []);

  const done = Object.values(checked).filter(Boolean).length;
  const pct = totalDuas > 0 ? Math.round((done / totalDuas) * 100) : 0;

  return { checked, toggle, reset, markDayComplete, done, pct, today };
}
