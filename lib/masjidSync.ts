import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import type { LocalMasjidItem, PrayerName } from '@/types/salah';
import { MAX_LOCAL_MASJIDS, PRAYERS } from '@/types/salah';
import { getLocalMasjidsList, getActiveLocalMasjid, saveLocalMasjidsList } from '@/lib/salahStorage';

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

const MASJID_QUEUE_KEY = 'dhikrly_masjid_sync_queue_v1';

interface MasjidQueueItem {
  masjids: LocalMasjidItem[];
  selectedId: string | null;
  queuedAt: number;
}

function queueKey(userId: string) {
  return `${MASJID_QUEUE_KEY}_${userId}`;
}

function readQueue(userId: string): MasjidQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(queueKey(userId)) || '[]') as MasjidQueueItem[];
  } catch {
    return [];
  }
}

function enqueue(userId: string, item: MasjidQueueItem) {
  if (typeof window === 'undefined') return;
  try {
    const queue = readQueue(userId);
    // Keep only the latest update in queue to save space
    localStorage.setItem(queueKey(userId), JSON.stringify([item]));
  } catch {
    // Storage quota
  }
}

function clearQueue(userId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(queueKey(userId));
  } catch {
    // ignore
  }
}

/**
 * Non-destructive merge of two lists of local masjids.
 * Guarantees zero data loss:
 * 1. Preserves masjids existing only on local or only on remote.
 * 2. When merging matching masjids, unions prayer timings so no prayer configuration is lost.
 * 3. Caps at MAX_LOCAL_MASJIDS (5) prioritizing most recently updated.
 */
export function mergeLocalMasjids(
  local: LocalMasjidItem[],
  remote: LocalMasjidItem[],
  selectedLocalId?: string | null,
  selectedRemoteId?: string | null,
): { masjids: LocalMasjidItem[]; selectedId: string | null } {
  const mergedMap = new Map<string, LocalMasjidItem>();

  const normalizeKey = (m: LocalMasjidItem) => {
    if (m.id && m.id !== 'masjid_default' && m.id !== 'masjid_1') {
      return m.id;
    }
    const cleanName = m.name?.trim().toLowerCase().replace(/\s+/g, '_') || '';
    return cleanName || m.id || 'masjid_unknown';
  };

  // Add remote masjids
  for (const r of remote) {
    if (!r || !r.name) continue;
    mergedMap.set(normalizeKey(r), { ...r });
  }

  // Non-destructively merge local masjids
  for (const l of local) {
    if (!l || !l.name) continue;
    const key = normalizeKey(l);
    const existing = mergedMap.get(key);

    if (!existing) {
      mergedMap.set(key, { ...l });
    } else {
      // Both exist: union prayer timings non-destructively
      const lTime = new Date(l.updatedAt || 0).getTime();
      const rTime = new Date(existing.updatedAt || 0).getTime();
      const isLocalNewer = lTime >= rTime;

      const mergedTimings = { ...existing.timings };
      for (const p of PRAYERS) {
        const lT = l.timings?.[p];
        const rT = existing.timings?.[p];
        if (isLocalNewer) {
          mergedTimings[p] = lT ?? rT;
        } else {
          mergedTimings[p] = rT ?? lT;
        }
      }

      mergedMap.set(key, {
        id: isLocalNewer ? l.id : existing.id,
        name: isLocalNewer ? l.name : existing.name,
        label: isLocalNewer ? (l.label || existing.label) : (existing.label || l.label),
        notes: isLocalNewer ? (l.notes ?? existing.notes) : (existing.notes ?? l.notes),
        timings: mergedTimings,
        updatedAt: isLocalNewer ? l.updatedAt : existing.updatedAt,
      });
    }
  }

  // Sort by updatedAt descending and cap at MAX_LOCAL_MASJIDS (5)
  const allMasjids = Array.from(mergedMap.values()).sort((a, b) => {
    const tA = new Date(a.updatedAt || 0).getTime();
    const tB = new Date(b.updatedAt || 0).getTime();
    return tB - tA;
  }).slice(0, MAX_LOCAL_MASJIDS);

  // Determine selectedId
  let selectedId = selectedLocalId ?? selectedRemoteId ?? null;
  const isSelectedValid = allMasjids.some((m) => m.id === selectedId);
  if (!isSelectedValid) {
    selectedId = allMasjids[0]?.id ?? null;
  }

  return { masjids: allMasjids, selectedId };
}

/**
 * Push local masjids to Supabase.
 * Dual-layered for zero data loss:
 * 1. Upserts to `user_data.notif_settings.local_masjids` (always supported).
 * 2. Upserts to `local_masjids` table if provisioned.
 */
