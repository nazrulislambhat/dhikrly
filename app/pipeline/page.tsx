'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Cloud,
  Code,
  Coffee,
  Cpu,
  Crown,
  Database,
  ExternalLink,
  Flame,
  Hammer,
  HardDrive,
  Headphones,
  Laptop,
  Layers,
  Lock,
  Mic,
  Monitor,
  Radio,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';

interface ArchitectureItem {
  id: string;
  category: 'mobile' | 'backend' | 'ai' | 'security';
  title: string;
  status: string;
  tagline: string;
  icon: React.ElementType;
  description: string;
  specs: string;
  highlights: string[];
}

const ARCHITECTURE_PIPELINE: ArchitectureItem[] = [
  {
    id: 'native_ios',
    category: 'mobile',
    title: 'Native iOS & watchOS App (SwiftUI)',
    status: 'In Architecture & UI Flow',
    tagline: 'Lock-screen prayer countdown widgets, Apple Watch tasbih, Live Activities & Dynamic Island.',
    icon: Smartphone,
    description:
      'Engineered specifically for the Apple ecosystem using pure Swift 6 and SwiftUI. Enjoy glanceable prayer times on your lock screen, live countdowns in the Dynamic Island during Imsak and Iftar, and a wrist-friendly Apple Watch companion.',
    specs: 'Swift 6 / SwiftUI · WidgetKit · WatchConnectivity · Live Activities · CoreData',
    highlights: [
      'WidgetKit Lock Screen & Home Screen widgets: Real-time countdowns to next Salah & Makrooh window alerts.',
      'Dynamic Island & Live Activities: Active Iftar/Sahur countdowns and Sa‘at al-Istijābah Friday notifications.',
      'watchOS Companion App: Smooth digital crown and haptic tasbih counting without glancing at your phone.',
      'FaceID biometric authentication for spiritual journal and private missed prayer recovery logs.',
    ],
  },
  {
    id: 'native_android',
    category: 'mobile',
    title: 'Native Android & Wear OS App (Kotlin Compose)',
    status: 'In Architecture & UI Flow',
    tagline: 'Exact-alarm Adhan alerts, Material You dynamic theming, and Wear OS complication tiles.',
    icon: Smartphone,
    description:
      'Built natively for Android with Kotlin and Jetpack Compose. Utilizes Android exact alarm APIs so your Adhan notifications wake you reliably for Fajr even under aggressive OEM battery killers and Doze mode.',
    specs: 'Kotlin · Jetpack Compose · AlarmManager / WorkManager · Wear OS Tiles & Health Connect',
    highlights: [
      'High-priority exact alarm Adhan engine that bypasses aggressive OEM battery killing and Doze mode.',
      'Material You Dynamic Color theming: Beautifully harmonizes with your device wallpaper and palette.',
      'Wear OS Watch Tiles & Complications: 1-tap quick tasbih counter and next prayer tile on your wrist.',
      'Fingerprint / BiometricPrompt security for your private spiritual notes and zakat entries.',
    ],
  },
  {
    id: 'native_macos',
    category: 'mobile',
    title: 'Native macOS Menu Bar Companion',
    status: 'Prototyping Phase',
    tagline: 'Glanceable prayer clock in your Mac menu bar, global hotkey tasbih, and ambient focus.',
    icon: Laptop,
    description:
      'A lightweight desktop companion that sits in your macOS menu bar. Never lose track of Asr or Maghrib while working, and trigger quick daily adhkār with a single keyboard shortcut.',
    specs: 'SwiftUI · AppKit menu bar status item · Native macOS audio engine · Zero telemetry',
    highlights: [
      'Menu Bar countdown: Subtly displays time remaining until next Salah right next to your system clock.',
      'Global Hotkey (⌥+Space): Instantly pop open the Hisn al-Muslim library or tasbih counter over any full-screen app.',
      'Native Control Center Media Integration: Control studio ambient soundscapes with zero CPU overhead.',
      'Floating study window with complete offline Mushaf reader and tafsir split-view.',
    ],
  },
  {
    id: 'backend_gateway',
    category: 'backend',
    title: 'Dedicated Scalable Backend (Go / Rust)',
    status: 'RFC & Design Specification',
    tagline: 'High-throughput microservices for native mobile APIs, low-latency sync & Whisper AI.',
    icon: Server,
    description:
      'Transitioning from pure edge serverless functions to a dedicated, high-concurrency Go / Rust backend. Powers real-time family Khatmah WebSockets, instant Adhan push distribution, and GPU-accelerated Quran speech analysis.',
    specs: 'Go / Rust · gRPC & OpenAPI 3.1 · TimescaleDB & Redis Cluster · Cloudflare R2',
    highlights: [
      'Ultra-fast API Gateway: gRPC and HTTP/3 endpoints optimized for native iOS, Android, and Web clients.',
      'Whisper AI Speech Cluster: Dedicated GPU inference workers for real-time Quran memorization checks.',
      'Sub-millisecond prayer times caching using Redis and astronomical Ephemeris calculation engines.',
      'Zero-knowledge encryption protocol: Client-side AES-256 with cryptographically blinded cloud storage.',
    ],
  },
  {
    id: 'whisper_cluster',
    category: 'ai',
    title: 'Whisper v3 GPU Speech Inference Pods',
    status: 'Model Benchmarking',
    tagline: 'Low-latency Arabic phoneme recognition cluster with zero recording retention.',
    icon: Mic,
    description:
      'Dedicated GPU worker nodes running optimized ONNX runtime for Arabic Quran recitation analysis. Evaluates pronunciation and verse recall in under 120ms without saving or logging audio recordings.',
    specs: 'OpenAI Whisper v3 / Vosk · ONNX Runtime GPU · Zero voice retention policy',
    highlights: [
      'Sub-150ms recitation alignment for real-time Ayah fading ("Mist Mode").',
      'Arabic phoneme and tajweed hesitation detection engine.',
      'Ephemeral memory processing: Audio frames are processed in memory and discarded immediately.',
    ],
  },
  {
    id: 'zk_security',
    category: 'security',
    title: 'Zero-Knowledge Client-Side Encryption',
    status: 'Security Review',
    tagline: 'End-to-end encrypted spiritual journal and personal notes synced securely.',
    icon: Lock,
    description:
      'Your private prayers, emotional du‘ā notes, and missed prayer logs are encrypted on your local device before reaching our database. Only your secret key can decrypt them.',
    specs: 'Web Crypto API · AES-256-GCM · PBKDF2 with 600,000 hash iterations',
    highlights: [
      'End-to-end zero-knowledge envelope encryption.',
      'Database administrators and server workers cannot read user notes or logs.',
      'Seamless multi-device key exchange via secure QR pairing.',
    ],
  },
];

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1 · Q1-Q2 2026',
    title: 'PWA Hardening & Audio Engine',
    status: 'In Active Engineering',
    items: [
      'Zero-knowledge encrypted cloud sync alpha',
      'Studio ambient Haramayn stems & multi-track mixer',
      'Enhanced PWA performance & instant offline loading',
      'Full Makrooh prayer windows & worldwide masjid locator',
    ],
  },
  {
    phase: 'Phase 2 · Q2-Q3 2026',
    title: 'AI Hifdh Coach & Native Prototypes',
    status: 'Research & Prototyping',
    items: [
      'Whisper speech recognition worker cluster setup',
      'Native iOS SwiftUI & Android Compose initial prototypes',
      '“Mist Mode” (Tadrij) interactive ayah fading',
      'Early access beta release for student sponsors',
    ],
  },
  {
    phase: 'Phase 3 · Q3-Q4 2026',
    title: 'Dedicated Backend & App Store Launches',
    status: 'Planned',
    items: [
      'Go / Rust high-performance dedicated API Gateway',
      'Native iOS app on App Store (WidgetKit & Dynamic Island)',
      'Native Android app on Google Play (Exact Alarms & Wear OS)',
      'macOS menu bar companion for desktop users',
    ],
  },
  {
    phase: 'Phase 4 · 2026+',
    title: 'Global Ecosystem & Wearables',
    status: 'Planned',
    items: [
      'Apple Watch & Wear OS standalone apps',
      'Global 1-for-1 Student of Knowledge Waqf distribution',
      'Community audio packs curated by verified Qari masters',
      'Linux and Windows native desktop companions',
    ],
  },
];

