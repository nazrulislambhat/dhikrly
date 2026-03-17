/* ──────────────────────────────────────────────────────────────
   Service Worker — Daily Adhkār & Du'ā PWA
   Strategy: Cache-first for static assets, network-first for pages
────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'adhkar-v1';
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
      .then(() => self.skipWaiting())
  );
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
  const data = event.data?.json() ?? {};
  const title = data.title || "Daily Adhkār Reminder 🌙";
  const options = {
    body: data.body || "Time for your daily adhkār & du'ā",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'adhkar-reminder',
    renotify: true,
    requireInteraction: false,
    data: { url: '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click ── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url === '/' && 'focus' in c);
        if (existing) return existing.focus();
        if (clients.openWindow) return clients.openWindow('/');
      })
  );
});
