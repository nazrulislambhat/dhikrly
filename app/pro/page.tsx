'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  Cloud,
  Coffee,
  Coins,
  Compass,
  Construction,
  Crown,
  ExternalLink,
  Flame,
  Hammer,
  Headphones,
  HeartHandshake,
  HelpCircle,
  Layers,
  LineChart,
  Lock,
  Mic,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Volume2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import DhikrlyProModal from '@/components/DhikrlyProModal';
import { usePro } from '@/hooks/usePro';
import { usePricing } from '@/hooks/usePricing';
import { load, save, SETTINGS_KEY } from '@/lib/storage';

interface ProFeature {
  id: string;
  category: 'ai' | 'sync' | 'audio' | 'analytics' | 'zakat' | 'community';
  title: string;
  tagline: string;
  stage: string;
  stageType: 'dev' | 'design' | 'testing' | 'vetting' | 'ready';
  icon: React.ElementType;
  description: string;
  highlights: string[];
  specs: string;
}

const PRO_FEATURES: ProFeature[] = [
  {
    id: 'ai_hifdh',
    category: 'ai',
    title: 'AI Quran Memorization & Hifdh Coach',
    tagline: 'Real-time voice listening checks recitation lapses, hides verses, and builds retention.',
    stage: 'In Development · Target Beta Q2 2026',
    stageType: 'dev',
    icon: Mic,
    description:
      'A personal Quran memorization companion that listens through your microphone as you recite. It tracks your pace, identifies hesitation or missed words, and provides gentle instant correction without interrupting your rhythm.',
    highlights: [
      '“Mist Mode” (Tadrij): Ayahs smoothly fade out as you recite from heart, challenging memory retention.',
      'Syllable & word-level voice alignment powered by lightweight on-device and low-latency speech models.',
      'Spaced Repetition System (SRS): Automatically schedules review for your weakest juz, surahs, and ayahs.',
      'Tajweed hesitation heatmaps showing where your recitation pauses or stumbles.',
    ],
    specs: 'Whisper / Vosk Arabic speech models · Zero recording retention · Private & encrypted',
  },
  {
    id: 'cloud_sync',
    category: 'sync',
    title: 'End-to-End Encrypted Cloud Sync',
    tagline: 'Zero-knowledge AES-256 sync across iPhone, Android, iPad, and desktop.',
    stage: 'Architecture & Security Review',
    stageType: 'design',
    icon: Cloud,
    description:
      'Seamless multi-device synchronization built on zero-knowledge encryption principles. Your daily prayer logs, custom duas, notes, and reading bookmarks stay up to date everywhere you pray.',
    highlights: [
      'Zero-knowledge encryption: Your spiritual logs and duas are encrypted with your key before leaving your device.',
      'Conflict-free offline resolution: Log prayers offline on a flight and sync seamlessly when you land.',
      'Automated daily encrypted cloud snapshots with 1-click JSON restoration.',
      'Cross-platform support: PWA, iOS Safari, Android Chrome, and Desktop.',
    ],
    specs: 'AES-256-GCM client encryption · Supabase secure row-level storage · CRDT conflict resolution',
  },
  {
    id: 'studio_soundscapes',
    category: 'audio',
    title: 'Studio Ambient Soundscape & Reciter Mixer',
    tagline: 'Multi-track studio mixer blending Makkah rain, Madinah winds, and high-bitrate reciter stems.',
    stage: 'Sound Engineering & Prototyping',
    stageType: 'testing',
    icon: Headphones,
    description:
      'Immersive acoustic environments designed for deep contemplation (Tadabbur), Quran reading, and late-night Tahajjud focus. Mix and layer organic Haramayn field recordings with your favourite reciters.',
    highlights: [
      'Multi-channel studio faders: Independently balance reciter audio, Haramayn ambiance, and gentle rain.',
      'Authentic field captures: Night breeze in the courtyard of Masjid an-Nabawi, Makkah rainfall, and morning birds of Quba.',
      'Binaural focus frequencies calibrated for distraction-free memorization sessions.',
      'Native lock-screen media integration with background playback.',
    ],
    specs: 'Lossless 320kbps audio stems · Web Audio API DSP multi-bus engine · Zero-latency loop points',
  },
  {
    id: 'spiritual_analytics',
    category: 'analytics',
    title: 'Spiritual Analytics & Annual Soul Report',
    tagline: 'Deep consistency analytics, Fajr trends, and shareable Islamic year-in-review reflections.',
    stage: 'Data Modeling & UX Design',
    stageType: 'design',
    icon: LineChart,
    description:
      'Meaningful, non-judgmental spiritual reflections that help you visualize your progress, celebrate consistency, and identify windows where your practice needs gentle revival.',
    highlights: [
      'Annual Dhikrly Reflections: A beautifully designed year-end summary of completed khatmahs, salawat, and prayers.',
      'Fajr & Tahajjud Punctuality Index: Track wake-up consistency relative to local dawn times.',
      'Weekly Spiritual Balance: Holistic balance between Salah, Quran, morning/evening adhkār, and charity.',
      'Exportable high-resolution cards for sharing your milestones with family and friends.',
    ],
    specs: 'Private local aggregation · No ad tracking or third-party telemetry · SVG card export',
  },
  {
    id: 'zakat_screener',
    category: 'zakat',
    title: 'Equity, Crypto & 401(k) Zakat Screener',
    tagline: 'Automated AAOIFI Shariah screening, dividend purification, and modern asset zakat.',
    stage: 'AAOIFI Shariah Vetting',
    stageType: 'vetting',
    icon: Scale,
    description:
      'Modern wealth spans ETFs, employer 401(k)s, mutual funds, and crypto tokens. Dhikrly Pro automates the tedious mathematics of zakat on non-traditional assets according to established fiqh standards.',
    highlights: [
      'AAOIFI Standard No. 35 compliant screening for equities, index funds, and REITs.',
      'Automated Dividend Purification: Calculates non-permissible revenue percentages to purify with charity.',
      '401(k) and Pension Net-Asset valuation with liquidity and vested-balance adjustments.',
      'Crypto classification: Differentiates staking yields, long-term holdings, and trading inventory.',
    ],
    specs: 'AAOIFI Standard 35 · Gold/Silver live market oracle · Complete offline computation mode',
  },
  {
    id: 'family_circles',
    category: 'community',
    title: 'Family & Halāqah Khatmah Circles',
    tagline: 'Private circles to complete Ramadan khatmahs together and share encouragement.',
    stage: 'Pipeline Planning',
    stageType: 'design',
    icon: Users,
    description:
      'A private, noise-free space for your family, study halaqah, or close friends to unite around worship. Coordinate 30-Juz khatmahs during Ramadan, encourage each other’s daily sunnahs, and celebrate spiritual milestones.',
    highlights: [
      'Interactive 30-Juz Ramadan & Dhul Hijjah Khatmah board where family members claim and read parts.',
      'Quiet encouragement nudges without toxic leaderboards or vanity metrics.',
      'Private end-to-end encrypted circle tokens: No public directories or discoverability.',
    ],
    specs: 'Zero ads · Private invitation codes · No algorithmic feeds',
  },
  {
    id: 'student_waqf',
    category: 'community',
    title: '1-for-1 Student of Knowledge Waqf (Sadaqah Jariyah)',
    tagline: 'Every Pro membership sponsors a student of Islamic knowledge in need worldwide.',
    stage: 'Active Foundation',
    stageType: 'ready',
    icon: HeartHandshake,
    description:
      'When you subscribe to Dhikrly Pro, you don’t just unlock premium tools for yourself—you sponsor a lifetime Pro subscription for a madrasa student, teacher, or scholar in training who cannot afford one.',
    highlights: [
      '1-for-1 Giveback: 1 paid member = 1 student gifted full Pro access for life.',
      'Direct partnerships with recognized Islamic madrasas and seminaries across Africa, Asia, and the West.',
      'Continuous Sadaqah Jariyah: You share in the reward of their daily Qur’anic memorization and scholarship.',
      'Transparent quarterly giveback reports detailing student sponsors.',
    ],
    specs: 'Voucher endowment distribution · Verified non-profit academic partners',
  },
];

