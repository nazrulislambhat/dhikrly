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
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Flame,
  HandHeart,
  HeartHandshake,
  Lightbulb,
  LineChart as LineChartIcon,
  MoonStar,
  Sparkles,
  Sunrise,
  Trophy,
  Users,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { computeDayScore, getRecentLogs, isPrayed } from '@/lib/salahStorage';
import type { DayLog, PrayerName, WeekBar } from '@/types/salah';
import { PRAYERS, PRAYER_LABELS } from '@/types/salah';

type TimeRange = '7' | '30' | '90';

export default function InsightsPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [activeTab, setActiveTab] = useState<'overview' | 'prayers' | 'habits'>('overview');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

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
    milestones,
  } = useMemo(() => {
    const rawLogs = getRecentLogs(daysCount);

    // Consistency score (0 - 100)
    let totalScore = 0;
    let totalFardPrayed = 0;
    let totalJamah = 0;
    let totalTahajjud = 0;
    let totalSunnah = 0;
    let fajrOnTime = 0;

    const prayerFrequencies: Record<PrayerName, { prayed: number; jamah: number; delayed: number; missed: number }> = {
      fajr: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
      dhuhr: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
      asr: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
      maghrib: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
      isha: { prayed: 0, jamah: 0, delayed: 0, missed: 0 },
    };

    const trend = rawLogs.map((log) => {
      const score = Math.round(computeDayScore(log) * 100);
      totalScore += score;

      const prayersArr = Object.entries(log.prayers) as [PrayerName, string | null][];
      let dayFard = 0;
      let dayJamah = 0;

      prayersArr.forEach(([pName, status]) => {
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

      if (isPrayed(log.prayers.fajr)) fajrOnTime += 1;
      if (log.tahajjud?.prayed) totalTahajjud += 1;

      const sunnahDay = Object.values(log.sunnah ?? {}).filter(Boolean).length;
      totalSunnah += sunnahDay;

      const dateObj = new Date(`${log.date}T12:00:00`);
      return {
        date: log.date,
        label: dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        score,
        fard: dayFard,
        jamah: dayJamah,
        sunnah: sunnahDay,
      };
    });

    const avgScore = rawLogs.length ? Math.round(totalScore / rawLogs.length) : 0;
    const fajrPct = rawLogs.length ? Math.round((fajrOnTime / rawLogs.length) * 100) : 0;
    const fulfillmentPct = rawLogs.length ? Math.round((totalFardPrayed / (rawLogs.length * 5)) * 100) : 0;

    // Structured breakdown for each prayer
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

    // Dynamic personalized insights
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

    // Milestones
    const achievements = [
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
        unlocked: fajrPct >= 50,
        icon: Sunrise,
      },
      {
        id: 'm3',
        title: 'Congregation Seeker',
        desc: 'Prayed in Jamā‘ah at least 5 times',
        unlocked: totalJamah >= 5,
        icon: Users,
      },
      {
        id: 'm4',
        title: 'Night Vigil (Tahajjud)',
        desc: 'Awakened for Tahajjud prayer',
        unlocked: totalTahajjud >= 1,
        icon: MoonStar,
      },
      {
        id: 'm5',
        title: 'Centurion of Worship',
        desc: 'Over 50 total prayers logged',
        unlocked: totalFardPrayed >= 50,
        icon: Trophy,
      },
    ];

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
      milestones: achievements,
    };
  }, [daysCount]);

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm dark:bg-[#14211e]`;
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <AppShell active="insights" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <LineChartIcon className="h-3.5 w-3.5" />
              <span>SPIRITUAL ANALYTICS & HABITS</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Spiritual Insights
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
              Track consistency, observe daily prayer fulfillment, and cultivate enduring Islamic habits for the sake of Allah.
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
                style={{ width: `${Math.min(100, (jamahCount / (daysCount * 2)) * 100)}%` }}
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={dark ? '#34d399' : '#059669'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={dark ? '#34d399' : '#059669'} stopOpacity={0} />
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
                      <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] p-3 shadow-lg dark:bg-[#14211e]">
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
          </div>
        </section>

        {/* Prayer-by-Prayer Breakdown & Smart Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prayerStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                          <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] p-3 shadow-lg dark:bg-[#14211e]">
                            <p className="text-xs font-bold text-[var(--app-ink)]">{d.prayer}</p>
                            <p className="text-xs text-emerald-600 font-semibold">Prayed: {d.prayed}%</p>
                            <p className="text-xs text-purple-600 font-semibold">Jamā‘ah: {d.jamah}%</p>
                            <p className="text-xs text-amber-600 font-semibold">Delayed: {d.delayed}%</p>
                            <p className="text-xs text-red-500 font-semibold">Missed: {d.missed}%</p>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs font-medium capitalize">{val}</span>}
                    />
                    <Bar dataKey="jamah" stackId="a" fill="#8b5cf6" name="Jamā‘ah" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="prayed" stackId="a" fill="#10b981" name="Prayed" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="delayed" stackId="a" fill="#f59e0b" name="Delayed" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="missed" stackId="a" fill="#ef4444" name="Missed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--app-line)] flex items-center justify-between text-xs text-[var(--app-muted)]">
              <span>Goal: 100% Farḍ fulfillment</span>
              <Link href="/salah" className="font-bold text-emerald-700 dark:text-emerald-300 hover:underline">
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
                          <h3 className="text-xs font-bold text-[var(--app-ink)]">{item.title}</h3>
                          <p className="mt-0.5 text-xs text-[var(--app-muted)] leading-relaxed">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--app-line)] p-6 text-center text-xs text-[var(--app-muted)]">
                    Begin logging your prayers on the Ṣalāh tracker to unlock personalized insights and trend analysis.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--app-line)] flex items-center justify-between text-xs text-[var(--app-muted)]">
              <span>“The most beloved deeds to Allah are those done regularly, even if small.”</span>
            </div>
          </section>
        </div>

        {/* Milestones & Badges */}
        <section className={`${cardClass} p-6 mb-8`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                Spiritual Milestones & Badges
              </h2>
              <p className="text-xs text-[var(--app-muted)]">
                Celebrate consistency on your journey of worship
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {milestones.filter((m) => m.unlocked).length} / {milestones.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
      </div>
    </AppShell>
  );
}
