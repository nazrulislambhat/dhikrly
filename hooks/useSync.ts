'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { load, save, STORAGE_KEY, CUSTOM_DUAS_KEY, STREAK_KEY } from '@/lib/storage';

function isTableMissingError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === '42P01' ||
    Boolean(e.message && (e.message.includes('does not exist') || e.message.includes('relation')))
  );
}
import {
  clearLocalEdit,
  getLocalEditTime,
} from '@/lib/localEdits';
import {
  adhkarEntries,
  checkedFromEntries,
  diffChecked,
  latestPracticeEntries,
  type PracticeEntry,
  type PracticeEntryWrite,
} from '@/lib/practiceEntries';
import type { Dua, Streak } from '@/types';

const QUEUE_KEY = 'adhkar_sync_queue_v2';

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
        .from('practice_entries')
        .upsert(
          adhkarEntries(date, checked).map((entry): PracticeEntryWrite => {
            const editTime = getLocalEditTime('adhkar', date, entry.item_key);
            return {
              user_id: userId,
              ...entry,
              updated_at: editTime === null
                ? entry.updated_at
                : new Date(editTime).toISOString(),
            };
          }),
          { onConflict: 'user_id,date,area,item_key' },
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
  updatedAtByDateAndItem: Record<string, Record<string, string>>;
  customDuas: Dua[];
  streak: Streak | null;
}> {
  const [entriesRes, legacyProgressRes, customRes, userRes] = await Promise.all([
    supabase
      .from('practice_entries')
      .select('date, area, item_key, value, updated_at')
      .eq('user_id', userId)
      .eq('area', 'adhkar')
      .order('date', { ascending: false })
      .limit(5000),
    supabase
      .from('daily_progress')
      .select('date, checked, updated_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(90),
    supabase.from('custom_duas').select('dua').eq('user_id', userId),
    supabase.from('user_data').select('streak').eq('user_id', userId).maybeSingle(),
  ]);

  const hasEntries = !entriesRes.error;
  const hasLegacy = !legacyProgressRes.error;

  if (entriesRes.error && !isTableMissingError(entriesRes.error)) throw entriesRes.error;
  if (legacyProgressRes.error && !isTableMissingError(legacyProgressRes.error)) throw legacyProgressRes.error;
  if (!hasEntries && !hasLegacy) {
    throw entriesRes.error ?? legacyProgressRes.error;
  }
  if (customRes.error && !isTableMissingError(customRes.error)) throw customRes.error;
  if (userRes.error && !isTableMissingError(userRes.error)) throw userRes.error;

  const legacyEntries: PracticeEntry[] = (legacyProgressRes.data ?? []).flatMap((row) =>
    Object.entries((row.checked ?? {}) as Record<string, boolean>).map(([item_key, value]) => ({
      date: row.date,
      area: 'adhkar' as const,
      item_key,
      value,
      updated_at: row.updated_at,
    })),
  );
  const normalizedEntries = (entriesRes.data ?? []) as PracticeEntry[];
  const latestEntries = latestPracticeEntries([...legacyEntries, ...normalizedEntries]);
  const normalizedByKey = new Map(
    normalizedEntries.map((entry) => [`${entry.date}:${entry.item_key}`, entry]),
  );
  const entriesToMigrate = latestEntries.filter((entry) => {
    const normalized = normalizedByKey.get(`${entry.date}:${entry.item_key}`);
    return !normalized || Date.parse(entry.updated_at) > Date.parse(normalized.updated_at);
  });
  if (entriesToMigrate.length > 0 && hasEntries) {
    try {
      await supabase
        .from('practice_entries')
        .upsert(
          entriesToMigrate.map((entry): PracticeEntryWrite => ({
            user_id: userId,
            ...entry,
          })),
          { onConflict: 'user_id,date,area,item_key' },
        );
    } catch {
      // Don't fail the pull if migration upsert fails
    }
  }

  const checkedByDate: Record<string, Record<string, boolean>> = {};
  const updatedAtByDateAndItem: Record<string, Record<string, string>> = {};
  for (const entry of latestEntries) {
    (checkedByDate[entry.date] ??= {})[entry.item_key] = entry.value === true;
    (updatedAtByDateAndItem[entry.date] ??= {})[entry.item_key] = entry.updated_at;
  }

  return {
    checkedByDate,
    updatedAtByDateAndItem,
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
    updatedAtByDateAndItem: Record<string, Record<string, string>>;
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
            if (item.date === today && item.snapshot &&
              JSON.stringify(item.snapshot) === JSON.stringify(latestChecked.current)) {
              clearLocalEdit('adhkar', today);
            }
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

        const legacyProgressQueue = dequeue(user.id).filter(
          (item) => item.type === 'progress' && item.date && !item.snapshot,
        );
        const queuedByDate = new Map<string, QueueItem[]>();
        for (const item of legacyProgressQueue) {
          const items = queuedByDate.get(item.date!) ?? [];
          items.push(item);
          queuedByDate.set(item.date!, items);
        }
        const localAll = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
        const mergedByDate: Record<string, Record<string, boolean>> = {};
        const dates = new Set([
          ...Object.keys(localAll),
          ...Object.keys(remote.checkedByDate),
          ...queuedByDate.keys(),
          today,
        ]);
        for (const date of dates) {
          const localDate = localAll[date] ?? (date === today ? latestChecked.current : {});
          const remoteDate = remote.checkedByDate[date] ?? {};
          const hasRemoteDate = date in remote.checkedByDate;
          const merged = { ...remoteDate };
          const legacyEditTime = getLocalEditTime('adhkar', date);
          const queued = queuedByDate.get(date) ?? [];
          const mergedTimeByItem = { ...(remote.updatedAtByDateAndItem[date] ?? {}) };
          for (const item of queued.sort((a, b) => a.queuedAt - b.queuedAt)) {
            const queuedSnapshot = item.payload as Record<string, boolean>;
            if (Object.keys(queuedSnapshot).length === 0) {
              for (const itemId of Object.keys(remoteDate)) {
                if (item.queuedAt >= Date.parse(mergedTimeByItem[itemId] ?? '')) {
                  merged[itemId] = false;
                  mergedTimeByItem[itemId] = new Date(item.queuedAt).toISOString();
                }
              }
            } else {
              for (const [itemId, value] of Object.entries(queuedSnapshot)) {
                const currentTime = mergedTimeByItem[itemId];
                if (!currentTime || item.queuedAt >= Date.parse(currentTime)) {
                  merged[itemId] = value;
                  mergedTimeByItem[itemId] = new Date(item.queuedAt).toISOString();
                }
              }
            }
          }

          for (const [itemId, localValue] of Object.entries(localDate)) {
            const editTime = getLocalEditTime('adhkar', date, itemId);
            const remoteTime = mergedTimeByItem[itemId];
            const localEditWins =
              !remoteTime ||
              (editTime !== null &&
                editTime >= Date.parse(remoteTime)) ||
              (legacyEditTime !== null &&
                legacyEditTime >= Date.parse(remoteTime ?? '') &&
                localValue !== remoteDate[itemId]);
            if (localEditWins) {
              merged[itemId] = date === today && localRevision.current !== startingRevision
                ? latestChecked.current[itemId] ?? localValue
                : localValue;
            } else if (editTime !== null) {
              clearLocalEdit('adhkar', date, itemId, editTime);
            }
          }
          if ((legacyEditTime !== null || queued.length > 0) && hasRemoteDate) {
            for (const itemId of Object.keys(remoteDate)) {
              if (
                legacyEditTime !== null &&
                Object.keys(localDate).length === 0 &&
                legacyEditTime >= Date.parse(mergedTimeByItem[itemId] ?? '')
              ) {
                merged[itemId] = false;
              } else if (
                queued.length > 0 &&
                queued.every((item) =>
                  Object.keys(item.payload as Record<string, boolean>).length === 0,
                ) &&
                !Object.hasOwn(merged, itemId)
              ) {
                merged[itemId] = false;
              }
            }
          }
          mergedByDate[date] = merged;
        }
        save(STORAGE_KEY, mergedByDate);
        for (const item of legacyProgressQueue) removeQueued(user.id, item);

        const resolvedToday = mergedByDate[today] ?? {};
        const resolvedTodayString = JSON.stringify(resolvedToday);
        lastPushedChecked.current = JSON.stringify(remote.checkedByDate[today] ?? {});
        pendingChecked.current = resolvedTodayString;
        checkedBaseline.current = resolvedToday;

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
          updatedAtByDateAndItem: remote.updatedAtByDateAndItem,
          customDuas: resolvedCustomDuas,
          streak: mergedStreak,
        });

        const remoteToday = remote.checkedByDate[today] ?? {};
        const todayChanges = diffChecked(resolvedToday, remoteToday);
        if (Object.keys(todayChanges).length > 0) {
          if (await pushProgress(user.id, today, todayChanges)) {
            lastPushedChecked.current = resolvedTodayString;
            for (const itemId of Object.keys(todayChanges)) {
              const editTime = getLocalEditTime('adhkar', today, itemId);
              if (editTime !== null) clearLocalEdit('adhkar', today, itemId, editTime);
            }
            if (getLocalEditTime('adhkar', today) !== null) clearLocalEdit('adhkar', today);
          } else {
            enqueue(user.id, {
              type: 'progress',
              date: today,
              payload: todayChanges,
              snapshot: resolvedToday,
              queuedAt: Date.now(),
            });
          }
        }
        for (const [date, localChecked] of Object.entries(mergedByDate)) {
          if (date === today) continue;
          const changes = diffChecked(localChecked, remote.checkedByDate[date] ?? {});
          if (Object.keys(changes).length === 0) continue;
          const pushed = await pushProgress(user.id, date, changes);
          if (!pushed) {
            enqueue(user.id, {
              type: 'progress',
              date,
              payload: changes,
              snapshot: localChecked,
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
        retryCount.current = 0;
        setReadyUserId(user.id);
        await flushQueue(user.id);
      } catch (error: unknown) {
        console.error('Could not pull adhkār data:', error);
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
        pendingChecked.current !== lastPushedChecked.current ||
        JSON.stringify(latestChecked.current) !== lastPushedChecked.current
      ) return;
      const pollRevision = localRevision.current;
      const { data, error } = await supabase
        .from('practice_entries')
        .select('date, area, item_key, value, updated_at')
        .eq('user_id', user.id)
        .eq('area', 'adhkar')
        .eq('date', today)
        .order('item_key', { ascending: true });
      if (error) {
        console.error('Could not check for remote adhkār updates:', error.message);
        setStatus(navigator.onLine ? 'error' : 'offline');
        return;
      }
      if (localRevision.current !== pollRevision) {
        settleStatus(user.id);
        return;
      }
      if (!data || data.length === 0) {
        settleStatus(user.id);
        return;
      }

      const incomingChecked = checkedFromEntries(data as PracticeEntry[]);
      const incoming = JSON.stringify(incomingChecked);
      if (incoming === JSON.stringify(latestChecked.current)) {
        settleStatus(user.id);
        return;
      }

      const all = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      all[today] = incomingChecked;
      save(STORAGE_KEY, all);
      lastPushedChecked.current = incoming;
      pendingChecked.current = incoming;
      checkedBaseline.current = incomingChecked;
      onRemoteCheckedUpdate(incomingChecked);
      settleStatus(user.id);
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, today, readyUserId]);

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
    const payload = changes;

    if (!navigator.onLine) {
      enqueue(user.id, {
        type: 'progress',
        date: today,
        payload,
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
        payload,
        snapshot: checked,
        queuedAt: Date.now(),
      };
      const succeeded = await pushProgress(user.id, today, payload);
      if (succeeded) {
        lastPushedChecked.current = snapshot;
        removeQueued(user.id, item);
        for (const itemId of changedIds) {
          const editTime = getLocalEditTime('adhkar', today, itemId);
          if (editTime !== null) clearLocalEdit('adhkar', today, itemId, editTime);
        }
        if (snapshot === JSON.stringify(latestChecked.current)) clearLocalEdit('adhkar', today);
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
