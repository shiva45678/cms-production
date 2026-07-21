const CACHE_NAME = 'newtons-neetpg-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin HTTP/HTTPS requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // 1. Network-First Strategy for Data Files (.csv, .json)
  // This ensures we always get the latest questions when online, and prevents
  // caching broken/blocked responses permanently.
  if (url.pathname.endsWith('.csv') || url.pathname.endsWith('.json') || url.pathname.includes('/.well-known/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if offline or blocked
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2. Stale-While-Revalidate or Cache-First for static UI assets (.html, .js, .css, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('Service Worker network fetch failed:', err);
          return cachedResponse; // fallback if network fails
        });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
