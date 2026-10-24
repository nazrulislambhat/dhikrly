'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDown,
  Building,
  Calculator,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  DollarSign,
  HelpCircle,
  Info,
  Printer,
  RotateCcw,
  Scale,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, SETTINGS_KEY } from '@/lib/storage';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  defaultGoldPerGram: number;
  defaultSilverPerGram: number;
}

const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', defaultGoldPerGram: 86.5, defaultSilverPerGram: 1.05 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', defaultGoldPerGram: 80.2, defaultSilverPerGram: 0.98 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', defaultGoldPerGram: 68.4, defaultSilverPerGram: 0.83 },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', defaultGoldPerGram: 324.5, defaultSilverPerGram: 3.94 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', defaultGoldPerGram: 317.8, defaultSilverPerGram: 3.86 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', defaultGoldPerGram: 118.0, defaultSilverPerGram: 1.45 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', defaultGoldPerGram: 7450.0, defaultSilverPerGram: 92.0 },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', defaultGoldPerGram: 24200.0, defaultSilverPerGram: 295.0 },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', defaultGoldPerGram: 10400.0, defaultSilverPerGram: 130.0 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', defaultGoldPerGram: 382.0, defaultSilverPerGram: 4.65 },
};

export const GOLD_NISAB_GRAMS = 87.48; // 7.5 tolas / 87.48 grams of 24K gold
export const SILVER_NISAB_GRAMS = 612.36; // 52.5 tolas / 612.36 grams of pure silver

