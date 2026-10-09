'use client';

import { useState, useCallback, useRef } from 'react';
import type { DayLog, PrayerName, PrayerStatus, SalahSettings } from '@/types/salah';
import {
  getDayLog, saveDayLog, getSalahSettings, saveSalahSettings,
} from '@/lib/salahStorage';
import { markLocalEdit } from '@/lib/localEdits';

export function useSalahLog(date: string) {
  const [log, setLog] = useState<DayLog>(() => getDayLog(date));
  const [settings, setSettings] = useState<SalahSettings>(() => getSalahSettings());
  const localRevision = useRef(0);

  const updatePrayer = useCallback((prayer: PrayerName, status: PrayerStatus) => {
    localRevision.current += 1;
    markLocalEdit('salah', date);
    setLog(prev => {
      const next: DayLog = { ...prev, prayers: { ...prev.prayers, [prayer]: status } };
      saveDayLog(next);
      return next;
    });
  }, [date]);

  const cyclePrayer = useCallback((prayer: PrayerName) => {
    localRevision.current += 1;
    markLocalEdit('salah', date);
    setLog(prev => {
      const current = prev.prayers[prayer];
      const cycle: PrayerStatus[] = [null, 'prayed', 'jamah', 'delayed', 'missed'];
      const idx = cycle.indexOf(current);
      const next: PrayerStatus = cycle[(idx + 1) % cycle.length];
      const updated: DayLog = { ...prev, prayers: { ...prev.prayers, [prayer]: next } };
      saveDayLog(updated);
      return updated;
    });
  }, [date]);

  const toggleSunnah = useCallback((key: keyof DayLog['sunnah']) => {
    localRevision.current += 1;
    markLocalEdit('salah', date);
    setLog(prev => {
      const updated: DayLog = { ...prev, sunnah: { ...prev.sunnah, [key]: !prev.sunnah[key] } };
      saveDayLog(updated);
      return updated;
    });
  }, [date]);

  const updateTahajjud = useCallback((patch: Partial<DayLog['tahajjud']>) => {
    localRevision.current += 1;
    markLocalEdit('salah', date);
    setLog(prev => {
      const updated: DayLog = { ...prev, tahajjud: { ...prev.tahajjud, ...patch } };
      saveDayLog(updated);
      return updated;
    });
  }, [date]);

  const toggleNafl = useCallback((key: keyof DayLog['nafl']) => {
    localRevision.current += 1;
    markLocalEdit('salah', date);
    setLog(prev => {
      const updated: DayLog = { ...prev, nafl: { ...prev.nafl, [key]: !prev.nafl[key] } };
      saveDayLog(updated);
      return updated;
    });
  }, [date]);

  const updateSettings = useCallback((patch: Partial<SalahSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...patch };
      saveSalahSettings(updated);
      return updated;
    });
  }, []);

  return {
    log, setLog, settings,
    localRevision,
    updatePrayer, cyclePrayer,
    toggleSunnah, updateTahajjud, toggleNafl,
    updateSettings,
  };
}