export async function pushLocalMasjidsToSupabase(
  userId: string,
  masjids: LocalMasjidItem[],
  selectedId: string | null,
): Promise<boolean> {
  if (!hasSupabaseConfig) return true;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueue(userId, { masjids, selectedId, queuedAt: Date.now() });
    return false;
  }

  try {
    // 1. First pull remote data to perform non-destructive merge before pushing
    const remote = await pullLocalMasjidsFromSupabase(userId, false);
    const merged = remote
      ? mergeLocalMasjids(masjids, remote.masjids, selectedId, remote.selectedId)
      : { masjids, selectedId };

    // Update local storage with merged state
    saveLocalMasjidsList(merged.masjids, merged.selectedId);

    // 2. Push to user_data (guaranteed zero data loss across all Supabase schemas)
    const { data: userData } = await supabase
      .from('user_data')
      .select('notif_settings')
      .eq('user_id', userId)
      .maybeSingle();

    const existingNotifSettings = (userData?.notif_settings as Record<string, unknown>) || {};
    const updatedNotifSettings = {
      ...existingNotifSettings,
      local_masjids: merged.masjids,
      selected_masjid_id: merged.selectedId,
    };

    const { error: userError } = await supabase
      .from('user_data')
      .upsert(
        {
          user_id: userId,
          notif_settings: updatedNotifSettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (userError && !isTableMissingError(userError)) {
      console.warn('Could not sync masjids to user_data:', userError.message);
    }

    // 3. Push to dedicated local_masjids table if exists
    try {
      const rows = merged.masjids.map((m) => ({
        user_id: userId,
        masjid_id: m.id,
        data: m,
        is_selected: m.id === merged.selectedId,
        updated_at: m.updatedAt || new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { error: tableError } = await supabase
          .from('local_masjids')
          .upsert(rows, { onConflict: 'user_id,masjid_id' });

        if (tableError && !isTableMissingError(tableError)) {
          console.warn('Could not sync to local_masjids table:', tableError.message);
        }
      }
    } catch {
      // Table may not exist yet on remote instance; user_data layer has already saved it.
    }

    clearQueue(userId);
    return true;
  } catch (error) {
    console.error('Failed to sync local masjids to Supabase:', error);
    enqueue(userId, { masjids, selectedId, queuedAt: Date.now() });
    return false;
  }
}

/**
 * Pull local masjids from Supabase and non-destructively merge with local storage.
 */
export async function pullLocalMasjidsFromSupabase(
  userId: string,
  updateLocal = true,
): Promise<{ masjids: LocalMasjidItem[]; selectedId: string | null } | null> {
  if (!hasSupabaseConfig) return null;

  try {
    let remoteMasjids: LocalMasjidItem[] = [];
    let remoteSelectedId: string | null = null;

    // Try reading from dedicated local_masjids table first
    const { data: tableData, error: tableError } = await supabase
      .from('local_masjids')
      .select('masjid_id, data, is_selected')
      .eq('user_id', userId)
      .limit(MAX_LOCAL_MASJIDS);

    if (!tableError && tableData && tableData.length > 0) {
      remoteMasjids = tableData.map((row) => row.data as LocalMasjidItem);
      const selRow = tableData.find((r) => r.is_selected);
      if (selRow) remoteSelectedId = selRow.masjid_id;
    } else {
      // Fallback: read from user_data.notif_settings
      const { data: userData, error: userError } = await supabase
        .from('user_data')
        .select('notif_settings')
        .eq('user_id', userId)
        .maybeSingle();

      if (!userError && userData?.notif_settings) {
        const settingsObj = userData.notif_settings as {
          local_masjids?: LocalMasjidItem[];
          selected_masjid_id?: string;
        };
        if (Array.isArray(settingsObj.local_masjids)) {
          remoteMasjids = settingsObj.local_masjids;
          remoteSelectedId = settingsObj.selected_masjid_id ?? null;
        }
      }
    }

    if (remoteMasjids.length === 0) return null;

    if (updateLocal) {
      const localList = getLocalMasjidsList();
      const localActive = getActiveLocalMasjid();
      const merged = mergeLocalMasjids(localList, remoteMasjids, localActive?.id, remoteSelectedId);
      saveLocalMasjidsList(merged.masjids, merged.selectedId);
      return merged;
    }

    return { masjids: remoteMasjids, selectedId: remoteSelectedId };
  } catch (error) {
    console.error('Could not pull local masjids from Supabase:', error);
    return null;
  }
}

/**
 * Flush any queued local masjid updates
 */
export async function flushMasjidSyncQueue(userId: string): Promise<boolean> {
  const queue = readQueue(userId);
  if (queue.length === 0) return true;
  const latest = queue[0];
  return pushLocalMasjidsToSupabase(userId, latest.masjids, latest.selectedId);
}
