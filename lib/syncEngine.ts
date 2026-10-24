/**
 * Dhikrly Local-First Sync Engine
 * Batches client mutations and syncs with /api/v1/sync
 */

import { load, save, STORAGE_KEY, STREAK_KEY, CUSTOM_DUAS_KEY } from '@/lib/storage';
import { QADA_STORAGE_KEY } from '@/lib/qadaStorage';
import { QURAN_PROGRESS_KEY, QURAN_BOOKMARKS_KEY } from '@/lib/quran';

export interface AdhkarMutation {
  date: string;
  duaId: string;
  completed: boolean;
  timestamp: number;
}

export interface SalahMutation {
  date: string;
  prayer: string;
  status: string;
  isCongregation?: boolean;
  timestamp: number;
}

export interface SyncPayload {
  deviceId?: string;
  mutations: {
    adhkar?: AdhkarMutation[];
    salah?: SalahMutation[];
    qada?: {
      balances?: {
        fajr: number;
        dhuhr: number;
        asr: number;
        maghrib: number;
        isha: number;
        witr: number;
      };
      repayments?: { prayer: string; count: number; timestamp: number }[];
    };
    quran?: {
      progress?: { surah: number; ayah: number; page?: number; juz?: number };
      bookmarks?: { surah: number; ayah: number; note?: string; isDeleted?: boolean }[];
    };
    tasbih?: { dhikrKey: string; count: number; target?: number; timestamp: number }[];
    streak?: { currentStreak: number; longestStreak: number; lastCompletedDate?: string };
    customDuas?: {
      clientDuaId: string;
      title: string;
      arabic?: string;
      transliteration?: string;
      translation?: string;
      repeatCount?: number;
      category?: string;
      isDeleted?: boolean;
    }[];
  };
}

let pendingMutations: SyncPayload['mutations'] = {};
let syncTimeout: NodeJS.Timeout | null = null;
let isSyncing = false;

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('dhikrly_device_id_v1');
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem('dhikrly_device_id_v1', id);
  }
  return id;
}

/**
 * Queue an adhkār completion mutation
 */
export function queueAdhkarMutation(date: string, duaId: string, completed: boolean): void {
  if (!pendingMutations.adhkar) pendingMutations.adhkar = [];
  pendingMutations.adhkar.push({
    date,
    duaId,
    completed,
    timestamp: Date.now(),
  });
  scheduleSync();
}

/**
 * Queue a Ṣalāh prayer log mutation
 */
export function queueSalahMutation(
  date: string,
  prayer: string,
  status: string,
  isCongregation?: boolean
): void {
  if (!pendingMutations.salah) pendingMutations.salah = [];
  pendingMutations.salah.push({
    date,
    prayer,
    status,
    isCongregation,
    timestamp: Date.now(),
  });
  scheduleSync();
}

/**
 * Queue Qadā balance update
 */
export function queueQadaMutation(balances: {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
}): void {
  if (!pendingMutations.qada) pendingMutations.qada = {};
  pendingMutations.qada.balances = balances;
  scheduleSync();
}

/**
 * Queue Qur'an progress update
 */
export function queueQuranProgressMutation(progress: {
  surah: number;
  ayah: number;
  page?: number;
  juz?: number;
}): void {
  if (!pendingMutations.quran) pendingMutations.quran = {};
  pendingMutations.quran.progress = progress;
  scheduleSync();
}

/**
 * Queue a Tasbīḥ session
 */
export function queueTasbihMutation(dhikrKey: string, count: number, target?: number): void {
  if (!pendingMutations.tasbih) pendingMutations.tasbih = [];
  pendingMutations.tasbih.push({
    dhikrKey,
    count,
    target,
    timestamp: Date.now(),
  });
  scheduleSync();
}

/**
 * Queue a streak update
 */
export function queueStreakMutation(currentStreak: number, longestStreak: number, lastCompletedDate?: string): void {
  pendingMutations.streak = { currentStreak, longestStreak, lastCompletedDate };
  scheduleSync();
}

/**
 * Debounce sync trigger (fires after 2.5 seconds of user inactivity or immediately on flush)
 */
