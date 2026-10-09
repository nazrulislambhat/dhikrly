'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { load, save, STORAGE_KEY, CUSTOM_DUAS_KEY, STREAK_KEY } from '@/lib/storage';
import type { Dua, Streak } from '@/types';

const QUEUE_KEY = 'adhkar_sync_queue_v2';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface QueueItem {
  type: 'progress' | 'custom_duas' | 'streak';
  date?: string;
  payload: unknown;
  queuedAt: number;
}

function queueKey(userId: string) {
  return `${QUEUE_KEY}_${userId}`;
}

function enqueue(userId: string, item: QueueItem) {
  const key = queueKey(userId);
  try {
    const queue = load<QueueItem[]>(key, []);
    const filtered = queue.filter(
      (queued) => !(queued.type === item.type && queued.date === item.date),
    );
    filtered.push(item);
    if (filtered.length > 90) filtered.splice(0, filtered.length - 90);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Could not save the adhkār sync queue:', error);
  }
}

function dequeue(userId: string) {
  return load<QueueItem[]>(queueKey(userId), []);
}

function removeQueued(userId: string, item: QueueItem) {
  const key = queueKey(userId);
  try {
    const queue = load<QueueItem[]>(key, []);
    const remaining = queue.filter(
      (queued) =>
        !(
          queued.type === item.type &&
          queued.date === item.date &&
          queued.queuedAt === item.queuedAt &&
          JSON.stringify(queued.payload) === JSON.stringify(item.payload)
        ),
    );
    if (remaining.length > 0) localStorage.setItem(key, JSON.stringify(remaining));
    else localStorage.removeItem(key);
  } catch (error) {
    console.error('Could not update the adhkār sync queue:', error);
  }
}

const progressWrites = new Map<string, Promise<boolean>>();

async function pushProgress(
  userId: string,
  date: string,
  checked: Record<string, boolean>,
): Promise<boolean> {
  const key = `${userId}:${date}`;
  const previousWrite = progressWrites.get(key) ?? Promise.resolve(true);
  const write = previousWrite.catch(() => false).then(async () => {
    try {
      const { error } = await supabase
        .from('daily_progress')
        .upsert(
          { user_id: userId, date, checked, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' },
        );
      if (error) console.error('Could not sync adhkār progress:', error.message);
      return !error;
    } catch (error) {
      console.error('Could not sync adhkār progress:', error);
      return false;
    }
  });
  progressWrites.set(key, write);

  try {
    return await write;
  } finally {
    if (progressWrites.get(key) === write) progressWrites.delete(key);
  }
}

async function pushCustomDuas(userId: string, duas: Dua[]): Promise<boolean> {
  try {
    const { data: currentDuas, error: readError } = await supabase
      .from('custom_duas')
      .select('local_id')
      .eq('user_id', userId);
    if (readError) {
      console.error('Could not read synced custom duas:', readError.message);
      return false;
    }

    const desiredIds = new Set(duas.map((dua) => dua.id));
    const removedIds = (currentDuas ?? [])
      .map((row) => row.local_id as string)
      .filter((id) => !desiredIds.has(id));
    if (removedIds.length > 0) {
      const { error } = await supabase
        .from('custom_duas')
        .delete()
        .eq('user_id', userId)
        .in('local_id', removedIds);
      if (error) {
        console.error('Could not remove synced custom duas:', error.message);
        return false;
      }
    }

    if (duas.length === 0) return true;
    const { error } = await supabase.from('custom_duas').upsert(
      duas.map((dua) => ({ user_id: userId, local_id: dua.id, dua })),
      { onConflict: 'user_id,local_id' },
    );
    if (error) console.error('Could not sync custom duas:', error.message);
    return !error;
  } catch (error) {
    console.error('Could not sync custom duas:', error);
    return false;
  }
}

async function pushStreak(userId: string, streak: Streak): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert(
        { user_id: userId, streak, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    if (error) console.error('Could not sync adhkār streak:', error.message);
    return !error;
  } catch (error) {
    console.error('Could not sync adhkār streak:', error);
    return false;
  }
}

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
    supabase.from('user_data').select('streak').eq('user_id', userId).maybeSingle(),
  ]);

  const error = progressRes.error ?? customRes.error ?? userRes.error;
  if (error) throw error;

  const checkedByDate: Record<string, Record<string, boolean>> = {};
  (progressRes.data ?? []).forEach((row) => {
    checkedByDate[row.date] = row.checked as Record<string, boolean>;
  });

  return {
    checkedByDate,
    customDuas: (customRes.data ?? []).map((row) => row.dua as Dua),
    streak: userRes.data?.streak ? (userRes.data.streak as Streak) : null,
  };
}

