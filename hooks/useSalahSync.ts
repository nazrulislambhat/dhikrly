'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { getAllLogs, saveDayLog, saveAllLogs, emptyDay } from '@/lib/salahStorage';
import type { DayLog, PrayerName, SunnahLog, NaflLog } from '@/types/salah';
import type { SyncStatus } from '@/hooks/useSync';

function isTableMissingError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === '42P01' ||
    e.code === 'PGRST205' ||
    Boolean(
      e.message &&
        (e.message.includes('does not exist') ||
          e.message.includes('relation') ||
          e.message.includes('schema cache')),
    )
  );
}

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const SUNNAH_KEYS: (keyof SunnahLog)[] = [
  'fajrPre',
  'dhuhrPre',
  'dhuhrPost',
  'asrPre',
  'maghribPost',
  'ishaPost',
];
const NAFL_KEYS: (keyof NaflLog)[] = ['ishraq', 'duha', 'awwabin'];

/**
 * Non-destructive merge of two ṣalāh logs.
 * CRITICAL: Ensures completed prayers, sunnahs, and nafl from Supabase DB are NEVER erased.
 */
export function mergeSalahLogs(local: DayLog, remote: DayLog): DayLog {
  const base = emptyDay(local.date || remote.date);

  for (const prayer of PRAYERS) {
    const l = local.prayers?.[prayer];
    const r = remote.prayers?.[prayer];
    if (r && r !== null && (l === null || l === undefined)) {
      base.prayers[prayer] = r;
    } else if (l && l !== null) {
      base.prayers[prayer] = l;
    } else {
      base.prayers[prayer] = l ?? r ?? null;
    }
  }

  for (const key of SUNNAH_KEYS) {
    base.sunnah[key] = Boolean(local.sunnah?.[key] || remote.sunnah?.[key]);
  }

  if (local.tahajjud?.prayed || remote.tahajjud?.prayed) {
    base.tahajjud = {
      prayed: true,
      rakats: Math.max(local.tahajjud?.rakats || 0, remote.tahajjud?.rakats || 0) || 2,
      durationMinutes: Math.max(
        local.tahajjud?.durationMinutes || 0,
        remote.tahajjud?.durationMinutes || 0,
      ),
    };
  }

  for (const key of NAFL_KEYS) {
    base.nafl[key] = Boolean(local.nafl?.[key] || remote.nafl?.[key]);
  }

  return base;
}

const SALAH_QUEUE_KEY = 'salah_sync_queue_v4';

interface QueueItem {
  date: string;
  log: DayLog;
  queuedAt: number;
}

function queueKey(userId: string) {
  return `${SALAH_QUEUE_KEY}_${userId}`;
}

function readQueue(userId: string): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(queueKey(userId)) || '[]') as QueueItem[];
  } catch (error) {
    console.error('Could not read ṣalāh sync queue:', error);
    return [];
  }
}

function enqueue(userId: string, item: QueueItem) {
  try {
    const queue = readQueue(userId);
    const remaining = queue.filter((queued) => queued.date !== item.date);
    remaining.push(item);
    if (remaining.length > 120) remaining.splice(0, remaining.length - 120);
    localStorage.setItem(queueKey(userId), JSON.stringify(remaining));
  } catch (error) {
    console.error('Could not save ṣalāh sync queue:', error);
  }
}

function removeQueued(userId: string, item: QueueItem) {
  try {
    const queue = readQueue(userId).filter(
      (queued) => !(queued.date === item.date && queued.queuedAt === item.queuedAt),
    );
    if (queue.length > 0) localStorage.setItem(queueKey(userId), JSON.stringify(queue));
    else localStorage.removeItem(queueKey(userId));
  } catch (error) {
    console.error('Could not update ṣalāh sync queue:', error);
  }
}

const logWrites = new Map<string, Promise<boolean>>();

/**
 * Push day log to `salah_progress`.
 * CRITICAL: Reads any remote log first to merge so no remote prayer completion is ever dropped.
 */
