'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHijriDate, getTodayKey } from '@/lib/dates';
import { getSalahSettings, saveSalahSettings } from '@/lib/salahStorage';
import { getCurrentAndNextPrayer } from '@/lib/prayerTimes';
import { load, SETTINGS_KEY } from '@/lib/storage';

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
import { PRAYERS } from '@/types/salah';

type Tab = 'today' | 'insights' | 'masjid';

export default function SalahPage() {
  const [dark, setDark] = useState(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: true }).dark,
  );
  const [settings, setSettings] = useState(() => getSalahSettings());
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isSynced, setIsSynced] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const today = getTodayKey();
  const {
    log,
    setLog,
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
      setIsSynced(true);
    },
    [today, setLog],
  );

  const handleRemoteLogUpdate = useCallback(
    (remoteLog: DayLog) => {
      setLog(remoteLog);
    },
    [setLog],
  );

  useSalahSync({
    user,
    today,
    log,
    onPullComplete: handlePullComplete,
    onRemoteLogUpdate: handleRemoteLogUpdate,
  });

  // Mark unsynced briefly on log change
  useEffect(() => {
    if (!user) return;
    setIsSynced(false);
    const t = setTimeout(() => setIsSynced(true), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log]);

  // Tick every minute for live next-prayer countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Sync dark mode from main app settings
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const handleLocation = (loc: SalahLocation) => {
    const updated = { ...settings, location: loc };
    setSettings(updated);
    saveSalahSettings(updated);
  };

  const { current, next, minutesUntilNext } = times
    ? getCurrentAndNextPrayer(times)
    : { current: null, next: 'fajr', minutesUntilNext: 0 };

  const bg = dark
    ? 'min-h-screen bg-[#0c1a2e] text-stone-200'
    : 'min-h-screen bg-stone-50 text-stone-800';
  const cardBase = dark
    ? 'bg-white/[0.04] border-white/[0.07]'
    : 'bg-white border-stone-200 shadow-sm';
  const tabActive = dark
    ? 'bg-amber-400/15 text-amber-300'
    : 'bg-amber-50 text-amber-700';
  const tabInactive = dark
    ? 'text-stone-500 hover:text-stone-300'
    : 'text-stone-400 hover:text-stone-600';

  // Show location setup if no location
  if (!settings.location) {
    return <LocationSetup dark={dark} onLocation={handleLocation} />;
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
    (p) => log.prayers[p] === 'prayed' || log.prayers[p] === 'jamah',
  ).length;
  const fardPct = Math.round((fardDone / 5) * 100);

  return (
    <div className={bg}>
      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal dark={dark} onClose={() => setShowAuthModal(false)} />
      )}

      <div className="mx-auto max-w-2xl px-4 pt-6 pb-28">
        {/* ── Header ── */}
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p
                className={`text-[10px] uppercase tracking-[0.18em] ${dark ? 'text-amber-400/60' : 'text-amber-600/70'}`}
              >
                {getHijriDate()}
              </p>
              <h1
                className={`mt-0.5 font-serif text-[clamp(20px,4vw,28px)] font-normal tracking-wide ${dark ? 'text-amber-400' : 'text-amber-700'}`}
              >
                Daily Ṣalāh
              </h1>
              <p
                className={`mt-0.5 text-[11px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
              >
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
                  isSynced={isSynced}
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
                📍
              </button>
            </div>
          </div>

          {/* Next prayer banner */}
          {times && (
            <div
              className={`mt-4 flex items-center justify-between rounded-2xl border px-4 py-3 ${
                dark
                  ? 'bg-amber-400/[0.07] border-amber-400/25'
                  : 'bg-amber-50/80 border-amber-200/60'
              }`}
            >
              <div>
                <p
                  className={`text-[10px] uppercase tracking-widest ${dark ? 'text-amber-400/60' : 'text-amber-600/60'}`}
                >
                  {current
                    ? `Current · ${current.charAt(0).toUpperCase() + current.slice(1)}`
                    : 'Before Fajr'}
                </p>
                <p
                  className={`font-serif text-lg font-semibold ${dark ? 'text-amber-300' : 'text-amber-700'}`}
                >
                  Next: {next.charAt(0).toUpperCase() + next.slice(1)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-light tabular-nums ${dark ? 'text-amber-400' : 'text-amber-600'}`}
                >
                  {minutesUntilNext < 60
                    ? `${minutesUntilNext}m`
                    : `${Math.floor(minutesUntilNext / 60)}h ${minutesUntilNext % 60}m`}
                </p>
                <p
                  className={`text-[10px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
                >
                  remaining
                </p>
              </div>
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
              className={`mt-1 flex justify-between text-[10px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}
            >
              <span>{fardDone}/5 prayers</span>
              <span>{fardPct}%</span>
            </div>
          </div>
        </header>

        {/* ── Tab strip ── */}
        <div
          className={`mb-5 flex rounded-xl border p-1 ${dark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-stone-200 bg-stone-50'}`}
        >
          {(['today', 'insights', 'masjid'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-[11px] font-medium uppercase tracking-wide transition-all ${
                activeTab === tab ? tabActive : tabInactive
              }`}
            >
              {tab === 'today'
                ? '🕐 Today'
                : tab === 'insights'
                  ? '📊 Insights'
                  : '🕌 Masjids'}
            </button>
          ))}
        </div>

        {/* ── Today tab ── */}
        {activeTab === 'today' && (
          <div className="space-y-3">
            {/* Prayer cards */}
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
                            ? 'bg-amber-500'
                            : 'bg-amber-500'
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
              ? `Synced · ${user.email}`
              : 'Progress saved locally · Sign in to sync'}
          </p>
        </footer>
      </div>
    </div>
  );
}
