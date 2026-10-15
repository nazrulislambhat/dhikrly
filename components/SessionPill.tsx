'use client';

interface SessionPillProps {
  label: string;
  dark: boolean;
}

const SESSION_CLASSES: Record<string, { dark: string; light: string }> = {
  Morning: {
    dark: 'bg-amber-400/10 text-amber-300',
    light: 'bg-amber-100 text-amber-700',
  },
  Evening: {
    dark: 'bg-violet-400/10 text-violet-300',
    light: 'bg-violet-100 text-violet-700',
  },
  'After Ṣalāh': {
    dark: 'bg-emerald-400/10 text-emerald-300',
    light: 'bg-emerald-100 text-emerald-700',
  },
  Anytime: {
    dark: 'bg-stone-400/10 text-stone-400',
    light: 'bg-stone-100 text-stone-500',
  },
};

export default function SessionPill({ label, dark }: SessionPillProps) {
  const cls = SESSION_CLASSES[label] ?? SESSION_CLASSES['Anytime'];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        dark ? cls.dark : cls.light
      }`}
    >
      {label}
    </span>
  );
}
