'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getAllLogs, saveDayLog, emptyDay } from '@/lib/salahStorage';
import {
  clearLocalEdit,
  getLocalEditTime,
  shouldPreserveLocalEdit,
} from '@/lib/localEdits';
import type { DayLog } from '@/types/salah';
import type { SyncStatus } from '@/hooks/useSync';

const SALAH_QUEUE_KEY = 'salah_sync_queue_v2';

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
    const queue = readQueue(userId).filter((queued) => queued.date !== item.date);
    queue.push(item);
    if (queue.length > 120) queue.splice(0, queue.length - 120);
    localStorage.setItem(queueKey(userId), JSON.stringify(queue));
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
          JSON.stringify(queued.log) === JSON.stringify(item.log)
        ),
    );
    if (queue.length > 0) localStorage.setItem(queueKey(userId), JSON.stringify(queue));
    else localStorage.removeItem(queueKey(userId));
  } catch (error) {
    console.error('Could not update ṣalāh sync queue:', error);
  }
}

async function pushLog(userId: string, log: DayLog): Promise<boolean> {
  const key = `${userId}:${log.date}`;
  const previousWrite = logWrites.get(key) ?? Promise.resolve(true);
  const write = previousWrite.catch(() => false).then(async () => {
    try {
      const { error } = await supabase
        .from('salah_progress')
        .upsert(
          { user_id: userId, date: log.date, log, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' },
        );
      if (error) console.error('Could not sync ṣalāh log:', error.message);
      return !error;
    } catch (error) {
      console.error('Could not sync ṣalāh log:', error);
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
    .select('date, log')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(120);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...emptyDay(row.date),
    ...(row.log as Partial<DayLog>),
    date: row.date,
  }));
}

function prayerCount(log: DayLog) {
  return Object.values(log.prayers).filter(Boolean).length;
}

const logWrites = new Map<string, Promise<boolean>>();

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
  const lastPushed = useRef<string>('__init__');
  const pendingLocal = useRef<string>('__init__');
  const latestLog = useRef(log);
  latestLog.current = log;

  const settleStatus = useCallback((userId: string) => {
    if (!navigator.onLine) setStatus('offline');
    else if (
      pendingLocal.current !== lastPushed.current ||
      readQueue(userId).length > 0
    ) {
      setStatus('syncing');
    } else {
      setStatus('synced');
    }
  }, []);

  const flushQueue = useCallback(async (userId: string) => {
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
        if (await pushLog(userId, item.log)) {
          removeQueued(userId, item);
          if (
            item.date === today &&
            JSON.stringify(item.log) === pendingLocal.current
          ) {
            lastPushed.current = pendingLocal.current;
          }
          if (
            item.date === today &&
            JSON.stringify(item.log) === JSON.stringify(latestLog.current)
          ) {
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
    if (!user) {
      setReadyUserId(null);
      setStatus('synced');
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const startingRevision = localRevision.current;
    setReadyUserId(null);
    const initialize = async () => {
      setStatus('syncing');
      try {
        await flushQueue(user.id);
        if (cancelled) return;
        setStatus('syncing');
        const remoteLogs = await pullAllLogs(user.id);
        if (cancelled) return;

        const remoteByDate = new Map(remoteLogs.map((item) => [item.date, item]));
        const localLogs = getAllLogs();
        const resolvedByDate: Record<string, DayLog> = {};

        for (const remoteLog of remoteLogs) {
          const localLog = localLogs[remoteLog.date];
          const localEditTime = getLocalEditTime('salah', remoteLog.date);
          const preservePendingEdit =
            localLog &&
            shouldPreserveLocalEdit(
              localEditTime !== null,
              localLog,
              remoteLog,
            );
          const resolved =
            remoteLog.date === today &&
            localLog &&
            (preservePendingEdit ||
              localRevision.current !== startingRevision ||
              prayerCount(localLog) > prayerCount(remoteLog))
              ? localLog
              : remoteLog;
          if (
            remoteLog.date === today &&
            localEditTime !== null &&
            !preservePendingEdit
          ) {
            clearLocalEdit('salah', today, localEditTime);
          }
          resolvedByDate[remoteLog.date] = resolved;
          saveDayLog(resolved);
        }

        for (const localLog of Object.values(localLogs)) {
          if (!remoteByDate.has(localLog.date)) {
            resolvedByDate[localLog.date] = localLog;
            saveDayLog(localLog);
          }
        }

        const latestLocal = latestLog.current;
        const resolvedToday =
          localRevision.current !== startingRevision
            ? latestLocal
            : resolvedByDate[today] ?? localLogs[today] ?? log;
        if (localRevision.current !== startingRevision) {
          resolvedByDate[today] = resolvedToday;
          saveDayLog(resolvedToday);
        }
        const resolvedLogs = Object.values(resolvedByDate);
        const todaySnapshot = JSON.stringify(resolvedToday);
        const todayEditTime = getLocalEditTime('salah', today);
        const remoteToday = remoteByDate.get(today);
        lastPushed.current = remoteToday ? JSON.stringify(remoteToday) : JSON.stringify(emptyDay(today));
        pendingLocal.current = todaySnapshot;

        onPullComplete(resolvedLogs);

        for (const resolvedLog of resolvedLogs) {
          const remoteLog = remoteByDate.get(resolvedLog.date);
          if (!remoteLog || JSON.stringify(remoteLog) !== JSON.stringify(resolvedLog)) {
            if (!(await pushLog(user.id, resolvedLog))) {
              enqueue(user.id, {
                date: resolvedLog.date,
                log: resolvedLog,
                queuedAt: Date.now(),
              });
            } else if (resolvedLog.date === today) {
              lastPushed.current = todaySnapshot;
              if (
                todayEditTime !== null &&
                JSON.stringify(latestLog.current) === todaySnapshot
              ) {
                clearLocalEdit('salah', today, todayEditTime);
              }
            }
          }
        }
        if (cancelled) return;
        setReadyUserId(user.id);
        await flushQueue(user.id);
      } catch (error) {
        console.error('Could not pull ṣalāh logs:', error);
        if (!cancelled) {
          setStatus(navigator.onLine ? 'error' : 'offline');
          retryTimer = setTimeout(initialize, 15_000);
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

  useEffect(() => {
    if (!user || readyUserId !== user.id) return;

    const poll = async () => {
      if (
        pendingLocal.current !== lastPushed.current ||
        JSON.stringify(latestLog.current) !== lastPushed.current
      ) return;
      const pollRevision = localRevision.current;
      const { data, error } = await supabase
        .from('salah_progress')
        .select('log')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (error) {
        console.error('Could not check for remote ṣalāh updates:', error.message);
        setStatus(navigator.onLine ? 'error' : 'offline');
        return;
      }
      if (!data) {
        settleStatus(user.id);
        return;
      }
      if (localRevision.current !== pollRevision) {
        settleStatus(user.id);
        return;
      }

      const remoteLog: DayLog = {
        ...emptyDay(today),
        ...(data.log as Partial<DayLog>),
        date: today,
      };
      const incoming = JSON.stringify(remoteLog);
      if (incoming === JSON.stringify(latestLog.current)) {
        settleStatus(user.id);
        return;
      }

      saveDayLog(remoteLog);
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
    if (!user || readyUserId !== user.id) return;
    const snapshot = JSON.stringify(log);
    const localEditTime = getLocalEditTime('salah', today);
    pendingLocal.current = snapshot;

    if (!navigator.onLine) {
      enqueue(user.id, { date: today, log, queuedAt: Date.now() });
      setStatus('offline');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus('syncing');
    debounceRef.current = setTimeout(async () => {
      const item = { date: today, log, queuedAt: Date.now() };
      if (await pushLog(user.id, log)) {
        lastPushed.current = snapshot;
        removeQueued(user.id, item);
        if (
          localEditTime !== null &&
          snapshot === JSON.stringify(latestLog.current)
        ) {
          clearLocalEdit('salah', today, localEditTime);
        }
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

  return { flushQueue, status };
}