export function scheduleSync(delayMs = 2500): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    void flushSync();
  }, delayMs);
}

/**
 * Flush all pending queued mutations to /api/v1/sync
 */
export async function flushSync(): Promise<boolean> {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }

  const hasItems =
    (pendingMutations.adhkar && pendingMutations.adhkar.length > 0) ||
    (pendingMutations.salah && pendingMutations.salah.length > 0) ||
    Boolean(pendingMutations.qada) ||
    Boolean(pendingMutations.quran) ||
    (pendingMutations.tasbih && pendingMutations.tasbih.length > 0) ||
    Boolean(pendingMutations.streak) ||
    (pendingMutations.customDuas && pendingMutations.customDuas.length > 0);

  if (!hasItems || isSyncing || typeof window === 'undefined') {
    return false;
  }

  const batch = { ...pendingMutations };
  pendingMutations = {};
  isSyncing = true;

  try {
    const res = await fetch('/api/v1/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        mutations: batch,
      }),
    });

    if (!res.ok) {
      // If unauthorized (user logged out), do not re-queue
      if (res.status === 401) {
        return false;
      }
      // Re-queue items on network error
      pendingMutations = {
        adhkar: [...(batch.adhkar || []), ...(pendingMutations.adhkar || [])],
        salah: [...(batch.salah || []), ...(pendingMutations.salah || [])],
        ...batch,
        ...pendingMutations,
      };
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Sync Engine] Network error during batch sync:', err);
    // Put back batch
    pendingMutations = { ...batch, ...pendingMutations };
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Pull full remote state from /api/v1/sync and merge with local storage
 */
export async function pullRemoteSyncState(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const res = await fetch('/api/v1/sync', { cache: 'no-store' });
    if (!res.ok) return false;

    const body = await res.json();
    if (!body?.data) return false;

    const data = body.data;

    // 1. Merge Adhkār
    if (data.adhkar && typeof data.adhkar === 'object') {
      const localAdhkar = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      const mergedAdhkar: Record<string, Record<string, boolean>> = { ...localAdhkar };

      for (const [date, remoteChecked] of Object.entries(data.adhkar as Record<string, Record<string, boolean>>)) {
        mergedAdhkar[date] = {
          ...(mergedAdhkar[date] || {}),
          ...remoteChecked,
        };
      }
      save(STORAGE_KEY, mergedAdhkar);
    }

    // 2. Merge Qadā
    if (data.qada) {
      save(QADA_STORAGE_KEY, data.qada);
    }

    // 3. Merge Qur'an
    if (data.quran?.progress) {
      save(QURAN_PROGRESS_KEY, data.quran.progress);
    }
    if (Array.isArray(data.quran?.bookmarks) && data.quran.bookmarks.length > 0) {
      save(QURAN_BOOKMARKS_KEY, data.quran.bookmarks);
    }

    // 4. Merge Streak
    if (data.streak) {
      save(STREAK_KEY, data.streak);
    }

    // Dispatch event to refresh active UI
    window.dispatchEvent(new Event('dhikrly:sync-completed'));
    return true;
  } catch (err) {
    console.warn('[Sync Engine] Failed to pull remote sync state:', err);
    return false;
  }
}

/**
 * Automatically migrate all historical local data to the cloud on user login
 */
