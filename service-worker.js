// Defina a versão apenas uma vez
const APP_VERSION = 'v1.3.2';
const cacheName = `iptvip-cache-${APP_VERSION}`;

const assetsToCache = [
  '/',
  '/index.html',
  '/style.css',
  `/app.js?v=${APP_VERSION}`,
  'https://cdn.jsdelivr.net/npm/hls.js@latest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(assetsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'get-sw-version') {
    event.source.postMessage({ type: 'sw-version', version: APP_VERSION });
  }
});
