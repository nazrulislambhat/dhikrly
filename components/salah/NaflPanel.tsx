'use client';

import type { DayLog } from '@/types/salah';

interface NaflPanelProps {
  nafl: DayLog['nafl'];
  dark: boolean;
  onToggle: (key: keyof DayLog['nafl']) => void;
}

const NAFL = [
  { key: 'ishraq'  as const, label: 'Ishraq',          ar: 'الإشراق',  desc: '~15-20 min after sunrise',  rakats: '2-4' },
  { key: 'duha'    as const, label: 'Duha (Chasht)',    ar: 'الضحى',    desc: 'Mid-morning prayer',         rakats: '2-12' },
  { key: 'awwabin' as const, label: 'Awwābīn',          ar: 'الأوابين', desc: 'After Maghrib',              rakats: '6' },
];

export default function NaflPanel({ nafl, dark, onToggle }: NaflPanelProps) {
  const card = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-stone-200 shadow-sm';

  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <h3 className={`mb-3 font-serif text-[15px] font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
        Nafl Prayers
      </h3>

      <div className="space-y-2">
        {NAFL.map(n => (
          <button
            key={n.key}
            onClick={() => onToggle(n.key)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all active:scale-[0.98] ${
              nafl[n.key]
                ? dark ? 'border-violet-500/25 bg-violet-500/10' : 'border-violet-300/40 bg-violet-50'
                : dark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-stone-100 bg-stone-50'
            }`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              nafl[n.key]
                ? 'border-violet-500 bg-violet-500'
                : dark ? 'border-white/20' : 'border-stone-300'
            }`}>
              {nafl[n.key] && (
                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-[13px] font-medium ${nafl[n.key]
                  ? dark ? 'text-violet-400' : 'text-violet-700'
                  : dark ? 'text-stone-300' : 'text-stone-700'
                }`}>
                  {n.label}
                </span>
                <span className={`font-arabic text-sm ${dark ? 'text-stone-600' : 'text-stone-400'}`} dir="rtl">
                  {n.ar}
                </span>
              </div>
              <p className={`text-[10px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>{n.desc}</p>
            </div>

            <span className={`shrink-0 text-[10px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>
              {n.rakats}r
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