export default function ZakatPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [currency, setCurrency] = useState<string>('USD');
  const [nisabStandard, setNisabStandard] = useState<'silver' | 'gold'>('silver');
  const [yearType, setYearType] = useState<'lunar' | 'solar'>('lunar');

  const curr = CURRENCIES[currency] || CURRENCIES.USD;

  // Metal prices
  const [goldPrice, setGoldPrice] = useState<number>(curr.defaultGoldPerGram);
  const [silverPrice, setSilverPrice] = useState<number>(curr.defaultSilverPerGram);

  // Update metal defaults on currency change
  useEffect(() => {
    setGoldPrice(curr.defaultGoldPerGram);
    setSilverPrice(curr.defaultSilverPerGram);
  }, [currency, curr]);

  // Assets
  const [cash, setCash] = useState<number | ''>('');
  const [goldGrams, setGoldGrams] = useState<number | ''>('');
  const [goldValue, setGoldValue] = useState<number | ''>('');
  const [silverGrams, setSilverGrams] = useState<number | ''>('');
  const [silverValue, setSilverValue] = useState<number | ''>('');
  const [investments, setInvestments] = useState<number | ''>('');
  const [businessStock, setBusinessStock] = useState<number | ''>('');
  const [moneyOwedToYou, setMoneyOwedToYou] = useState<number | ''>('');
  const [otherAssets, setOtherAssets] = useState<number | ''>('');

  // Liabilities
  const [debtsDue, setDebtsDue] = useState<number | ''>('');
  const [expensesDue, setExpensesDue] = useState<number | ''>('');

  // UI States
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Synchronized gold input handlers
  const handleGoldGramsChange = (valStr: string) => {
    if (valStr === '') {
      setGoldGrams('');
      setGoldValue('');
    } else {
      const g = Number(valStr);
      setGoldGrams(isNaN(g) ? '' : g);
      setGoldValue(isNaN(g) ? '' : Number((g * goldPrice).toFixed(2)));
    }
  };

  const handleGoldValueChange = (valStr: string) => {
    if (valStr === '') {
      setGoldValue('');
      setGoldGrams('');
    } else {
      const v = Number(valStr);
      setGoldValue(isNaN(v) ? '' : v);
      setGoldGrams(isNaN(v) || goldPrice <= 0 ? '' : Number((v / goldPrice).toFixed(2)));
    }
  };

  // Synchronized silver input handlers
  const handleSilverGramsChange = (valStr: string) => {
    if (valStr === '') {
      setSilverGrams('');
      setSilverValue('');
    } else {
      const g = Number(valStr);
      setSilverGrams(isNaN(g) ? '' : g);
      setSilverValue(isNaN(g) ? '' : Number((g * silverPrice).toFixed(2)));
    }
  };

  const handleSilverValueChange = (valStr: string) => {
    if (valStr === '') {
      setSilverValue('');
      setSilverGrams('');
    } else {
      const v = Number(valStr);
      setSilverValue(isNaN(v) ? '' : v);
      setSilverGrams(isNaN(v) || silverPrice <= 0 ? '' : Number((v / silverPrice).toFixed(2)));
    }
  };

  // Update values if metal prices are changed manually
  const handleGoldPriceChange = (newPrice: number) => {
    setGoldPrice(newPrice);
    if (typeof goldGrams === 'number' && goldGrams > 0) {
      setGoldValue(Number((goldGrams * newPrice).toFixed(2)));
    }
  };

  const handleSilverPriceChange = (newPrice: number) => {
    setSilverPrice(newPrice);
    if (typeof silverGrams === 'number' && silverGrams > 0) {
      setSilverValue(Number((silverGrams * newPrice).toFixed(2)));
    }
  };

  // Derived effective values
  const effectiveGoldVal = useMemo(() => {
    if (typeof goldValue === 'number' && goldValue > 0) return goldValue;
    if (typeof goldGrams === 'number' && goldGrams > 0) return goldGrams * goldPrice;
    return 0;
  }, [goldValue, goldGrams, goldPrice]);

  const effectiveSilverVal = useMemo(() => {
    if (typeof silverValue === 'number' && silverValue > 0) return silverValue;
    if (typeof silverGrams === 'number' && silverGrams > 0) return silverGrams * silverPrice;
    return 0;
  }, [silverValue, silverGrams, silverPrice]);

  const totalAssets = useMemo(() => {
    return (
      (Number(cash) || 0) +
      effectiveGoldVal +
      effectiveSilverVal +
      (Number(investments) || 0) +
      (Number(businessStock) || 0) +
      (Number(moneyOwedToYou) || 0) +
      (Number(otherAssets) || 0)
    );
  }, [
    cash,
    effectiveGoldVal,
    effectiveSilverVal,
    investments,
    businessStock,
    moneyOwedToYou,
    otherAssets,
  ]);

  const totalLiabilities = useMemo(() => {
    return (Number(debtsDue) || 0) + (Number(expensesDue) || 0);
  }, [debtsDue, expensesDue]);

  const netZakatableWealth = Math.max(0, totalAssets - totalLiabilities);

  // Nisab threshold in currency
  const goldNisabValue = GOLD_NISAB_GRAMS * goldPrice;
  const silverNisabValue = SILVER_NISAB_GRAMS * silverPrice;
  const currentNisabThreshold = nisabStandard === 'silver' ? silverNisabValue : goldNisabValue;

  const isZakatDue = netZakatableWealth >= currentNisabThreshold && currentNisabThreshold > 0;
  const zakatRate = yearType === 'lunar' ? 0.025 : 0.02577; // 2.5% Hijri or 2.577% Gregorian
  const zakatOwed = isZakatDue ? netZakatableWealth * zakatRate : 0;
  const potentialZakat = netZakatableWealth * zakatRate;
  const shortfallToNisab = Math.max(0, currentNisabThreshold - netZakatableWealth);

  const nisabProgress = currentNisabThreshold > 0
    ? Math.min(100, Math.max(0, (netZakatableWealth / currentNisabThreshold) * 100))
    : 0;

  const hasEnteredAnyData =
    totalAssets > 0 || totalLiabilities > 0;

  const formatMoney = (amount: number) => {
    return `${curr.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Explicit calculation action
  const handleCalculate = () => {
    setToastMessage('Zakāt calculated successfully! View breakdown below.');
    setTimeout(() => setToastMessage(null), 3000);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Load realistic demo portfolio to instantly demonstrate calculation
  const handleLoadSample = () => {
    setCash(12500);
    const sampleGoldGrams = 25;
    setGoldGrams(sampleGoldGrams);
    setGoldValue(Number((sampleGoldGrams * goldPrice).toFixed(2)));
    setSilverGrams('');
    setSilverValue('');
    setInvestments(4200);
    setBusinessStock(3000);
    setMoneyOwedToYou(1000);
    setOtherAssets(500);
    setDebtsDue(1200);
    setExpensesDue(800);
    setToastMessage('Sample portfolio loaded & calculated!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset all inputs
  const handleReset = () => {
    setCash('');
    setGoldGrams('');
    setGoldValue('');
    setSilverGrams('');
    setSilverValue('');
    setInvestments('');
    setBusinessStock('');
    setMoneyOwedToYou('');
    setOtherAssets('');
    setDebtsDue('');
    setExpensesDue('');
    setToastMessage('All fields cleared');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Copy breakdown to clipboard
  const handleCopySummary = async () => {
    const text = `=== DHIKRLY ZAKĀT & NISĀB STATEMENT ===
Date: ${new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
Currency: ${curr.code} (${curr.symbol})
Calculation Standard: ${yearType === 'lunar' ? 'Lunar / Hijri Year (2.50%)' : 'Solar / Gregorian Year (2.577%)'}
Nisāb Benchmark: ${nisabStandard === 'silver' ? `Silver Standard (${SILVER_NISAB_GRAMS}g @ ${curr.symbol}${silverPrice}/g)` : `Gold Standard (${GOLD_NISAB_GRAMS}g @ ${curr.symbol}${goldPrice}/g)`} = ${formatMoney(currentNisabThreshold)}

--- ASSETS & WEALTH ---
• Cash in Hand & Bank Accounts: ${formatMoney(Number(cash) || 0)}
• Gold Holdings (${goldGrams || 0}g): ${formatMoney(effectiveGoldVal)}
• Silver Holdings (${silverGrams || 0}g): ${formatMoney(effectiveSilverVal)}
• Stocks, Crypto & Investments: ${formatMoney(Number(investments) || 0)}
• Business Inventory & Merchandise: ${formatMoney(Number(businessStock) || 0)}
• Receivables (Money Owed to You): ${formatMoney(Number(moneyOwedToYou) || 0)}
• Other Zakatable Assets: ${formatMoney(Number(otherAssets) || 0)}
Gross Zakatable Assets: ${formatMoney(totalAssets)}

--- DEDUCTIONS & LIABILITIES ---
• Immediate Debts Due: -${formatMoney(Number(debtsDue) || 0)}
• Immediate Living Expenses Due: -${formatMoney(Number(expensesDue) || 0)}
Total Deductible Liabilities: -${formatMoney(totalLiabilities)}

--- SUMMARY & OBLIGATION ---
Net Zakatable Wealth: ${formatMoney(netZakatableWealth)}
Nisāb Threshold: ${formatMoney(currentNisabThreshold)}
Obligation Status: ${isZakatDue ? 'OBLIGATORY (Fard Upon You)' : `Below Nisāb (Shortfall: ${formatMoney(shortfallToNisab)})`}
TOTAL ZAKĀT DUE: ${formatMoney(zakatOwed)}

Calculated via Dhikrly — The Modern Islamic Life Companion (https://dhikrly.app/zakat)`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-sm transition-all`;
  const inputClass = `w-full rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 px-4 py-3 text-xs font-semibold outline-none transition-colors focus:border-emerald-500`;

  return (
    <AppShell active="zakat" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4 pb-32">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-900/90 text-white px-4 py-3 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Scale className="h-3.5 w-3.5" />
            <span>THE THIRD PILLAR OF ISLAM</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
            Zakāt & Nisāb Calculator
          </h1>
          <p className="mt-1 text-sm text-[var(--app-muted)] max-w-2xl">
            Assess your gold, silver, cash, and investments against real-time Nisāb thresholds to
            calculate your exact Zakāt obligation with live auto-calculation and full itemized statement.
          </p>
        </header>

        {/* Currency & Nisab Standard Settings */}
        <section className={`${cardClass} mb-8`}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--app-line)]">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-[var(--app-ink)]">
                Calculator Settings & Benchmarks
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              Live Auto-Calculate Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Currency Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] block mb-1.5">
                Currency
              </label>
              <select
                id="zakat-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass}
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) – {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nisab Benchmark Standard */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] block mb-1.5">
                Nisāb Benchmark Standard
              </label>
              <div className="flex rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-1">
                <button
                  type="button"
                  id="nisab-standard-silver"
                  onClick={() => setNisabStandard('silver')}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    nisabStandard === 'silver'
                      ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                      : 'text-[var(--app-muted)]'
                  }`}
                >
                  Silver (Recommended)
                </button>
                <button
                  type="button"
                  id="nisab-standard-gold"
                  onClick={() => setNisabStandard('gold')}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    nisabStandard === 'gold'
                      ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                      : 'text-[var(--app-muted)]'
                  }`}
                >
                  Gold (87.48g)
                </button>
              </div>
            </div>

            {/* Year Type (Lunar vs Solar) */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] block mb-1.5">
                Calendar Calculation
              </label>
              <div className="flex rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-1">
                <button
                  type="button"
                  id="calendar-type-lunar"
                  onClick={() => setYearType('lunar')}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    yearType === 'lunar'
                      ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                      : 'text-[var(--app-muted)]'
                  }`}
                >
                  Lunar (2.5%)
                </button>
                <button
                  type="button"
                  id="calendar-type-solar"
                  onClick={() => setYearType('solar')}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    yearType === 'solar'
                      ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                      : 'text-[var(--app-muted)]'
                  }`}
                >
                  Solar (2.577%)
                </button>
              </div>
            </div>
          </div>

          {/* Metal Price per gram configuration */}
          <div className="mt-4 pt-4 border-t border-[var(--app-line)] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] block mb-1">
                Gold Price per Gram ({curr.symbol}/g)
              </label>
              <input
                id="gold-price-input"
                type="number"
                min="0"
                step="0.01"
                value={goldPrice}
                onChange={(e) => handleGoldPriceChange(Number(e.target.value) || 0)}
                className={inputClass}
              />
              <span className="text-[10px] text-[var(--app-muted)] mt-1 block">
                Gold Nisāb ({GOLD_NISAB_GRAMS}g) = {formatMoney(goldNisabValue)}
              </span>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] block mb-1">
                Silver Price per Gram ({curr.symbol}/g)
              </label>
              <input
                id="silver-price-input"
                type="number"
                min="0"
                step="0.01"
                value={silverPrice}
                onChange={(e) => handleSilverPriceChange(Number(e.target.value) || 0)}
                className={inputClass}
              />
              <span className="text-[10px] text-[var(--app-muted)] mt-1 block">
                Silver Nisāb ({SILVER_NISAB_GRAMS}g) = {formatMoney(silverNisabValue)}
              </span>
            </div>
          </div>
        </section>

        {/* Hero Result Banner */}
        <section
          className={`mb-8 rounded-3xl border p-6 sm:p-8 relative overflow-hidden transition-all ${
            isZakatDue
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-900/30 via-emerald-800/15 to-transparent shadow-lg'
              : 'border-[var(--app-line)] bg-black/5 dark:bg-white/5'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2">
                {isZakatDue ? (
                  <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Zakāt is Fard (Obligatory) Upon You
                  </span>
                ) : netZakatableWealth > 0 ? (
                  <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Wealth Below Nisāb Threshold ({formatMoney(currentNisabThreshold)})
                  </span>
                ) : (
                  <span className="text-[var(--app-muted)] flex items-center gap-1.5">
                    <Info className="h-4 w-4" />
                    Enter your assets and liabilities below to calculate
                  </span>
                )}
              </div>

              <div className="text-xs text-[var(--app-muted)] font-medium">
                Total Zakāt Owed ({yearType === 'lunar' ? '2.5%' : '2.577%'} of Net Wealth)
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-300 mt-1">
                {formatMoney(zakatOwed)}
              </div>

              {/* Dynamic Nisab Progress Meter */}
              <div className="mt-4 max-w-lg">
                <div className="flex justify-between items-center text-[11px] font-semibold text-[var(--app-muted)] mb-1">
                  <span>Progress to Nisāb ({formatMoney(currentNisabThreshold)})</span>
                  <span className="font-bold text-[var(--app-ink)]">{nisabProgress.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isZakatDue
                        ? 'bg-emerald-500'
                        : nisabProgress > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-400/60'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, nisabProgress))}%` }}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-[var(--app-muted)] max-w-lg leading-relaxed">
                Net Zakatable Wealth: <strong>{formatMoney(netZakatableWealth)}</strong> · Nisāb
                Threshold: <strong>{formatMoney(currentNisabThreshold)}</strong> (
                {nisabStandard === 'silver' ? 'Silver Standard' : 'Gold Standard'}).
                {!isZakatDue && netZakatableWealth > 0 && (
                  <span className="block mt-1 text-amber-800 dark:text-amber-300">
                    Zakāt is not fard until net wealth reaches {formatMoney(currentNisabThreshold)}.
                    Shortfall: <strong>{formatMoney(shortfallToNisab)}</strong>. (Live 2.5% rate if threshold were met: {formatMoney(potentialZakat)}).
                  </span>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 text-xs space-y-2 min-w-[260px] shadow-sm">
              <div className="flex items-center justify-between font-semibold pb-1.5 border-b border-[var(--app-line)]">
                <span className="text-[var(--app-muted)]">Live Summary</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Auto-Updating
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Gross Assets:</span>
                <span className="font-bold text-[var(--app-ink)]">{formatMoney(totalAssets)}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Deductible Debts:</span>
                <span className="font-bold">-{formatMoney(totalLiabilities)}</span>
              </div>
              <div className="border-t border-[var(--app-line)] pt-1.5 flex justify-between font-bold text-[var(--app-ink)]">
                <span>Net Zakatable:</span>
                <span>{formatMoney(netZakatableWealth)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[var(--app-muted)] pt-0.5">
                <span>Nisāb Benchmark:</span>
                <span>{formatMoney(currentNisabThreshold)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Input Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 1. Zakatable Assets Card */}
          <section className={cardClass}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                  Zakatable Wealth & Assets
                </h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                Subtotal: {formatMoney(totalAssets)}
              </span>
            </div>
            <p className="text-xs text-[var(--app-muted)] mb-5">
              Enter assets held continuously or accumulated over the past lunar year.
            </p>

            <div className="space-y-4">
              {/* Cash */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Cash in Hand & Bank Accounts
                </label>
                <div className="relative">
                  <input
                    id="asset-cash-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={cash}
                    onChange={(e) => setCash(e.target.value === '' ? '' : Number(e.target.value))}
                    className={inputClass}
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[var(--app-muted)] pointer-events-none">
                    {curr.code}
                  </span>
                </div>
              </div>

              {/* Gold */}
              <div className="rounded-2xl border border-[var(--app-line)] bg-black/[0.02] dark:bg-white/[0.02] p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[var(--app-ink)]">
                    Gold Holdings
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Rate: {curr.symbol}{goldPrice}/g
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--app-muted)] block mb-0.5">
                      Weight in Grams
                    </label>
                    <input
                      id="asset-gold-grams-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 50"
                      value={goldGrams}
                      onChange={(e) => handleGoldGramsChange(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--app-muted)] block mb-0.5">
                      or Direct Value ({curr.symbol})
                    </label>
                    <input
                      id="asset-gold-val-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={goldValue}
                      onChange={(e) => handleGoldValueChange(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-1.5 text-[10px] text-[var(--app-muted)] flex justify-between">
                  <span>Auto-converts between grams & value</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Subtotal: {formatMoney(effectiveGoldVal)}
                  </span>
                </div>
              </div>

              {/* Silver */}
              <div className="rounded-2xl border border-[var(--app-line)] bg-black/[0.02] dark:bg-white/[0.02] p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[var(--app-ink)]">
                    Silver Holdings
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Rate: {curr.symbol}{silverPrice}/g
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--app-muted)] block mb-0.5">
                      Weight in Grams
                    </label>
                    <input
                      id="asset-silver-grams-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 500"
                      value={silverGrams}
                      onChange={(e) => handleSilverGramsChange(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--app-muted)] block mb-0.5">
                      or Direct Value ({curr.symbol})
                    </label>
                    <input
                      id="asset-silver-val-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={silverValue}
                      onChange={(e) => handleSilverValueChange(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-1.5 text-[10px] text-[var(--app-muted)] flex justify-between">
                  <span>Auto-converts between grams & value</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Subtotal: {formatMoney(effectiveSilverVal)}
                  </span>
                </div>
              </div>

              {/* Stocks / Investments */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Stocks, Shares, Crypto & Mutual Funds
                </label>
                <div className="relative">
                  <input
                    id="asset-investments-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={investments}
                    onChange={(e) =>
                      setInvestments(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[var(--app-muted)] pointer-events-none">
                    {curr.code}
                  </span>
                </div>
              </div>

              {/* Business Merchandise */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Business Inventory & Trade Goods
                </label>
                <div className="relative">
                  <input
                    id="asset-business-stock-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={businessStock}
                    onChange={(e) =>
                      setBusinessStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[var(--app-muted)] pointer-events-none">
                    {curr.code}
                  </span>
                </div>
              </div>

              {/* Money owed to you */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Money Owed to You (Strong expected receivables)
                </label>
                <div className="relative">
                  <input
                    id="asset-receivables-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={moneyOwedToYou}
                    onChange={(e) =>
                      setMoneyOwedToYou(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[var(--app-muted)] pointer-events-none">
                    {curr.code}
                  </span>
                </div>
              </div>

              {/* Other Zakatable Assets */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Other Zakatable Assets & Savings
                </label>
                <div className="relative">
                  <input
                    id="asset-other-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={otherAssets}
                    onChange={(e) =>
                      setOtherAssets(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[var(--app-muted)] pointer-events-none">
                    {curr.code}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--app-muted)] mt-1 block">
                  Provident fund withdrawal portion, rental income saved, etc.
                </span>
              </div>
            </div>
          </section>

          {/* 2. Liabilities & Deductions Card */}
          <section className="flex flex-col justify-between">
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-red-500" />
                  <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                    Deductible Liabilities & Debts
                  </h2>
                </div>
                <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                  Subtotal: -{formatMoney(totalLiabilities)}
                </span>
              </div>
              <p className="text-xs text-[var(--app-muted)] mb-5">
                Debts and living expenses due immediately can be deducted from Zakatable wealth.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    Immediate Debts & Outstanding Loan Payments
                  </label>
                  <div className="relative">
                    <input
                      id="liability-debts-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={debtsDue}
                      onChange={(e) =>
                        setDebtsDue(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className={inputClass}
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-[var(--app-muted)] pointer-events-none">
                      {curr.code}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--app-muted)] mt-1 block">
                    Only include the portion of debt due immediately or within the current month.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    Unpaid Rent, Utility Bills & Immediate Living Expenses
                  </label>
                  <div className="relative">
                    <input
                      id="liability-expenses-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={expensesDue}
                      onChange={(e) =>
                        setExpensesDue(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className={inputClass}
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-[var(--app-muted)] pointer-events-none">
                      {curr.code}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--app-muted)] mt-1 block">
                    Essential bills due before or on your Zakāt calculation date.
                  </span>
                </div>
              </div>
            </div>

            {/* Fiqh Guidance Cards */}
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-xs">
                <strong className="text-emerald-800 dark:text-emerald-200 block mb-1">
                  The 8 Quranic Recipients of Zakāt (Surah At-Tawbah 9:60):
                </strong>
                <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                  1. The Poor (Al-Fuqara) · 2. The Needy (Al-Masakin) · 3. Zakāt Administrators · 4.
                  Those whose hearts are to be reconciled · 5. Freeing slaves & captives · 6. Those in
                  burdened debt (Al-Gharimin) · 7. In the Cause of Allah (Fi Sabilillah) · 8. The
                  stranded traveler (Ibn As-Sabil).
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--app-line)] bg-black/[0.02] dark:bg-white/[0.02] p-4 text-[11px] text-[var(--app-muted)]">
                <span className="font-bold text-[var(--app-ink)] block mb-0.5">
                  Exempt from Zakāt:
                </span>
                Primary residence, personal vehicle, daily personal clothing, furniture, and tools of
                trade are completely exempt from Zakāt.
              </div>
            </div>
          </section>
        </div>

        {/* PRIMARY ACTION SECTION: Calculate Button & Form Controls */}
        <section className="mb-10 rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-[var(--app-ink)] flex items-center justify-center sm:justify-start gap-2">
                <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Calculate & Verify Obligation</span>
              </h3>
              <p className="text-xs text-[var(--app-muted)] mt-0.5">
                Calculations update in real-time as you type. Click below to view the full verified statement.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              {/* Calculate Button */}
              <button
                type="button"
                id="calculate-zakat-btn"
                onClick={handleCalculate}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-3.5 text-sm font-bold shadow-md hover:shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Calculator className="h-4 w-4" />
                <span>Calculate Zakāt</span>
              </button>

              {/* Load Sample Data Button */}
              <button
                type="button"
                id="load-sample-zakat-btn"
                onClick={handleLoadSample}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-3.5 text-xs font-bold text-[var(--app-ink)] transition-all cursor-pointer"
                title="Fill with realistic sample data to see the calculator in action"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Demo Data</span>
              </button>

              {/* Reset Form Button */}
              <button
                type="button"
                id="reset-zakat-btn"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-600 px-4 py-3.5 text-xs font-bold text-[var(--app-muted)] transition-all cursor-pointer"
                title="Clear all fields"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </section>

        {/* DETAILED ITEMIZED STATEMENT & BREAKDOWN RECEIPT */}
        <div ref={resultsRef} id="calculation-results" className="scroll-mt-6">
          <section className={`${cardClass} border-emerald-500/30 overflow-hidden`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--app-line)]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Itemized Zakāt & Nisāb Statement</span>
                </div>
                <h3 className="text-xl font-extrabold text-[var(--app-ink)]">
                  Financial Assessment Summary
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="copy-zakat-summary-btn"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-3 py-2 text-xs font-bold text-[var(--app-ink)] transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="print-zakat-statement-btn"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-3 py-2 text-xs font-bold text-[var(--app-ink)] transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Obligation Banner in Receipt */}
            <div
              className={`my-6 rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isZakatDue
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              }`}
            >
              <div>
                <span
                  className={`inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-1.5 ${
                    isZakatDue
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {isZakatDue ? 'Zakāt Obligatory (Fard)' : 'Below Nisāb Threshold'}
                </span>
                <h4 className="text-base font-bold text-[var(--app-ink)]">
                  {isZakatDue
                    ? `Your net wealth exceeds the ${nisabStandard} Nisāb threshold`
                    : `Net wealth does not reach the ${nisabStandard} Nisāb benchmark`}
                </h4>
                <p className="text-xs text-[var(--app-muted)] mt-0.5">
                  {isZakatDue
                    ? `You are obligated to distribute ${yearType === 'lunar' ? '2.5%' : '2.577%'} of your net wealth to eligible Quranic recipients.`
                    : `Zakāt becomes obligatory once net assets reach ${formatMoney(currentNisabThreshold)}. Shortfall: ${formatMoney(shortfallToNisab)}.`}
                </p>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10 dark:border-white/10">
                <div className="text-[11px] font-bold text-[var(--app-muted)] uppercase tracking-wider">
                  Zakāt Payable
                </div>
                <div className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-300">
                  {formatMoney(zakatOwed)}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--app-line)] text-[10px] uppercase tracking-wider text-[var(--app-muted)]">
                    <th className="py-2.5 px-3">Asset / Liability Category</th>
                    <th className="py-2.5 px-3">Details / Units</th>
                    <th className="py-2.5 px-3 text-right">Zakatable Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--app-line)] font-medium text-[var(--app-ink)]">
                  <tr>
                    <td className="py-2.5 px-3">Cash & Bank Balances</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">Liquid deposits & physical cash</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatMoney(Number(cash) || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Gold Holdings</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">
                      {goldGrams ? `${goldGrams}g @ ${curr.symbol}${goldPrice}/g` : 'No gold specified'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatMoney(effectiveGoldVal)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Silver Holdings</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">
                      {silverGrams ? `${silverGrams}g @ ${curr.symbol}${silverPrice}/g` : 'No silver specified'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatMoney(effectiveSilverVal)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Stocks, Crypto & Shares</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">Zakatable portfolio value</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatMoney(Number(investments) || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Business Inventory</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">Wholesale value of trade merchandise</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatMoney(Number(businessStock) || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Receivables (Money Owed)</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">Loans expected to be repaid</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatMoney(Number(moneyOwedToYou) || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Other Zakatable Assets</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">Savings schemes, rental profits</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatMoney(Number(otherAssets) || 0)}</td>
                  </tr>
                  <tr className="bg-emerald-500/5 font-bold">
                    <td className="py-2.5 px-3 text-emerald-900 dark:text-emerald-200">Gross Zakatable Assets Subtotal</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">Sum of all liquid & commercial assets</td>
                    <td className="py-2.5 px-3 text-right text-emerald-900 dark:text-emerald-200">{formatMoney(totalAssets)}</td>
                  </tr>
                  <tr className="text-red-500">
                    <td className="py-2.5 px-3">Less: Immediate Debts Due</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">Loans payable immediately</td>
                    <td className="py-2.5 px-3 text-right font-bold">-{formatMoney(Number(debtsDue) || 0)}</td>
                  </tr>
                  <tr className="text-red-500">
                    <td className="py-2.5 px-3">Less: Immediate Living Expenses</td>
                    <td className="py-2.5 px-3 text-[var(--app-muted)]">Rent, utilities due</td>
                    <td className="py-2.5 px-3 text-right font-bold">-{formatMoney(Number(expensesDue) || 0)}</td>
                  </tr>
                  <tr className="bg-black/5 dark:bg-white/5 font-extrabold text-sm">
                    <td className="py-3 px-3">Net Zakatable Wealth Base</td>
                    <td className="py-3 px-3 text-xs text-[var(--app-muted)] font-normal">
                      Gross Assets minus immediate liabilities
                    </td>
                    <td className="py-3 px-3 text-right text-base text-[var(--app-ink)]">
                      {formatMoney(netZakatableWealth)}
                    </td>
                  </tr>
                  <tr className="text-[var(--app-muted)]">
                    <td className="py-2.5 px-3">Applicable Nisāb Threshold</td>
                    <td className="py-2.5 px-3">
                      {nisabStandard === 'silver' ? `Silver standard (${SILVER_NISAB_GRAMS}g)` : `Gold standard (${GOLD_NISAB_GRAMS}g)`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">{formatMoney(currentNisabThreshold)}</td>
                  </tr>
                  <tr className="text-[var(--app-muted)]">
                    <td className="py-2.5 px-3">Calculation Standard & Rate</td>
                    <td className="py-2.5 px-3">
                      {yearType === 'lunar' ? 'Lunar / Hijri Year (354 days)' : 'Solar / Gregorian Year (365 days)'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      {yearType === 'lunar' ? '2.500%' : '2.577%'}
                    </td>
                  </tr>
                  <tr className="bg-emerald-600 text-white font-extrabold text-base">
                    <td className="py-3.5 px-3 rounded-l-2xl">FINAL ZAKĀT OBLIGATION</td>
                    <td className="py-3.5 px-3 text-xs font-normal text-emerald-100">
                      {isZakatDue ? 'Payable to 8 Quranic Categories' : 'Below Nisāb Benchmark'}
                    </td>
                    <td className="py-3.5 px-3 text-right rounded-r-2xl text-lg font-black">
                      {formatMoney(zakatOwed)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note on Hawl (Passing of One Year) */}
            <div className="mt-6 pt-4 border-t border-[var(--app-line)] flex items-start gap-2.5 text-xs text-[var(--app-muted)]">
              <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Fiqh Requirement (Hawl):</strong> Zakāt is due on assets that have remained in your possession for one complete lunar year (Hawl) and meet or exceed the Nisāb threshold. If your wealth fluctuates, calculate based on your balance on your designated annual Zakāt date.
              </p>
            </div>
          </section>
        </div>

        {/* STICKY BOTTOM REAL-TIME SUMMARY BAR */}
        <aside
          aria-label="Live calculation sticky bar"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--app-line)] bg-[var(--app-surface)]/95 backdrop-blur-md px-4 py-3 shadow-2xl transition-all"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Net Wealth
                </div>
                <div className="text-sm sm:text-base font-extrabold text-[var(--app-ink)]">
                  {formatMoney(netZakatableWealth)}
                </div>
              </div>

              <div className="hidden sm:block h-8 w-[1px] bg-[var(--app-line)]" />

              <div className="hidden sm:block">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Status
                </div>
                <div className="text-xs font-bold">
                  {isZakatDue ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Zakāt Fard
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Below Nisāb
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Zakāt Payable
                </div>
                <div className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatMoney(zakatOwed)}
                </div>
              </div>

              <button
                type="button"
                id="sticky-calculate-btn"
                onClick={handleCalculate}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Calculate</span>
                <span className="sm:hidden">View</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
