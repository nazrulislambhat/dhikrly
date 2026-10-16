import { describe, expect, it } from 'vitest';
import { mergeSalahLogs } from './useSalahSync';
import { emptyDay } from '@/lib/salahStorage';

describe('mergeSalahLogs - zero data loss', () => {
  it('preserves completed prayers from remote when local is not yet recorded', () => {
    const local = emptyDay('2026-10-16');
    const remote = emptyDay('2026-10-16');
    remote.prayers.fajr = 'jamah';
    remote.prayers.dhuhr = 'prayed';
    remote.sunnah.fajrPre = true;

    const merged = mergeSalahLogs(local, remote);
    expect(merged.prayers.fajr).toBe('jamah');
    expect(merged.prayers.dhuhr).toBe('prayed');
    expect(merged.sunnah.fajrPre).toBe(true);
  });

  it('preserves completed prayers from local when remote is empty', () => {
    const local = emptyDay('2026-10-16');
    local.prayers.asr = 'prayed';
    local.sunnah.asrPre = true;
    const remote = emptyDay('2026-10-16');

    const merged = mergeSalahLogs(local, remote);
    expect(merged.prayers.asr).toBe('prayed');
    expect(merged.sunnah.asrPre).toBe(true);
  });

  it('merges prayers across both local and remote without dropping either', () => {
    const local = emptyDay('2026-10-16');
    local.prayers.maghrib = 'prayed';
    local.tahajjud = { prayed: true, rakats: 4, durationMinutes: 20 };

    const remote = emptyDay('2026-10-16');
    remote.prayers.fajr = 'jamah';
    remote.prayers.dhuhr = 'prayed';
    remote.nafl.duha = true;

    const merged = mergeSalahLogs(local, remote);
    expect(merged.prayers.fajr).toBe('jamah');
    expect(merged.prayers.dhuhr).toBe('prayed');
    expect(merged.prayers.maghrib).toBe('prayed');
    expect(merged.tahajjud.prayed).toBe(true);
    expect(merged.tahajjud.rakats).toBe(4);
    expect(merged.nafl.duha).toBe(true);
  });
});
