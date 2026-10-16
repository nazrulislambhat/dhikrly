'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import {
  BookOpen,
  CalendarCheck,
  ChevronDown,
  CircleDot,
  Clock3,
  Coffee,
  Compass,
  Crown,
  Cpu,
  Headphones,
  HeartHandshake,
  Landmark,
  Layers,
  LineChart,
  Moon,
  MoonStar,
  MoreHorizontal,
  Scale,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { scheduleNotifications } from '@/components/NotificationSettings';
import UpdateBanner from '@/components/UpdateBanner';
import DhikrlyProModal from '@/components/DhikrlyProModal';
import { usePro } from '@/hooks/usePro';

export type AppSection =
  | 'adhkar'
  | 'salah'
  | 'quran'
  | 'tasbeeh'
  | 'qibla'
  | 'ramadan'
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

const moreDrawerItems = [
  { href: '/names', label: '99 Names of Allah', desc: 'Asmā’ al-Ḥusnā, audio pronunciation & Hifdh tracker', section: 'names', Icon: Sparkles },
  { href: '/tadabbur', label: 'Situational Du‘ā & Tadabbur', desc: 'Du‘ās by emotion, anxiety & life situation', section: 'tadabbur', Icon: BookOpen },
  { href: '/umrah', label: 'Hajj & ‘Umrah Companion', desc: 'Live Ṭawāf & Sa‘ī counters with Talbiyah player', section: 'umrah', Icon: Compass },
  { href: '/sunnah', label: 'Daily Sunnah & Player', desc: 'Revive daily prophetic traditions & notification player', section: 'sunnah', Icon: HeartHandshake },
  { href: '/zakat', label: 'Zakāt & Nisāb', desc: 'Live gold/silver Nisāb & wealth assessment', section: 'zakat', Icon: Scale },
  { href: '/halal', label: 'Halal Food Scanner', desc: 'Scan barcodes & check E-number additives', section: 'halal', Icon: ShieldCheck },
  { href: '/qada', label: 'Qadā Tracker', desc: 'Track & repay missed prayers systematically', section: 'qada', Icon: CalendarCheck },
  { href: '/qibla', label: 'Qibla Compass', desc: 'Accurate Ka’bah direction from anywhere', section: 'qibla', Icon: Compass },
  { href: '/ramadan', label: 'Ramadan Tracker', desc: 'Fasting countdown, Tarawih & Khatmah', section: 'ramadan', Icon: MoonStar },
  { href: '/masjids', label: 'Masjid Finder', desc: 'Find nearby mosques & prayer times', section: 'masjids', Icon: Landmark },
  { href: '/ambient', label: 'Ambient Focus', desc: 'Islamic soundscapes & dhikr breathing', section: 'ambient', Icon: Headphones },
  { href: '/insights', label: 'Spiritual Insights', desc: 'Daily prayer trends & spiritual habits', section: 'insights', Icon: LineChart },
  { href: '/adhkar', label: 'Adhkār Library', desc: 'Fortress of the Muslim authentic collection', section: 'adhkar', Icon: Sparkles },
  { href: '/pro', label: 'Dhikrly Pro Plans', desc: 'AI Hifdh coach, cloud sync & student waqf', section: 'pro', Icon: Crown },
  { href: '/pipeline', label: 'Engineering Pipeline', desc: 'Native apps (iOS, Android, Mac) & backend plan', section: 'pipeline', Icon: Layers },
  { href: '/tech', label: 'Tech Stack & APIs', desc: 'Open-source libraries, APIs, and architecture', section: 'tech', Icon: Cpu },
  { href: '/settings', label: 'Settings & Profile', desc: 'Account sync, calculation methods & sound', section: 'settings', Icon: UserRound },
];

