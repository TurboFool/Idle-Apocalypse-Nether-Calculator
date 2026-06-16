const CACHE_NAME = 'nether-calc-cache-v1';
const ASSETS_TO_CACHE = [
  './nether_costs.html',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Serve from cache first, fallback to network and dynamic caching
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Normalize clean URLs: if it requests '/nether_costs' (no extension), search cache for 'nether_costs.html'
  let requestToCheck = event.request;
  if (url.pathname.endsWith('/nether_costs') || url.pathname.endsWith('/nether_costs/')) {
    requestToCheck = new Request('./nether_costs.html');
  }

  event.respondWith(
    caches.match(requestToCheck).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // If request is valid, dynamically add it to the cache (e.g. Google Fonts)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        console.log('[Service Worker] Network request failed, resource offline');
      });
    })
  );
});
