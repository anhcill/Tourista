/* ============================================================
   TOURISTA STUDIO — SERVICE WORKER
   PWA Offline Support + Cache Strategy
   ============================================================ */

const CACHE_NAME = 'tourista-v1';
const OFFLINE_URL = '/offline.html';

// ── Assets to pre-cache on install ──────────────────────────
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
];

// ── Install: pre-cache essential assets ────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for static ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // ── API calls: network-only with offline fallback ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // ── Static assets (JS/CSS/fonts/images): cache-first ──
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image/') ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp|avif|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Navigation (HTML pages): network-first with cache fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // ── Everything else: stale-while-revalidate ──
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});

// ── Push notification support (for future) ─────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Tourista Studio', {
      body: data.body || 'Bạn có thông báo mới!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'tourista-notification',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data || '/');
      }
    })
  );
});