export default function AppShell({
  active,
  dark,
  onToggleDark,
  children,
}: AppShellProps) {
  useServiceWorker();
  const { isPro } = usePro();
  const [showProModal, setShowProModal] = useState(false);

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const muted = dark ? 'text-stone-400' : 'text-stone-500';
  const surface = dark
    ? 'border-white/[0.08] bg-[#14211e]/95'
    : 'border-stone-200/80 bg-white/95';

  useEffect(() => {
    scheduleNotifications();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        scheduleNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#0d1715' : '#f5f8f7');
  }, [dark]);

  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        desktopDropdownRef.current &&
        !desktopDropdownRef.current.contains(event.target as Node)
      ) {
        setDesktopDropdownOpen(false);
      }
    };
    if (desktopDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [desktopDropdownOpen]);

  // Close menus when pressing escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMoreMenu(false);
        setDesktopDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeDropdownItem = moreDrawerItems.find(
    (item) => item.section === active || (item.section === 'ramadan' && active === 'ramadhan'),
  );
  const isDropdownActive = Boolean(activeDropdownItem);

  const isMoreActive = isDropdownActive;

  return (
    <div className="min-h-dvh">
      <UpdateBanner dark={dark} />
      {/* Desktop Header */}
      <header className={`hidden min-[1080px]:sticky min-[1080px]:top-0 min-[1080px]:z-40 min-[1080px]:flex min-[1080px]:h-[4.75rem] min-[1080px]:items-center min-[1080px]:border-b min-[1080px]:backdrop-blur-xl ${surface}`}>
        <div className="mx-auto flex h-full w-[min(calc(100%-2rem),72rem)] items-center gap-4 px-2 lg:px-4">
          <Link href="/" className="mr-auto inline-flex items-center gap-3 no-underline shrink-0" aria-label="Dhikrly home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-800 text-xl font-bold text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950" aria-hidden="true">ذ</span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight text-[var(--app-ink)]">Dhikrly</span>
              <span className={`-mt-0.5 block text-[10px] ${muted}`}>A little, every day</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1.5 py-1" aria-label="Main navigation">
            {mainNavItems.map((item) => {
              const isCurrent =
                active === item.section ||
                (item.section === 'adhkar' && active === 'adhkaar');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-semibold no-underline transition-colors hover:bg-emerald-500/10 hover:text-emerald-800 dark:hover:text-emerald-200 ${
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

            {/* Desktop More Features Dropdown */}
            <div className="relative" ref={desktopDropdownRef}>
              <button
                type="button"
                onClick={() => setDesktopDropdownOpen((v) => !v)}
                aria-expanded={desktopDropdownOpen}
                className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-semibold transition-colors hover:bg-emerald-500/10 hover:text-emerald-800 dark:hover:text-emerald-200 ${
                  isDropdownActive
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200 shadow-xs'
                    : muted
                }`}
              >
      
                <span className='cursor-pointer'>{activeDropdownItem ? activeDropdownItem.label : 'More'}</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${desktopDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {desktopDropdownOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-100 rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    dark ? 'border-white/[0.12] bg-[#14211e]/98 text-stone-200' : 'border-stone-200/90 bg-white/98 text-stone-800'
                  }`}
                >
                  <div className="px-3 py-1.5 mb-1 border-b border-[var(--app-line)] flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Explore Dhikrly
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">16 Hubs & Plans</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 max-h-[24rem] overflow-y-auto p-0.5">
                    {moreDrawerItems.map((item) => {
                      const isCurrent =
                        active === item.section ||
                        (item.section === 'ramadan' && active === 'ramadhan');
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDesktopDropdownOpen(false)}
                          className={`flex items-start gap-2 rounded-xl p-2 text-xs no-underline transition-colors ${
                            isCurrent
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold'
                              : 'hover:bg-emerald-500/10 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <item.Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-semibold leading-tight truncate">{item.label}</p>
                            <p className="text-[10px] text-stone-400 leading-tight truncate mt-0.5">{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[var(--app-line)]">
                    <a
                      href="https://buymeacoffee.com/nazrulislambhat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl py-2 px-3 text-xs font-bold text-amber-950 bg-[#FFDD00]/25 hover:bg-[#FFDD00]/40 dark:bg-amber-400/15 dark:text-amber-200 transition-colors shadow-xs no-underline"
                    >
                      <Coffee className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Support Dhikrly · Buy me a coffee</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProModal(true)}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                isPro
                  ? 'border border-amber-400/50 bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-700 dark:text-amber-300'
                  : 'border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20'
              }`}
            >
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span>{isPro ? 'Pro Active' : 'Get Pro'}</span>
            </button>

            <Link
              href="/settings"
              aria-label="Settings and Profile"
              title="Settings & Profile"
              className={`flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--app-line)] px-2.5 text-xs font-semibold transition-colors hover:bg-emerald-500/10 ${
                active === 'settings'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                  : muted
              }`}
            >
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden xl:inline">Profile</span>
            </Link>

            <button
              type="button"
              className={`flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--app-line)] px-3 text-xs font-semibold transition-colors hover:bg-emerald-500/10 ${muted}`}
              onClick={onToggleDark}
            >
              {dark ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{dark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-dvh min-w-0 pb-[calc(5.75rem+env(safe-area-inset-bottom))] min-[1080px]:pb-8">
        {/* Mobile / Tablet Header */}
        <div className="sticky top-0 z-30 flex min-h-[4.25rem] items-center border-b border-[var(--app-line)] bg-[var(--app-bg)]/90 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-xl min-[1080px]:hidden">
          <div className="mx-auto flex h-full w-[min(calc(100%-2rem),72rem)] items-center px-2 lg:px-4">
            <Link href="/" className="mr-auto inline-flex items-center gap-3 no-underline" aria-label="Dhikrly home">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-800 text-xl font-bold text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950" aria-hidden="true">ذ</span>
              <span className="text-lg font-extrabold tracking-tight text-[var(--app-ink)]">Dhikrly</span>
            </Link>
            <span className={`mr-3 text-xs hidden sm:inline ${muted}`}>A little, every day</span>
            <button
              type="button"
              onClick={() => setShowProModal(true)}
              className={`mr-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold shadow-xs transition-transform active:scale-95 ${
                isPro
                  ? 'border-amber-400/50 bg-amber-400/20 text-amber-700 dark:text-amber-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
              }`}
            >
              <Crown className="h-3 w-3 text-amber-500" />
              <span>PRO</span>
            </button>
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

            {/* Support Dhikrly Buy Me A Coffee */}
            <div className="mt-4 pt-3 border-t border-[var(--app-line)]">
              <a
                href="https://buymeacoffee.com/nazrulislambhat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 px-4 text-xs font-bold text-amber-950 bg-[#FFDD00]/25 hover:bg-[#FFDD00]/40 dark:bg-amber-400/15 dark:text-amber-200 transition-colors shadow-xs no-underline"
              >
                <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Support Dhikrly · Buy me a coffee</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {showProModal && (
        <DhikrlyProModal dark={dark} onClose={() => setShowProModal(false)} />
      )}
    </div>
  );
}
