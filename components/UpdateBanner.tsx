'use client';

import { useState } from 'react';
import { Download, RefreshCw, Sparkles, X } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import type { Release } from '@/hooks/useAppUpdate';

interface UpdateBannerProps {
  dark: boolean;
}

export default function UpdateBanner({ dark }: UpdateBannerProps) {
  const { updateAvailable, newReleases, applyUpdate, dismissUpdate } =
    useAppUpdate();
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStepText, setUpdateStepText] = useState('Downloading newest update...');

  if (!updateAvailable && !isUpdating) return null;

  const releases = newReleases();

  const handleStartUpdate = () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setShowModal(false);
    setUpdateProgress(15);
    setUpdateStepText('Downloading update assets...');

    setTimeout(() => {
      setUpdateProgress(40);
      setUpdateStepText('Updating service worker cache & data...');
    }, 450);

    setTimeout(() => {
      setUpdateProgress(75);
      setUpdateStepText('Applying Dhikrly v' + (releases[0]?.version || '2.3') + ' updates...');
    }, 950);

    setTimeout(() => {
      setUpdateProgress(95);
      setUpdateStepText('Finalizing and restarting app...');
    }, 1450);

    setTimeout(() => {
      setUpdateProgress(100);
      setUpdateStepText('Ready! Reloading Dhikrly...');
      setTimeout(() => {
        applyUpdate();
      }, 400);
    }, 1850);
  };

  return (
    <>
      {/* ── Pill notification ── */}
      <div className="fixed left-1/2 top-4 z-[9990] -translate-x-1/2 animate-slide-down">
        <div
          className={`flex items-center gap-3 rounded-full border px-4 py-2 shadow-2xl backdrop-blur-md transition-all ${
            dark
              ? 'border-emerald-400/20 bg-[#14211e]/95 text-stone-200'
              : 'border-amber-300/50 bg-white/95 text-stone-700 shadow-amber-100/50'
          }`}
        >
          {isUpdating ? (
            /* Mini in-pill progress view */
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-emerald-500" />
              <div className="flex flex-col min-w-[170px] sm:min-w-[210px]">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="truncate">{updateStepText}</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-300 ml-2">
                    {updateProgress}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 transition-all duration-300 ease-out"
                    style={{ width: `${updateProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Normal Pill View */
            <>
              {/* Pulse dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>

              <span className={`text-[12px] font-medium ${dark ? 'text-stone-200' : 'text-stone-700'}`}>
                Update available
                {releases[0] && (
                  <span className={`ml-1.5 text-[10px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
                    v{releases[0].version}
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all active:scale-95 ${
                  dark
                    ? 'bg-white/10 text-stone-200 hover:bg-white/15'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                What&apos;s new
              </button>

              <button
                type="button"
                onClick={handleStartUpdate}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all active:scale-95 ${
                  dark
                    ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                }`}
              >
                Update now
              </button>

              <button
                type="button"
                onClick={dismissUpdate}
                aria-label="Dismiss update"
                className={`text-[11px] transition-colors ${
                  dark ? 'text-stone-600 hover:text-stone-400' : 'text-stone-300 hover:text-stone-500'
                }`}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Active Fullscreen / Centered Updating Modal ── */}
      {isUpdating && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="updating-dialog-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className={`w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl transition-all ${
              dark
                ? 'bg-[#12221d] border-amber-500/30 text-stone-100 shadow-[0_0_60px_rgba(16,36,28,0.85)]'
                : 'bg-white border-amber-400/40 text-stone-900 shadow-2xl'
            }`}
          >
            <div className="relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-[10px] font-black text-stone-950 shadow-xs">
                ↑
              </span>
            </div>

            <h2 id="updating-dialog-title" className="text-lg font-bold">
              {updateProgress === 100 ? 'Restarting Dhikrly...' : 'Updating Dhikrly'}
            </h2>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              {updateStepText}
            </p>

            {/* Stepped Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--app-muted)] text-[11px]">Download Progress</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-300">{updateProgress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${updateProgress}%` }}
                />
              </div>
            </div>

            <p className="mt-4 text-[11px] text-[var(--app-muted)]">
              Applying latest offline caches and feature updates. Please wait...
            </p>
          </div>
        </div>
      )}

      {/* ── Changelog modal ── */}
      {showModal && (
        <div
          className={`fixed inset-0 z-[9995] flex items-end justify-center p-4 sm:items-center ${
            dark ? 'bg-black/65 backdrop-blur-md' : 'bg-stone-900/40 backdrop-blur-md'
          }`}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl ${
              dark ? 'bg-[#14211e] border-white/10' : 'bg-white border-stone-200'
            }`}
          >
            {/* Modal header */}
            <div
              className={`flex items-center justify-between border-b px-6 py-4 ${
                dark ? 'border-white/[0.07]' : 'border-stone-100'
              }`}
            >
              <div>
                <h2 className={`font-serif text-lg font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
                  What&apos;s New in Dhikrly
                </h2>
                <p className={`mt-0.5 text-[11px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {releases.length} update{releases.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`rounded-full p-1.5 transition-colors ${
                  dark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Releases list */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {releases.map((release, i) => (
                <ReleaseEntry key={release.version} release={release} dark={dark} isLatest={i === 0} />
              ))}
            </div>

            {/* Actions */}
            <div
              className={`flex gap-3 border-t px-6 py-4 ${
                dark ? 'border-white/[0.07]' : 'border-stone-100'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  dismissUpdate();
                }}
                className={`flex-1 rounded-xl border py-2.5 text-sm transition-all ${
                  dark
                    ? 'border-white/10 text-stone-500 hover:text-stone-300'
                    : 'border-stone-200 text-stone-400 hover:text-stone-600'
                }`}
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleStartUpdate}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                  dark
                    ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                    : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                ↑ Update Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Single release entry ── */
function ReleaseEntry({
  release,
  dark,
  isLatest,
}: {
  release: Release;
  dark: boolean;
  isLatest: boolean;
}) {
  const sectionTitle = `text-[10px] uppercase tracking-widest font-semibold mb-2 mt-3`;
  const item = `flex items-start gap-2 text-[13px] mb-1.5 leading-snug`;

  return (
    <div className={`mb-5 ${isLatest ? '' : 'opacity-70'}`}>
      {/* Version header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              isLatest
                ? dark
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-amber-100 text-amber-700'
                : dark
                  ? 'bg-white/5 text-stone-500'
                  : 'bg-stone-100 text-stone-500'
            }`}
          >
            v{release.version}
          </span>
          {isLatest && (
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              Latest
            </span>
          )}
        </div>
        <span className={`text-[11px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>
          {release.date}
        </span>
      </div>

      <p className={`mb-3 font-serif text-[15px] font-semibold ${dark ? 'text-stone-200' : 'text-stone-700'}`}>
        {release.title}
      </p>

      {release.added.length > 0 && (
        <>
          <p className={`${sectionTitle} ${dark ? 'text-emerald-500' : 'text-emerald-600'}`}>
            ✦ Added
          </p>
          {release.added.map((line, i) => (
            <p key={i} className={`${item} ${dark ? 'text-stone-300' : 'text-stone-600'}`}>
              <span className={`mt-0.5 shrink-0 text-[10px] ${dark ? 'text-emerald-500' : 'text-emerald-500'}`}>●</span>
              {line}
            </p>
          ))}
        </>
      )}

      {release.improved.length > 0 && (
        <>
          <p className={`${sectionTitle} ${dark ? 'text-amber-400' : 'text-amber-600'}`}>
            ↑ Improved
          </p>
          {release.improved.map((line, i) => (
            <p key={i} className={`${item} ${dark ? 'text-stone-300' : 'text-stone-600'}`}>
              <span className={`mt-0.5 shrink-0 text-[10px] ${dark ? 'text-amber-400' : 'text-amber-500'}`}>●</span>
              {line}
            </p>
          ))}
        </>
      )}

      {release.removed.length > 0 && (
        <>
          <p className={`${sectionTitle} ${dark ? 'text-red-400' : 'text-red-500'}`}>
            ✕ Removed
          </p>
          {release.removed.map((line, i) => (
            <p key={i} className={`${item} ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
              <span className={`mt-0.5 shrink-0 text-[10px] ${dark ? 'text-red-400' : 'text-red-400'}`}>●</span>
              {line}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
