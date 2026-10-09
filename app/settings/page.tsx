'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

  const fieldClass = `settings-field ${dark ? 'is-dark' : ''}`;
  const cardClass = `settings-card ${dark ? 'is-dark' : ''}`;

  return (
    <div className={`settings-page ${dark ? 'is-dark' : ''}`}>
      <AppShell active="settings" dark={dark} onToggleDark={() => setDark((value) => !value)}>
        <main className="settings-content">
          <header className="settings-heading">
            <div>
              <p className="settings-eyebrow">YOUR SPACE</p>
              <h1>Profile & settings</h1>
              <p>Make Dhikrly feel right for you.</p>
            </div>
            <span className="settings-heading-mark" aria-hidden="true">ذ</span>
          </header>

          <section className={`${cardClass} settings-profile-card`} aria-labelledby="profile-title">
            <div className="settings-avatar" aria-hidden="true">
              {user?.email?.slice(0, 1).toUpperCase() ?? 'ذ'}
            </div>
            <div className="settings-profile-copy">
              <p className="settings-eyebrow">ACCOUNT</p>
              <h2 id="profile-title">
                {loading ? 'Loading your profile…' : user?.email ?? 'Using Dhikrly locally'}
              </h2>
              <p>
                {user
                  ? 'Your reading and practice progress can sync across devices.'
                  : 'Sign in to sync your practice across devices.'}
              </p>
            </div>
            {user ? (
              <button type="button" className="settings-secondary-button" onClick={() => void signOut()}>
                Sign out
              </button>
            ) : (
              <button type="button" className="settings-primary-button" onClick={() => setShowAuth(true)}>
                Sign in
              </button>
            )}
          </section>

          <div className="settings-grid">
            <section className={`${cardClass} settings-section`} aria-labelledby="personal-title">
              <div className="settings-section-heading">
                <span className="settings-section-icon" aria-hidden="true">◎</span>
                <div>
                  <h2 id="personal-title">Personal details</h2>
                  <p>How your account appears to you.</p>
                </div>
              </div>
              {user ? (
                <>
                  <label className="settings-label" htmlFor="profile-name">Display name</label>
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
                  <label className="settings-label" htmlFor="profile-email">Email address</label>
                  <input
                    id="profile-email"
                    className={fieldClass}
                    value={user.email ?? ''}
                    readOnly
                    aria-describedby="profile-email-note"
                  />
                  <p id="profile-email-note" className="settings-note">
                    Email changes are managed by your sign-in provider.
                  </p>
                  <div className="settings-action-row">
                    <span role="status" className="settings-status">{profileStatus}</span>
                    {profileError && <span role="alert" className="settings-error">{profileError}</span>}
                    <button type="button" className="settings-primary-button" onClick={() => void handleProfileSave()}>
                      Save profile
                    </button>
                  </div>
                </>
              ) : (
                <div className="settings-inline-callout">
                  Sign in to add a display name and manage your account profile.
                </div>
              )}
            </section>

            <section className={`${cardClass} settings-section`} aria-labelledby="appearance-title">
              <div className="settings-section-heading">
                <span className="settings-section-icon" aria-hidden="true">◐</span>
                <div>
                  <h2 id="appearance-title">Appearance & sound</h2>
                  <p>Choose how Dhikrly looks and feels.</p>
                </div>
              </div>
              <label className="settings-choice-row" htmlFor="dark-mode">
                <span><strong>Dark appearance</strong><small>Use a low-light color theme.</small></span>
                <input
                  id="dark-mode"
                  type="checkbox"
                  role="switch"
                  checked={dark}
                  onChange={(event) => setDark(event.target.checked)}
                />
              </label>
              <label className="settings-choice-row" htmlFor="sound-effects">
                <span><strong>Sound effects</strong><small>Play gentle feedback when you count.</small></span>
                <input
                  id="sound-effects"
                  type="checkbox"
                  role="switch"
                  checked={sound}
                  onChange={(event) => setSound(event.target.checked)}
                />
              </label>
              <div className="settings-choice-row">
                <span><strong>Qur’an reader</strong><small>Adjust recitation and reading preferences.</small></span>
                <Link href="/quran" className="settings-text-link">Open reader <span aria-hidden="true">↗</span></Link>
              </div>
            </section>

            <section className={`${cardClass} settings-section`} aria-labelledby="reminders-title">
              <div className="settings-section-heading">
                <span className="settings-section-icon" aria-hidden="true">◷</span>
                <div>
                  <h2 id="reminders-title">Reminders</h2>
                  <p>Choose when to make space for daily adhkār.</p>
                </div>
              </div>
              <div className="settings-reminder-summary">
                <span className="settings-reminder-indicator" aria-hidden="true" />
                <span>
                  <strong>{loadReminderSummary()}</strong>
                  <small>Morning and evening reminders</small>
                </span>
              </div>
              <button
                type="button"
                className="settings-secondary-button"
                onClick={() => setShowNotifications(true)}
              >
                Configure reminders
              </button>
            </section>

            <section className={`${cardClass} settings-section`} aria-labelledby="prayer-settings-title">
              <div className="settings-section-heading">
                <span className="settings-section-icon" aria-hidden="true">☼</span>
                <div>
                  <h2 id="prayer-settings-title">Prayer calculations</h2>
                  <p>Prayer times are calculated for your saved location.</p>
                </div>
              </div>
              <label className="settings-label" htmlFor="calculation-method">Calculation method</label>
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
                  <option key={method} value={method}>{method.replace(/([A-Z])/g, ' $1').trim()}</option>
                ))}
              </select>
              <label className="settings-label" htmlFor="asr-method">Asr calculation</label>
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
                <option value="Standard">Standard</option>
                <option value="Hanafi">Hanafi</option>
              </select>
              <Link href="/salah" className="settings-text-link settings-prayer-link">
                View prayer times <span aria-hidden="true">↗</span>
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
