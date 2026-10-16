import { describe, it, expect } from 'vitest';
import { getMakroohIntervals, checkMakroohStatus, getPrayerWindows } from '@/lib/makroohTimes';
import type { PrayerTimesResult } from '@/types/salah';

describe('Makrooh Times & Prayer Windows', () => {
  const baseTimes: PrayerTimesResult = {
    fajr: new Date('2026-10-16T04:45:00Z'),
    sunrise: new Date('2026-10-16T06:10:00Z'),
    dhuhr: new Date('2026-10-16T12:15:00Z'),
    asr: new Date('2026-10-16T15:40:00Z'),
    maghrib: new Date('2026-10-16T18:05:00Z'),
    isha: new Date('2026-10-16T19:25:00Z'),
    lastThirdOfNight: new Date('2026-10-17T01:30:00Z'),
    midnight: new Date('2026-10-16T23:45:00Z'),
  };

  it('calculates the 3 authentic Makrooh intervals correctly', () => {
    const intervals = getMakroohIntervals(baseTimes);
    expect(intervals).toHaveLength(3);

    const [sunrise, zenith, sunset] = intervals;

    // Sunrise: starts at sunrise (6:10), ends 15 min later (6:25)
    expect(sunrise.id).toBe('sunrise');
    expect(sunrise.start.toISOString()).toBe('2026-10-16T06:10:00.000Z');
    expect(sunrise.end.toISOString()).toBe('2026-10-16T06:25:00.000Z');

    // Zenith: starts 15 min before Dhuhr (12:00), ends at Dhuhr (12:15)
    expect(zenith.id).toBe('zenith');
    expect(zenith.start.toISOString()).toBe('2026-10-16T12:00:00.000Z');
    expect(zenith.end.toISOString()).toBe('2026-10-16T12:15:00.000Z');

    // Sunset: starts 20 min before Maghrib (17:45), ends at Maghrib (18:05)
    expect(sunset.id).toBe('sunset');
    expect(sunset.start.toISOString()).toBe('2026-10-16T17:45:00.000Z');
    expect(sunset.end.toISOString()).toBe('2026-10-16T18:05:00.000Z');
  });

  it('detects active Makrooh windows accurately', () => {
    // During sunrise window (6:18 AM)
    const atSunrise = checkMakroohStatus(baseTimes, new Date('2026-10-16T06:18:00Z'));
    expect(atSunrise.isMakrooh).toBe(true);
    expect(atSunrise.activeInterval?.id).toBe('sunrise');
    expect(atSunrise.minutesRemaining).toBe(7);

    // During permissible morning window (8:30 AM)
    const permissibleMorning = checkMakroohStatus(baseTimes, new Date('2026-10-16T08:30:00Z'));
    expect(permissibleMorning.isMakrooh).toBe(false);
    expect(permissibleMorning.activeInterval).toBeNull();

    // During midday zenith (12:05 PM)
    const atZenith = checkMakroohStatus(baseTimes, new Date('2026-10-16T12:05:00Z'));
    expect(atZenith.isMakrooh).toBe(true);
    expect(atZenith.activeInterval?.id).toBe('zenith');

    // During pre-sunset (17:50 PM)
    const atSunset = checkMakroohStatus(baseTimes, new Date('2026-10-16T17:50:00Z'));
    expect(atSunset.isMakrooh).toBe(true);
    expect(atSunset.activeInterval?.id).toBe('sunset');

    // During Isha / night (20:30 PM)
    const atNight = checkMakroohStatus(baseTimes, new Date('2026-10-16T20:30:00Z'));
    expect(atNight.isMakrooh).toBe(false);
  });

  it('defines start and end windows for all 5 obligatory prayers', () => {
    const windows = getPrayerWindows(baseTimes);

    // Fajr: Fajr adhan to Sunrise
    expect(windows.fajr.start).toEqual(baseTimes.fajr);
    expect(windows.fajr.end).toEqual(baseTimes.sunrise);
    expect(windows.fajr.endLabel).toBe('Sunrise');

    // Dhuhr: Dhuhr adhan to Asr
    expect(windows.dhuhr.start).toEqual(baseTimes.dhuhr);
    expect(windows.dhuhr.end).toEqual(baseTimes.asr);

    // Asr: Asr adhan to Maghrib (Sunset)
    expect(windows.asr.start).toEqual(baseTimes.asr);
    expect(windows.asr.end).toEqual(baseTimes.maghrib);

    // Maghrib: Maghrib adhan to Isha
    expect(windows.maghrib.start).toEqual(baseTimes.maghrib);
    expect(windows.maghrib.end).toEqual(baseTimes.isha);

    // Isha: Isha adhan to Midnight
    expect(windows.isha.start).toEqual(baseTimes.isha);
    expect(windows.isha.end).toEqual(baseTimes.midnight);
  });
});
