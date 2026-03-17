/* eslint-disable react-hooks/purity */
'use client';

import { useState, useMemo } from 'react';
import { load, save, STORAGE_KEY } from '@/lib/storage';
import { getTodayKey, formatDateLabel } from '@/lib/dates';

interface MissedDay {
  key: string;
  label: string;
  pct: number;
  cnt: number;
}

interface MissedDayRecoveryProps {
  dark: boolean;
  total: number;
  duaIds: string[];
  onClose: () => void;
  onRecover: (dayKey: string) => void;
}

export default function MissedDayRecovery({
  dark,
  total,
  duaIds,
  onClose,
  onRecover,
}: MissedDayRecoveryProps) {
  const today = getTodayKey();
  const [recovering, setRecovering] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<Set<string>>(new Set());

  const missedDays: MissedDay[] = useMemo(() => {
    const allData = load<Record<string, Record<string, boolean>>>(
      STORAGE_KEY,
      {},
    );
    const missed: MissedDay[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      const dayData = allData[key] ?? {};
      const cnt = Object.values(dayData).filter(Boolean).length;
      const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
      if (pct < 100) {
        missed.push({ key, label: formatDateLabel(key), pct, cnt });
      }
    }
    return missed;
  }, [total, today]);

  const handleRecover = (dayKey: string) => {
    setRecovering(dayKey);
    setTimeout(() => {
      const allData = load<Record<string, Record<string, boolean>>>(
        STORAGE_KEY,
        {},
      );
      const complete: Record<string, boolean> = {};
      duaIds.forEach((id) => {
        complete[id] = true;
      });
      allData[dayKey] = complete;
      save(STORAGE_KEY, allData);
      onRecover(dayKey);
      setRecovered((prev) => new Set([...prev, dayKey]));
      setRecovering(null);
    }, 600);
  };

  if (missedDays.length === 0) return null;

  const overlay = dark
    ? 'bg-[#0c1a2e]/80 backdrop-blur-sm'
    : 'bg-stone-900/40 backdrop-blur-sm';
  const panel = dark
    ? 'bg-[#111f33] border-white/10'
    : 'bg-white border-stone-200';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center ${overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${panel}`}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2
              className={`font-serif text-lg font-semibold ${
                dark ? 'text-stone-100' : 'text-stone-800'
              }`}
            >
              Missed Days
            </h2>
            <p
              className={`mt-0.5 text-[11px] ${
                dark ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              You can mark previous days as complete
            </p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${
              dark
                ? 'text-stone-500 hover:bg-white/5 hover:text-stone-300'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {missedDays.map((day) => {
            const isRecovered = recovered.has(day.key);
            const isRecovering = recovering === day.key;

            return (
              <div
                key={day.key}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                  isRecovered
                    ? dark
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-emerald-300/50 bg-emerald-50'
                    : dark
                      ? 'border-white/[0.07] bg-white/[0.03]'
                      : 'border-stone-100 bg-stone-50'
                }`}
              >
                <div>
                  <p
                    className={`text-[13px] font-medium ${
                      dark ? 'text-stone-200' : 'text-stone-700'
                    }`}
                  >
                    {day.label}
                  </p>
                  <p
                    className={`text-[10px] ${
                      dark ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    {isRecovered
                      ? 'Marked complete ✓'
                      : day.pct === 0
                        ? 'No duas recorded'
                        : `${day.cnt} / ${total} duas · ${day.pct}%`}
                  </p>
                </div>

                {!isRecovered && (
                  <button
                    onClick={() => handleRecover(day.key)}
                    disabled={isRecovering}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95 ${
                      isRecovering
                        ? dark
                          ? 'bg-stone-700 text-stone-500'
                          : 'bg-stone-100 text-stone-400'
                        : dark
                          ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {isRecovering ? '...' : 'Mark Done'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p
          className={`mt-4 text-[10px] ${
            dark ? 'text-stone-700' : 'text-stone-400'
          }`}
        >
          Marking a day complete will count it toward your streak history.
        </p>

        <button
          onClick={onClose}
          className={`mt-4 w-full rounded-xl py-2 text-sm transition-all ${
            dark
              ? 'border border-white/10 text-stone-500 hover:text-stone-300'
              : 'border border-stone-200 text-stone-400 hover:text-stone-600'
          }`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
