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
  Headphones,
  HeartHandshake,
  Landmark,
  LineChart,
  Moon,
  MoonStar,
  MoreHorizontal,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  X,
  Command,
} from 'lucide-react';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { scheduleNotifications } from '@/components/NotificationSettings';
import UpdateBanner from '@/components/UpdateBanner';
import DhikrlyProModal from '@/components/DhikrlyProModal';
import CommandPaletteModal from '@/components/CommandPaletteModal';
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

export interface HubCategory {
  title: string;
  items: {
    href: string;
    label: string;
    desc: string;
    section: string;
    Icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const HUB_CATEGORIES: HubCategory[] = [
  {
    title: 'Daily Worship & Tadabbur',
    items: [
      { href: '/names', label: '99 Names of Allāh', desc: 'Asmā’ al-Ḥusnā, audio & memorization', section: 'names', Icon: Sparkles },
      { href: '/tadabbur', label: 'Situational Du‘ā', desc: 'Du‘ās for anxiety, grief & life situations', section: 'tadabbur', Icon: BookOpen },
      { href: '/sunnah', label: 'Daily Sunnah Player', desc: 'Revive prophetic daily habits & audio', section: 'sunnah', Icon: HeartHandshake },
      { href: '/adhkar', label: 'Adhkār Library', desc: 'Authentic Ḥiṣn al-Muslim collection', section: 'adhkar', Icon: Sparkles },
      { href: '/books', label: 'Sunni Fiqh Library', desc: 'Recommended books across 4 Madhhabs & where to buy', section: 'books', Icon: BookOpen, badge: 'New' },
    ],
  },
  {
    title: 'Deen Companions',
    items: [
      { href: '/qibla', label: 'Qibla Compass', desc: 'Accurate Ka’bah direction anywhere', section: 'qibla', Icon: Compass },
      { href: '/masjids', label: 'Masjid Finder', desc: 'Nearby verified mosques & prayer times', section: 'masjids', Icon: Landmark },
      { href: '/halal', label: 'Halal Food Scanner', desc: 'Barcode lookup & E-number additives', section: 'halal', Icon: ShieldCheck },
      { href: '/qada', label: 'Qadā Tracker', desc: 'Track & repay missed prayers systematically', section: 'qada', Icon: CalendarCheck },
    ],
  },
  {
    title: 'Sacred Seasons & Pillars',
    items: [
      { href: '/ramadan', label: 'Ramaḍān Hub', desc: 'Suhoor/Iftar countdowns & Khatmah', section: 'ramadan', Icon: MoonStar },
      { href: '/zakat', label: 'Zakāt & Nisāb', desc: 'Live gold/silver rates & wealth calculator', section: 'zakat', Icon: Scale },
      { href: '/umrah', label: 'Ḥajj & ‘Umrah', desc: 'Live Ṭawāf & Sa‘ī round counters & Talbiyah', section: 'umrah', Icon: Compass },
    ],
  },
  {
    title: 'Mind, Heart & Growth',
    items: [
      { href: '/ambient', label: 'Ambient Focus', desc: 'Islamic soundscapes & dhikr breathing', section: 'ambient', Icon: Headphones },
      { href: '/insights', label: 'Spiritual Insights', desc: 'Daily trends, consistency & habit streaks', section: 'insights', Icon: LineChart },
      { href: '/settings', label: 'Settings & Cloud Sync', desc: 'Calculation methods, sounds & backup', section: 'settings', Icon: UserRound },
    ],
  },
];

const allMoreItems = HUB_CATEGORIES.flatMap((c) => c.items);

export default function AppShell({
  active,
  dark,
  onToggleDark,
  children,
}: AppShellProps) {
  useServiceWorker();
  const { isPro } = usePro();
  const [showProModal, setShowProModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);

  const muted = 'text-muted';
  const surface = 'border-[var(--app-border)] bg-[var(--app-surface)] backdrop-blur-2xl';

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
      ?.setAttribute('content', dark ? '#000000' : '#f2f2f7');
  }, [dark]);

  // Global Cmd+K / Ctrl+K keyboard shortcut for Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowMoreMenu(false);
        setDesktopDropdownOpen(false);
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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

