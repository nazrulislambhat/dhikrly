import type {
  PrayerName,
  PrayerTimesResult,
  CalcMethod,
  SalahLocation,
} from '@/types/salah';
import type * as AdhanType from 'adhan';

/* Dynamically import adhan to avoid SSR issues */
async function getAdhan() {
  const adhan = await import('adhan');
  return adhan;
}

export async function calculatePrayerTimes(
  location: SalahLocation,
  date: Date,
  method: CalcMethod,
  asrMethod: 'Standard' | 'Hanafi'
): Promise<PrayerTimesResult> {
  const adhan = await getAdhan();

  const coords = new adhan.Coordinates(location.lat, location.lng);

  const methodMap: Record<CalcMethod, AdhanType.CalculationParameters> = {
    MuslimWorldLeague: adhan.CalculationMethod.MuslimWorldLeague(),
    Egyptian: adhan.CalculationMethod.Egyptian(),
    Karachi: adhan.CalculationMethod.Karachi(),
    UmmAlQura: adhan.CalculationMethod.UmmAlQura(),
    Dubai: adhan.CalculationMethod.Dubai(),
    NorthAmerica: adhan.CalculationMethod.NorthAmerica(),
    Kuwait: adhan.CalculationMethod.Kuwait(),
    Qatar: adhan.CalculationMethod.Qatar(),
    Singapore: adhan.CalculationMethod.Singapore(),
    Turkey: adhan.CalculationMethod.Turkey(),
  };

  const params = methodMap[method] ?? adhan.CalculationMethod.Karachi();
  if (asrMethod === 'Hanafi') {
    params.madhab = adhan.Madhab.Hanafi;
  }

  const times = new adhan.PrayerTimes(coords, date, params);

  // Last third of night: from midnight to fajr, last third starts at 2/3 point
  const nextFajr = new Date(times.fajr);
  nextFajr.setDate(nextFajr.getDate()); // same day fajr = end of night
  const nightStart = new Date(times.maghrib);
  const nightEnd = new Date(times.fajr);
  nightEnd.setDate(nightEnd.getDate() + 1); // next day fajr
  const nightDuration = nightEnd.getTime() - nightStart.getTime();
  const lastThirdStart = new Date(nightStart.getTime() + (nightDuration * 2) / 3);
  const midnight = new Date(nightStart.getTime() + nightDuration / 2);

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
    lastThirdOfNight: lastThirdStart,
    midnight,
  };
}

export function formatTime(date: Date, timezone?: string): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/** Format a 24-hour time string like "05:15" or "18:45" to "5:15 AM" or "6:45 PM" */
export function formatTimeString(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const displayMinute = m < 10 ? `0${m}` : `${m}`;
  return `${displayHour}:${displayMinute} ${period}`;
}

export function getCurrentAndNextPrayer(
  times: PrayerTimesResult,
  now = new Date(),
): {
  current: PrayerName | null;
  next: PrayerName;
  nextTime: Date;
  minutesUntilNext: number;
} {
  const order: { name: PrayerName; time: Date }[] = [
    { name: 'fajr',    time: times.fajr    },
    { name: 'dhuhr',   time: times.dhuhr   },
    { name: 'asr',     time: times.asr     },
    { name: 'maghrib', time: times.maghrib },
    { name: 'isha',    time: times.isha    },
  ];

  let current: PrayerName | null = null;
  let next: PrayerName = 'fajr';
  let nextTime = times.fajr;

  for (let i = 0; i < order.length; i++) {
    if (now >= order[i].time) {
      current = order[i].name;
      if (i + 1 < order.length) {
        next = order[i + 1].name;
        nextTime = order[i + 1].time;
      } else {
        next = 'fajr';
        const tomorrow = new Date(times.fajr);
        tomorrow.setDate(tomorrow.getDate() + 1);
        nextTime = tomorrow;
      }
    }
  }

  if (now < order[0].time) {
    next = 'fajr';
    nextTime = times.fajr;
  }

  const minutesUntilNext = Math.max(0, Math.round((nextTime.getTime() - now.getTime()) / 60000));

  return { current, next, nextTime, minutesUntilNext };
}
