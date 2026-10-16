'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { getAllLogs, saveDayLog, emptyDay } from '@/lib/salahStorage';

function isTableMissingError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === '42P01' ||
    Boolean(e.message && (e.message.includes('does not exist') || e.message.includes('relation')))
  );
}
import { clearLocalEdit, getLocalEditTime } from '@/lib/localEdits';
import {
  latestPracticeEntries,
  salahEntries,
  salahFromEntries,
  diffSalah,
  type PracticeEntry,
  type PracticeEntryWrite,
} from '@/lib/practiceEntries';
import type { DayLog } from '@/types/salah';
import type { SyncStatus } from '@/hooks/useSync';

const SALAH_QUEUE_KEY = 'salah_sync_queue_v3';
const LEGACY_SALAH_QUEUE_KEY = 'salah_sync_queue_v2';

interface QueueItem {
  date: string;
  entries: PracticeEntry[];
  snapshot: DayLog;
  queuedAt: number;
}

interface RemoteSalah {
  logs: DayLog[];
  entriesByDate: Record<string, PracticeEntry[]>;
}

function queueKey(userId: string) {
  return `${SALAH_QUEUE_KEY}_${userId}`;
}

function readQueue(userId: string): QueueItem[] {
  try {
    const current = JSON.parse(localStorage.getItem(queueKey(userId)) || '[]') as unknown[];
    return current as QueueItem[];
  } catch (error) {
    console.error('Could not read ṣalāh sync queue:', error);
    return [];
  }
}

function readLegacyQueue(userId: string): { date: string; log: DayLog; queuedAt: number }[] {
  try {
    return JSON.parse(
      localStorage.getItem(`${LEGACY_SALAH_QUEUE_KEY}_${userId}`) || '[]',
    ) as { date: string; log: DayLog; queuedAt: number }[];
  } catch (error) {
    console.error('Could not read legacy ṣalāh sync queue:', error);
    return [];
  }
}

function enqueue(userId: string, item: QueueItem) {
  try {
    const queue = readQueue(userId);
    const sameDate = queue.filter((queued) => queued.date === item.date);
    const latestByKey = new Map<string, PracticeEntry>();
    for (const queued of sameDate) {
      for (const entry of queued.entries) latestByKey.set(entry.item_key, entry);
    }
    for (const entry of item.entries) latestByKey.set(entry.item_key, entry);
    const remaining = queue.filter((queued) => queued.date !== item.date);
    remaining.push({
      ...item,
      entries: [...latestByKey.values()],
    });
    if (remaining.length > 120) remaining.splice(0, remaining.length - 120);
    localStorage.setItem(queueKey(userId), JSON.stringify(remaining));
  } catch (error) {
    console.error('Could not save ṣalāh sync queue:', error);
  }
}

function removeQueued(userId: string, item: QueueItem) {
  try {
    const queue = readQueue(userId).filter(
      (queued) =>
        !(
          queued.date === item.date &&
          queued.queuedAt === item.queuedAt &&
          JSON.stringify(queued.entries) === JSON.stringify(item.entries)
        ),
    );
    if (queue.length > 0) localStorage.setItem(queueKey(userId), JSON.stringify(queue));
    else localStorage.removeItem(queueKey(userId));
  } catch (error) {
    console.error('Could not update ṣalāh sync queue:', error);
  }
}

const logWrites = new Map<string, Promise<boolean>>();

async function pushEntries(userId: string, entries: PracticeEntry[]): Promise<boolean> {
  if (!hasSupabaseConfig) return true;
  if (entries.length === 0) return true;
  const date = entries[0].date;
  const key = `${userId}:${date}`;
  const previousWrite = logWrites.get(key) ?? Promise.resolve(true);
  const write = previousWrite.catch(() => false).then(async () => {
    try {
      const { error } = await supabase
        .from('practice_entries')
        .upsert(
          entries.map((entry): PracticeEntryWrite => ({ user_id: userId, ...entry })),
          { onConflict: 'user_id,date,area,item_key' },
        );
      if (error) console.error('Could not sync ṣalāh entries:', error.message);
      return !error;
    } catch (error) {
      console.error('Could not sync ṣalāh entries:', error);
      return false;
    }
  });
  logWrites.set(key, write);

  try {
    return await write;
  } finally {
    if (logWrites.get(key) === write) logWrites.delete(key);
  }
}