const FAQS = [
  {
    q: 'Do you offer regional pricing for India (Purchasing Power Parity)?',
    a: 'Yes! To make Dhikrly Pro accessible worldwide, we offer localized Indian Rupee (₹) pricing for patrons in India (₹149/month, ₹1,199/year, or ₹2,499 for the lifetime waqf pass), while international patrons across the rest of the world are billed in US Dollars ($2.99/month, $24.99/year, $49.99 lifetime). You can toggle between INR and USD using the currency switcher anytime.',
  },
  {
    q: 'Will Dhikrly ever put obligatory prayers or Quran behind a paywall?',
    a: 'Never. Obligatory prayers (Salah times and Makrooh clocks), Qibla direction, the complete Holy Quran text, and authentic Hisn al-Muslim adhkār will remain 100% free forever for all Muslims worldwide with ZERO ads and ZERO tracking.',
  },
  {
    q: 'Why is Dhikrly introducing a Pro tier?',
    a: 'Features like low-latency voice speech recognition (AI Hifdh), real-time encrypted cloud sync, and studio-quality soundscape hosting require ongoing server infrastructure and GPU compute costs. Pro subscriptions sustainably fund these heavy servers and sponsor free accounts for students of knowledge.',
  },
  {
    q: 'When will Dhikrly Pro officially launch?',
    a: 'We are rolling out features progressively through 2026. You can preview the roadmap, test voucher codes right now, or test early builds as a student of knowledge.',
  },
  {
    q: 'Can I test Pro features right now without paying?',
    a: 'Yes! Billing is not yet active. You can enter testing voucher codes (such as TESTPRO or DHIKRLY2026) in our voucher tester below or in Settings to experience preview mode.',
  },
  {
    q: 'How does the 1-for-1 Student Waqf work?',
    a: 'For every supporter who joins Dhikrly Pro, we endow a Pro license to a student of Islamic knowledge enrolled in full-time Quran memorization or Islamic studies, allowing your subscription to serve as ongoing Sadaqah Jariyah.',
  },
];

