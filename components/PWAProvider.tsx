/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
'use client';

import { useEffect, useState } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAProvider({
  children,
  dark,
}: {
  children?: React.ReactNode;
  dark: boolean;
}) {
  useServiceWorker();

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect if already installed as PWA
    const mq = window.matchMedia('(display-mode: standalone)');
    if (mq.matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  if (!installPrompt || installed || dismissed) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-[9998] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border p-4 shadow-2xl ${
        dark ? 'border-white/10 bg-[#111f33]' : 'border-stone-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
            dark ? 'bg-amber-400/15' : 'bg-amber-50'
          }`}
        >
          🌙
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[13px] font-semibold ${
              dark ? 'text-stone-100' : 'text-stone-800'
            }`}
          >
            Add to Home Screen
          </p>
          <p
            className={`mt-0.5 text-[11px] ${
              dark ? 'text-stone-500' : 'text-stone-400'
            }`}
          >
            Install Adhkār Tracker for offline access & notifications
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`shrink-0 rounded-full p-1 text-[12px] transition-colors ${
            dark
              ? 'text-stone-600 hover:text-stone-400'
              : 'text-stone-300 hover:text-stone-500'
          }`}
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setDismissed(true)}
          className={`flex-1 rounded-xl border py-2 text-[12px] transition-all ${
            dark
              ? 'border-white/10 text-stone-500 hover:text-stone-300'
              : 'border-stone-200 text-stone-400 hover:text-stone-600'
          }`}
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          className={`flex-1 rounded-xl py-2 text-[12px] font-medium transition-all active:scale-95 ${
            dark
              ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          Install
        </button>
      </div>
    </div>
  );
}
