import { describe, it, expect, beforeEach } from 'vitest';
import { mergeLocalMasjids } from './masjidSync';
import type { LocalMasjidItem } from '@/types/salah';
import { MAX_LOCAL_MASJIDS } from '@/types/salah';

describe('mergeLocalMasjids (Zero Data Loss)', () => {
  const sampleMasjidA: LocalMasjidItem = {
    id: 'masjid_1',
    name: 'Masjid Al-Noor',
    label: 'Home',
    notes: 'Near park',
    timings: {
      fajr: { azanTime: '05:00', iqamahTime: '05:30', notifyAzan: true },
      dhuhr: { azanTime: '12:30', iqamahTime: '13:00' },
    },
    updatedAt: '2026-10-19T10:00:00.000Z',
  };

  const sampleMasjidB: LocalMasjidItem = {
    id: 'masjid_2',
    name: 'Downtown Islamic Center',
    label: 'Work',
    timings: {
      dhuhr: { azanTime: '12:45', iqamahTime: '13:15', notifyAzan: true },
      asr: { azanTime: '16:00', iqamahTime: '16:30' },
    },
    updatedAt: '2026-10-19T09:00:00.000Z',
  };

  it('preserves remote masjids when local list is empty', () => {
    const result = mergeLocalMasjids([], [sampleMasjidA, sampleMasjidB], null, 'masjid_2');
    expect(result.masjids).toHaveLength(2);
    expect(result.masjids[0].id).toBe('masjid_1');
    expect(result.masjids[1].id).toBe('masjid_2');
    expect(result.selectedId).toBe('masjid_2');
  });

  it('preserves local masjids when remote list is empty', () => {
    const result = mergeLocalMasjids([sampleMasjidA], [], 'masjid_1', null);
    expect(result.masjids).toHaveLength(1);
    expect(result.masjids[0].name).toBe('Masjid Al-Noor');
    expect(result.selectedId).toBe('masjid_1');
  });

  it('merges disjoint masjids without losing either', () => {
    const local = [sampleMasjidA];
    const remote = [sampleMasjidB];

    const result = mergeLocalMasjids(local, remote, 'masjid_1', 'masjid_2');
    expect(result.masjids).toHaveLength(2);
    const ids = result.masjids.map((m) => m.id);
    expect(ids).toContain('masjid_1');
    expect(ids).toContain('masjid_2');
    expect(result.selectedId).toBe('masjid_1');
  });

  it('unions prayer timings when the same masjid is edited on both sides (non-destructive)', () => {
    // Local updated Fajr and Isha
    const localA: LocalMasjidItem = {
      id: 'masjid_1',
      name: 'Masjid Al-Noor',
      label: 'Home',
      timings: {
        fajr: { azanTime: '05:15', iqamahTime: '05:45', notifyAzan: true },
        isha: { azanTime: '20:00', iqamahTime: '20:30', notifyAzan: true },
      },
      updatedAt: '2026-10-19T12:00:00.000Z', // newer
    };

    // Remote had Maghrib and Dhuhr
    const remoteA: LocalMasjidItem = {
      id: 'masjid_1',
      name: 'Masjid Al-Noor',
      label: 'Home Mosque',
      timings: {
        dhuhr: { azanTime: '12:30', iqamahTime: '13:00' },
        maghrib: { azanTime: '18:15', iqamahTime: '18:25', notifyAzan: true },
      },
      updatedAt: '2026-10-19T10:00:00.000Z',
    };

    const result = mergeLocalMasjids([localA], [remoteA], 'masjid_1', 'masjid_1');
    expect(result.masjids).toHaveLength(1);
    const merged = result.masjids[0];

    // Local newer values kept for Fajr and Isha
    expect(merged.timings.fajr?.azanTime).toBe('05:15');
    expect(merged.timings.isha?.azanTime).toBe('20:00');

    // Remote timings not in local are PRESERVED (no data loss)
    expect(merged.timings.dhuhr?.azanTime).toBe('12:30');
    expect(merged.timings.maghrib?.azanTime).toBe('18:15');
    expect(merged.timings.maghrib?.notifyAzan).toBe(true);
  });

  it('caps at MAX_LOCAL_MASJIDS (5) prioritizing newest updated', () => {
    const listA: LocalMasjidItem[] = [
      { id: 'm1', name: 'M1', timings: {}, updatedAt: '2026-10-19T01:00:00.000Z' },
      { id: 'm2', name: 'M2', timings: {}, updatedAt: '2026-10-19T02:00:00.000Z' },
      { id: 'm3', name: 'M3', timings: {}, updatedAt: '2026-10-19T03:00:00.000Z' },
    ];
    const listB: LocalMasjidItem[] = [
      { id: 'm4', name: 'M4', timings: {}, updatedAt: '2026-10-19T04:00:00.000Z' },
      { id: 'm5', name: 'M5', timings: {}, updatedAt: '2026-10-19T05:00:00.000Z' },
      { id: 'm6', name: 'M6', timings: {}, updatedAt: '2026-10-19T06:00:00.000Z' },
    ];

    const result = mergeLocalMasjids(listA, listB);
    expect(result.masjids).toHaveLength(MAX_LOCAL_MASJIDS);
    expect(result.masjids).toHaveLength(5);
    // Should have top 5 most recent: m6, m5, m4, m3, m2 (m1 dropped as oldest)
    const ids = result.masjids.map((m) => m.id);
    expect(ids).toEqual(['m6', 'm5', 'm4', 'm3', 'm2']);
    expect(ids).not.toContain('m1');
  });

  it('falls back to the first masjid if selectedId is not in the merged list', () => {
    const local: LocalMasjidItem[] = [
      { id: 'm1', name: 'M1', timings: {}, updatedAt: '2026-10-19T01:00:00.000Z' },
    ];
    const result = mergeLocalMasjids(local, [], 'deleted_id', null);
    expect(result.selectedId).toBe('m1');
  });

  it('does not merge distinct mosques even if both had generic placeholder IDs', () => {
    const local: LocalMasjidItem[] = [
      { id: 'masjid_1', name: 'Mosque 1', updatedAt: '2026-10-20T10:00:00Z', timings: { fajr: { azanTime: '05:00', iqamahTime: '05:30' } } },
    ];
    const remote: LocalMasjidItem[] = [
      { id: 'masjid_1', name: 'Mosque 2', updatedAt: '2026-10-20T10:00:00Z', timings: { fajr: { azanTime: '05:15', iqamahTime: '05:45' } } },
    ];
    const result = mergeLocalMasjids(local, remote);
    expect(result.masjids).toHaveLength(2);
    const names = result.masjids.map((m) => m.name);
    expect(names).toContain('Mosque 1');
    expect(names).toContain('Mosque 2');
  });
});
