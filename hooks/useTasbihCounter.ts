'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  changeTasbihTarget,
  DEFAULT_TASBIH_STATE,
  incrementTasbih,
  normalizeTasbihState,
  resetTasbih,
  undoTasbih,
  type TasbihState,
  type TasbihTarget,
} from '@/lib/tasbih';

export type { TasbihTarget } from '@/lib/tasbih';

const STORAGE_KEY = 'tasbih_counter_v1';

interface LoadedTasbih {
  state: TasbihState;
  error: string | null;
}

function loadState(): LoadedTasbih {
  if (typeof window === 'undefined') return { state: DEFAULT_TASBIH_STATE, error: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return {
      state: raw ? normalizeTasbihState(JSON.parse(raw)) : DEFAULT_TASBIH_STATE,
      error: null,
    };
  } catch {
    return {
      state: DEFAULT_TASBIH_STATE,
      error: 'Saved counter data could not be read. Your new count may not persist.',
    };
  }
}

function saveState(state: TasbihState): string | null {
  if (typeof window === 'undefined') return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return null;
  } catch {
    return 'Counter changes could not be saved on this device.';
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
 * Manages a recoverable tap-to-count dhikr state and device-local persistence.
 */
export function useTasbihCounter() {
  const [state, setState] = useState<TasbihState>(DEFAULT_TASBIH_STATE);
  const [storageError, setStorageError] = useState<string | null>(null);
  const stateRef = useRef(DEFAULT_TASBIH_STATE);

  // Hydrate from localStorage after mount to avoid SSR/client mismatch.
  useEffect(() => {
    const loaded = loadState();
    stateRef.current = loaded.state;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loaded.state);
    setStorageError(loaded.error);
  }, []);

  const commit = useCallback((update: (current: TasbihState) => TasbihState) => {
    const next = update(stateRef.current);
    stateRef.current = next;
    setState(next);
    setStorageError(saveState(next));
  }, []);

  const increment = useCallback(() => {
    commit((prev) => {
      const next = incrementTasbih(prev);
      if (next.rounds > prev.rounds) {
        vibrate([30, 40, 30, 40, 60]);
      } else {
        vibrate(15);
      }
      return next;
    });
  }, [commit]);

  const reset = useCallback(() => {
    commit(resetTasbih);
  }, [commit]);

  const setTarget = useCallback((target: TasbihTarget) => {
    commit((prev) => changeTasbihTarget(prev, target));
  }, [commit]);

  const undo = useCallback(() => {
    commit(undoTasbih);
  }, [commit]);

  return {
    count: state.count,
    target: state.target,
    rounds: state.rounds,
    justCompleted: state.target !== null && state.count >= state.target,
    canUndo: state.previousCount !== null && state.previousRounds !== null,
    storageError,
    increment,
    undo,
    reset,
    setTarget,
  };
}
