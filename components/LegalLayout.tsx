'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Coffee, Moon, MoonStar, ShieldCheck, Sun } from 'lucide-react';
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
        <div className="mx-auto flex w-[min(calc(100%-2rem),72rem)] items-center justify-between px-2 lg:px-4 py-3.5">
          <Link
            href="/"
            className="flex items-center gap-3 text-primary transition-opacity hover:opacity-80"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-xl font-bold text-white shadow-sm" aria-hidden="true">ذ</span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight text-[var(--app-ink)]">Dhikrly</span>
              <span className="hidden sm:block -mt-0.5 text-[10px] text-[var(--app-muted)]">A little, every day</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--app-line)] text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              aria-label={dark ? 'Use light mode' : 'Use dark mode'}
              title={dark ? 'Use light mode' : 'Use dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href="/"
              className="rounded-xl border border-[var(--app-line)] px-3.5 py-2 text-xs font-semibold text-[var(--app-muted)] transition-colors hover:text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-[var(--app-line)] bg-[var(--app-surface)] py-10 sm:py-12">
        <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 lg:px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>LEGAL, PRIVACY & COMPLIANCE</span>
          </div>
          <h1 className="font-serif text-[clamp(28px,5vw,42px)] font-normal tracking-wide text-emerald-900 dark:text-emerald-200">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)] max-w-2xl">{subtitle}</p>
          <p className="mt-3 text-xs text-[var(--app-muted)]">
            Last updated: {lastUpdated}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 lg:px-4 py-10">
        <div className="max-w-3xl [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:border-b [&_h2]:border-[var(--app-line)] [&_h2]:pb-2 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-emerald-900 dark:[&_h2]:text-emerald-200 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-stone-800 dark:[&_h3]:text-stone-200 [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-[1.8] [&_p]:text-stone-700 dark:[&_p]:text-stone-300 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_li]:mb-1 [&_ul_li]:text-sm [&_ul_li]:leading-[1.8] [&_ul_li]:text-stone-700 dark:[&_ul_li]:text-stone-300 [&_a]:text-emerald-700 dark:[&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-emerald-800 dark:[&_a:hover]:text-emerald-300">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--app-line)] bg-[var(--app-surface)] py-8">
        <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 lg:px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-arabic text-lg text-primary/85">
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
              <a
                href="https://buymeacoffee.com/nazrulislambhat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold transition-colors hover:opacity-80"
              >
                <Coffee className="h-3.5 w-3.5 text-amber-500" />
                <span>Support Dhikrly</span>
              </a>
              <Link
                href="/tech"
                className="transition-colors hover:text-[var(--app-ink)]"
              >
                Tech & APIs
              </Link>
              <Link
                href="/"
                className="transition-colors hover:text-[var(--app-ink)]"
              >
                App
              </Link>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.producthunt.com/products/dhikrly/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-dhikrly"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block overflow-hidden rounded-[10px] shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1353959&theme=light"
                alt="Dhikrly - Adhkār, Qur’an & Ṣalāh | Product Hunt"
                style={{ width: '250px', height: '54px' }}
                width="250"
                height="54"
              />
            </a>
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
