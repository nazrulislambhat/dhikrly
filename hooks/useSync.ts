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
  date?: string;          // for progress items
  payload: unknown;
  queuedAt: number;
}

function enqueue(item: QueueItem) {
  const q = load<QueueItem[]>(QUEUE_KEY, []);
  // Deduplicate: replace existing item of same type+date
  const filtered = q.filter(
    (i) => !(i.type === item.type && i.date === item.date)
  );
  filtered.push(item);
  // Keep queue lean — max 90 items
  if (filtered.length > 90) filtered.splice(0, filtered.length - 90);
  save(QUEUE_KEY, filtered);
}

function dequeue(): QueueItem[] {
  return load<QueueItem[]>(QUEUE_KEY, []);
}

function clearQueue() {
  save(QUEUE_KEY, []);
}

/* ── Sync helpers ─────────────────────────────────────────────────── */
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

async function pushCustomDuas(
  userId: string,
  duas: Dua[]
): Promise<boolean> {
  if (duas.length === 0) return true;
  // Delete all user's custom duas then re-insert (simplest conflict strategy)
  await supabase.from('custom_duas').delete().eq('user_id', userId);
  if (duas.length === 0) return true;
  const { error } = await supabase.from('custom_duas').insert(
    duas.map((d) => ({ user_id: userId, local_id: d.id, dua: d }))
  );
  return !error;
}

async function pushStreak(
  userId: string,
  streak: Streak
): Promise<boolean> {
  const { error } = await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, streak, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  return !error;
}

/* ── Pull from Supabase → merge into localStorage ─────────────────── */
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
    supabase
      .from('custom_duas')
      .select('dua')
      .eq('user_id', userId),
    supabase
      .from('user_data')
      .select('streak')
      .eq('user_id', userId)
      .single(),
  ]);

  const checkedByDate: Record<string, Record<string, boolean>> = {};
  (progressRes.data ?? []).forEach((row) => {
    checkedByDate[row.date] = row.checked as Record<string, boolean>;
  });

  const customDuas: Dua[] = (customRes.data ?? []).map(
    (row) => row.dua as Dua
  );

  const streak: Streak | null =
    userRes.data?.streak
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
  onPullComplete: (data: {
    checkedByDate: Record<string, Record<string, boolean>>;
    customDuas: Dua[];
    streak: Streak;
  }) => void;
}

export function useSync({
  user,
  today,
  checked,
  customDuas,
  streak,
  onPullComplete,
}: UseSyncOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncing = useRef(false);

  /* ── Initial pull when user logs in ── */
  useEffect(() => {
    if (!user) return;

    (async () => {
      const remote = await pullFromSupabase(user.id);

      // Merge: remote wins for dates that exist remotely;
      // local wins for dates that don't exist remotely yet
      const localAll = load<Record<string, Record<string, boolean>>>(
        STORAGE_KEY,
        {}
      );
      const merged = { ...localAll, ...remote.checkedByDate };
      save(STORAGE_KEY, merged);

      if (remote.streak) {
        const localStreak = load<Streak>(STREAK_KEY, {
          current: 0,
          best: 0,
          lastComplete: '',
        });
        // Remote wins on best streak; take the higher current
        const mergedStreak: Streak = {
          current: Math.max(localStreak.current, remote.streak.current),
          best: Math.max(localStreak.best, remote.streak.best),
          lastComplete:
            remote.streak.lastComplete > localStreak.lastComplete
              ? remote.streak.lastComplete
              : localStreak.lastComplete,
        };
        save(STREAK_KEY, mergedStreak);
        remote.streak = mergedStreak;
      }

      onPullComplete({
        checkedByDate: merged,
        customDuas:
          remote.customDuas.length > 0
            ? remote.customDuas
            : load<Dua[]>(CUSTOM_DUAS_KEY, []),
        streak: remote.streak ?? load<Streak>(STREAK_KEY, {
          current: 0,
          best: 0,
          lastComplete: '',
        }),
      });

      // Flush any queued offline changes now that we're online + authed
      await flushQueue(user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* ── Debounced push on checked/streak change ── */
  useEffect(() => {
    if (!user) {
      // No user — just queue the change for later
      enqueue({ type: 'progress', date: today, payload: checked, queuedAt: Date.now() });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (navigator.onLine) {
        await pushProgress(user.id, today, checked);
      } else {
        enqueue({ type: 'progress', date: today, payload: checked, queuedAt: Date.now() });
      }
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // We intentionally only re-run when checked changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  /* ── Push custom duas when they change ── */
  useEffect(() => {
    if (!user) {
      enqueue({ type: 'custom_duas', payload: customDuas, queuedAt: Date.now() });
      return;
    }
    if (navigator.onLine) {
      pushCustomDuas(user.id, customDuas);
    } else {
      enqueue({ type: 'custom_duas', payload: customDuas, queuedAt: Date.now() });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customDuas]);

  /* ── Push streak when it changes ── */
  useEffect(() => {
    if (!user) {
      enqueue({ type: 'streak', payload: streak, queuedAt: Date.now() });
      return;
    }
    if (navigator.onLine) {
      pushStreak(user.id, streak);
    } else {
      enqueue({ type: 'streak', payload: streak, queuedAt: Date.now() });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  /* ── Flush queue when coming back online ── */
  const flushQueue = useCallback(async (userId: string) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    try {
      const items = dequeue();
      if (items.length === 0) return;

      const results = await Promise.all(
        items.map(async (item) => {
          if (item.type === 'progress' && item.date) {
            return pushProgress(userId, item.date, item.payload as Record<string, boolean>);
          }
          if (item.type === 'custom_duas') {
            return pushCustomDuas(userId, item.payload as Dua[]);
          }
          if (item.type === 'streak') {
            return pushStreak(userId, item.payload as Streak);
          }
          return true;
        })
      );

      if (results.every(Boolean)) clearQueue();
    } finally {
      isSyncing.current = false;
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleOnline = () => flushQueue(user.id);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, flushQueue]);

  return { flushQueue };
}
