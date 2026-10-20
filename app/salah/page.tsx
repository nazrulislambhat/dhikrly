'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Calendar,
  ChartColumnIncreasing,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Landmark,
  LocateFixed,
  MapPinned,
  Pencil,
  Plus,
  Star,
} from 'lucide-react';
import { getHijriDate, getTodayKey, formatSafeDate } from '@/lib/dates';
import {
  getSalahSettings,
  saveSalahSettings,
  getLocalMasjidsList,
  getActiveLocalMasjid,
  saveLocalMasjidsList,
  saveLocalMasjidSettings,
} from '@/lib/salahStorage';
import { getCurrentAndNextPrayer, formatTimeString } from '@/lib/prayerTimes';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { startAzanNotificationScheduler, getPlannedAzanList } from '@/lib/azanNotificationService';
import { pullLocalMasjidsFromSupabase, pushLocalMasjidsToSupabase } from '@/lib/masjidSync';
import { hasSupabaseConfig } from '@/lib/supabase';

import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSalahLog } from '@/hooks/useSalahLog';
import { useSalahSync } from '@/hooks/useSalahSync';
import { useAuth } from '@/hooks/useAuth';

import LocationSetup from '@/components/salah/LocationSetup';
import PrayerCard, { MasjidPrayerItem } from '@/components/salah/PrayerCard';
import LocalMasjidModal from '@/components/salah/LocalMasjidModal';
import SunnahPanel from '@/components/salah/SunnahPanel';
import TahajjudPanel from '@/components/salah/TahajjudPanel';
import NaflPanel from '@/components/salah/NaflPanel';
import InsightsDashboard from '@/components/salah/InsightsDashboard';
import SalahHeatmap from '@/components/salah/SalahHeatmap';
import MasjidFinder from '@/components/salah/MasjidFinder';
import UserMenu from '@/components/UserMenu';
import AuthModal from '@/components/AuthModal';
import { PrayerCardSkeleton } from '@/components/Skeleton';

import type {
  PrayerName,
  PrayerStatus,
  SalahLocation,
  DayLog,
  LocalMasjidSettings,
  LocalMasjidItem,
} from '@/types/salah';
import { PRAYERS, PRAYER_LABELS, MAX_LOCAL_MASJIDS } from '@/types/salah';
import AppShell from '@/components/AppShell';
import JumuahBanner from '@/components/JumuahBanner';
import MakroohTimesCard from '@/components/salah/MakroohTimesCard';
import { getPrayerWindows } from '@/lib/makroohTimes';

type Tab = 'today' | 'insights' | 'masjid';

