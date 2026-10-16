import type { PrayerTimesResult, PrayerName } from '@/types/salah';

export interface MakroohInterval {
  id: 'sunrise' | 'zenith' | 'sunset';
  name: string;
  nameAr: string;
  start: Date;
  end: Date;
  description: string;
  rule: string;
  hadithRef: string;
}

export interface PrayerWindow {
  name: PrayerName;
  start: Date;
  end: Date;
  endLabel?: string;
}

/**
 * Returns the three forbidden / makrooh prayer times based on authentic Sunnah
 * (Hadith of Uqbah ibn Amir, Sahih Muslim 831).
 */
export function getMakroohIntervals(times: PrayerTimesResult): MakroohInterval[] {
  // 1. Sunrise (Tulu' ash-Shams): From sunrise until sun has risen a spear's length (~15-20 min)
  const sunriseStart = new Date(times.sunrise.getTime());
  const sunriseEnd = new Date(times.sunrise.getTime() + 15 * 60 * 1000);

  // 2. Zenith / Zawal (Istiwa'): Sun at the exact meridian until it declines (~12-15 min before Dhuhr)
  const zenithStart = new Date(times.dhuhr.getTime() - 15 * 60 * 1000);
  const zenithEnd = new Date(times.dhuhr.getTime());

  // 3. Sunset (Ghurub): When sun turns dull pale yellow until complete sunset (~20 min before Maghrib)
  const sunsetStart = new Date(times.maghrib.getTime() - 20 * 60 * 1000);
  const sunsetEnd = new Date(times.maghrib.getTime());

  return [
    {
      id: 'sunrise',
      name: 'Sunrise Proscription (Ṭulū‘)',
      nameAr: 'عند طلوع الشمس حتى ترتفع',
      start: sunriseStart,
      end: sunriseEnd,
      description: 'From sunrise until the sun rises a spear’s length (~15–20 minutes).',
      rule: 'All voluntary (nafl) prayers and prostrations are prohibited.',
      hadithRef: 'Sahih Muslim 831',
    },
    {
      id: 'zenith',
      name: 'Midday Zenith (Zawāl / Istiwā’)',
      nameAr: 'عند قيام قائم الظهيرة حتى تزول',
      start: zenithStart,
      end: zenithEnd,
      description: 'When the sun is at its highest point until it declines at Dhuhr (~15 min before Dhuhr).',
      rule: 'Voluntary prayers are prohibited as Hellfire is stoked at this time.',
      hadithRef: 'Sahih Muslim 831',
    },
    {
      id: 'sunset',
      name: 'Pre-Sunset Proscription (Ghurūb)',
      nameAr: 'حين تتضيّف الشمس للغروب',
      start: sunsetStart,
      end: sunsetEnd,
      description: 'When the sun pales and sets (~20 minutes before Maghrib adhan).',
      rule: 'Voluntary prayers prohibited (except obligatory Asr if delayed).',
      hadithRef: 'Sahih Muslim 831',
    },
  ];
}

/**
 * Checks if the given date/time is currently inside a Makrooh prayer window.
 */
export function checkMakroohStatus(
  times: PrayerTimesResult,
  now = new Date(),
): {
  isMakrooh: boolean;
  activeInterval: MakroohInterval | null;
  minutesRemaining: number;
} {
  const intervals = getMakroohIntervals(times);
  const active = intervals.find((int) => now >= int.start && now < int.end) ?? null;

  if (active) {
    const remainingMs = Math.max(0, active.end.getTime() - now.getTime());
    const minutesRemaining = Math.ceil(remainingMs / (60 * 1000));
    return {
      isMakrooh: true,
      activeInterval: active,
      minutesRemaining,
    };
  }

  return {
    isMakrooh: false,
    activeInterval: null,
    minutesRemaining: 0,
  };
}

/**
 * Calculates authentic Start & End times for all 5 obligatory prayers:
 * - Fajr: Fajr adhan to Sunrise
 * - Dhuhr: Dhuhr adhan to Asr
 * - Asr: Asr adhan to Maghrib (Sunset)
 * - Maghrib: Maghrib adhan to Isha
 * - Isha: Isha adhan to Islamic Midnight (Nisf al-Layl) / Fajr
 */
export function getPrayerWindows(times: PrayerTimesResult): Record<PrayerName, PrayerWindow> {
  const ishaMidnight =
    times.midnight ??
    new Date(
      times.maghrib.getTime() +
        (times.fajr.getTime() + 24 * 60 * 60 * 1000 - times.maghrib.getTime()) / 2,
    );

  return {
    fajr: {
      name: 'fajr',
      start: times.fajr,
      end: times.sunrise,
      endLabel: 'Sunrise',
    },
    dhuhr: {
      name: 'dhuhr',
      start: times.dhuhr,
      end: times.asr,
      endLabel: 'Asr Adhan',
    },
    asr: {
      name: 'asr',
      start: times.asr,
      end: times.maghrib,
      endLabel: 'Sunset',
    },
    maghrib: {
      name: 'maghrib',
      start: times.maghrib,
      end: times.isha,
      endLabel: 'Isha Adhan',
    },
    isha: {
      name: 'isha',
      start: times.isha,
      end: ishaMidnight,
      endLabel: 'Midnight (Nisf al-Layl)',
    },
  };
}