async function pullAllLogs(userId: string): Promise<RemoteSalah> {
  const [entriesRes, legacyRes] = await Promise.all([
    supabase
      .from('practice_entries')
      .select('date, area, item_key, value, updated_at')
      .eq('user_id', userId)
      .eq('area', 'salah')
      .order('date', { ascending: false })
      .limit(5000),
    supabase
      .from('salah_progress')
      .select('date, log, updated_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(120),
  ]);

  const hasEntries = !entriesRes.error;
  const hasLegacy = !legacyRes.error;

  if (entriesRes.error && !isTableMissingError(entriesRes.error)) throw entriesRes.error;
  if (legacyRes.error && !isTableMissingError(legacyRes.error)) throw legacyRes.error;
  if (!hasEntries && !hasLegacy) {
    throw entriesRes.error ?? legacyRes.error;
  }

  const normalized = (entriesRes.data ?? []) as PracticeEntry[];
  const legacy = (legacyRes.data ?? []).flatMap((row) => {
    const log = {
      ...emptyDay(row.date),
      ...(row.log as Partial<DayLog>),
      date: row.date,
    };
    return salahEntries(log, row.updated_at);
  });
  const latest = latestPracticeEntries([...legacy, ...normalized]);
  const normalizedByKey = new Map(
    normalized.map((entry) => [`${entry.date}:${entry.item_key}`, entry]),
  );
  const migrate = latest.filter((entry) => {
    const current = normalizedByKey.get(`${entry.date}:${entry.item_key}`);
    return !current || Date.parse(entry.updated_at) > Date.parse(current.updated_at);
  });
  if (migrate.length > 0 && hasEntries) {
    try {
      const { error } = await supabase
        .from('practice_entries')
        .upsert(
          migrate.map((entry): PracticeEntryWrite => ({ user_id: userId, ...entry })),
          { onConflict: 'user_id,date,area,item_key' },
        );
      if (error && !isTableMissingError(error)) throw error;
    } catch {
      // Don't fail the pull if migration upsert fails
    }
  }

  const entriesByDate: Record<string, PracticeEntry[]> = {};
  for (const entry of latest) (entriesByDate[entry.date] ??= []).push(entry);
  return {
    entriesByDate,
    logs: Object.entries(entriesByDate).map(([date, entries]) =>
      salahFromEntries(date, entries),
    ),
  };
}

async function pullDay(userId: string, date: string): Promise<PracticeEntry[]> {
  if (!hasSupabaseConfig) return [];
  const { data, error } = await supabase
    .from('practice_entries')
    .select('date, area, item_key, value, updated_at')
    .eq('user_id', userId)
    .eq('area', 'salah')
    .eq('date', date)
    .order('item_key', { ascending: true });
  if (error) {
    if (isTableMissingError(error)) return [];
    throw error;
  }
  return (data ?? []) as PracticeEntry[];
}

function clearSyncedEdits(date: string, entries: PracticeEntry[]) {
  for (const entry of entries) {
    const editTime = getLocalEditTime('salah', date, entry.item_key);
    if (editTime !== null) {
      clearLocalEdit('salah', date, entry.item_key, editTime);
    }
  }
}

interface UseSalahSyncOptions {
  user: User | null;
  today: string;
  log: DayLog;
  localRevision: { current: number };
  onPullComplete: (logs: DayLog[]) => void;
  onRemoteLogUpdate: (log: DayLog) => void;
}

export function useSalahSync({
  user,
  today,
  log,
  localRevision,
  onPullComplete,
  onRemoteLogUpdate,
}: UseSalahSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushing = useRef(false);
  const retryCount = useRef(0);
  const lastPushed = useRef<string>('__init__');
  const pendingLocal = useRef<string>('__init__');
  const latestLog = useRef(log);
  const logBaseline = useRef(log);
  latestLog.current = log;

  const settleStatus = useCallback((userId: string) => {
    if (!navigator.onLine) setStatus('offline');
    else if (pendingLocal.current !== lastPushed.current || readQueue(userId).length > 0) {
      setStatus('syncing');
    } else {
      setStatus('synced');
    }
  }, []);

  const flushQueue = useCallback(async (userId: string) => {
    if (!hasSupabaseConfig) {
      setStatus('synced');
      return;
    }
    if (isFlushing.current) return;
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    isFlushing.current = true;
    setStatus('syncing');
    let failed = false;
    try {
      for (const item of readQueue(userId)) {
        if (await pushEntries(userId, item.entries)) {
          removeQueued(userId, item);
          clearSyncedEdits(item.date, item.entries);
          if (item.date === today && JSON.stringify(item.snapshot) === pendingLocal.current) {
            lastPushed.current = pendingLocal.current;
          }
          if (item.date === today &&
            JSON.stringify(item.snapshot) === JSON.stringify(latestLog.current)) {
            clearLocalEdit('salah', today);
          }
        } else {
          failed = true;
        }
      }
    } finally {
      isFlushing.current = false;
    }
    setStatus(
      !navigator.onLine
        ? 'offline'
        : failed || readQueue(userId).length > 0
          ? 'error'
          : pendingLocal.current !== lastPushed.current
            ? 'syncing'
            : 'synced',
    );
  }, [today]);

  useEffect(() => {
    if (!user || !hasSupabaseConfig) {
      setReadyUserId(null);
      setStatus('synced');
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const startingRevision = localRevision.current;
    setReadyUserId(null);
    setStatus('syncing');
    const initialize = async () => {
      try {
        setStatus('syncing');
        const remote = await pullAllLogs(user.id);
        if (cancelled) return;

        const remoteByDate = new Map(remote.logs.map((item) => [item.date, item]));
        const localLogs = getAllLogs();
        const legacyQueue = readLegacyQueue(user.id);
        const queueByDate = new Map<string, typeof legacyQueue>();
        for (const item of legacyQueue) {
          const items = queueByDate.get(item.date) ?? [];
          items.push(item);
          queueByDate.set(item.date, items);
        }
        const dates = new Set([
          ...Object.keys(localLogs),
          ...remoteByDate.keys(),
          ...queueByDate.keys(),
          today,
        ]);
        const resolvedByDate = new Map<string, DayLog>();

        for (const date of dates) {
          const remoteLog = remoteByDate.get(date);
          const localLog =
            date === today && localRevision.current !== startingRevision
              ? latestLog.current
              : localLogs[date];
          const queuedItems = queueByDate.get(date) ?? [];
          if (!remoteLog) {
            const merged = new Map(
              salahEntries(localLog ?? emptyDay(date)).map((entry) => [
                entry.item_key,
                entry,
              ]),
            );
            for (const queued of queuedItems) {
              const queuedEntries = salahEntries(
                { ...emptyDay(date), ...queued.log, date },
                new Date(queued.queuedAt).toISOString(),
              );
              for (const entry of queuedEntries) {
                const editTime = getLocalEditTime('salah', date, entry.item_key)
                  ?? getLocalEditTime('salah', date);
                if (editTime === null || queued.queuedAt >= editTime) {
                  merged.set(entry.item_key, entry);
                }
              }
            }
            const resolved = salahFromEntries(date, [...merged.values()]);
            resolvedByDate.set(date, resolved);
            saveDayLog(resolved);
            continue;
          }
          if (!localLog) {
            resolvedByDate.set(date, remoteLog);
            saveDayLog(remoteLog);
            continue;
          }

          const merged = new Map(
            (remote.entriesByDate[date] ?? []).map((entry) => [entry.item_key, entry]),
          );
          const originalRemoteEntries = new Map(merged);
          const localEntries = salahEntries(localLog);
          const dateEditTime = getLocalEditTime('salah', date);
          for (const queued of queuedItems) {
            const queuedEntries = salahEntries(
              { ...emptyDay(date), ...queued.log, date },
              new Date(queued.queuedAt).toISOString(),
            );
            for (const entry of queuedEntries) {
              const remoteEntry = merged.get(entry.item_key);
              if (!remoteEntry || queued.queuedAt >= Date.parse(remoteEntry.updated_at)) {
                merged.set(entry.item_key, entry);
              }
            }
          }
          for (const entry of localEntries) {
            const fieldEditTime = getLocalEditTime('salah', date, entry.item_key);
            const remoteEntry = merged.get(entry.item_key);
            const originalRemoteEntry = originalRemoteEntries.get(entry.item_key);
            const localWins =
              !remoteEntry ||
              (fieldEditTime !== null &&
                fieldEditTime >= Date.parse(remoteEntry.updated_at)) ||
              (dateEditTime !== null &&
                dateEditTime >= (remoteEntry ? Date.parse(remoteEntry.updated_at) : 0) &&
                JSON.stringify(entry.value) !== JSON.stringify(originalRemoteEntry?.value));
            if (localWins) {
              merged.set(entry.item_key, entry);
            } else if (fieldEditTime !== null) {
              clearLocalEdit('salah', date, entry.item_key, fieldEditTime);
            }
          }
          const resolved = salahFromEntries(date, [...merged.values()]);
          resolvedByDate.set(date, resolved);
          saveDayLog(resolved);
        }

        const resolvedToday = resolvedByDate.get(today) ?? emptyDay(today);
        const remoteToday = remoteByDate.get(today) ?? emptyDay(today);
        const todaySnapshot = JSON.stringify(resolvedToday);
        lastPushed.current = JSON.stringify(remoteToday);
        pendingLocal.current = todaySnapshot;
        logBaseline.current = resolvedToday;
        onPullComplete([...resolvedByDate.values()]);

        for (const [date, resolvedLog] of resolvedByDate) {
          const remoteLog = remoteByDate.get(date);
          const entries = remoteLog
            ? diffSalah(resolvedLog, remoteLog)
            : salahEntries(resolvedLog);
          if (entries.length === 0) continue;
          if (await pushEntries(user.id, entries)) {
            clearSyncedEdits(date, entries);
            if (date === today) {
              lastPushed.current = todaySnapshot;
              if (JSON.stringify(latestLog.current) === todaySnapshot) {
                clearLocalEdit('salah', today);
              }
            } else {
              clearLocalEdit('salah', date);
            }
          } else {
            enqueue(user.id, {
              date,
              entries,
              snapshot: resolvedLog,
              queuedAt: Date.now(),
            });
          }
        }
        if (legacyQueue.length > 0) {
          localStorage.removeItem(`${LEGACY_SALAH_QUEUE_KEY}_${user.id}`);
        }
        if (cancelled) return;
        retryCount.current = 0;
        setReadyUserId(user.id);
        await flushQueue(user.id);
      } catch (error: unknown) {
        console.error('Could not pull ṣalāh logs:', error);
        const err = error as { status?: number; code?: string; message?: string } | undefined;
        if (
          err?.status === 401 ||
          err?.code === 'PGRST301' ||
          Boolean(err?.message && (err.message.includes('JWT') || err.message.includes('token') || err.message.includes('session')))
        ) {
          try {
            const { error: refreshErr } = await supabase.auth.refreshSession();
            if (refreshErr) {
              console.warn('Session expired, signing out to prevent endless sync retries');
              await supabase.auth.signOut();
              setStatus('synced');
              return;
            }
          } catch {
            await supabase.auth.signOut();
            setStatus('synced');
            return;
          }
        }
        if (!cancelled) {
          setStatus(navigator.onLine ? 'error' : 'offline');
          retryCount.current += 1;
          const delay = Math.min(120_000, 15_000 * Math.pow(1.5, Math.min(retryCount.current, 5)));
          retryTimer = setTimeout(initialize, delay);
        }
      }
    };
    void initialize();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
    // Pull once per account or local date; callbacks and data are intentionally snapshots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today]);

  useEffect(() => {
    if (!user || !hasSupabaseConfig || readyUserId !== user.id) return;

    const poll = async () => {
      if (
        pendingLocal.current !== lastPushed.current ||
        JSON.stringify(latestLog.current) !== lastPushed.current
      ) return;
      const pollRevision = localRevision.current;
      let incomingEntries: PracticeEntry[];
      try {
        incomingEntries = await pullDay(user.id, today);
      } catch (error) {
        console.error('Could not check for remote ṣalāh updates:', error);
        setStatus(navigator.onLine ? 'error' : 'offline');
        return;
      }
      if (localRevision.current !== pollRevision) {
        settleStatus(user.id);
        return;
      }
      if (incomingEntries.length === 0) {
        settleStatus(user.id);
        return;
      }

      const remoteLog = salahFromEntries(today, incomingEntries);
      const incoming = JSON.stringify(remoteLog);
      if (incoming === JSON.stringify(latestLog.current)) {
        settleStatus(user.id);
        return;
      }

      saveDayLog(remoteLog);
      logBaseline.current = remoteLog;
      lastPushed.current = incoming;
      pendingLocal.current = incoming;
      onRemoteLogUpdate(remoteLog);
      settleStatus(user.id);
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today, readyUserId]);

  useEffect(() => {
    if (!user || !hasSupabaseConfig || readyUserId !== user.id) return;
    const snapshot = JSON.stringify(log);
    const entries = diffSalah(log, logBaseline.current);
    logBaseline.current = log;
    pendingLocal.current = snapshot;
    if (entries.length === 0) {
      settleStatus(user.id);
      return;
    }

    if (!navigator.onLine) {
      enqueue(user.id, { date: today, entries, snapshot: log, queuedAt: Date.now() });
      setStatus('offline');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus('syncing');
    debounceRef.current = setTimeout(async () => {
      const item = { date: today, entries, snapshot: log, queuedAt: Date.now() };
      if (await pushEntries(user.id, entries)) {
        lastPushed.current = snapshot;
        removeQueued(user.id, item);
        clearSyncedEdits(today, entries);
        if (snapshot === JSON.stringify(latestLog.current)) clearLocalEdit('salah', today);
        settleStatus(user.id);
      } else {
        enqueue(user.id, item);
        setStatus(navigator.onLine ? 'error' : 'offline');
      }
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [log, today, user, readyUserId, settleStatus]);

  useEffect(() => {
    if (!user || !hasSupabaseConfig || readyUserId !== user.id) return;
    const retry = () => void flushQueue(user.id);
    const offline = () => setStatus('offline');
    window.addEventListener('online', retry);
    window.addEventListener('offline', offline);
    window.addEventListener('focus', retry);
    const interval = setInterval(retry, 30_000);
    return () => {
      window.removeEventListener('online', retry);
      window.removeEventListener('offline', offline);
      window.removeEventListener('focus', retry);
      clearInterval(interval);
    };
  }, [user, flushQueue, readyUserId]);

  return { flushQueue, status };
}
