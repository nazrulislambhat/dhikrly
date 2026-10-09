'use client';

import Link from 'next/link';
import { useEffect } from 'react';

type AppSection = 'adhkar' | 'salah' | 'quran';

interface AppShellProps {
  active: AppSection;
  dark: boolean;
  onToggleDark: () => void;
  children: React.ReactNode;
}

const navItems: { href: string; label: string; section: AppSection; icon: string }[] = [
  { href: '/', label: 'Adhkār', section: 'adhkar', icon: '✳' },
  { href: '/salah', label: 'Ṣalāh', section: 'salah', icon: '◷' },
  { href: '/quran', label: 'Qur’an', section: 'quran', icon: '۞' },
];

export default function AppShell({
  active,
  dark,
  onToggleDark,
  children,
}: AppShellProps) {
  const muted = dark ? 'text-stone-400' : 'text-stone-500';
  const surface = dark
    ? 'border-white/[0.08] bg-[#101f32]'
    : 'border-stone-200/80 bg-white/90';

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#0b1724' : '#f6f5f1');
  }, [dark]);

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${surface}`}>
        <Link href="/" className="app-brand" aria-label="Dhikrly home">
          <span className="app-brand-mark" aria-hidden="true">ذ</span>
          <span>
            <span className="app-brand-name">Dhikrly</span>
            <span className={`app-brand-caption ${muted}`}>A little, every day</span>
          </span>
        </Link>

        <p className={`app-nav-caption ${muted}`}>YOUR PRACTICE</p>
        <nav className="app-sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active === item.section ? 'page' : undefined}
              className={`app-nav-item ${active === item.section ? 'is-active' : ''} ${muted}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              {active === item.section && <span className="app-nav-indicator" />}
            </Link>
          ))}
        </nav>

        <div className={`app-sidebar-note ${muted}`}>
          <span className="font-arabic" lang="ar" dir="rtl">بِسْمِ اللَّهِ</span>
          <span>Make space for remembrance.</span>
        </div>
        <button type="button" className={`app-theme-toggle ${muted}`} onClick={onToggleDark}>
          <span aria-hidden="true">{dark ? '☼' : '☾'}</span>
          {dark ? 'Use light appearance' : 'Use dark appearance'}
        </button>
      </aside>

      <main className="app-shell-main">
        <div className="app-mobile-brand">
          <Link href="/" className="app-brand" aria-label="Dhikrly home">
            <span className="app-brand-mark" aria-hidden="true">ذ</span>
            <span className="app-brand-name">Dhikrly</span>
          </Link>
          <span className={`text-xs ${muted}`}>A little, every day</span>
          <button
            type="button"
            className="app-mobile-theme"
            onClick={onToggleDark}
            aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}
            title={dark ? 'Use light appearance' : 'Use dark appearance'}
          >
            {dark ? '☼' : '☾'}
          </button>
        </div>
        {children}
      </main>

      <nav className={`app-bottom-nav ${surface}`} aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active === item.section ? 'page' : undefined}
            className={`app-bottom-nav-item ${active === item.section ? 'is-active' : ''}`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
