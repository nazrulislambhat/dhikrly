'use client';

import { useState } from 'react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import type { Release } from '@/hooks/useAppUpdate';

interface UpdateBannerProps {
  dark: boolean;
}

export default function UpdateBanner({ dark }: UpdateBannerProps) {
  const { updateAvailable, newReleases, applyUpdate, dismissUpdate } =
    useAppUpdate();
  const [showModal, setShowModal] = useState(false);

  if (!updateAvailable) return null;

  const releases = newReleases();

  return (
    <>
      {/* ── Pill notification ── */}
      <div className="fixed left-1/2 top-4 z-[9990] -translate-x-1/2 animate-slide-down">
        <div
          className={`flex items-center gap-3 rounded-full border px-4 py-2 shadow-2xl backdrop-blur-sm ${
            dark
              ? 'border-amber-400/20 bg-[#111f33]/95 text-stone-200'
              : 'border-amber-300/50 bg-white/95 text-stone-700 shadow-amber-100/50'
          }`}
        >
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
            onClick={() => setShowModal(true)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all active:scale-95 ${
              dark
                ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            What&apos;s new
          </button>

          <button
            onClick={dismissUpdate}
            className={`text-[11px] transition-colors ${
              dark ? 'text-stone-600 hover:text-stone-400' : 'text-stone-300 hover:text-stone-500'
            }`}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Changelog modal ── */}
      {showModal && (
        <div
          className={`fixed inset-0 z-[9995] flex items-end justify-center p-4 sm:items-center ${
            dark ? 'bg-[#0c1a2e]/80 backdrop-blur-sm' : 'bg-stone-900/40 backdrop-blur-sm'
          }`}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl ${
              dark ? 'bg-[#111f33] border-white/10' : 'bg-white border-stone-200'
            }`}
          >
            {/* Modal header */}
            <div className={`flex items-center justify-between border-b px-6 py-4 ${
              dark ? 'border-white/[0.07]' : 'border-stone-100'
            }`}>
              <div>
                <h2 className={`font-serif text-lg font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
                  What&apos;s New in Dhikrly
                </h2>
                <p className={`mt-0.5 text-[11px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {releases.length} update{releases.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <button
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
            <div className={`flex gap-3 border-t px-6 py-4 ${
              dark ? 'border-white/[0.07]' : 'border-stone-100'
            }`}>
              <button
                onClick={() => { setShowModal(false); dismissUpdate(); }}
                className={`flex-1 rounded-xl border py-2.5 text-sm transition-all ${
                  dark
                    ? 'border-white/10 text-stone-500 hover:text-stone-300'
                    : 'border-stone-200 text-stone-400 hover:text-stone-600'
                }`}
              >
                Later
              </button>
              <button
                onClick={() => { setShowModal(false); applyUpdate(); }}
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
                ? dark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                : dark ? 'bg-white/5 text-stone-500' : 'bg-stone-100 text-stone-500'
            }`}
          >
            v{release.version}
          </span>
          {isLatest && (
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
              dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
            }`}>
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
