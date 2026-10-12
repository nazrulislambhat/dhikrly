import { load, save } from './storage';

export type LocalEditArea = 'adhkar' | 'salah';

const LOCAL_EDITS_KEY = 'dhikr_local_sync_edits_v1';

function editKey(area: LocalEditArea, date: string, field?: string) {
  return field ? `${area}:${date}:${field}` : `${area}:${date}`;
}

export function markLocalEdit(area: LocalEditArea, date: string, field?: string): number {
  const edits = load<Record<string, number>>(LOCAL_EDITS_KEY, {});
  const key = editKey(area, date, field);
  const updatedAt = Math.max(Date.now(), (edits[key] ?? 0) + 1);
  edits[key] = updatedAt;
  save(LOCAL_EDITS_KEY, edits);
  return updatedAt;
}

export function getLocalEditTime(
  area: LocalEditArea,
  date: string,
  field?: string,
): number | null {
  const updatedAt = load<Record<string, number>>(LOCAL_EDITS_KEY, {})[
    editKey(area, date, field)
  ];
  return typeof updatedAt === 'number' && Number.isFinite(updatedAt)
    ? updatedAt
    : null;
}

export function clearLocalEdit(
  area: LocalEditArea,
  date: string,
  fieldOrExpectedUpdatedAt?: string | number,
  expectedUpdatedAt?: number,
): void {
  const edits = load<Record<string, number>>(LOCAL_EDITS_KEY, {});
  const field = typeof fieldOrExpectedUpdatedAt === 'string' ? fieldOrExpectedUpdatedAt : undefined;
  const expected = typeof fieldOrExpectedUpdatedAt === 'number'
    ? fieldOrExpectedUpdatedAt
    : expectedUpdatedAt;
  if (field) {
    const key = editKey(area, date, field);
    if (!(key in edits)) return;
    if (expected !== undefined && edits[key] !== expected) return;
    delete edits[key];
  } else {
    const prefix = `${area}:${date}`;
    for (const key of Object.keys(edits)) {
      if (key === prefix || key.startsWith(`${prefix}:`)) {
        if (expected !== undefined && edits[key] !== expected) continue;
        delete edits[key];
      }
    }
  }
  save(LOCAL_EDITS_KEY, edits);
}

export function shouldPreserveLocalEdit(
  hasPendingEdit: boolean,
  localSnapshot: unknown,
  remoteSnapshot: unknown,
): boolean {
  return hasPendingEdit && JSON.stringify(localSnapshot) !== JSON.stringify(remoteSnapshot);
}
