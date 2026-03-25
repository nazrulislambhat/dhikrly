'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { load, save, STORAGE_KEY, CUSTOM_DUAS_KEY, STREAK_KEY } from '@/lib/storage';
import type { Dua, Streak } from '@/types';

/* ── Offline queue ─────────────────────────────────────────────────── */
const QUEUE_KEY = 'adhkar_sync_queue_v1';

interface QueueItem {
  type: 'progress' | 'custom_duas' | 'streak';
  date?: string;
  payload: unknown;
  queuedAt: number;
}

function enqueue(item: QueueItem) {
  const q = load<QueueItem[]>(QUEUE_KEY, []);
  const filtered = q.filter(
    (i) => !(i.type === item.type && i.date === item.date)
  );
  filtered.push(item);
  if (filtered.length > 90) filtered.splice(0, filtered.length - 90);
  save(QUEUE_KEY, filtered);
}

function dequeue(): QueueItem[] {
  return load<QueueItem[]>(QUEUE_KEY, []);
}

function clearQueue() {
  save(QUEUE_KEY, []);
}

/* ── Supabase push helpers ─────────────────────────────────────────── */
async function pushProgress(
  userId: string,
  date: string,
  checked: Record<string, boolean>
): Promise<boolean> {
  const { error } = await supabase
    .from('daily_progress')
    .upsert(
      { user_id: userId, date, checked, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    );
  return !error;
}

async function pushCustomDuas(userId: string, duas: Dua[]): Promise<boolean> {
  await supabase.from('custom_duas').delete().eq('user_id', userId);
  if (duas.length === 0) return true;
  const { error } = await supabase.from('custom_duas').insert(
    duas.map((d) => ({ user_id: userId, local_id: d.id, dua: d }))
  );
  return !error;
}

async function pushStreak(userId: string, streak: Streak): Promise<boolean> {
  const { error } = await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, streak, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  return !error;
}

/* ── Pull all remote data ──────────────────────────────────────────── */
export async function pullFromSupabase(userId: string): Promise<{
  checkedByDate: Record<string, Record<string, boolean>>;
  customDuas: Dua[];
  streak: Streak | null;
}> {
  const [progressRes, customRes, userRes] = await Promise.all([
    supabase
      .from('daily_progress')
      .select('date, checked')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(90),
    supabase.from('custom_duas').select('dua').eq('user_id', userId),
    supabase.from('user_data').select('streak').eq('user_id', userId).single(),
  ]);

  const checkedByDate: Record<string, Record<string, boolean>> = {};
  (progressRes.data ?? []).forEach((row) => {
    checkedByDate[row.date] = row.checked as Record<string, boolean>;
  });

  const customDuas: Dua[] = (customRes.data ?? []).map((row) => row.dua as Dua);
  const streak: Streak | null = userRes.data?.streak
    ? (userRes.data.streak as Streak)
    : null;

  return { checkedByDate, customDuas, streak };
}

/* ── Main hook ─────────────────────────────────────────────────────── */
interface UseSyncOptions {
  user: User | null;
  today: string;
  checked: Record<string, boolean>;
  customDuas: Dua[];
  streak: Streak;
  /** Called once after initial pull on login */
  onPullComplete: (data: {
    checkedByDate: Record<string, Record<string, boolean>>;
    customDuas: Dua[];
    streak: Streak;
  }) => void;
  /** Called whenever another device updates today's progress */
  onRemoteCheckedUpdate: (checked: Record<string, boolean>) => void;
}

export function useSync({
  user,
  today,
  checked,
  customDuas,
  streak,
  onPullComplete,
  onRemoteCheckedUpdate,
}: UseSyncOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncing = useRef(false);
  // lastPushedChecked = what we have CONFIRMED reached Supabase
  // pendingChecked    = what we INTEND to push (set synchronously on every change)
  //
  // KEY RULE: if pending !== lastPushed, we have unsaved local changes.
  //           Skip the poll entirely — don't let Supabase's stale data overwrite us.
  const lastPushedChecked = useRef<string>('__init__');
  const pendingChecked = useRef<string>('__init__');

  /* ── Flush offline queue ─────────────────────────────────────────── */
  const flushQueue = useCallback(async (userId: string) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    try {
      const items = dequeue();
      if (items.length === 0) return;
      const results = await Promise.all(
        items.map(async (item) => {
          if (item.type === 'progress' && item.date)
            return pushProgress(userId, item.date, item.payload as Record<string, boolean>);
          if (item.type === 'custom_duas')
            return pushCustomDuas(userId, item.payload as Dua[]);
          if (item.type === 'streak')
            return pushStreak(userId, item.payload as Streak);
          return true;
        })
      );
      if (results.every(Boolean)) clearQueue();
    } finally {
      isSyncing.current = false;
    }
  }, []);

  /* ── Initial pull on login ───────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;

    (async () => {
      const remote = await pullFromSupabase(user.id);

      const localAll = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});

      // For today: only apply remote if local is empty (user hasn't started yet)
      // For past days: remote always wins (authoritative history)
      const todayKey = new Date().toISOString().slice(0, 10);
      const mergedByDate = { ...localAll };
      Object.entries(remote.checkedByDate).forEach(([date, remoteChecked]) => {
        if (date === todayKey) {
          const localToday = localAll[todayKey] ?? {};
          const localDone = Object.values(localToday).filter(Boolean).length;
          const remoteDone = Object.values(remoteChecked).filter(Boolean).length;
          // Only apply remote today if local has fewer completions
          if (remoteDone > localDone) {
            mergedByDate[date] = remoteChecked;
          }
        } else {
          mergedByDate[date] = remoteChecked;
        }
      });
      save(STORAGE_KEY, mergedByDate);

      // Seed both refs from today's remote data so poll starts in "clean" state
      const todayRemoteStr = JSON.stringify(mergedByDate[todayKey] ?? {});
      lastPushedChecked.current = todayRemoteStr;
      pendingChecked.current = todayRemoteStr;

      let mergedStreak = remote.streak;
      if (remote.streak) {
        const localStreak = load<Streak>(STREAK_KEY, { current: 0, best: 0, lastComplete: '' });
        mergedStreak = {
          current: Math.max(localStreak.current, remote.streak.current),
          best: Math.max(localStreak.best, remote.streak.best),
          lastComplete:
            remote.streak.lastComplete > localStreak.lastComplete
              ? remote.streak.lastComplete
              : localStreak.lastComplete,
        };
        save(STREAK_KEY, mergedStreak);
      }

      onPullComplete({
        checkedByDate: mergedByDate,
        customDuas:
          remote.customDuas.length > 0
            ? remote.customDuas
            : load<Dua[]>(CUSTOM_DUAS_KEY, []),
        streak: mergedStreak ?? load<Streak>(STREAK_KEY, { current: 0, best: 0, lastComplete: '' }),
      });

      await flushQueue(user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* ── Poll for remote changes every 5 seconds ────────────────────── */
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      // If we have unsaved local changes, skip — Supabase still has stale data
      // and applying it would undo the user's actions
      if (pendingChecked.current !== lastPushedChecked.current) return;

      const { data } = await supabase
        .from('daily_progress')
        .select('checked, updated_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!data) return;

      const incoming = JSON.stringify(data.checked);

      // Nothing new from remote
      if (incoming === JSON.stringify(checked)) return;

      // Remote has a different state — this is a genuine change from another device
      const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      all[today] = data.checked as Record<string, boolean>;
      save(STORAGE_KEY, all);
      // Update our refs so we don't bounce back
      lastPushedChecked.current = incoming;
      pendingChecked.current = incoming;
      onRemoteCheckedUpdate(data.checked as Record<string, boolean>);
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  // Intentionally exclude `checked` — we use refs for dirty-state tracking
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today]);

  /* ── Debounced push on local checked change ──────────────────────── */
  useEffect(() => {
    // Mark as dirty IMMEDIATELY — poll will skip until this is pushed
    pendingChecked.current = JSON.stringify(checked);

    if (!user) {
      enqueue({ type: 'progress', date: today, payload: checked, queuedAt: Date.now() });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (navigator.onLine) {
        const ok = await pushProgress(user.id, today, checked);
        if (ok) {
          // Only mark as clean once confirmed saved to Supabase
          lastPushedChecked.current = JSON.stringify(checked);
        }
      } else {
        enqueue({ type: 'progress', date: today, payload: checked, queuedAt: Date.now() });
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  /* ── Push custom duas ────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) { enqueue({ type: 'custom_duas', payload: customDuas, queuedAt: Date.now() }); return; }
    if (navigator.onLine) pushCustomDuas(user.id, customDuas);
    else enqueue({ type: 'custom_duas', payload: customDuas, queuedAt: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customDuas]);

  /* ── Push streak ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) { enqueue({ type: 'streak', payload: streak, queuedAt: Date.now() }); return; }
    if (navigator.onLine) pushStreak(user.id, streak);
    else enqueue({ type: 'streak', payload: streak, queuedAt: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  /* ── Flush queue on reconnect ────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const handleOnline = () => flushQueue(user.id);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, flushQueue]);

  return { flushQueue };
}
