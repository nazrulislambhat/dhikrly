import { describe, it, expect, beforeEach } from 'vitest';
import {
  ALL_SURAHS,
  TOTAL_QURAN_SURAHS,
  TOTAL_QURAN_AYAHS,
  getQuranTrackerData,
  saveQuranTrackerData,
  addReadingLog,
  deleteReadingLog,
  toggleSurahCompleted,
  batchSetSurahsCompleted,
  computeQuranStats,
  mergeQuranTrackerData,
} from './quranTracker';

const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => store.clear(),
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  },
};

beforeEach(() => {
  store.clear();
  global.window = {
    localStorage: localStorageMock as unknown as Storage,
    dispatchEvent: () => true,
  } as unknown as Window & typeof globalThis;
  global.localStorage = localStorageMock as unknown as Storage;
});

describe('Quran Tracker Library', () => {
  it('initializes with default empty data', () => {
    const data = getQuranTrackerData();
    expect(data.completedSurahs).toEqual([]);
    expect(data.logs).toEqual([]);
    expect(data.updatedAt).toBeDefined();
  });

  it('has valid constants for 114 Surahs and 6,236 Ayahs', () => {
    expect(TOTAL_QURAN_SURAHS).toBe(114);
    expect(TOTAL_QURAN_AYAHS).toBe(6236);
    expect(ALL_SURAHS.length).toBe(114);
    expect(ALL_SURAHS[0].englishName).toBe('Al-Fatihah');
    expect(ALL_SURAHS[113].englishName).toBe('An-Nas');
  });

  it('adds reading log with correct Ayah counts and marks completion', () => {
    // Read Surah 1: Ayahs 1 to 7 (all 7 ayahs)
    const log = addReadingLog({
      surahNumber: 1,
      fromAyah: 1,
      toAyah: 7,
      date: '2026-10-16',
      notes: 'Deep reflection on Surah Al-Fatihah',
    });

    expect(log.surahNumber).toBe(1);
    expect(log.surahName).toBe('Al-Fatihah');
    expect(log.fromAyah).toBe(1);
    expect(log.toAyah).toBe(7);
    expect(log.ayahsCount).toBe(7);
    expect(log.isCompletedSurah).toBe(true);

    const data = getQuranTrackerData();
    expect(data.completedSurahs).toContain(1);
    expect(data.logs.length).toBe(1);
  });

  it('supports partial reading sessions without automatically marking full completion', () => {
    // Read Surah 2 (Al-Baqarah): Ayahs 1 to 25
    const log = addReadingLog({
      surahNumber: 2,
      fromAyah: 1,
      toAyah: 25,
      date: '2026-10-16',
      isCompletedSurah: false,
    });

    expect(log.surahNumber).toBe(2);
    expect(log.ayahsCount).toBe(25);
    expect(log.isCompletedSurah).toBe(false);

    const data = getQuranTrackerData();
    expect(data.completedSurahs).not.toContain(2);
    expect(data.logs.length).toBe(1);
  });

  it('toggles surah completion state', () => {
    const completed = toggleSurahCompleted(112); // Al-Ikhlas
    expect(completed).toBe(true);

    let data = getQuranTrackerData();
    expect(data.completedSurahs).toContain(112);

    const toggledOff = toggleSurahCompleted(112);
    expect(toggledOff).toBe(false);

    data = getQuranTrackerData();
    expect(data.completedSurahs).not.toContain(112);
  });

  it('allows batch-checking completed surahs (e.g. 5 surahs read offline)', () => {
    // User read first 5 surahs offline: 1, 2, 3, 4, 5
    batchSetSurahsCompleted([1, 2, 3, 4, 5], true);

    const data = getQuranTrackerData();
    expect(data.completedSurahs).toEqual([1, 2, 3, 4, 5]);
    expect(data.logs.length).toBe(5);

    const stats = computeQuranStats(data, 30);
    expect(stats.completedSurahsCount).toBe(5);
    expect(stats.khatmProgressPct).toBeGreaterThan(0);
    expect(stats.surahProgressMap[1].completed).toBe(true);
    expect(stats.surahProgressMap[5].completed).toBe(true);
    expect(stats.surahProgressMap[6].completed).toBe(false);
  });

  it('computes stats and daily trends properly', () => {
    addReadingLog({
      surahNumber: 1,
      fromAyah: 1,
      toAyah: 7,
      date: '2026-10-16',
    });
    addReadingLog({
      surahNumber: 2,
      fromAyah: 1,
      toAyah: 20,
      date: '2026-10-16',
    });

    const stats = computeQuranStats(undefined, 7);
    expect(stats.totalAyahsRead).toBe(27);
    const todayTrend = stats.dailyTrend.find((t) => t.date === '2026-10-16');
    expect(todayTrend?.ayahs).toBe(27);
  });

  it('non-destructively merges local and remote data', () => {
    const local = {
      completedSurahs: [1, 2, 3],
      logs: [
        {
          id: 'log_local_1',
          date: '2026-10-15',
          surahNumber: 1,
          surahName: 'Al-Fatiha',
          surahArabicName: 'الفاتحة',
          fromAyah: 1,
          toAyah: 7,
          ayahsCount: 7,
          isCompletedSurah: true,
          createdAt: '2026-10-15T10:00:00Z',
        },
      ],
      updatedAt: '2026-10-15T10:00:00Z',
    };

    const remote = {
      completedSurahs: [3, 4, 5],
      logs: [
        {
          id: 'log_remote_1',
          date: '2026-10-16',
          surahNumber: 4,
          surahName: 'An-Nisa',
          surahArabicName: 'النساء',
          fromAyah: 1,
          toAyah: 50,
          ayahsCount: 50,
          isCompletedSurah: false,
          createdAt: '2026-10-16T12:00:00Z',
        },
      ],
      updatedAt: '2026-10-16T12:00:00Z',
    };

    const merged = mergeQuranTrackerData(local, remote);
    expect(merged.completedSurahs).toEqual([1, 2, 3, 4, 5]);
    expect(merged.logs.length).toBe(2);
    expect(merged.logs.map((l) => l.id)).toContain('log_local_1');
    expect(merged.logs.map((l) => l.id)).toContain('log_remote_1');
  });

  it('deletes a reading log without removing unrelated entries', () => {
    const log1 = addReadingLog({ surahNumber: 1, fromAyah: 1, toAyah: 7 });
    const log2 = addReadingLog({ surahNumber: 112, fromAyah: 1, toAyah: 4 });

    deleteReadingLog(log1.id);
    const data = getQuranTrackerData();
    expect(data.logs.find((l) => l.id === log1.id)).toBeUndefined();
    expect(data.logs.find((l) => l.id === log2.id)).toBeDefined();
  });
});
