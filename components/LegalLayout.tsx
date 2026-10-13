'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Moon, MoonStar, Sun } from 'lucide-react';
import { load, save, SETTINGS_KEY } from '@/lib/storage';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark ||
      document.documentElement.classList.contains('dark')
    );
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    const existing = load<{ dark: boolean; sound?: boolean }>(SETTINGS_KEY, {
      dark,
      sound: true,
    });
    save(SETTINGS_KEY, { ...existing, dark });
  }, [dark]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-ink)] transition-colors">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-[var(--app-line)] bg-[var(--app-surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-emerald-800 transition-opacity hover:opacity-80 dark:text-emerald-300"
          >
            <MoonStar className="h-5 w-5" aria-hidden="true" />
            <span className="font-serif text-[15px] font-semibold tracking-wide">
              Dhikrly
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-full border border-[var(--app-line)] text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              aria-label={dark ? 'Use light mode' : 'Use dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href="/"
              className="rounded-full border border-[var(--app-line)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)] transition-colors hover:text-[var(--app-ink)]"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-[var(--app-line)] bg-[var(--app-surface)] py-12">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700/70 dark:text-emerald-300/70">
            Dhikrly · https://dhikrly.com
          </p>
          <h1 className="font-serif text-[clamp(28px,5vw,42px)] font-normal tracking-wide text-emerald-900 dark:text-emerald-200">
            {title}
          </h1>
          <p className="mt-2 text-[13px] text-[var(--app-muted)]">{subtitle}</p>
          <p className="mt-4 text-[11px] text-[var(--app-muted)]">
            Last updated: {lastUpdated}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:border-b [&_h2]:border-[var(--app-line)] [&_h2]:pb-2 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-emerald-900 dark:[&_h2]:text-emerald-200 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-stone-800 dark:[&_h3]:text-stone-200 [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-[1.8] [&_p]:text-stone-700 dark:[&_p]:text-stone-300 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_li]:mb-1 [&_ul_li]:text-sm [&_ul_li]:leading-[1.8] [&_ul_li]:text-stone-700 dark:[&_ul_li]:text-stone-300 [&_a]:text-emerald-700 dark:[&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-emerald-800 dark:[&_a:hover]:text-emerald-300">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--app-line)] bg-[var(--app-surface)] py-8">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-arabic text-lg text-emerald-800/40 dark:text-emerald-200/40">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <div className="flex flex-wrap gap-5 text-[11px] font-semibold uppercase tracking-widest text-[var(--app-muted)]">
              <Link
                href="/about"
                className="transition-colors hover:text-[var(--app-ink)]"
              >
                About
              </Link>
              <Link
                href="/privacy-policy"
                className="transition-colors hover:text-[var(--app-ink)]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-[var(--app-ink)]"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:text-[var(--app-ink)]"
              >
                Contact
              </Link>
              <Link
                href="/"
                className="transition-colors hover:text-[var(--app-ink)]"
              >
                App
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--app-line)] pt-4">
            <p className="text-[10px] text-[var(--app-muted)]">
              © {new Date().getFullYear()} Dhikrly. All rights reserved.
            </p>
            <a
              className="text-[10px] text-emerald-700 dark:text-emerald-400 border-b border-emerald-700/30 dark:border-emerald-400/30 pb-0.5 transition-colors hover:opacity-80"
              href="https://stacknothing.com"
              target="_blank"
              rel="noreferrer"
            >
              StackNothing LLC
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
