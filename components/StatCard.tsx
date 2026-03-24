'use client';

import type { Accent } from '@/types';

interface StatCardProps {
  label: string;
  value: string | number;
  dark: boolean;
  accent: Accent;
}

const ACCENT_CLASSES: Record<Accent, { dark: string; light: string }> = {
  gold: { dark: 'text-amber-400', light: 'text-amber-600' },
  green: { dark: 'text-emerald-400', light: 'text-emerald-600' },
  amber: { dark: 'text-orange-400', light: 'text-orange-500' },
  purple: { dark: 'text-violet-400', light: 'text-violet-600' },
  muted: { dark: 'text-stone-400', light: 'text-stone-500' },
};

export default function StatCard({ label, value, dark, accent }: StatCardProps) {
  const cls = ACCENT_CLASSES[accent];
  return (
    <div
      className={`rounded-xl border px-3 py-3 text-center ${
        dark
          ? 'border-white/[0.07] bg-white/[0.04]'
          : 'border-black/[0.07] bg-white shadow-sm'
      }`}
    >
      <div
        className={`text-2xl font-light leading-none ${
          dark ? cls.dark : cls.light
        }`}
      >
        {value}
      </div>
      <div
        className={`mt-1 text-[9px] uppercase tracking-widest ${
          dark ? 'text-stone-600' : 'text-stone-400'
        }`}
      >
        {label}
      </div>
    </div>
  );
}
