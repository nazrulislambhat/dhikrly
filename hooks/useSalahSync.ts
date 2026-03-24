'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getAllLogs, saveDayLog, emptyDay } from '@/lib/salahStorage';
import type { DayLog } from '@/types/salah';

const SALAH_QUEUE_KEY = 'salah_sync_queue_v1';

/* ── Offline queue ─────────────────────────────────────────────────── */
interface QueueItem {
  date: string;
  log: DayLog;
  queuedAt: number;
}

function enqueue(item: QueueItem) {
  try {
    const raw = localStorage.getItem(SALAH_QUEUE_KEY);
    const q: QueueItem[] = raw ? JSON.parse(raw) : [];
    const filtered = q.filter(i => i.date !== item.date);
    filtered.push(item);
    if (filtered.length > 90) filtered.splice(0, filtered.length - 90);
    localStorage.setItem(SALAH_QUEUE_KEY, JSON.stringify(filtered));
  } catch { /* quota */ }
}

function dequeue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(SALAH_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function clearQueue() {
  try { localStorage.removeItem(SALAH_QUEUE_KEY); } catch { /* */ }
}

/* ── Supabase push / pull ─────────────────────────────────────────── */
async function pushLog(userId: string, log: DayLog): Promise<boolean> {
  const { error } = await supabase
    .from('salah_progress')
    .upsert(
      { user_id: userId, date: log.date, log, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    );
  return !error;
}

async function pullAllLogs(userId: string): Promise<DayLog[]> {
  const { data, error } = await supabase
    .from('salah_progress')
    .select('date, log')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(120);

  if (error || !data) return [];
  return data.map(row => ({
    ...(emptyDay(row.date)),
    ...(row.log as Partial<DayLog>),
    date: row.date,
  }));
}

/* ── Main hook ─────────────────────────────────────────────────────── */
interface UseSalahSyncOptions {
  user: User | null;
  today: string;
  log: DayLog;
  /** Called after initial pull — update local state with remote data */
  onPullComplete: (logs: DayLog[]) => void;
  /** Called when another device updates today's log */
  onRemoteLogUpdate: (log: DayLog) => void;
}

export function useSalahSync({
  user,
  today,
  log,
  onPullComplete,
  onRemoteLogUpdate,
}: UseSalahSyncOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushed = useRef<string>('');
  const isFlushing = useRef(false);

  /* ── Flush offline queue ── */
  const flushQueue = useCallback(async (userId: string) => {
    if (isFlushing.current) return;
    isFlushing.current = true;
    try {
      const items = dequeue();
      if (items.length === 0) return;
      const results = await Promise.all(items.map(item => pushLog(userId, item.log)));
      if (results.every(Boolean)) clearQueue();
    } finally {
      isFlushing.current = false;
    }
  }, []);

  /* ── Initial pull on login ── */
  useEffect(() => {
    if (!user) return;

    (async () => {
      const remoteLogs = await pullAllLogs(user.id);
      if (remoteLogs.length === 0) return;

      // Merge: remote wins, save each to localStorage
      remoteLogs.forEach(remoteLog => {
        const localAll = getAllLogs();
        // Remote wins if it has more prayers logged
        const localLog = localAll[remoteLog.date];
        const remoteCount = Object.values(remoteLog.prayers).filter(Boolean).length;
        const localCount = localLog
          ? Object.values(localLog.prayers).filter(Boolean).length
          : 0;
        if (remoteCount >= localCount) {
          saveDayLog(remoteLog);
        }
      });

      onPullComplete(remoteLogs);
      await flushQueue(user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* ── Poll for remote changes every 5 seconds ── */
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      const { data } = await supabase
        .from('salah_progress')
        .select('log, updated_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!data) return;

      const incoming = JSON.stringify(data.log);
      if (incoming === lastPushed.current) return;
      if (incoming === JSON.stringify(log)) return;

      const remoteLog: DayLog = {
        ...emptyDay(today),
        ...(data.log as Partial<DayLog>),
        date: today,
      };
      saveDayLog(remoteLog);
      onRemoteLogUpdate(remoteLog);
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [user?.id, today, log, onRemoteLogUpdate]);

  /* ── Debounced push on log change ── */
  useEffect(() => {
    if (!user) {
      enqueue({ date: today, log, queuedAt: Date.now() });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      lastPushed.current = JSON.stringify(log);
      if (navigator.onLine) {
        await pushLog(user.id, log);
      } else {
        enqueue({ date: today, log, queuedAt: Date.now() });
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log]);

  /* ── Flush queue on reconnect ── */
  useEffect(() => {
    if (!user) return;
    const handleOnline = () => flushQueue(user.id);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, flushQueue]);
}
