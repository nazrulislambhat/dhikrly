'use client';

interface ProgressBarProps {
  pct: number;
  dark: boolean;
}

export default function ProgressBar({ pct, dark }: ProgressBarProps) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full ${
        dark ? 'bg-white/[0.08] border border-white/[0.04]' : 'bg-black/[0.06] border border-black/[0.03]'
      }`}
      role="progressbar"
      aria-valuenow={clampedPct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        suppressHydrationWarning
        className={`h-full rounded-full transition-all duration-700 ease-out relative ${
          clampedPct === 100
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
            : clampedPct > 50
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500'
        }`}
        style={{ width: `${clampedPct}%` }}
      >
        {clampedPct > 0 && clampedPct < 100 && (
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        )}
      </div>
    </div>
  );
}
