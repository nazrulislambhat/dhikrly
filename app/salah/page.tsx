'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChartColumnIncreasing,
  Check,
  Clock3,
  LocateFixed,
  MapPinned,
} from 'lucide-react';
import { getHijriDate, getTodayKey } from '@/lib/dates';
import { getSalahSettings, saveSalahSettings } from '@/lib/salahStorage';
import { getCurrentAndNextPrayer } from '@/lib/prayerTimes';
import { load, save, SETTINGS_KEY } from '@/lib/storage';

import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSalahLog } from '@/hooks/useSalahLog';
import { useSalahSync } from '@/hooks/useSalahSync';
import { useAuth } from '@/hooks/useAuth';

import LocationSetup from '@/components/salah/LocationSetup';
import PrayerCard from '@/components/salah/PrayerCard';
import SunnahPanel from '@/components/salah/SunnahPanel';
import TahajjudPanel from '@/components/salah/TahajjudPanel';
import NaflPanel from '@/components/salah/NaflPanel';
import InsightsDashboard from '@/components/salah/InsightsDashboard';
import SalahHeatmap from '@/components/salah/SalahHeatmap';
import MasjidFinder from '@/components/salah/MasjidFinder';
import UserMenu from '@/components/UserMenu';
import AuthModal from '@/components/AuthModal';

import type {
  PrayerName,
  PrayerStatus,
  SalahLocation,
  DayLog,
} from '@/types/salah';
import { PRAYERS, PRAYER_LABELS } from '@/types/salah';
import AppShell from '@/components/AppShell';

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

  const today = getTodayKey();
  const {
    log,
    setLog,
    localRevision,
    updatePrayer,
    toggleSunnah,
    updateTahajjud,
    toggleNafl,
  } = useSalahLog(today);
  const { user, loading: authLoading, signOut } = useAuth();
  const { times, loading: timesLoading } = usePrayerTimes(
    settings.location,
    settings.calcMethod,
    settings.asrMethod,
  );

  // Sync callbacks
  const handlePullComplete = useCallback(
    (logs: DayLog[]) => {
      const todayLog = logs.find((l) => l.date === today);
      if (todayLog) setLog(todayLog);
    },
    [today, setLog],
  );

  const handleRemoteLogUpdate = useCallback(
    (remoteLog: DayLog) => {
      setLog(remoteLog);
    },
    [setLog],
  );

  const { status: syncStatus } = useSalahSync({
    user,
    today,
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

  const handleLocation = (loc: SalahLocation) => {
    const updated = { ...settings, location: loc };
    setSettings(updated);
    saveSalahSettings(updated);
  };

  const { current, next, minutesUntilNext } = times
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

      <AppShell active="salah" dark={dark} onToggleDark={() => setDark((value) => !value)}>
      <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-10 sm:px-6 sm:pt-8 lg:px-10">
        {/* ── Header ── */}
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${dark ? 'text-emerald-300/70' : 'text-emerald-800/75'}`}
              >
                {getHijriDate()}
              </p>
              <h1
                className={`mt-0.5 font-serif text-[clamp(24px,4vw,32px)] font-semibold tracking-tight ${dark ? 'text-stone-100' : 'text-stone-900'}`}
              >
                Daily Ṣalāh
              </h1>
              <p
                className={`mt-1 inline-flex items-center gap-1.5 text-xs ${dark ? 'text-stone-400' : 'text-stone-500'}`}
              >
                <MapPinned className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                {settings.location.city}, {settings.location.country}
              </p>
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
                  onSignOut={async () => {
                    await signOut();
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all hover:scale-105 ${
                    dark
                      ? 'border-amber-400/30 text-amber-400/70 hover:text-amber-400'
                      : 'border-amber-500/40 text-amber-600 hover:text-amber-700'
                  }`}
                >
                  ↑ Sync
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

          {/* Next prayer banner */}
          {times && (
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
                <p className={`mt-1 text-sm ${dark ? 'text-stone-300' : 'text-amber-950/75'}`}>
                  {times[next].toLocaleTimeString('en', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: settings.location!.timezone,
                  })}
                </p>
              </div>
              <div className="relative z-10 text-right">
                <p
                  className={`text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl ${dark ? 'text-emerald-200' : 'text-emerald-900'}`}
                >
                  {minutesUntilNext < 60
                    ? `${minutesUntilNext}m`
                    : `${Math.floor(minutesUntilNext / 60)}h ${minutesUntilNext % 60}m`}
                </p>
                <p
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
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
            <section className="space-y-3" aria-label="Prayer times and log">
              {PRAYERS.map((prayer) => (
                <PrayerCard
                  key={prayer}
                  prayer={prayer}
                  status={log.prayers[prayer]}
                  time={prayerTimeMap[prayer]}
                  timezone={settings.location!.timezone}
                  isCurrent={current === prayer}
                  isNext={next === prayer && current !== prayer}
                  dark={dark}
                  onStatusChange={(s: PrayerStatus) => updatePrayer(prayer, s)}
                />
              ))}
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
                <p className={`mt-2 text-xs ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
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
                          ? dark
                            ? 'bg-green-700'
                            : 'bg-green-700'
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
              </div>
            </div>
          </div>
          </aside>
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
          <MasjidFinder location={settings.location} dark={dark} />
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