export default function SalahPage() {
  const [dark, setDark] = useState(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [settings, setSettings] = useState(() => getSalahSettings());
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocalMasjidModal, setShowLocalMasjidModal] = useState(false);
  const [prayerFocusForModal, setPrayerFocusForModal] = useState<PrayerName | undefined>(undefined);
  const [editingMasjidIdForModal, setEditingMasjidIdForModal] = useState<string | undefined>(undefined);
  const [selectedMasjidTab, setSelectedMasjidTab] = useState<string>('all');

  const today = getTodayKey();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const isToday = selectedDate === today;

  const yesterdayStr = useMemo(
    () => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
    [],
  );
  const isYesterday = selectedDate === yesterdayStr;

  const selectedDateObj = useMemo(() => {
    return new Date(`${selectedDate}T12:00:00`);
  }, [selectedDate]);

  const {
    log,
    setLog,
    localRevision,
    updatePrayer,
    toggleSunnah,
    updateTahajjud,
    toggleNafl,
  } = useSalahLog(selectedDate);
  const { user, loading: authLoading, signOut } = useAuth();
  const { times, loading: timesLoading } = usePrayerTimes(
    settings.location,
    settings.calcMethod,
    settings.asrMethod,
    selectedDateObj,
  );

  // Date navigation handlers
  const goToPreviousDay = useCallback(() => {
    setSelectedDate((curr) => {
      const d = new Date(`${curr}T12:00:00`);
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((curr) => {
      if (curr >= today) return today;
      const d = new Date(`${curr}T12:00:00`);
      d.setDate(d.getDate() + 1);
      const nextStr = d.toISOString().slice(0, 10);
      return nextStr > today ? today : nextStr;
    });
  }, [today]);

  const jumpToToday = useCallback(() => {
    setSelectedDate(today);
  }, [today]);

  // Sync callbacks
  const handlePullComplete = useCallback(
    (logs: DayLog[]) => {
      const activeLog = logs.find((l) => l.date === selectedDate);
      if (activeLog) setLog(activeLog);
    },
    [selectedDate, setLog],
  );

  const handleRemoteLogUpdate = useCallback(
    (remoteLog: DayLog) => {
      if (remoteLog.date === selectedDate) {
        setLog(remoteLog);
      }
    },
    [selectedDate, setLog],
  );

  const {
    status: syncStatus,
    manualSync,
    lastSyncedAt,
  } = useSalahSync({
    user,
    today: selectedDate,
    log,
    localRevision,
    onPullComplete: handlePullComplete,
    onRemoteLogUpdate: handleRemoteLogUpdate,
  });

  // Tick every minute for live next-prayer countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Sync dark mode from main app settings
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    const currentSettings = load<{ dark: boolean; sound?: boolean }>(SETTINGS_KEY, { dark, sound: true });
    save(SETTINGS_KEY, { ...currentSettings, dark });
  }, [dark]);

  // Recurring scheduler for planned Azan notifications
  useEffect(() => {
    const cleanup = startAzanNotificationScheduler(() => settings.localMasjid);
    return cleanup;
  }, [settings.localMasjid]);

  // Pull remote masjids when user is signed in (Zero Data Loss non-destructive merge)
  useEffect(() => {
    if (!user || !hasSupabaseConfig) return;
    let cancelled = false;
    pullLocalMasjidsFromSupabase(user.id).then((merged) => {
      if (cancelled || !merged) return;
      setSettings(getSalahSettings());
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLocation = (loc: SalahLocation) => {
    const updated = { ...settings, location: loc };
    setSettings(updated);
    saveSalahSettings(updated);
  };

  const masjidsList = getLocalMasjidsList(settings);
  const activeMasjid = getActiveLocalMasjid(settings);

  const handleSaveLocalMasjid = (updatedLocalMasjid: LocalMasjidSettings | null) => {
    saveLocalMasjidSettings(updatedLocalMasjid);
    const updated = getSalahSettings();
    setSettings(updated);

    // Push to Supabase with zero data loss
    if (user?.id && hasSupabaseConfig) {
      const list = getLocalMasjidsList(updated);
      const active = getActiveLocalMasjid(updated);
      void pushLocalMasjidsToSupabase(user.id, list, active?.id ?? null);
    }
  };

  const handleSwitchActiveMasjid = (masjidId: string) => {
    const list = getLocalMasjidsList(settings);
    saveLocalMasjidsList(list, masjidId);
    const updated = getSalahSettings();
    setSettings(updated);

    // Sync active selection to Supabase
    if (user?.id && hasSupabaseConfig) {
      void pushLocalMasjidsToSupabase(user.id, list, masjidId);
    }
  };

  const activeTimings = activeMasjid?.timings;
  const configuredTimingsCount = activeTimings
    ? Object.values(activeTimings).filter((t) => t?.azanTime || t?.iqamahTime).length
    : 0;
  const plannedAzanCount = activeTimings
    ? Object.values(activeTimings).filter((t) => t?.notifyAzan && t?.azanTime).length
    : 0;

  const { current, next, minutesUntilNext } = times && isToday
    ? getCurrentAndNextPrayer(times, now)
    : { current: null, next: 'fajr' as const, minutesUntilNext: 0 };

  const bg = dark
    ? 'min-h-screen bg-[#0d1715] text-stone-200'
    : 'min-h-screen bg-stone-50 text-stone-800';
  const cardBase = dark
    ? 'bg-white/[0.04] border-white/[0.07]'
    : 'bg-white border-stone-200 shadow-sm';
  const tabActive = dark
    ? 'bg-emerald-400/15 text-emerald-200'
    : 'bg-white text-emerald-800 shadow-sm';
  const tabInactive = dark
    ? 'text-stone-500 hover:text-stone-300'
    : 'text-stone-400 hover:text-stone-600';

  // Show location setup if no location
  if (!settings.location) {
    return (
      <div className={dark ? 'min-h-screen bg-[#0d1715] text-stone-200' : 'min-h-screen bg-stone-50 text-stone-800'}>
        <AppShell active="salah" dark={dark} onToggleDark={() => setDark((value) => !value)}>
          <LocationSetup dark={dark} onLocation={handleLocation} />
        </AppShell>
      </div>
    );
  }

  const prayerTimeMap: Record<PrayerName, Date | null> = {
    fajr: times?.fajr ?? null,
    dhuhr: times?.dhuhr ?? null,
    asr: times?.asr ?? null,
    maghrib: times?.maghrib ?? null,
    isha: times?.isha ?? null,
  };

  // Calculate fard done count
  const fardDone = PRAYERS.filter(
    (p) =>
      log.prayers[p] === 'prayed' ||
      log.prayers[p] === 'jamah' ||
      log.prayers[p] === 'delayed',
  ).length;
  const fardPct = Math.round((fardDone / 5) * 100);

  return (
    <div className={bg}>
      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal dark={dark} onClose={() => setShowAuthModal(false)} />
      )}

      {/* Local Masjid & Azan Timings Modal */}
      <LocalMasjidModal
        isOpen={showLocalMasjidModal}
        onClose={() => setShowLocalMasjidModal(false)}
        dark={dark}
        currentSettings={settings.localMasjid ?? null}
        allMasjids={masjidsList}
        initialActiveId={activeMasjid?.id}
        initialEditingId={editingMasjidIdForModal || activeMasjid?.id}
        calculatedTimes={times}
        timezone={settings.location?.timezone}
        initialPrayerFocus={prayerFocusForModal}
        onSave={handleSaveLocalMasjid}
      />

      <AppShell active="salah" dark={dark} onToggleDark={() => setDark((value) => !value)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 pt-5 pb-10 sm:px-4 sm:pt-8 lg:px-4">
        {/* ── Header ── */}
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 mb-2">
                <Clock3 className="h-3.5 w-3.5" />
                <span>DAILY PRAYERS & SUNNAH SCHEDULE</span>
              </div>
              <h1
                className={`font-serif text-[clamp(24px,4vw,32px)] font-semibold tracking-tight ${dark ? 'text-stone-100' : 'text-stone-900'}`}
              >
                Daily Ṣalāh
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span suppressHydrationWarning className={`font-semibold uppercase tracking-[0.14em] ${dark ? 'text-emerald-300/80' : 'text-emerald-800/80'}`}>
                  {getHijriDate()}
                </span>
                <span className={dark ? 'text-stone-600' : 'text-stone-300'}>•</span>
                <p
                  suppressHydrationWarning
                  className={`inline-flex items-center gap-1.5 ${dark ? 'text-stone-400' : 'text-stone-500'}`}
                >
                  <MapPinned className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  {settings.location.city}, {settings.location.country}
                </p>
              </div>
            </div>

            {/* Auth + change location */}
            <div className="flex items-center gap-2">
              {authLoading ? (
                <div
                  className={`h-7 w-20 animate-pulse rounded-full ${dark ? 'bg-white/5' : 'bg-stone-100'}`}
                />
              ) : user ? (
                <UserMenu
                  user={user}
                  dark={dark}
                  syncStatus={syncStatus}
                  onManualSync={manualSync}
                  lastSyncedAt={lastSyncedAt}
                  onSignOut={async () => {
                    await signOut();
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 ${
                    dark
                      ? 'border-emerald-400/30 text-emerald-200/80 hover:border-emerald-400/50 hover:text-emerald-200'
                      : 'border-emerald-600/30 text-emerald-800 hover:border-emerald-600 hover:text-emerald-900'
                  }`}
                >
                  ↑ Sync / Login
                </button>
              )}
              <button
                aria-label="Change prayer location"
                title="Change location"
                onClick={() => {
                  const updated = { ...settings, location: null };
                  setSettings(updated);
                  saveSalahSettings(updated);
                }}
                className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all ${
                  dark
                    ? 'border-white/10 text-stone-500 hover:text-stone-300'
                    : 'border-stone-200 text-stone-400 hover:text-stone-600'
                }`}
              >
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Jumu'ah Mode */}
          <div className="mt-5">
            <JumuahBanner
              dark={dark}
              dhuhrTime={times?.dhuhr}
              asrTime={times?.asr}
              maghribTime={times?.maghrib}
            />
          </div>

          {/* Next prayer banner (if today) or Historical banner (if past date) */}
          {!isToday ? (
            <div
              className={`relative mt-5 flex flex-col sm:flex-row min-h-24 sm:items-center justify-between gap-4 overflow-hidden rounded-2xl border px-5 py-4 sm:px-7 ${
                dark
                  ? 'border-amber-400/20 bg-gradient-to-br from-[#2a2415] via-[#201c13] to-[#16140e]'
                  : 'border-amber-200 bg-gradient-to-br from-[#fef8e7] via-[#fbf2d5] to-[#f4e8c1] text-amber-950 shadow-sm'
              }`}
            >
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Calendar className="h-3.5 w-3.5" /> Historical Prayer Record
                </span>
                <p className="mt-1 font-serif text-xl font-bold">
                  {formatSafeDate(selectedDate, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }, selectedDate)}
                </p>
                <p className="text-xs text-[var(--app-muted)] mt-0.5">
                  You are viewing and updating past prayers. All modifications save and sync automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={jumpToToday}
                className="relative z-10 shrink-0 self-start sm:self-auto rounded-xl px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
              >
                Jump to Today ↩
              </button>
            </div>
          ) : (
            times && (
              <div
                className={`relative mt-5 flex min-h-36 items-center justify-between overflow-hidden rounded-2xl border px-5 py-5 sm:px-7 ${
                  dark
                    ? 'border-emerald-300/20 bg-gradient-to-br from-[#123a30] via-[#142b25] to-[#101c19]'
                    : 'border-emerald-800/10 bg-gradient-to-br from-[#e5f5e9] via-[#d6edda] to-[#c2e7d2] text-emerald-950 shadow-sm'
                }`}
              >
                <div className="relative z-10">
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-emerald-200/70' : 'text-emerald-900/65'}`}
                  >
                    {current
                      ? `Current · ${current.charAt(0).toUpperCase() + current.slice(1)}`
                      : 'Before Fajr'}
                  </p>
                  <p
                    className={`mt-1 font-serif text-2xl font-semibold ${dark ? 'text-stone-50' : 'text-emerald-950'}`}
                  >
                    {next.charAt(0).toUpperCase() + next.slice(1)} is next
                  </p>
                  <p suppressHydrationWarning className={`mt-1 text-sm ${dark ? 'text-stone-300' : 'text-emerald-950/80'}`}>
                    {times[next].toLocaleTimeString('en', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: settings.location!.timezone,
                    })}
                  </p>
                </div>
                <div className="relative z-10 text-right">
                  <p
                    suppressHydrationWarning
                    className={`text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl ${dark ? 'text-emerald-200' : 'text-emerald-900'}`}
                  >
                    {minutesUntilNext < 60
                      ? `${minutesUntilNext}m`
                      : `${Math.floor(minutesUntilNext / 60)}h ${minutesUntilNext % 60}m`}
                  </p>
                  <p
                    suppressHydrationWarning
                    className={`mt-1 text-xs ${dark ? 'text-stone-300' : 'text-emerald-900/70'}`}
                  >
                    until prayer
                  </p>
                </div>
                <span className={`pointer-events-none absolute -bottom-6 right-4 opacity-[0.12] ${dark ? 'text-emerald-100' : 'text-emerald-900'}`} aria-hidden="true">
                  <svg viewBox="0 0 180 150" className="h-36 w-44 sm:h-44 sm:w-52" fill="none">
                    <path d="M30 132V73h120v59M24 132h132M41 72c0-22 18-40 49-40s49 18 49 40M90 32V15m-5 4h10M35 73V41l8-13 8 13v32m86 0V41l8-13 8 13v32M80 132V98a10 10 0 0 1 20 0v34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M68 73c0-12 10-22 22-22s22 10 22 22" stroke="currentColor" strokeWidth="4" />
                  </svg>
                </span>
              </div>
            )
          )}

          {timesLoading && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 ${cardBase}`}
            >
              <span
                className={`h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent ${dark ? 'text-amber-400' : 'text-amber-600'}`}
              />
              <span
                className={`text-[12px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
              >
                Calculating prayer times…
              </span>
            </div>
          )}

          {/* Daily progress */}
          <div className="mt-3">
            <div
              className={`h-1.5 w-full overflow-hidden rounded-full ${dark ? 'bg-white/[0.07]' : 'bg-black/[0.07]'}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${fardPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${fardPct}%` }}
              />
            </div>
            <div
              suppressHydrationWarning
              className={`mt-1 flex justify-between text-[10px] ${dark ? 'text-stone-400' : 'text-stone-900'}`}
            >
              <span>{fardDone}/5 prayers</span>
              <span>{fardPct}%</span>
            </div>
          </div>
        </header>

        {/* ── Tab strip ── */}
        <div
          className={`mb-5 flex rounded-2xl border p-1.5 ${dark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-[var(--app-line)] bg-stone-100/70'}`}
        >
          {(['today', 'insights', 'masjid'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                activeTab === tab ? tabActive : tabInactive
              }`}
            >
              {tab === 'today' ? (
                <><Clock3 className="h-4 w-4" aria-hidden="true" /> Today</>
              ) : tab === 'insights' ? (
                <><ChartColumnIncreasing className="h-4 w-4" aria-hidden="true" /> Insights</>
              ) : (
                <><MapPinned className="h-4 w-4" aria-hidden="true" /> Masjids</>
              )}
            </button>
          ))}
        </div>

        {/* ── Today tab ── */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Date Navigation & Historical Picker Bar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 sm:px-5 ${cardBase}`}
            >
              {/* Navigation Arrows & Date Label with Picker */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousDay}
                  className={`grid h-9 w-9 place-items-center rounded-xl border transition-all active:scale-95 ${
                    dark
                      ? 'border-white/10 bg-white/5 text-stone-200 hover:bg-white/10'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                  aria-label="Previous day"
                  title="Previous day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="relative inline-block">
                  <div
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 transition-all ${
                      !isToday
                        ? dark
                          ? 'border-amber-400/40 bg-amber-400/10 text-amber-200 font-semibold'
                          : 'border-amber-300 bg-amber-50 text-amber-900 font-semibold'
                        : dark
                          ? 'border-white/10 bg-white/5 text-stone-200 hover:bg-white/10'
                          : 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <Calendar
                      className={`h-4 w-4 shrink-0 ${
                        !isToday
                          ? dark
                            ? 'text-amber-400'
                            : 'text-amber-600'
                          : dark
                            ? 'text-emerald-400'
                            : 'text-emerald-700'
                      }`}
                    />
                    <span suppressHydrationWarning className="text-xs sm:text-sm font-medium">
                      {isToday
                        ? `Today · ${formatSafeDate(today, { weekday: 'short', month: 'short', day: 'numeric' }, today)}`
                        : isYesterday
                          ? `Yesterday · ${formatSafeDate(yesterdayStr, { weekday: 'short', month: 'short', day: 'numeric' }, yesterdayStr)}`
                          : formatSafeDate(selectedDate, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }, selectedDate)}
                    </span>
                    <Pencil className="h-3 w-3 opacity-50" />
                  </div>
                  {/* Invisible native date input overlaid on top so clicking opens native calendar picker */}
                  <input
                    type="date"
                    value={selectedDate}
                    max={today}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value > today ? today : e.target.value);
                      }
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Select prayer date"
                    title="Choose a date"
                  />
                </div>

                <button
                  type="button"
                  onClick={goToNextDay}
                  disabled={isToday}
                  className={`grid h-9 w-9 place-items-center rounded-xl border transition-all ${
                    isToday
                      ? 'cursor-not-allowed opacity-30 border-transparent'
                      : dark
                        ? 'border-white/10 bg-white/5 text-stone-200 hover:bg-white/10 active:scale-95'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 active:scale-95'
                  }`}
                  aria-label="Next day"
                  title={isToday ? 'Today is the latest date' : 'Next day'}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Jump & Status Buttons */}
              <div className="flex items-center gap-2 text-xs">
                {!isToday ? (
                  <>
                    <span className={`text-[11px] ${dark ? 'text-amber-400/90' : 'text-amber-700 font-medium'}`}>
                      Historical Record
                    </span>
                    <button
                      type="button"
                      onClick={jumpToToday}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 dark:bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-xs transition hover:bg-emerald-800 dark:hover:bg-emerald-500 active:scale-95"
                    >
                      <span>Jump to Today</span>
                      <span>↩</span>
                    </button>
                  </>
                ) : (
                  <span className={`text-[11px] ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Click date to change
                  </span>
                )}
              </div>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
            <section className="space-y-3" aria-label="Prayer times and log">
              {/* Local Masjid & Azan Timings Banner (Supports up to 5 Masjids) */}
              {masjidsList.length > 0 && activeMasjid ? (
                <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${cardBase}`}>
                  {/* Top Header */}
                  {(() => {
                    const currentTabMasjid =
                      selectedMasjidTab === 'all'
                        ? null
                        : masjidsList.find((m) => m.id === selectedMasjidTab) ?? activeMasjid;

                    const tabTimings = currentTabMasjid?.timings;
                    const tabTimingsCount = tabTimings
                      ? Object.values(tabTimings).filter((t) => t?.azanTime || t?.iqamahTime).length
                      : 0;
                    const tabPlannedAzanCount = tabTimings
                      ? Object.values(tabTimings).filter((t) => t?.notifyAzan && t?.azanTime).length
                      : 0;

                    return (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                                dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              <Landmark className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className={`font-serif text-base font-bold ${dark ? 'text-stone-100' : 'text-stone-900'}`}>
                                  {selectedMasjidTab === 'all'
                                    ? 'All Local Mosques Schedule'
                                    : currentTabMasjid?.name || 'Local Masjid Timings'}
                                </h2>
                                {currentTabMasjid?.label && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {currentTabMasjid.label}
                                  </span>
                                )}
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                    dark ? 'bg-white/5 text-stone-400' : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {masjidsList.length} of {MAX_LOCAL_MASJIDS} Mosques
                                </span>
                              </div>
                              <p
                                className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${
                                  dark ? 'text-stone-400' : 'text-stone-500'
                                }`}
                              >
                                {selectedMasjidTab === 'all' ? (
                                  <span>Showing all {masjidsList.length} mosques across all 5 daily prayers</span>
                                ) : (
                                  <>
                                    <span>{tabTimingsCount} timings active</span>
                                    {tabPlannedAzanCount > 0 ? (
                                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                        <Bell className="h-3 w-3" />
                                        <span>{tabPlannedAzanCount} Azan alert{tabPlannedAzanCount === 1 ? '' : 's'} planned</span>
                                      </span>
                                    ) : (
                                      <span>· No Azan alerts</span>
                                    )}
                                    {currentTabMasjid?.notes && (
                                      <span className="truncate max-w-[200px] opacity-75">
                                        · {currentTabMasjid.notes}
                                      </span>
                                    )}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {currentTabMasjid && currentTabMasjid.id !== activeMasjid.id && (
                              <button
                                type="button"
                                onClick={() => handleSwitchActiveMasjid(currentTabMasjid.id)}
                                title="Make this mosque default active for daily alerts"
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                                  dark
                                    ? 'border-amber-400/30 text-amber-300 hover:bg-amber-400/10'
                                    : 'border-amber-300 text-amber-800 hover:bg-amber-50'
                                }`}
                              >
                                <Star className="h-3.5 w-3.5" />
                                <span>Set as Primary</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPrayerFocusForModal(undefined);
                                setEditingMasjidIdForModal(currentTabMasjid?.id || activeMasjid.id);
                                setShowLocalMasjidModal(true);
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                                dark
                                  ? 'border-white/10 hover:bg-white/5 text-stone-200'
                                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                              }`}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Manage Mosques</span>
                            </button>
                          </div>
                        </div>

                        {/* Mosque Switcher Chips / Tabs */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-inherit">
                          <span className={`text-[10px] font-bold uppercase tracking-wider mr-1 ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
                            Tabs:
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedMasjidTab('all')}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                              selectedMasjidTab === 'all'
                                ? dark
                                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                                  : 'bg-emerald-600 text-white shadow-xs'
                                : dark
                                  ? 'bg-white/5 text-stone-300 hover:bg-white/10'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            <Landmark className="h-3 w-3" />
                            <span>All Mosques ({masjidsList.length})</span>
                          </button>

                          {masjidsList.map((m) => {
                            const isTabActive = selectedMasjidTab === m.id;
                            const isPrimary = m.id === activeMasjid.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMasjidTab(m.id);
                                  handleSwitchActiveMasjid(m.id);
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                                  isTabActive
                                    ? dark
                                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                                      : 'bg-emerald-600 text-white shadow-xs'
                                    : dark
                                      ? 'bg-white/5 text-stone-300 hover:bg-white/10'
                                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                }`}
                              >
                                {isPrimary && <Star className="h-3 w-3 fill-current text-amber-400" aria-label="Primary Active Mosque" />}
                                <span className="truncate max-w-[120px]">{m.name}</span>
                                {m.label && (
                                  <span className="text-[10px] opacity-75">({m.label})</span>
                                )}
                              </button>
                            );
                          })}

                          {masjidsList.length < MAX_LOCAL_MASJIDS && (
                            <button
                              type="button"
                              onClick={() => {
                                setPrayerFocusForModal(undefined);
                                setEditingMasjidIdForModal(undefined);
                                setShowLocalMasjidModal(true);
                              }}
                              className={`inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs font-medium transition ${
                                dark
                                  ? 'border-white/20 text-stone-400 hover:text-stone-200 hover:border-white/40'
                                  : 'border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400'
                              }`}
                            >
                              <Plus className="h-3 w-3" />
                              <span>Add ({masjidsList.length}/{MAX_LOCAL_MASJIDS})</span>
                            </button>
                          )}
                        </div>

                        {/* 5-prayer quick overview */}
                        {selectedMasjidTab === 'all' ? (
                          <div className="mt-3.5 space-y-2 border-t pt-3">
                            {masjidsList.map((m) => {
                              const isPrimary = m.id === activeMasjid.id;
                              return (
                                <div
                                  key={m.id}
                                  className={`rounded-xl p-2.5 sm:p-3 border transition-all ${
                                    dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-stone-50/80 border-stone-200/80'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <Landmark className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span className="text-xs font-bold">{m.name}</span>
                                      {m.label && (
                                        <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-semibold ${
                                          dark ? 'bg-white/10 text-stone-300' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                          {m.label}
                                        </span>
                                      )}
                                      {isPrimary && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                                          <Star className="h-2.5 w-2.5 fill-current" /> Primary
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPrayerFocusForModal(undefined);
                                        setEditingMasjidIdForModal(m.id);
                                        setShowLocalMasjidModal(true);
                                      }}
                                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border transition ${
                                        dark ? 'border-white/10 hover:bg-white/5 text-stone-300' : 'border-stone-200 hover:bg-stone-100 text-stone-600'
                                      }`}
                                    >
                                      <Pencil className="h-2.5 w-2.5" />
                                      <span>Edit</span>
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-5 gap-1 text-center">
                                    {PRAYERS.map((p) => {
                                      const t = m.timings?.[p];
                                      const shortName = PRAYER_LABELS[p].en.slice(0, 3);
                                      return (
                                        <div
                                          key={p}
                                          className={`rounded-lg p-1 text-[10px] ${
                                            dark ? 'bg-white/[0.02]' : 'bg-white'
                                          }`}
                                        >
                                          <div className="flex items-center justify-center gap-0.5 font-bold text-[10px]">
                                            <span>{shortName}</span>
                                            {t?.notifyAzan && <Bell className="h-2.5 w-2.5 text-amber-500" />}
                                          </div>
                                          <div className="text-stone-400 text-[9px] mt-0.5 truncate">
                                            {t?.azanTime ? formatTimeString(t.azanTime) : '—'}
                                          </div>
                                          <div className="font-semibold text-emerald-700 dark:text-emerald-300 text-[9px] truncate">
                                            {t?.iqamahTime ? formatTimeString(t.iqamahTime) : '—'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            className={`mt-3.5 grid grid-cols-5 gap-1.5 border-t pt-3 text-center ${
                              dark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                            }`}
                          >
                            {PRAYERS.map((p) => {
                              const t = currentTabMasjid?.timings?.[p];
                              const shortName = PRAYER_LABELS[p].en.slice(0, 3);
                              return (
                                <div
                                  key={p}
                                  className={`rounded-xl p-1.5 sm:p-2 ${
                                    dark ? 'bg-white/[0.02]' : 'bg-stone-50/70'
                                  }`}
                                >
                                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                                    <span>{shortName}</span>
                                    {t?.notifyAzan && (
                                      <Bell className="h-2.5 w-2.5 text-amber-500" aria-label="Notification planned" />
                                    )}
                                  </div>
                                  <div className="mt-1 text-[10px]">
                                    <div className="text-stone-400">Azan</div>
                                    <div className="font-semibold truncate">
                                      {t?.azanTime ? formatTimeString(t.azanTime) : '—'}
                                    </div>
                                  </div>
                                  <div className="mt-0.5 text-[10px]">
                                    <div className="text-stone-400">Iqāmah</div>
                                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                                      {t?.iqamahTime ? formatTimeString(t.iqamahTime) : '—'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div
                  className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                    dark ? 'border-emerald-400/20 bg-emerald-400/[0.03]' : 'border-emerald-200 bg-emerald-50/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <Landmark className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2
                            className={`font-serif text-sm sm:text-base font-semibold ${
                              dark ? 'text-stone-100' : 'text-stone-900'
                            }`}
                          >
                            Local Masjid Timings & Azaan Alerts
                          </h2>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Up to 5 Mosques
                          </span>
                        </div>
                        <p className={`mt-0.5 text-xs ${dark ? 'text-stone-400' : 'text-stone-600'}`}>
                          Add up to 5 local masjids (Home, Work, Jumu‘ah) with custom Azaan & Iqāmah timings and automatic notifications. All data is synced to Supabase with zero data loss.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPrayerFocusForModal(undefined);
                        setShowLocalMasjidModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 dark:bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 dark:hover:bg-emerald-500 active:scale-95"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Add Local Timings</span>
                    </button>
                  </div>
                </div>
              )}

              {times && (
                <MakroohTimesCard
                  times={times}
                  timezone={settings.location!.timezone}
                  dark={dark}
                  now={now}
                />
              )}

              {timesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-2xl border p-4 ${cardBase} animate-pulse`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-6 w-6 rounded-lg bg-stone-200/70 dark:bg-stone-800/70" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-24 rounded bg-stone-200/70 dark:bg-stone-800/70" />
                          <div className="h-3 w-14 rounded bg-stone-200/50 dark:bg-stone-800/50" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-16 rounded-full bg-stone-200/70 dark:bg-stone-800/70" />
                        <div className="h-8 w-8 rounded-full bg-stone-200/50 dark:bg-stone-800/50" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                PRAYERS.map((prayer) => {
                  const window = times ? getPrayerWindows(times)[prayer] : null;
                  const prayerMasjids: MasjidPrayerItem[] = masjidsList.map((m) => ({
                    id: m.id,
                    name: m.name,
                    label: m.label,
                    timing: m.timings?.[prayer] ?? null,
                    isPrimary: Boolean(activeMasjid && m.id === activeMasjid.id),
                  }));

                  return (
                    <PrayerCard
                      key={prayer}
                      prayer={prayer}
                      status={log.prayers[prayer]}
                      time={window?.start ?? prayerTimeMap[prayer]}
                      endTime={window?.end}
                      endLabel={window?.endLabel}
                      timezone={settings.location!.timezone}
                      isCurrent={isToday && current === prayer}
                      isNext={isToday && next === prayer && current !== prayer}
                      dark={dark}
                      allMasjids={prayerMasjids}
                      activeMasjidTab={selectedMasjidTab}
                      onSelectMasjidTab={(tabId) => setSelectedMasjidTab(tabId)}
                      onEditLocalTiming={(targetMasjidId) => {
                        setPrayerFocusForModal(prayer);
                        setEditingMasjidIdForModal(targetMasjidId || activeMasjid?.id);
                        setShowLocalMasjidModal(true);
                      }}
                      onStatusChange={(s: PrayerStatus) => updatePrayer(prayer, s)}
                    />
                  );
                })
              )}
            </section>

            <aside className="space-y-3">
              <section className={`rounded-2xl border p-5 ${cardBase}`} aria-label="Daily prayer tracker">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">Prayer tracker</h2>
                    <p className={`mt-1 text-xs ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                      Your day, one prayer at a time
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <Clock3 className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between gap-1">
                  {PRAYERS.map((prayer) => {
                    const completed = ['prayed', 'jamah', 'delayed'].includes(log.prayers[prayer] ?? '');
                    const shortName = PRAYER_LABELS[prayer].en.slice(0, 3);
                    return (
                      <div key={prayer} className="grid justify-items-center gap-2">
                        <span className={`grid h-9 w-9 place-items-center rounded-full border ${
                          completed
                            ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                            : `border-[var(--app-line)] ${dark ? 'bg-white/[0.03] text-stone-500' : 'bg-white text-stone-400'}`
                        }`}>
                          {completed ? <Check className="h-4 w-4" aria-label="Completed" /> : <span className="text-xs">{shortName}</span>}
                        </span>
                        <span className={`text-[10px] ${dark ? 'text-stone-400' : 'text-stone-500'}`}>{shortName}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-emerald-900/10 dark:bg-white/10">
                  <div className="h-full rounded-full bg-emerald-700 transition-[width] dark:bg-emerald-300" style={{ width: `${fardPct}%` }} />
                </div>
                <p suppressHydrationWarning className={`mt-2 text-xs ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                  <strong className={dark ? 'text-emerald-200' : 'text-emerald-900'}>{fardDone} of 5</strong> prayers logged · {fardPct}%
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('insights')}
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                >
                  <ChartColumnIncreasing className="h-4 w-4" aria-hidden="true" />
                  View prayer insights
                </button>
              </section>
              <div className="space-y-3">
            {/* Sunnah */}
            {settings.trackSunnah && (
              <SunnahPanel
                sunnah={log.sunnah}
                dark={dark}
                onToggle={toggleSunnah}
              />
            )}

            {/* Tahajjud */}
            {settings.trackTahajjud && (
              <TahajjudPanel
                tahajjud={log.tahajjud}
                times={times}
                timezone={settings.location!.timezone}
                dark={dark}
                onUpdate={updateTahajjud}
              />
            )}

            {/* Nafl */}
            {settings.trackNafl && (
              <NaflPanel nafl={log.nafl} dark={dark} onToggle={toggleNafl} />
            )}

            {/* Settings toggles */}
            <div className={`rounded-2xl border p-4 ${cardBase}`}>
              <p
                className={`mb-3 text-[10px] uppercase tracking-widest ${dark ? 'text-stone-600' : 'text-stone-400'}`}
              >
                Options
              </p>
              <div className="space-y-2.5">
                {[
                  {
                    key: 'trackSunnah' as const,
                    label: 'Track Sunnah prayers',
                  },
                  { key: 'trackTahajjud' as const, label: 'Track Tahajjud' },
                  { key: 'trackNafl' as const, label: 'Track Nafl prayers' },
                ].map((opt) => (
                  <div
                    key={opt.key}
                    className="flex items-center justify-between"
                  >
                    <span
                      className={`text-[13px] ${dark ? 'text-stone-400' : 'text-stone-600'}`}
                    >
                      {opt.label}
                    </span>
                    <button
                      onClick={() => {
                        const updated = {
                          ...settings,
                          [opt.key]: !settings[opt.key],
                        };
                        setSettings(updated);
                        saveSalahSettings(updated);
                      }}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings[opt.key]
                          ? 'bg-emerald-600 dark:bg-emerald-500'
                          : dark
                            ? 'bg-stone-700'
                            : 'bg-stone-200'
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          settings[opt.key]
                            ? 'translate-x-5'
                            : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}

                {/* Local Masjid shortcut */}
                <div className="pt-2 border-t border-inherit flex items-center justify-between">
                  <div>
                    <span className={`text-[13px] ${dark ? 'text-stone-300' : 'text-stone-700'}`}>
                      Local Mosques ({masjidsList.length}/{MAX_LOCAL_MASJIDS})
                    </span>
                    <p className={`text-[10px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
                      {activeMasjid ? `${activeMasjid.name} (Active)` : 'Not configured'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrayerFocusForModal(undefined);
                      setEditingMasjidIdForModal(activeMasjid?.id);
                      setShowLocalMasjidModal(true);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      dark
                        ? 'bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {masjidsList.length > 0 ? 'Manage' : 'Configure'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          </aside>
          </div>
          </div>
        )}

        {/* ── Insights tab ── */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <InsightsDashboard dark={dark} />

            <button
              onClick={() => setShowHeatmap((v) => !v)}
              className={`w-full rounded-xl border px-4 py-2.5 text-[11px] uppercase tracking-widest transition-all ${
                dark
                  ? 'border-white/[0.07] text-stone-600 hover:text-stone-400'
                  : 'border-stone-200 text-stone-400 hover:text-stone-600'
              }`}
            >
              {showHeatmap ? '▲ Hide Heatmap' : '▼ Prayer Heatmap'}
            </button>
            {showHeatmap && <SalahHeatmap dark={dark} />}
          </div>
        )}

        {/* ── Masjid tab ── */}
        {activeTab === 'masjid' && (
          <MasjidFinder
            location={settings.location}
            dark={dark}
            onSelectLocalMasjid={(name) => {
              const currentList = getLocalMasjidsList(settings);
              const existingIdx = currentList.findIndex(
                (m) => m.name.toLowerCase() === name.toLowerCase(),
              );
              let updatedList = [...currentList];
              let activeId: string;
              if (existingIdx >= 0) {
                activeId = updatedList[existingIdx].id;
              } else {
                const newId = `masjid_${Date.now()}`;
                const newItem: LocalMasjidItem = {
                  id: newId,
                  name,
                  label: currentList.length === 0 ? 'Home' : 'Local',
                  timings: {},
                  updatedAt: new Date().toISOString(),
                };
                if (updatedList.length >= MAX_LOCAL_MASJIDS) {
                  updatedList = [...updatedList.slice(0, MAX_LOCAL_MASJIDS - 1), newItem];
                } else {
                  updatedList.push(newItem);
                }
                activeId = newId;
              }
              saveLocalMasjidsList(updatedList, activeId);
              const updated = getSalahSettings();
              setSettings(updated);
              if (user?.id && hasSupabaseConfig) {
                void pushLocalMasjidsToSupabase(user.id, updatedList, activeId);
              }
              setEditingMasjidIdForModal(activeId);
              setShowLocalMasjidModal(true);
            }}
          />
        )}

        {/* ── Footer ── */}
        <footer
          className={`mt-8 border-t pt-4 text-center ${dark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}
        >
          <p
            className={`text-[10px] uppercase tracking-widest ${dark ? 'text-stone-700' : 'text-stone-400'}`}
          >
            {user
              ? `${syncStatus === 'synced' ? 'All changes synced' : syncStatus === 'syncing' ? 'Syncing changes…' : syncStatus === 'offline' ? 'Waiting for connection' : 'Sync failed; retrying'} · ${user.email}`
              : 'Progress saved locally · Sign in to sync'}
          </p>
        </footer>
      </div>
      </AppShell>
    </div>
  );
}
