import type { PrayerTimesResult, CalcMethod, SalahLocation } from '@/types/salah';

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

  const methodMap: Record<CalcMethod, adhan.CalculationParameters> = {
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

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
    lastThirdOfNight: lastThirdStart,
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

export function getCurrentAndNextPrayer(times: PrayerTimesResult): {
  current: string | null;
  next: string;
  nextTime: Date;
  minutesUntilNext: number;
} {
  const now = new Date();
  const order = [
    { name: 'fajr',    time: times.fajr    },
    { name: 'dhuhr',   time: times.dhuhr   },
    { name: 'asr',     time: times.asr     },
    { name: 'maghrib', time: times.maghrib },
    { name: 'isha',    time: times.isha    },
  ];

  let current: string | null = null;
  let next = 'fajr';
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
