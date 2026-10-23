'use client';

import { useEffect, useMemo, useState } from 'react';
import { load, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import type { HistoryDay } from '@/types';
import { Calendar, Flame } from 'lucide-react';

interface WeeklyHistoryProps {
  dark: boolean;
  total: number;
  streakBest: number;
}

export default function WeeklyHistory({
  dark,
  total,
  streakBest,
}: WeeklyHistoryProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const today = getTodayKey();

  const [dataVersion, setDataVersion] = useState(0);
  useEffect(() => {
    const onUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener('dhikrly:adhkar-updated', onUpdate);
    return () => window.removeEventListener('dhikrly:adhkar-updated', onUpdate);
  }, []);

  const history: HistoryDay[] = useMemo(() => {
    const allData = mounted
      ? load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {})
      : {};
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      const cnt = Object.values(allData[key] ?? {}).filter(Boolean).length;
      return {
        key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        pct: total > 0 ? Math.round((cnt / total) * 100) : 0,
        isToday: key === today,
      };
    });
  }, [mounted, today, total, dataVersion]);

  return (
    <div
      className={`rounded-2xl border p-4.5 transition-all duration-200 ${
        dark
          ? 'border-white/[0.08] bg-[#111e1a]/90 backdrop-blur-md'
          : 'border-stone-200/90 bg-white shadow-xs'
      }`}
      suppressHydrationWarning
    >
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--app-ink)]">
          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Weekly Consistency</span>
        </div>
        <div
          suppressHydrationWarning
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10"
        >
          <Flame className="h-3 w-3" />
          <span>Best: {mounted ? streakBest : 0}d</span>
        </div>
      </div>

      <div className="flex h-16 items-end gap-2 pt-2">
        {history.map((h: HistoryDay) => (
          <div
            key={h.key}
            className="group relative flex flex-1 flex-col items-center gap-1.5"
            title={`${h.label}: ${h.pct}% completed`}
          >
            {/* Tooltip on hover */}
            <div className="absolute -top-7 hidden group-hover:flex items-center justify-center rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-1.5 py-0.5 text-[9px] font-bold shadow-md z-10 whitespace-nowrap">
              {h.pct}%
            </div>

            {/* Bar track and fill */}
            <div
              className={`w-full rounded-full overflow-hidden transition-all duration-300 relative ${
                dark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'
              }`}
              style={{ height: '42px' }}
            >
              <div
                className={`w-full absolute bottom-0 rounded-full transition-all duration-500 ${
                  h.pct === 100
                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                    : h.pct > 0
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                      : 'bg-transparent'
                }`}
                style={{ height: `${Math.max(h.pct > 0 ? 6 : 0, (h.pct / 100) * 42)}px` }}
              />
            </div>

            {/* Day Label */}
            <span
              className={`text-[10px] font-semibold tracking-tight transition-colors ${
                h.isToday
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : dark
                    ? 'text-stone-400'
                    : 'text-stone-500'
              }`}
            >
              {h.isToday ? 'Today' : h.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