export default function EngineeringPipelinePage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [filter, setFilter] = useState<string>('all');

  /* ── Dark mode persistence & HTML class toggle ── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    const existing = load<{ dark: boolean; sound?: boolean }>(SETTINGS_KEY, {
      dark: false,
      sound: true,
    });
    save(SETTINGS_KEY, { ...existing, dark });
  }, [dark]);

  const filteredItems = ARCHITECTURE_PIPELINE.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  return (
    <div className="min-h-dvh text-[var(--app-ink)]">
      <AppShell active="pipeline" dark={dark} onToggleDark={() => setDark((v) => !v)}>
        <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4 space-y-10">
          {/* Header */}
          <header className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-emerald-950/20 to-transparent p-6 sm:p-10 text-center sm:text-left">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Layers className="h-4 w-4" />
                  <span>ENGINEERING PIPELINE & ARCHITECTURE</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--app-ink)] font-serif">
                  Native Apps <span className="text-amber-600 dark:text-amber-400 font-sans">& Infrastructure</span>
                </h1>

                <p className="text-sm sm:text-base text-[var(--app-muted)] leading-relaxed">
                  Our technical roadmap for launching native Android, iOS & macOS desktop apps, a dedicated Go/Rust backend, and Whisper speech inference clusters.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <Link
                    href="/pro"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-700 px-5 py-3 text-xs font-black text-white shadow-lg shadow-amber-900/15 hover:brightness-110 active:scale-95 transition-all no-underline"
                  >
                    <Crown className="h-4 w-4" />
                    <span>View Pro Features & Pricing</span>
                  </Link>

                  <Link
                    href="/tech"
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors no-underline"
                  >
                    <Cpu className="h-4 w-4" />
                    <span>Live Tech Stack & APIs</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <a
                    href="https://buymeacoffee.com/nazrulislambhat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-[#FFDD00]/25 px-5 py-3 text-xs font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 hover:bg-[#FFDD00]/40 transition-colors shadow-xs no-underline"
                  >
                    <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Support Open-Source Khidmah</span>
                  </a>
                </div>
              </div>

              {/* Status Badge Box */}
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 shadow-sm text-center sm:text-right shrink-0 min-w-[240px] space-y-2">
                <div className="flex items-center justify-center sm:justify-end gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Hammer className="h-4 w-4" />
                  <span>Architecture Status</span>
                </div>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">Active Planning</p>
                <p className="text-xs text-[var(--app-muted)]">Native OS targets: iOS · Android · macOS</p>
                <div className="pt-2 border-t border-[var(--app-line)] text-[11px] text-[var(--app-muted)]">
                  Primary Language: <strong className="text-[var(--app-ink)]">Swift · Kotlin · Go</strong>
                </div>
              </div>
            </div>
          </header>

          {/* Native Platform Ecosystem Cards */}
          <section className="space-y-6" aria-labelledby="platforms-title">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id="platforms-title" className="text-2xl font-black tracking-tight">
                  Native Apps Ecosystem
                </h2>
                <p className="text-xs text-[var(--app-muted)] mt-0.5">
                  Deep OS-level integration for iPhone, iPad, Apple Watch, Android, and Mac.
                </p>
              </div>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                2026 Target
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* iOS */}
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">SwiftUI</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--app-ink)]">Native iOS & watchOS</h3>
                  <p className="text-[11px] text-[var(--app-muted)] mt-1 leading-snug">
                    Lock screen widgets, Dynamic Island Iftar countdowns, Apple Watch haptic tasbih, and FaceID security.
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--app-line)] text-[10px] font-semibold text-[var(--app-muted)]">
                  Target: App Store
                </div>
              </div>

              {/* Android */}
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Kotlin Compose</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--app-ink)]">Native Android & Wear OS</h3>
                  <p className="text-[11px] text-[var(--app-muted)] mt-1 leading-snug">
                    Exact-alarm Adhan alerts that pierce Doze mode, Material You dynamic theming, and Wear OS complication tiles.
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--app-line)] text-[10px] font-semibold text-[var(--app-muted)]">
                  Target: Google Play
                </div>
              </div>

              {/* macOS */}
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Laptop className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">macOS Agent</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--app-ink)]">Native macOS Desktop</h3>
                  <p className="text-[11px] text-[var(--app-muted)] mt-1 leading-snug">
                    Always-visible menu bar countdown, global hotkey (⌥+Space) for instant Hisn al-Muslim, and zero CPU usage.
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--app-line)] text-[10px] font-semibold text-[var(--app-muted)]">
                  Target: Mac App Store
                </div>
              </div>

              {/* Web PWA */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5 space-y-3 ring-1 ring-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">
                    <Zap className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Live Today</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--app-ink)]">Web & PWA</h3>
                  <p className="text-[11px] text-[var(--app-muted)] mt-1 leading-snug">
                    Installable Progressive Web App with offline caching, web push notifications, and instant loading on any browser.
                  </p>
                </div>
                <div className="pt-2 border-t border-emerald-500/20 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  Available Worldwide
                </div>
              </div>
            </div>
          </section>

          {/* Planned Separate Backend Architecture */}
          <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-emerald-950/20 to-transparent p-6 sm:p-8 space-y-6" aria-labelledby="backend-title">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  <Server className="h-6 w-6" />
                </span>
                <div>
                  <h2 id="backend-title" className="text-2xl font-black tracking-tight">
                    Planned Dedicated Backend Architecture (Go / Rust)
                  </h2>
                  <p className="text-xs text-[var(--app-muted)]">
                    Transitioning to high-throughput, low-latency microservices for native mobile apps and Whisper AI.
                  </p>
                </div>
              </div>
              <Link
                href="/tech"
                className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3.5 py-2 text-xs font-bold hover:border-amber-500/40 transition-colors no-underline"
              >
                <span>Read Full Technical Specs</span>
                <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Zap className="h-4 w-4" />
                  <span>Go / Rust High-Throughput API Gateway</span>
                </div>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Powers native iOS, Android, and Web clients with binary gRPC streaming and HTTP/3. Eliminates cold-start serverless latency for instant prayer calculations.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Mic className="h-4 w-4" />
                  <span>Whisper v3 GPU Speech Inference Cluster</span>
                </div>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Dedicated GPU worker nodes running optimized ONNX runtime for Arabic Quran recitation analysis with zero recording storage (strict zero-retention privacy).
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-300">
                  <Database className="h-4 w-4" />
                  <span>PostgreSQL + TimescaleDB & Redis Caching</span>
                </div>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Distributed Redis cache for sub-millisecond worldwide prayer windows and TimescaleDB for private temporal habit insights and anonymous waqf accounting.
                </p>
              </div>
            </div>
          </section>

          {/* Architecture Items Grid */}
          <section className="space-y-5" aria-labelledby="architecture-items-title">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 id="architecture-items-title" className="text-2xl font-black tracking-tight">
                  Detailed Architecture Specifications
                </h2>
                <p className="text-xs text-[var(--app-muted)] mt-0.5">
                  Filter by subsystem to inspect technical specifications and planned capabilities.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] text-xs font-bold">
                {[
                  { id: 'all', label: 'All Architecture' },
                  { id: 'mobile', label: 'Native Apps' },
                  { id: 'backend', label: 'Go/Rust Backend' },
                  { id: 'ai', label: 'Speech AI' },
                  { id: 'security', label: 'Zero-Knowledge' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilter(t.id)}
                    className={`rounded-xl px-3 py-1.5 transition-colors ${
                      filter === t.id
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-sm hover:border-amber-500/40 transition-all group"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                          <Icon className="h-6 w-6" />
                        </span>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                            <Clock3 className="h-3 w-3" />
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[var(--app-ink)] leading-snug">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {item.tagline}
                        </p>
                      </div>

                      <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        {item.description}
                      </p>

                      {/* Highlights */}
                      <div className="space-y-2 pt-2 border-t border-[var(--app-line)]">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                          Planned Capabilities
                        </p>
                        <ul className="space-y-1.5 text-xs text-[var(--app-ink)]">
                          {item.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                              <span className="text-[11px] leading-tight">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[var(--app-line)] text-[10px] text-[var(--app-muted)] font-mono truncate">
                      {item.specs}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Development Milestones */}
          <section className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 sm:p-8 space-y-6" aria-labelledby="roadmap-title">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <h2 id="roadmap-title" className="text-xl sm:text-2xl font-black tracking-tight">
                  Engineering Rollout Timeline (2026)
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Our quarterly engineering rollout target for Native Apps and Infrastructure.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ROADMAP_PHASES.map((p, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 flex flex-col justify-between ${
                    idx === 0
                      ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                      : 'border-[var(--app-line)] bg-black/[0.02] dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="space-y-2">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {p.phase}
                    </span>
                    <h3 className="font-bold text-sm text-[var(--app-ink)]">{p.title}</h3>
                    <span className="inline-block rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[9px] font-bold text-[var(--app-muted)]">
                      {p.status}
                    </span>
                    <ul className="space-y-1.5 pt-2 text-[11px] text-[var(--app-muted)]">
                      {p.items.map((it, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">·</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Navigation Callout */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">Looking for Dhikrly Pro Membership & Pricing?</p>
                <p className="text-[11px] text-[var(--app-muted)]">Explore the AI memorization coach, studio soundscapes, and student waqf sponsorship.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/pro"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2.5 text-xs font-bold no-underline"
              >
                <span>View Dhikrly Pro</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
