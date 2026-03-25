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

/* ── Supabase push/pull ── */
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

  // ── KEY FIX ──────────────────────────────────────────────────────────
  // lastPushed tracks what we have confirmed pushed to Supabase.
  // pendingLocal tracks what we INTEND to push (set immediately on change).
  // Poll only applies remote data if it differs from BOTH — this prevents
  // the poll from overwriting local changes during the debounce window.
  const lastPushed = useRef<string>('');
  const pendingLocal = useRef<string>('');
  // ─────────────────────────────────────────────────────────────────────

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

      const todayStr = new Date().toISOString().slice(0, 10);

      remoteLogs.forEach(remoteLog => {
        if (remoteLog.date === todayStr) {
          // For today: only apply if remote has more prayers logged
          const localAll = getAllLogs();
          const localLog = localAll[todayStr];
          const remoteCount = Object.values(remoteLog.prayers).filter(Boolean).length;
          const localCount = localLog ? Object.values(localLog.prayers).filter(Boolean).length : 0;
          if (remoteCount > localCount) {
            saveDayLog(remoteLog);
          }
        } else {
          // Past days: remote always wins
          saveDayLog(remoteLog);
        }
      });

      // Seed refs so first poll doesn't overwrite
      const todayRemote = remoteLogs.find(l => l.date === todayStr);
      if (todayRemote) {
        lastPushed.current = JSON.stringify(todayRemote);
        pendingLocal.current = JSON.stringify(todayRemote);
      }

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

      // Ignore if this is what we just pushed
      if (incoming === lastPushed.current) return;

      // ── KEY FIX: ignore if we have a local change not yet pushed ──
      // pendingLocal is set immediately when log changes (before debounce fires)
      // so any poll during the debounce window is correctly ignored
      if (incoming === pendingLocal.current) return;

      // Also ignore if it matches current UI state (no actual diff)
      if (incoming === JSON.stringify(log)) return;

      // Genuine remote change from another device — apply it
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
    // ── KEY FIX: update pendingLocal IMMEDIATELY (synchronously) ──
    // This means the poll can never overwrite changes made in the last 800ms
    pendingLocal.current = JSON.stringify(log);

    if (!user) {
      enqueue({ date: today, log, queuedAt: Date.now() });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (navigator.onLine) {
        const ok = await pushLog(user.id, log);
        if (ok) lastPushed.current = JSON.stringify(log);
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
