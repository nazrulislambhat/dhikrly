export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type PrayerStatus = 'prayed' | 'jamah' | 'delayed' | 'missed' | null;
export type CalcMethod =
  | 'MuslimWorldLeague' | 'Egyptian' | 'Karachi' | 'UmmAlQura'
  | 'Dubai' | 'NorthAmerica' | 'Kuwait' | 'Qatar' | 'Singapore' | 'Turkey';

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  lastThirdOfNight: Date;
}

export interface SunnahLog {
  fajrPre: boolean;
  dhuhrPre: boolean;
  dhuhrPost: boolean;
  asrPre: boolean;
  maghribPost: boolean;
  ishaPost: boolean;
}

export interface TahajjudLog {
  prayed: boolean;
  rakats: number;
  durationMinutes: number;
}

export interface NaflLog {
  ishraq: boolean;
  duha: boolean;
  awwabin: boolean;
}

export interface DayLog {
  date: string;
  prayers: Record<PrayerName, PrayerStatus>;
  sunnah: SunnahLog;
  tahajjud: TahajjudLog;
  nafl: NaflLog;
}

export interface SalahLocation {
  lat: number;
  lng: number;
  city: string;
  country: string;
  timezone: string;
}

export interface SalahSettings {
  calcMethod: CalcMethod;
  asrMethod: 'Standard' | 'Hanafi';
  trackSunnah: boolean;
  trackTahajjud: boolean;
  trackNafl: boolean;
  tahajjudNotif: boolean;
  location: SalahLocation | null;
}

export interface HeatmapCell {
  date: string;
  score: number;
  fard: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeekBar {
  label: string;
  date: string;
  fard: number;
  sunnah: number;
  jamah: number;
}

export const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_LABELS: Record<PrayerName, { en: string; ar: string }> = {
  fajr:    { en: 'Fajr',    ar: 'الفجر'   },
  dhuhr:   { en: 'Dhuhr',   ar: 'الظهر'   },
  asr:     { en: 'Asr',     ar: 'العصر'   },
  maghrib: { en: 'Maghrib', ar: 'المغرب'  },
  isha:    { en: 'Isha',    ar: 'العشاء'  },
};

export const SUNNAH_DEF: { key: keyof SunnahLog; label: string; prayer: PrayerName; when: 'before' | 'after'; rakats: number }[] = [
  { key: 'fajrPre',     label: '2 before Fajr',    prayer: 'fajr',    when: 'before', rakats: 2 },
  { key: 'dhuhrPre',    label: '4 before Dhuhr',   prayer: 'dhuhr',   when: 'before', rakats: 4 },
  { key: 'dhuhrPost',   label: '2 after Dhuhr',    prayer: 'dhuhr',   when: 'after',  rakats: 2 },
  { key: 'asrPre',      label: '4 before Asr',     prayer: 'asr',     when: 'before', rakats: 4 },
  { key: 'maghribPost', label: '2 after Maghrib',  prayer: 'maghrib', when: 'after',  rakats: 2 },
  { key: 'ishaPost',    label: '2 after Isha',     prayer: 'isha',    when: 'after',  rakats: 2 },
];
