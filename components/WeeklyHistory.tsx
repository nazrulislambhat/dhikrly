'use client';

import { useMemo } from 'react';
import { load, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import type { HistoryDay } from '@/types';

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
  const today = getTodayKey();

  const history: HistoryDay[] = useMemo(() => {
    const allData = load<Record<string, Record<string, boolean>>>(
      STORAGE_KEY,
      {}
    );
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
  }, [today, total]);

  const card = dark
    ? 'bg-white/[0.04] border-white/[0.07]'
    : 'bg-white border-black/[0.07] shadow-sm';

  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <p
        className={`mb-3 text-[10px] uppercase tracking-widest ${
          dark ? 'text-stone-600' : 'text-stone-400'
        }`}
      >
        7-day history · best streak {streakBest}d
      </p>
      <div className="flex h-12 items-end gap-1.5">
        {history.map((h: HistoryDay) => (
          <div
            key={h.key}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className={`w-full rounded-sm transition-all duration-300 ${
                h.isToday
                  ? h.pct === 100
                    ? 'bg-emerald-500'
                    : 'bg-amber-400'
                  : h.pct === 100
                    ? dark
                      ? 'bg-emerald-600/50'
                      : 'bg-emerald-400/40'
                    : dark
                      ? 'bg-white/[0.08]'
                      : 'bg-black/[0.07]'
              }`}
              style={{ height: `${Math.max(4, (h.pct / 100) * 36)}px` }}
            />
            <span
              className={`text-[8px] ${
                h.isToday
                  ? dark
                    ? 'text-amber-400'
                    : 'text-amber-600'
                  : dark
                    ? 'text-stone-700'
                    : 'text-stone-400'
              }`}
            >
              {h.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
