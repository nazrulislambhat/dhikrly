export interface QuranEdition {
  identifier: string;
  name: string;
  englishName: string;
  language: string;
  type: string;
  format: string;
}

export interface QuranAyah {
  number: number;
  numberInSurah: number;
  text: string;
  audio?: string;
}

export interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan' | string;
  edition?: QuranEdition;
  ayahs?: QuranAyah[];
}

export interface QuranVerse {
  number: number;
  arabic: string;
  translation: string;
  audio?: string;
}

export interface QuranSettings {
  language: string;
  translation: string;
  reciter: string;
  arabicFontSize: number;
  showTranslation: boolean;
  autoPlayNext: boolean;
  playbackMode: 'verse' | 'surah';
  surah: number;
}

export interface QuranLocation {
  surah: number;
  ayah: number;
}

export interface QuranBookmark extends QuranLocation {
  createdAt: string;
}

export interface QuranReadingProgress {
  lastRead: QuranLocation | null;
  dailyVerses: Record<string, string[]>;
}

export const QURAN_SETTINGS_KEY = 'quran_settings_v1';
export const QURAN_CACHE_KEY = 'quran_chapter_cache_v1';
export const QURAN_BOOKMARK_KEY = 'quran_bookmark_v1';
export const QURAN_BOOKMARKS_KEY = 'quran_bookmarks_v1';
export const QURAN_PROGRESS_KEY = 'quran_reading_progress_v1';
export const QURAN_DAILY_GOAL_KEY = 'quran_daily_goal_v1';
export const DEFAULT_QURAN_DAILY_GOAL = 10;

export const DEFAULT_QURAN_SETTINGS: QuranSettings = {
  language: 'en',
  translation: 'en.sahih',
  reciter: 'ar.alafasy',
  arabicFontSize: 32,
  showTranslation: true,
  autoPlayNext: false,
  playbackMode: 'verse',
  surah: 1,
};

export const DEFAULT_RECITERS: QuranEdition[] = [
  {
    identifier: 'ar.alafasy',
    name: 'Alafasy',
    englishName: 'Mishary Rashid Alafasy',
    language: 'ar',
    type: 'versebyverse',
    format: 'audio',
  },
  {
    identifier: 'ar.abdurrahmaansudais',
    name: 'As-Sudais',
    englishName: 'Abdurrahmaan As-Sudais',
    language: 'ar',
    type: 'versebyverse',
    format: 'audio',
  },
  {
    identifier: 'ar.husary',
    name: 'Husary',
    englishName: 'Mahmoud Khalil Al-Husary',
    language: 'ar',
    type: 'versebyverse',
    format: 'audio',
  },
  {
    identifier: 'ar.abdulbasitmurattal',
    name: 'Abdul Basit',
    englishName: 'Abdul Basit',
    language: 'ar',
    type: 'versebyverse',
    format: 'audio',
  },
  {
    identifier: 'ar.mahermuaiqly',
    name: 'Maher Al Muaiqly',
    englishName: 'Maher Al Muaiqly',
    language: 'ar',
    type: 'versebyverse',
    format: 'audio',
  },
];
