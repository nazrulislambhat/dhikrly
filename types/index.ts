export type Category = 'quran' | 'athkar' | 'dua' | 'custom';
export type TabLabel = 'Arabic' | 'English' | 'Transliteration';
export type Accent = 'gold' | 'green' | 'amber' | 'purple' | 'muted';

export interface Dua {
  id: string;
  category: Category;
  session: string[];
  priority: boolean;
  count: string;
  title: string;
  titleAr: string;
  transliteration: string;
  en: string;
  ar: string;
  custom?: boolean;
}

export interface Streak {
  current: number;
  best: number;
  lastComplete: string;
}

export interface HistoryDay {
  key: string;
  label: string;
  pct: number;
  isToday: boolean;
}

export interface CatEntry {
  key: string;
  label: string;
}

export interface HeatmapCell {
  key: string;
  date: Date;
  pct: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface NotifSettings {
  morningEnabled: boolean;
  morningTime: string; // "HH:MM"
  eveningEnabled: boolean;
  eveningTime: string; // "HH:MM"
}
