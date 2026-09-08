// NSSF SOC Portal Service Worker for PWA Installation Support
const CACHE_NAME = 'nssf-soc-portal-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for http/https
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Don't intercept dynamic API calls
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Optional: Cache successful static assets
        if (response && response.status === 200 && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.woff2'))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
