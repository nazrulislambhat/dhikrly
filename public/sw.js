/* ──────────────────────────────────────────────────────────────
   Service Worker — Daily Adhkār & Du'ā PWA
   Strategy: Cache-first for static assets, network-first for pages
────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'adhkar-v2.0';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

/* ── Install: pre-cache static assets ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
    // NOTE: We do NOT call skipWaiting() here automatically.
    // The page controls when to activate the new SW via postMessage.
  );
});

/* ── Message from page: activate new SW on user's request ── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ── Activate: purge old caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: network-first with cache fallback ── */
self.addEventListener('fetch', (event) => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  const url = new URL(event.request.url);

  // For same-origin requests use network-first strategy
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a clone of valid responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache when offline
          return caches.match(event.request).then(
            (cached) => cached || caches.match('/')
          );
        })
    );
    return;
  }

  // For cross-origin (fonts, CDN) use cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});

/* ── Push Notifications ── */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() || "Time for your daily adhkār & du'ā" };
  }

  const title = data.title || 'Dhikrly — Adhkār & Qur’an 🌙';
  const options = {
    body: data.body || "Begin your session with remembrance and du'ā for peace of heart.",
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image,
    tag: data.tag || 'dhikrly-reminder',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data,
    },
    // Islamic gentle rhythm: short vibration, pause, short vibration, pause, long vibration
    vibrate: [120, 80, 120, 80, 240],
    actions: data.actions || [
      { action: 'open_app', title: 'Open Dhikrly 🤲' },
      { action: 'open_quran', title: 'Read Qur’an 📖' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click & action routing ── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  let targetPath = event.notification.data?.url || '/';

  if (action === 'open_quran') {
    targetPath = '/quran';
  } else if (action === 'open_salah') {
    targetPath = '/salah';
  } else if (action === 'open_insights') {
    targetPath = '/insights';
  }

  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client && client.url !== targetUrl) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
