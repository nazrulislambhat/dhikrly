import surahsData from '@/data/surahs.json';

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export const ALL_SURAHS: SurahMeta[] = surahsData as SurahMeta[];
export const TOTAL_QURAN_AYAHS = 6236;
export const TOTAL_QURAN_SURAHS = 114;

export interface QuranReadingLog {
  id: string;
  date: string; // YYYY-MM-DD
  surahNumber: number;
  surahName: string;
  surahArabicName: string;
  fromAyah: number;
  toAyah: number;
  ayahsCount: number;
  isCompletedSurah: boolean;
  notes?: string;
  createdAt: string;
}

export interface QuranTrackerData {
  completedSurahs: number[]; // Set of surah numbers (1..114) fully completed
  logs: QuranReadingLog[];
  updatedAt: string;
}

export const QURAN_TRACKER_STORAGE_KEY = 'dhikrly_quran_tracker_v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getQuranTrackerData(): QuranTrackerData {
  if (!isBrowser()) {
    return { completedSurahs: [], logs: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(QURAN_TRACKER_STORAGE_KEY);
    if (!raw) {
      return { completedSurahs: [], logs: [], updatedAt: new Date().toISOString() };
    }
    const parsed = JSON.parse(raw) as Partial<QuranTrackerData>;
    return {
      completedSurahs: Array.isArray(parsed.completedSurahs)
        ? [...new Set(parsed.completedSurahs.map(Number).filter((n) => n >= 1 && n <= 114))]
        : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error loading Quran tracker data:', err);
    return { completedSurahs: [], logs: [], updatedAt: new Date().toISOString() };
  }
}

export function saveQuranTrackerData(data: QuranTrackerData): void {
  if (!isBrowser()) return;
  try {
    data.updatedAt = new Date().toISOString();
    // Keep max 500 recent logs to prevent local storage quota overflow
    if (data.logs.length > 500) {
      data.logs = data.logs.slice(0, 500);
    }
    localStorage.setItem(QURAN_TRACKER_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('dhikrly:quran-tracker-updated'));
  } catch (err) {
    console.error('Error saving Quran tracker data:', err);
  }
}

export function getSurahByNumber(num: number): SurahMeta | undefined {
  return ALL_SURAHS.find((s) => s.number === num);
}

/**
 * Add a new reading session log and update surah completion status if applicable
 */
export function addReadingLog(
  input: {
    surahNumber: number;
    fromAyah: number;
    toAyah: number;
    date?: string;
    isCompletedSurah?: boolean;
    notes?: string;
  },
): QuranReadingLog {
  const current = getQuranTrackerData();
  const surah = getSurahByNumber(input.surahNumber) || {
    number: input.surahNumber,
    englishName: `Surah ${input.surahNumber}`,
    name: '',
    numberOfAyahs: 1,
    englishNameTranslation: '',
    revelationType: 'Meccan',
  };

  const from = Math.max(1, Math.min(input.fromAyah, surah.numberOfAyahs));
  const to = Math.max(from, Math.min(input.toAyah, surah.numberOfAyahs));
  const ayahsCount = to - from + 1;
  const isFullSurah = input.isCompletedSurah ?? (from === 1 && to === surah.numberOfAyahs);
  const date = input.date || new Date().toISOString().slice(0, 10);

  const newLog: QuranReadingLog = {
    id: `ql_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date,
    surahNumber: surah.number,
    surahName: surah.englishName,
    surahArabicName: surah.name,
    fromAyah: from,
    toAyah: to,
    ayahsCount,
    isCompletedSurah: isFullSurah,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };

  current.logs.unshift(newLog);

  if (isFullSurah && !current.completedSurahs.includes(surah.number)) {
    current.completedSurahs.push(surah.number);
    current.completedSurahs.sort((a, b) => a - b);
  }

  saveQuranTrackerData(current);
  return newLog;
}

export function deleteReadingLog(logId: string): void {
  const current = getQuranTrackerData();
  current.logs = current.logs.filter((l) => l.id !== logId);
  saveQuranTrackerData(current);
}

/**
 * Toggle a Surah's full completion state (e.g. for user marking 5 surahs read offline)
 */
export function toggleSurahCompleted(surahNumber: number, forceCompleted?: boolean): boolean {
  const current = getQuranTrackerData();
  const surah = getSurahByNumber(surahNumber);
  if (!surah) return false;

  const alreadyCompleted = current.completedSurahs.includes(surahNumber);
  const shouldComplete = forceCompleted !== undefined ? forceCompleted : !alreadyCompleted;

  if (shouldComplete) {
    if (!alreadyCompleted) {
      current.completedSurahs.push(surahNumber);
      current.completedSurahs.sort((a, b) => a - b);

      // Also create a reading log for this completion
      const date = new Date().toISOString().slice(0, 10);
      current.logs.unshift({
        id: `ql_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date,
        surahNumber: surah.number,
        surahName: surah.englishName,
        surahArabicName: surah.name,
        fromAyah: 1,
        toAyah: surah.numberOfAyahs,
        ayahsCount: surah.numberOfAyahs,
        isCompletedSurah: true,
        notes: 'Marked as completed',
        createdAt: new Date().toISOString(),
      });
    }
  } else {
    current.completedSurahs = current.completedSurahs.filter((n) => n !== surahNumber);
  }

  saveQuranTrackerData(current);
  return shouldComplete;
}

