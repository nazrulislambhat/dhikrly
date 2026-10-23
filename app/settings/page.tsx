'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Clock3,
  Compass,
  Construction,
  Crown,
  Download,
  Flame,
  Globe,
  Heart,
  Landmark,
  Leaf,
  MapPin,
  Moon,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  Volume2,
  Mic,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import AuthModal from '@/components/AuthModal';
import NotificationSettings from '@/components/NotificationSettings';
import { useAuth } from '@/hooks/useAuth';
import { getSalahSettings, saveSalahSettings } from '@/lib/salahStorage';
import { load, NOTIFICATION_KEY, save, SETTINGS_KEY } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { SalahSettings } from '@/types/salah';
import DhikrlyProModal from '@/components/DhikrlyProModal';
import { usePro } from '@/hooks/usePro';
import { getVoiceGender, setVoiceGender, type VoiceGender } from '@/lib/duaAudio';

export interface UserProfileSettings {
  displayName: string;
  avatarIcon: string;
  avatarColor: string;
  niyyah: string;
  madhhab: 'Standard' | 'Hanafi' | 'Jafari';
  city: string;
  country: string;
  hijriOffset: number;
  dailyDhikrGoal: number;
  dailyQuranGoal: number;
  clockFormat: '12h' | '24h';
}

const DEFAULT_PROFILE: UserProfileSettings = {
  displayName: '',
  avatarIcon: 'crescent',
  avatarColor: 'emerald',
  niyyah: '',
  madhhab: 'Standard',
  city: '',
  country: '',
  hijriOffset: 0,
  dailyDhikrGoal: 100,
  dailyQuranGoal: 20,
  clockFormat: '12h',
};

const PROFILE_KEY = 'dhikrly_profile_settings_v1';

const AVATAR_ICONS = [
  { id: 'crescent', label: 'Hilāl', Icon: Moon },
  { id: 'quran', label: 'Qur’an', Icon: BookOpen },
  { id: 'tasbih', label: 'Tasbīḥ', Icon: CircleDot },
  { id: 'masjid', label: 'Masjid', Icon: Landmark },
  { id: 'lantern', label: 'Fanous', Icon: Flame },
  { id: 'olive', label: 'Olive', Icon: Leaf },
  { id: 'star', label: 'Rub al-Hizb', Icon: Sparkles },
  { id: 'kabah', label: 'Ka’bah', Icon: Compass },
];

