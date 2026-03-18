'use client';

import { useState, useEffect, useCallback } from 'react';
import { load, save, pruneOldEntries, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import { playCheck, playUncheck, playComplete } from '@/lib/sounds';

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

  const toggle = useCallback(
    (id: string, soundEnabled = true) => {
      setChecked((prev) => {
        const wasChecked = !!prev[id];
        const next = { ...prev, [id]: !wasChecked };

        if (soundEnabled) {
          // Play completion fanfare if this toggle completes all duas
          const newDone = Object.values(next).filter(Boolean).length;
          if (!wasChecked && newDone === totalDuas && totalDuas > 0) {
            // slight delay so the check animation renders first
            setTimeout(playComplete, 80);
          } else {
            wasChecked ? playUncheck() : playCheck();
          }
        }

        return next;
      });
    },
    [totalDuas]
  );

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

  return { checked, setChecked, toggle, reset, markDayComplete, done, pct, today };
}