/**
 * Batch mark surahs completed (e.g., Al-Fatihah, Al-Baqarah, etc. read offline)
 */
export function batchSetSurahsCompleted(surahNumbers: number[], completed: boolean): void {
  const current = getQuranTrackerData();
  const date = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  if (completed) {
    const set = new Set(current.completedSurahs);
    for (const num of surahNumbers) {
      if (num >= 1 && num <= 114 && !set.has(num)) {
        set.add(num);
        const surah = getSurahByNumber(num);
        if (surah) {
          current.logs.unshift({
            id: `ql_${Date.now()}_${num}_${Math.random().toString(36).substring(2, 5)}`,
            date,
            surahNumber: surah.number,
            surahName: surah.englishName,
            surahArabicName: surah.name,
            fromAyah: 1,
            toAyah: surah.numberOfAyahs,
            ayahsCount: surah.numberOfAyahs,
            isCompletedSurah: true,
            notes: 'Offline reading completed',
            createdAt: now,
          });
        }
      }
    }
    current.completedSurahs = [...set].sort((a, b) => a - b);
  } else {
    const toRemove = new Set(surahNumbers);
    current.completedSurahs = current.completedSurahs.filter((n) => !toRemove.has(n));
  }

  saveQuranTrackerData(current);
}

export interface QuranStats {
  completedSurahsCount: number;
  totalAyahsRead: number;
  khatmProgressPct: number;
  completedSurahsList: number[];
  uniqueAyahsCount: number;
  dailyTrend: { date: string; ayahs: number }[];
  surahProgressMap: Record<number, { completed: boolean; maxAyahRead: number; totalAyahs: number }>;
}

export function computeQuranStats(data?: QuranTrackerData, daysRange = 30): QuranStats {
  const current = data || getQuranTrackerData();
  const completedSet = new Set(current.completedSurahs);

  const surahProgressMap: Record<number, { completed: boolean; maxAyahRead: number; totalAyahs: number }> = {};
  for (const s of ALL_SURAHS) {
    const isComp = completedSet.has(s.number);
    surahProgressMap[s.number] = {
      completed: isComp,
      maxAyahRead: isComp ? s.numberOfAyahs : 0,
      totalAyahs: s.numberOfAyahs,
    };
  }

  let totalAyahsFromLogs = 0;
  const ayahsByDate: Record<string, number> = {};

  for (const log of current.logs) {
    totalAyahsFromLogs += log.ayahsCount;
    ayahsByDate[log.date] = (ayahsByDate[log.date] || 0) + log.ayahsCount;

    if (!surahProgressMap[log.surahNumber].completed) {
      surahProgressMap[log.surahNumber].maxAyahRead = Math.max(
        surahProgressMap[log.surahNumber].maxAyahRead,
        log.toAyah,
      );
    }
  }

  // Calculate distinct completed ayahs
  let totalAyahsCompleted = 0;
  for (const num of current.completedSurahs) {
    const s = getSurahByNumber(num);
    if (s) totalAyahsCompleted += s.numberOfAyahs;
  }

  const effectiveTotalAyahs = Math.max(totalAyahsFromLogs, totalAyahsCompleted);
  const khatmProgressPct = Math.min(
    100,
    Math.round((current.completedSurahs.length / TOTAL_QURAN_SURAHS) * 1000) / 10,
  );

  // Build daily trend for past daysRange days
  const dailyTrend: { date: string; ayahs: number }[] = [];
  const today = new Date();
  for (let i = daysRange - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dailyTrend.push({
      date: dateStr,
      ayahs: ayahsByDate[dateStr] || 0,
    });
  }

  return {
    completedSurahsCount: current.completedSurahs.length,
    totalAyahsRead: effectiveTotalAyahs,
    khatmProgressPct,
    completedSurahsList: current.completedSurahs,
    uniqueAyahsCount: totalAyahsCompleted,
    dailyTrend,
    surahProgressMap,
  };
}

/**
 * Non-destructive merge of local and remote Quran tracker data
 */
export function mergeQuranTrackerData(
  local: QuranTrackerData,
  remote: QuranTrackerData,
): QuranTrackerData {
  const mergedCompleted = [
    ...new Set([...(local.completedSurahs || []), ...(remote.completedSurahs || [])]),
  ].sort((a, b) => a - b);

  const logsMap = new Map<string, QuranReadingLog>();
  for (const log of remote.logs || []) {
    if (log && log.id) logsMap.set(log.id, log);
  }
  for (const log of local.logs || []) {
    if (log && log.id) logsMap.set(log.id, log);
  }

  const mergedLogs = [...logsMap.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    completedSurahs: mergedCompleted,
    logs: mergedLogs,
    updatedAt: new Date().toISOString(),
  };
}
