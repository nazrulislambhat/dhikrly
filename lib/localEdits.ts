import { load, save } from './storage';

export type LocalEditArea = 'adhkar' | 'salah';

const LOCAL_EDITS_KEY = 'dhikr_local_sync_edits_v1';

function editKey(area: LocalEditArea, date: string) {
  return `${area}:${date}`;
}

export function markLocalEdit(area: LocalEditArea, date: string): number {
  const edits = load<Record<string, number>>(LOCAL_EDITS_KEY, {});
  const updatedAt = Date.now();
  edits[editKey(area, date)] = updatedAt;
  save(LOCAL_EDITS_KEY, edits);
  return updatedAt;
}

export function getLocalEditTime(area: LocalEditArea, date: string): number | null {
  const updatedAt = load<Record<string, number>>(LOCAL_EDITS_KEY, {})[editKey(area, date)];
  return typeof updatedAt === 'number' && Number.isFinite(updatedAt)
    ? updatedAt
    : null;
}

export function clearLocalEdit(
  area: LocalEditArea,
  date: string,
  expectedUpdatedAt?: number,
): void {
  const edits = load<Record<string, number>>(LOCAL_EDITS_KEY, {});
  const key = editKey(area, date);
  if (!(key in edits)) return;
  if (expectedUpdatedAt !== undefined && edits[key] !== expectedUpdatedAt) return;
  delete edits[key];
  save(LOCAL_EDITS_KEY, edits);
}

export function shouldPreserveLocalEdit(
  hasPendingEdit: boolean,
  localSnapshot: unknown,
  remoteSnapshot: unknown,
): boolean {
  return hasPendingEdit && JSON.stringify(localSnapshot) !== JSON.stringify(remoteSnapshot);
}