async function pushSalahLog(userId: string, date: string, log: DayLog): Promise<boolean> {
  if (!hasSupabaseConfig) return true;
  const key = `${userId}:${date}`;
  const previousWrite = logWrites.get(key) ?? Promise.resolve(true);
  const write = previousWrite.catch(() => false).then(async () => {
    try {
      const { data: existingRow, error: readError } = await supabase
        .from('salah_progress')
        .select('log')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

      if (readError && !isTableMissingError(readError)) {
        console.warn('Could not read existing salah_progress before push:', readError.message);
      }

      const existingLog = existingRow?.log ? (existingRow.log as DayLog) : null;
      const mergedLog = existingLog ? mergeSalahLogs(log, existingLog) : log;

      const { error } = await supabase
        .from('salah_progress')
        .upsert(
          {
            user_id: userId,
            date,
            log: mergedLog,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' },
        );

      if (error) {
        console.error('Could not sync ṣalāh progress:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Could not sync ṣalāh progress:', error);
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

async function pullAllLogs(userId: string): Promise<DayLog[]> {
  const { data, error } = await supabase
    .from('salah_progress')
    .select('date, log, updated_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(365);

  if (error) {
    if (isTableMissingError(error)) return [];
    throw error;
  }

  const logs: DayLog[] = [];
  for (const row of data ?? []) {
    if (row.date && row.log && typeof row.log === 'object') {
      logs.push({
        ...emptyDay(row.date),
        ...(row.log as Partial<DayLog>),
        date: row.date,
      });
    }
  }
  return logs;
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
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
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
        if (await pushSalahLog(userId, item.date, item.log)) {
          removeQueued(userId, item);
          if (item.date === (log.date || today) && JSON.stringify(item.log) === pendingLocal.current) {
            lastPushed.current = pendingLocal.current;
          }
        } else {
          failed = true;
        }
      }
    } finally {
      isFlushing.current = false;
    }
    const finalStatus: SyncStatus = !navigator.onLine
      ? 'offline'
      : failed || readQueue(userId).length > 0
        ? 'error'
        : pendingLocal.current !== lastPushed.current
          ? 'syncing'
          : 'synced';

    setStatus(finalStatus);
    if (finalStatus === 'synced') {
      setLastSyncedAt(Date.now());
    }
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
        const remoteLogs = await pullAllLogs(user.id);
        if (cancelled) return;

        const remoteByDate = new Map(remoteLogs.map((item) => [item.date, item]));
        const localLogs = getAllLogs();
        const dates = new Set([...Object.keys(localLogs), ...remoteByDate.keys(), today]);
        const resolvedLogs: DayLog[] = [];

        for (const date of dates) {
          const remoteItem = remoteByDate.get(date);
          const localItem =
            date === today && localRevision.current !== startingRevision
              ? latestLog.current
              : localLogs[date];

          let resolved: DayLog;
          if (remoteItem && localItem) {
            resolved = mergeSalahLogs(localItem, remoteItem);
          } else if (remoteItem) {
            resolved = remoteItem;
          } else {
            resolved = localItem ?? emptyDay(date);
          }

          resolvedLogs.push(resolved);
        }

        const logsDict: Record<string, DayLog> = {};
        for (const rLog of resolvedLogs) {
          logsDict[rLog.date] = rLog;
        }
        saveAllLogs(logsDict);

        const resolvedToday =
          resolvedLogs.find((l) => l.date === today) ?? emptyDay(today);
        const todaySnapshot = JSON.stringify(resolvedToday);
        lastPushed.current = todaySnapshot;
        pendingLocal.current = todaySnapshot;
        logBaseline.current = resolvedToday;

        onPullComplete(resolvedLogs);

        // Push today's merged log
        await pushSalahLog(user.id, today, resolvedToday);

        if (cancelled) return;
        retryCount.current = 0;
        setReadyUserId(user.id);
        setLastSyncedAt(Date.now());
        await flushQueue(user.id);
      } catch (error: unknown) {
        console.error('Could not pull ṣalāh logs:', error);
        const err = error as { status?: number; code?: string; message?: string } | undefined;
        if (
          err?.status === 401 ||
          err?.code === 'PGRST301' ||
          Boolean(
            err?.message &&
              (err.message.includes('JWT') ||
                err.message.includes('token') ||
                err.message.includes('session')),
          )
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
          const delay = Math.min(60_000, 10_000 * Math.pow(1.5, Math.min(retryCount.current, 4)));
          retryTimer = setTimeout(initialize, delay);
        }
      }
    };
    void initialize();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today]);

  // Polling for remote updates
  useEffect(() => {
    if (!user || !hasSupabaseConfig || readyUserId !== user.id) return;

    const poll = async () => {
      if (
        pendingLocal.current !== lastPushed.current ||
        JSON.stringify(latestLog.current) !== lastPushed.current
      )
        return;

      const pollRevision = localRevision.current;
      const { data, error } = await supabase
        .from('salah_progress')
        .select('log')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        if (!isTableMissingError(error)) {
          console.error('Could not check for remote ṣalāh updates:', error.message);
        }
        return;
      }
      if (localRevision.current !== pollRevision) {
        settleStatus(user.id);
        return;
      }
      if (!data?.log || typeof data.log !== 'object') {
        settleStatus(user.id);
        return;
      }

      const remoteLog = { ...emptyDay(today), ...(data.log as Partial<DayLog>), date: today };
      const mergedLog = mergeSalahLogs(latestLog.current, remoteLog);
      const incoming = JSON.stringify(mergedLog);
      if (incoming === JSON.stringify(latestLog.current)) {
        settleStatus(user.id);
        return;
      }

      saveDayLog(mergedLog);
      logBaseline.current = mergedLog;
      lastPushed.current = incoming;
      pendingLocal.current = incoming;
      onRemoteLogUpdate(mergedLog);
      settleStatus(user.id);
    };

    const interval = setInterval(poll, 12_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today, readyUserId]);

  // Auto-sync whenever local `log` changes
  useEffect(() => {
    if (!user || !hasSupabaseConfig || readyUserId !== user.id) return;
    const snapshot = JSON.stringify(log);
    if (snapshot === JSON.stringify(logBaseline.current)) {
      settleStatus(user.id);
      return;
    }
    logBaseline.current = log;
    pendingLocal.current = snapshot;

    const syncDate = log.date || today;

    if (!navigator.onLine) {
      enqueue(user.id, { date: syncDate, log, queuedAt: Date.now() });
      setStatus('offline');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus('syncing');
    debounceRef.current = setTimeout(async () => {
      const item: QueueItem = { date: syncDate, log, queuedAt: Date.now() };
      const succeeded = await pushSalahLog(user.id, syncDate, log);
      if (succeeded) {
        lastPushed.current = snapshot;
        removeQueued(user.id, item);
        setLastSyncedAt(Date.now());
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

  // Reconnect & focus flush
  useEffect(() => {
    if (!user || readyUserId !== user.id) return;
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

  // Manual sync callback
  const manualSync = useCallback(async (): Promise<boolean> => {
    if (!user || !hasSupabaseConfig) return false;
    if (!navigator.onLine) {
      setStatus('offline');
      return false;
    }

    setStatus('syncing');
    try {
      const remoteLogs = await pullAllLogs(user.id);
      const remoteByDate = new Map(remoteLogs.map((item) => [item.date, item]));
      const localLogs = getAllLogs();
      const dates = new Set([...Object.keys(localLogs), ...remoteByDate.keys(), today]);
      const resolvedLogs: DayLog[] = [];

      for (const date of dates) {
        const remoteItem = remoteByDate.get(date);
        const localItem = date === today ? latestLog.current : localLogs[date];
        let resolved: DayLog;
        if (remoteItem && localItem) {
          resolved = mergeSalahLogs(localItem, remoteItem);
        } else if (remoteItem) {
          resolved = remoteItem;
        } else {
          resolved = localItem ?? emptyDay(date);
        }
        resolvedLogs.push(resolved);
        saveDayLog(resolved);
      }

      onPullComplete(resolvedLogs);

      const resolvedToday =
        resolvedLogs.find((l) => l.date === today) ?? latestLog.current;
      await pushSalahLog(user.id, today, resolvedToday);
      await flushQueue(user.id);

      setLastSyncedAt(Date.now());
      setStatus('synced');
      return true;
    } catch (err) {
      console.error('Manual ṣalāh sync failed:', err);
      setStatus(navigator.onLine ? 'error' : 'offline');
      return false;
    }
  }, [user, today, onPullComplete, flushQueue]);

  return { flushQueue, status, manualSync, lastSyncedAt };
}
