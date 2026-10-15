'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock3,
  Compass,
  Headphones,
  Landmark,
  LineChart,
  Moon,
  MoonStar,
  MoreHorizontal,
  Sparkles,
  Sun,
  UserRound,
  X,
  CircleDot,
} from 'lucide-react';

export type AppSection =
  | 'adhkar'
  | 'adhkaar'
  | 'salah'
  | 'quran'
  | 'tasbeeh'
  | 'qibla'
  | 'ramadan'
  | 'ramadhan'
  | 'masjids'
  | 'ambient'
  | 'insights'
  | 'settings'
  | (string & {});

interface AppShellProps {
  active: AppSection;
  dark: boolean;
  onToggleDark: () => void;
  children: React.ReactNode;
}

const mainNavItems = [
  { href: '/', label: 'Adhkār', section: 'adhkar', Icon: Sparkles },
  { href: '/salah', label: 'Ṣalāh', section: 'salah', Icon: Clock3 },
  { href: '/quran', label: 'Qur’an', section: 'quran', Icon: BookOpen },
  { href: '/tasbeeh', label: 'Tasbīḥ', section: 'tasbeeh', Icon: CircleDot },
];

const desktopNavItems = [
  { href: '/', label: 'Adhkār', section: 'adhkar', Icon: Sparkles },
  { href: '/salah', label: 'Ṣalāh', section: 'salah', Icon: Clock3 },
  { href: '/quran', label: 'Qur’an', section: 'quran', Icon: BookOpen },
  { href: '/tasbeeh', label: 'Tasbīḥ', section: 'tasbeeh', Icon: CircleDot },
  { href: '/qibla', label: 'Qibla', section: 'qibla', Icon: Compass },
  { href: '/ramadan', label: 'Ramadan', section: 'ramadan', Icon: MoonStar },
  { href: '/masjids', label: 'Masjids', section: 'masjids', Icon: Landmark },
  { href: '/ambient', label: 'Ambient', section: 'ambient', Icon: Headphones },
  { href: '/insights', label: 'Insights', section: 'insights', Icon: LineChart },
  { href: '/settings', label: 'Profile', section: 'settings', Icon: UserRound },
];

const moreDrawerItems = [
  { href: '/qibla', label: 'Qibla Compass', desc: 'Accurate Ka’bah direction from anywhere', section: 'qibla', Icon: Compass },
  { href: '/ramadan', label: 'Ramadan Tracker', desc: 'Fasting countdown, Tarawih & Khatmah', section: 'ramadan', Icon: MoonStar },
  { href: '/masjids', label: 'Masjid Finder', desc: 'Find nearby mosques & prayer times', section: 'masjids', Icon: Landmark },
  { href: '/ambient', label: 'Ambient Focus', desc: 'Islamic soundscapes & dhikr breathing', section: 'ambient', Icon: Headphones },
  { href: '/insights', label: 'Spiritual Insights', desc: 'Daily prayer trends & spiritual habits', section: 'insights', Icon: LineChart },
  { href: '/adhkar', label: 'Adhkār Library', desc: 'Fortress of the Muslim authentic collection', section: 'adhkar', Icon: Sparkles },
  { href: '/settings', label: 'Settings & Profile', desc: 'Account sync, calculation methods & sound', section: 'settings', Icon: UserRound },
];