export default function DhikrlyProPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoResult, setPromoResult] = useState<{ text: string; isError: boolean } | null>(null);

  const { isPro, tier, redeemCode, deactivatePro } = usePro();
  const { region, isIndia, plans: pricingPlans, setRegion } = usePricing();

  /* ── Dark mode persistence & HTML class toggle ── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    const existing = load<{ dark: boolean; sound?: boolean }>(SETTINGS_KEY, {
      dark: false,
      sound: true,
    });
    save(SETTINGS_KEY, { ...existing, dark });
  }, [dark]);

  const handleTestVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    const res = redeemCode(promoCodeInput.trim());
    setPromoResult({ text: res.message, isError: !res.success });
  };

  const filteredFeatures = PRO_FEATURES.filter((f) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'ai') return f.category === 'ai';
    if (activeCategory === 'sync') return f.category === 'sync';
    if (activeCategory === 'audio') return f.category === 'audio';
    if (activeCategory === 'finance') return f.category === 'zakat';
    if (activeCategory === 'community') return f.category === 'community';
    return true;
  });

  return (
    <div className="min-h-dvh text-[var(--app-ink)] overflow-x-hidden">
      <AppShell active="pro" dark={dark} onToggleDark={() => setDark((v) => !v)}>
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10 min-w-0">
          {/* Header */}
          <header className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-emerald-950/20 to-transparent p-4 sm:p-10 text-center sm:text-left min-w-0">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 min-w-0">
              <div className="space-y-3 max-w-2xl min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Crown className="h-4 w-4 shrink-0" />
                  <span className="truncate">DHIKRLY PRO · PLANS</span>
                </div>

                <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-[var(--app-ink)] font-serif break-words">
                  Elevate Your <span className="text-amber-600 dark:text-amber-400 font-sans">Spiritual Journey</span>
                </h1>

                <p className="text-xs sm:text-base text-[var(--app-muted)] leading-relaxed break-words">
                  Support sustainable, ad-free Islamic software. Unlock AI Quran memorization coaching, encrypted multi-device sync, studio soundscapes, and sponsor a student of knowledge.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 pt-2 w-full">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-700 px-4 py-3 text-xs font-black text-white shadow-lg shadow-amber-900/15 hover:brightness-110 active:scale-95 transition-all text-center"
                  >
                    <Crown className="h-4 w-4 shrink-0" />
                    <span>{isPro ? `Pro Preview (${tier.toUpperCase()})` : 'Open Pro Modal & Plans'}</span>
                  </button>

                  <Link
                    href="/pipeline"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-3 text-xs font-bold text-[var(--app-ink)] hover:border-amber-500/40 transition-colors no-underline text-center"
                  >
                    <Layers className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Engineering Pipeline</span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                  </Link>

                  <a
                    href="https://buymeacoffee.com/nazrulislambhat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-[#FFDD00]/25 px-4 py-3 text-xs font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 hover:bg-[#FFDD00]/40 transition-colors shadow-xs no-underline text-center"
                  >
                    <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Support Dhikrly</span>
                  </a>
                </div>
              </div>

              {/* Status Badge Box */}
              <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 sm:p-5 shadow-sm text-center sm:text-right shrink-0 w-full sm:w-auto sm:min-w-[220px] space-y-2">
                <div className="flex items-center justify-center sm:justify-end gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Construction className="h-4 w-4 shrink-0" />
                  <span>Pro Feature Preview</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300">
                  {isPro ? `${tier.toUpperCase()} Active` : 'Preview Phase'}
                </p>
                <p className="text-xs text-[var(--app-muted)]">Checkouts are simulated for testing</p>
                <div className="pt-2 border-t border-[var(--app-line)] text-[11px] text-[var(--app-muted)]">
                  Testers Code: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">TESTPRO</span>
                </div>
              </div>
            </div>
          </header>

          {/* Halal Khidmah Covenant */}
          <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-7 relative overflow-hidden min-w-0">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 min-w-0">
              <span className="grid h-11 w-11 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    The Dhikrly Khidmah Covenant
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    Unbreakable Promise
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-bold text-[var(--app-ink)] break-words">
                  Obligatory Worship is 100% Free Forever. Zero Ads. Zero Tracking.
                </h2>
                <p className="text-xs sm:text-sm text-[var(--app-muted)] leading-relaxed break-words">
                  We believe no Muslim should ever have their fard salah, Qibla compass, complete Holy Quran text, or basic Hisn al-Muslim adhkār interrupted by an advertisement, paywall, or data tracking. Dhikrly Pro is strictly reserved for high-compute infrastructure (voice AI model inference, multi-device cloud replication) and funds a 1-for-1 waqf scholarship for students of knowledge worldwide.
                </p>
              </div>
            </div>
          </section>

          {/* Pro Subscription Tiers Preview */}
          <section className="space-y-4 min-w-0" aria-labelledby="pricing-title">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="text-center sm:text-left min-w-0">
                <h2 id="pricing-title" className="text-xl sm:text-2xl font-black tracking-tight">
                  Dhikrly Pro Membership Plans
                </h2>
                <p className="text-xs text-[var(--app-muted)] mt-0.5">
                  Simple, transparent pricing. Every plan includes all current and upcoming Pro features.
                </p>
              </div>

              {/* Region / Currency Switcher Pill */}
              <div className="inline-flex items-center gap-1 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-1 text-xs font-bold self-center sm:self-auto shadow-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setRegion('IN')}
                  aria-pressed={region === 'IN'}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all text-xs font-bold ${
                    region === 'IN'
                      ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                  }`}
                  title="View localized Indian Rupee (₹) pricing"
                >
                  <span>🇮🇳 India (₹ INR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegion('GLOBAL')}
                  aria-pressed={region === 'GLOBAL'}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all text-xs font-bold ${
                    region === 'GLOBAL'
                      ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                  }`}
                  title="View US Dollar ($) global pricing"
                >
                  <span>🌐 Global ($ USD)</span>
                </button>
              </div>
            </div>

            {/* Indian Pricing PPP Banner */}
            {isIndia && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>Purchasing Power Parity (PPP) Active:</strong> Tailored regional pricing for patrons in India.
                </span>
              </div>
            )}

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-3 min-w-0">
              {pricingPlans.map((t) => (
                <div
                  key={t.id}
                  className={`relative flex flex-col justify-between rounded-3xl border p-4 sm:p-6 transition-all min-w-0 ${
                    t.highlight
                      ? 'border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-400/30'
                      : 'border-[var(--app-line)] bg-[var(--app-surface)]'
                  }`}
                >
                  <div className="space-y-3 min-w-0">
                    <span className="inline-block rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      {t.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--app-ink)] break-words">{t.title}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-300">{t.price}</span>
                      <span className="text-xs text-[var(--app-muted)]">{t.period}</span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t.subtext}</p>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed pt-1 border-t border-[var(--app-line)] break-words">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--app-line)]">
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all text-center"
                    >
                      <span>Preview {t.title}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pro Features Grid */}
          <section className="space-y-5 min-w-0" aria-labelledby="pro-features-title">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
              <div className="min-w-0">
                <h2 id="pro-features-title" className="text-xl sm:text-2xl font-black tracking-tight">
                  Planned Dhikrly Pro Features
                </h2>
                <p className="text-xs text-[var(--app-muted)] mt-0.5">
                  Deep-dive into each planned Pro feature and what makes it special.
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] text-xs font-bold overflow-x-auto max-w-full pb-1.5 sm:pb-1">
                {[
                  { id: 'all', label: 'All Pro Features (7)' },
                  { id: 'ai', label: 'AI & Hifdh' },
                  { id: 'sync', label: 'Cloud Sync' },
                  { id: 'audio', label: 'Soundscapes' },
                  { id: 'finance', label: 'Zakat & Waqf' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`rounded-xl px-3 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                      activeCategory === tab.id
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 min-w-0">
              {filteredFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.id}
                    className="flex flex-col justify-between rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 sm:p-6 shadow-sm hover:border-amber-500/40 transition-all group min-w-0 overflow-hidden"
                  >
                    <div className="space-y-4 min-w-0">
                      {/* Card Header */}
                      <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2.5 min-w-0">
                        <span className="grid h-11 w-11 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </span>
                        <div className="text-left sm:text-right max-w-full">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 max-w-full">
                            <Clock3 className="h-3 w-3 shrink-0" />
                            <span className="break-words">{feature.stage}</span>
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--app-ink)] leading-snug break-words">
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400 break-words">
                          {feature.tagline}
                        </p>
                      </div>

                      <p className="text-xs text-[var(--app-muted)] leading-relaxed break-words">
                        {feature.description}
                      </p>

                      {/* Feature Highlights */}
                      <div className="space-y-2 pt-2 border-t border-[var(--app-line)] min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                          Planned Capabilities
                        </p>
                        <ul className="space-y-1.5 text-xs text-[var(--app-ink)]">
                          {feature.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 min-w-0">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                              <span className="text-[11px] leading-tight break-words min-w-0 flex-1">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[var(--app-line)] flex items-center justify-between text-[10px] text-[var(--app-muted)] min-w-0 gap-2">
                      <span className="truncate min-w-0 flex-1">{feature.specs}</span>
                      <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="font-bold text-emerald-800 dark:text-emerald-300 hover:underline shrink-0"
                      >
                        Preview &rarr;
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Interactive Testing Voucher Playground */}
          <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-transparent p-4 sm:p-8 space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h2 className="text-base sm:text-lg font-bold break-words">Beta Voucher & Tester Playground</h2>
                </div>
                <p className="text-xs text-[var(--app-muted)] break-words">
                  Want to test preview mode? Enter any of our beta testing vouchers: <code className="font-mono font-bold text-emerald-800 dark:text-emerald-300">TESTPRO</code>, <code className="font-mono font-bold text-emerald-800 dark:text-emerald-300">DHIKRLY2026</code>, or <code className="font-mono font-bold text-emerald-800 dark:text-emerald-300">STUDENT</code>.
                </p>
              </div>

              {isPro && (
                <button
                  type="button"
                  onClick={deactivatePro}
                  className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 shrink-0 w-full sm:w-auto"
                >
                  Reset Status to Free
                </button>
              )}
            </div>

            <form onSubmit={handleTestVoucher} className="flex flex-col sm:flex-row gap-2 max-w-md w-full">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="Enter voucher code (e.g. TESTPRO)"
                className="flex-1 min-w-0 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-2.5 text-xs text-[var(--app-ink)] font-mono uppercase outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 shrink-0 text-center"
              >
                Apply Voucher
              </button>
            </form>

            {promoResult && (
              <p
                className={`text-xs font-bold ${
                  promoResult.isError ? 'text-red-500' : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {promoResult.text}
              </p>
            )}

            {isPro && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 min-w-0">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="break-words">You are currently in Pro Preview Mode ({tier.toUpperCase()}). All preview flags unlocked locally.</span>
              </div>
            )}
          </section>

          {/* Architecture Redirect Banner */}
          <section className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-w-0">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Layers className="h-4 w-4 shrink-0" />
                <span>Engineering & Mobile Pipeline</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--app-ink)] break-words">
                Looking for our Native Apps (iOS, Android, Mac) & Backend Architecture?
              </h2>
              <p className="text-xs text-[var(--app-muted)] break-words">
                We maintain a dedicated technical roadmap for native mobile engineering, Go/Rust microservices, and Whisper speech clusters.
              </p>
            </div>

            <Link
              href="/pipeline"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 px-5 py-3 text-xs font-bold hover:brightness-110 shrink-0 no-underline w-full sm:w-auto text-center"
            >
              <span>Explore /pipeline</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </section>

          {/* FAQs */}
          <section className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 sm:p-8 space-y-6" aria-labelledby="faq-title">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 id="faq-title" className="text-xl sm:text-2xl font-black tracking-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Clear answers about our philosophy, pricing, and development roadmap.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-[var(--app-line)] p-4 space-y-1.5">
                  <h3 className="text-xs font-bold text-[var(--app-ink)]">{faq.q}</h3>
                  <p className="text-xs text-[var(--app-muted)] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </AppShell>

      {showModal && (
        <DhikrlyProModal dark={dark} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
