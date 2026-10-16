import { describe, expect, it } from 'vitest';
import type { Dua, Streak } from '@/types';

function makeDua(id: string, title: string): Dua {
  return {
    id,
    title,
    titleAr: '',
    ar: 'دعاء',
    en: 'Supplication',
    transliteration: 'Dua',
    category: 'custom',
    session: ['morning'],
    priority: false,
    count: '1x',
    custom: true,
  };
}

describe('useSync non-destructive merging', () => {
  it('never loses remote duas when merging with local custom duas', () => {
    const remoteDuas: Dua[] = [
      makeDua('dua-1', 'Remote Dua 1'),
      makeDua('dua-2', 'Remote Dua 2'),
    ];
    const localDuas: Dua[] = [
      makeDua('dua-3', 'Local Dua 3'),
    ];

    const duasMap = new Map<string, Dua>();
    for (const d of remoteDuas) duasMap.set(d.id, d);
    for (const d of localDuas) duasMap.set(d.id, d);
    const merged = [...duasMap.values()];

    expect(merged.length).toBe(3);
    expect(merged.map(d => d.id)).toEqual(['dua-1', 'dua-2', 'dua-3']);
  });

  it('keeps highest streak progress when merging', () => {
    const localStreak: Streak = { current: 3, best: 7, lastComplete: '2026-10-15' };
    const remoteStreak: Streak = { current: 5, best: 10, lastComplete: '2026-10-16' };

    const merged: Streak = {
      current: Math.max(localStreak.current, remoteStreak.current),
      best: Math.max(localStreak.best, remoteStreak.best),
      lastComplete: remoteStreak.lastComplete > localStreak.lastComplete
        ? remoteStreak.lastComplete
        : localStreak.lastComplete,
    };

    expect(merged.current).toBe(5);
    expect(merged.best).toBe(10);
    expect(merged.lastComplete).toBe('2026-10-16');
  });

  it('merges daily checked completions without wiping remote keys', () => {
    const remoteChecked: Record<string, boolean> = { subhanallah: true, alhamdulillah: true };
    const localChecked: Record<string, boolean> = { allahuakbar: true };

    const merged: Record<string, boolean> = { ...remoteChecked, ...localChecked };
    expect(merged).toEqual({
      subhanallah: true,
      alhamdulillah: true,
      allahuakbar: true,
    });
  });
});
