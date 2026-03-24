'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PrayerTimesResult, SalahLocation, CalcMethod } from '@/types/salah';
import { calculatePrayerTimes } from '@/lib/prayerTimes';

interface UsePrayerTimesResult {
  times: PrayerTimesResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePrayerTimes(
  location: SalahLocation | null,
  method: CalcMethod,
  asrMethod: 'Standard' | 'Hanafi',
  date: Date = new Date()
): UsePrayerTimesResult {
  const [times, setTimes] = useState<PrayerTimesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateStr = date.toDateString();

  const calculate = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const result = await calculatePrayerTimes(location, date, method, asrMethod);
      setTimes(result);
    } catch (e) {
      setError('Failed to calculate prayer times');
      console.error(e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng, method, asrMethod, dateStr]);

  useEffect(() => { calculate(); }, [calculate]);

  return { times, loading, error, refresh: calculate };
}
