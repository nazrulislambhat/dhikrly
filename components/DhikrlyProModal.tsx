'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  Construction,
  Crown,
  Headphones,
  HeartHandshake,
  LineChart,
  Lock,
  Mic,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { usePro } from '@/hooks/usePro';
import type { ProTier } from '@/lib/proStorage';

interface DhikrlyProModalProps {
  dark: boolean;
  onClose: () => void;
  defaultPlan?: 'annual' | 'monthly' | 'lifetime';
}

export default function DhikrlyProModal({
  dark,
  onClose,
  defaultPlan = 'annual',
}: DhikrlyProModalProps) {
  const { isPro, tier: activeTier, activateTier, deactivatePro, redeemCode } = usePro();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly' | 'lifetime'>(defaultPlan);
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showPromoField, setShowPromoField] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleActivate = () => {
    setIsActivating(true);
    setTimeout(() => {
      activateTier(selectedPlan as ProTier);
      setIsActivating(false);
      onClose();
    }, 600);
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = redeemCode(promoInput);
    setPromoMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-md bg-black/60 animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          dark
            ? 'bg-[#12221d] border-amber-500/30 text-stone-100 shadow-[0_0_50px_rgba(20,40,30,0.8)]'
            : 'bg-white border-amber-500/30 text-stone-900 shadow-2xl'
        }`}
      >
        {/* Top Decorative Banner with Islamic Arch Effect */}
        <div className="relative bg-gradient-to-r from-emerald-900 via-[#133c30] to-emerald-950 px-6 py-7 sm:px-8 sm:py-8 text-white overflow-hidden shrink-0">
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              <span>Dhikrly Pro Membership</span>
            </span>
            {isPro && (
              <span className="rounded-full bg-emerald-500/30 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                Active · {activeTier.toUpperCase()}
              </span>
            )}
          </div>

          <h2 id="pro-modal-title" className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-100">
            Elevate Your Daily Spiritual Connection
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-200/90 max-w-xl leading-relaxed">
            Unlock AI Quran memorization coaching, encrypted multi-device cloud backup, studio soundscapes, and sponsor a student of knowledge.
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Under Active Development Banner */}
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs transition-all">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Construction className="h-5 w-5" />
              </span>
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-amber-900 dark:text-amber-200">
                    Dhikrly Pro is Under Active Development
                  </span>
                  <span className="rounded-full bg-amber-500/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Feature Pipeline Preview
                  </span>
                </div>
                <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                  These features are currently in development and not yet live. Payments and billing are disabled during this phase. You can explore the full roadmap and pipeline at <strong className="text-[var(--app-ink)]">/pro</strong>, or test early access preview mode with voucher code <code className="font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">TESTPRO</code>.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <Link
                    href="/pro"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300 hover:underline"
                  >
                    <span>Explore upcoming features & pipeline on /pro</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Selector Cards */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
              Select Your Membership Plan
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Annual Plan (Most Popular) */}
              <button
                type="button"
                onClick={() => setSelectedPlan('annual')}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                  selectedPlan === 'annual'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-400/40'
                    : dark
                      ? 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      : 'border-stone-200 bg-stone-50/70 hover:border-stone-300'
                }`}
              >
                <span className="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[9px] font-extrabold text-stone-950 uppercase tracking-wider shadow-sm">
                  Most Popular · 7-Day Free Trial
                </span>

                <div>
                  <h3 className="font-bold text-sm text-[var(--app-ink)]">Annual Pro</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Save 30% yearly</p>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">$24.99</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">/year</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                    Only $2.08 / month
                  </p>
                </div>
              </button>

              {/* Monthly Plan */}
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-400/40'
                    : dark
                      ? 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      : 'border-stone-200 bg-stone-50/70 hover:border-stone-300'
                }`}
              >
                <div>
                  <h3 className="font-bold text-sm text-[var(--app-ink)]">Monthly Pro</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Flexibility, cancel anytime</p>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">$2.99</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">/month</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-0.5">Billed monthly</p>
                </div>
              </button>

              {/* Lifetime / Waqf Supporter */}
              <button
                type="button"
                onClick={() => setSelectedPlan('lifetime')}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                  selectedPlan === 'lifetime'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-400/40'
                    : dark
                      ? 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      : 'border-stone-200 bg-stone-50/70 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                    <Sparkles className="h-2.5 w-2.5" /> Lifetime Patron
                  </div>
                  <h3 className="font-bold text-sm text-[var(--app-ink)]">Waqf Supporter</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Pay once, own forever</p>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">$49.99</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">one-time</span>
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                    Sponsors 1 Student of Knowledge
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Feature Checklist Comparison */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
              Included in Dhikrly Pro ✨
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  Icon: Mic,
                  title: 'AI Quran Voice & Hifdh Coach',
                  desc: 'Listens as you recite, conceals ayahs, and highlights mistakes in real time.',
                },
                {
                  Icon: Cloud,
                  title: 'Encrypted Cloud Sync',
                  desc: 'Sync prayer logs, tasbeeh counts, and custom du‘ās across all your devices.',
                },
                {
                  Icon: Headphones,
                  title: 'Studio Soundscape Studio',
                  desc: 'Multi-track mixer blending Makkah rain, Madinah wind, and studio reciters.',
                },
                {
                  Icon: LineChart,
                  title: 'Annual Reflections Report',
                  desc: 'Spotify-Wrapped-style spiritual analytics & shareable infographic cards.',
                },
                {
                  Icon: Scale,
                  title: 'Equity & Crypto Zakat Screener',
                  desc: 'Automated AAOIFI Shariah calculations for investment portfolios & 401(k).',
                },
                {
                  Icon: HeartHandshake,
                  title: '1-for-1 Student Waqf Giveback',
                  desc: 'Your membership funds a free Pro account for an Islamic student in need.',
                },
              ].map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                    dark ? 'border-white/[0.06] bg-black/20' : 'border-stone-200/60 bg-stone-50/60'
                  }`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-[var(--app-ink)]">{title}</h5>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Halal Guarantee Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Our Halal & Ethical Commitment</span>
            </div>
            <p className="text-[11px] text-emerald-950 dark:text-emerald-200/90 leading-relaxed">
              Dhikrly is 100% ad-free and privacy-first. We never sell data. Obligatory prayer times, basic Quran reading, and Hisn al-Muslim adhkār will remain <strong>free forever</strong>. Pro directly sustains server costs and authentic research.
            </p>
          </div>

          {/* Promo / Sponsor Code Toggle */}
          <div className="pt-2 border-t border-[var(--app-line)]">
            {!showPromoField ? (
              <button
                type="button"
                onClick={() => setShowPromoField(true)}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Have a sponsor or VIP promo code? (e.g. TESTPRO or DHIKRLY2026)
              </button>
            ) : (
              <form onSubmit={handleRedeem} className="space-y-2">
                <label htmlFor="promo-input" className="block text-xs font-semibold text-stone-500">
                  Enter Promo / Sponsor Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="e.g. TESTPRO or DHIKRLY2026"
                    className="flex-1 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-ink)] outline-none uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 px-4 py-2 text-xs font-bold"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p
                    className={`text-xs font-semibold ${
                      promoMessage.isError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="p-4 sm:p-5 border-t border-[var(--app-line)] bg-[var(--app-surface)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-bold text-[var(--app-ink)]">
                {selectedPlan === 'annual'
                  ? 'Annual Patron Pass ($24.99/yr target)'
                  : selectedPlan === 'monthly'
                    ? 'Monthly Pass ($2.99/mo target)'
                    : 'Lifetime Waqf Pass ($49.99 target)'}
              </p>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
              Under Development · Checkouts are simulated for testing preview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Link
              href="/pro"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-line)] px-4 py-3 text-xs font-semibold text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors no-underline"
            >
              <span>View Roadmap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {isPro && (
              <button
                type="button"
                onClick={deactivatePro}
                className="rounded-xl border border-red-500/30 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-500/10"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={handleActivate}
              disabled={isActivating}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-3 text-xs font-extrabold text-stone-950 shadow-md hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <Crown className="h-4 w-4" />
              <span>
                {isActivating
                  ? 'Activating...'
                  : isPro
                    ? `Switch to ${selectedPlan.toUpperCase()}`
                    : `Test Preview Pass (${selectedPlan.toUpperCase()})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
