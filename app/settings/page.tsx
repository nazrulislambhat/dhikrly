'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Compass,
  Download,
  Flame,
  Globe,
  Heart,
  Image as ImageIcon,
  Landmark,
  Leaf,
  Link as LinkIcon,
  MapPin,
  Moon,
  Music,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Vibrate,
  Volume2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import AuthModal from '@/components/AuthModal';
import NotificationSettings from '@/components/NotificationSettings';
import DhikrlyProModal from '@/components/DhikrlyProModal';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_SALAH_SETTINGS, getSalahSettings, saveSalahSettings } from '@/lib/salahStorage';
import {
  load,
  NOTIFICATION_KEY,
  save,
  SETTINGS_KEY,
  STORAGE_KEY,
  STREAK_KEY,
  CUSTOM_DUAS_KEY,
} from '@/lib/storage';
import {
  DEFAULT_QURAN_SETTINGS,
  DEFAULT_RECITERS,
  QURAN_BOOKMARK_KEY,
  QURAN_BOOKMARKS_KEY,
  QURAN_PROGRESS_KEY,
  QURAN_SETTINGS_KEY,
  type QuranSettings,
} from '@/lib/quran';
import { supabase } from '@/lib/supabase';
import type { SalahSettings } from '@/types/salah';
import { usePro } from '@/hooks/usePro';
import { getVoiceGender, setVoiceGender, type VoiceGender } from '@/lib/duaAudio';

export interface UserProfileSettings {
  displayName: string;
  avatarIcon: string;
  avatarColor: string;
  avatarUrl?: string;
  niyyah: string;
  madhhab: 'Standard' | 'Hanafi' | 'Jafari';
  city: string;
  country: string;
  hijriOffset: number;
  dailyDhikrGoal: number;
  dailyQuranGoal: number;
  clockFormat: '12h' | '24h';
  // Spiritual & Reader enhancements
  quranReciter?: string;
  quranScript?: 'uthmani' | 'indopak';
  arabicFontSize?: number;
  quranTranslation?: string;
  hapticEnabled?: boolean;
  wakeLockEnabled?: boolean;
  autoAdvance?: boolean;
  fridayKahfReminder?: boolean;
}

