const CACHE_NAME = 'quranlounge-v1';
const PRECACHE = [
  '/',
  '/index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  // Skip dev-server resources (Vite HMR, source files, node_modules)
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('hot-update') ||
    url.protocol === 'ws:' || url.protocol === 'wss:'
  ) return;

  // Network only for audio and API
  if (url.pathname.startsWith('/audio-proxy') || url.pathname.startsWith('/api')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(response => {
        // Skip caching for partial content (206) or non-ok responses
        if (response.ok && response.status !== 206) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
