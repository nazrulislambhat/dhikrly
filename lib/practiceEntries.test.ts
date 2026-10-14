import { describe, expect, it } from 'vitest';
import {
  adhkarEntries,
  checkedFromEntries,
  diffChecked,
  latestPracticeEntries,
  salahEntries,
  salahFromEntries,
} from './practiceEntries';
import { emptyDay } from './salahStorage';

describe('normalized practice entries', () => {
  it('writes an explicit false row when an adhkār completion is undone', () => {
    expect(diffChecked({ morning: false }, { morning: true })).toEqual({
      morning: false,
    });
  });

  it('merges edits to different adhkār without losing either item', () => {
    const stored = adhkarEntries('2026-10-12', { morning: true }, '2026-10-12T08:00:00.000Z');
    const secondDevice = adhkarEntries(
      '2026-10-12',
      { evening: true },
      '2026-10-12T09:00:00.000Z',
    );

    expect(checkedFromEntries([...stored, ...secondDevice])).toEqual({
      morning: true,
      evening: true,
    });
  });

  it('keeps the latest edit when the same practice item is synced out of order', () => {
    const older = adhkarEntries('2026-10-12', { morning: true }, '2026-10-12T08:00:00.000Z');
    const newer = adhkarEntries('2026-10-12', { morning: false }, '2026-10-12T09:00:00.000Z');
    expect(checkedFromEntries(latestPracticeEntries([...newer, ...older]))).toEqual({
      morning: false,
    });
  });

  it('round-trips per-item prayer statuses and supplemental prayer state', () => {
    const log = emptyDay('2026-10-12');
    log.prayers.fajr = 'jamah';
    log.prayers.asr = 'missed';
    log.sunnah.fajrPre = true;
    log.tahajjud = { prayed: true, rakats: 8, durationMinutes: 25 };
    log.nafl.duha = true;

    expect(salahFromEntries(log.date, salahEntries(log))).toEqual(log);
  });

  it('updates one prayer while preserving the other normalized prayer entries', () => {
    const original = emptyDay('2026-10-12');
    original.prayers.fajr = 'prayed';
    original.prayers.isha = 'delayed';
    const changed = { ...original, prayers: { ...original.prayers, isha: null } };
    const persisted = latestPracticeEntries([
      ...salahEntries(original, '2026-10-12T08:00:00.000Z'),
      ...salahEntries(changed, '2026-10-12T09:00:00.000Z').filter(
        (entry) => entry.item_key === 'prayer:isha',
      ),
    ]);

    const restored = salahFromEntries(original.date, persisted);
    expect(restored.prayers.fajr).toBe('prayed');
    expect(restored.prayers.isha).toBeNull();
  });
});