export async function migrateLocalDataToCloud(
  userId: string,
  force = false
): Promise<{ success: boolean; migratedCount: number }> {
  if (typeof window === 'undefined') return { success: false, migratedCount: 0 };

  const migrationKey = `dhikrly_cloud_migrated_${userId}`;
  if (!force && localStorage.getItem(migrationKey)) {
    return { success: true, migratedCount: 0 };
  }

  try {
    const mutations: SyncPayload['mutations'] = {};

    // 1. Gather all Adhkār completions
    const localAdhkar = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
    const adhkarMutations: AdhkarMutation[] = [];
    for (const [date, checkedMap] of Object.entries(localAdhkar)) {
      if (!checkedMap || typeof checkedMap !== 'object') continue;
      for (const [duaId, isDone] of Object.entries(checkedMap)) {
        if (isDone) {
          adhkarMutations.push({
            date,
            duaId,
            completed: true,
            timestamp: Date.now(),
          });
        }
      }
    }
    if (adhkarMutations.length > 0) {
      mutations.adhkar = adhkarMutations;
    }

    // 2. Gather Ṣalāh logs from localStorage
    const salahMutations: SalahMutation[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('salah_log_')) {
        const date = key.replace('salah_log_', '');
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const dayLog = JSON.parse(raw);
            if (dayLog.prayers && typeof dayLog.prayers === 'object') {
              for (const [prayer, status] of Object.entries(dayLog.prayers)) {
                if (status) {
                  salahMutations.push({
                    date,
                    prayer,
                    status: String(status),
                    isCongregation: status === 'jamah',
                    timestamp: Date.now(),
                  });
                }
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }
    if (salahMutations.length > 0) {
      mutations.salah = salahMutations;
    }

    // 3. Gather Qadā state
    const qada = load<Record<string, unknown> | null>(QADA_STORAGE_KEY, null);
    if (qada) {
      mutations.qada = {
        balances: {
          fajr: Number(qada.fajr) || 0,
          dhuhr: Number(qada.dhuhr) || 0,
          asr: Number(qada.asr) || 0,
          maghrib: Number(qada.maghrib) || 0,
          isha: Number(qada.isha) || 0,
          witr: Number(qada.witr) || 0,
        },
      };
    }

    // 4. Gather Streak
    const streak = load<{ current?: number; best?: number; lastComplete?: string } | null>(STREAK_KEY, null);
    if (streak) {
      mutations.streak = {
        currentStreak: streak.current || 0,
        longestStreak: streak.best || 0,
        lastCompletedDate: streak.lastComplete || undefined,
      };
    }

    // 5. Gather Custom Du‘ās
    const custom = load<Array<{ id: string; title?: string; arabic?: string; transliteration?: string; translation?: string; repeat?: number; category?: string }>>(CUSTOM_DUAS_KEY, []);
    if (Array.isArray(custom) && custom.length > 0) {
      mutations.customDuas = custom.map((d) => ({
        clientDuaId: d.id,
        title: d.title || 'Untitled',
        arabic: d.arabic,
        transliteration: d.transliteration,
        translation: d.translation,
        repeatCount: d.repeat || 1,
        category: d.category || 'custom',
      }));
    }

    // 6. Gather Qur'an Progress & Bookmarks
    const quranProg = load<{ surah: number; ayah: number; page?: number; juz?: number } | null>(QURAN_PROGRESS_KEY, null);
    if (quranProg) {
      mutations.quran = {
        progress: quranProg,
      };
    }

    const bookmarks = load<Array<{ surah: number; ayah: number; note?: string }>>(QURAN_BOOKMARKS_KEY, []);
    if (Array.isArray(bookmarks) && bookmarks.length > 0) {
      if (!mutations.quran) mutations.quran = {};
      mutations.quran.bookmarks = bookmarks.map((b) => ({
        surah: b.surah,
        ayah: b.ayah,
        note: b.note,
      }));
    }

    const totalCount =
      (mutations.adhkar?.length || 0) +
      (mutations.salah?.length || 0) +
      (mutations.customDuas?.length || 0) +
      (mutations.quran?.bookmarks?.length || 0) +
      (mutations.qada ? 1 : 0);

    if (totalCount > 0) {
      const res = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          mutations,
        }),
      });

      if (res.ok) {
        localStorage.setItem(migrationKey, Date.now().toString());
        console.log(`[Cloud Migration] Migrated ${totalCount} local records to cloud account.`);
        return { success: true, migratedCount: totalCount };
      }
    } else {
      localStorage.setItem(migrationKey, Date.now().toString());
    }

    return { success: true, migratedCount: totalCount };
  } catch (err) {
    console.warn('[Cloud Migration] Migration failed, will retry next session:', err);
    return { success: false, migratedCount: 0 };
  }
}

// Automatically flush pending mutations when tab is backgrounded
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushSync();
    }
  });
  window.addEventListener('beforeunload', () => {
    void flushSync();
  });
}

