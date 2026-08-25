'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'tasbih_counter_v1';

export type TasbihTarget = 33 | 99 | 100 | 1000;

const VALID_TARGETS: TasbihTarget[] = [33, 99, 100, 1000];

interface TasbihState {
  count: number;
  target: TasbihTarget;
  rounds: number;
}

const DEFAULT_STATE: TasbihState = {
  count: 0,
  target: 33,
  rounds: 0,
};

function loadState(): TasbihState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;

    const parsed = JSON.parse(raw);
    const target = VALID_TARGETS.includes(parsed.target)
      ? (parsed.target as TasbihTarget)
      : DEFAULT_STATE.target;

    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      target,
      rounds: typeof parsed.rounds === 'number' ? parsed.rounds : 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: TasbihState) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage can throw in private browsing / when quota is exceeded.
    // Losing persistence isn't fatal here, so we swallow it silently.
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw if vibrate() is called outside a user gesture.
  }
}

/**
 * Manages tap-to-count dhikr state: current count, selected target (33/99/100),
 * completed round tally, haptic feedback, and localStorage persistence.
 * Mirrors the pattern used by useStreak / useSalahLog elsewhere in the app.
 */
export function useTasbihCounter() {
  const [state, setState] = useState<TasbihState>(DEFAULT_STATE);
  const [justCompleted, setJustCompleted] = useState(false);
  const hydrated = useRef(false);

  // Hydrate from localStorage after mount to avoid SSR/client mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveState(state);
  }, [state]);

  const increment = useCallback(() => {
    setState((prev) => {
      const nextCount = prev.count + 1;

      if (nextCount >= prev.target) {
        vibrate([30, 40, 30, 40, 60]);
        setJustCompleted(true);
        window.setTimeout(() => setJustCompleted(false), 1200);
        return { ...prev, count: 0, rounds: prev.rounds + 1 };
      }

      vibrate(15);
      return { ...prev, count: nextCount };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, count: 0 }));
  }, []);

  const setTarget = useCallback((target: TasbihTarget) => {
    setState((prev) => ({ ...prev, target, count: 0 }));
  }, []);

  const resetRounds = useCallback(() => {
    setState((prev) => ({ ...prev, rounds: 0 }));
  }, []);

  return {
    count: state.count,
    target: state.target,
    rounds: state.rounds,
    justCompleted,
    increment,
    reset,
    setTarget,
    resetRounds,
  };
}
