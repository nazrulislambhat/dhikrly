'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  BookOpen,
  Sparkles,
  Clock3,
  Home,
  ArrowRight,
  LineChart,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, SETTINGS_KEY } from '@/lib/storage';

export default function NotFoundPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const quickLinks = [
    {
      title: 'Daily Adhkār',
      desc: 'Morning and evening remembrances & Fortress of the Muslim',
      href: '/',
      icon: Sparkles,
      badge: 'Home',
    },
    {
      title: 'The Holy Qur’an',
      desc: 'Read, listen, and track your daily verse recitation',
      href: '/quran',
      icon: BookOpen,
      badge: 'Reader',
    },
    {
      title: 'Ṣalāh Tracker',
      desc: 'Check prayer times and log your daily prayers',
      href: '/salah',
      icon: Clock3,
      badge: 'Prayer',
    },
    {
      title: 'Qibla Direction',
      desc: 'Accurate compass pointing directly to the Ka’bah',
      href: '/qibla',
      icon: Compass,
      badge: 'Compass',
    },
  ];

  return (
    <AppShell active="home" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto flex min-h-[75vh] w-[min(calc(100%-2rem),48rem)] flex-col items-center justify-center py-12 text-center">
        {/* Quranic Ayah of Guidance */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <span>Surah Ad-Duha · 93:7</span>
        </div>

        <p className="font-arabic text-2xl sm:text-3xl font-bold leading-relaxed text-emerald-900 dark:text-emerald-200">
          وَوَجَدَكَ ضَالًّا فَهَدَىٰ
        </p>
        <p className="mt-1 text-xs italic text-[var(--app-muted)]">
          “And He found you lost and guided you.”
        </p>

        {/* 404 Headline */}
        <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--app-ink)]">
          Page Not Found
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--app-muted)]">
          The path you are seeking does not exist or may have been relocated.
          Return to remembrance, prayer, or your Qur’an recitation.
        </p>

        {/* Quick Back Home button */}
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Destination Grid */}
        <div className="mt-10 grid w-full grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-4 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-xs transition-all hover:border-emerald-500/30 hover:shadow-sm dark:bg-[#14211e]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[var(--app-ink)] group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h2>
                    <ArrowRight className="h-4 w-4 text-[var(--app-muted)] transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--app-muted)] line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
