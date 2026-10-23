'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  BookMarked,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Flame,
  HandHeart,
  HeartHandshake,
  Lightbulb,
  LineChart as LineChartIcon,
  ListChecks,
  MoonStar,
  Plus,
  Sparkles,
  Sunrise,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import QuranTrackerModal from '@/components/QuranTrackerModal';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { computeDayScore, getRecentLogs, isPrayed, saveAllLogs, emptyDay } from '@/lib/salahStorage';
import { formatSafeDate } from '@/lib/dates';
import { useAuth } from '@/hooks/useAuth';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import {
  ALL_SURAHS,
  TOTAL_QURAN_AYAHS,
  TOTAL_QURAN_SURAHS,
  computeQuranStats,
  deleteReadingLog,
  getQuranTrackerData,
  toggleSurahCompleted,
  type QuranReadingLog,
  type QuranStats,
  type QuranTrackerData,
} from '@/lib/quranTracker';
import type { DayLog, PrayerName, WeekBar } from '@/types/salah';
import { PRAYERS, PRAYER_LABELS } from '@/types/salah';

type TimeRange = '7' | '30' | '90';
type InsightTab = 'overview' | 'quran' | 'prayers' | 'milestones';
type SurahFilter = 'all' | 'completed' | 'remaining';

export default function InsightsPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState<number>(0);
  const { user } = useAuth();

  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [activeTab, setActiveTab] = useState<InsightTab>('overview');

  // Quran tracker modal state
  const [quranModalOpen, setQuranModalOpen] = useState<boolean>(false);
  const [quranModalTab, setQuranModalTab] = useState<'log' | 'checklist'>('log');
  const [quranModalSurah, setQuranModalSurah] = useState<number>(1);
  const [surahFilter, setSurahFilter] = useState<SurahFilter>('all');

  // Quran tracker state from localStorage
  const [quranTrackerData, setQuranTrackerData] = useState<QuranTrackerData>(() =>
    getQuranTrackerData(),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Listen to Quran tracker & Salah & Adhkar updates across windows / components
  useEffect(() => {
    const handleUpdate = () => {
      setDataVersion((v) => v + 1);
      setQuranTrackerData(getQuranTrackerData());
    };
    window.addEventListener('dhikrly:quran-tracker-updated', handleUpdate);
    window.addEventListener('dhikrly:salah-logs-updated', handleUpdate);
    window.addEventListener('dhikrly:adhkar-updated', handleUpdate);
    return () => {
      window.removeEventListener('dhikrly:quran-tracker-updated', handleUpdate);
      window.removeEventListener('dhikrly:salah-logs-updated', handleUpdate);
      window.removeEventListener('dhikrly:adhkar-updated', handleUpdate);
    };
  }, []);

  // Sync latest account data from Supabase if logged in
  useEffect(() => {
    if (!user || !hasSupabaseConfig) return;
    let cancelled = false;

    async function pullAccountData() {
      try {
        const { data: rows, error } = await supabase
          .from('salah_progress')
          .select('date, log')
          .eq('user_id', user!.id)
          .order('date', { ascending: false })
          .limit(365);

        if (!error && rows && rows.length > 0 && !cancelled) {
          const dict: Record<string, DayLog> = {};
          for (const row of rows) {
            if (row.date && row.log && typeof row.log === 'object') {
              dict[row.date] = { ...emptyDay(row.date), ...(row.log as Partial<DayLog>), date: row.date };
            }
          }
          saveAllLogs(dict);
        }
      } catch (err) {
        console.warn('Could not sync insights account data:', err);
      }
    }

    void pullAccountData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const daysCount = parseInt(timeRange, 10);

  // Compute metrics from actual saved salah logs
  const {
    logs,
    trendData,
    prayerStats,
    overallFulfillment,
    jamahCount,
    tahajjudCount,
    fajrOnTimeRate,
    sunnahCount,
    consistencyScore,
    insightsList,
  } = useMemo(() => {
    const rawLogs = getRecentLogs(daysCount);

    let totalScore = 0;
    let totalFardPrayed = 0;
    let totalJamah = 0;
    let totalTahajjud = 0;
    let totalSunnah = 0;
    let fajrOnTime = 0;

    const prayerFrequencies: Record<
      PrayerName,
      { prayed: number; jamah: number; delayed: number; missed: number }
    > = {
      fajr: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
      dhuhr: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
      asr: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
      maghrib: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
      isha: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
    };

    const trend = rawLogs.map((log) => {
      const score = Math.round(computeDayScore(log) * 100);
      totalScore += score;

      const prayersArr = Object.entries(log.prayers ?? {}) as [PrayerName, string | null][];
      let dayFard = 0;
      let dayJamah = 0;

      prayersArr.forEach(([pName, status]) => {
        if (!pName || !prayerFrequencies[pName]) return;
        if (!status || status === 'missed') {
          prayerFrequencies[pName].missed += 1;
        } else {
          dayFard += 1;
          totalFardPrayed += 1;
          if (status === 'jamah') {
            prayerFrequencies[pName].jamah += 1;
            dayJamah += 1;
            totalJamah += 1;
          } else if (status === 'delayed') {
            prayerFrequencies[pName].delayed += 1;
          } else {
            prayerFrequencies[pName].prayed += 1;
          }
        }
      });

      if (log.prayers && isPrayed(log.prayers.fajr)) fajrOnTime += 1;
      if (log.tahajjud?.prayed) totalTahajjud += 1;

      const sunnahDay = Object.values(log.sunnah ?? {}).filter(Boolean).length;
      totalSunnah += sunnahDay;

      const label = formatSafeDate(log.date, {
        month: 'short',
        day: 'numeric',
      }, log.date);

      return {
        date: log.date,
        label,
        score,
        fard: dayFard,
        jamah: dayJamah,
        sunnah: sunnahDay,
      };
    });

    const avgScore = rawLogs.length ? Math.round(totalScore / rawLogs.length) : 0;
    const fajrPct = rawLogs.length ? Math.round((fajrOnTime / rawLogs.length) * 100) : 0;
    const fulfillmentPct = rawLogs.length
      ? Math.round((totalFardPrayed / (rawLogs.length * 5)) * 100)
      : 0;

    const prayerChartData = PRAYERS.map((p) => {
      const st = prayerFrequencies[p];
      const total = rawLogs.length || 1;
      return {
        prayer: PRAYER_LABELS[p],
        prayed: Math.round((st.prayed / total) * 100),
        jamah: Math.round((st.jamah / total) * 100),
        delayed: Math.round((st.delayed / total) * 100),
        missed: Math.round((st.missed / total) * 100),
      };
    });

    const insights = [];
    if (fajrPct >= 70) {
      insights.push({
        id: 'fajr-strong',
        title: 'Fajr Anchor',
        text: `Remarkable Fajr consistency! You prayed Fajr ${fajrPct}% of days in this period.`,
        type: 'positive',
        icon: Sunrise,
      });
    } else {
      insights.push({
        id: 'fajr-tip',
        title: 'Fajr Opportunity',
        text: `Fajr is at ${fajrPct}%. Try setting your alarm with morning Adhkār queued right beside your bed.`,
        type: 'tip',
        icon: Sunrise,
      });
    }

    if (totalJamah >= 5) {
      insights.push({
        id: 'jamah-champion',
        title: 'Jamā‘ah Presence',
        text: `You joined congregation ${totalJamah} times! 27 times greater reward recorded.`,
        type: 'positive',
        icon: Users,
      });
    }

    if (totalTahajjud > 0) {
      insights.push({
        id: 'tahajjud-blessing',
        title: 'Night Vigil (Qiyām)',
        text: `You stood before Allah in the night ${totalTahajjud} times. A rare treasure of tranquility.`,
        type: 'positive',
        icon: MoonStar,
      });
    }

    if (totalSunnah >= 10) {
      insights.push({
        id: 'sunnah-builder',
        title: 'Sunnah Protection',
        text: `Logged ${totalSunnah} Sunnah prayers. The Sunnah acts as a fortress guarding your Farḍ.`,
        type: 'positive',
        icon: Sparkles,
      });
    }

    return {
      logs: rawLogs,
      trendData: trend,
      prayerStats: prayerChartData,
      overallFulfillment: fulfillmentPct,
      jamahCount: totalJamah,
      tahajjudCount: totalTahajjud,
      fajrOnTimeRate: fajrPct,
      sunnahCount: totalSunnah,
      consistencyScore: avgScore,
      insightsList: insights,
    };
  }, [daysCount, dataVersion]);

  // Compute Quran stats
  const quranStats: QuranStats = useMemo(() => {
    return computeQuranStats(quranTrackerData, daysCount);
  }, [quranTrackerData, daysCount]);

  const avgAyahsPerDay = useMemo(() => {
    if (!daysCount) return 0;
    const totalInPeriod = quranStats.dailyTrend.reduce((sum, item) => sum + item.ayahs, 0);
    return Math.round((totalInPeriod / daysCount) * 10) / 10;
  }, [quranStats.dailyTrend, daysCount]);

  // Dynamic Milestones (Combines Salah & Quran)
  const milestones = useMemo(() => {
    const totalFardPrayed = logs.reduce((acc, l) => {
      return (
        acc +
        (Object.values(l.prayers ?? {}).filter((s) => s && s !== 'missed').length || 0)
      );
    }, 0);

    return [
      {
        id: 'm1',
        title: 'First Step in Remembrance',
        desc: 'Logged prayers and dhikr in Dhikrly',
        unlocked: totalFardPrayed > 0,
        icon: HandHeart,
      },
      {
        id: 'm2',
        title: 'Fajr Steadfast',
        desc: 'Maintained over 50% Fajr on-time rate',
        unlocked: fajrOnTimeRate >= 50,
        icon: Sunrise,
      },
      {
        id: 'm3',
        title: 'Congregation Seeker',
        desc: 'Prayed in Jamā‘ah at least 5 times',
        unlocked: jamahCount >= 5,
        icon: Users,
      },
      {
        id: 'm4',
        title: 'Qur’an Reciter',
        desc: 'Logged reading in the Qur’an Tracker',
        unlocked: quranTrackerData.logs.length > 0,
        icon: BookOpen,
      },
      {
        id: 'm5',
        title: 'Offline Reciter (5 Surahs)',
        desc: 'Completed 5 or more Surahs offline or logged',
        unlocked: quranStats.completedSurahsCount >= 5,
        icon: CheckCircle2,
      },
      {
        id: 'm6',
        title: 'Devoted Student (300+ Ayahs)',
        desc: 'Logged reading of over 300 Ayahs of the Holy Qur’an',
        unlocked: quranStats.totalAyahsRead >= 300,
        icon: Sparkles,
      },
      {
        id: 'm7',
        title: 'Juz ‘Amma Explorer (30 Surahs)',
        desc: 'Completed 30 or more Surahs towards Khatm',
        unlocked: quranStats.completedSurahsCount >= 30,
        icon: Award,
      },
      {
        id: 'm8',
        title: 'Night Vigil (Tahajjud)',
        desc: 'Awakened for Tahajjud prayer',
        unlocked: tahajjudCount >= 1,
        icon: MoonStar,
      },
      {
        id: 'm9',
        title: 'Centurion of Worship',
        desc: 'Over 50 total prayers logged',
        unlocked: totalFardPrayed >= 50,
        icon: Trophy,
      },
      {
        id: 'm10',
        title: 'Complete Qur’an Khatm',
        desc: 'Completed all 114 Surahs of the Qur’an',
        unlocked: quranStats.completedSurahsCount === 114,
        icon: Trophy,
      },
    ];
  }, [logs, fajrOnTimeRate, jamahCount, tahajjudCount, quranTrackerData, quranStats]);

  const filteredSurahsList = useMemo(() => {
    if (surahFilter === 'completed') {
      return ALL_SURAHS.filter((s) => quranStats.surahProgressMap[s.number]?.completed);
    }
    if (surahFilter === 'remaining') {
      return ALL_SURAHS.filter((s) => !quranStats.surahProgressMap[s.number]?.completed);
    }
    return ALL_SURAHS;
  }, [surahFilter, quranStats.surahProgressMap]);

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm`;

  const openLogModal = (surahNum = 1) => {
    setQuranModalSurah(surahNum);
    setQuranModalTab('log');
    setQuranModalOpen(true);
  };

  const openChecklistModal = () => {
    setQuranModalTab('checklist');
    setQuranModalOpen(true);
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm('Delete this reading log entry?')) {
      deleteReadingLog(logId);
      setQuranTrackerData(getQuranTrackerData());
    }
  };

  return (
    <AppShell active="insights" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <LineChartIcon className="h-3.5 w-3.5" />
              <span>SPIRITUAL ANALYTICS & QUR’AN TRACKER</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Spiritual Insights
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
              Track consistency, observe daily prayer fulfillment, and track your Qur’an reading progress & Khatm.
            </p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-1.5 self-start md:self-auto shadow-xs">
            {(['7', '30', '90'] as TimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  timeRange === range
                    ? 'bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                    : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                }`}
              >
                {range === '7' ? '7 Days' : range === '30' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--app-line)] pb-3 mb-6 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                : 'text-[var(--app-muted)] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <LineChartIcon className="h-4 w-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quran')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'quran'
                ? 'bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                : 'text-[var(--app-muted)] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Qur’an Tracker & Khatm</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'quran'
                  ? 'bg-emerald-900/40 text-emerald-100 dark:bg-emerald-900 dark:text-emerald-200'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {quranStats.completedSurahsCount}/114
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prayers')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'prayers'
                ? 'bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                : 'text-[var(--app-muted)] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Sunrise className="h-4 w-4" />
            <span>Ṣalāh Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'milestones'
                ? 'bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                : 'text-[var(--app-muted)] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Milestones & Badges</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'milestones'
                  ? 'bg-emerald-900/40 text-emerald-100 dark:bg-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}
            >
              {milestones.filter((m) => m.unlocked).length}/{milestones.length}
            </span>
          </button>
        </div>

        {/* -------------------- TAB 1: OVERVIEW -------------------- */}
        {activeTab === 'overview' && (
          <>
            {/* Qur'an Quick Banner Card */}
            <div className="mb-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-md">
                    <BookOpen className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Qur’an Khatm Progress
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                        {quranStats.khatmProgressPct}% Completed
                      </span>
                    </div>
                    <h3 suppressHydrationWarning className="mt-1 text-lg font-extrabold text-[var(--app-ink)]">
                      {quranStats.completedSurahsCount} of 114 Surahs Completed
                    </h3>
                    <p suppressHydrationWarning className="mt-0.5 text-xs text-[var(--app-muted)]">
                      {quranStats.totalAyahsRead.toLocaleString()} Ayahs read across{' '}
                      {quranTrackerData.logs.length} logged sessions. Syncs safely with Supabase.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => openLogModal(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Log Reading</span>
                  </button>
                  <button
                    type="button"
                    onClick={openChecklistModal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-2.5 text-xs font-bold text-[var(--app-ink)] shadow-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <ListChecks className="h-4 w-4 text-emerald-600" />
                    <span>Offline Surahs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('quran')}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    <span>View Qur’an Graphs</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, quranStats.khatmProgressPct)}%` }}
                />
              </div>
            </div>

            {/* Hero Score Cards Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Consistency Score */}
              <div className={`${cardClass} p-5 flex flex-col justify-between relative overflow-hidden`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Consistency Score
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 dark:text-emerald-300">
                      {consistencyScore}%
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  Average daily completion over {daysCount} days
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${consistencyScore}%` }}
                  />
                </div>
              </div>

              {/* Farḍ Fulfillment */}
              <div className={`${cardClass} p-5 flex flex-col justify-between`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Farḍ Obligatory Prayers
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[var(--app-ink)]">
                      {overallFulfillment}%
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  5 daily prayers prayed on time or in jamā‘ah
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${overallFulfillment}%` }}
                  />
                </div>
              </div>

              {/* Fajr On Time */}
              <div className={`${cardClass} p-5 flex flex-col justify-between`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Fajr Reliability
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-300">
                      {fajrOnTimeRate}%
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  Dawn prayer performed before sunrise
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${fajrOnTimeRate}%` }}
                  />
                </div>
              </div>

              {/* Jamā‘ah & Tahajjud */}
              <div className={`${cardClass} p-5 flex flex-col justify-between`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Jamā‘ah & Night Vigil
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-purple-600 dark:text-purple-300">
                      {jamahCount}
                    </span>
                    <span className="text-xs text-[var(--app-muted)]">
                      in mosque · {tahajjudCount} Tahajjud
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  {sunnahCount} total Sunnah prayers logged
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (jamahCount / (daysCount * 2)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Consistency Area Trend Chart */}
            <section className={`${cardClass} mb-8 p-6`}>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                    Daily Spiritual Consistency Trend
                  </h2>
                  <p className="text-xs text-[var(--app-muted)]">
                    Continuous percentage score across the past {daysCount} days
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Daily Score (%)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={dark ? '#34d399' : '#059669'}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor={dark ? '#34d399' : '#059669'}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                      />
                      <XAxis
                        dataKey="label"
                        stroke={dark ? '#78716c' : '#a8a29e'}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={dark ? '#78716c' : '#a8a29e'}
                        fontSize={11}
                        domain={[0, 100]}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] p-3 shadow-lg">
                              <p className="text-xs font-bold text-[var(--app-ink)]">{data.label}</p>
                              <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                                {data.score}% Spiritual Completion
                              </p>
                              <p className="text-[11px] text-[var(--app-muted)] mt-1">
                                {data.fard}/5 Farḍ · {data.jamah} Jamā‘ah · {data.sunnah} Sunnah
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={dark ? '#34d399' : '#059669'}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#scoreGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
                )}
              </div>
            </section>
          </>
        )}

        {/* -------------------- TAB 2: QUR’AN TRACKER -------------------- */}
        {activeTab === 'quran' && (
          <div className="space-y-8">
            {/* Quran Hero Dashboard Card */}
            <section className={`${cardClass} p-6 relative overflow-hidden`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>KHATM OF THE HOLY QUR’AN</span>
                  </div>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--app-ink)]">
                    Qur’an Journey & Reading Tracker
                  </h2>
                  <p className="mt-1 text-xs text-[var(--app-muted)] max-w-xl">
                    Log reading sessions with exact Surahs and Ayahs range, mark offline read Surahs,
                    and watch your completion climb towards the full 114 Surahs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openLogModal(1)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Log Reading Session</span>
                  </button>
                  <button
                    type="button"
                    onClick={openChecklistModal}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-5 py-3 text-xs font-bold text-[var(--app-ink)] shadow-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <ListChecks className="h-4 w-4 text-emerald-600" />
                    <span>Check Offline Surahs</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[var(--app-line)] pt-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Khatm Completed
                  </span>
                  <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {quranStats.khatmProgressPct}%
                  </div>
                  <p className="text-[11px] text-[var(--app-muted)]">
                    {quranStats.completedSurahsCount} of 114 Surahs
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Total Ayahs Read
                  </span>
                  <div suppressHydrationWarning className="mt-1 text-2xl sm:text-3xl font-extrabold text-[var(--app-ink)]">
                    {quranStats.totalAyahsRead.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-[var(--app-muted)]">
                    out of 6,236 Ayahs
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Daily Pace
                  </span>
                  <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-300">
                    {avgAyahsPerDay}
                  </div>
                  <p className="text-[11px] text-[var(--app-muted)]">Ayahs / day in {daysCount}d</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Surahs Remaining
                  </span>
                  <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-300">
                    {114 - quranStats.completedSurahsCount}
                  </div>
                  <p className="text-[11px] text-[var(--app-muted)]">to complete Khatm</p>
                </div>
              </div>

              {/* Progress Bar with markers */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-[var(--app-muted)] mb-1.5 font-medium">
                  <span>Al-Fātihah (Surah 1)</span>
                  <span className="font-bold text-[var(--app-ink)]">
                    {quranStats.completedSurahsCount}/114 Surahs
                  </span>
                  <span>An-Nās (Surah 114)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(1, quranStats.khatmProgressPct)}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Daily Ayahs Read Chart */}
            <section className={`${cardClass} p-6`}>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--app-ink)]">
                    Daily Ayahs Read ({daysCount} Days)
                  </h3>
                  <p className="text-xs text-[var(--app-muted)]">
                    Volume of Qur’an recitation logged per day
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Ayahs Recited</span>
                </div>
              </div>

              <div className="h-64 w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={quranStats.dailyTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={dark ? '#78716c' : '#a8a29e'}
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) =>
                          formatSafeDate(String(val), { month: 'short', day: 'numeric' }, String(val))
                        }
                      />
                      <YAxis
                        stroke={dark ? '#78716c' : '#a8a29e'}
                        fontSize={11}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          const dateLabel = formatSafeDate(d?.date, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          });
                          return (
                            <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] p-3 shadow-lg">
                              <p className="text-xs font-bold text-[var(--app-ink)]">
                                {dateLabel}
                              </p>
                              <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                                {d.ayahs} Ayahs Read
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="ayahs"
                        fill={dark ? '#34d399' : '#059669'}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
                )}
              </div>
            </section>

            {/* Visual 114 Surahs Grid */}
            <section className={`${cardClass} p-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--app-ink)]">
                    All 114 Surahs Grid
                  </h3>
                  <p className="text-xs text-[var(--app-muted)]">
                    Click any Surah to quickly log reading or toggle completion status.
                  </p>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-1">
                  <button
                    type="button"
                    onClick={() => setSurahFilter('all')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      surahFilter === 'all'
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    All (114)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurahFilter('completed')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      surahFilter === 'completed'
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    Completed ({quranStats.completedSurahsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurahFilter('remaining')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      surahFilter === 'remaining'
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    Remaining ({114 - quranStats.completedSurahsCount})
                  </button>
                </div>
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[480px] overflow-y-auto p-1 pr-2">
                {filteredSurahsList.map((surah) => {
                  const status = quranStats.surahProgressMap[surah.number];
                  const isCompleted = status?.completed;

                  return (
                    <button
                      key={surah.number}
                      type="button"
                      onClick={() => openLogModal(surah.number)}
                      title={`Click to log reading for Surah ${surah.englishName}`}
                      className={`group relative flex flex-col justify-between p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                        isCompleted
                          ? 'border-emerald-500/40 bg-emerald-500/10 shadow-xs'
                          : 'border-[var(--app-line)] bg-black/5 dark:bg-white/5 hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-lg text-[10px] font-extrabold ${
                            isCompleted
                              ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                              : 'bg-black/10 dark:bg-white/10 text-[var(--app-ink)]'
                          }`}
                        >
                          {surah.number}
                        </span>
                        {isCompleted ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--app-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                            Log +
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <p className="text-xs font-bold text-[var(--app-ink)] truncate">
                          {surah.englishName}
                        </p>
                        <p className="text-[10px] text-[var(--app-muted)] truncate font-arabic">
                          {surah.name} · {surah.numberOfAyahs}a
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Reading Sessions History */}
            <section className={`${cardClass} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--app-ink)]">
                    Recent Reading Logs
                  </h3>
                  <p className="text-xs text-[var(--app-muted)]">
                    Detailed record of your recitation entries
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openLogModal(1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-line)] px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Entry</span>
                </button>
              </div>

              {quranTrackerData.logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--app-line)] p-8 text-center">
                  <BookOpen className="h-8 w-8 mx-auto text-[var(--app-muted)] opacity-40 mb-2" />
                  <p className="text-sm font-bold text-[var(--app-ink)]">No reading logs yet</p>
                  <p className="text-xs text-[var(--app-muted)] mt-1 max-w-sm mx-auto">
                    Start recording your daily Qur’an recitation, or mark Surahs you already read offline.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => openLogModal(1)}
                      className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white dark:bg-emerald-400 dark:text-emerald-950"
                    >
                      Log First Session
                    </button>
                    <button
                      type="button"
                      onClick={openChecklistModal}
                      className="rounded-xl border border-[var(--app-line)] px-4 py-2 text-xs font-bold text-[var(--app-ink)]"
                    >
                      Check Offline Surahs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {quranTrackerData.logs.slice(0, 30).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 hover:border-emerald-500/20 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                          {log.surahNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-[var(--app-ink)] truncate">
                              {log.surahName}
                            </strong>
                            <span className="text-[11px] text-[var(--app-muted)] font-arabic">
                              {log.surahArabicName}
                            </span>
                            {log.isCompletedSurah && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                                Full Surah
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--app-muted)] mt-0.5">
                            Ayahs {log.fromAyah} - {log.toAyah} ({log.ayahsCount} Ayahs) ·{' '}
                            {log.date}
                            {log.notes ? ` · “${log.notes}”` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        title="Delete reading log"
                        className="p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* -------------------- TAB 3: SALAH ANALYTICS -------------------- */}
        {activeTab === 'prayers' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Stacked Breakdown by Prayer */}
              <section className={`${cardClass} p-6 flex flex-col justify-between`}>
                <div>
                  <h2 className="text-base font-extrabold text-[var(--app-ink)] mb-1">
                    Prayer-by-Prayer Fulfillment
                  </h2>
                  <p className="text-xs text-[var(--app-muted)] mb-4">
                    Percentage breakdown of each Farḍ prayer over the selected period
                  </p>

                  <div className="h-60 w-full">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prayerStats}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                          />
                          <XAxis
                            dataKey="prayer"
                            stroke={dark ? '#78716c' : '#a8a29e'}
                            fontSize={11}
                            tickLine={false}
                          />
                          <YAxis
                            stroke={dark ? '#78716c' : '#a8a29e'}
                            fontSize={11}
                            domain={[0, 100]}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] p-3 shadow-lg">
                                  <p className="text-xs font-bold text-[var(--app-ink)]">
                                    {d.prayer}
                                  </p>
                                  <p className="text-xs text-emerald-600 font-semibold">
                                    Prayed: {d.prayed}%
                                  </p>
                                  <p className="text-xs text-purple-600 font-semibold">
                                    Jamā‘ah: {d.jamah}%
                                  </p>
                                  <p className="text-xs text-amber-600 font-semibold">
                                    Delayed: {d.delayed}%
                                  </p>
                                  <p className="text-xs text-red-500 font-semibold">
                                    Missed: {d.missed}%
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            formatter={(val) => (
                              <span className="text-xs font-medium capitalize">{val}</span>
                            )}
                          />
                          <Bar
                            dataKey="jamah"
                            stackId="a"
                            fill="#8b5cf6"
                            name="Jamā‘ah"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="prayed"
                            stackId="a"
                            fill="#10b981"
                            name="Prayed"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="delayed"
                            stackId="a"
                            fill="#f59e0b"
                            name="Delayed"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="missed"
                            stackId="a"
                            fill="#ef4444"
                            name="Missed"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--app-line)] flex items-center justify-between text-xs text-[var(--app-muted)]">
                  <span>Goal: 100% Farḍ fulfillment</span>
                  <Link
                    href="/salah"
                    className="font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    Update today’s Ṣalāh →
                  </Link>
                </div>
              </section>

              {/* Actionable Spiritual Insights */}
              <section className={`${cardClass} p-6 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                      Personalized Spiritual Guidance
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--app-muted)] mb-4">
                    Tailored reflections generated directly from your practice records
                  </p>

                  <div className="space-y-3">
                    {insightsList.length > 0 ? (
                      insightsList.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3.5 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-4"
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                              <ItemIcon className="h-4 w-4" />
                            </span>
                            <div>
                              <h3 className="text-xs font-bold text-[var(--app-ink)]">
                                {item.title}
                              </h3>
                              <p className="mt-0.5 text-xs text-[var(--app-muted)] leading-relaxed">
                                {item.text}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--app-line)] p-6 text-center text-xs text-[var(--app-muted)]">
                        Begin logging your prayers on the Ṣalāh tracker to unlock personalized
                        insights and trend analysis.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--app-line)] flex items-center justify-between text-xs text-[var(--app-muted)]">
                  <span>“The most beloved deeds to Allah are those done regularly, even if small.”</span>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* -------------------- TAB 4: MILESTONES & BADGES -------------------- */}
        {activeTab === 'milestones' && (
          <section className={`${cardClass} p-6 mb-8`}>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-extrabold text-[var(--app-ink)]">
                  Spiritual Milestones & Badges
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Celebrate consistency in Ṣalāh, Adhkār, and Qur’an recitation on your journey of worship.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {milestones.filter((m) => m.unlocked).length} / {milestones.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {milestones.map((m) => {
                const MilestoneIcon = m.icon;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                      m.unlocked
                        ? 'border-emerald-500/30 bg-emerald-500/10 shadow-xs'
                        : 'border-[var(--app-line)] opacity-50 bg-black/5 dark:bg-white/5'
                    }`}
                  >
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl mb-3 ${
                        m.unlocked
                          ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-md'
                          : 'bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      <MilestoneIcon className="h-6 w-6" />
                    </span>
                    <strong className="text-xs font-bold text-[var(--app-ink)]">{m.title}</strong>
                    <span className="mt-1 text-[11px] text-[var(--app-muted)] leading-tight">
                      {m.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quran Tracker Modal */}
        <QuranTrackerModal
          dark={dark}
          isOpen={quranModalOpen}
          onClose={() => setQuranModalOpen(false)}
          onSaved={() => setQuranTrackerData(getQuranTrackerData())}
          initialSurahNumber={quranModalSurah}
          initialTab={quranModalTab}
        />
      </div>
    </AppShell>
  );
}