  const activeDropdownItem = allMoreItems.find(
    (item) => item.section === active || (item.section === 'ramadan' && active === 'ramadhan'),
  );
  const isDropdownActive = Boolean(activeDropdownItem);

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--app-bg)] text-[var(--app-ink)]">
      <UpdateBanner dark={dark} />

      {/* Global Quick Search Command Palette */}
      <CommandPaletteModal
        dark={dark}
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* ── Responsive Header (Visible on Tablets & Desktops: md:flex) ── */}
      <header
        className="hidden md:sticky md:top-0 md:z-40 md:flex md:h-[4.75rem] md:items-center md:border-b md:border-[var(--app-border)] md:bg-[var(--app-surface)] md:backdrop-blur-2xl transition-colors shadow-xs"
      >
        <div className="mx-auto flex h-full w-[min(calc(100%-2rem),74rem)] items-center gap-4 px-3 lg:px-4">
          {/* Logo Mark */}
          <Link
            href="/"
            className="mr-auto inline-flex items-center gap-3 no-underline shrink-0 group"
            aria-label="Dhikrly home"
          >
            <div className="relative">
              <span
                className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-xl font-bold text-white shadow-md transition-transform group-hover:scale-105 dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-600 dark:text-black border border-white/20"
                aria-hidden="true"
              >
                ذ
              </span>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-[var(--app-bg)]" />
            </div>
            <span>
              <span className="block text-xl font-extrabold tracking-tight text-[var(--app-ink)] leading-none font-display">
                Dhikrly
              </span>
              <span className={`block text-[10px] font-medium tracking-wide ${muted} mt-1`}>
                Daily Spiritual Sanctuary
              </span>
            </span>
          </Link>

          {/* Quick Search Trigger (iOS Spotlight Style) */}
          <button
            type="button"
            onClick={() => setShowCommandPalette(true)}
            className="hidden lg:flex items-center gap-2.5 rounded-full border border-[var(--app-border)] bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/10 text-muted hover:text-ink px-3.5 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title="Search tools, prayers and duas (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5 text-primary" />
            <span className="tracking-tight">Spotlight Search</span>
            <span className="inline-flex items-center gap-0.5 rounded-md border border-[var(--app-border)] bg-white/60 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-muted">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          {/* Main 4 Navigation Tabs (iOS Segmented Feel) */}
          <nav className="flex items-center gap-1 p-1 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--app-border)]" aria-label="Main navigation">
            {mainNavItems.map((item) => {
              const isCurrent =
                active === item.section ||
                (item.section === 'adhkar' && active === 'adhkaar');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`ios-spring flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-semibold no-underline transition-all ${
                    isCurrent
                      ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white font-bold'
                      : 'text-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <item.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Explore Dhikrly Hubs Dropdown */}
            <div className="relative" ref={desktopDropdownRef}>
              <button
                type="button"
                onClick={() => setDesktopDropdownOpen((v) => !v)}
                aria-expanded={desktopDropdownOpen}
                className={`ios-spring flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-semibold transition-all cursor-pointer ${
                  isDropdownActive
                    ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white font-bold'
                    : 'text-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>{activeDropdownItem ? activeDropdownItem.label : 'Explore'}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${desktopDropdownOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {desktopDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-[34rem] rounded-[26px] border border-white/60 dark:border-white/10 bg-white/90 dark:bg-[#1c1c1e]/90 text-ink p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2 pb-3 mb-2 border-b border-[var(--app-border)] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Explore Dhikrly
                      </span>
                      <p className="text-[11px] text-muted">All spiritual companions for your daily deen</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopDropdownOpen(false);
                        setShowCommandPalette(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-ink cursor-pointer"
                    >
                      <Search className="h-3 w-3" />
                      <span>Search All</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[25rem] overflow-y-auto pr-1">
                    {HUB_CATEGORIES.map((cat) => (
                      <div key={cat.title} className="space-y-1">
                        <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                          {cat.title}
                        </span>
                        {cat.items.map((item) => {
                          const isCurrent =
                            active === item.section ||
                            (item.section === 'ramadan' && active === 'ramadhan');
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDesktopDropdownOpen(false)}
                              className={`ios-press flex items-start gap-2.5 rounded-xl p-2 text-xs no-underline transition-colors ${
                                isCurrent
                                  ? 'bg-primary-light text-primary font-bold'
                                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-ink'
                              }`}
                            >
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-light text-primary mt-0.5">
                                <item.Icon className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold leading-tight truncate">{item.label}</p>
                                <p className="text-[10px] text-muted leading-tight truncate mt-0.5">{item.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--app-border)] flex items-center justify-between">
                    <a
                      href="https://buymeacoffee.com/nazrulislambhat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full py-1.5 px-3.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors no-underline shadow-xs cursor-pointer"
                    >
                      <Coffee className="h-3.5 w-3.5" />
                      <span>Support Dhikrly</span>
                    </a>

                    <Link
                      href="/settings"
                      onClick={() => setDesktopDropdownOpen(false)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Settings & Profile →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="Settings and Profile"
              title="Settings & Profile"
              className={`ios-spring flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--app-border)] bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/10 px-3 text-xs font-semibold transition-all ${
                active === 'settings'
                  ? 'bg-primary-light text-primary border-primary/30 font-bold'
                  : muted
              }`}
            >
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden xl:inline">Profile</span>
            </Link>

            <button
              type="button"
              className={`ios-spring flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--app-border)] bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/10 px-3 text-xs font-semibold transition-all cursor-pointer ${muted}`}
              onClick={onToggleDark}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />}
              <span>{dark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="min-h-dvh min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
        {/* Mobile Top Header (Visible on screens < 768px: md:hidden) */}
        <div className="sticky top-0 z-30 flex min-h-[4rem] items-center border-b border-[var(--app-border)] bg-[var(--app-bg)]/80 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-2xl md:hidden transition-colors">
          <div className="mx-auto flex h-full w-full items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5 no-underline" aria-label="Dhikrly home">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-base font-bold text-white shadow-sm dark:from-emerald-400 dark:to-emerald-600 dark:text-black" aria-hidden="true">
                ذ
              </span>
              <span className="text-base font-extrabold tracking-tight text-[var(--app-ink)] font-display">
                Dhikrly
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Quick Search in Mobile Header */}
              <button
                type="button"
                onClick={() => setShowCommandPalette(true)}
                className="ios-press grid h-8 w-8 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-muted hover:text-ink shadow-xs cursor-pointer"
                aria-label="Open search command palette"
                title="Search"
              >
                <Search className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                className="ios-press grid h-8 w-8 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-ink)] shadow-xs cursor-pointer"
                onClick={onToggleDark}
                aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}
                title={dark ? 'Use light appearance' : 'Use dark appearance'}
              >
                {dark ? <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {children}
      </main>

      {/* ── Mobile Floating Bottom Liquid Glass Dock (Screens < 768px: md:hidden) ── */}
      <nav
        className="fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 gap-1 rounded-full border border-white/60 dark:border-white/12 bg-white/75 dark:bg-[#1c1c1e]/80 backdrop-blur-2xl p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_40px_-6px_rgba(0,0,0,0.18)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_20px_50px_-6px_rgba(0,0,0,0.85)] md:hidden"
        aria-label="Main mobile navigation"
      >
        {mainNavItems.map((item) => {
          const isCurrent = active === item.section || (item.section === 'adhkar' && active === 'adhkaar');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={`ios-press flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] tracking-tight transition-all duration-200 no-underline cursor-pointer ${
                isCurrent
                  ? 'bg-primary/15 text-primary font-bold shadow-xs'
                  : 'text-muted hover:text-ink font-medium'
              }`}
            >
              <item.Icon className={`h-4 w-4 transition-transform ${isCurrent ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setShowMoreMenu(true)}
          className={`ios-press flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] tracking-tight transition-all duration-200 cursor-pointer ${
            isDropdownActive
              ? 'bg-primary/15 text-primary font-bold shadow-xs'
              : 'text-muted hover:text-ink font-medium'
          }`}
          aria-expanded={showMoreMenu}
          aria-label="More Dhikrly pages"
        >
          <MoreHorizontal className={`h-4 w-4 transition-transform ${isDropdownActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {/* ── Mobile Bottom Sheet Drawer (iOS Presentation Sheet) ── */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-md md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreMenu(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[85dvh] overflow-y-auto rounded-t-[34px] border-t border-white/50 dark:border-white/12 bg-white/92 dark:bg-[#1c1c1e]/92 backdrop-blur-3xl p-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/20 dark:bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--app-ink)] tracking-tight">Explore Dhikrly</h3>
                <p className="text-xs text-muted">All spiritual companions for your daily deen</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--app-border)] bg-black/5 dark:bg-white/10 text-muted hover:text-ink cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {HUB_CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                    {cat.title}
                  </h4>
                  <div className="grid gap-2">
                    {cat.items.map((item) => {
                      const isCurrent =
                        active === item.section ||
                        (item.section === 'ramadan' && active === 'ramadhan') ||
                        (item.section === 'adhkar' && active === 'adhkaar');

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMoreMenu(false)}
                          className={`ios-press flex items-center gap-3.5 rounded-2xl border p-3 no-underline transition-all cursor-pointer ${
                            isCurrent
                              ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-[var(--app-border)] bg-black/[0.02] hover:bg-black/[0.05] dark:bg-white/[0.03] dark:hover:bg-white/[0.07]'
                          }`}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                            <item.Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-[var(--app-ink)]">{item.label}</span>
                            <span className="block text-xs text-muted truncate">{item.desc}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-[var(--app-border)]">
              <a
                href="https://buymeacoffee.com/nazrulislambhat"
                target="_blank"
                rel="noopener noreferrer"
                className="ios-press flex items-center justify-center gap-2 w-full rounded-2xl py-3 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs no-underline cursor-pointer"
              >
                <Coffee className="h-4 w-4" />
                <span>Support Dhikrly</span>
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
