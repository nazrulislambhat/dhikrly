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
  const surface = 'border-border bg-surface/90 backdrop-blur-xl';

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
      ?.setAttribute('content', dark ? '#0b0f0d' : '#f8faf8');
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
    <div className="min-h-dvh flex flex-col">
      <UpdateBanner dark={dark} />

      {/* Global Quick Search Command Palette */}
      <CommandPaletteModal
        dark={dark}
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* ── Responsive Header (Visible on Tablets & Desktops: md:flex) ── */}
      <header
        className={`hidden md:sticky md:top-0 md:z-40 md:flex md:h-[4.75rem] md:items-center md:border-b md:backdrop-blur-xl ${surface} transition-colors`}
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
                className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-dhikr-700 via-dhikr-800 to-dhikr-900 text-xl font-bold text-white shadow-md transition-transform group-hover:scale-105 dark:from-dhikr-400 dark:via-dhikr-500 dark:to-dhikr-600 dark:text-dhikr-950 dark:shadow-dhikr-950/40"
                aria-hidden="true"
              >
                ذ
              </span>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-noor-400 border-2 border-[var(--app-surface)]" />
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

          {/* Quick Search Trigger (Cmd+K) */}
          <button
            type="button"
            onClick={() => setShowCommandPalette(true)}
            className="hidden lg:flex items-center gap-2 rounded-2xl border border-border bg-surface text-muted hover:text-ink hover:border-primary/40 px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Search tools, prayers and duas (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5 text-primary" />
            <span>Quick Search</span>
            <span className="inline-flex items-center gap-0.5 rounded-lg border border-border px-1.5 py-0.2 text-[10px] font-mono text-muted">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          {/* Main 4 Navigation Tabs */}
          <nav className="flex items-center gap-1 py-1" aria-label="Main navigation">
            {mainNavItems.map((item) => {
              const isCurrent =
                active === item.section ||
                (item.section === 'adhkar' && active === 'adhkaar');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold no-underline transition-all ${
                    isCurrent
                      ? 'bg-primary/15 text-primary shadow-xs'
                      : 'text-muted hover:bg-surface-hover hover:text-ink'
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
                className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${
                  isDropdownActive
                    ? 'bg-primary/15 text-primary shadow-xs'
                    : 'text-muted hover:bg-surface-hover hover:text-ink'
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
                  className="absolute right-0 top-full mt-2 w-[34rem] rounded-3xl border border-border bg-surface/98 text-ink p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2 pb-3 mb-2 border-b border-[var(--app-line)] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-dhikr-700 dark:text-dhikr-400">
                        Explore Dhikrly
                      </span>
                      <p className="text-[11px] text-sakinah-400">All spiritual tools for your daily deen</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopDropdownOpen(false);
                        setShowCommandPalette(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--app-line)] px-2.5 py-1 text-[11px] font-semibold text-sakinah-400 hover:text-sakinah-700 dark:hover:text-sakinah-200"
                    >
                      <Search className="h-3 w-3" />
                      <span>Search All</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[25rem] overflow-y-auto pr-1">
                    {HUB_CATEGORIES.map((cat) => (
                      <div key={cat.title} className="space-y-1">
                        <span className="block px-2 text-[10px] font-extrabold uppercase tracking-wider text-sakinah-400">
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
                              className={`flex items-start gap-2.5 rounded-xl p-2 text-xs no-underline transition-colors ${
                                isCurrent
                                  ? 'bg-dhikr-500/15 text-dhikr-900 dark:text-dhikr-200 font-bold'
                                  : 'hover:bg-dhikr-500/10 text-sakinah-700 dark:text-sakinah-300'
                              }`}
                            >
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-dhikr-50 text-dhikr-700 dark:bg-dhikr-500/15 dark:text-dhikr-300 mt-0.5">
                                <item.Icon className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold leading-tight truncate">{item.label}</p>
                                <p className="text-[10px] text-sakinah-400 leading-tight truncate mt-0.5">{item.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--app-line)] flex items-center justify-between">
                    <a
                      href="https://buymeacoffee.com/nazrulislambhat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl py-2 px-3 text-xs font-bold text-noor-950 bg-noor-400/20 hover:bg-noor-400/35 dark:bg-noor-400/15 dark:text-noor-200 transition-colors no-underline"
                    >
                      <Coffee className="h-3.5 w-3.5 text-noor-600 dark:text-noor-400" />
                      <span>Support Dhikrly</span>
                    </a>

                    <Link
                      href="/settings"
                      onClick={() => setDesktopDropdownOpen(false)}
                      className="text-xs font-semibold text-dhikr-700 dark:text-dhikr-400 hover:underline"
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
              className={`flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--app-line)] px-3 text-xs font-bold transition-all hover:bg-dhikr-500/10 ${
                active === 'settings'
                  ? 'bg-dhikr-50 text-dhikr-800 dark:bg-dhikr-500/15 dark:text-dhikr-200'
                  : muted
              }`}
            >
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden xl:inline">Profile</span>
            </Link>

            <button
              type="button"
              className={`flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--app-line)] px-3 text-xs font-bold transition-all hover:bg-dhikr-500/10 ${muted}`}
              onClick={onToggleDark}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{dark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="min-h-dvh min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
        {/* Mobile Top Header (Visible on screens < 768px: md:hidden) */}
        <div className="sticky top-0 z-30 flex min-h-[4.25rem] items-center border-b border-[var(--app-line)] bg-[var(--app-bg)]/90 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex h-full w-full items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5 no-underline" aria-label="Dhikrly home">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-dhikr-700 to-dhikr-900 text-lg font-bold text-white shadow-sm dark:from-dhikr-400 dark:to-dhikr-600 dark:text-dhikr-950" aria-hidden="true">
                ذ
              </span>
              <span className="text-lg font-extrabold tracking-tight text-[var(--app-ink)] font-display">
                Dhikrly
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Quick Search in Mobile Header */}
              <button
                type="button"
                onClick={() => setShowCommandPalette(true)}
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--app-line)] bg-[var(--app-surface)] text-sakinah-500 hover:text-sakinah-900 dark:hover:text-sakinah-100 shadow-xs"
                aria-label="Open search command palette"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--app-line)] bg-[var(--app-surface)] text-dhikr-800 dark:text-dhikr-200 shadow-xs"
                onClick={onToggleDark}
                aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}
                title={dark ? 'Use light appearance' : 'Use dark appearance'}
              >
                {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {children}
      </main>

      {/* ── Mobile Floating Bottom Dock (Screens < 768px: md:hidden) ── */}
      <nav
        className={`fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 gap-1 rounded-3xl border p-1.5 shadow-2xl backdrop-blur-2xl md:hidden ${surface}`}
        aria-label="Main mobile navigation"
      >
        {mainNavItems.map((item) => {
          const isCurrent = active === item.section || (item.section === 'adhkar' && active === 'adhkaar');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold no-underline transition-all ${
                isCurrent
                  ? 'bg-primary/15 text-primary shadow-xs'
                  : 'text-muted hover:text-ink'
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
          className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold transition-all cursor-pointer ${
            isDropdownActive
              ? 'bg-primary/15 text-primary shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
          aria-expanded={showMoreMenu}
          aria-label="More Dhikrly pages"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {/* ── Mobile Bottom Sheet Drawer ── */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreMenu(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-[var(--app-line)] bg-[var(--app-surface)] p-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-sakinah-300 dark:bg-sakinah-700" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[var(--app-ink)]">Explore Dhikrly</h3>
                <p className="text-xs text-[var(--app-muted)]">All daily tools for your deen</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--app-line)] text-sakinah-500 hover:text-sakinah-900 dark:hover:text-sakinah-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {HUB_CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <h4 className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-sakinah-400">
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
                          className={`flex items-center gap-3.5 rounded-2xl border p-3 no-underline transition-all ${
                            isCurrent
                              ? 'border-dhikr-500/40 bg-dhikr-500/10 text-dhikr-900 dark:text-dhikr-200'
                              : 'border-[var(--app-line)] bg-black/5 hover:bg-dhikr-500/5 dark:bg-white/[0.03]'
                          }`}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-dhikr-50 text-dhikr-800 dark:bg-dhikr-500/20 dark:text-dhikr-200">
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
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-[var(--app-line)]">
              <a
                href="https://buymeacoffee.com/nazrulislambhat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 px-4 text-xs font-bold text-noor-950 bg-noor-400/25 hover:bg-noor-400/40 dark:bg-noor-400/15 dark:text-noor-200 transition-colors shadow-xs no-underline"
              >
                <Coffee className="h-4 w-4 text-noor-600 dark:text-noor-400" />
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
