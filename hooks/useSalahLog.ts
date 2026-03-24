'use client';

import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { DayLog, PrayerName, PrayerStatus, SalahSettings } from '@/types/salah';
import {
  getDayLog, saveDayLog, getSalahSettings, saveSalahSettings,
} from '@/lib/salahStorage';

export function useSalahLog(date: string) {
  const [log, setLog] = useState<DayLog>(() => getDayLog(date));
  const [settings, setSettings] = useState<SalahSettings>(() => getSalahSettings());

  const updatePrayer = useCallback((prayer: PrayerName, status: PrayerStatus) => {
    setLog(prev => {
      const next: DayLog = { ...prev, prayers: { ...prev.prayers, [prayer]: status } };
      saveDayLog(next);
      return next;
    });
  }, []);

  const cyclePrayer = useCallback((prayer: PrayerName) => {
    setLog(prev => {
      const current = prev.prayers[prayer];
      const cycle: PrayerStatus[] = [null, 'prayed', 'jamah', 'delayed', 'missed'];
      const idx = cycle.indexOf(current);
      const next: PrayerStatus = cycle[(idx + 1) % cycle.length];
      const updated: DayLog = { ...prev, prayers: { ...prev.prayers, [prayer]: next } };
      saveDayLog(updated);
      return updated;
    });
  }, []);

  const toggleSunnah = useCallback((key: keyof DayLog['sunnah']) => {
    setLog(prev => {
      const updated: DayLog = { ...prev, sunnah: { ...prev.sunnah, [key]: !prev.sunnah[key] } };
      saveDayLog(updated);
      return updated;
    });
  }, []);

  const updateTahajjud = useCallback((patch: Partial<DayLog['tahajjud']>) => {
    setLog(prev => {
      const updated: DayLog = { ...prev, tahajjud: { ...prev.tahajjud, ...patch } };
      saveDayLog(updated);
      return updated;
    });
  }, []);

  const toggleNafl = useCallback((key: keyof DayLog['nafl']) => {
    setLog(prev => {
      const updated: DayLog = { ...prev, nafl: { ...prev.nafl, [key]: !prev.nafl[key] } };
      saveDayLog(updated);
      return updated;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<SalahSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...patch };
      saveSalahSettings(updated);
      return updated;
    });
  }, []);

  return {
    log, setLog, settings,
    updatePrayer, cyclePrayer,
    toggleSunnah, updateTahajjud, toggleNafl,
    updateSettings,
  };
}
