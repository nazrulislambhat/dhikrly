'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { load, save, STORAGE_KEY, CUSTOM_DUAS_KEY, STREAK_KEY } from '@/lib/storage';
import { clearLocalEdit, getLocalEditTime } from '@/lib/localEdits';
import { diffChecked } from '@/lib/practiceEntries';
import {
  getQuranTrackerData,
  saveQuranTrackerData,
  mergeQuranTrackerData,
  type QuranTrackerData,
} from '@/lib/quranTracker';
import type { Dua, Streak } from '@/types';

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

const QUEUE_KEY = 'adhkar_sync_queue_v3';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface QueueItem {
  type: 'progress' | 'custom_duas' | 'streak';
  date?: string;
  payload: unknown;
  snapshot?: Record<string, boolean>;
  queuedAt: number;
}

function queueKey(userId: string) {
  return `${QUEUE_KEY}_${userId}`;
}

function enqueue(userId: string, item: QueueItem) {
  const key = queueKey(userId);
  try {
    const queue = load<QueueItem[]>(key, []);
    const matching = queue.filter(
      (queued) => queued.type === item.type && queued.date === item.date,
    );
    const filtered = queue.filter(
      (queued) => !(queued.type === item.type && queued.date === item.date),
    );
    if (item.type === 'progress' && item.date && matching.length > 0) {
      const payload = Object.assign(
        {},
        ...matching.map((queued) => queued.payload as Record<string, boolean>),
        item.payload as Record<string, boolean>,
      );
      filtered.push({ ...item, payload });
    } else {
      filtered.push(item);
    }
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

/**
 * Push adhkār progress for a date to `daily_progress`.
 * CRITICAL: Fetches current remote checked (or merges with existing) so that
 * no completed dhikr or keys in Supabase DB are ever erased or removed.
 */
async function pushProgress(
  userId: string,
  date: string,
  checked: Record<string, boolean>,
): Promise<boolean> {
  const key = `${userId}:${date}`;
  const previousWrite = progressWrites.get(key) ?? Promise.resolve(true);
  const write = previousWrite.catch(() => false).then(async () => {
    try {
      // 1. Read existing remote checked if present to guarantee no data loss
      const { data: existingRow, error: readError } = await supabase
        .from('daily_progress')
        .select('checked')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

      if (readError && !isTableMissingError(readError)) {
        console.warn('Could not read existing daily_progress before push:', readError.message);
      }

      const existingChecked = (existingRow?.checked as Record<string, boolean>) || {};
      const mergedChecked = { ...existingChecked, ...checked };

      const { error } = await supabase
        .from('daily_progress')
        .upsert(
          {
            user_id: userId,
            date,
            checked: mergedChecked,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' },
        );

      if (error) {
        console.error('Could not sync adhkār daily_progress:', error.message);
        return false;
      }
      return true;
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

/**
 * Push custom duas to Supabase `custom_duas`.
 * CRITICAL: NEVER calls .delete()! Only upserts, so existing duas in Supabase are never lost.
 */
async function pushCustomDuas(userId: string, duas: Dua[]): Promise<boolean> {
  if (!duas || duas.length === 0) return true;
  try {
    const { error } = await supabase.from('custom_duas').upsert(
      duas.map((dua) => ({
        user_id: userId,
        local_id: dua.id,
        dua,
        created_at: new Date().toISOString(),
      })),
      { onConflict: 'user_id,local_id' },
    );
    if (error) {
      console.error('Could not sync custom duas:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Could not sync custom duas:', error);
    return false;
  }
}

/**
 * Push streak & Quran tracker to Supabase `user_data`.
 */
async function pushStreak(userId: string, streak: Streak): Promise<boolean> {
  try {
    const quranTracker = getQuranTrackerData();
    const streakPayload = {
      ...streak,
      quran_tracker: quranTracker,
    };
    const { error } = await supabase
      .from('user_data')
      .upsert(
        { user_id: userId, streak: streakPayload, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    if (error) {
      console.error('Could not sync adhkār streak & quran:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Could not sync adhkār streak & quran:', error);
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
      .select('date, checked, updated_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(365),
    supabase.from('custom_duas').select('local_id, dua').eq('user_id', userId),
    supabase.from('user_data').select('streak').eq('user_id', userId).maybeSingle(),
  ]);

  if (progressRes.error && !isTableMissingError(progressRes.error)) throw progressRes.error;
  if (customRes.error && !isTableMissingError(customRes.error)) throw customRes.error;
  if (userRes.error && !isTableMissingError(userRes.error)) throw userRes.error;

  const checkedByDate: Record<string, Record<string, boolean>> = {};
  for (const row of progressRes.data ?? []) {
    if (row.date && row.checked && typeof row.checked === 'object') {
      checkedByDate[row.date] = row.checked as Record<string, boolean>;
    }
  }

  const customDuas: Dua[] = (customRes.data ?? [])
    .map((row) => {
      const dua = row.dua as Dua;
      if (dua && typeof dua === 'object') {
        return { ...dua, id: row.local_id || dua.id };
      }
      return null;
    })
    .filter((d): d is Dua => d !== null);

  const rawStreak = userRes.data?.streak as (Streak & { quran_tracker?: QuranTrackerData }) | null;
  if (rawStreak?.quran_tracker) {
    const localTracker = getQuranTrackerData();
    const mergedTracker = mergeQuranTrackerData(localTracker, rawStreak.quran_tracker);
    saveQuranTrackerData(mergedTracker);
  }

  const streak = rawStreak
    ? {
        current: Number(rawStreak.current) || 0,
        best: Number(rawStreak.best) || 0,
        lastComplete: rawStreak.lastComplete || '',
      }
    : null;

  return {
    checkedByDate,
    customDuas,
    streak,
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
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncing = useRef(false);
  const lastPushedChecked = useRef<string>('__init__');
  const pendingChecked = useRef<string>('__init__');
  const latestChecked = useRef(checked);
  const checkedBaseline = useRef(checked);
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

  const retryCount = useRef(0);

  const flushQueue = useCallback(async (userId: string) => {
    if (isSyncing.current) return;
    if (!hasSupabaseConfig) {
      setStatus('synced');
      return;
    }
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
            item.snapshot &&
            JSON.stringify(item.snapshot) === pendingChecked.current
          ) {
            lastPushedChecked.current = pendingChecked.current;
          }
          if (succeeded) {
            for (const itemId of Object.keys(item.payload as Record<string, boolean>)) {
              const editTime = getLocalEditTime('adhkar', item.date, itemId);
              if (editTime !== null) clearLocalEdit('adhkar', item.date, itemId, editTime);
            }
            if (
              item.date === today &&
              item.snapshot &&
              JSON.stringify(item.snapshot) === JSON.stringify(latestChecked.current)
            ) {
              clearLocalEdit('adhkar', today);
            }
          }
        } else if (item.type === 'custom_duas') {
          succeeded = await pushCustomDuas(userId, item.payload as Dua[]);
        } else if (item.type === 'streak') {
          succeeded = await pushStreak(userId, item.payload as Streak);
        }

        if (succeeded) {
          removeQueued(userId, item);
        } else {
          failed = true;
        }
      }
    } finally {
      isSyncing.current = false;
    }
    const finalStatus: SyncStatus = !navigator.onLine
      ? 'offline'
      : failed || dequeue(userId).length > 0
        ? 'error'
        : pendingChecked.current !== lastPushedChecked.current
          ? 'syncing'
          : 'synced';

    setStatus(finalStatus);
    if (finalStatus === 'synced') {
      setLastSyncedAt(Date.now());
    }
  }, [today]);

  // Initial pull and merge with local data
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
        const remote = await pullFromSupabase(user.id);
        if (cancelled) return;

        // 1. Merge daily progress without losing remote or local completions
        const localAll = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
        const mergedByDate: Record<string, Record<string, boolean>> = {};
        const dates = new Set([
          ...Object.keys(localAll),
          ...Object.keys(remote.checkedByDate),
          today,
        ]);

        for (const date of dates) {
          const localDate = localAll[date] ?? (date === today ? latestChecked.current : {});
          const remoteDate = remote.checkedByDate[date] ?? {};
          // Non-destructive merge: preserve remote completions and local completions
          const merged: Record<string, boolean> = { ...remoteDate };
          for (const [key, val] of Object.entries(localDate)) {
            if (val === true || !Object.hasOwn(remoteDate, key)) {
              merged[key] = val;
            } else if (date === today && localRevision.current !== startingRevision) {
              merged[key] = latestChecked.current[key] ?? val;
            }
          }
          mergedByDate[date] = merged;
        }
        save(STORAGE_KEY, mergedByDate);

        // 2. Merge streak non-destructively (keep highest)
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

        // 3. Merge custom duas without losing ANY remote duas
        const localDuas = load<Dua[]>(CUSTOM_DUAS_KEY, customDuas);
        const duasMap = new Map<string, Dua>();
        for (const d of remote.customDuas) duasMap.set(d.id, d);
        for (const d of localDuas) duasMap.set(d.id, d);
        const mergedDuas = [...duasMap.values()];
        if (mergedDuas.length > 0) {
          save(CUSTOM_DUAS_KEY, mergedDuas);
        }

        const resolvedToday = mergedByDate[today] ?? {};
        const resolvedTodayString = JSON.stringify(resolvedToday);
        lastPushedChecked.current = resolvedTodayString;
        pendingChecked.current = resolvedTodayString;
        checkedBaseline.current = resolvedToday;

        onPullComplete({
          checkedByDate: mergedByDate,
          customDuas: mergedDuas,
          streak: mergedStreak,
        });

        // 4. Push today's resolved completions and any missing remote items
        await pushProgress(user.id, today, resolvedToday);
        if (mergedDuas.length > 0) {
          await pushCustomDuas(user.id, mergedDuas);
        }
        if (mergedStreak) {
          await pushStreak(user.id, mergedStreak);
        }

        if (cancelled) return;
        retryCount.current = 0;
        setReadyUserId(user.id);
        setLastSyncedAt(Date.now());
        await flushQueue(user.id);
      } catch (error: unknown) {
        console.error('Could not pull adhkār data:', error);
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
    // Pull once per account or local date; callbacks and data are intentionally snapshots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today]);

  // Polling for remote updates on today's progress
  useEffect(() => {
    if (!user || !hasSupabaseConfig || readyUserId !== user.id) return;

    const poll = async () => {
      if (
        pendingChecked.current !== lastPushedChecked.current ||
        JSON.stringify(latestChecked.current) !== lastPushedChecked.current
      )
        return;

      const pollRevision = localRevision.current;
      const { data, error } = await supabase
        .from('daily_progress')
        .select('checked')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        if (!isTableMissingError(error)) {
          console.error('Could not check for remote adhkār updates:', error.message);
        }
        return;
      }
      if (localRevision.current !== pollRevision) {
        settleStatus(user.id);
        return;
      }
      if (!data?.checked || typeof data.checked !== 'object') {
        settleStatus(user.id);
        return;
      }

      const incomingChecked = data.checked as Record<string, boolean>;
      const incoming = JSON.stringify(incomingChecked);
      if (incoming === JSON.stringify(latestChecked.current)) {
        settleStatus(user.id);
        return;
      }

      // Merge remote checked with local checked without losing completions
      const mergedChecked = { ...latestChecked.current, ...incomingChecked };
      const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      all[today] = mergedChecked;
      save(STORAGE_KEY, all);
      lastPushedChecked.current = incoming;
      pendingChecked.current = incoming;
      checkedBaseline.current = mergedChecked;
      onRemoteCheckedUpdate(mergedChecked);
      settleStatus(user.id);
    };

    const interval = setInterval(poll, 12_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today, readyUserId]);

  // Auto-sync whenever local `checked` changes
  useEffect(() => {
    if (!user || !hasSupabaseConfig || readyUserId !== user.id) return;
    const snapshot = JSON.stringify(checked);
    const changes = diffChecked(checked, checkedBaseline.current);
    checkedBaseline.current = checked;
    pendingChecked.current = snapshot;
    const changedIds = Object.keys(changes);
    if (changedIds.length === 0) {
      settleStatus(user.id);
      return;
    }

    if (!navigator.onLine) {
      enqueue(user.id, {
        type: 'progress',
        date: today,
        payload: checked,
        snapshot: checked,
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
        snapshot: checked,
        queuedAt: Date.now(),
      };
      const succeeded = await pushProgress(user.id, today, checked);
      if (succeeded) {
        lastPushedChecked.current = snapshot;
        removeQueued(user.id, item);
        for (const itemId of changedIds) {
          const editTime = getLocalEditTime('adhkar', today, itemId);
          if (editTime !== null) clearLocalEdit('adhkar', today, itemId, editTime);
        }
        if (snapshot === JSON.stringify(latestChecked.current)) clearLocalEdit('adhkar', today);
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
  }, [checked, today, user, readyUserId, settleStatus]);

  // Auto-sync custom duas
  useEffect(() => {
    if (!user || readyUserId !== user.id || customDuas.length === 0) return;
    const syncValue = async () => {
      const item: QueueItem = {
        type: 'custom_duas',
        payload: customDuas,
        queuedAt: Date.now(),
      };
      if (!navigator.onLine) {
        enqueue(user.id, item);
        setStatus('offline');
        return;
      }
      setStatus('syncing');
      const succeeded = await pushCustomDuas(user.id, customDuas);
      if (succeeded) {
        removeQueued(user.id, item);
        setLastSyncedAt(Date.now());
        settleStatus(user.id);
      } else {
        enqueue(user.id, item);
        setStatus('error');
      }
    };

    void syncValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customDuas, user?.id, readyUserId, settleStatus]);

  // Auto-sync streak
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
        setLastSyncedAt(Date.now());
        settleStatus(user.id);
      } else {
        enqueue(user.id, item);
        setStatus('error');
      }
    };
    void syncValue();
  }, [streak, user?.id, readyUserId, settleStatus]);

  // Auto-sync Quran tracker updates
  useEffect(() => {
    if (!user || readyUserId !== user.id) return;
    const handleQuranUpdated = () => {
      void pushStreak(user.id, streak);
    };
    window.addEventListener('dhikrly:quran-tracker-updated', handleQuranUpdated);
    return () => {
      window.removeEventListener('dhikrly:quran-tracker-updated', handleQuranUpdated);
    };
  }, [user, readyUserId, streak]);

  // Background flush on reconnect & focus
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

  // Manual sync callback triggered by user button press
  const manualSync = useCallback(async (): Promise<boolean> => {
    if (!user || !hasSupabaseConfig) return false;
    if (!navigator.onLine) {
      setStatus('offline');
      return false;
    }

    setStatus('syncing');
    try {
      // 1. Pull remote data
      const remote = await pullFromSupabase(user.id);

      // 2. Merge local + remote
      const localAll = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      const mergedByDate: Record<string, Record<string, boolean>> = {};
      const dates = new Set([
        ...Object.keys(localAll),
        ...Object.keys(remote.checkedByDate),
        today,
      ]);

      for (const date of dates) {
        const localDate = localAll[date] ?? (date === today ? latestChecked.current : {});
        const remoteDate = remote.checkedByDate[date] ?? {};
        const merged: Record<string, boolean> = { ...remoteDate };
        for (const [key, val] of Object.entries(localDate)) {
          if (val === true || !Object.hasOwn(remoteDate, key)) {
            merged[key] = val;
          }
        }
        mergedByDate[date] = merged;
      }
      save(STORAGE_KEY, mergedByDate);

      // Streak merge
      const localStreak = load<Streak>(STREAK_KEY, streak);
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

      // Custom Duas merge
      const localDuas = load<Dua[]>(CUSTOM_DUAS_KEY, customDuas);
      const duasMap = new Map<string, Dua>();
      for (const d of remote.customDuas) duasMap.set(d.id, d);
      for (const d of localDuas) duasMap.set(d.id, d);
      const mergedDuas = [...duasMap.values()];
      if (mergedDuas.length > 0) {
        save(CUSTOM_DUAS_KEY, mergedDuas);
      }

      onPullComplete({
        checkedByDate: mergedByDate,
        customDuas: mergedDuas,
        streak: mergedStreak,
      });

      // 3. Push current latest
      await pushProgress(user.id, today, mergedByDate[today] ?? latestChecked.current);
      if (mergedDuas.length > 0) {
        await pushCustomDuas(user.id, mergedDuas);
      }
      await pushStreak(user.id, mergedStreak);
      await flushQueue(user.id);

      setLastSyncedAt(Date.now());
      setStatus('synced');
      return true;
    } catch (err) {
      console.error('Manual sync failed:', err);
      setStatus(navigator.onLine ? 'error' : 'offline');
      return false;
    }
  }, [user, today, streak, customDuas, onPullComplete, flushQueue]);

  return { flushQueue, status, manualSync, lastSyncedAt };
}
