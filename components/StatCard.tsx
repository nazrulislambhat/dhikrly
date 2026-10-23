'use client';

import { BookOpen, CheckCircle2, Clock3, Flame, Sparkles } from 'lucide-react';
import type { Accent } from '@/types';

interface StatCardProps {
  label: string;
  value: string | number;
  dark: boolean;
  accent: Accent;
}

export default function StatCard({ label, value, dark, accent }: StatCardProps) {
  const getIcon = () => {
    const l = label.toLowerCase();
    if (l.includes('total')) return <BookOpen className="h-4 w-4" />;
    if (l.includes('done')) return <CheckCircle2 className="h-4 w-4" />;
    if (l.includes('pending')) return <Clock3 className="h-4 w-4" />;
    if (l.includes('streak')) return <Flame className="h-4 w-4" />;
    return <Sparkles className="h-4 w-4" />;
  };

  const getAccentStyles = () => {
    switch (accent) {
      case 'green':
        return {
          icon: dark
            ? 'text-primary bg-primary-light border border-primary/30'
            : 'text-primary bg-primary-subtle border border-primary/20',
          val: 'text-primary',
        };
      case 'gold':
      case 'amber':
        return {
          icon: dark
            ? 'text-link bg-link-light border border-link/30'
            : 'text-link bg-link-light border border-link/25',
          val: 'text-link',
        };
      case 'purple':
        return {
          icon: dark
            ? 'text-purple-300 bg-purple-500/20 border border-purple-500/30'
            : 'text-purple-800 bg-purple-50 border border-purple-500/20',
          val: dark ? 'text-purple-300' : 'text-purple-700',
        };
      default:
        return {
          icon: dark
            ? 'text-stone-300 bg-white/5 border border-white/10'
            : 'text-stone-700 bg-stone-100 border border-stone-200',
          val: dark ? 'text-stone-100' : 'text-stone-800',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface/90 backdrop-blur-md p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`grid h-8 w-8 place-items-center rounded-xl transition-transform group-hover:scale-105 ${styles.icon}`}
          aria-hidden="true"
        >
          {getIcon()}
        </span>
        <span
          suppressHydrationWarning
          className={`font-display text-2xl font-extrabold tracking-tight tabular-nums ${styles.val}`}
        >
          {value}
        </span>
      </div>
      <div
        className={`mt-2 text-[10px] font-extrabold uppercase tracking-wider ${
          dark ? 'text-stone-400' : 'text-stone-500'
        }`}
      >
        {label}
      </div>
    </div>
  );
}
