'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getRecentLogs, computeDayScore, isPrayed } from '@/lib/salahStorage';
import type { WeekBar } from '@/types/salah';

interface InsightsDashboardProps { dark: boolean; }

export default function InsightsDashboard({ dark }: InsightsDashboardProps) {
  const { weekBars, insights, stats } = useMemo(() => {
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
        icon: '🌅',
        text: `You prayed Fajr on time ${pct}% of the past 30 days`,
        type: pct >= 70 ? 'positive' : pct >= 40 ? 'neutral' : 'tip',
      });
    }

    if (fajrThisWeek > fajrLastWeek) {
      insights.push({
        id: 'fajr-trend',
        icon: '📈',
        text: `Fajr consistency improved this week (${fajrThisWeek}/7 vs ${fajrLastWeek}/7 last week)`,
        type: 'positive',
      });
    }

    if (tahajjudDays > 0) {
      insights.push({
        id: 'tahajjud',
        icon: '🌙',
        text: `You prayed Tahajjud ${tahajjudDays} night${tahajjudDays > 1 ? 's' : ''} this month`,
        type: 'positive',
      });
    } else {
      insights.push({
        id: 'tahajjud-tip',
        icon: '💡',
        text: "Try Tahajjud tonight — it starts in the last third of the night",
        type: 'tip',
      });
    }

    if (avg7 < avg30 * 0.85) {
      insights.push({
        id: 'trend-down',
        icon: '🤲',
        text: "Your prayer rate dipped this week — let's get back on track",
        type: 'tip',
      });
    }

    if (perfect30 > 0) {
      insights.push({
        id: 'perfect',
        icon: '⭐',
        text: `${perfect30} perfect day${perfect30 > 1 ? 's' : ''} this month — all 5 prayers completed`,
        type: 'positive',
      });
    }

    return {
      weekBars,
      insights,
      stats: { avg30, avg7, perfect30, fajrOnTime30 },
    };
  }, []);

  const card = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-stone-200 shadow-sm';
  const muted = dark ? 'text-stone-600' : 'text-stone-400';

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '30d avg',  value: `${Math.round(stats.avg30 * 100)}%`, accent: dark ? 'text-amber-400' : 'text-amber-600' },
          { label: 'This week', value: `${Math.round(stats.avg7 * 100)}%`, accent: dark ? 'text-emerald-400' : 'text-emerald-600' },
          { label: 'Perfect days', value: stats.perfect30, accent: dark ? 'text-violet-400' : 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-3 py-3 text-center ${card}`}>
            <div className={`text-xl font-light leading-none ${s.accent}`}>{s.value}</div>
            <div className={`mt-1 text-[9px] uppercase tracking-widest ${muted}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className={`rounded-2xl border p-4 ${card}`}>
        <p className={`mb-3 text-[10px] uppercase tracking-widest ${muted}`}>This week</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weekBars} barGap={2} barCategoryGap="20%">
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: dark ? '#78716c' : '#a8a29e' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} hide />
            <Tooltip
              contentStyle={{
                background: dark ? '#1c2a3a' : '#fff',
                border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e7e5e4',
                borderRadius: 10,
                fontSize: 11,
                color: dark ? '#d6d3d1' : '#44403c',
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
                        ? '#f59e0b'
                        : dark ? 'rgba(255,255,255,0.1)' : '#e7e5e4'
                  }
                />
              ))}
            </Bar>
          </BarChart>
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
              <span className="text-base">{ins.icon}</span>
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
