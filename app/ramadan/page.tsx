'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Heart,
  Moon,
  MoonStar,
  Pencil,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, SETTINGS_KEY } from '@/lib/storage';
import { getSalahSettings } from '@/lib/salahStorage';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import {
  getKhatmahProgress,
  getRamadanTrackerData,
  RAMADAN_DUAS,
  saveKhatmahProgress,
  saveRamadanDayRecord,
  type RamadanDayRecord,
  type RamadanDua,
} from '@/lib/ramadan';
import { playCheck } from '@/lib/sounds';

const ASHRA_TABS = [
  { id: 'all', label: 'All Du‘ās' },
  { id: 'iftar', label: 'Ifṭār & Suḥūr' },
  { id: 'qadr', label: 'Laylatul Qadr' },
  { id: 'ashra', label: 'Three Ashras' },
];

type ActiveSection = 'journey' | 'khatmah' | 'duas';

export default function RamadanPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [dark, setDark] = useState<boolean>(false);

  const salahSettings = useMemo(() => getSalahSettings(), []);
  const { times, loading: timesLoading } = usePrayerTimes(
    salahSettings.location,
    salahSettings.calcMethod,
    salahSettings.asrMethod,
  );

  const [activeSection, setActiveSection] = useState<ActiveSection>('journey');
  const [activeDuaTab, setActiveDuaTab] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 30-day tracking data
  const [trackerData, setTrackerData] = useState<Record<number, RamadanDayRecord>>({});
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showDayModal, setShowDayModal] = useState(false);

  // Khatmah data (30 Juz)
  const [khatmah, setKhatmah] = useState<{ completedJuz: number[]; completedPages: number }>({
    completedJuz: [],
    completedPages: 0,
  });

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const savedDark = load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark;
    setDark(savedDark);
    setTrackerData(getRamadanTrackerData());
    setKhatmah(getKhatmahProgress());

    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Iftar & Suhoor countdown calculation
  const { countdownText, countdownSub, isFastingHours } = useMemo(() => {
    if (!times || !mounted) {
      return {
        countdownText: '--:--',
        countdownSub: 'Configure location in Ṣalāh settings for prayer times',
        isFastingHours: false,
      };
    }

    const currentMs = now.getTime();
    const fajrMs = times.fajr.getTime();
    const maghribMs = times.maghrib.getTime();

    // Are we between Fajr and Maghrib?
    if (currentMs >= fajrMs && currentMs < maghribMs) {
      // Fasting now! Countdown to Iftar
      const diffMs = maghribMs - currentMs;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        countdownText: `${hours}h ${mins}m`,
        countdownSub: `Remaining until Ifṭār (${times.maghrib.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        isFastingHours: true,
      };
    } else {
      // Outside fasting hours! Countdown to Suhoor / Fajr
      let targetFajr = fajrMs;
      if (currentMs >= maghribMs) {
        // Next day Fajr
        targetFajr += 24 * 60 * 60 * 1000;
      }
      const diffMs = targetFajr - currentMs;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        countdownText: `${hours}h ${mins}m`,
        countdownSub: `Until Suḥūr ends · Fajr begins`,
        isFastingHours: false,
      };
    }
  }, [times, now]);

  const handleToggleFastDay = (dayNum: number) => {
    playCheck();
    const existing = trackerData[dayNum] ?? {
      day: dayNum,
      fasted: false,
      prayersCount: 5,
      tarawih: false,
      quranJuz: false,
      sadaqah: false,
    };
    const updated = { ...existing, fasted: !existing.fasted };
    saveRamadanDayRecord(updated);
    setTrackerData((prev) => ({ ...prev, [dayNum]: updated }));
  };

  const handleSaveDayDetails = (updated: RamadanDayRecord) => {
    saveRamadanDayRecord(updated);
    setTrackerData((prev) => ({ ...prev, [updated.day]: updated }));
  };

  const handleToggleJuz = (juz: number) => {
    playCheck();
    setKhatmah((prev) => {
      const exists = prev.completedJuz.includes(juz);
      const nextJuz = exists
        ? prev.completedJuz.filter((j) => j !== juz)
        : [...prev.completedJuz, juz].sort((a, b) => a - b);
      const next = {
        completedJuz: nextJuz,
        completedPages: nextJuz.length * 20,
      };
      saveKhatmahProgress(next);
      return next;
    });
  };

  const handleCopyDua = (dua: RamadanDua) => {
    navigator.clipboard.writeText(`${dua.titleAr}\n${dua.ar}\n\n${dua.transliteration}\n\n${dua.en}`);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredDuas = useMemo(() => {
    if (activeDuaTab === 'all') return RAMADAN_DUAS;
    if (activeDuaTab === 'iftar') return RAMADAN_DUAS.filter((d) => d.category === 'iftar' || d.category === 'suhoor');
    if (activeDuaTab === 'qadr') return RAMADAN_DUAS.filter((d) => d.category === 'qadr');
    if (activeDuaTab === 'ashra') return RAMADAN_DUAS.filter((d) => d.category === 'ashra');
    return RAMADAN_DUAS;
  }, [activeDuaTab]);

  // Overall 30 days stats
  const totalFastedDays = Object.values(trackerData).filter((d) => d.fasted).length;
  const totalTarawihNights = Object.values(trackerData).filter((d) => d.tarawih).length;
  const totalSadaqahDays = Object.values(trackerData).filter((d) => d.sadaqah).length;
  const khatmahPercentage = Math.round((khatmah.completedJuz.length / 30) * 100);

  const cardBase = dark
    ? 'bg-white/[0.03] border-white/[0.08] shadow-xs'
    : 'bg-white border-sakinah-200/80 shadow-xs';

  return (
    <AppShell active="ramadan" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),70rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-dhikr-500/20 bg-dhikr-500/10 px-2.5 py-1 text-[11px] font-semibold text-dhikr-800 dark:text-dhikr-300">
              <MoonStar className="h-3 w-3" />
              <span>RAMADAN KAREEM · رَمَضَانُ كَرِيم</span>
            </div>
            <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--app-ink)]">
              Ramadan Companion
            </h1>
            <p className="mt-0.5 text-xs text-[var(--app-muted)]">
              Daily fasts, prayer countdowns, Qur’an Khatmah planner, and authentic supplications.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--app-line)] bg-white/40 dark:bg-white/[0.02] px-4 py-2.5 text-right">
            <p className="font-arabic text-sm sm:text-base font-semibold text-dhikr-800 dark:text-dhikr-300" dir="rtl" lang="ar">
              شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ
            </p>
            <p className="text-[10px] text-[var(--app-muted)] mt-0.5">
              “The month of Ramadan in which was revealed the Quran” (2:185)
            </p>
          </div>
        </header>

        {/* Live Ramadan Status Hub */}
        <div
          className={`mb-6 overflow-hidden rounded-3xl border transition-all ${
            dark
              ? 'border-primary/25 bg-gradient-to-br from-[#0d1411] via-[#131d18] to-[#0a0f0d]'
              : 'border-border bg-gradient-to-br from-primary-subtle via-brand-100 to-canvas shadow-xs'
          }`}
        >
          <div className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Left: State & Countdown */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div
                  className={`grid h-14 w-14 sm:h-16 sm:w-16 shrink-0 place-items-center rounded-2xl border transition-all ${
                    isFastingHours
                      ? dark
                        ? 'border-noor-400/30 bg-noor-400/10 text-noor-300'
                        : 'border-noor-400/40 bg-noor-100 text-noor-800'
                      : dark
                        ? 'border-dhikr-400/30 bg-dhikr-400/10 text-dhikr-300'
                        : 'border-dhikr-300/60 bg-dhikr-100 text-dhikr-800'
                  }`}
                >
                  {isFastingHours ? (
                    <Sun className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse" />
                  ) : (
                    <MoonStar className="h-6 w-6 sm:h-7 sm:w-7" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                        isFastingHours
                          ? dark
                            ? 'bg-noor-400/15 text-noor-300'
                            : 'bg-noor-100 text-noor-900'
                          : dark
                            ? 'bg-dhikr-400/15 text-dhikr-300'
                            : 'bg-dhikr-100 text-dhikr-900'
                      }`}
                    >
                      ● {isFastingHours ? 'Fasting Time Right Now' : 'Iftar / Night Hours'}
                    </span>
                  </div>

                  <p
                    suppressHydrationWarning
                    className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-[var(--app-ink)]"
                  >
                    {countdownText}
                  </p>
                  <p suppressHydrationWarning className="text-xs text-[var(--app-muted)]">
                    {countdownSub}
                  </p>
                </div>
              </div>

              {/* Right: Quick Suhoor & Iftar Times */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
                <div
                  className={`rounded-2xl border px-3.5 py-2.5 text-center transition-all ${
                    dark
                      ? 'border-white/10 bg-white/5'
                      : 'border-dhikr-900/10 bg-white/80 shadow-2xs'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    <Sunrise className="h-3 w-3 text-noor-500" /> Suḥūr Ends
                  </span>
                  <p
                    suppressHydrationWarning
                    className="mt-0.5 text-sm sm:text-base font-bold tabular-nums text-[var(--app-ink)]"
                  >
                    {times?.fajr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '--:--'}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border px-3.5 py-2.5 text-center transition-all ${
                    dark
                      ? 'border-white/10 bg-white/5'
                      : 'border-dhikr-900/10 bg-white/80 shadow-2xs'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    <Sunset className="h-3 w-3 text-noor-600" /> Ifṭār Begins
                  </span>
                  <p
                    suppressHydrationWarning
                    className="mt-0.5 text-sm sm:text-base font-bold tabular-nums text-dhikr-700 dark:text-dhikr-300"
                  >
                    {times?.maghrib.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '--:--'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-4 pt-4 border-t border-inherit flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--app-muted)]">Fasts:</span>
                  <strong className="text-dhikr-700 dark:text-dhikr-300 font-bold">
                    {totalFastedDays} / 30
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--app-muted)]">Tarāwīḥ:</span>
                  <strong className="text-purple-700 dark:text-purple-300 font-bold">
                    {totalTarawihNights} nights
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--app-muted)]">Khatmah:</span>
                  <strong className="text-dhikr-700 dark:text-dhikr-300 font-bold">
                    {khatmah.completedJuz.length}/30 ({khatmahPercentage}%)
                  </strong>
                </div>
              </div>

              {salahSettings.location && (
                <div className="text-[11px] text-[var(--app-muted)]">
                  Times for {salahSettings.location.city}, {salahSettings.location.country}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Segmented Navigation (Minified clean layout) ── */}
        <div
          className={`mb-6 flex flex-wrap items-center justify-between rounded-2xl border p-1 ${
            dark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-sakinah-200 bg-sakinah-100/80'
          }`}
        >
          {[
            { id: 'journey', label: '30-Day Journey', icon: Calendar, badge: `${totalFastedDays}/30` },
            { id: 'khatmah', label: 'Qur’an Khatmah', icon: BookOpen, badge: `${khatmahPercentage}%` },
            { id: 'duas', label: 'Supplications', icon: Sparkles, badge: filteredDuas.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as ActiveSection)}
                className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? dark
                      ? 'bg-dhikr-500/20 text-dhikr-200 shadow-xs ring-1 ring-dhikr-400/30'
                      : 'bg-white text-dhikr-900 shadow-sm'
                    : dark
                      ? 'text-sakinah-400 hover:text-sakinah-200'
                      : 'text-sakinah-500 hover:text-sakinah-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    isActive
                      ? dark
                        ? 'bg-dhikr-400/20 text-dhikr-300'
                        : 'bg-dhikr-100 text-dhikr-800'
                      : dark
                        ? 'bg-white/10 text-sakinah-400'
                        : 'bg-sakinah-200/80 text-sakinah-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: 30-Day Ramadan Journey & Deeds Tracker ── */}
        {activeSection === 'journey' && (
          <section className={`rounded-3xl border p-5 sm:p-6 transition-all ${cardBase}`} aria-label="30-Day Fasting Journey">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--app-ink)]">
                  30-Day Journey & Deeds Tracker
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Tap any day to mark your fast. Click the edit button to log Tarāwīḥ, Ṣadaqah, and Qur’an.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-dhikr-500/10 px-2.5 py-0.5 font-bold text-dhikr-800 dark:text-dhikr-300">
                  <Check className="h-3 w-3" /> {totalFastedDays} Fasts
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-0.5 font-bold text-purple-800 dark:text-purple-300">
                  <Moon className="h-3 w-3" /> {totalTarawihNights} Tarāwīḥ
                </span>
                {totalSadaqahDays > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-noor-500/10 px-2.5 py-0.5 font-bold text-noor-800 dark:text-noor-300">
                    <Heart className="h-3 w-3" /> {totalSadaqahDays} Ṣadaqah
                  </span>
                )}
              </div>
            </div>

            {/* Clean, Aesthetic 30-Day Calendar Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                const rec = trackerData[day];
                const isFasted = rec?.fasted;
                const isTarawih = rec?.tarawih;
                const isSadaqah = rec?.sadaqah;
                const isLastTen = day >= 21;
                const isOddNight = isLastTen && day % 2 !== 0;

                return (
                  <div
                    key={day}
                    onClick={() => handleToggleFastDay(day)}
                    className={`group relative flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border cursor-pointer transition-all active:scale-95 ${
                      isFasted
                        ? dark
                          ? 'border-dhikr-500/40 bg-dhikr-500/15 shadow-2xs'
                          : 'border-dhikr-400 bg-dhikr-50/80 shadow-2xs'
                        : dark
                          ? 'border-white/[0.07] bg-white/[0.02] hover:border-dhikr-400/30 hover:bg-white/[0.04]'
                          : 'border-sakinah-200/80 bg-sakinah-50/70 hover:border-dhikr-300 hover:bg-sakinah-100/70'
                    } ${isOddNight ? 'ring-1.5 ring-noor-400/60' : ''}`}
                    title={`Day ${day}${isOddNight ? ' · Blessed Odd Night' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[11px] font-bold ${isFasted ? 'text-dhikr-800 dark:text-dhikr-300' : 'text-[var(--app-ink)]'}`}>
                        {day}
                      </span>
                      {isOddNight && (
                        <span className="h-1.5 w-1.5 rounded-full bg-noor-400" title="Laylatul Qadr candidate night" />
                      )}
                    </div>

                    <div className="my-1.5 grid h-6 place-items-center">
                      {isFasted ? (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-dhikr-700 dark:bg-dhikr-400 text-white dark:text-dhikr-950 shadow-2xs">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[10px] text-sakinah-300 dark:text-sakinah-600">○</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between w-full text-[9px]">
                      <div className="flex items-center gap-0.5 text-sakinah-400 dark:text-sakinah-500">
                        {isTarawih && <span title="Tarāwīḥ prayed">🌙</span>}
                        {isSadaqah && <span title="Ṣadaqah given">💛</span>}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(day);
                          setShowDayModal(true);
                        }}
                        className="rounded-md p-0.5 text-sakinah-400 hover:text-dhikr-700 dark:hover:text-dhikr-300 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Edit day deeds"
                        aria-label={`Edit Day ${day} deeds`}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--app-line)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--app-muted)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-dhikr-500" /> Fasted
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full ring-1 ring-noor-400" /> Last 10 Odd Nights (Laylatul Qadr)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span>🌙</span> Tarāwīḥ
                </span>
              </div>
              <span className="italic">Tap any day to toggle fast</span>
            </div>
          </section>
        )}

        {/* ── TAB 2: Qur’an Khatmah Planner (30 Juz) ── */}
        {activeSection === 'khatmah' && (
          <section className={`rounded-3xl border p-5 sm:p-6 transition-all ${cardBase}`} aria-label="Qur’an Khatmah Planner">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-dhikr-700 dark:text-dhikr-400" />
                  <h2 className="text-base font-bold text-[var(--app-ink)]">
                    30-Day Qur’an Khatmah Planner
                  </h2>
                </div>
                <p className="text-xs text-[var(--app-muted)]">
                  Complete the entire Qur’an this blessed month. 1 Juz per day = 4 pages after each Farḍ prayer.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-dhikr-700 dark:text-dhikr-300">
                  {khatmah.completedJuz.length} of 30 Juz ({khatmahPercentage}%)
                </span>
              </div>
            </div>

            {/* Sleek Minimal Progress Bar */}
            <div className="mb-4 h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-dhikr-600 dark:bg-dhikr-400 rounded-full transition-all duration-300"
                style={{ width: `${khatmahPercentage}%` }}
              />
            </div>

            {/* Compact 30-Juz Tiles */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                const isDone = khatmah.completedJuz.includes(juz);
                return (
                  <button
                    key={juz}
                    type="button"
                    onClick={() => handleToggleJuz(juz)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      isDone
                        ? dark
                          ? 'border-dhikr-500/40 bg-dhikr-500/20 text-dhikr-200 shadow-2xs'
                          : 'border-dhikr-400 bg-dhikr-50 text-dhikr-900 shadow-2xs'
                        : dark
                          ? 'border-white/[0.07] bg-white/[0.02] text-sakinah-400 hover:border-dhikr-400/30 hover:text-sakinah-200'
                          : 'border-sakinah-200/80 bg-sakinah-50/70 text-sakinah-500 hover:border-dhikr-300 hover:text-sakinah-900'
                    }`}
                  >
                    <span>Juz {juz}</span>
                    {isDone ? (
                      <Check className="h-3 w-3 mt-0.5 text-dhikr-600 dark:text-dhikr-400" />
                    ) : (
                      <span className="text-[9px] opacity-40 mt-0.5">20p</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Prophetic Rhythm Guidance */}
            <div className="mt-5 pt-4 border-t border-[var(--app-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--app-muted)]">
              <span>
                💡 <strong>The Easy Pace:</strong> Read 4 pages after Fajr, Dhuhr, Asr, Maghrib, and Isha to finish 1 Juz every day without fatigue.
              </span>
              <Link
                href="/quran"
                className="inline-flex items-center gap-1 font-bold text-dhikr-700 dark:text-dhikr-400 hover:underline shrink-0"
              >
                <span>Open Qur’an Reader</span>
                <span>→</span>
              </Link>
            </div>
          </section>
        )}

        {/* ── TAB 3: Essential Ramadan Supplications ── */}
        {activeSection === 'duas' && (
          <section className={`rounded-3xl border p-5 sm:p-6 transition-all ${cardBase}`} aria-label="Ramadan Supplications">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--app-ink)]">
                  Essential Ramadan Supplications
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Authentic prophetic duas for Ifṭār, Suḥūr, Laylatul Qadr, and the Three Ashras
                </p>
              </div>

              {/* Filter Tabs */}
              <div
                className={`flex flex-wrap gap-1 rounded-xl border p-1 ${
                  dark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-sakinah-200 bg-sakinah-100/70'
                }`}
              >
                {ASHRA_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDuaTab(tab.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      activeDuaTab === tab.id
                        ? dark
                          ? 'bg-dhikr-500/20 text-dhikr-200 shadow-xs'
                          : 'bg-white text-dhikr-900 shadow-xs'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimalist Dua Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDuas.map((dua) => {
                const isCopied = copiedId === dua.id;
                return (
                  <div
                    key={dua.id}
                    className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                      dark
                        ? 'border-white/[0.06] bg-white/[0.02] hover:border-dhikr-500/30'
                        : 'border-sakinah-200/70 bg-sakinah-50/50 hover:border-dhikr-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-dhikr-800 dark:text-dhikr-300 rounded-full bg-dhikr-500/10 px-2 py-0.5">
                          {dua.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyDua(dua)}
                          className="p-1.5 rounded-lg border border-[var(--app-line)] text-sakinah-400 hover:text-sakinah-900 dark:hover:text-sakinah-100 transition-colors cursor-pointer"
                          title="Copy dua text"
                          aria-label="Copy dua text"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-dhikr-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>

                      <p
                        className="text-right text-lg sm:text-xl font-bold leading-relaxed text-[var(--app-ink)] font-arabic mb-3"
                        dir="rtl"
                        lang="ar"
                      >
                        {dua.ar}
                      </p>

                      <p className="text-xs font-semibold text-dhikr-800 dark:text-dhikr-300 italic mb-2">
                        {dua.transliteration}
                      </p>

                      <p className="text-xs text-[var(--app-muted)] leading-relaxed mb-3">
                        “{dua.en}”
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[var(--app-line)] flex items-center justify-between text-[10px] text-[var(--app-muted)]">
                      <span className="font-semibold">{dua.reference}</span>
                      <span className="italic opacity-80">{dua.significance}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Day Deeds Detail Modal ── */}
        {showDayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--app-line)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--app-ink)]">
                    Ramadan Day {selectedDay} Deeds
                  </h3>
                  <p className="text-xs text-[var(--app-muted)]">Track daily spiritual habits</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDayModal(false)}
                  className="rounded-full p-1 text-sakinah-400 hover:text-sakinah-900 dark:hover:text-sakinah-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Fasted */}
                <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                  dark ? 'border-white/10 bg-white/[0.02]' : 'border-border bg-surface'
                }`}>
                  <span className="text-xs font-bold text-[var(--app-ink)]">Observed Fast (Ṣawm)</span>
                  <input
                    type="checkbox"
                    checked={trackerData[selectedDay]?.fasted ?? false}
                    onChange={(e) => {
                      const cur = trackerData[selectedDay] ?? { day: selectedDay, fasted: false, prayersCount: 5, tarawih: false, quranJuz: false, sadaqah: false };
                      handleSaveDayDetails({ ...cur, fasted: e.target.checked });
                    }}
                    className="h-4 w-4 accent-primary rounded cursor-pointer"
                  />
                </label>

                {/* Tarawih */}
                <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                  dark ? 'border-white/10 bg-white/[0.02]' : 'border-border bg-surface'
                }`}>
                  <span className="text-xs font-bold text-[var(--app-ink)]">Prayed Tarāwīḥ (Qiyām)</span>
                  <input
                    type="checkbox"
                    checked={trackerData[selectedDay]?.tarawih ?? false}
                    onChange={(e) => {
                      const cur = trackerData[selectedDay] ?? { day: selectedDay, fasted: false, prayersCount: 5, tarawih: false, quranJuz: false, sadaqah: false };
                      handleSaveDayDetails({ ...cur, tarawih: e.target.checked });
                    }}
                    className="h-4 w-4 accent-primary rounded cursor-pointer"
                  />
                </label>

                {/* Sadaqah */}
                <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                  dark ? 'border-white/10 bg-white/[0.02]' : 'border-border bg-surface'
                }`}>
                  <span className="text-xs font-bold text-[var(--app-ink)]">Gave Ṣadaqah (Charity)</span>
                  <input
                    type="checkbox"
                    checked={trackerData[selectedDay]?.sadaqah ?? false}
                    onChange={(e) => {
                      const cur = trackerData[selectedDay] ?? { day: selectedDay, fasted: false, prayersCount: 5, tarawih: false, quranJuz: false, sadaqah: false };
                      handleSaveDayDetails({ ...cur, sadaqah: e.target.checked });
                    }}
                    className="h-4 w-4 accent-primary rounded cursor-pointer"
                  />
                </label>

                {/* Quran */}
                <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                  dark ? 'border-white/10 bg-white/[0.02]' : 'border-border bg-surface'
                }`}>
                  <span className="text-xs font-bold text-[var(--app-ink)]">Recited Daily Qur’an</span>
                  <input
                    type="checkbox"
                    checked={trackerData[selectedDay]?.quranJuz ?? false}
                    onChange={(e) => {
                      const cur = trackerData[selectedDay] ?? { day: selectedDay, fasted: false, prayersCount: 5, tarawih: false, quranJuz: false, sadaqah: false };
                      handleSaveDayDetails({ ...cur, quranJuz: e.target.checked });
                    }}
                    className="h-4 w-4 accent-primary rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowDayModal(false)}
                  className="w-full rounded-2xl bg-primary py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-hover cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
