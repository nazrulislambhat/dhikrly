'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getAllLogs, saveDayLog, emptyDay } from '@/lib/salahStorage';
import type { DayLog } from '@/types/salah';

const SALAH_QUEUE_KEY = 'salah_sync_queue_v1';

/* ── Offline queue ── */
interface QueueItem { date: string; log: DayLog; queuedAt: number; }

function enqueue(item: QueueItem) {
  try {
    const q: QueueItem[] = JSON.parse(localStorage.getItem(SALAH_QUEUE_KEY) || '[]');
    const filtered = q.filter(i => i.date !== item.date);
    filtered.push(item);
    if (filtered.length > 90) filtered.splice(0, filtered.length - 90);
    localStorage.setItem(SALAH_QUEUE_KEY, JSON.stringify(filtered));
  } catch { /* quota */ }
}

function dequeue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(SALAH_QUEUE_KEY) || '[]'); } catch { return []; }
}

function clearQueue() {
  try { localStorage.removeItem(SALAH_QUEUE_KEY); } catch { /* */ }
}

/* ── Supabase helpers ── */
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
    ...emptyDay(row.date),
    ...(row.log as Partial<DayLog>),
    date: row.date,
  }));
}

/* ── Main hook ── */
interface UseSalahSyncOptions {
  user: User | null;
  today: string;
  log: DayLog;
  onPullComplete: (logs: DayLog[]) => void;
  onRemoteLogUpdate: (log: DayLog) => void;
}

export function useSalahSync({
  user, today, log, onPullComplete, onRemoteLogUpdate,
}: UseSalahSyncOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushing = useRef(false);
  // lastPushed  = what we confirmed reached Supabase
  // pendingLocal = what we intend to push (set synchronously on every change)
  //
  // KEY RULE: if pending !== lastPushed, we have unsaved local changes.
  //           Skip the poll — Supabase still has stale data.
  const lastPushed = useRef<string>('__init__');
  const pendingLocal = useRef<string>('__init__');

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
      if (remoteLogs.length === 0) {
        // No remote data — seed refs as clean so polling works immediately
        const todayStr = JSON.stringify(log);
        lastPushed.current = todayStr;
        pendingLocal.current = todayStr;
        return;
      }

      const todayStr = new Date().toISOString().slice(0, 10);

      remoteLogs.forEach(remoteLog => {
        if (remoteLog.date === todayStr) {
          const localAll = getAllLogs();
          const localLog = localAll[todayStr];
          const remoteCount = Object.values(remoteLog.prayers).filter(Boolean).length;
          const localCount = localLog ? Object.values(localLog.prayers).filter(Boolean).length : 0;
          if (remoteCount > localCount) saveDayLog(remoteLog);
        } else {
          saveDayLog(remoteLog);
        }
      });

      // Seed refs from today's resolved state so first poll starts clean
      const todayRemote = remoteLogs.find(l => l.date === todayStr);
      const resolvedLog = todayRemote ?? log;
      const seedStr = JSON.stringify(resolvedLog);
      lastPushed.current = seedStr;
      pendingLocal.current = seedStr;

      onPullComplete(remoteLogs);
      await flushQueue(user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* ── Poll for remote changes every 5 seconds ── */
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      // If we have unsaved local changes, skip — Supabase has stale data
      if (pendingLocal.current !== lastPushed.current) return;

      const { data } = await supabase
        .from('salah_progress')
        .select('log, updated_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!data) return;

      const incoming = JSON.stringify(data.log);

      // Nothing new
      if (incoming === JSON.stringify(log)) return;

      // Genuine remote change from another device
      const remoteLog: DayLog = {
        ...emptyDay(today),
        ...(data.log as Partial<DayLog>),
        date: today,
      };
      saveDayLog(remoteLog);
      // Update refs so we don't bounce
      lastPushed.current = incoming;
      pendingLocal.current = incoming;
      onRemoteLogUpdate(remoteLog);
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  // Intentionally exclude `log` — we use refs for dirty-state tracking
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today]);

  /* ── Debounced push on log change ── */
  useEffect(() => {
    // Mark as dirty IMMEDIATELY
    pendingLocal.current = JSON.stringify(log);

    if (!user) {
      enqueue({ date: today, log, queuedAt: Date.now() });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (navigator.onLine) {
        const ok = await pushLog(user.id, log);
        if (ok) {
          // Mark as clean only after confirmed save
          lastPushed.current = JSON.stringify(log);
        }
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
