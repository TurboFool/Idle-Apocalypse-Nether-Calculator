const CACHE_NAME = 'nether-calc-cache-v1.2.0-beta.1';
const ASSETS_TO_CACHE = [
  './nether_costs.html',
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
    // If the response is redirected, we must construct a new Response object
    // without the redirected flag, because Cache.put() rejects redirected responses.
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
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Create a list of candidate cache keys to check in order
  let cacheKeys = [event.request];
  
  if (url.pathname.endsWith('/nether_costs') || url.pathname.endsWith('/nether_costs/')) {
    // If they request the clean URL, search for both the clean URL and the .html version in cache
    cacheKeys = [
      new URL('/nether_costs', url.origin).href,
      new URL('/nether_costs.html', url.origin).href,
      event.request
    ];
  } else if (url.pathname.endsWith('/nether_costs.html')) {
    // If they request the .html version, search for both the .html version and the clean URL in cache
    cacheKeys = [
      new URL('/nether_costs.html', url.origin).href,
      new URL('/nether_costs', url.origin).href,
      event.request
    ];
  }

  const isNavigation = event.request.mode === 'navigate' ||
    url.pathname.endsWith('/nether_costs') ||
    url.pathname.endsWith('/nether_costs/') ||
    url.pathname.endsWith('/nether_costs.html') ||
    url.pathname === '/';

  if (isNavigation) {
    // Network-First for HTML documents: try fresh copy, update cache, fallback to cache if offline
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
        // If request is valid and HTTP/HTTPS, dynamically add it to the cache (e.g. Google Fonts)
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
