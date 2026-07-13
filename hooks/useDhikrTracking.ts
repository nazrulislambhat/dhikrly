'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { load, save } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import type { Dua } from '@/types';

const STORAGE_PREFIX = 'dhikr_tracking_v1';

export interface DhikrRecord {
  id: string;
  label: string;
  target: number;
  count: number;
  lastUpdated: string | null;
}

export interface DhikrDaySnapshot {
  date: string;
  entries: DhikrRecord[];
}

interface CounterPosition {
  x: number;
  y: number;
}

interface DhikrTrackingState {
  date: string;
  entries: Record<string, DhikrRecord>;
  history: DhikrDaySnapshot[];
  position: CounterPosition;
}

function getStorageKey(userId?: string | null): string {
  return `${STORAGE_PREFIX}${userId ? `:${userId}` : ':local'}`;
}

function parseTarget(value: string): number {
  const match = value.match(/(\d+)\s*[x×]/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function buildTrackedEntries(_duas: Dua[]): DhikrRecord[] {
  return [
    {
      id: 'floating-counter',
      label: 'Floating counter',
      target: 100,
      count: 0,
      lastUpdated: null,
    },
  ];
}

function normalizeState(
  raw: Partial<DhikrTrackingState> | null,
  trackedEntries: DhikrRecord[],
): DhikrTrackingState {
  const today = getTodayKey();
  const history = Array.isArray(raw?.history) ? raw.history : [];
  const entries: Record<string, DhikrRecord> = {};

  trackedEntries.forEach((entry) => {
    const existing = raw?.entries?.[entry.id];
    entries[entry.id] = {
      id: entry.id,
      label: entry.label,
      target: entry.target,
      count: existing?.count ?? 0,
      lastUpdated: existing?.lastUpdated ?? null,
    };
  });

  return {
    date: raw?.date ?? today,
    entries,
    history: history.filter((snapshot) => snapshot && snapshot.date),
    position: raw?.position ?? { x: 24, y: 24 },
  };
}

function archivePreviousDay(
  prevState: DhikrTrackingState,
  trackedEntries: DhikrRecord[],
): DhikrTrackingState {
  const previousEntries = Object.values(prevState.entries).filter(
    (entry) => entry.count > 0,
  );
  const nextHistory = previousEntries.length
    ? [
        {
          date: prevState.date,
          entries: previousEntries.map((entry) => ({ ...entry })),
        },
        ...prevState.history,
      ].slice(0, 14)
    : prevState.history;

  const resetEntries = Object.fromEntries(
    trackedEntries.map((entry) => [
      entry.id,
      {
        ...entry,
        count: 0,
        lastUpdated: null,
      },
    ]),
  );

  return {
    date: getTodayKey(),
    entries: resetEntries,
    history: nextHistory,
    position: prevState.position,
  };
}

export function useDhikrTracking(duas: Dua[], userId?: string | null) {
  const trackedEntries = useMemo(() => buildTrackedEntries(duas), [duas]);
  const storageKey = useMemo(() => getStorageKey(userId), [userId]);

  const [state, setState] = useState<DhikrTrackingState>(() => {
    const loaded = load<DhikrTrackingState | null>(storageKey, null);
    return normalizeState(loaded, trackedEntries);
  });

  useEffect(() => {
    const loaded = load<DhikrTrackingState | null>(storageKey, null);
    const next = normalizeState(loaded, trackedEntries);
    setState((prev) => {
      if (prev.date === next.date && prev.entries === next.entries) {
        return prev;
      }
      return next;
    });
  }, [storageKey, trackedEntries]);

  useEffect(() => {
    save(storageKey, state);
  }, [state, storageKey]);

  const increment = useCallback((id: string) => {
    setState((prev) => {
      const entry = prev.entries[id];
      if (!entry) return prev;
      const nextEntry = {
        ...entry,
        count: entry.count + 1,
        lastUpdated: new Date().toISOString(),
      };
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [id]: nextEntry,
        },
      };
    });
  }, []);

  const setTarget = useCallback((id: string, target: number) => {
    setState((prev) => {
      const entry = prev.entries[id];
      if (!entry) return prev;
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [id]: {
            ...entry,
            target: Math.max(1, target),
          },
        },
      };
    });
  }, []);

  const setPosition = useCallback((position: CounterPosition) => {
    setState((prev) => ({ ...prev, position }));
  }, []);

  const resetOne = useCallback((id: string) => {
    setState((prev) => {
      const entry = prev.entries[id];
      if (!entry) return prev;
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [id]: {
            ...entry,
            count: 0,
            lastUpdated: null,
          },
        },
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      entries: Object.fromEntries(
        Object.values(prev.entries).map((entry) => [
          entry.id,
          {
            ...entry,
            count: 0,
            lastUpdated: null,
          },
        ]),
      ),
    }));
  }, []);

  const trackedCounts = useMemo(
    () =>
      Object.fromEntries(
        trackedEntries.map((entry) => [entry.id, state.entries[entry.id]]),
      ),
    [state.entries, trackedEntries],
  );

  const totalCount = useMemo(
    () =>
      Object.values(trackedCounts).reduce(
        (sum, entry) => sum + (entry?.count ?? 0),
        0,
      ),
    [trackedCounts],
  );

  const totalTarget = useMemo(
    () =>
      Object.values(trackedCounts).reduce(
        (sum, entry) => sum + (entry?.target ?? 0),
        0,
      ),
    [trackedCounts],
  );

  return {
    trackedEntries,
    trackedCounts,
    history: state.history,
    totalCount,
    totalTarget,
    today: state.date,
    position: state.position,
    setPosition,
    setTarget,
    increment,
    resetOne,
    resetAll,
  };
}
