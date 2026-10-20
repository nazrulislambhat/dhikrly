'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Flame,
  Heart,
  Moon,
  MoonStar,
  Share2,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
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
  { id: 'all', label: 'All Duas' },
  { id: 'iftar', label: 'Iftar & Suhoor' },
  { id: 'qadr', label: 'Laylatul Qadr' },
  { id: 'ashra', label: 'Three Ashras' },
];

export default function RamadanPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  const salahSettings = useMemo(() => getSalahSettings(), []);
  const { times, loading: timesLoading } = usePrayerTimes(
    salahSettings.location,
    salahSettings.calcMethod,
    salahSettings.asrMethod,
  );

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
    document.documentElement.classList.toggle('dark', dark);
    setTrackerData(getRamadanTrackerData());
    setKhatmah(getKhatmahProgress());

    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, [dark]);

  // Iftar & Suhoor countdown calculation
  const { countdownText, countdownSub, isFastingHours } = useMemo(() => {
    if (!times) {
      return {
        countdownText: '--:--',
        countdownSub: 'Set location in Ṣalāh settings for live prayer times',
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
        countdownSub: `Remaining until Iftar (${times.maghrib.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
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
        countdownSub: `Until Suhoor ends / Fajr begins`,
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
    setShowDayModal(false);
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
  const khatmahPercentage = Math.round((khatmah.completedJuz.length / 30) * 100);

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm dark:bg-[#14211e]`;
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <AppShell active="ramadan" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <MoonStar className="h-3.5 w-3.5" />
              <span>RAMADAN KAREEM · رَمَضَانُ كَرِيم</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Ramadan Companion
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
              Fasting tracker, Suhoor & Iftar countdown, 30-Day Ramadan deeds journal, Qur’an Khatmah planner, and authentic supplications.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--app-line)] bg-emerald-500/5 p-4 text-right">
            <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200" dir="rtl" lang="ar">
              شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ
            </p>
            <p className="text-xs text-[var(--app-muted)]">
              “The month of Ramadan in which was revealed the Quran” (2:185)
            </p>
          </div>
        </header>

        {/* Live Fasting Hero Widget */}
        <section className={`${cardClass} mb-8 p-6 relative overflow-hidden bg-gradient-to-br from-emerald-900/10 via-transparent to-amber-500/10`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative grid h-24 w-24 place-items-center rounded-3xl border-2 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 shadow-inner">
                {isFastingHours ? (
                  <Sun className="h-10 w-10 text-amber-500 animate-spin-slow" />
                ) : (
                  <MoonStar className="h-10 w-10 text-emerald-600 dark:text-emerald-300" />
                )}
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {isFastingHours ? 'Fasting Time Right Now' : 'Iftar / Night Hours'}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span suppressHydrationWarning className="text-3xl sm:text-4xl font-extrabold text-[var(--app-ink)]">
                    {countdownText}
                  </span>
                </div>
                <p suppressHydrationWarning className="mt-0.5 text-xs text-[var(--app-muted)]">{countdownSub}</p>
              </div>
            </div>

            {/* Prayer Times Quick Pills */}
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-3 text-center min-w-32">
                <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-[var(--app-muted)]">
                  <Sunrise className="h-3.5 w-3.5 text-amber-500" /> Suhoor Ends (Fajr)
                </span>
                <span suppressHydrationWarning className="text-base font-extrabold text-[var(--app-ink)] mt-0.5 block">
                  {times?.fajr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '--:--'}
                </span>
              </div>
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-3 text-center min-w-32">
                <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-[var(--app-muted)]">
                  <Sunset className="h-3.5 w-3.5 text-orange-500" /> Iftar (Maghrib)
                </span>
                <span suppressHydrationWarning className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                  {times?.maghrib.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '--:--'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 30-Day Ramadan Calendar & Deeds Journal */}
        <section className={`${cardClass} mb-8 p-6`}>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                30-Day Ramadan Journey & Deeds Tracker
              </h2>
              <p className="text-xs text-[var(--app-muted)]">
                Tap any day to toggle fast or open details for Farḍ, Tarāwīḥ, and Ṣadaqah
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-emerald-700 dark:text-emerald-300">
                {totalFastedDays} / 30 Fasts Completed
              </span>
              <span className="text-purple-700 dark:text-purple-300">
                {totalTarawihNights} Tarāwīḥ Nights
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
              const rec = trackerData[day];
              const isFasted = rec?.fasted;
              const isTarawih = rec?.tarawih;
              const isLastTen = day >= 21;
              const isOddNight = isLastTen && day % 2 !== 0;

              return (
                <div
                  key={day}
                  className={`group relative flex flex-col items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                    isFasted
                      ? 'border-emerald-500/50 bg-emerald-500/15 shadow-xs'
                      : 'border-[var(--app-line)] bg-black/5 dark:bg-white/5 hover:border-emerald-500/30'
                  } ${isOddNight ? 'ring-2 ring-amber-400/50' : ''}`}
                  onClick={() => handleToggleFastDay(day)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-[var(--app-ink)]">Day {day}</span>
                    {isOddNight && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Odd night in last 10 nights" />
                    )}
                  </div>

                  <div className="my-1.5 grid h-7 w-7 place-items-center rounded-xl transition-colors">
                    {isFasted ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 font-extrabold" />
                    ) : (
                      <span className="text-[10px] text-[var(--app-muted)]">○</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] text-[var(--app-muted)]">
                      {isTarawih ? '🌙 Qiyam' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDay(day);
                        setShowDayModal(true);
                      }}
                      className="text-[9px] font-bold text-emerald-800 dark:text-emerald-200 underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 30 Juz Qur’an Khatmah Planner */}
        <section className={`${cardClass} mb-8 p-6`}>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                  30-Day Qur’an Khatmah Planner
                </h2>
              </div>
              <p className="text-xs text-[var(--app-muted)]">
                Recite 1 Juz (approx. 20 pages) per day — 4 pages after every Farḍ prayer
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                {khatmah.completedJuz.length} of 30 Juz ({khatmahPercentage}%)
              </span>
            </div>
          </div>

          <div className="mb-4 h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${khatmahPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
              const isDone = khatmah.completedJuz.includes(juz);
              return (
                <button
                  key={juz}
                  type="button"
                  onClick={() => handleToggleJuz(juz)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 shadow-xs'
                      : 'border-[var(--app-line)] bg-black/5 dark:bg-white/5 text-[var(--app-muted)] hover:border-emerald-500/30'
                  }`}
                >
                  <span>Juz {juz}</span>
                  {isDone ? (
                    <Check className="h-3 w-3 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span className="text-[10px] opacity-40 mt-0.5">20p</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--app-line)] flex items-center justify-between text-xs text-[var(--app-muted)]">
            <span>Read 4 pages after Fajr, Dhuhr, Asr, Maghrib, and Isha to finish with ease.</span>
            <Link href="/quran" className="font-bold text-emerald-700 dark:text-emerald-300 hover:underline">
              Open Qur’an Reader →
            </Link>
          </div>
        </section>

        {/* Daily Ramadan Duas Collection */}
        <section className={`${cardClass} mb-8 p-6`}>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                Essential Ramadan Supplications
              </h2>
              <p className="text-xs text-[var(--app-muted)]">
                Authentic duas for Iftar, Suhoor, Laylatul Qadr, and the Three Ashras
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-1 shadow-xs">
              {ASHRA_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDuaTab(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    activeDuaTab === tab.id
                      ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                      : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDuas.map((dua) => {
              const isCopied = copiedId === dua.id;
              return (
                <div
                  key={dua.id}
                  className="rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 rounded-full bg-emerald-500/10 px-2.5 py-0.5">
                        {dua.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyDua(dua)}
                        className="p-1.5 rounded-lg border border-[var(--app-line)] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                        title="Copy dua text"
                        aria-label="Copy dua text"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <p
                      className="text-right text-xl font-bold leading-relaxed text-[var(--app-ink)] font-arabic mb-3"
                      dir="rtl"
                      lang="ar"
                    >
                      {dua.ar}
                    </p>

                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 italic mb-2">
                      {dua.transliteration}
                    </p>

                    <p className="text-xs text-[var(--app-muted)] leading-relaxed mb-3">
                      “{dua.en}”
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--app-line)] flex items-center justify-between text-[11px] text-[var(--app-muted)]">
                    <span className="font-medium">{dua.reference}</span>
                    <span className="italic">{dua.significance}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Day Details Modal */}
        {showDayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-2xl dark:bg-[#14211e]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-[var(--app-ink)]">
                  Log Deeds for Ramadan Day {selectedDay}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDayModal(false)}
                  className="rounded-full p-1 text-stone-500 hover:text-stone-900"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Fasted */}
                <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--app-line)] cursor-pointer">
                  <span className="text-sm font-bold text-[var(--app-ink)]">Observed Fast (Sawm)</span>
                  <input
                    type="checkbox"
                    checked={trackerData[selectedDay]?.fasted ?? false}
                    onChange={(e) => {
                      const cur = trackerData[selectedDay] ?? { day: selectedDay, fasted: false, prayersCount: 5, tarawih: false, quranJuz: false, sadaqah: false };
                      handleSaveDayDetails({ ...cur, fasted: e.target.checked });
                    }}
                    className="h-5 w-5 accent-emerald-600 rounded"
                  />
                </label>

                {/* Tarawih */}
                <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--app-line)] cursor-pointer">
                  <span className="text-sm font-bold text-[var(--app-ink)]">Prayed Tarāwīḥ (Qiyām)</span>
                  <input
                    type="checkbox"
                    checked={trackerData[selectedDay]?.tarawih ?? false}
                    onChange={(e) => {
                      const cur = trackerData[selectedDay] ?? { day: selectedDay, fasted: false, prayersCount: 5, tarawih: false, quranJuz: false, sadaqah: false };
                      handleSaveDayDetails({ ...cur, tarawih: e.target.checked });
                    }}
                    className="h-5 w-5 accent-emerald-600 rounded"
                  />
                </label>

                {/* Sadaqah */}
                <label className="flex items-center justify-between p-3 rounded-2xl border border-[var(--app-line)] cursor-pointer">
                  <span className="text-sm font-bold text-[var(--app-ink)]">Gave Ṣadaqah (Charity)</span>
                  <input
                    type="checkbox"
                    checked={trackerData[selectedDay]?.sadaqah ?? false}
                    onChange={(e) => {
                      const cur = trackerData[selectedDay] ?? { day: selectedDay, fasted: false, prayersCount: 5, tarawih: false, quranJuz: false, sadaqah: false };
                      handleSaveDayDetails({ ...cur, sadaqah: e.target.checked });
                    }}
                    className="h-5 w-5 accent-emerald-600 rounded"
                  />
                </label>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowDayModal(false)}
                  className="w-full rounded-2xl bg-emerald-800 py-3 text-sm font-bold text-white dark:bg-emerald-400 dark:text-emerald-950"
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
