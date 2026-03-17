'use client';

import { useMemo, useState } from 'react';
import { load, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import type { HeatmapCell } from '@/types';

interface StreakHeatmapProps {
  dark: boolean;
  total: number;
}

const WEEKS = 16;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StreakHeatmap({ dark, total }: StreakHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    key: string;
    pct: number;
    cnt: number;
  } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const allData = load<Record<string, Record<string, boolean>>>(
      STORAGE_KEY,
      {},
    );
    const todayKey = getTodayKey();
    const todayDate = new Date();

    // Start from (WEEKS*7) days ago
    const startDate = new Date(todayDate);
    startDate.setDate(startDate.getDate() - WEEKS * 7 + 1);

    const cells: HeatmapCell[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const dayData = allData[key] ?? {};
      const cnt = Object.values(dayData).filter(Boolean).length;
      const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
      cells.push({
        key,
        date: d,
        pct,
        isToday: key === todayKey,
        isFuture: d > todayDate,
      });
    }

    // Group into weeks (columns)
    const weekGroups: HeatmapCell[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      weekGroups.push(cells.slice(w * 7, w * 7 + 7));
    }

    // Month label positions
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weekGroups.forEach((week, col) => {
      const month = week[0].date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: week[0].date.toLocaleDateString('en-US', { month: 'short' }),
          col,
        });
        lastMonth = month;
      }
    });

    return { weeks: weekGroups, monthLabels: labels };
  }, [total]);

  const getCellColor = (cell: HeatmapCell) => {
    if (cell.isFuture) {
      return dark ? 'bg-stone-800/40' : 'bg-stone-100/80';
    }
    if (cell.pct === 0) {
      return dark ? 'bg-stone-800' : 'bg-stone-100';
    }
    if (cell.pct < 40) {
      return dark ? 'bg-amber-900/60' : 'bg-amber-100';
    }
    if (cell.pct < 70) {
      return dark ? 'bg-amber-600/50' : 'bg-amber-300';
    }
    if (cell.pct < 100) {
      return dark ? 'bg-emerald-700/60' : 'bg-emerald-300';
    }
    return dark ? 'bg-emerald-500' : 'bg-emerald-500';
  };

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
        Completion heatmap · last {WEEKS} weeks
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[340px]">
          {/* Month labels */}
          <div className="mb-1 flex pl-8">
            {weeks.map((_, col) => {
              const label = monthLabels.find((m) => m.col === col);
              return (
                <div
                  key={col}
                  className={`flex-1 text-[8px] ${
                    dark ? 'text-stone-600' : 'text-stone-400'
                  }`}
                >
                  {label?.label ?? ''}
                </div>
              );
            })}
          </div>

          {/* Grid: 7 rows × WEEKS columns */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="mr-1.5 flex w-6 flex-col gap-0.5">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  className={`flex h-3 items-center justify-end text-[7px] ${
                    dark ? 'text-stone-700' : 'text-stone-300'
                  } ${i % 2 === 0 ? 'opacity-0' : ''}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Columns */}
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-1 flex-col gap-0.5">
                {week.map((cell) => (
                  <div
                    key={cell.key}
                    className={`relative h-3 w-full cursor-pointer rounded-[2px] transition-all duration-150 hover:scale-125 hover:z-10 ${getCellColor(
                      cell,
                    )} ${
                      cell.isToday
                        ? 'ring-1 ring-amber-400 ring-offset-1 ' +
                          (dark ? 'ring-offset-[#0c1a2e]' : 'ring-offset-white')
                        : ''
                    }`}
                    onMouseEnter={() =>
                      setTooltip({
                        key: cell.key,
                        pct: cell.pct,
                        cnt: Math.round((cell.pct / 100) * total),
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className={`mt-2 rounded-lg border px-3 py-2 text-[10px] ${
                dark
                  ? 'border-white/10 bg-white/5 text-stone-300'
                  : 'border-black/10 bg-stone-50 text-stone-600'
              }`}
            >
              <span className="font-medium">{tooltip.key}</span>
              {' · '}
              {tooltip.pct === 0
                ? 'No duas recorded'
                : `${tooltip.cnt} / ${total} duas · ${tooltip.pct}% complete`}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`text-[9px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}
            >
              Less
            </span>
            {[
              dark ? 'bg-stone-800' : 'bg-stone-100',
              dark ? 'bg-amber-900/60' : 'bg-amber-100',
              dark ? 'bg-amber-600/50' : 'bg-amber-300',
              dark ? 'bg-emerald-700/60' : 'bg-emerald-300',
              dark ? 'bg-emerald-500' : 'bg-emerald-500',
            ].map((cls, i) => (
              <div key={i} className={`h-3 w-3 rounded-[2px] ${cls}`} />
            ))}
            <span
              className={`text-[9px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}
            >
              More
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
