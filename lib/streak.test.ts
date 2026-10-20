import { describe, expect, it } from 'vitest';
import {
  sanitizeStreak,
  mergeStreaks,
  computeStreakFromHistory,
} from './streak';

describe('streak calculations & sanitization', () => {
  const today = '2026-10-20';
  const yesterday = '2026-10-19';

  describe('sanitizeStreak', () => {
    it('resets current streak to 0 if last completion was more than 1 day ago', () => {
      const streak = { current: 14, best: 20, lastComplete: '2026-09-01' };
      const sanitized = sanitizeStreak(streak, today);
      expect(sanitized.current).toBe(0);
      expect(sanitized.best).toBe(20);
      expect(sanitized.lastComplete).toBe('2026-09-01');
    });

    it('keeps current streak if last completion was yesterday', () => {
      const streak = { current: 5, best: 8, lastComplete: yesterday };
      const sanitized = sanitizeStreak(streak, today);
      expect(sanitized.current).toBe(5);
      expect(sanitized.best).toBe(8);
    });

    it('keeps current streak if last completion was today', () => {
      const streak = { current: 6, best: 8, lastComplete: today };
      const sanitized = sanitizeStreak(streak, today);
      expect(sanitized.current).toBe(6);
      expect(sanitized.best).toBe(8);
    });
  });

  describe('mergeStreaks', () => {
    it('merges remote streak into local keeping maximum all-time best and active current', () => {
      const local = { current: 0, best: 3, lastComplete: '2026-09-10' };
      const remote = { current: 4, best: 15, lastComplete: yesterday };
      const merged = mergeStreaks(local, remote, today);
      expect(merged.current).toBe(4);
      expect(merged.best).toBe(15);
      expect(merged.lastComplete).toBe(yesterday);
    });

    it('handles null or empty remote streak gracefully without resetting local best', () => {
      const local = { current: 2, best: 10, lastComplete: today };
      const merged = mergeStreaks(local, null, today);
      expect(merged.current).toBe(2);
      expect(merged.best).toBe(10);
    });
  });

  describe('computeStreakFromHistory', () => {
    it('accurately calculates streak and best from 365 days history', () => {
      const checkedByDate: Record<string, Record<string, boolean>> = {
        '2026-10-17': { dua1: true, dua2: true },
        '2026-10-18': { dua1: true, dua2: true },
        '2026-10-19': { dua1: true, dua2: true },
        '2026-10-20': { dua1: true, dua2: true },
      };

      const result = computeStreakFromHistory(checkedByDate, 2, today);
      expect(result.current).toBe(4);
      expect(result.best).toBe(4);
      expect(result.lastComplete).toBe(today);
    });

    it('returns current = 0 if yesterday and today were both missed', () => {
      const checkedByDate: Record<string, Record<string, boolean>> = {
        '2026-10-10': { dua1: true },
        '2026-10-11': { dua1: true },
        '2026-10-12': { dua1: true },
      };

      const result = computeStreakFromHistory(checkedByDate, 1, today);
      expect(result.current).toBe(0);
      expect(result.best).toBe(3);
      expect(result.lastComplete).toBe('2026-10-12');
    });
  });
});
