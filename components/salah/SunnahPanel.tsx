'use client';

import type { DayLog } from '@/types/salah';
import { SUNNAH_DEF } from '@/types/salah';

interface SunnahPanelProps {
  sunnah: DayLog['sunnah'];
  dark: boolean;
  onToggle: (key: keyof DayLog['sunnah']) => void;
}

export default function SunnahPanel({ sunnah, dark, onToggle }: SunnahPanelProps) {
  const done = Object.values(sunnah).filter(Boolean).length;
  const total = SUNNAH_DEF.length;

  const card = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-stone-200 shadow-sm';

  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-serif text-[15px] font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
          Sunnah Prayers
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
          done === total
            ? dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
            : dark ? 'bg-white/5 text-stone-500' : 'bg-stone-100 text-stone-400'
        }`}>
          {done}/{total}
        </span>
      </div>

      <div className="space-y-2">
        {SUNNAH_DEF.map(s => (
          <button
            key={s.key}
            onClick={() => onToggle(s.key)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
              sunnah[s.key]
                ? dark ? 'bg-emerald-500/10 border border-emerald-500/25' : 'bg-emerald-50 border border-emerald-300/40'
                : dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-stone-50 border border-stone-100'
            }`}
          >
            {/* Checkbox */}
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
              sunnah[s.key]
                ? 'border-emerald-500 bg-emerald-500'
                : dark ? 'border-white/20' : 'border-stone-300'
            }`}>
              {sunnah[s.key] && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>

            <span className={`flex-1 text-[13px] ${sunnah[s.key]
              ? dark ? 'text-emerald-400' : 'text-emerald-700'
              : dark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              {s.label}
            </span>

            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
              dark ? 'bg-white/5 text-stone-600' : 'bg-stone-100 text-stone-400'
            }`}>
              {s.rakats}r
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
