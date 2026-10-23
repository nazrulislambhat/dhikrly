'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { load, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey } from '@/lib/dates';
import type { HeatmapCell } from '@/types';

interface StreakHeatmapProps {
  dark: boolean;
  total: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StreakHeatmap({ dark, total }: StreakHeatmapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [rangeMode, setRangeMode] = useState<'1y' | '16w'>('1y');
  const [dataVersion, setDataVersion] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<{
    key: string;
    pct: number;
    cnt: number;
  } | null>(null);

  // Re-read storage whenever sync completes or check items change
  useEffect(() => {
    const onUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener('dhikrly:adhkar-updated', onUpdate);
    return () => window.removeEventListener('dhikrly:adhkar-updated', onUpdate);
  }, []);

  const WEEKS = rangeMode === '1y' ? 52 : 16;

  // Auto-scroll to latest (rightmost) weeks when in 1-year view
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [rangeMode, dataVersion]);

  const { weeks, monthLabels, totalActiveDays, yearCompletionRate } = useMemo(() => {
    const allData = mounted
      ? load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {})
      : {};
    const todayKey = getTodayKey();
    const todayDate = new Date();

    // Start from (WEEKS*7 - 1) days ago
    const startDate = new Date(todayDate);
    startDate.setDate(startDate.getDate() - WEEKS * 7 + 1);

    const cells: HeatmapCell[] = [];
    let activeDaysCount = 0;
    let totalPctSum = 0;

    for (let i = 0; i < WEEKS * 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const dayData = allData[key] ?? {};
      const cnt = Object.values(dayData).filter(Boolean).length;
      const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
      if (pct > 0) {
        activeDaysCount += 1;
        totalPctSum += pct;
      }

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

    const completionRate =
      activeDaysCount > 0 ? Math.round(totalPctSum / activeDaysCount) : 0;

    return {
      weeks: weekGroups,
      monthLabels: labels,
      totalActiveDays: activeDaysCount,
      yearCompletionRate: completionRate,
    };
  }, [total, WEEKS, dataVersion]);

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
    <div suppressHydrationWarning className={`rounded-2xl border p-4 ${card}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p
            className={`text-[10px] uppercase tracking-widest ${
              dark ? 'text-stone-400' : 'text-stone-500'
            } font-bold`}
          >
            Completion Heatmap · {rangeMode === '1y' ? 'Past 52 Weeks (Full Year)' : 'Past 16 Weeks'}
          </p>
          <p suppressHydrationWarning className="text-[11px] text-[var(--app-muted)] mt-0.5">
            {mounted ? totalActiveDays : 0} active days recorded · avg {mounted ? yearCompletionRate : 0}% adherence
          </p>
        </div>

        {/* Range Selector */}
        <div
          className={`inline-flex rounded-xl p-0.5 border text-xs font-semibold ${
            dark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setRangeMode('16w')}
            className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
              rangeMode === '16w'
                ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            16 Wks
          </button>
          <button
            type="button"
            onClick={() => setRangeMode('1y')}
            className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
              rangeMode === '1y'
                ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            Full Year (365d)
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="overflow-x-auto pb-1">
        <div className={rangeMode === '1y' ? 'min-w-[720px]' : 'min-w-[340px]'}>
          {/* Month labels */}
          <div className="mb-1 flex pl-8">
            {weeks.map((_, col) => {
              const label = monthLabels.find((m) => m.col === col);
              return (
                <div
                  key={col}
                  className={`flex-1 text-[8px] font-medium truncate ${
                    dark ? 'text-stone-500' : 'text-stone-400'
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
            <div className="mr-1.5 flex w-6 flex-col gap-0.5 shrink-0">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  className={`flex h-3 items-center justify-end text-[7px] font-medium ${
                    dark ? 'text-stone-500' : 'text-stone-400'
                  } ${i % 2 === 0 ? 'opacity-0' : ''}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Columns */}
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-1 flex-col gap-0.5 min-w-[9px]">
                {week.map((cell) => (
                  <div
                    key={cell.key}
                    className={`relative h-3 w-full cursor-pointer rounded-[2px] transition-all duration-150 hover:scale-125 hover:z-10 ${getCellColor(
                      cell,
                    )} ${
                      cell.isToday
                        ? 'ring-1 ring-amber-400 ring-offset-1 ring-offset-surface'
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
              className={`mt-2.5 rounded-lg border px-3 py-2 text-[11px] ${
                dark
                  ? 'border-white/10 bg-white/5 text-stone-200'
                  : 'border-black/10 bg-stone-50 text-stone-700'
              }`}
            >
              <span className="font-bold">{tooltip.key}</span>
              {' · '}
              {tooltip.pct === 0
                ? 'No adhkār recorded'
                : `${tooltip.cnt} / ${total} adhkār · ${tooltip.pct}% completed`}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--app-muted)]">
            <span>Scroll horizontally to view past months</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {[
                dark ? 'bg-stone-800' : 'bg-stone-100',
                dark ? 'bg-amber-900/60' : 'bg-amber-100',
                dark ? 'bg-amber-600/50' : 'bg-amber-300',
                dark ? 'bg-emerald-700/60' : 'bg-emerald-300',
                dark ? 'bg-emerald-500' : 'bg-emerald-500',
              ].map((cls, i) => (
                <div key={i} className={`h-3 w-3 rounded-[2px] ${cls}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
