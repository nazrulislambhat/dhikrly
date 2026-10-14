'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartColumnIncreasing,
  HandHeart,
  Lightbulb,
  MoonStar,
  Sunrise,
  TrendingUp,
} from 'lucide-react';
import { getRecentLogs, computeDayScore, isPrayed } from '@/lib/salahStorage';
import type { WeekBar } from '@/types/salah';

interface InsightsDashboardProps { dark: boolean; }

export default function InsightsDashboard({ dark }: InsightsDashboardProps) {
  const { weekBars, monthTrend, insights, stats } = useMemo(() => {
    const logs30 = getRecentLogs(30);
    const logs7  = getRecentLogs(7);

    // Week bars
    const weekBars: WeekBar[] = logs7.map(log => {
      const prayers = Object.values(log.prayers);
      const fard = prayers.filter(p => isPrayed(p)).length;
      const jamah = prayers.filter(p => p === 'jamah').length;
      const sunnah = Object.values(log.sunnah).filter(Boolean).length;
      const d = new Date(log.date + 'T12:00:00');
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: log.date,
        fard, sunnah, jamah,
      };
    });
    const monthTrend = logs30.map((log) => ({
      label: new Date(`${log.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.round(computeDayScore(log) * 100),
    }));

    // Stats
    const avg30 = logs30.reduce((s, l) => s + computeDayScore(l), 0) / 30;
    const avg7  = logs7.reduce((s, l) => s + computeDayScore(l), 0) / 7;
    const perfect30 = logs30.filter(l => computeDayScore(l) === 1).length;

    const fajrOnTime30 = logs30.filter(l => isPrayed(l.prayers.fajr)).length;

    const tahajjudDays = logs30.filter(l => l.tahajjud.prayed).length;

    // Fajr rate this vs last week
    const fajrThisWeek = logs7.filter(l => isPrayed(l.prayers.fajr)).length;
    const prevWeek = getRecentLogs(14).slice(0, 7);
    const fajrLastWeek = prevWeek.filter(l => isPrayed(l.prayers.fajr)).length;

    const insights = [];

    if (fajrOnTime30 > 0) {
      const pct = Math.round((fajrOnTime30 / 30) * 100);
      insights.push({
        id: 'fajr',
        Icon: Sunrise,
        text: `You prayed Fajr on time ${pct}% of the past 30 days`,
        type: pct >= 70 ? 'positive' : pct >= 40 ? 'neutral' : 'tip',
      });
    }

    if (fajrThisWeek > fajrLastWeek) {
      insights.push({
        id: 'fajr-trend',
        Icon: TrendingUp,
        text: `Fajr consistency improved this week (${fajrThisWeek}/7 vs ${fajrLastWeek}/7 last week)`,
        type: 'positive',
      });
    }

    if (tahajjudDays > 0) {
      insights.push({
        id: 'tahajjud',
        Icon: MoonStar,
        text: `You prayed Tahajjud ${tahajjudDays} night${tahajjudDays > 1 ? 's' : ''} this month`,
        type: 'positive',
      });
    } else {
      insights.push({
        id: 'tahajjud-tip',
        Icon: Lightbulb,
        text: "Try Tahajjud tonight — it starts in the last third of the night",
        type: 'tip',
      });
    }

    if (avg7 < avg30 * 0.85) {
      insights.push({
        id: 'trend-down',
        Icon: HandHeart,
        text: "Your prayer rate dipped this week — let's get back on track",
        type: 'tip',
      });
    }

    if (perfect30 > 0) {
      insights.push({
        id: 'perfect',
        Icon: ChartColumnIncreasing,
        text: `${perfect30} perfect day${perfect30 > 1 ? 's' : ''} this month — all 5 prayers completed`,
        type: 'positive',
      });
    }

    return {
      weekBars,
      monthTrend,
      insights,
      stats: { avg30, avg7, perfect30, fajrOnTime30 },
    };
  }, []);

  const card = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-[var(--app-line)] shadow-sm';
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '30d avg',  value: `${Math.round(stats.avg30 * 100)}%`, accent: dark ? 'text-emerald-300' : 'text-emerald-800' },
          { label: 'This week', value: `${Math.round(stats.avg7 * 100)}%`, accent: dark ? 'text-emerald-400' : 'text-emerald-600' },
          { label: 'Perfect days', value: stats.perfect30, accent: dark ? 'text-violet-400' : 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border px-3 py-4 text-center ${card}`}>
            <div className={`text-xl font-light leading-none ${s.accent}`}>{s.value}</div>
            <div className={`mt-1 text-[9px] uppercase tracking-widest ${muted}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className={`rounded-2xl border p-4 sm:p-5 ${card}`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">This week</h2>
            <p className={`mt-1 text-xs ${muted}`}>Daily prayers completed</p>
          </div>
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${dark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-800'}`} aria-hidden="true">
            <ChartColumnIncreasing className="h-4 w-4" />
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekBars} barGap={2} barCategoryGap="20%">
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: dark ? '#a8b8ae' : '#71827c' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} hide />
            <Tooltip
              contentStyle={{
                background: dark ? '#14211e' : '#fff',
                border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e7ece8',
                borderRadius: 12,
                fontSize: 11,
                color: dark ? '#edf6f2' : '#14221e',
              }}
              cursor={{ fill: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="fard" name="Fard" maxBarSize={24} radius={[4, 4, 0, 0]}>
              {weekBars.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.fard === 5
                      ? '#10b981'
                      : entry.fard >= 3
                        ? '#8bbf9c'
                        : dark ? 'rgba(255,255,255,0.12)' : '#e7ece8'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`rounded-2xl border p-4 sm:p-5 ${card}`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Prayer rhythm</h2>
            <p className={`mt-1 text-xs ${muted}`}>Consistency across the last 30 days</p>
          </div>
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${dark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-800'}`} aria-hidden="true">
            <TrendingUp className="h-4 w-4" />
          </span>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={monthTrend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="prayerTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dark ? '#74c69d' : '#287750'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={dark ? '#74c69d' : '#287750'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={dark ? '#ffffff12' : '#e7ece8'} strokeDasharray="4 5" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: dark ? '#a8b8ae' : '#71827c' }} axisLine={false} tickLine={false} interval={6} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: dark ? '#a8b8ae' : '#71827c' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Prayers completed']}
              contentStyle={{ background: dark ? '#14211e' : '#fff', border: `1px solid ${dark ? '#ffffff20' : '#e7ece8'}`, borderRadius: 12, fontSize: 11 }}
            />
            <Area type="monotone" dataKey="score" stroke={dark ? '#74c69d' : '#287750'} strokeWidth={2.5} fill="url(#prayerTrendFill)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className={`rounded-2xl border p-4 ${card}`}>
        <p className={`mb-3 text-[10px] uppercase tracking-widest ${muted}`}>Insights</p>
        <div className="space-y-2.5">
          {insights.map(ins => (
            <div key={ins.id} className={`flex gap-3 rounded-xl border px-3 py-2.5 ${
              ins.type === 'positive'
                ? dark ? 'border-emerald-500/20 bg-emerald-500/[0.07]' : 'border-emerald-200/60 bg-emerald-50/60'
                : ins.type === 'tip'
                  ? dark ? 'border-amber-400/20 bg-amber-400/[0.07]' : 'border-amber-200/60 bg-amber-50/60'
                  : dark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-stone-100 bg-stone-50'
            }`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${ins.type === 'positive' ? 'bg-emerald-700/10 text-emerald-800 dark:text-emerald-200' : ins.type === 'tip' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-200' : 'bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-300'}`}>
                <ins.Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className={`text-[12px] leading-relaxed ${dark ? 'text-stone-300' : 'text-stone-600'}`}>
                {ins.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
