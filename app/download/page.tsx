'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Apple,
  Smartphone,
  Laptop,
  Monitor,
  Download,
  Sparkles,
  Zap,
  Cloud,
  ShieldCheck,
  WifiOff,
  Bell,
  CheckCircle2,
  ChevronRight,
  Share2,
  Copy,
  Check,
  ArrowRight,
  RotateCw,
  Sliders,
  Compass,
  BookOpen,
  CalendarCheck,
  CircleDot,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallPlatform = 'ios' | 'android' | 'mac' | 'windows';

export default function DownloadPage() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<InstallPlatform>('ios');
  const [copiedLink, setCopiedLink] = useState(false);

  // Waitlist form state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistPlatforms, setWaitlistPlatforms] = useState<{
    ios: boolean;
    android: boolean;
    mac: boolean;
  }>({ ios: true, android: false, mac: true });
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(4829);

  // FAQ open toggles
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const settings = load<{ dark: boolean }>(SETTINGS_KEY, { dark: false });
    setDark(settings.dark);
    document.documentElement.classList.toggle('dark', settings.dark);

    // Standalone PWA detection
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    // Auto-detect visitor's platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setSelectedGuide('ios');
      setWaitlistPlatforms({ ios: true, android: false, mac: false });
    } else if (/android/.test(ua)) {
      setSelectedGuide('android');
      setWaitlistPlatforms({ ios: false, android: true, mac: false });
    } else if (/macintosh|mac os x/.test(ua)) {
      setSelectedGuide('mac');
      setWaitlistPlatforms({ ios: true, android: false, mac: true });
    } else if (/windows/.test(ua)) {
      setSelectedGuide('windows');
      setWaitlistPlatforms({ ios: false, android: true, mac: false });
    }

    // Check existing waitlist submission in localStorage
    const savedWaitlist = load<{ email: string; submitted: boolean } | null>(
      'dhikrly_native_waitlist_v1',
      null,
    );
    if (savedWaitlist?.submitted) {
      setWaitlistSubmitted(true);
      setWaitlistEmail(savedWaitlist.email);
    }

    // PWA install prompt handler
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const handleToggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      save(SETTINGS_KEY, { ...load(SETTINGS_KEY, {}), dark: next });
      return next;
    });
  };

  const handleTriggerInstall = async () => {
    if (!installPrompt) {
      // If prompt not natively available, scroll smoothly to the manual guide
      const el = document.getElementById('install-guide-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setInstallPrompt(null);
    } catch {
      // ignore
    }
  };

  const handleCopyShareLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    save('dhikrly_native_waitlist_v1', {
      email: waitlistEmail,
      platforms: waitlistPlatforms,
      submitted: true,
      timestamp: Date.now(),
    });
    setWaitlistSubmitted(true);
    setWaitlistCount((prev) => prev + 1);
  };

  const cardClass = 'rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs transition-all';

  return (
    <div className="min-h-dvh text-ink">
      <AppShell active="download" dark={dark} onToggleDark={handleToggleDark}>
        <div className="mx-auto w-[min(calc(100%-2rem),76rem)] px-2 py-6 sm:py-10 lg:px-4 space-y-10 sm:space-y-12">
          
          {/* ── Standalone Mode Banner (if already installed) ── */}
          {isStandalone && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs font-bold text-primary shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  You are currently running the installed Dhikrly PWA. Your sanctuary is 100% active, offline-ready & synced!
                </span>
              </div>
              <Link
                href="/"
                className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-primary-fg hover:bg-primary-hover no-underline text-[11px] font-bold cursor-pointer"
              >
                Go to Adhkār →
              </Link>
            </div>
          )}

          {/* ── Hero Section ── */}
          <header className={`${cardClass} relative overflow-hidden text-center sm:text-left`}>
            {/* Ambient Background Glow */}
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-link/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10 max-w-4xl mx-auto sm:mx-0 space-y-5">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Native Apps in Development · PWA Available Worldwide</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-ink leading-[1.1]">
                Carry Dhikrly On <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary via-emerald-500 to-link bg-clip-text text-transparent">
                  Every Screen You Own.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-ink/80 max-w-2xl leading-relaxed">
                Native apps for <strong>Apple iOS</strong>, <strong>Android</strong>, and <strong>macOS</strong> are currently being crafted. In the meantime, you don’t have to wait: install our <strong>Progressive Web App (PWA)</strong> today — it installs in seconds, works 100% offline, and seamlessly syncs across all your devices in real-time.
              </p>

              {/* Quick Actions & CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <Link
                  href="/"
                  className="ios-press inline-flex items-center justify-center gap-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-primary-fg font-extrabold text-sm px-6 py-3.5 shadow-lg shadow-primary/20 no-underline cursor-pointer"
                >
                  <Zap className="h-4 w-4" />
                  <span>Launch Web App (PWA)</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className="ios-press inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface hover:bg-surface-hover text-ink font-bold text-sm px-5 py-3.5 shadow-xs cursor-pointer"
                >
                  <Download className="h-4 w-4 text-primary" />
                  <span>{installPrompt ? 'Install App (1-Click)' : 'Installation Guide'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="ios-press inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface hover:bg-surface-hover text-ink font-semibold text-xs px-4 py-3.5 shadow-xs cursor-pointer"
                  title="Copy link to install on other devices"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span className="text-primary font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5 text-muted" />
                      <span>Share / Sync to Device</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Capabilities Ticker */}
              <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs font-semibold text-muted">
                <div className="flex items-center gap-1.5">
                  <Cloud className="h-3.5 w-3.5 text-primary" />
                  <span>Real-Time Cloud Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <WifiOff className="h-3.5 w-3.5 text-primary" />
                  <span>Works 100% Offline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>0 MB Storage Bloat · Ad-Free</span>
                </div>
              </div>
            </div>
          </header>

          {/* ── Featured Showcase: Live PWA vs Coming Soon Native Apps ── */}
          <section className="space-y-4" aria-labelledby="platforms-heading">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  PLATFORM AVAILABILITY
                </span>
                <h2 id="platforms-heading" className="text-2xl sm:text-3xl font-extrabold text-ink">
                  Native Apps & Instant PWA
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted max-w-md">
                One unified account. When the native apps launch, all your streaks, counts, and settings will instantly carry over.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Progressive Web App (PWA) - LIVE TODAY */}
              <div className="relative rounded-3xl border-2 border-primary/50 bg-gradient-to-b from-primary/10 via-surface to-surface p-6 shadow-md flex flex-col justify-between group hover:border-primary transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-fg shadow-sm">
                      <Sparkles className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-primary/20 border border-primary/40 px-2.5 py-1 text-[11px] font-extrabold text-primary uppercase tracking-wide">
                      ● Live Now
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-ink">Dhikrly Web App (PWA)</h3>
                    <p className="text-xs text-primary font-bold mt-0.5">Instant Install on Any Device</p>
                  </div>

                  <p className="text-xs text-ink/75 leading-relaxed">
                    Zero app store downloads needed. Add directly to your home screen or desktop dock with offline support, adhan audio, and real-time Supabase sync.
                  </p>

                  <ul className="space-y-2 text-xs text-ink/80 pt-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Full screen native-like view</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>100% offline service worker</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Instant cloud synchronization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>No manual updates needed</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-4 border-t border-border">
                  <Link
                    href="/"
                    className="ios-press flex items-center justify-center gap-2 w-full rounded-2xl bg-primary text-primary-fg hover:bg-primary-hover font-bold text-xs py-3 shadow-sm no-underline cursor-pointer"
                  >
                    <span>Use PWA Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* 2. Apple iOS (iPhone & iPad) - COMING SOON */}
              <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between group hover:border-border/80 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-black/5 dark:bg-white/10 text-ink">
                      <Apple className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-link/15 border border-link/30 px-2.5 py-1 text-[11px] font-extrabold text-link uppercase tracking-wide">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-ink">Apple iOS</h3>
                    <p className="text-xs text-muted font-medium mt-0.5">iPhone, iPad & Apple Watch</p>
                  </div>

                  <p className="text-xs text-ink/75 leading-relaxed">
                    Engineered in native Swift and SwiftUI. Deeply integrated with Apple ecosystem features for effortless daily remembrance.
                  </p>

                  <ul className="space-y-2 text-xs text-ink/80 pt-1">
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Live Activities & Dynamic Island</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Lock & Home Screen Widgets</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Apple Watch Crown Tasbīḥ</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Siri Shortcuts & Action Button</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-4 border-t border-border">
                  <a
                    href="#waitlist-section"
                    onClick={() => setWaitlistPlatforms({ ios: true, android: false, mac: false })}
                    className="ios-press flex items-center justify-center gap-2 w-full rounded-2xl border border-border bg-surface-hover hover:border-link/50 text-ink font-bold text-xs py-3 no-underline cursor-pointer"
                  >
                    <span>Join TestFlight Waitlist</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted" />
                  </a>
                </div>
              </div>

              {/* 3. Google Android - COMING SOON */}
              <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between group hover:border-border/80 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-black/5 dark:bg-white/10 text-ink">
                      <Smartphone className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-link/15 border border-link/30 px-2.5 py-1 text-[11px] font-extrabold text-link uppercase tracking-wide">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-ink">Android</h3>
                    <p className="text-xs text-muted font-medium mt-0.5">Phones, Tablets & WearOS</p>
                  </div>

                  <p className="text-xs text-ink/75 leading-relaxed">
                    Built for modern Android 14+ with Material You dynamic color theming, battery-optimized background Azan alerts, and Glance widgets.
                  </p>

                  <ul className="space-y-2 text-xs text-ink/80 pt-1">
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Material You Dynamic Theming</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Persistent Notification Azan Alert</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>WearOS Companion Tile</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Pure AMOLED Black Energy Saver</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-4 border-t border-border">
                  <a
                    href="#waitlist-section"
                    onClick={() => setWaitlistPlatforms({ ios: false, android: true, mac: false })}
                    className="ios-press flex items-center justify-center gap-2 w-full rounded-2xl border border-border bg-surface-hover hover:border-link/50 text-ink font-bold text-xs py-3 no-underline cursor-pointer"
                  >
                    <span>Pre-Register Google Play</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted" />
                  </a>
                </div>
              </div>

              {/* 4. Apple macOS - COMING SOON */}
              <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between group hover:border-border/80 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-black/5 dark:bg-white/10 text-ink">
                      <Laptop className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-link/15 border border-link/30 px-2.5 py-1 text-[11px] font-extrabold text-link uppercase tracking-wide">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-ink">Apple macOS</h3>
                    <p className="text-xs text-muted font-medium mt-0.5">Apple Silicon M1-M4 & Intel</p>
                  </div>

                  <p className="text-xs text-ink/75 leading-relaxed">
                    A refined desktop companion that sits gracefully in your menu bar. Quick prayer reminders, ambient audio player, and global hotkeys.
                  </p>

                  <ul className="space-y-2 text-xs text-ink/80 pt-1">
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Menu Bar Prayer Countdown</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Global ⌘K and Spacebar Tasbeeh</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Multi-window Mushaf Tadabbur</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-link shrink-0" />
                      <span>Liquid Glass Native Sonoma UI</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-4 border-t border-border">
                  <a
                    href="#waitlist-section"
                    onClick={() => setWaitlistPlatforms({ ios: false, android: false, mac: true })}
                    className="ios-press flex items-center justify-center gap-2 w-full rounded-2xl border border-border bg-surface-hover hover:border-link/50 text-ink font-bold text-xs py-3 no-underline cursor-pointer"
                  >
                    <span>Join Mac Beta List</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted" />
                  </a>
                </div>
              </div>

            </div>
          </section>

          {/* ── Seamless Real-Time Sync Showcase ── */}
          <section className={`${cardClass} overflow-hidden`} aria-labelledby="sync-heading">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>REAL-TIME SUPABASE CLOUD ARCHITECTURE</span>
                </div>
                
                <h2 id="sync-heading" className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                  Start on PWA Today. <br />
                  Everything Stays In Perfect Harmony.
                </h2>

                <p className="text-sm sm:text-base text-ink/80 leading-relaxed">
                  When you read your morning adhkār on your iPhone, check off missed prayers on your Mac at work, or chant subḥānallāh on your tablet, your progress is instantly synchronized across all your devices via our secure cloud database.
                </p>

                <p className="text-xs sm:text-sm text-muted">
                  And best of all: <strong>When our native iOS and Android apps launch, your existing Dhikrly account will connect right in</strong> — zero manual export, zero lost streaks, and zero data friction.
                </p>

                {/* Sync Item Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas p-2.5 text-xs font-bold text-ink">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span>Adhkār Counts</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas p-2.5 text-xs font-bold text-ink">
                    <CircleDot className="h-4 w-4 text-primary shrink-0" />
                    <span>Tasbīḥ Counters</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas p-2.5 text-xs font-bold text-ink">
                    <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Qadā Repayments</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas p-2.5 text-xs font-bold text-ink">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <span>Qur’an Khatmah</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas p-2.5 text-xs font-bold text-ink">
                    <Sliders className="h-4 w-4 text-primary shrink-0" />
                    <span>Fiqh & Calculation</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas p-2.5 text-xs font-bold text-ink">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <span>Daily Streaks</span>
                  </div>
                </div>
              </div>

              {/* Visual Sync Diagram Card */}
              <div className="lg:col-span-5 rounded-2xl border border-border bg-canvas p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Active Sync Mesh</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    Live & Connected
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs font-bold text-ink">iPhone (PWA Safari)</p>
                        <p className="text-[10px] text-muted">Morning Adhkār: Completed</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-primary">Instant</span>
                  </div>

                  <div className="flex justify-center text-muted">
                    <RotateCw className="h-4 w-4 animate-spin text-primary/60" style={{ animationDuration: '6s' }} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
                    <div className="flex items-center gap-2.5">
                      <Laptop className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs font-bold text-ink">MacBook / Desktop</p>
                        <p className="text-[10px] text-muted">Ṣalāh Times & Qadā synced</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-primary">Synced</span>
                  </div>

                  <div className="flex justify-center text-muted">
                    <RotateCw className="h-4 w-4 animate-spin text-primary/60" style={{ animationDuration: '6s' }} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
                    <div className="flex items-center gap-2.5">
                      <Cloud className="h-4 w-4 text-link" />
                      <div>
                        <p className="text-xs font-bold text-ink">Upcoming Native Apps</p>
                        <p className="text-[10px] text-muted">Automatic day-one cloud import</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-link">Ready</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ── Interactive Step-by-Step PWA Installation Guide ── */}
          <section id="install-guide-section" className={`${cardClass} space-y-6`} aria-labelledby="guide-heading">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  1-MINUTE SETUP GUIDE
                </span>
                <h2 id="guide-heading" className="text-2xl sm:text-3xl font-extrabold text-ink">
                  How to Install the Web App Today
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted max-w-sm">
                Follow simple instructions for your current operating system to add Dhikrly right to your home screen or dock.
              </p>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-canvas border border-border" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={selectedGuide === 'ios'}
                onClick={() => setSelectedGuide('ios')}
                className={`flex-1 min-w-[7.5rem] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  selectedGuide === 'ios'
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-surface'
                }`}
              >
                <Apple className="h-3.5 w-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedGuide === 'android'}
                onClick={() => setSelectedGuide('android')}
                className={`flex-1 min-w-[7.5rem] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  selectedGuide === 'android'
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-surface'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Android</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedGuide === 'mac'}
                onClick={() => setSelectedGuide('mac')}
                className={`flex-1 min-w-[7.5rem] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  selectedGuide === 'mac'
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-surface'
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>Mac (Safari / Chrome)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedGuide === 'windows'}
                onClick={() => setSelectedGuide('windows')}
                className={`flex-1 min-w-[7.5rem] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  selectedGuide === 'windows'
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-surface'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Windows / Edge</span>
              </button>
            </div>

            {/* Guide Steps per Platform */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {selectedGuide === 'ios' && (
                <>
                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        1
                      </span>
                      <Share2 className="h-4 w-4 text-muted" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Tap Share in Safari</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Open <strong>Dhikrly</strong> in Safari on your iPhone or iPad. Tap the <strong>Share</strong> button (the square with an arrow pointing upwards) in the bottom toolbar.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        2
                      </span>
                      <Download className="h-4 w-4 text-muted" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Select 'Add to Home Screen'</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Scroll down through the share sheet options and tap <strong>‘Add to Home Screen’</strong> (marked with a square plus icon).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        3
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Tap 'Add' to Complete</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Tap <strong>‘Add’</strong> in the top-right corner. Dhikrly will appear right on your iOS Home Screen with its clean icon and full-screen khushū’ experience!
                    </p>
                  </div>
                </>
              )}

              {selectedGuide === 'android' && (
                <>
                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        1
                      </span>
                      <Smartphone className="h-4 w-4 text-muted" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Open Chrome Menu</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Visit <strong>Dhikrly</strong> in Chrome on your Android phone. Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        2
                      </span>
                      <Download className="h-4 w-4 text-muted" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Tap 'Install App'</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Select <strong>‘Install App’</strong> or <strong>‘Add to Home screen’</strong> from the dropdown menu list.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        3
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Launch from Drawer</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Confirm installation. Dhikrly is added to your app drawer and home screen with offline caching and background audio support.
                    </p>
                  </div>
                </>
              )}

              {selectedGuide === 'mac' && (
                <>
                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        1
                      </span>
                      <Apple className="h-4 w-4 text-muted" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">In Safari Sonoma+</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      In Safari (macOS Sonoma or Sequoia), click <strong>File</strong> in the top menu bar, then click <strong>‘Add to Dock…’</strong>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        2
                      </span>
                      <Laptop className="h-4 w-4 text-muted" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Or In Google Chrome</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Look at the right edge of the Chrome address bar and click the <strong>Install Dhikrly</strong> icon (or Menu → Save and Share → Install).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        3
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Standalone Window & Dock</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Dhikrly opens in its own discrete window without browser clutter, and stays pinned in your macOS Dock with instant launch!
                    </p>
                  </div>
                </>
              )}

              {selectedGuide === 'windows' && (
                <>
                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        1
                      </span>
                      <Monitor className="h-4 w-4 text-muted" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Open Edge or Chrome</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Visit <strong>Dhikrly</strong> in Microsoft Edge or Google Chrome on your Windows 10/11 computer.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        2
                      </span>
                      <Download className="h-4 w-4 text-muted" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Click Install in Address Bar</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Click the small monitor/down-arrow <strong>Install</strong> icon on the far right of the address URL bar.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-fg font-extrabold text-xs">
                        3
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-extrabold text-ink">Pin to Taskbar & Start Menu</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Click <strong>Install</strong>. Choose to pin to your Taskbar or Start Menu for one-click access alongside your work apps.
                    </p>
                  </div>
                </>
              )}

            </div>
          </section>

          {/* ── Feature Comparison Matrix ── */}
          <section className={`${cardClass} space-y-6`} aria-labelledby="comparison-heading">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                TRANSPARENT FEATURE PARITY
              </span>
              <h2 id="comparison-heading" className="text-2xl sm:text-3xl font-extrabold text-ink">
                How Web App & Native Apps Compare
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Our Progressive Web App already delivers 98% of the full spiritual sanctuary experience.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Sanctuary Feature</th>
                    <th className="py-3 px-3 text-primary">PWA (Live Now)</th>
                    <th className="py-3 px-3">iOS (Native)</th>
                    <th className="py-3 px-3">Android (Native)</th>
                    <th className="py-3 px-3">macOS (Native)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-ink">
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">Morning & Evening Adhkār Tracker</td>
                    <td className="py-3.5 px-3 font-bold text-primary">✅ Live & Active</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">Real-Time Cloud Account Sync</td>
                    <td className="py-3.5 px-3 font-bold text-primary">✅ Live & Active</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">100% Offline Service Worker</td>
                    <td className="py-3.5 px-3 font-bold text-primary">✅ Live & Active</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">Digital Tasbīḥ & Soundscapes</td>
                    <td className="py-3.5 px-3 font-bold text-primary">✅ Live & Active</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">Ṣalāh Times & Qibla Compass</td>
                    <td className="py-3.5 px-3 font-bold text-primary">✅ Live & Active</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">Noble Qur’an Recitations & Tafsīr</td>
                    <td className="py-3.5 px-3 font-bold text-primary">✅ Live & Active</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                    <td className="py-3.5 px-3 text-muted">🚀 Coming Soon</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">Dynamic Island & Live Activities</td>
                    <td className="py-3.5 px-3 text-muted">— Browser Limit</td>
                    <td className="py-3.5 px-3 font-bold text-link">Exclusive Native</td>
                    <td className="py-3.5 px-3 text-muted">—</td>
                    <td className="py-3.5 px-3 text-muted">—</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">Mac Menu Bar Resident Clock</td>
                    <td className="py-3.5 px-3 text-muted">— Browser Limit</td>
                    <td className="py-3.5 px-3 text-muted">—</td>
                    <td className="py-3.5 px-3 text-muted">—</td>
                    <td className="py-3.5 px-3 font-bold text-link">Exclusive Native</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-3 font-semibold">Apple Watch & WearOS Companions</td>
                    <td className="py-3.5 px-3 text-muted">— Browser Limit</td>
                    <td className="py-3.5 px-3 font-bold text-link">Watch App</td>
                    <td className="py-3.5 px-3 font-bold text-link">WearOS Tile</td>
                    <td className="py-3.5 px-3 text-muted">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Native Beta Waitlist Card ── */}
          <section id="waitlist-section" className={`${cardClass} relative overflow-hidden`} aria-labelledby="waitlist-heading">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-link/30 bg-link/10 px-3.5 py-1 text-xs font-bold text-link">
                <Bell className="h-3.5 w-3.5" />
                <span>NATIVE BETA ACCESS</span>
              </div>

              <h2 id="waitlist-heading" className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight font-display">
                Be the First to Test the Native Apps
              </h2>

              <p className="text-xs sm:text-sm text-ink/75 leading-relaxed">
                Join {waitlistCount.toLocaleString()} believers on our private TestFlight & Google Play pre-launch list. We will send an instant email invite the moment our first build passes review.
              </p>

              {waitlistSubmitted ? (
                <div className="p-6 rounded-2xl border border-primary/40 bg-primary/10 text-primary space-y-2 animate-fade-in">
                  <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-fg mx-auto shadow-sm">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-ink">Māshā’Allāh, You are on the Priority List!</h3>
                  <p className="text-xs text-ink/75">
                    We’ve reserved your spot for <strong>{waitlistEmail}</strong>. You will receive an invitation link as soon as our TestFlight / Play Store builds go live.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4 pt-2">
                  {/* Platform Checkboxes */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-ink">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={waitlistPlatforms.ios}
                        onChange={(e) =>
                          setWaitlistPlatforms((p) => ({ ...p, ios: e.target.checked }))
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <Apple className="h-3.5 w-3.5" />
                      <span>iOS TestFlight</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={waitlistPlatforms.android}
                        onChange={(e) =>
                          setWaitlistPlatforms((p) => ({ ...p, android: e.target.checked }))
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Google Play</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={waitlistPlatforms.mac}
                        onChange={(e) =>
                          setWaitlistPlatforms((p) => ({ ...p, mac: e.target.checked }))
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <Laptop className="h-3.5 w-3.5" />
                      <span>macOS Beta</span>
                    </label>
                  </div>

                  {/* Input and Submit */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address…"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="min-h-12 w-full rounded-2xl border border-border bg-canvas px-4 py-2 text-xs sm:text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="submit"
                      className="ios-press w-full sm:w-auto shrink-0 min-h-12 rounded-2xl bg-primary hover:bg-primary-hover text-primary-fg font-extrabold text-xs sm:text-sm px-6 py-2 shadow-md cursor-pointer transition-all"
                    >
                      Notify Me
                    </button>
                  </div>

                  <p className="text-[11px] text-muted">
                    Zero spam. Only important release notifications and early build invitations.
                  </p>
                </form>
              )}
            </div>
          </section>

          {/* ── Frequently Asked Questions ── */}
          <section className={`${cardClass} space-y-6`} aria-labelledby="faq-heading">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 id="faq-heading" className="text-2xl sm:text-3xl font-extrabold text-ink">
                Everything You Need to Know
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'What is a Progressive Web App (PWA)? Is it really as good as an App Store app?',
                  a: 'A Progressive Web App is a modern web application designed to run exactly like a native app. When added to your home screen or dock, it removes all browser URL bars, works completely offline, supports audio playback, and launches in full-screen. It is ultra-lightweight (< 5 MB) and never requires manual updates through the App Store.',
                },
                {
                  q: 'How does real-time sync work across all my phones and computers?',
                  a: 'When you sign in to your Dhikrly account, your completed morning/evening adhkār, tasbīḥ counts, missed prayer repayments, and Qur’an reading bookmarks synchronize seamlessly through Supabase. If you tap 33 Subḥānallāh on your phone, you can see it on your laptop.',
                },
                {
                  q: 'Will my historical streaks and data carry over when the native iOS/Android apps launch?',
                  a: 'Yes, 100%! The native iOS and Android apps connect directly to the same unified Dhikrly cloud database. The day you download the App Store or Google Play release, simply sign in with your email and all your historical data, streaks, and personal settings will be waiting for you.',
                },
                {
                  q: 'Does the web app work if I lose internet connection or put my phone in airplane mode?',
                  a: 'Yes. Dhikrly utilizes aggressive Service Worker caching and local IndexedDB storage. You can access all morning and evening remembrances, Ḥiṣn al-Muslim collections, and digital tasbīḥ counters in the middle of a flight or in underground transit without cellular service.',
                },
                {
                  q: 'Is Dhikrly free to use? Are there ads?',
                  a: 'Dhikrly is 100% ad-free and tracking-free. Sacred remembrance of Allāh should never be interrupted by commercial advertisements or trackers. The core adhkār, prayer times, tasbīḥ, and offline features are completely free for everyone.',
                },
              ].map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-canvas overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex items-center justify-between w-full p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-ink cursor-pointer hover:bg-surface"
                      aria-expanded={isOpen}
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
                          isOpen ? 'rotate-90 text-primary' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-ink/75 leading-relaxed border-t border-border/50 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Bottom Call To Action ── */}
          <footer className="text-center py-6 space-y-4">
            <h3 className="text-xl sm:text-2xl font-extrabold text-ink font-display">
              Begin Your Sacred Habit Today
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
              Join thousands of Muslims strengthening their daily connection with Allāh morning and evening.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="ios-press inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-hover text-primary-fg font-extrabold text-sm px-8 py-3.5 shadow-lg shadow-primary/20 no-underline cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Open Dhikrly Web App Now</span>
              </Link>
            </div>
          </footer>

        </div>
      </AppShell>
    </div>
  );
}
