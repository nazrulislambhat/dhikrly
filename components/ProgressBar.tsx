'use client';

interface ProgressBarProps {
  pct: number;
  dark: boolean;
}

export default function ProgressBar({ pct, dark }: ProgressBarProps) {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full ${
        dark ? 'bg-white/[0.07]' : 'bg-black/[0.07]'
      }`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          pct === 100
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : 'bg-gradient-to-r from-amber-400 to-amber-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
