const CACHE_NAME = 'endgame-planner-cache-v2.0.0-beta.1';
const ASSETS_TO_CACHE = [
  './endgame_planner.html',
  './endgame',
  './nether_costs',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Helper to cache an asset, resolving redirects to prevent cache.put from throwing
async function cacheAsset(cache, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Bad response status: ${response.status}`);
    }

    let responseToCache = response;
    if (response.redirected) {
      const body = await response.blob();
      responseToCache = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    await cache.put(url, responseToCache);
  } catch (err) {
    console.warn(`[Service Worker] Failed to cache ${url}:`, err);
  }
}

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[Service Worker] Pre-caching static assets');
        for (const url of ASSETS_TO_CACHE) {
          await cacheAsset(cache, url);
        }
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

// Helper to check multiple cache keys sequentially
async function matchCacheKeys(keys) {
  for (const key of keys) {
    const response = await caches.match(key);
    if (response) return response;
  }
  return null;
}

// Fetch Event:
// - Navigation/HTML requests: Network-First (ensures immediate updates, falls back to cache offline)
// - Static assets (images, fonts, manifest): Cache-First (fast performance, falls back to network)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const path = url.pathname;

  const isLegacyOrAppHtml =
    path === '/' ||
    path.endsWith('/endgame') ||
    path.endsWith('/endgame/') ||
    path.endsWith('/endgame_planner.html') ||
    path.endsWith('/nether_costs') ||
    path.endsWith('/nether_costs/') ||
    path.endsWith('/nether_costs.html');

  let cacheKeys = [event.request];
  if (isLegacyOrAppHtml) {
    cacheKeys = [
      event.request,
      new URL('/endgame', url.origin).href,
      new URL('/endgame_planner.html', url.origin).href,
      new URL('/nether_costs', url.origin).href
    ];
  }

  const isNavigation = event.request.mode === 'navigate' || isLegacyOrAppHtml;

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(err => {
                console.warn('[Service Worker] Navigation cache put failed:', err);
              });
            });
          }
          return networkResponse;
        })
        .catch(() => matchCacheKeys(cacheKeys))
    );
    return;
  }

  // Cache-First for static assets
  event.respondWith(
    matchCacheKeys(cacheKeys).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(err => {
              console.warn('[Service Worker] Dynamic cache put failed:', err);
            });
          });
        }
        return networkResponse;
      });
    })
  );
});