const AVATAR_COLORS: Record<string, { bg: string; text: string; ring: string; border: string }> = {
  emerald: { bg: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-500', border: 'border-emerald-500' },
  amber: { bg: 'bg-amber-600', text: 'text-white', ring: 'ring-amber-500', border: 'border-amber-500' },
  sky: { bg: 'bg-sky-600', text: 'text-white', ring: 'ring-sky-500', border: 'border-sky-500' },
  rose: { bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-500', border: 'border-rose-500' },
  violet: { bg: 'bg-violet-600', text: 'text-white', ring: 'ring-violet-500', border: 'border-violet-500' },
  teal: { bg: 'bg-teal-600', text: 'text-white', ring: 'ring-teal-500', border: 'border-teal-500' },
};

const NIYYAH_SUGGESTIONS = [
  'Seeking consistency in my 5 daily prayers on time.',
  'Reciting and reflecting upon the Holy Qur’an every single day.',
  'Reviving authentic morning and evening adhkār.',
  'Nourishing my heart with continuous gratitude and remembrance.',
];

const DHIKR_GOAL_OPTIONS = [33, 100, 300, 500, 1000];
const QURAN_GOAL_OPTIONS = [5, 10, 20, 50];

export default function SettingsPage() {
  const [dark, setDark] = useState(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [sound, setSound] = useState(
    () => load<{ sound?: boolean }>(SETTINGS_KEY, { sound: true }).sound ?? true,
  );
  const [voiceGender, setVoiceGenderState] = useState<VoiceGender>(() => getVoiceGender());
  const [salahSettings, setSalahSettings] = useState<SalahSettings>(() => getSalahSettings());

  const [profile, setProfile] = useState<UserProfileSettings>(() => {
    return load<UserProfileSettings>(PROFILE_KEY, DEFAULT_PROFILE);
  });

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  const { isPro, tier: proTier, status: proStatus } = usePro();

  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    const existing = load<{ dark: boolean; sound?: boolean }>(SETTINGS_KEY, {
      dark,
      sound: true,
    });
    save(SETTINGS_KEY, { ...existing, dark, sound });
  }, [dark, sound]);

  useEffect(() => {
    saveSalahSettings(salahSettings);
  }, [salahSettings]);

  // Synchronize profile if signed in
  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata;
      setProfile((prev) => ({
        ...prev,
        displayName: meta.full_name || prev.displayName,
        avatarIcon: meta.avatar_icon || prev.avatarIcon,
        avatarColor: meta.avatar_color || prev.avatarColor,
        niyyah: meta.niyyah || prev.niyyah,
        madhhab: meta.madhhab || prev.madhhab,
        city: meta.city || prev.city,
        country: meta.country || prev.country,
        hijriOffset: meta.hijri_offset ?? prev.hijriOffset,
        dailyDhikrGoal: meta.daily_dhikr_goal ?? prev.dailyDhikrGoal,
        dailyQuranGoal: meta.daily_quran_goal ?? prev.dailyQuranGoal,
        clockFormat: meta.clock_format || prev.clockFormat,
      }));
    }
  }, [user]);

  const updateProfileField = <K extends keyof UserProfileSettings>(
    field: K,
    val: UserProfileSettings[K],
  ) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: val };
      save(PROFILE_KEY, updated);
      return updated;
    });

    // Auto-sync Madhhab to Asr calculation
    if (field === 'madhhab') {
      const asr = val === 'Hanafi' ? 'Hanafi' : 'Standard';
      setSalahSettings((prev) => ({ ...prev, asrMethod: asr }));
    }
  };

  const handleProfileSave = async () => {
    setStatusMessage('');
    setErrorMessage('');
    save(PROFILE_KEY, profile);

    if (user) {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.displayName.trim(),
          avatar_icon: profile.avatarIcon,
          avatar_color: profile.avatarColor,
          niyyah: profile.niyyah.trim(),
          madhhab: profile.madhhab,
          city: profile.city.trim(),
          country: profile.country.trim(),
          hijri_offset: profile.hijriOffset,
          daily_dhikr_goal: profile.dailyDhikrGoal,
          daily_quran_goal: profile.dailyQuranGoal,
          clock_format: profile.clockFormat,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }

    setStatusMessage('All profile preferences saved successfully!');
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
          );
          if (res.ok) {
            const data = await res.json();
            const cityName =
              data.address?.city ||
              data.address?.town ||
              data.address?.municipality ||
              data.address?.county ||
              'Current Location';
            const countryName = data.address?.country || '';

            updateProfileField('city', cityName);
            updateProfileField('country', countryName);

            // Also update salah location
            setSalahSettings((prev) => ({
              ...prev,
              location: {
                lat: latitude,
                lng: longitude,
                city: cityName,
                country: countryName,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            }));

            setStatusMessage(`Location set to ${cityName}, ${countryName}`);
            setTimeout(() => setStatusMessage(''), 3000);
          }
        } catch {
          updateProfileField('city', `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setErrorMessage(`Could not retrieve location: ${err.message}`);
      },
      { timeout: 10000 },
    );
  };

  // Preview adjusted Hijri date
  const adjustedHijriDate = useMemo(() => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + (profile.hijriOffset || 0));
      return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return 'Hijri calendar calculation unavailable';
    }
  }, [profile.hijriOffset]);

  // Complete data export
  const handleExportData = () => {
    setIsExporting(true);
    try {
      const backup = {
        app: 'Dhikrly',
        version: '2.2.0',
        exportedAt: new Date().toISOString(),
        profile,
        adhkarChecked: load('duas_checked_v3', null),
        streaks: load('duas_streak_v3', null),
        salahLogs: load('salah_log_v1', null),
        salahSettings: load('salah_settings_v1', null),
        customDuas: load('duas_custom_v1', null),
        quranProgress: load('dhikrly_quran_progress_v1', null),
        quranBookmarks: load('dhikrly_quran_bookmarks_v1', null),
        qadaMissedPrayers: load('dhikrly_qada_v1', null),
        zakatHistory: load('dhikrly_zakat_v1', null),
        notifications: load(NOTIFICATION_KEY, null),
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhikrly-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setStatusMessage('Spiritual data backup downloaded!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      setErrorMessage('Could not generate data backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = () => {
    if (!window.confirm('Clear cached app data? Your saved bookmarks and preferences will be preserved.')) {
      return;
    }
    setIsClearingCache(true);
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      setStatusMessage('Cache cleared successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      setErrorMessage('Failed to clear cache.');
    } finally {
      setIsClearingCache(false);
    }
  };

  const fieldClass = `min-h-11 w-full rounded-xl border border-[var(--app-line)] px-3 text-sm text-[var(--app-ink)] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 ${
    dark ? 'bg-white/5' : 'bg-white/80'
  }`;

  const cardClass = `rounded-2xl border border-[var(--app-line)] bg-[color-mix(in_srgb,var(--app-surface)_88%,transparent)] shadow-sm ${
    dark ? 'backdrop-blur-xl' : ''
  }`;

  const selectedAvatar = AVATAR_ICONS.find((a) => a.id === profile.avatarIcon) || AVATAR_ICONS[0];
  const selectedColor = AVATAR_COLORS[profile.avatarColor] || AVATAR_COLORS.emerald;
  const SelectedIcon = selectedAvatar.Icon;

  return (
    <div className="min-h-dvh text-[var(--app-ink)]">
      <AppShell active="settings" dark={dark} onToggleDark={() => setDark((value) => !value)}>
        <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4 space-y-6">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 mb-2">
                <UserRound className="h-3.5 w-3.5" />
                <span>USER PROFILE & APP PREFERENCES</span>
              </div>
              <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Profile & Preferences
              </h1>
              <p className="mt-1.5 text-sm text-[var(--app-muted)]">
                Personalize your spiritual space, prayer traditions, goals, and sync.
              </p>
            </div>
            <span
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-md border ${selectedColor.bg} ${selectedColor.text} ${selectedColor.border}`}
              aria-hidden="true"
            >
              <SelectedIcon className="h-7 w-7" />
            </span>
          </header>

          {/* Alert Messages */}
          {statusMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-200 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account Hero Card */}
          <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="profile-title">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-2xl font-extrabold shadow-md border ${selectedColor.bg} ${selectedColor.text} ${selectedColor.border}`}
                  aria-hidden="true"
                >
                  <SelectedIcon className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck className="h-3 w-3" />
                      {user ? 'Cloud Synced' : 'Offline Pilgrim'}
                    </span>
                    <span className="text-[10px] text-[var(--app-muted)]">· Free Forever</span>
                  </div>
                  <h2 id="profile-title" className="mt-1 text-base sm:text-lg font-bold truncate">
                    {profile.displayName || (loading ? 'Loading…' : user?.email ?? 'Pilgrim of Dhikrly')}
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--app-muted)] line-clamp-1 italic">
                    {profile.niyyah ? `“${profile.niyyah}”` : user?.email || 'Settings and practice stored locally.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {user ? (
                  <button
                    type="button"
                    className="min-h-10 rounded-xl border border-[var(--app-line)] px-4 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    onClick={() => void signOut()}
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    className="min-h-10 rounded-xl bg-emerald-800 px-4 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 shadow-sm transition-all"
                    onClick={() => setShowAuth(true)}
                  >
                    Sign in to Sync
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Dhikrly Pro Membership Card */}
          {/* <section
            className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all ${
              dark
                ? 'border-amber-500/30 bg-gradient-to-br from-[#1b2b23] via-[#15241e] to-[#121c17]'
                : 'border-amber-400/40 bg-gradient-to-br from-amber-50/70 via-emerald-50/40 to-white'
            }`}
            aria-labelledby="pro-section-title"
          >
            <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{isPro ? `Dhikrly Pro · ${proTier.toUpperCase()}` : 'Dhikrly Pro Membership'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    <Construction className="h-3 w-3" />
                    Under Active Development
                  </span>
                  {isPro && proStatus.expiresAt && (
                    <span suppressHydrationWarning className="text-xs text-[var(--app-muted)]">
                      Renews / Valid until {new Date(proStatus.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                  {isPro && proTier === 'lifetime' && (
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                      · Lifetime Benefactor Pass
                    </span>
                  )}
                </div>

                <div>
                  <h2 id="pro-section-title" className="text-xl sm:text-2xl font-black tracking-tight">
                    {isPro ? 'You are a Dhikrly Pro Patron' : 'Support Ad-Free Khidmah with Dhikrly Pro'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--app-muted)] max-w-xl leading-relaxed">
                    {isPro
                      ? 'Jazakallahu Khayran! Your support keeps core Quran, Salah, and Adhkar 100% free for millions of Muslims, and funds a 1-for-1 waqf membership for students of knowledge.'
                      : 'Features are currently in our development pipeline. You can explore the planned roadmap on /pro or test preview access using our testing vouchers.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs text-[var(--app-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    AI Hifdh & Voice Memorization
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Encrypted Multi-Device Sync
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Studio Ambient Mixer
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    1-for-1 Student Waqf
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
                <Link
                  href="/pro"
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors no-underline"
                >
                  <span>Explore /pro Roadmap</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowProModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-700 px-5 py-3 text-xs font-black text-white shadow-lg shadow-amber-900/10 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Crown className="h-4 w-4" />
                  <span>{isPro ? 'Manage Membership' : 'Test Preview'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowProModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-line)] px-4 py-3 text-xs font-semibold text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Redeem Voucher</span>
                </button>
              </div>
            </div>
          </section> */}

          {/* Settings Grid */}
          <div className="grid gap-6 min-[840px]:grid-cols-2 min-[840px]:items-start">
            {/* Section 1: Spiritual Identity & Details */}
            <section className={`${cardClass} p-5 sm:p-6 space-y-4`} aria-labelledby="personal-title">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--app-line)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="personal-title" className="text-sm font-bold">Spiritual Persona</h2>
                  <p className="text-xs text-[var(--app-muted)]">Choose your motif, name, and spiritual intention.</p>
                </div>
              </div>

              {/* Avatar Motif Selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider mb-2">
                  Spiritual Avatar Motif
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_ICONS.map((item) => {
                    const isSelected = profile.avatarIcon === item.id;
                    const ItemIcon = item.Icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateProfileField('avatarIcon', item.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500'
                            : 'border-[var(--app-line)] hover:border-emerald-500/40'
                        }`}
                      >
                        <ItemIcon className="h-5 w-5" />
                        <span className="text-[10px] font-semibold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Color Scheme */}
              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider mb-2">
                  Avatar Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {Object.entries(AVATAR_COLORS).map(([colorKey, cfg]) => {
                    const isSelected = profile.avatarColor === colorKey;
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => updateProfileField('avatarColor', colorKey)}
                        className={`h-8 w-8 rounded-full ${cfg.bg} flex items-center justify-center transition-all ${
                          isSelected ? 'ring-4 ring-offset-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={colorKey}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="profile-name">
                  Display Name
                </label>
                <input
                  id="profile-name"
                  className={fieldClass}
                  value={profile.displayName}
                  onChange={(e) => updateProfileField('displayName', e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Abdullah, Fatima, Pilgrim"
                />
              </div>

              {/* Niyyah (Spiritual Intention / Bio) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="profile-niyyah">
                  My Niyyah & Spiritual Aspiration
                </label>
                <textarea
                  id="profile-niyyah"
                  rows={2}
                  className={`${fieldClass} py-2 resize-none`}
                  value={profile.niyyah}
                  onChange={(e) => updateProfileField('niyyah', e.target.value)}
                  maxLength={180}
                  placeholder="What is your primary spiritual intention?"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {NIYYAH_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => updateProfileField('niyyah', suggestion)}
                      className="rounded-lg border border-[var(--app-line)] bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[10px] text-[var(--app-muted)] hover:text-[var(--app-ink)] text-left"
                    >
                      + “{suggestion.slice(0, 36)}…”
                    </button>
                  ))}
                </div>
              </div>

              {/* Madhhab / Fiqh Tradition */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="profile-madhhab">
                  Jurisprudence Tradition (Madhhab)
                </label>
                <select
                  id="profile-madhhab"
                  className={fieldClass}
                  value={profile.madhhab}
                  onChange={(e) => updateProfileField('madhhab', e.target.value as UserProfileSettings['madhhab'])}
                >
                  <option className="bg-surface text-ink" value="Standard">
                    Standard (Shāfi‘ī, Mālikī, Ḥanbalī) — earlier ‘Asr shadow
                  </option>
                  <option className="bg-surface text-ink" value="Hanafi">
                    Ḥanafī — later ‘Asr shadow
                  </option>
                  <option className="bg-surface text-ink" value="Jafari">
                    Ja‘farī
                  </option>
                </select>
              </div>

              {/* Location (City / Country) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--app-muted)]" htmlFor="profile-city">
                    Home City & Country
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline disabled:opacity-50"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{isLocating ? 'Detecting GPS…' : 'Auto-detect GPS'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="profile-city"
                    className={fieldClass}
                    value={profile.city}
                    onChange={(e) => updateProfileField('city', e.target.value)}
                    placeholder="City (e.g. London)"
                  />
                  <input
                    id="profile-country"
                    className={fieldClass}
                    value={profile.country}
                    onChange={(e) => updateProfileField('country', e.target.value)}
                    placeholder="Country (e.g. UK)"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Worship & Practice Goals */}
            <section className={`${cardClass} p-5 sm:p-6 space-y-4`} aria-labelledby="goals-title">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--app-line)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <Heart className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="goals-title" className="text-sm font-bold">Worship Goals & Calendar</h2>
                  <p className="text-xs text-[var(--app-muted)]">Set targets for daily adhkār, Qur’an, and calendar offset.</p>
                </div>
              </div>

              {/* Daily Dhikr Goal */}
              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider mb-2">
                  Daily Dhikr Target
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {DHIKR_GOAL_OPTIONS.map((val) => {
                    const isSelected = profile.dailyDhikrGoal === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateProfileField('dailyDhikrGoal', val)}
                        className={`rounded-xl border py-2 text-xs font-bold transition-all text-center ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                            : 'border-[var(--app-line)] hover:border-emerald-500/40'
                        }`}
                      >
                        {val}×
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Qur'an Verses Goal */}
              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider mb-2">
                  Daily Qur’an Verses Target
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {QURAN_GOAL_OPTIONS.map((val) => {
                    const isSelected = profile.dailyQuranGoal === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateProfileField('dailyQuranGoal', val)}
                        className={`rounded-xl border py-2 text-xs font-bold transition-all text-center ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                            : 'border-[var(--app-line)] hover:border-emerald-500/40'
                        }`}
                      >
                        {val} Ayahs
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Format */}
              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider mb-2">
                  Clock & Time Display
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateProfileField('clockFormat', '12h')}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center ${
                      profile.clockFormat === '12h'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-[var(--app-line)]'
                    }`}
                  >
                    12-Hour (e.g. 1:45 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProfileField('clockFormat', '24h')}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center ${
                      profile.clockFormat === '24h'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-[var(--app-line)]'
                    }`}
                  >
                    24-Hour (e.g. 13:45)
                  </button>
                </div>
              </div>

              {/* Hijri Moon Sighting Adjustment */}
              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider mb-1">
                  Hijri Calendar Moon Sighting Offset
                </label>
                <p className="text-[11px] text-[var(--app-muted)] mb-2">
                  Adjust date forward or backward to match your regional moon sighting.
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[-2, -1, 0, 1, 2].map((offset) => {
                    const isSelected = profile.hijriOffset === offset;
                    return (
                      <button
                        key={offset}
                        type="button"
                        onClick={() => updateProfileField('hijriOffset', offset)}
                        className={`rounded-xl border py-2 text-xs font-bold transition-all text-center ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500'
                            : 'border-[var(--app-line)] hover:border-emerald-500/40'
                        }`}
                      >
                        {offset === 0 ? '0 (Auto)' : offset > 0 ? `+${offset}d` : `${offset}d`}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  <Calendar className="mr-1.5 inline h-3.5 w-3.5" />
                  <span>Adjusted Today: {adjustedHijriDate}</span>
                </div>
              </div>
            </section>

            {/* Section 3: Appearance & Sound */}
            <section className={`${cardClass} p-5 sm:p-6 space-y-2`} aria-labelledby="appearance-title">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--app-line)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <Moon className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="appearance-title" className="text-sm font-bold">Appearance & Feedback</h2>
                  <p className="text-xs text-[var(--app-muted)]">Control theme, sounds, and reader preferences.</p>
                </div>
              </div>

              <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2" htmlFor="dark-mode">
                <span className="grid gap-0.5">
                  <strong className="text-xs font-bold">Dark appearance</strong>
                  <small className="text-[11px] text-[var(--app-muted)]">Gentle low-light contrast mode.</small>
                </span>
                <input
                  id="dark-mode"
                  type="checkbox"
                  role="switch"
                  checked={dark}
                  onChange={(e) => setDark(e.target.checked)}
                />
              </label>

              <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 border-t border-[var(--app-line)] py-2" htmlFor="sound-effects">
                <span className="grid gap-0.5">
                  <strong className="text-xs font-bold">Audio & Haptic Feedback</strong>
                  <small className="text-[11px] text-[var(--app-muted)]">Play subtle click sound on count taps.</small>
                </span>
                <input
                  id="sound-effects"
                  type="checkbox"
                  role="switch"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                />
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--app-line)] py-3">
                <span className="grid gap-0.5">
                  <strong className="inline-flex items-center gap-1.5 text-xs font-bold">
                    <Volume2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
                    Du‘ā & Supplication Voice
                  </strong>
                  <small className="text-[11px] text-[var(--app-muted)]">
                    Authentic male recitation (default). Reads exact situational du‘ās and Prophetic supplications with male-tuned Arabic cadence.
                  </small>
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-1 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender('male');
                      setVoiceGenderState('male');
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      voiceGender === 'male'
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    <span>♂ Male (Default)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender('female');
                      setVoiceGenderState('female');
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      voiceGender === 'female'
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    <span>♀ Female</span>
                  </button>
                </div>
              </div>

              <div className="flex min-h-14 items-center justify-between gap-4 border-t border-[var(--app-line)] py-2">
                <span className="grid gap-0.5">
                  <strong className="inline-flex items-center gap-1.5 text-xs font-bold">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
                    Qur’an Reader Customization
                  </strong>
                  <small className="text-[11px] text-[var(--app-muted)]">Adjust font size, translations & reciters.</small>
                </span>
                <Link
                  href="/quran"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-200"
                >
                  Open reader <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>

            {/* Section 4: Reminders */}
            <section className={`${cardClass} p-5 sm:p-6 space-y-4`} aria-labelledby="reminders-title">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--app-line)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <BellRing className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="reminders-title" className="text-sm font-bold">Adhkār Push Notifications</h2>
                  <p className="text-xs text-[var(--app-muted)]">Background scheduled reminders for morning and evening.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-3.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129/20%)] animate-pulse" />
                <div>
                  <strong className="text-xs font-bold">{loadReminderSummary()}</strong>
                  <p className="text-[11px] text-[var(--app-muted)]">Morning & evening authentic du‘ā reminders.</p>
                </div>
              </div>

              <button
                type="button"
                className="w-full min-h-11 rounded-xl border border-[var(--app-line)] px-4 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm"
                onClick={() => setShowNotifications(true)}
              >
                Configure Notification Times & Web Push
              </button>
            </section>

            {/* Section 5: Prayer Calculation Methods */}
            <section className={`${cardClass} p-5 sm:p-6 space-y-4`} aria-labelledby="prayer-settings-title">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--app-line)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="prayer-settings-title" className="text-sm font-bold">Prayer Calculations</h2>
                  <p className="text-xs text-[var(--app-muted)]">Astronomical calculation methods tailored to your region.</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="calculation-method">
                  Fajr & Isha Authority
                </label>
                <select
                  id="calculation-method"
                  className={fieldClass}
                  value={salahSettings.calcMethod}
                  onChange={(e) =>
                    setSalahSettings((current) => ({
                      ...current,
                      calcMethod: e.target.value as SalahSettings['calcMethod'],
                    }))
                  }
                >
                  {[
                    'MuslimWorldLeague',
                    'Egyptian',
                    'Karachi',
                    'UmmAlQura',
                    'Dubai',
                    'NorthAmerica',
                    'Kuwait',
                    'Qatar',
                    'Singapore',
                    'Turkey',
                  ].map((method) => (
                    <option className="bg-surface text-ink" key={method} value={method}>
                      {method.replace(/([A-Z])/g, ' $1').trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="asr-method">
                  ‘Asr Jurisprudence Method
                </label>
                <select
                  id="asr-method"
                  className={fieldClass}
                  value={salahSettings.asrMethod}
                  onChange={(e) =>
                    setSalahSettings((current) => ({
                      ...current,
                      asrMethod: e.target.value as SalahSettings['asrMethod'],
                    }))
                  }
                >
                  <option className="bg-surface text-ink" value="Standard">
                    Standard (Shadow = 1×) — Shāfi‘ī, Mālikī, Ḥanbalī
                  </option>
                  <option className="bg-surface text-ink" value="Hanafi">
                    Ḥanafī (Shadow = 2×)
                  </option>
                </select>
              </div>

              <Link
                href="/salah"
                className="inline-flex items-center gap-1 text-xs font-bold text-link hover:text-link-hover"
              >
                View Ṣalāh schedule <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            {/* Section 6: Data Backup, Export & Sovereignty */}
            <section className={`${cardClass} p-5 sm:p-6 space-y-4`} aria-labelledby="data-title">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--app-line)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <Download className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="data-title" className="text-sm font-bold">Data Sovereignty & Backup</h2>
                  <p className="text-xs text-[var(--app-muted)]">Download a complete copy of your spiritual data.</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 transition-all disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? 'Generating Backup…' : 'Export My Spiritual Data (JSON)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300/40 bg-transparent px-4 py-2.5 text-xs font-semibold text-[var(--app-muted)] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isClearingCache ? 'Clearing…' : 'Clear Temporary App Cache'}</span>
                </button>
              </div>
            </section>
          </div>

          {/* Bottom Save Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/40 bg-[var(--app-surface)] p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Save your changes across this device and cloud</span>
            </div>
            <button
              type="button"
              onClick={() => void handleProfileSave()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 transition-all active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </div>
      </AppShell>

      {showAuth && <AuthModal dark={dark} onClose={() => setShowAuth(false)} />}
      {showNotifications && (
        <NotificationSettings
          dark={dark}
          userId={user?.id ?? null}
          onClose={() => setShowNotifications(false)}
        />
      )}
      {showProModal && (
        <DhikrlyProModal dark={dark} onClose={() => setShowProModal(false)} />
      )}
    </div>
  );
}

function loadReminderSummary() {
  const settings = load(NOTIFICATION_KEY, {
    morningEnabled: false,
    eveningEnabled: false,
  });
  if (settings.morningEnabled && settings.eveningEnabled) return 'Morning & evening enabled';
  if (settings.morningEnabled) return 'Morning reminder enabled';
  if (settings.eveningEnabled) return 'Evening reminder enabled';
  return 'Reminders are currently off';
}
