'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Cloud,
  Code,
  Coffee,
  Coins,
  Compass,
  Cpu,
  Crown,
  Database,
  ExternalLink,
  Flame,
  Globe,
  HardDrive,
  Headphones,
  HeartHandshake,
  Key,
  Laptop,
  Layers,
  LineChart,
  Lock,
  MapPin,
  Mic,
  Monitor,
  Radio,
  Scale,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';

interface TechItem {
  name: string;
  category: 'core' | 'api' | 'audio' | 'sync' | 'security' | 'planned';
  role: string;
  description: string;
  specs: string;
  link?: string;
  badge: string;
}

const TECH_STACK: TechItem[] = [
  {
    name: 'Next.js 16 (App Router)',
    category: 'core',
    role: 'Full-Stack Web Framework',
    description:
      'High-performance React application framework with Turbopack, static site generation (SSG) across all 32+ routes, streaming SSR, and edge route handlers.',
    specs: 'Next.js 16.1.7 · Turbopack engine · Zero-config route caching',
    link: 'https://nextjs.org',
    badge: 'Core Runtime',
  },
  {
    name: 'React 19',
    category: 'core',
    role: 'UI Library & Architecture',
    description:
      'Latest React engine featuring concurrent rendering, modern hooks, transition handling, and client/server component boundaries.',
    specs: 'React 19.2.3 · React DOM · Optimized reconciliation',
    link: 'https://react.dev',
    badge: 'UI Engine',
  },
  {
    name: 'TypeScript 5',
    category: 'core',
    role: 'Type Safety & Domain Models',
    description:
      '100% strict type safety across all spiritual data models, prayer calculations, storage abstractions, and external API responses.',
    specs: 'TypeScript 5.x · Strict Mode · 0 untyped any variables',
    link: 'https://www.typescriptlang.org',
    badge: 'Language',
  },
  {
    name: 'Tailwind CSS & Design Tokens',
    category: 'core',
    role: 'Styling & Design System',
    description:
      'Custom bespoke design system using HSL color tokens, dark/light mode CSS custom properties, backdrop blur glassmorphism, and responsive breakpoints.',
    specs: 'Tailwind 3.4 · HSL dynamic palette · Zero runtime CSS overhead',
    link: 'https://tailwindcss.com',
    badge: 'Styling',
  },
  {
    name: 'Progressive Web App (PWA)',
    category: 'core',
    role: 'Offline-First Application',
    description:
      'Native-like installable app with custom service worker, cache-first strategy for static assets, network-first for pages, and standalone display mode.',
    specs: 'CacheStorage API · Web App Manifest · Self-healing offline cache',
    badge: 'PWA',
  },
  {
    name: 'Web Audio API',
    category: 'audio',
    role: 'Audio DSP & Soundscape Engine',
    description:
      'Multi-channel Web Audio DSP mixer providing independent gain nodes, zero-latency loop points, and binaural focus mixing for Haramayn ambient soundscapes.',
    specs: 'AudioContext · GainNode buses · 320kbps lossless loop stems',
    badge: 'Audio DSP',
  },
  {
    name: 'Quran.com API v4',
    category: 'api',
    role: 'Holy Qur’an & Word-by-Word Engine',
    description:
      'Official REST endpoints providing authentic Uthmani scripture, Saheeh International translations, verse metadata, and isolated word-by-word pronunciations.',
    specs: 'API v4 · Uthmani Hafs script · Audio timestamps & verse ranges',
    link: 'https://api.quran.com',
    badge: 'Holy Quran',
  },
  {
    name: 'EveryAyah Audio CDN',
    category: 'api',
    role: 'Audio Recitation Delivery',
    description:
      'High-bandwidth distributed audio CDN serving verse-by-verse recitations by Sheikh Mishary Rashid Alafasy, Sheikh Mahmoud Khalil Al-Husary, and Sheikh Abdul Basit.',
    specs: 'MP3 128kbps/192kbps · Low-latency worldwide CDN streaming',
    link: 'https://everyayah.com',
    badge: 'Recitations',
  },
  {
    name: 'Adhan.js (Astronomical Math)',
    category: 'api',
    role: 'Prayer Times Solar Engine',
    description:
      'Astronomical solar positioning library calculating Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha using trigonometric solar declination and equation of time.',
    specs: '7 International Conventions (MWL, ISNA, Umm al-Qura, etc.) · Hanafi/Standard Asr',
    link: 'https://github.com/batoulapps/adhan-js',
    badge: 'Astronomy',
  },
  {
    name: 'OpenStreetMap Nominatim',
    category: 'api',
    role: 'Reverse Geocoding',
    description:
      'Open-source, privacy-preserving geocoding engine that translates latitude and longitude into city and country names without tracking users or requiring Google API keys.',
    specs: 'Nominatim OpenStreetMap · HTTPS Reverse Geocoding · Zero profiling',
    link: 'https://nominatim.openstreetmap.org',
    badge: 'Geolocation',
  },
  {
    name: 'OpenStreetMap Overpass API',
    category: 'api',
    role: 'Worldwide Masjid Discovery',
    description:
      'Spatial Overpass QL querying that dynamically discovers mosques and places of worship within a 15km radius of the user anywhere in the world.',
    specs: 'Overpass QL · Node & Way spatial parsing · Direct navigation links',
    link: 'https://overpass-api.de',
    badge: 'Masjid Finder',
  },
  {
    name: 'Open Food Facts & EFSA',
    category: 'api',
    role: 'Halal Food & Additives Database',
    description:
      'Barcode lookup database combined with a localized European Food Safety Authority (EFSA) E-number catalog classifying over 350 food additives as Halal, Haram, or Mushbooh.',
    specs: 'Barcode Scanner API · E-Number classification matrix · Offline lookup',
    link: 'https://world.openfoodfacts.org',
    badge: 'Halal Scanner',
  },
  {
    name: 'Web Push Protocol (RFC 8292)',
    category: 'sync',
    role: 'Background Push Notifications',
    description:
      'Standardized VAPID push protocol delivering morning and evening adhkār notifications, Friday Al-Kahf reminders, and Adhan alerts even when the browser is closed.',
    specs: 'VAPID Elliptic Curve P-256 · ServiceWorker PushManager · Custom vibration patterns',
    badge: 'Web Push',
  },
  {
    name: 'Supabase Cloud Infrastructure',
    category: 'sync',
    role: 'Database & Cloud Synchronization',
    description:
      'Managed PostgreSQL with Row Level Security (RLS), GoTrue identity authentication, and Realtime WebSocket replication for multi-device data synchronization.',
    specs: 'PostgreSQL 15 · Row Level Security (RLS) · Supabase Realtime',
    link: 'https://supabase.com',
    badge: 'Cloud Sync',
  },
  {
    name: 'MediaSession API (W3C)',
    category: 'audio',
    role: 'Lock-Screen Media Integration',
    description:
      'Native operating system media controls on iOS, Android, and macOS allowing play, pause, seek, and artwork display on lock screens and watch complications.',
    specs: 'W3C MediaSession standard · Artwork metadata · Background audio',
    badge: 'OS Integration',
  },
  {
    name: 'Planned: Dedicated Go / Rust Backend',
    category: 'planned',
    role: 'High-Concurrency API Gateway',
    description:
      'High-throughput dedicated microservice backend powering native iOS, Android, and macOS apps with gRPC, HTTP/3, and sub-millisecond prayer caches.',
    specs: 'Go / Rust · gRPC & OpenAPI 3.1 · TimescaleDB & Redis Cluster',
    badge: 'In Planning',
  },
  {
    name: 'Planned: Whisper v3 Speech Cluster',
    category: 'planned',
    role: 'AI Quran Memorization (Hifdh)',
    description:
      'GPU speech recognition worker nodes running ONNX-optimized Whisper models for real-time Arabic recitation evaluation with zero voice recording storage.',
    specs: 'OpenAI Whisper v3 / Vosk · ONNX GPU runtime · Zero voice retention',
    badge: 'AI Pipeline',
  },
  {
    name: 'Planned: Zero-Knowledge Encryption',
    category: 'security',
    role: 'End-to-End Cryptography',
    description:
      'Client-side AES-256-GCM encryption with PBKDF2 key derivation. Your personal spiritual logs, duas, and notes are encrypted before leaving your device.',
    specs: 'Web Crypto API · AES-256-GCM · PBKDF2 600,000 iterations',
    badge: 'Cryptography',
  },
];

