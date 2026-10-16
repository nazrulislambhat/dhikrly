'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Banknote,
  Building,
  CheckCircle2,
  Coins,
  DollarSign,
  HelpCircle,
  Info,
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Derived values
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

  const isZakatDue = netZakatableWealth >= currentNisabThreshold;
  const zakatRate = yearType === 'lunar' ? 0.025 : 0.02577; // 2.5% Hijri or 2.577% Gregorian
  const zakatOwed = isZakatDue ? netZakatableWealth * zakatRate : 0;

  const formatMoney = (amount: number) => {
    return `${curr.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-sm dark:bg-[#14211e]`;
  const inputClass = `w-full rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 px-4 py-3 text-xs font-semibold outline-none transition-colors focus:border-emerald-500`;

  return (
    <AppShell active="zakat" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),64rem)] px-2 py-6 sm:py-8 lg:px-4">
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
            Assess your gold, silver, cash, and investments against current Nisāb thresholds to
            calculate your exact 2.5% Zakāt obligation with complete precision.
          </p>
        </header>

        {/* Currency & Nisab Standard Settings */}
        <section className={`${cardClass} mb-8`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Currency Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] block mb-1.5">
                Currency
              </label>
              <select
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
                type="number"
                min="0"
                step="0.01"
                value={goldPrice}
                onChange={(e) => setGoldPrice(Number(e.target.value) || 0)}
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
                type="number"
                min="0"
                step="0.01"
                value={silverPrice}
                onChange={(e) => setSilverPrice(Number(e.target.value) || 0)}
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
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2">
                {isZakatDue ? (
                  <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Zakāt is Fard (Obligatory) Upon You
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Wealth Below Nisāb Threshold ({formatMoney(currentNisabThreshold)})
                  </span>
                )}
              </div>

              <div className="text-xs text-[var(--app-muted)] font-medium">
                Total Zakāt Owed ({yearType === 'lunar' ? '2.5%' : '2.577%'} of Net Wealth)
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-300 mt-1">
                {formatMoney(zakatOwed)}
              </div>

              <p className="mt-2 text-xs text-[var(--app-muted)] max-w-lg">
                Net Zakatable Wealth: <strong>{formatMoney(netZakatableWealth)}</strong> · Nisāb
                Threshold: <strong>{formatMoney(currentNisabThreshold)}</strong> (
                {nisabStandard === 'silver' ? 'Silver Standard' : 'Gold Standard'}).
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 text-xs space-y-1.5 min-w-[240px] dark:bg-[#14211e]">
              <div className="flex justify-between">
                <span className="text-[var(--app-muted)]">Zakatable Assets:</span>
                <span className="font-bold text-[var(--app-ink)]">{formatMoney(totalAssets)}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Deductions / Debts:</span>
                <span className="font-bold">-{formatMoney(totalLiabilities)}</span>
              </div>
              <div className="border-t border-[var(--app-line)] pt-1.5 flex justify-between font-bold text-[var(--app-ink)]">
                <span>Net Zakatable:</span>
                <span>{formatMoney(netZakatableWealth)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Input Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 1. Zakatable Assets Card */}
          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                Zakatable Wealth & Assets
              </h2>
            </div>
            <p className="text-xs text-[var(--app-muted)] mb-5">
              Enter assets held continuously or accumulated over the past year.
            </p>

            <div className="space-y-4">
              {/* Cash */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Cash in Hand & Bank Accounts
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cash}
                  onChange={(e) => setCash(e.target.value === '' ? '' : Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              {/* Gold */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    Gold (Grams)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={goldGrams}
                    onChange={(e) =>
                      setGoldGrams(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    or Gold Value ({curr.symbol})
                  </label>
                  <input
                    type="number"
                    placeholder={effectiveGoldVal ? effectiveGoldVal.toFixed(2) : '0.00'}
                    value={goldValue}
                    onChange={(e) =>
                      setGoldValue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Silver */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    Silver (Grams)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={silverGrams}
                    onChange={(e) =>
                      setSilverGrams(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    or Silver Value ({curr.symbol})
                  </label>
                  <input
                    type="number"
                    placeholder={effectiveSilverVal ? effectiveSilverVal.toFixed(2) : '0.00'}
                    value={silverValue}
                    onChange={(e) =>
                      setSilverValue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Stocks / Investments */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Stocks, Shares, Crypto & Mutual Funds
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={investments}
                  onChange={(e) =>
                    setInvestments(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={inputClass}
                />
              </div>

              {/* Business Merchandise */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Business Inventory & Trade Goods
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={businessStock}
                  onChange={(e) =>
                    setBusinessStock(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={inputClass}
                />
              </div>

              {/* Money owed to you */}
              <div>
                <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                  Money Owed to You (Receivables expected)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={moneyOwedToYou}
                  onChange={(e) =>
                    setMoneyOwedToYou(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* 2. Liabilities & Deductions Card */}
          <section className="flex flex-col justify-between">
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-1">
                <Building className="h-5 w-5 text-red-500" />
                <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                  Deductible Liabilities & Debts
                </h2>
              </div>
              <p className="text-xs text-[var(--app-muted)] mb-5">
                Debts and living expenses due immediately can be deducted from Zakatable wealth.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    Immediate Debts & Outstanding Loan Payments
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={debtsDue}
                    onChange={(e) =>
                      setDebtsDue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                  <span className="text-[10px] text-[var(--app-muted)] mt-1 block">
                    Only include the portion of debt due immediately or within the month.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    Unpaid Rent, Utility Bills & Immediate Living Expenses
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={expensesDue}
                    onChange={(e) =>
                      setExpensesDue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* 8 Eligible Categories of Zakat (Surah At-Tawbah 9:60) */}
            <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-xs">
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
          </section>
        </div>
      </div>
    </AppShell>
  );
}
