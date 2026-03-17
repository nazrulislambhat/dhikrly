/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { load, save, STREAK_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import type { Streak } from '@/types';

export function useStreak(done: number, total: number) {
  const today = getTodayKey();
  const [streak, setStreak] = useState<Streak>(() =>
    load<Streak>(STREAK_KEY, { current: 0, best: 0, lastComplete: '' }),
  );
  const prevDone = useRef(done);

  useEffect(() => {
    if (done === total && total > 0 && prevDone.current < total) {
      setStreak((s) => {
        if (s.lastComplete === today) return s;
        const yesterday = new Date(Date.now() - 86_400_000)
          .toISOString()
          .slice(0, 10);
        const current = s.lastComplete === yesterday ? s.current + 1 : 1;
        const best = Math.max(s.best, current);
        const next: Streak = { current, best, lastComplete: today };
        save(STREAK_KEY, next);
        return next;
      });
    }
    prevDone.current = done;
  }, [done, total, today]);

  return streak;
}
