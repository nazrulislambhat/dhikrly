import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatTimeString } from '@/lib/prayerTimes';
import {
  getPlannedAzanList,
  getAzanFiredToday,
  markAzanFired,
  checkAndFireAzanNotifications,
  AZAN_NOTIF_FIRED_PREFIX,
} from '@/lib/azanNotificationService';
import type { LocalMasjidSettings } from '@/types/salah';

describe('formatTimeString', () => {
  it('formats morning 24h times to AM', () => {
    expect(formatTimeString('05:15')).toBe('5:15 AM');
    expect(formatTimeString('09:05')).toBe('9:05 AM');
    expect(formatTimeString('00:30')).toBe('12:30 AM');
  });

  it('formats afternoon and evening 24h times to PM', () => {
    expect(formatTimeString('12:00')).toBe('12:00 PM');
    expect(formatTimeString('13:15')).toBe('1:15 PM');
    expect(formatTimeString('18:45')).toBe('6:45 PM');
    expect(formatTimeString('20:30')).toBe('8:30 PM');
    expect(formatTimeString('23:59')).toBe('11:59 PM');
  });

  it('handles edge cases gracefully', () => {
    expect(formatTimeString('')).toBe('');
    expect(formatTimeString(undefined)).toBe('');
    expect(formatTimeString('invalid')).toBe('invalid');
  });
});

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

describe('azanNotificationService', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    // @ts-expect-error Mocking global localStorage
    globalThis.localStorage = mockStorage;
    // @ts-expect-error Mocking global window
    globalThis.window = {
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
      Notification: { permission: 'granted' },
    };
  });

  afterEach(() => {
    // @ts-expect-error Clean up
    delete globalThis.localStorage;
    // @ts-expect-error Clean up
    delete globalThis.window;
  });

  const sampleSettings: LocalMasjidSettings = {
    enabled: true,
    masjidName: 'Masjid Al-Noor',
    timings: {
      fajr: { azanTime: '05:15', iqamahTime: '05:45', notifyAzan: true, notifyOffsetMinutes: 0 },
      dhuhr: { azanTime: '12:30', iqamahTime: '13:00', notifyAzan: true, notifyOffsetMinutes: 5 },
      asr: { azanTime: '16:15', iqamahTime: '16:45', notifyAzan: false, notifyOffsetMinutes: 0 },
      maghrib: { azanTime: '18:20', iqamahTime: '18:25', notifyAzan: true, notifyOffsetMinutes: 10 },
      isha: { azanTime: '20:00', iqamahTime: '20:30', notifyAzan: true, notifyOffsetMinutes: 0 },
    },
  };

  it('returns empty list if settings or timings are missing', () => {
    expect(getPlannedAzanList(null)).toEqual([]);
    expect(getPlannedAzanList(undefined)).toEqual([]);
    expect(getPlannedAzanList({ enabled: true, masjidName: 'Test', timings: {} })).toEqual([]);
  });

  it('correctly calculates target notification times with offsets', () => {
    const fixedNow = new Date('2026-10-19T10:00:00');
    const planned = getPlannedAzanList(sampleSettings, fixedNow);

    expect(planned.length).toBe(5);

    // Fajr: 05:15 with 0 offset => 05:15:00
    const fajr = planned.find((p) => p.prayer === 'fajr');
    expect(fajr?.targetTime.getHours()).toBe(5);
    expect(fajr?.targetTime.getMinutes()).toBe(15);
    expect(fajr?.isUpcoming).toBe(false); // 05:15 is in past relative to 10:00

    // Dhuhr: 12:30 with 5 min offset => 12:25:00
    const dhuhr = planned.find((p) => p.prayer === 'dhuhr');
    expect(dhuhr?.targetTime.getHours()).toBe(12);
    expect(dhuhr?.targetTime.getMinutes()).toBe(25);
    expect(dhuhr?.isUpcoming).toBe(true); // 12:25 is in future relative to 10:00

    // Maghrib: 18:20 with 10 min offset => 18:10:00
    const maghrib = planned.find((p) => p.prayer === 'maghrib');
    expect(maghrib?.targetTime.getHours()).toBe(18);
    expect(maghrib?.targetTime.getMinutes()).toBe(10);
    expect(maghrib?.isUpcoming).toBe(true);
  });

  it('tracks and isolates fired notifications per day', () => {
    const day1 = new Date('2026-10-19T10:00:00');
    const day2 = new Date('2026-10-20T10:00:00');

    expect(getAzanFiredToday(day1)).toEqual({});

    markAzanFired('fajr', day1);
    expect(getAzanFiredToday(day1)).toEqual({ fajr: true });

    // Day 2 must not be affected
    expect(getAzanFiredToday(day2)).toEqual({});

    markAzanFired('dhuhr', day2);
    expect(getAzanFiredToday(day2)).toEqual({ dhuhr: true });
    expect(getAzanFiredToday(day1)).toEqual({ fajr: true });
  });

  it('flags isFired correctly in planned list', () => {
    const fixedNow = new Date('2026-10-19T10:00:00');
    markAzanFired('fajr', fixedNow);

    const planned = getPlannedAzanList(sampleSettings, fixedNow);
    const fajr = planned.find((p) => p.prayer === 'fajr');
    const dhuhr = planned.find((p) => p.prayer === 'dhuhr');

    expect(fajr?.isFired).toBe(true);
    expect(dhuhr?.isFired).toBe(false);
  });
});