interface UseSyncOptions {
  user: User | null;
  today: string;
  checked: Record<string, boolean>;
  localRevision: { current: number };
  customDuas: Dua[];
  streak: Streak;
  onPullComplete: (data: {
    checkedByDate: Record<string, Record<string, boolean>>;
    customDuas: Dua[];
    streak: Streak;
  }) => void;
  onRemoteCheckedUpdate: (checked: Record<string, boolean>) => void;
}

export function useSync({
  user,
  today,
  checked,
  localRevision,
  customDuas,
  streak,
  onPullComplete,
  onRemoteCheckedUpdate,
}: UseSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncing = useRef(false);
  const lastPushedChecked = useRef<string>('__init__');
  const pendingChecked = useRef<string>('__init__');
  const latestChecked = useRef(checked);
  latestChecked.current = checked;

  const settleStatus = useCallback((userId: string) => {
    if (!navigator.onLine) setStatus('offline');
    else if (
      pendingChecked.current !== lastPushedChecked.current ||
      dequeue(userId).length > 0
    ) {
      setStatus('syncing');
    } else {
      setStatus('synced');
    }
  }, []);

  const flushQueue = useCallback(async (userId: string) => {
    if (isSyncing.current) return;
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    isSyncing.current = true;
    setStatus('syncing');
    let failed = false;
    try {
      for (const item of dequeue(userId)) {
        let succeeded = false;
        if (item.type === 'progress' && item.date) {
          succeeded = await pushProgress(
            userId,
            item.date,
            item.payload as Record<string, boolean>,
          );
          if (
            succeeded &&
            item.date === today &&
            JSON.stringify(item.payload) === pendingChecked.current
          ) {
            lastPushedChecked.current = pendingChecked.current;
          }
        } else if (item.type === 'custom_duas') {
          succeeded = await pushCustomDuas(userId, item.payload as Dua[]);
        } else if (item.type === 'streak') {
          succeeded = await pushStreak(userId, item.payload as Streak);
        }

        if (succeeded) removeQueued(userId, item);
        else failed = true;
      }
    } finally {
      isSyncing.current = false;
    }
    setStatus(
      !navigator.onLine
        ? 'offline'
        : failed || dequeue(userId).length > 0
          ? 'error'
          : pendingChecked.current !== lastPushedChecked.current
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
    setStatus('syncing');
    const initialize = async () => {
      try {
        await flushQueue(user.id);
        if (cancelled) return;
        setStatus('syncing');
        const remote = await pullFromSupabase(user.id);
        if (cancelled) return;

        const localAll = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
        const mergedByDate = { ...localAll };
        Object.entries(remote.checkedByDate).forEach(([date, remoteChecked]) => {
          if (date === today) {
            const localToday = localAll[today] ?? {};
            const localDone = Object.values(localToday).filter(Boolean).length;
            const remoteDone = Object.values(remoteChecked).filter(Boolean).length;
            if (remoteDone > localDone) mergedByDate[date] = remoteChecked;
          } else {
            mergedByDate[date] = remoteChecked;
          }
        });
        if (localRevision.current !== startingRevision) {
          mergedByDate[today] = latestChecked.current;
        }
        save(STORAGE_KEY, mergedByDate);

        const resolvedToday = mergedByDate[today] ?? {};
        const resolvedTodayString = JSON.stringify(resolvedToday);
        lastPushedChecked.current = JSON.stringify(remote.checkedByDate[today] ?? {});
        pendingChecked.current = resolvedTodayString;

        const localStreak = load<Streak>(STREAK_KEY, {
          current: 0,
          best: 0,
          lastComplete: '',
        });
        let mergedStreak: Streak = localStreak;
        if (remote.streak) {
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

        const resolvedCustomDuas =
          remote.customDuas.length > 0
            ? remote.customDuas
            : load<Dua[]>(CUSTOM_DUAS_KEY, customDuas);

        onPullComplete({
          checkedByDate: mergedByDate,
          customDuas: resolvedCustomDuas,
          streak: mergedStreak,
        });

        const remoteToday = remote.checkedByDate[today] ?? {};
        if (JSON.stringify(resolvedToday) !== JSON.stringify(remoteToday)) {
          if (await pushProgress(user.id, today, resolvedToday)) {
            lastPushedChecked.current = resolvedTodayString;
          } else {
            enqueue(user.id, {
              type: 'progress',
              date: today,
              payload: resolvedToday,
              queuedAt: Date.now(),
            });
          }
        }
        for (const [date, localChecked] of Object.entries(mergedByDate)) {
          if (date === today || remote.checkedByDate[date]) continue;
          const pushed = await pushProgress(user.id, date, localChecked);
          if (!pushed) {
            enqueue(user.id, {
              type: 'progress',
              date,
              payload: localChecked,
              queuedAt: Date.now(),
            });
          }
        }
        if (remote.customDuas.length === 0 && resolvedCustomDuas.length > 0) {
          const pushed = await pushCustomDuas(user.id, resolvedCustomDuas);
          if (!pushed) {
            enqueue(user.id, {
              type: 'custom_duas',
              payload: resolvedCustomDuas,
              queuedAt: Date.now(),
            });
          }
        }
        if (mergedStreak) {
          const pushed = await pushStreak(user.id, mergedStreak);
          if (!pushed) {
            enqueue(user.id, {
              type: 'streak',
              payload: mergedStreak,
              queuedAt: Date.now(),
            });
          }
        }
        if (cancelled) return;
        setReadyUserId(user.id);
        await flushQueue(user.id);
      } catch (error) {
        console.error('Could not pull adhkār data:', error);
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
    // Pull once per account or local date; callbacks and data are intentionally snapshots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today]);

  useEffect(() => {
    if (!user || readyUserId !== user.id) return;

    const poll = async () => {
      if (
        pendingChecked.current !== lastPushedChecked.current ||
        JSON.stringify(latestChecked.current) !== lastPushedChecked.current
      ) return;
      const pollRevision = localRevision.current;
      const { data, error } = await supabase
        .from('daily_progress')
        .select('checked')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (error) {
        console.error('Could not check for remote adhkār updates:', error.message);
        setStatus(navigator.onLine ? 'error' : 'offline');
        return;
      }
      if (localRevision.current !== pollRevision) {
        settleStatus(user.id);
        return;
      }
      if (!data) {
        settleStatus(user.id);
        return;
      }

      const incoming = JSON.stringify(data.checked);
      if (incoming === JSON.stringify(latestChecked.current)) {
        settleStatus(user.id);
        return;
      }

      const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      all[today] = data.checked as Record<string, boolean>;
      save(STORAGE_KEY, all);
      lastPushedChecked.current = incoming;
      pendingChecked.current = incoming;
      onRemoteCheckedUpdate(data.checked as Record<string, boolean>);
      settleStatus(user.id);
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today, readyUserId]);

  useEffect(() => {
    if (!user || readyUserId !== user.id) return;
    const snapshot = JSON.stringify(checked);
    pendingChecked.current = snapshot;

    if (!navigator.onLine) {
      enqueue(user.id, {
        type: 'progress',
        date: today,
        payload: checked,
        queuedAt: Date.now(),
      });
      setStatus('offline');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus('syncing');
    debounceRef.current = setTimeout(async () => {
      const item: QueueItem = {
        type: 'progress',
        date: today,
        payload: checked,
        queuedAt: Date.now(),
      };
      const succeeded = await pushProgress(user.id, today, checked);
      if (succeeded) {
        lastPushedChecked.current = snapshot;
        removeQueued(user.id, item);
        settleStatus(user.id);
      } else {
        enqueue(user.id, item);
        setStatus(navigator.onLine ? 'error' : 'offline');
      }
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [checked, today, user, readyUserId, settleStatus]);

  useEffect(() => {
    if (!user || readyUserId !== user.id) return;
    const syncValue = async (item: QueueItem) => {
      if (!navigator.onLine) {
        enqueue(user.id, item);
        setStatus('offline');
        return;
      }
      setStatus('syncing');
      const succeeded =
        item.type === 'custom_duas'
          ? await pushCustomDuas(user.id, item.payload as Dua[])
          : await pushStreak(user.id, item.payload as Streak);
      if (succeeded) {
        removeQueued(user.id, item);
        settleStatus(user.id);
      } else {
        enqueue(user.id, item);
        setStatus('error');
      }
    };

    void syncValue({
      type: 'custom_duas',
      payload: customDuas,
      queuedAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customDuas, user?.id, readyUserId, settleStatus]);

  useEffect(() => {
    if (!user || readyUserId !== user.id) return;
    const syncValue = async () => {
      const item: QueueItem = { type: 'streak', payload: streak, queuedAt: Date.now() };
      if (!navigator.onLine) {
        enqueue(user.id, item);
        setStatus('offline');
        return;
      }
      setStatus('syncing');
      if (await pushStreak(user.id, streak)) {
        removeQueued(user.id, item);
        settleStatus(user.id);
      } else {
        enqueue(user.id, item);
        setStatus('error');
      }
    };
    void syncValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak, user?.id, readyUserId, settleStatus]);

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
