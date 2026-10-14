'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NotifSettings } from '@/types';

// Your VAPID public key from .env.local
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

async function responseError(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === 'string') return body.error;
    } catch (error) {
      console.error('Push API returned invalid JSON:', error);
    }
  } else {
    console.error(
      `Push API returned ${contentType || 'an unknown content type'} instead of JSON (${response.status}).`,
    );
  }
  return `Notification service returned an unexpected response (${response.status}).`;
}

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
          return { ok: false, error: await responseError(res) };
        }

        if (!(res.headers.get('content-type') ?? '').includes('application/json')) {
          return { ok: false, error: await responseError(res) };
        }
        let responseBody: { ok?: boolean };
        try {
          responseBody = (await res.json()) as { ok?: boolean };
        } catch (error) {
          console.error('Push API returned invalid JSON:', error);
          return { ok: false, error: 'Notification service returned invalid JSON.' };
        }
        if (responseBody.ok !== true) {
          return { ok: false, error: 'Notification service did not confirm the schedule.' };
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
        const response = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        if (!response.ok) throw new Error(await responseError(response));
        if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
          throw new Error(await responseError(response));
        }
        const result = (await response.json()) as { ok?: boolean };
        if (result.ok !== true) {
          throw new Error('Notification service did not confirm the cancellation.');
        }
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSubscribed, isLoading, subscribe, unsubscribe };
}