export default function AppShell({
  active,
  dark,
  onToggleDark,
  children,
}: AppShellProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const muted = dark ? 'text-stone-400' : 'text-stone-500';
  const surface = dark
    ? 'border-white/[0.08] bg-[#14211e]/95'
    : 'border-stone-200/80 bg-white/95';

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#0d1715' : '#f5f8f7');
  }, [dark]);

  // Close more menu when pressing escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMoreMenu(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMoreActive = [
    'qibla',
    'ramadan',
    'ramadhan',
    'masjids',
    'ambient',
    'insights',
    'settings',
  ].includes(active);

  return (
    <div className="min-h-dvh">
      {/* Desktop Header */}
      <header className={`hidden min-[1080px]:sticky min-[1080px]:top-0 min-[1080px]:z-40 min-[1080px]:flex min-[1080px]:h-[4.75rem] min-[1080px]:items-center min-[1080px]:gap-4 min-[1080px]:border-b min-[1080px]:px-[clamp(1rem,3vw,3rem)] min-[1080px]:py-2.5 min-[1080px]:backdrop-blur-xl ${surface}`}>
        <Link href="/" className="mr-auto inline-flex items-center gap-3 no-underline shrink-0" aria-label="Dhikrly home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-800 text-xl font-bold text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950" aria-hidden="true">ذ</span>
          <span>
            <span className="block text-xl font-extrabold tracking-tight text-[var(--app-ink)]">Dhikrly</span>
            <span className={`-mt-0.5 block text-[10px] ${muted}`}>A little, every day</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto py-1" aria-label="Main navigation">
          {desktopNavItems.map((item) => {
            const isCurrent =
              active === item.section ||
              (item.section === 'ramadan' && active === 'ramadhan') ||
              (item.section === 'adhkar' && active === 'adhkaar');

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-xs font-semibold no-underline transition-colors hover:bg-emerald-500/10 hover:text-emerald-800 dark:hover:text-emerald-200 ${
                  isCurrent
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200 shadow-xs'
                    : muted
                }`}
              >
                <item.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className={`flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--app-line)] px-3 text-xs font-semibold transition-colors hover:bg-emerald-500/10 ${muted}`}
          onClick={onToggleDark}
        >
          {dark ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>{dark ? 'Light' : 'Dark'}</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="min-h-dvh min-w-0 pb-[calc(5.75rem+env(safe-area-inset-bottom))] min-[1080px]:pb-8">
        {/* Mobile / Tablet Header */}
        <div className="sticky top-0 z-30 flex min-h-[4.25rem] items-center border-b border-[var(--app-line)] bg-[var(--app-bg)]/90 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-xl min-[1080px]:hidden">
          <Link href="/" className="mr-auto inline-flex items-center gap-3 no-underline" aria-label="Dhikrly home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-800 text-xl font-bold text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950" aria-hidden="true">ذ</span>
            <span className="text-lg font-extrabold tracking-tight text-[var(--app-ink)]">Dhikrly</span>
          </Link>
          <span className={`mr-3 text-xs hidden sm:inline ${muted}`}>A little, every day</span>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--app-line)] bg-[var(--app-surface)] text-lg text-emerald-800 dark:text-emerald-200 shadow-xs"
            onClick={onToggleDark}
            aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}
            title={dark ? 'Use light appearance' : 'Use dark appearance'}
          >
            {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        {children}
      </main>

      {/* Mobile Bottom Navigation with 5 tabs: Adhkar, Salah, Quran, Tasbeeh, More */}
      <nav className={`fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 gap-1 rounded-2xl border p-1.5 shadow-xl backdrop-blur-2xl min-[1080px]:hidden ${surface}`} aria-label="Main mobile navigation">
        {mainNavItems.map((item) => {
          const isCurrent = active === item.section || (item.section === 'adhkar' && active === 'adhkaar');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold no-underline transition-colors ${
                isCurrent
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200 font-bold'
                  : muted
              }`}
            >
              <item.Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setShowMoreMenu(true)}
          className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors ${
            isMoreActive
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200 font-bold'
              : muted
          }`}
          aria-expanded={showMoreMenu}
          aria-label="More Dhikrly pages"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {/* More Pages Drawer / Bottom Sheet */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs min-[1080px]:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreMenu(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-[var(--app-line)] bg-[var(--app-surface)] p-5 shadow-2xl dark:bg-[#14211e]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-700" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[var(--app-ink)]">Explore Dhikrly</h3>
                <p className="text-xs text-[var(--app-muted)]">All daily tools for your deen</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--app-line)] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-2">
              {moreDrawerItems.map((item) => {
                const isCurrent =
                  active === item.section ||
                  (item.section === 'ramadan' && active === 'ramadhan') ||
                  (item.section === 'adhkar' && active === 'adhkaar');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-3.5 rounded-2xl border p-3 no-underline transition-all ${
                      isCurrent
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border-[var(--app-line)] bg-black/5 hover:bg-emerald-500/5 dark:bg-white/[0.03]'
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                      <item.Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[var(--app-ink)]">{item.label}</span>
                      <span className="block text-xs text-[var(--app-muted)] truncate">{item.desc}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
