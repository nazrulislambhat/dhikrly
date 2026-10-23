'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { load, save, pruneOldEntries, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import { playCheck, playUncheck, playComplete } from '@/lib/sounds';
import { markLocalEdit } from '@/lib/localEdits';

export interface UseCheckedOptions {
  onCompleteAll?: () => void;
}

export function useChecked(totalDuas: number, options?: UseCheckedOptions) {
  const today = getTodayKey();
  const localRevision = useRef(0);
  const onCompleteAllRef = useRef(options?.onCompleteAll);

  useEffect(() => {
    onCompleteAllRef.current = options?.onCompleteAll;
  }, [options?.onCompleteAll]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const isLoaded = useRef(false);

  useEffect(() => {
    const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
    setChecked(all[today] ?? {});
    isLoaded.current = true;
  }, [today]);

  useEffect(() => {
    if (!isLoaded.current) return;
    const all = pruneOldEntries(STORAGE_KEY, 365);
    all[today] = checked;
    save(STORAGE_KEY, all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dhikrly:adhkar-updated'));
    }
  }, [checked, today]);

  const toggle = useCallback(
    (id: string, soundEnabled = true) => {
      localRevision.current += 1;
      markLocalEdit('adhkar', today, id);
      setChecked((prev) => {
        const wasChecked = !!prev[id];
        const next = { ...prev, [id]: !wasChecked };
        const newDone = Object.values(next).filter(Boolean).length;

        if (!wasChecked && newDone === totalDuas && totalDuas > 0) {
          // Trigger celebration callback only when an active user tap completes the last remaining adhkar
          onCompleteAllRef.current?.();
          if (soundEnabled) {
            // slight delay so the check animation renders first
            setTimeout(playComplete, 80);
          }
        } else if (soundEnabled) {
          if (wasChecked) playUncheck();
          else playCheck();
        }

        return next;
      });
    },
    [today, totalDuas]
  );

  const reset = useCallback(() => {
    localRevision.current += 1;
    markLocalEdit('adhkar', today);
    const resetState = Object.fromEntries(
      Object.keys(checked).map((id) => {
        markLocalEdit('adhkar', today, id);
        return [id, false];
      }),
    );
    setChecked(resetState);
  }, [checked, today]);

  /** Mark all duas as complete for a specific day (missed-day recovery). */
  const markDayComplete = useCallback(
    (dayKey: string, duaIds: string[]) => {
      const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      const dayChecked: Record<string, boolean> = {};
      duaIds.forEach((id) => {
        dayChecked[id] = true;
        markLocalEdit('adhkar', dayKey, id);
      });
      all[dayKey] = dayChecked;
      save(STORAGE_KEY, all);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dhikrly:adhkar-updated'));
      }
    },
    []
  );

  const done = Object.values(checked).filter(Boolean).length;
  const pct = totalDuas > 0 ? Math.round((done / totalDuas) * 100) : 0;

  return {
    checked,
    setChecked,
    toggle,
    reset,
    markDayComplete,
    done,
    pct,
    today,
    localRevision,
  };
}
