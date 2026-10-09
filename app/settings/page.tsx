'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, BellRing, BookOpen, Clock3, Moon, UserRound } from 'lucide-react';
import AppShell from '@/components/AppShell';
import AuthModal from '@/components/AuthModal';
import NotificationSettings from '@/components/NotificationSettings';
import { useAuth } from '@/hooks/useAuth';
import { getSalahSettings, saveSalahSettings } from '@/lib/salahStorage';
import { load, NOTIFICATION_KEY, save, SETTINGS_KEY } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { SalahSettings } from '@/types/salah';

export default function SettingsPage() {
  const [dark, setDark] = useState(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [sound, setSound] = useState(
    () => load<{ sound?: boolean }>(SETTINGS_KEY, { sound: true }).sound ?? true,
  );
  const [salahSettings, setSalahSettings] = useState<SalahSettings>(() => getSalahSettings());
  const [profileNameOverride, setProfileNameOverride] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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

  const profileName =
    user && profileNameOverride?.userId === user.id
      ? profileNameOverride.name
      : user?.user_metadata?.full_name ?? '';

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileStatus('');
    setProfileError('');
    const { error } = await supabase.auth.updateUser({
      data: { full_name: profileName.trim() },
    });
    if (error) {
      setProfileError(error.message);
      return;
    }
    setProfileStatus('Profile updated');
  };

  const fieldClass = `min-h-11 w-full rounded-xl border border-[var(--app-line)] px-3 text-sm text-[var(--app-ink)] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 ${
    dark ? 'bg-white/5' : 'bg-white/80'
  }`;
  const cardClass = `rounded-2xl border border-[var(--app-line)] bg-[color-mix(in_srgb,var(--app-surface)_88%,transparent)] shadow-sm ${
    dark ? 'backdrop-blur-xl' : ''
  }`;

  return (
    <div className="min-h-dvh text-[var(--app-ink)]">
      <AppShell active="settings" dark={dark} onToggleDark={() => setDark((value) => !value)}>
        <main className="mx-auto w-[min(calc(100%-2rem),68rem)] py-9 pb-[calc(7rem+env(safe-area-inset-bottom))] min-[900px]:pb-12">
          <header className="mb-6 flex items-center justify-between gap-4 min-[760px]:mb-8">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.15em] text-emerald-800 dark:text-emerald-200">YOUR SPACE</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Profile & settings</h1>
              <p className="mt-2 text-sm text-[var(--app-muted)]">Make Dhikrly feel right for you.</p>
            </div>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" aria-hidden="true"><UserRound className="h-6 w-6" /></span>
          </header>

          <section className={`${cardClass} mb-4 flex items-center gap-4 p-5`} aria-labelledby="profile-title">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-xl font-extrabold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" aria-hidden="true">
              {user?.email?.slice(0, 1).toUpperCase() ?? 'ذ'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold tracking-[0.15em] text-emerald-800 dark:text-emerald-200">ACCOUNT</p>
              <h2 id="profile-title" className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold">
                {loading ? 'Loading your profile…' : user?.email ?? 'Using Dhikrly locally'}
              </h2>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {user
                  ? 'Your reading and practice progress can sync across devices.'
                  : 'Sign in to sync your practice across devices.'}
              </p>
            </div>
            {user ? (
              <button type="button" className="min-h-10 rounded-xl border border-[var(--app-line)] px-4 text-xs font-semibold" onClick={() => void signOut()}>
                Sign out
              </button>
            ) : (
              <button type="button" className="min-h-10 rounded-xl bg-emerald-800 px-4 text-xs font-semibold text-white dark:bg-emerald-400 dark:text-emerald-950" onClick={() => setShowAuth(true)}>
                Sign in
              </button>
            )}
          </section>

          <div className="grid gap-4 min-[760px]:grid-cols-2 min-[760px]:items-stretch">
            <section className={`${cardClass} min-w-0 p-5`} aria-labelledby="personal-title">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" aria-hidden="true"><UserRound className="h-4 w-4" /></span>
                <div>
                  <h2 id="personal-title" className="text-sm font-bold">Personal details</h2>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">How your account appears to you.</p>
                </div>
              </div>
              {user ? (
                <>
                  <label className="mb-1 mt-3 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="profile-name">Display name</label>
                  <input
                    id="profile-name"
                    className={fieldClass}
                    value={profileName}
                    onChange={(event) =>
                      user &&
                      setProfileNameOverride({ userId: user.id, name: event.target.value })
                    }
                    autoComplete="name"
                    maxLength={80}
                    placeholder="Your name"
                  />
                  <label className="mb-1 mt-3 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="profile-email">Email address</label>
                  <input
                    id="profile-email"
                    className={fieldClass}
                    value={user.email ?? ''}
                    readOnly
                    aria-describedby="profile-email-note"
                  />
                  <p id="profile-email-note" className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
                    Email changes are managed by your sign-in provider.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <span role="status" className="mr-auto text-xs text-emerald-700 dark:text-emerald-300">{profileStatus}</span>
                    {profileError && <span role="alert" className="text-xs text-red-600">{profileError}</span>}
                    <button type="button" className="min-h-10 rounded-xl bg-emerald-800 px-4 text-xs font-semibold text-white dark:bg-emerald-400 dark:text-emerald-950" onClick={() => void handleProfileSave()}>
                      Save profile
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-[var(--app-line)] bg-emerald-500/5 p-3 text-xs leading-relaxed text-[var(--app-muted)]">
                  Sign in to add a display name and manage your account profile.
                </div>
              )}
            </section>

            <section className={`${cardClass} min-w-0 p-5`} aria-labelledby="appearance-title">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" aria-hidden="true"><Moon className="h-4 w-4" /></span>
                <div>
                  <h2 id="appearance-title" className="text-sm font-bold">Appearance & sound</h2>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">Choose how Dhikrly looks and feels.</p>
                </div>
              </div>
              <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 border-t border-[var(--app-line)] py-3" htmlFor="dark-mode">
                <span className="grid gap-1"><strong className="text-xs font-bold">Dark appearance</strong><small className="text-[11px] text-[var(--app-muted)]">Use a low-light color theme.</small></span>
                <input
                  id="dark-mode"
                  type="checkbox"
                  role="switch"
                  checked={dark}
                  onChange={(event) => setDark(event.target.checked)}
                />
              </label>
              <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 border-t border-[var(--app-line)] py-3" htmlFor="sound-effects">
                <span className="grid gap-1"><strong className="text-xs font-bold">Sound effects</strong><small className="text-[11px] text-[var(--app-muted)]">Play gentle feedback when you count.</small></span>
                <input
                  id="sound-effects"
                  type="checkbox"
                  role="switch"
                  checked={sound}
                  onChange={(event) => setSound(event.target.checked)}
                />
              </label>
              <div className="flex min-h-16 items-center justify-between gap-4 border-t border-[var(--app-line)] py-3">
                <span className="grid gap-1"><strong className="inline-flex items-center gap-2 text-xs font-bold"><BookOpen className="h-4 w-4 text-emerald-700 dark:text-emerald-200" aria-hidden="true" /> Qur’an reader</strong><small className="text-[11px] text-[var(--app-muted)]">Adjust recitation and reading preferences.</small></span>
                <Link href="/quran" className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-emerald-800 dark:text-emerald-200">Open reader <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
              </div>
            </section>

            <section className={`${cardClass} min-w-0 p-5`} aria-labelledby="reminders-title">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" aria-hidden="true"><BellRing className="h-4 w-4" /></span>
                <div>
                  <h2 id="reminders-title" className="text-sm font-bold">Reminders</h2>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">Choose when to make space for daily adhkār.</p>
                </div>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgb(24_183_131/11%)]" aria-hidden="true" />
                <span className="grid gap-1">
                  <strong className="text-xs font-bold">{loadReminderSummary()}</strong>
                  <small className="text-[11px] text-[var(--app-muted)]">Morning and evening reminders</small>
                </span>
              </div>
              <button
                type="button"
                className="min-h-10 rounded-xl border border-[var(--app-line)] px-4 text-xs font-semibold"
                onClick={() => setShowNotifications(true)}
              >
                Configure reminders
              </button>
            </section>

            <section className={`${cardClass} min-w-0 p-5`} aria-labelledby="prayer-settings-title">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" aria-hidden="true"><Clock3 className="h-4 w-4" /></span>
                <div>
                  <h2 id="prayer-settings-title" className="text-sm font-bold">Prayer calculations</h2>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">Prayer times are calculated for your saved location.</p>
                </div>
              </div>
              <label className="mb-1 mt-3 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="calculation-method">Calculation method</label>
              <select
                id="calculation-method"
                className={fieldClass}
                value={salahSettings.calcMethod}
                onChange={(event) =>
                  setSalahSettings((current) => ({
                    ...current,
                    calcMethod: event.target.value as SalahSettings['calcMethod'],
                  }))
                }
              >
                {['Karachi', 'MuslimWorldLeague', 'Egyptian', 'UmmAlQura', 'Dubai', 'NorthAmerica', 'Kuwait', 'Qatar', 'Singapore', 'Turkey'].map((method) => (
                  <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" key={method} value={method}>{method.replace(/([A-Z])/g, ' $1').trim()}</option>
                ))}
              </select>
              <label className="mb-1 mt-3 block text-xs font-semibold text-[var(--app-muted)]" htmlFor="asr-method">Asr calculation</label>
              <select
                id="asr-method"
                className={fieldClass}
                value={salahSettings.asrMethod}
                onChange={(event) =>
                  setSalahSettings((current) => ({
                    ...current,
                    asrMethod: event.target.value as SalahSettings['asrMethod'],
                  }))
                }
              >
                <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" value="Standard">Standard</option>
                <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" value="Hanafi">Hanafi</option>
              </select>
              <Link href="/salah" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                View prayer times <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </section>
          </div>
        </main>
      </AppShell>

      {showAuth && <AuthModal dark={dark} onClose={() => setShowAuth(false)} />}
      {showNotifications && (
        <NotificationSettings
          dark={dark}
          userId={user?.id ?? null}
          onClose={() => setShowNotifications(false)}
        />
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
  return 'Reminders are off';
}
