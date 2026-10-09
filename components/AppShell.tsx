'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { BookOpen, Clock3, Moon, Sparkles, Sun, UserRound } from 'lucide-react';

type AppSection = 'adhkar' | 'salah' | 'quran' | 'settings';

interface AppShellProps {
  active: AppSection;
  dark: boolean;
  onToggleDark: () => void;
  children: React.ReactNode;
}

const navItems = [
  { href: '/', label: 'Adhkār', section: 'adhkar' as const, Icon: Sparkles },
  { href: '/salah', label: 'Ṣalāh', section: 'salah' as const, Icon: Clock3 },
  { href: '/quran', label: 'Qur’an', section: 'quran' as const, Icon: BookOpen },
  { href: '/settings', label: 'Profile', section: 'settings' as const, Icon: UserRound },
];

export default function AppShell({
  active,
  dark,
  onToggleDark,
  children,
}: AppShellProps) {
  const muted = dark ? 'text-stone-400' : 'text-stone-500';
  const surface = dark
    ? 'border-white/[0.08] bg-[#14211e]/95'
    : 'border-stone-200/80 bg-white/95';

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#0d1715' : '#f5f8f7');
  }, [dark]);

  return (
    <div className="min-h-dvh">
      <header className={`hidden min-[900px]:sticky min-[900px]:top-0 min-[900px]:z-30 min-[900px]:flex min-[900px]:h-[5.25rem] min-[900px]:items-center min-[900px]:gap-8 min-[900px]:border-b min-[900px]:px-[clamp(1.25rem,4vw,4rem)] min-[900px]:py-3 min-[900px]:backdrop-blur-xl ${surface}`}>
        <Link href="/" className="mr-auto inline-flex items-center gap-3 no-underline" aria-label="Dhikrly home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-800 text-xl text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950" aria-hidden="true">ذ</span>
          <span>
            <span className="block text-xl font-extrabold tracking-tight text-[var(--app-ink)]">Dhikrly</span>
            <span className={`mt-0.5 block text-[10px] ${muted}`}>A little, every day</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active === item.section ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold no-underline transition-colors hover:bg-emerald-500/10 hover:text-emerald-800 dark:hover:text-emerald-200 ${
                active === item.section
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'
                  : muted
              }`}
            >
              <item.Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <button type="button" className={`flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--app-line)] px-3 text-xs font-semibold ${muted}`} onClick={onToggleDark}>
          {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          {dark ? 'Use light appearance' : 'Use dark appearance'}
        </button>
      </header>

      <main className="min-h-dvh min-w-0 pb-[calc(5.75rem+env(safe-area-inset-bottom))] min-[900px]:pb-8">
        <div className="flex min-h-[4.25rem] items-center border-b border-[var(--app-line)] bg-[var(--app-bg)]/90 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-xl min-[900px]:hidden">
          <Link href="/" className="mr-auto inline-flex items-center gap-3 no-underline" aria-label="Dhikrly home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-800 text-xl text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950" aria-hidden="true">ذ</span>
            <span className="text-lg font-extrabold tracking-tight text-[var(--app-ink)]">Dhikrly</span>
          </Link>
          <span className={`mr-2 text-xs ${muted}`}>A little, every day</span>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--app-line)] bg-[var(--app-surface)] text-lg text-emerald-800 dark:text-emerald-200"
            onClick={onToggleDark}
            aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}
            title={dark ? 'Use light appearance' : 'Use dark appearance'}
          >
            {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {children}
      </main>

      <nav className={`fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-4 gap-1 rounded-2xl border p-1.5 shadow-xl backdrop-blur-2xl min-[900px]:hidden ${surface}`} aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active === item.section ? 'page' : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold no-underline transition-colors ${
              active === item.section
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'
                : muted
            }`}
          >
            <item.Icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