export default function TechStackPage() {
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

  const filteredItems = TECH_STACK.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  return (
    <div className="min-h-dvh text-[var(--app-ink)]">
      <AppShell active="tech" dark={dark} onToggleDark={() => setDark((v) => !v)}>
        <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4 space-y-10">
          {/* Header */}
          <header className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-transparent p-6 sm:p-10 text-center sm:text-left">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  <Terminal className="h-4 w-4" />
                  <span>ARCHITECTURE, TECH STACK & APIS</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--app-ink)] font-serif">
                  Under the Hood <span className="text-emerald-700 dark:text-emerald-400 font-sans">of Dhikrly</span>
                </h1>

                <p className="text-sm sm:text-base text-[var(--app-muted)] leading-relaxed">
                  A transparent technical guide to every open-source library, astronomical solar engine, audio DSP pipeline, and external API powering Dhikrly.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <Link
                    href="/pipeline"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-900/15 hover:brightness-110 active:scale-95 transition-all no-underline"
                  >
                    <Layers className="h-4 w-4" />
                    <span>View Engineering Pipeline</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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

              {/* Architecture Quick Facts */}
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 shadow-sm text-center sm:text-right shrink-0 min-w-[240px] space-y-2">
                <div className="flex items-center justify-center sm:justify-end gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Cpu className="h-4 w-4" />
                  <span>Technical Principles</span>
                </div>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">Zero Tracking</p>
                <p className="text-xs text-[var(--app-muted)]">No analytics cookies · No ad SDKs</p>
                <div className="pt-2 border-t border-[var(--app-line)] text-[11px] text-[var(--app-muted)]">
                  Total Static Routes: <strong className="text-[var(--app-ink)]">33 Pages</strong>
                </div>
              </div>
            </div>
          </header>

          {/* Privacy & Security Manifesto */}
          <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-7 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Our Privacy & Security Architecture
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    Ethical Engineering
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--app-ink)]">
                  Zero Third-Party Trackers. 100% Offline Capable. Client-Side Cryptography.
                </h2>
                <p className="text-xs sm:text-sm text-[var(--app-muted)] leading-relaxed">
                  Unlike commercial apps that sell your location data or inject telemetry trackers, Dhikrly contains zero Facebook Pixels, zero Google Analytics tags, and zero third-party advertising scripts. Prayer calculations, missed prayer tracking, and dhikr counts happen entirely on your local device.
                </p>
              </div>
            </div>
          </section>

          {/* Architecture Layer Overview */}
          <section className="space-y-4" aria-labelledby="architecture-layers-title">
            <h2 id="architecture-layers-title" className="text-2xl font-black tracking-tight">
              System Architecture Layers
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Monitor className="h-4 w-4" />
                  <span>Layer 1: Frontend & PWA</span>
                </div>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Next.js 16 + React 19 App Router with Turbopack, Tailwind CSS design system, and Service Worker offline caching.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Volume2 className="h-4 w-4" />
                  <span>Layer 2: Audio & Media DSP</span>
                </div>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Web Audio API multi-bus DSP mixer with gain nodes, lossless Haramayn ambient soundscapes, and W3C MediaSession controls.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-300">
                  <Globe className="h-4 w-4" />
                  <span>Layer 3: External APIs</span>
                </div>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Quran.com API v4, EveryAyah CDN, Adhan.js astronomical math, OpenStreetMap Nominatim & Overpass QL spatial queries.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Server className="h-4 w-4" />
                  <span>Layer 4: Cloud & Sync</span>
                </div>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Supabase PostgreSQL with Row Level Security (RLS), Web Push VAPID alerts, and planned dedicated Go/Rust microservices.
                </p>
              </div>
            </div>
          </section>

          {/* Tech Stack & APIs Catalog */}
          <section className="space-y-6" aria-labelledby="catalog-title">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 id="catalog-title" className="text-2xl font-black tracking-tight">
                  Detailed Technologies & APIs Directory
                </h2>
                <p className="text-xs text-[var(--app-muted)] mt-0.5">
                  Filter by category to inspect exact versions, roles, and technical specifications.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] text-xs font-bold">
                {[
                  { id: 'all', label: 'All Technologies' },
                  { id: 'core', label: 'Core Frontend' },
                  { id: 'api', label: 'External APIs' },
                  { id: 'audio', label: 'Audio & DSP' },
                  { id: 'sync', label: 'Cloud & Sync' },
                  { id: 'planned', label: 'Planned Backend' },
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 shadow-xs hover:border-emerald-500/40 transition-all space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        {item.badge}
                      </span>
                      <span className="text-[10px] text-[var(--app-muted)] font-mono">
                        {item.role}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--app-ink)]">
                      {item.name}
                    </h3>

                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--app-line)] flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[10px] text-[var(--app-muted)] truncate max-w-[200px]">
                      {item.specs}
                    </span>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                      >
                        <span>Docs</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Planned Separate Backend Architecture Diagram Box */}
          <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-emerald-950/20 to-transparent p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Server className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Planned Dedicated Backend Architecture (Go / Rust)
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Technical specification for scaling Dhikrly across native mobile apps and heavy AI inference.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  1. High-Performance API Gateway
                </h3>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Written in Go or Rust with gRPC and HTTP/3. Eliminates cold-start serverless overhead, manages connection pools, and routes requests to specialized workers.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  2. Whisper AI GPU Speech Cluster
                </h3>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Dedicated inference pods running ONNX-optimized Whisper v3 models. Audio streams are analyzed in real-time for Quran memorization (Hifdh) and destroyed immediately without storage.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  3. Realtime WebSockets & Presence
                </h3>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                  Lightweight WebSocket cluster for Family & Halāqah Khatmah circles, allowing real-time shared reading progress and communal Ramadan milestones.
                </p>
              </div>
            </div>
          </section>

          {/* Navigation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">Have an API suggestion or security feedback?</p>
                <p className="text-[11px] text-[var(--app-muted)]">We welcome contributions and corrections from the community.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 no-underline"
              >
                <span>View Engineering Pipeline</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
