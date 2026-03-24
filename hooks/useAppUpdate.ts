'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const VERSION_KEY = 'dhikrly_app_version';
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export interface Release {
  version: string;
  date: string;
  title: string;
  added: string[];
  improved: string[];
  removed: string[];
}

export interface Changelog {
  current: string;
  releases: Release[];
}

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForUpdate = useCallback(async () => {
    try {
      // Bust cache so we always get the latest changelog
      const res = await fetch(`/changelog.json?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data: Changelog = await res.json();

      const knownVersion = localStorage.getItem(VERSION_KEY);

      if (!knownVersion) {
        // First visit — just store current version, no banner
        localStorage.setItem(VERSION_KEY, data.current);
        setChangelog(data);
        return;
      }

      if (knownVersion !== data.current) {
        setChangelog(data);
        setUpdateAvailable(true);
      }
    } catch {
      // Network error — ignore silently
    }
  }, []);

  // Watch for SW waiting state
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleSWUpdate = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(newWorker);
          }
        });
      });
    };

    navigator.serviceWorker.ready.then(handleSWUpdate);

    // When SW controller changes (after skipWaiting), reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  // Poll for changelog updates
  useEffect(() => {
    checkForUpdate();
    pollRef.current = setInterval(checkForUpdate, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkForUpdate]);

  const applyUpdate = useCallback(() => {
    // Store new version
    if (changelog) {
      localStorage.setItem(VERSION_KEY, changelog.current);
    }

    if (waitingWorker) {
      // Tell the waiting SW to activate
      waitingWorker.postMessage('SKIP_WAITING');
    } else {
      // No waiting SW (changelog-only update) — just reload
      window.location.reload();
    }
  }, [waitingWorker, changelog]);

  const dismissUpdate = useCallback(() => {
    // Snooze — store current version so banner hides
    if (changelog) {
      localStorage.setItem(VERSION_KEY, changelog.current);
    }
    setUpdateAvailable(false);
  }, [changelog]);

  // Get only releases newer than what user has
  const newReleases = useCallback((): Release[] => {
    if (!changelog) return [];
    const known = localStorage.getItem(VERSION_KEY) ?? '0.0.0';
    return changelog.releases.filter((r) => r.version > known);
  }, [changelog]);

  return {
    updateAvailable,
    changelog,
    newReleases,
    applyUpdate,
    dismissUpdate,
  };
}
