import { getTodayKey } from '@/lib/dates';
import type { Streak } from '@/types';

export const DEFAULT_STREAK: Streak = { current: 0, best: 0, lastComplete: '' };

/**
 * Ensures that if a streak was completed in the past and missed yesterday,
 * `current` resets to 0 rather than remaining inflated.
 * Retains `best` as the all-time highest record.
 */
export function sanitizeStreak(s?: Partial<Streak> | null, todayStr = getTodayKey()): Streak {
  if (!s) return { ...DEFAULT_STREAK };

  const todayDate = new Date(`${todayStr}T12:00:00`);
  const yesterdayDate = new Date(todayDate.getTime() - 86_400_000);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  const lastComplete = s.lastComplete || '';
  const isCurrentActive = lastComplete === todayStr || lastComplete === yesterday;

  const currentVal = Math.max(0, Number(s.current) || 0);
  const bestVal = Math.max(0, Number(s.best) || 0, currentVal);

  return {
    current: isCurrentActive ? currentVal : 0,
    best: Math.max(bestVal, isCurrentActive ? currentVal : 0),
    lastComplete,
  };
}

/**
 * Merge local and remote streaks non-destructively:
 * - `best` takes the maximum of all recorded values.
 * - `current` validates whether `lastComplete` is active (today or yesterday).
 * - Prefers the higher active streak if valid.
 */
export function mergeStreaks(
  local?: Partial<Streak> | null,
  remote?: Partial<Streak> | null,
  todayStr = getTodayKey(),
): Streak {
  const sanitizedLocal = sanitizeStreak(local, todayStr);
  const sanitizedRemote = sanitizeStreak(remote, todayStr);

  const best = Math.max(
    sanitizedLocal.best,
    sanitizedRemote.best,
    Number(local?.best) || 0,
    Number(remote?.best) || 0,
  );

  const lastComplete =
    sanitizedRemote.lastComplete > sanitizedLocal.lastComplete
      ? sanitizedRemote.lastComplete
      : sanitizedLocal.lastComplete;

  const current = Math.max(sanitizedLocal.current, sanitizedRemote.current);

  return {
    current,
    best: Math.max(best, current),
    lastComplete,
  };
}

/**
 * Computes an authentic streak directly from daily completion history.
 * A day is considered completed if at least `minDuas` are checked,
 * or if all items in `totalExpected` are completed.
 */
export function computeStreakFromHistory(
  checkedByDate: Record<string, Record<string, boolean>>,
  totalExpected = 0,
  todayStr = getTodayKey(),
): Streak {
  const dates = Object.keys(checkedByDate || {}).sort();
  if (dates.length === 0) return { ...DEFAULT_STREAK };

  const isDayComplete = (dateStr: string): boolean => {
    const day = checkedByDate[dateStr];
    if (!day) return false;
    const checkedCount = Object.values(day).filter(Boolean).length;
    if (checkedCount === 0) return false;
    if (totalExpected > 0) return checkedCount >= totalExpected;
    return checkedCount > 0;
  };

  const completedDates = new Set(dates.filter(isDayComplete));
  if (completedDates.size === 0) return { ...DEFAULT_STREAK };

  // 1. Calculate best streak (longest consecutive days in history)
  let best = 0;
  let running = 0;
  let prevTime = 0;

  for (const dateStr of dates) {
    if (!completedDates.has(dateStr)) {
      running = 0;
      prevTime = 0;
      continue;
    }
    const curTime = new Date(`${dateStr}T12:00:00`).getTime();
    if (prevTime === 0 || Math.round((curTime - prevTime) / 86_400_000) === 1) {
      running += 1;
    } else {
      running = 1;
    }
    prevTime = curTime;
    if (running > best) best = running;
  }

  // 2. Calculate current active streak ending today or yesterday
  const checkDate = new Date(`${todayStr}T12:00:00`);
  const yesterday = new Date(checkDate.getTime() - 86_400_000).toISOString().slice(0, 10);
  let current = 0;
  let lastComplete = '';

  const todayCompleted = completedDates.has(todayStr);

  if (todayCompleted) {
    lastComplete = todayStr;
    current = 1;
    // Walk backwards from yesterday
    let d = new Date(checkDate);
    d.setDate(d.getDate() - 1);
    while (completedDates.has(d.toISOString().slice(0, 10))) {
      current += 1;
      d.setDate(d.getDate() - 1);
    }
  } else if (completedDates.has(yesterday)) {
    lastComplete = yesterday;
    current = 1;
    let d = new Date(checkDate);
    d.setDate(d.getDate() - 2);
    while (completedDates.has(d.toISOString().slice(0, 10))) {
      current += 1;
      d.setDate(d.getDate() - 1);
    }
  } else {
    // Find most recent completed date
    const sortedCompleted = [...completedDates].sort().reverse();
    lastComplete = sortedCompleted[0] || '';
    current = 0;
  }

  return {
    current,
    best: Math.max(best, current),
    lastComplete,
  };
}
