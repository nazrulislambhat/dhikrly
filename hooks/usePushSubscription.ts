'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NotifSettings } from '@/types';

// Your VAPID public key from .env.local
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function getDeviceId(): string {
  let id = localStorage.getItem('dhikrly_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('dhikrly_device_id', id);
  }
  return id;
}

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check current subscription state on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = useCallback(
    async (
      settings: NotifSettings,
      userId: string | null,
      timezone: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { ok: false, error: 'Push not supported in this browser' };
      }

      if (!VAPID_PUBLIC_KEY) {
        return { ok: false, error: 'VAPID key not configured' };
      }

      setIsLoading(true);
      try {
        const reg = await navigator.serviceWorker.ready;

        // Get or create push subscription
        let pushSub = await reg.pushManager.getSubscription();
        if (!pushSub) {
          pushSub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
          });
        }

        // Save to server
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: pushSub.toJSON(),
            userId,
            deviceId: getDeviceId(),
            morningEnabled: settings.morningEnabled,
            morningTime: settings.morningTime,
            eveningEnabled: settings.eveningEnabled,
            eveningTime: settings.eveningTime,
            timezone,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          return { ok: false, error: data.error ?? 'Server error' };
        }

        setIsSubscribed(true);
        return { ok: true };
      } catch (err) {
        console.error('Subscribe error:', err);
        return { ok: false, error: String(err) };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSubscribed, isLoading, subscribe, unsubscribe };
}
