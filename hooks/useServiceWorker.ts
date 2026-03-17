'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    )
      return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New content available — could prompt user to refresh
              console.info('[SW] New version available.');
            }
          });
        });

        console.info('[SW] Registered:', registration.scope);
      } catch (err) {
        console.warn('[SW] Registration failed:', err);
      }
    };

    register();
  }, []);
}