const DEFAULT_PROFILE: UserProfileSettings = {
  displayName: '',
  avatarIcon: 'crescent',
  avatarColor: 'primary',
  avatarUrl: undefined,
  niyyah: '',
  madhhab: 'Standard',
  city: '',
  country: '',
  hijriOffset: 0,
  dailyDhikrGoal: 100,
  dailyQuranGoal: 20,
  clockFormat: '12h',
  quranReciter: 'ar.alafasy',
  quranScript: 'uthmani',
  arabicFontSize: 32,
  quranTranslation: 'en.sahih',
  hapticEnabled: true,
  wakeLockEnabled: false,
  autoAdvance: true,
  fridayKahfReminder: true,
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

const AVATAR_COLORS: Record<
  string,
  { label: string; bg: string; text: string; ring: string; border: string; circle: string }
> = {
  primary: {
    label: 'Primary Sacred',
    bg: 'bg-primary',
    text: 'text-primary-fg',
    ring: 'ring-primary',
    border: 'border-primary',
    circle: 'bg-primary',
  },
  link: {
    label: 'Amber Radiance',
    bg: 'bg-link',
    text: 'text-white',
    ring: 'ring-link',
    border: 'border-link',
    circle: 'bg-link',
  },
  tintPrimary: {
    label: 'Primary Soft',
    bg: 'bg-primary/20',
    text: 'text-primary',
    ring: 'ring-primary',
    border: 'border-primary/40',
    circle: 'bg-primary/40',
  },
  tintAmber: {
    label: 'Amber Soft',
    bg: 'bg-link/20',
    text: 'text-link',
    ring: 'ring-link',
    border: 'border-link/40',
    circle: 'bg-link/40',
  },
  surface: {
    label: 'Neutral Surface',
    bg: 'bg-surface',
    text: 'text-ink',
    ring: 'ring-border',
    border: 'border-border',
    circle: 'bg-border',
  },
  deep: {
    label: 'Deep Ink',
    bg: 'bg-ink',
    text: 'text-canvas',
    ring: 'ring-ink',
    border: 'border-ink',
    circle: 'bg-ink',
  },
};

const NIYYAH_SUGGESTIONS = [
  'Seeking consistency in my 5 daily prayers on time.',
  'Reciting and reflecting upon the Holy Qur’an every single day.',
  'Reviving authentic morning and evening adhkār.',
  'Nourishing my heart with continuous gratitude, dhikr and repentance.',
];

const DHIKR_GOAL_OPTIONS = [33, 100, 300, 500, 1000, 2500];
const QURAN_GOAL_OPTIONS = [5, 10, 20, 50, 100];

const RECITERS_LIST = [
  {
    id: 'ar.alafasy',
    name: 'Mishary Rashid Alafasy',
    origin: 'Kuwait',
    style: 'Melodic & Clear',
  },
  {
    id: 'ar.abdurrahmaansudais',
    name: 'Abdurrahmaan As-Sudais',
    origin: 'Makkah Al-Mukarramah',
    style: 'Swift & Reverent',
  },
  {
    id: 'ar.husary',
    name: 'Mahmoud Khalil Al-Husary',
    origin: 'Egypt',
    style: 'Strict Tajwīd Murattal',
  },
  {
    id: 'ar.abdulbasitmurattal',
    name: 'Abdul Basit ‘Abdus-Samad',
    origin: 'Egypt',
    style: 'Majestic & Resonant',
  },
  {
    id: 'ar.mahermuaiqly',
    name: 'Maher Al Muaiqly',
    origin: 'Madinah Al-Munawwarah',
    style: 'Emotional & Moving',
  },
];

const ARABIC_FONT_SIZES = [
  { label: 'Standard', size: 28 },
  { label: 'Balanced', size: 32 },
  { label: 'Large', size: 38 },
  { label: 'Magnified', size: 44 },
];

type SettingsTab = 'all' | 'profile' | 'quran' | 'prayer' | 'sensory' | 'goals' | 'data';

const TABS: { id: SettingsTab; label: string; icon: typeof UserRound }[] = [
  { id: 'all', label: 'All Settings', icon: Sparkles },
  { id: 'profile', label: 'Identity & Photo', icon: UserRound },
  { id: 'quran', label: 'Qur’an & Reciters', icon: BookOpen },
  { id: 'prayer', label: 'Prayer & Hijri', icon: Clock3 },
  { id: 'sensory', label: 'Sound & Haptics', icon: Volume2 },
  { id: 'goals', label: 'Worship Goals', icon: Heart },
  { id: 'data', label: 'Backup & Restore', icon: Download },
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const isLoaded = useRef(false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const [dark, setDark] = useState<boolean>(false);
  const [sound, setSound] = useState<boolean>(true);
  const [voiceGender, setVoiceGenderState] = useState<VoiceGender>('male');
  const [salahSettings, setSalahSettings] = useState<SalahSettings>(DEFAULT_SALAH_SETTINGS);
  const [quranSettings, setQuranSettings] = useState<QuranSettings>(DEFAULT_QURAN_SETTINGS);
  const [profile, setProfile] = useState<UserProfileSettings>(DEFAULT_PROFILE);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const { isPro, tier: proTier } = usePro();
  const { user, loading, signOut } = useAuth();

  // Load initial settings on mount
  useEffect(() => {
    setMounted(true);
    const existing = load<{ dark: boolean; sound?: boolean; haptic?: boolean }>(SETTINGS_KEY, {
      dark: false,
      sound: true,
      haptic: true,
    });
    setDark(existing.dark);
    setSound(existing.sound ?? true);
    setVoiceGenderState(getVoiceGender());
    setSalahSettings(getSalahSettings());

    const savedQuran = load<QuranSettings>(QURAN_SETTINGS_KEY, DEFAULT_QURAN_SETTINGS);
    setQuranSettings(savedQuran);

    const savedProfile = load<UserProfileSettings>(PROFILE_KEY, DEFAULT_PROFILE);
    setProfile(savedProfile);

    isLoaded.current = true;
  }, []);

  // Update theme & sound in storage
  useEffect(() => {
    if (!isLoaded.current) return;
    document.documentElement.classList.toggle('dark', dark);
    const existing = load<{ dark: boolean; sound?: boolean; haptic?: boolean }>(SETTINGS_KEY, {
      dark,
      sound: true,
      haptic: true,
    });
    save(SETTINGS_KEY, { ...existing, dark, sound });
  }, [dark, sound]);

  // Sync with user metadata from Supabase
  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata;
      setProfile((prev) => {
        // If avatarUrl was not set by user, fetch from OAuth metadata (Google picture or avatar_url)
        const detectedAvatar =
          prev.avatarUrl ||
          (typeof meta.avatar_url === 'string' && meta.avatar_url ? meta.avatar_url : undefined) ||
          (typeof meta.picture === 'string' && meta.picture ? meta.picture : undefined);

        return {
          ...prev,
          displayName: prev.displayName || meta.full_name || meta.name || '',
          avatarUrl: detectedAvatar,
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
          quranReciter: meta.quran_reciter || prev.quranReciter,
          arabicFontSize: meta.arabic_font_size || prev.arabicFontSize,
        };
      });
    }
  }, [user]);

  // Keyboard shortcut: Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleProfileSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profile, salahSettings, quranSettings, user]);

  const updateProfileField = <K extends keyof UserProfileSettings>(
    field: K,
    val: UserProfileSettings[K]
  ) => {
    setHasUnsavedChanges(true);
    setProfile((prev) => {
      const updated = { ...prev, [field]: val };
      save(PROFILE_KEY, updated);
      return updated;
    });

    // Auto-sync Madhhab to Asr calculation
    if (field === 'madhhab') {
      const asr: 'Standard' | 'Hanafi' = val === 'Hanafi' ? 'Hanafi' : 'Standard';
      setSalahSettings((prev) => {
        const next: SalahSettings = { ...prev, asrMethod: asr };
        saveSalahSettings(next);
        return next;
      });
    }

    // Auto-sync reciter and font size to Quran settings
    if (field === 'quranReciter' && typeof val === 'string') {
      setQuranSettings((prev) => {
        const next = { ...prev, reciter: val };
        save(QURAN_SETTINGS_KEY, next);
        return next;
      });
    }
    if (field === 'arabicFontSize' && typeof val === 'number') {
      setQuranSettings((prev) => {
        const next = { ...prev, arabicFontSize: val };
        save(QURAN_SETTINGS_KEY, next);
        return next;
      });
    }
  };

  const handleProfileSave = async () => {
    setStatusMessage('');
    setErrorMessage('');
    save(PROFILE_KEY, profile);
    saveSalahSettings(salahSettings);
    save(QURAN_SETTINGS_KEY, quranSettings);

    if (user) {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: profile.avatarUrl || null,
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
          quran_reciter: profile.quranReciter,
          arabic_font_size: profile.arabicFontSize,
          haptic_enabled: profile.hapticEnabled,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }

    // Notify other components (e.g. UserMenu)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dhikrly:profile-updated'));
    }

    setHasUnsavedChanges(false);
    setStatusMessage('All preferences saved successfully across device and cloud!');
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Upload Photo handler with instant client-side canvas compression to ~256x256 WebP/JPEG (<35KB)
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          updateProfileField('avatarUrl', dataUrl);
          setStatusMessage('Profile photo updated successfully!');
          setTimeout(() => setStatusMessage(''), 3000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Apply photo URL
  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) return;
    updateProfileField('avatarUrl', customUrlInput.trim());
    setCustomUrlInput('');
    setShowUrlInput(false);
    setStatusMessage('Custom photo URL applied!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Restore OAuth photo from Google
  const handleRestoreOAuthPhoto = () => {
    const oauthUrl =
      (typeof user?.user_metadata?.avatar_url === 'string' && user.user_metadata.avatar_url) ||
      (typeof user?.user_metadata?.picture === 'string' && user.user_metadata.picture) ||
      null;

    if (oauthUrl) {
      updateProfileField('avatarUrl', oauthUrl);
      setStatusMessage('Restored profile photo from account provider!');
      setTimeout(() => setStatusMessage(''), 3000);
    } else {
      setErrorMessage('No provider avatar photo found in your signed-in account.');
      setTimeout(() => setErrorMessage(''), 3500);
    }
  };

  // Remove Photo
  const handleRemovePhoto = () => {
    updateProfileField('avatarUrl', undefined);
    setStatusMessage('Profile photo removed. Reverted to spiritual avatar motif.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Location Auto-detection via Nominatim OpenStreetMap
  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
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
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
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

            setSalahSettings((prev) => {
              const updated: SalahSettings = {
                ...prev,
                location: {
                  lat: latitude,
                  lng: longitude,
                  city: cityName,
                  country: countryName,
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
              };
              saveSalahSettings(updated);
              return updated;
            });

            setStatusMessage(`Location updated to ${cityName}, ${countryName}`);
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
      { timeout: 10000 }
    );
  };

  // Calculate formatted Hijri date preview with day offset
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
      return 'Calculation unavailable';
    }
  }, [profile.hijriOffset]);

  // Export full JSON backup
  const handleExportData = () => {
    setIsExporting(true);
    try {
      const backup = {
        app: 'Dhikrly',
        version: '2.3.0',
        exportedAt: new Date().toISOString(),
        profile,
        adhkarChecked: load(STORAGE_KEY, null),
        streaks: load(STREAK_KEY, null),
        salahLogs: load('salah_log_v1', null),
        salahSettings: load('salah_settings_v1', null),
        customDuas: load(CUSTOM_DUAS_KEY, null),
        quranSettings: load(QURAN_SETTINGS_KEY, null),
        quranProgress: load(QURAN_PROGRESS_KEY, null),
        quranBookmarks: load(QURAN_BOOKMARKS_KEY, null),
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

      setStatusMessage('Complete spiritual data backup generated and downloaded!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      setErrorMessage('Could not generate data backup.');
    } finally {
      setIsExporting(false);
    }
  };

  // Import and Restore Backup (JSON)
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON file format.');
        }

        if (!parsed.app && !parsed.profile && !parsed.salahSettings && !parsed.adhkarChecked) {
          throw new Error('This file does not appear to be an authentic Dhikrly backup.');
        }

        const confirmRestore = window.confirm(
          'Restore spiritual data from backup? Existing local data will be replaced with the contents of this backup.'
        );

        if (!confirmRestore) return;

        if (parsed.profile) {
          save(PROFILE_KEY, parsed.profile);
          setProfile(parsed.profile);
        }
        if (parsed.adhkarChecked) save(STORAGE_KEY, parsed.adhkarChecked);
        if (parsed.streaks) save(STREAK_KEY, parsed.streaks);
        if (parsed.salahLogs) save('salah_log_v1', parsed.salahLogs);
        if (parsed.salahSettings) {
          save('salah_settings_v1', parsed.salahSettings);
          setSalahSettings(parsed.salahSettings);
        }
        if (parsed.customDuas) save(CUSTOM_DUAS_KEY, parsed.customDuas);
        if (parsed.quranSettings) {
          save(QURAN_SETTINGS_KEY, parsed.quranSettings);
          setQuranSettings(parsed.quranSettings);
        }
        if (parsed.quranProgress) save(QURAN_PROGRESS_KEY, parsed.quranProgress);
        if (parsed.quranBookmarks) save(QURAN_BOOKMARKS_KEY, parsed.quranBookmarks);
        if (parsed.qadaMissedPrayers) save('dhikrly_qada_v1', parsed.qadaMissedPrayers);
        if (parsed.zakatHistory) save('dhikrly_zakat_v1', parsed.zakatHistory);
        if (parsed.notifications) save(NOTIFICATION_KEY, parsed.notifications);

        setStatusMessage('Spiritual data backup successfully restored! All records active.');
        setTimeout(() => setStatusMessage(''), 4500);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid backup file';
        setErrorMessage(`Failed to restore backup: ${msg}`);
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = '';
  };

  // Clear cache
  const handleClearCache = () => {
    if (
      !window.confirm(
        'Clear cached app assets and offline data? Your saved bookmarks, streaks and settings are completely preserved.'
      )
    ) {
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

  // Safe Factory Reset
  const handleResetData = () => {
    if (
      !window.confirm(
        'WARNING: Are you sure you wish to reset all local Dhikrly data on this device? This will erase local history, checked adhkār, streaks, and preferences.'
      )
    ) {
      return;
    }
    if (
      !window.confirm(
        'FINAL CONFIRMATION: This action cannot be reversed unless you have a JSON backup file. Proceed?'
      )
    ) {
      return;
    }

    try {
      const keysToClear = [
        PROFILE_KEY,
        STORAGE_KEY,
        STREAK_KEY,
        'salah_log_v1',
        'salah_settings_v1',
        CUSTOM_DUAS_KEY,
        QURAN_PROGRESS_KEY,
        QURAN_BOOKMARKS_KEY,
        QURAN_SETTINGS_KEY,
        'dhikrly_qada_v1',
        'dhikrly_zakat_v1',
        NOTIFICATION_KEY,
        SETTINGS_KEY,
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
      setProfile(DEFAULT_PROFILE);
      setSalahSettings(DEFAULT_SALAH_SETTINGS);
      setStatusMessage('All local data cleared. Refreshing in a moment…');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setErrorMessage('Failed to reset data.');
    }
  };

  const selectedAvatar = AVATAR_ICONS.find((a) => a.id === profile.avatarIcon) || AVATAR_ICONS[0];
  const selectedColor = AVATAR_COLORS[profile.avatarColor] || AVATAR_COLORS.primary;
  const SelectedIcon = selectedAvatar.Icon;

  const cardClass = 'rounded-3xl border border-border bg-surface p-5 sm:p-7 shadow-xs';
  const fieldClass =
    'min-h-11 w-full rounded-xl border border-border bg-canvas px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  const hasPhoto = Boolean(profile.avatarUrl);

  const shouldShowSection = (tab: SettingsTab) => activeTab === 'all' || activeTab === tab;

  return (
    <div className="min-h-dvh text-ink">
      <AppShell active="settings" dark={dark} onToggleDark={() => setDark((value) => !value)}>
        <div className="mx-auto w-[min(calc(100%-2rem),76rem)] px-2 py-6 sm:py-8 lg:px-4 space-y-6">
          {/* Header Title */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
                <UserRound className="h-3.5 w-3.5" />
                <span>SACRED SPACE & APP PREFERENCES</span>
              </div>
              <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight sm:text-4xl text-ink">
                Profile & Settings
              </h1>
              <p className="mt-1.5 text-sm text-ink/75 max-w-2xl">
                Personalize your spiritual identity, profile photo, reciters, prayer calibration,
                haptics, and data sovereignty.
              </p>
            </div>

            {/* Quick Dark Mode & Save Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDark((v) => !v)}
                className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface hover:bg-surface/80 px-3 py-2 text-xs font-semibold text-ink transition-colors cursor-pointer"
                title="Toggle Appearance"
              >
                <Moon className="h-4 w-4" />
                <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </header>

          {/* Alert Status Banners */}
          {statusMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs font-bold text-primary animate-fade-in shadow-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-xs font-bold text-ink animate-fade-in shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-link" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account & Profile Hero Banner */}
          <section className={`${cardClass} overflow-hidden relative`} aria-labelledby="profile-title">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Avatar Display (Real Photo or Spiritual Motif) */}
                <div className="relative group shrink-0">
                  <div
                    className={`h-20 w-20 sm:h-24 sm:w-24 rounded-3xl overflow-hidden border-2 shadow-md flex items-center justify-center transition-all ${
                      hasPhoto
                        ? 'border-primary'
                        : `${selectedColor.bg} ${selectedColor.text} ${selectedColor.border}`
                    }`}
                  >
                    {hasPhoto ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Profile photo"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector(
                            '.avatar-icon-fallback'
                          ) as HTMLElement | null;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`avatar-icon-fallback h-full w-full flex items-center justify-center ${
                        hasPhoto ? 'hidden' : 'flex'
                      }`}
                    >
                      <SelectedIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                    </div>
                  </div>

                  {/* Photo quick edit badge */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change profile photo"
                    className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-xl bg-primary text-primary-fg shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer border border-surface"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Profile Identity Details */}
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      <ShieldCheck className="h-3 w-3" />
                      {user ? 'Cloud Synced' : 'Offline Pilgrim'}
                    </span>
                    {isPro && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-link/40 bg-link/10 px-2.5 py-0.5 text-[11px] font-bold text-link">
                        <Sparkles className="h-3 w-3" />
                        Pro {proTier.toUpperCase()}
                      </span>
                    )}
                    <span className="text-[11px] text-ink/60">· 100% Private</span>
                  </div>

                  <h2 id="profile-title" className="text-xl sm:text-2xl font-black text-ink truncate">
                    {profile.displayName || (loading ? 'Loading…' : user?.email ?? 'Pilgrim of Dhikrly')}
                  </h2>

                  <p className="text-xs text-ink/75 italic line-clamp-1">
                    {profile.niyyah
                      ? `“${profile.niyyah}”`
                      : user?.email || 'Your spiritual records are preserved securely.'}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-ink/60">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {profile.city && profile.country
                        ? `${profile.city}, ${profile.country}`
                        : profile.city || profile.country || 'Location uncalibrated'}
                    </span>
                    <span>·</span>
                    <span>{profile.madhhab} Tradition</span>
                  </div>
                </div>
              </div>

              {/* Account Sign In / Sign Out Button */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                {user ? (
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="min-h-10 rounded-xl border border-border px-4 text-xs font-semibold hover:bg-canvas transition-colors cursor-pointer text-ink"
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAuth(true)}
                    className="min-h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-fg shadow-xs hover:bg-primary-hover transition-all cursor-pointer"
                  >
                    Sign In / Sync Cloud
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowProModal(true)}
                  className="min-h-10 rounded-xl border border-link/40 bg-link/10 px-3.5 text-xs font-bold text-link hover:bg-link/20 transition-all cursor-pointer"
                >
                  Dhikrly Pro
                </button>
              </div>
            </div>
          </section>

          {/* Category Tabs Navigation */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none" aria-label="Settings Categories">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-fg shadow-xs'
                      : 'border border-border bg-surface text-ink hover:bg-canvas'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Main Settings Sections */}
          <div className="space-y-6">
            {/* Section 1: Persona, Profile Photo & Identity */}
            {shouldShowSection('profile') && (
              <section className={cardClass} aria-labelledby="identity-heading">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 id="identity-heading" className="text-base font-bold text-ink">
                      Spiritual Identity & Profile Photo
                    </h2>
                    <p className="text-xs text-ink/75">
                      Upload your real profile picture, select spiritual motifs, display name and aspiration.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-6">
                  {/* Photo Management Controls */}
                  <div className="rounded-2xl border border-border bg-canvas p-4 sm:p-5 space-y-4">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Profile Picture
                    </label>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl overflow-hidden border border-border bg-surface flex items-center justify-center shrink-0">
                          {hasPhoto ? (
                            <img
                              src={profile.avatarUrl}
                              alt="Avatar"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <SelectedIcon className="h-7 w-7 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink">
                            {hasPhoto ? 'Custom Photo Active' : 'Spiritual Motif Active'}
                          </p>
                          <p className="text-[11px] text-ink/70">
                            {hasPhoto
                              ? 'Saved locally & synced to your account avatar.'
                              : 'Select an image or use your signed-in provider picture.'}
                          </p>
                        </div>
                      </div>

                      {/* Photo Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileChange}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-fg shadow-xs hover:bg-primary-hover transition-all cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Photo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowUrlInput((v) => !v)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface/80 transition-all cursor-pointer"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span>Photo URL</span>
                        </button>

                        {user && (
                          <button
                            type="button"
                            onClick={handleRestoreOAuthPhoto}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface/80 transition-all cursor-pointer"
                            title="Fetch picture from Google or OAuth provider"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-primary" />
                            <span>Fetch Account Photo</span>
                          </button>
                        )}

                        {hasPhoto && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-ink hover:text-link transition-all cursor-pointer"
                            title="Revert to motif icon"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Image URL Input Modal / Collapse */}
                    {showUrlInput && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2 animate-fade-in">
                        <input
                          type="url"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                          className={`${fieldClass} grow`}
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-fg shadow-xs hover:bg-primary-hover transition-all cursor-pointer shrink-0"
                        >
                          Apply URL
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Spiritual Avatar Motif Selection (Fallback) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Spiritual Motif & Icon
                    </label>
                    <p className="text-[11px] text-ink/70">
                      Used when no custom photo is chosen, or as your sacred monogram.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {AVATAR_ICONS.map((item) => {
                        const isSelected = profile.avatarIcon === item.id;
                        const ItemIcon = item.Icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateProfileField('avatarIcon', item.id)}
                            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/40 font-bold'
                                : 'border-border bg-canvas text-ink/80 hover:border-primary/40'
                            }`}
                          >
                            <ItemIcon className="h-5 w-5" />
                            <span className="text-[11px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motif Accent Palette (Strict Brand Tokens) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Motif Accent Palette
                    </label>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {Object.entries(AVATAR_COLORS).map(([colorKey, cfg]) => {
                        const isSelected = profile.avatarColor === colorKey;
                        return (
                          <button
                            key={colorKey}
                            type="button"
                            onClick={() => updateProfileField('avatarColor', colorKey)}
                            className={`h-9 w-9 rounded-2xl ${cfg.circle} flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-3 ring-offset-2 ring-primary scale-105'
                                : 'opacity-80 hover:opacity-100'
                            }`}
                            title={cfg.label}
                          >
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink" htmlFor="profile-name">
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
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink" htmlFor="profile-niyyah">
                      My Niyyah & Spiritual Aspiration
                    </label>
                    <textarea
                      id="profile-niyyah"
                      rows={2}
                      className={`${fieldClass} py-2 resize-none`}
                      value={profile.niyyah}
                      onChange={(e) => updateProfileField('niyyah', e.target.value)}
                      maxLength={180}
                      placeholder="What is your guiding spiritual intention?"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {NIYYAH_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => updateProfileField('niyyah', suggestion)}
                          className="rounded-lg border border-border bg-canvas px-2.5 py-1 text-[11px] text-ink/80 hover:text-ink hover:border-primary/50 transition-colors cursor-pointer text-left"
                        >
                          + “{suggestion.slice(0, 38)}…”
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Madhhab & Fiqh Tradition */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink" htmlFor="profile-madhhab">
                      Jurisprudence Tradition (Madhhab)
                    </label>
                    <select
                      id="profile-madhhab"
                      className={`${fieldClass} cursor-pointer`}
                      value={profile.madhhab}
                      onChange={(e) =>
                        updateProfileField('madhhab', e.target.value as UserProfileSettings['madhhab'])
                      }
                    >
                      <option className="bg-surface text-ink" value="Standard">
                        Standard (Shāfi‘ī, Mālikī, Ḥanbalī) — 1× shadow ‘Asr
                      </option>
                      <option className="bg-surface text-ink" value="Hanafi">
                        Ḥanafī — 2× shadow ‘Asr
                      </option>
                      <option className="bg-surface text-ink" value="Jafari">
                        Ja‘farī
                      </option>
                    </select>
                  </div>

                  {/* Home City & Country (GPS Auto-detect) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-ink" htmlFor="profile-city">
                        Home City & Country
                      </label>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isLocating}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>{isLocating ? 'Detecting via GPS…' : 'Auto-detect GPS'}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        id="profile-city"
                        className={fieldClass}
                        value={profile.city}
                        onChange={(e) => updateProfileField('city', e.target.value)}
                        placeholder="City (e.g. London, Istanbul, Medina)"
                      />
                      <input
                        id="profile-country"
                        className={fieldClass}
                        value={profile.country}
                        onChange={(e) => updateProfileField('country', e.target.value)}
                        placeholder="Country (e.g. UK, Turkey, Saudi Arabia)"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Section 2: Qur’an & Reciters Calibration */}
            {shouldShowSection('quran') && (
              <section className={cardClass} aria-labelledby="quran-heading">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 id="quran-heading" className="text-base font-bold text-ink">
                        Qur’an Recitation & Reading Typography
                      </h2>
                      <p className="text-xs text-ink/75">
                        Customize your preferred Qari reciter, font size, script, and daily targets.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/quran"
                    className="inline-flex items-center gap-1 text-xs font-bold text-link hover:text-link-hover cursor-pointer"
                  >
                    <span>Open Reader</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-5 space-y-6">
                  {/* Reciter Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Default Holy Qur’an Reciter (Qari)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {RECITERS_LIST.map((qari) => {
                        const isSelected = (profile.quranReciter || 'ar.alafasy') === qari.id;
                        return (
                          <button
                            key={qari.id}
                            type="button"
                            onClick={() => updateProfileField('quranReciter', qari.id)}
                            className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                                : 'border-border bg-canvas hover:border-primary/40'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-ink">{qari.name}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                            </div>
                            <span className="text-[10px] text-primary font-semibold">{qari.origin}</span>
                            <span className="text-[10px] text-ink/60 mt-0.5">{qari.style}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Arabic Font Size Picker with Live Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink uppercase tracking-wider">
                        Arabic Reading Font Scale
                      </label>
                      <span className="text-xs font-bold text-primary">
                        {profile.arabicFontSize || 32}px
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ARABIC_FONT_SIZES.map((item) => {
                        const isSelected = (profile.arabicFontSize || 32) === item.size;
                        return (
                          <button
                            key={item.size}
                            type="button"
                            onClick={() => updateProfileField('arabicFontSize', item.size)}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary'
                                : 'border-border bg-canvas text-ink/80 hover:border-primary/40'
                            }`}
                          >
                            {item.label} ({item.size}px)
                          </button>
                        );
                      })}
                    </div>

                    {/* Live Arabic Typography Card */}
                    <div className="rounded-2xl border border-border bg-canvas p-4 text-center">
                      <span className="text-[10px] uppercase tracking-wider text-ink/60 font-semibold block mb-1">
                        Live Arabic Preview
                      </span>
                      <p
                        className="font-arabic text-ink leading-relaxed"
                        style={{ fontSize: `${profile.arabicFontSize || 32}px` }}
                      >
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                      </p>
                      <p className="text-[11px] text-ink/70 mt-1 italic">
                        In the name of Allah, the Entirely Merciful, the Especially Merciful.
                      </p>
                    </div>
                  </div>

                  {/* Arabic Script Style */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">
                      Arabic Script Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateProfileField('quranScript', 'uthmani')}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center cursor-pointer ${
                          (profile.quranScript || 'uthmani') === 'uthmani'
                            ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary'
                            : 'border-border bg-canvas text-ink/80'
                        }`}
                      >
                        Uthmāni (Madani Hafs)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProfileField('quranScript', 'indopak')}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center cursor-pointer ${
                          profile.quranScript === 'indopak'
                            ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary'
                            : 'border-border bg-canvas text-ink/80'
                        }`}
                      >
                        Indo-Pak (Nastaliq / South Asian)
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Section 3: Prayer Calculation & Astronomical Engine */}
            {shouldShowSection('prayer') && (
              <section className={cardClass} aria-labelledby="prayer-heading">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Clock3 className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 id="prayer-heading" className="text-base font-bold text-ink">
                        Prayer Times & Astronomical Calibration
                      </h2>
                      <p className="text-xs text-ink/75">
                        High-accuracy astronomical calculation authorities, ‘Asr shadows, and Hijri calendar.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/salah"
                    className="inline-flex items-center gap-1 text-xs font-bold text-link hover:text-link-hover cursor-pointer"
                  >
                    <span>View Schedule</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-5 space-y-6">
                  {/* Calculation Authority */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink" htmlFor="calc-method">
                      Fajr & Isha Calculation Authority
                    </label>
                    <select
                      id="calc-method"
                      className={`${fieldClass} cursor-pointer`}
                      value={salahSettings.calcMethod}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        setSalahSettings((curr) => {
                          const updated = {
                            ...curr,
                            calcMethod: e.target.value as SalahSettings['calcMethod'],
                          };
                          saveSalahSettings(updated);
                          return updated;
                        });
                      }}
                    >
                      {[
                        { id: 'Karachi', label: 'University of Islamic Sciences, Karachi (South Asia)' },
                        { id: 'MuslimWorldLeague', label: 'Muslim World League (Europe, Americas, Far East)' },
                        { id: 'UmmAlQura', label: 'Umm Al-Qura University, Makkah (Arabian Peninsula)' },
                        { id: 'Egyptian', label: 'Egyptian General Authority of Survey (Africa, Middle East)' },
                        { id: 'NorthAmerica', label: 'Islamic Society of North America - ISNA (USA & Canada)' },
                        { id: 'Dubai', label: 'Dubai / UAE Awqaf' },
                        { id: 'Kuwait', label: 'Kuwait Ministry of Awqaf' },
                        { id: 'Qatar', label: 'Qatar Ministry of Awqaf' },
                        { id: 'Singapore', label: 'Majlis Ugama Islam Singapura (MUIS)' },
                        { id: 'Turkey', label: 'Diyanet İşleri Başkanlığı (Turkey)' },
                      ].map((item) => (
                        <option className="bg-surface text-ink" key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ‘Asr Shadow Jurisprudence */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink" htmlFor="asr-method">
                      ‘Asr Jurisprudence Method
                    </label>
                    <select
                      id="asr-method"
                      className={`${fieldClass} cursor-pointer`}
                      value={salahSettings.asrMethod}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        setSalahSettings((curr) => {
                          const updated = {
                            ...curr,
                            asrMethod: e.target.value as SalahSettings['asrMethod'],
                          };
                          saveSalahSettings(updated);
                          return updated;
                        });
                      }}
                    >
                      <option className="bg-surface text-ink" value="Standard">
                        Standard (Shadow = 1×) — Shāfi‘ī, Mālikī, Ḥanbalī
                      </option>
                      <option className="bg-surface text-ink" value="Hanafi">
                        Ḥanafī (Shadow = 2×)
                      </option>
                    </select>
                  </div>

                  {/* Clock Format (12h vs 24h) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Clock & Time Display Format
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateProfileField('clockFormat', '12h')}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center cursor-pointer ${
                          profile.clockFormat === '12h'
                            ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary'
                            : 'border-border bg-canvas text-ink/80'
                        }`}
                      >
                        12-Hour (e.g. 1:45 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProfileField('clockFormat', '24h')}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center cursor-pointer ${
                          profile.clockFormat === '24h'
                            ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary'
                            : 'border-border bg-canvas text-ink/80'
                        }`}
                      >
                        24-Hour (e.g. 13:45)
                      </button>
                    </div>
                  </div>

                  {/* Hijri Calendar Moon Sighting Offset */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Hijri Moon Sighting Adjustment
                    </label>
                    <p className="text-[11px] text-ink/70">
                      Align the Islamic lunar date with verified local moon sighting in your country.
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[-2, -1, 0, 1, 2].map((offset) => {
                        const isSelected = profile.hijriOffset === offset;
                        return (
                          <button
                            key={offset}
                            type="button"
                            onClick={() => updateProfileField('hijriOffset', offset)}
                            className={`rounded-xl border py-2 text-xs font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary shadow-xs'
                                : 'border-border bg-canvas text-ink/80 hover:border-primary/40'
                            }`}
                          >
                            {offset === 0 ? '0 (Auto)' : offset > 0 ? `+${offset}d` : `${offset}d`}
                          </button>
                        );
                      })}
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center text-xs font-semibold text-primary">
                      <Calendar className="mr-1.5 inline h-3.5 w-3.5" />
                      <span>Adjusted Today: {adjustedHijriDate}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Section 4: Audio, Haptics & Sensory Feedback */}
            {shouldShowSection('sensory') && (
              <section className={cardClass} aria-labelledby="sensory-heading">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Volume2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 id="sensory-heading" className="text-base font-bold text-ink">
                      Sensory Feedback, Haptics & Sound
                    </h2>
                    <p className="text-xs text-ink/75">
                      Fine-tune counting clicks, gentle mobile vibration pulses, and voice cadences.
                    </p>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-border space-y-2">
                  {/* Dark Mode */}
                  <label
                    className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2"
                    htmlFor="dark-toggle"
                  >
                    <div className="space-y-0.5">
                      <strong className="text-xs font-bold text-ink block">Dark Appearance Mode</strong>
                      <span className="text-[11px] text-ink/70">
                        High-contrast, easy-on-the-eyes night palette.
                      </span>
                    </div>
                    <input
                      id="dark-toggle"
                      type="checkbox"
                      role="switch"
                      checked={dark}
                      onChange={(e) => setDark(e.target.checked)}
                      className="cursor-pointer"
                    />
                  </label>

                  {/* Sound Click */}
                  <label
                    className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2 pt-3"
                    htmlFor="sound-toggle"
                  >
                    <div className="space-y-0.5">
                      <strong className="text-xs font-bold text-ink block">
                        Tasbīḥ & Count Audio Click
                      </strong>
                      <span className="text-[11px] text-ink/70">
                        Plays a soft acoustic bead click on every count tap.
                      </span>
                    </div>
                    <input
                      id="sound-toggle"
                      type="checkbox"
                      role="switch"
                      checked={sound}
                      onChange={(e) => setSound(e.target.checked)}
                      className="cursor-pointer"
                    />
                  </label>

                  {/* Haptic Vibration */}
                  <label
                    className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2 pt-3"
                    htmlFor="haptic-toggle"
                  >
                    <div className="space-y-0.5">
                      <strong className="text-xs font-bold text-ink block">
                        Haptic Vibration Feedback
                      </strong>
                      <span className="text-[11px] text-ink/70">
                        Gentle tactile pulses on mobile devices upon counting or achieving targets.
                      </span>
                    </div>
                    <input
                      id="haptic-toggle"
                      type="checkbox"
                      role="switch"
                      checked={profile.hapticEnabled ?? true}
                      onChange={(e) => updateProfileField('hapticEnabled', e.target.checked)}
                      className="cursor-pointer"
                    />
                  </label>

                  {/* Screen Wake Lock */}
                  <label
                    className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2 pt-3"
                    htmlFor="wakelock-toggle"
                  >
                    <div className="space-y-0.5">
                      <strong className="text-xs font-bold text-ink block">
                        Keep Screen Awake During Dhikr
                      </strong>
                      <span className="text-[11px] text-ink/70">
                        Prevents display timeout while reciting adhkār or using tasbīḥ.
                      </span>
                    </div>
                    <input
                      id="wakelock-toggle"
                      type="checkbox"
                      role="switch"
                      checked={profile.wakeLockEnabled ?? false}
                      onChange={(e) => updateProfileField('wakeLockEnabled', e.target.checked)}
                      className="cursor-pointer"
                    />
                  </label>

                  {/* Prophetic Du'a Audio Voice */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                    <div className="space-y-0.5">
                      <strong className="text-xs font-bold text-ink block">
                        Du‘ā & Supplication Voice
                      </strong>
                      <span className="text-[11px] text-ink/70">
                        Male (default Prophetic recitation) vs female voice tuning.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-canvas p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceGender('male');
                          setVoiceGenderState('male');
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          voiceGender === 'male'
                            ? 'bg-primary text-primary-fg shadow-xs'
                            : 'text-ink/70 hover:text-ink'
                        }`}
                      >
                        ♂ Male (Default)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceGender('female');
                          setVoiceGenderState('female');
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          voiceGender === 'female'
                            ? 'bg-primary text-primary-fg shadow-xs'
                            : 'text-ink/70 hover:text-ink'
                        }`}
                      >
                        ♀ Female
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Section 5: Worship Goals & Habit Rhythm */}
            {shouldShowSection('goals') && (
              <section className={cardClass} aria-labelledby="goals-heading">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Heart className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 id="goals-heading" className="text-base font-bold text-ink">
                      Daily Worship Targets & Habit Rhythm
                    </h2>
                    <p className="text-xs text-ink/75">
                      Set intentional targets for daily adhkār, verses, and automated progression.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-6">
                  {/* Daily Dhikr Goal */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Daily Dhikr Target
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {DHIKR_GOAL_OPTIONS.map((val) => {
                        const isSelected = profile.dailyDhikrGoal === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateProfileField('dailyDhikrGoal', val)}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary shadow-xs'
                                : 'border-border bg-canvas text-ink/80 hover:border-primary/40'
                            }`}
                          >
                            {val}×
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Quran Target */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Daily Qur’an Ayah Target
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {QURAN_GOAL_OPTIONS.map((val) => {
                        const isSelected = profile.dailyQuranGoal === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateProfileField('dailyQuranGoal', val)}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary shadow-xs'
                                : 'border-border bg-canvas text-ink/80 hover:border-primary/40'
                            }`}
                          >
                            {val} Ayahs
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Auto-advance on completion */}
                  <label
                    className="flex min-h-14 cursor-pointer items-center justify-between gap-4 pt-2 border-t border-border"
                    htmlFor="autoadvance-toggle"
                  >
                    <div className="space-y-0.5">
                      <strong className="text-xs font-bold text-ink block">
                        Auto-Advance upon Completion
                      </strong>
                      <span className="text-[11px] text-ink/70">
                        Automatically transition to the next dhikr when target count is achieved.
                      </span>
                    </div>
                    <input
                      id="autoadvance-toggle"
                      type="checkbox"
                      role="switch"
                      checked={profile.autoAdvance ?? true}
                      onChange={(e) => updateProfileField('autoAdvance', e.target.checked)}
                      className="cursor-pointer"
                    />
                  </label>

                  {/* Notifications Hub Shortcut */}
                  <div className="rounded-2xl border border-border bg-canvas p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BellRing className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <strong className="text-xs font-bold text-ink block">
                          Morning & Evening Reminders
                        </strong>
                        <span className="text-[11px] text-ink/70">
                          {loadReminderSummary()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(true)}
                      className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-ink hover:bg-surface/80 transition-all cursor-pointer shrink-0"
                    >
                      Configure Push Times
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Section 6: Data Sovereignty, Backup & RESTORE */}
            {shouldShowSection('data') && (
              <section className={cardClass} aria-labelledby="data-heading">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Download className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 id="data-heading" className="text-base font-bold text-ink">
                      Data Sovereignty, Backup & Restore
                    </h2>
                    <p className="text-xs text-ink/75">
                      Export your complete 365-day history, restore backups across devices, or flush cache.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Hidden file input for Restore */}
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Export Button */}
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-xs font-bold text-primary-fg shadow-xs hover:bg-primary-hover transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>{isExporting ? 'Generating JSON…' : 'Export Spiritual Data (JSON)'}</span>
                    </button>

                    {/* Import / Restore Button */}
                    <button
                      type="button"
                      onClick={() => importInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 py-3.5 text-xs font-bold text-ink hover:bg-canvas transition-all cursor-pointer"
                    >
                      <Upload className="h-4 w-4 text-primary" />
                      <span>Import & Restore Backup (JSON)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Clear Temporary Cache */}
                    <button
                      type="button"
                      onClick={handleClearCache}
                      disabled={isClearingCache}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-4 py-2.5 text-xs font-semibold text-ink/80 hover:text-ink transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                      <span>{isClearingCache ? 'Clearing…' : 'Clear Temporary App Cache'}</span>
                    </button>

                    {/* Factory Reset */}
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-4 py-2.5 text-xs font-semibold text-ink/80 hover:text-link transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Reset All Local Data</span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sticky Bottom Save Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-3xl border border-primary/40 bg-surface/95 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {hasUnsavedChanges
                  ? 'You have unsaved changes in your preferences.'
                  : 'Settings synced and saved across device & cloud.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleProfileSave()}
                className={`inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer ${
                  hasUnsavedChanges
                    ? 'bg-primary text-primary-fg hover:bg-primary-hover animate-pulse'
                    : 'bg-primary text-primary-fg hover:bg-primary-hover'
                }`}
              >
                <Check className="h-4 w-4" />
                <span>Save All (⌘S)</span>
              </button>
            </div>
          </div>
        </div>
      </AppShell>

      {/* Modals */}
      {showAuth && <AuthModal dark={dark} onClose={() => setShowAuth(false)} />}
      {showNotifications && (
        <NotificationSettings
          dark={dark}
          userId={user?.id ?? null}
          onClose={() => setShowNotifications(false)}
        />
      )}
      {showProModal && <DhikrlyProModal dark={dark} onClose={() => setShowProModal(false)} />}
    </div>
  );
}

function loadReminderSummary() {
  const settings = load(NOTIFICATION_KEY, {
    morningEnabled: false,
    eveningEnabled: false,
  });
  if (settings.morningEnabled && settings.eveningEnabled) return 'Morning & evening reminders active';
  if (settings.morningEnabled) return 'Morning reminder active';
  if (settings.eveningEnabled) return 'Evening reminder active';
  return 'Reminders are currently off';
}
