'use client';

import { useState, useEffect, useCallback } from 'react';
import { load, save, pruneOldEntries, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';

export function useChecked(totalDuas: number) {
  // Keep today as state so it can change at midnight without a page reload
  const [today, setToday] = useState<string>(getTodayKey);

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
    return all[getTodayKey()] ?? {};
  });

  // ── Midnight auto-reset ──────────────────────────────────────────────────
  // Calculate exact ms until next midnight and set a timer to flip the day.
  useEffect(() => {
    const msUntilMidnight = (): number => {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // tomorrow at 00:00:00.000
        0, 0, 0, 0
      );
      return midnight.getTime() - now.getTime();
    };

    const schedule = () => {
      const timer = setTimeout(() => {
        const newDay = getTodayKey();
        setToday(newDay);
        // Load whatever exists for the new day (empty object = fresh start)
        const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
        setChecked(all[newDay] ?? {});
        // Re-schedule for the following midnight
        schedule();
      }, msUntilMidnight());

      return timer;
    };

    const timer = schedule();
    return () => clearTimeout(timer);
  }, []);
  // ────────────────────────────────────────────────────────────────────────

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
  const markDayComplete = useCallback(
    (dayKey: string, duaIds: string[]) => {
      const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      const dayChecked: Record<string, boolean> = {};
      duaIds.forEach((id) => {
        dayChecked[id] = true;
      });
      all[dayKey] = dayChecked;
      save(STORAGE_KEY, all);
    },
    []
  );

  const done = Object.values(checked).filter(Boolean).length;
  const pct = totalDuas > 0 ? Math.round((done / totalDuas) * 100) : 0;

  return { checked, toggle, reset, markDayComplete, done, pct, today };
}
