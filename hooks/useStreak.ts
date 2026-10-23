'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { load, save, STREAK_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import { sanitizeStreak, DEFAULT_STREAK } from '@/lib/streak';
import type { Streak } from '@/types';

export function useStreak(done: number, total: number) {
  const today = getTodayKey();
  const [streak, setStreakState] = useState<Streak>(DEFAULT_STREAK);
  const prevDone = useRef(done);

  // Load and sanitize on mount / day change
  useEffect(() => {
    const loaded = load<Streak>(STREAK_KEY, DEFAULT_STREAK);
    setStreakState(sanitizeStreak(loaded, today));
  }, [today]);

  // Dynamically react to sync updates from Supabase or storage updates
  useEffect(() => {
    const handleUpdate = () => {
      const loaded = load<Streak>(STREAK_KEY, DEFAULT_STREAK);
      setStreakState(sanitizeStreak(loaded, today));
    };
    window.addEventListener('dhikrly:adhkar-updated', handleUpdate);
    return () => window.removeEventListener('dhikrly:adhkar-updated', handleUpdate);
  }, [today]);

  useEffect(() => {
    if (done === total && total > 0 && prevDone.current < total) {
      setStreakState((s) => {
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

  const setStreak = useCallback(
    (newStreak: Streak) => {
      const sanitized = sanitizeStreak(newStreak, today);
      setStreakState(sanitized);
      save(STREAK_KEY, sanitized);
    },
    [today],
  );

  return Object.assign(streak, { setStreak });
}
