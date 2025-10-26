// Nome do cache, atualize a cada versão do app
const cacheName = 'iptvip-cache-v1.2.3';

// Arquivos que queremos manter no cache
const assetsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js?v=1.5',  // sua versão do app.js
  'https://cdn.jsdelivr.net/npm/hls.js@latest'
];

// Instala o Service Worker e faz cache dos assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(assetsToCache))
      .then(() => self.skipWaiting())
  );
});

// Ativa o SW e remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== cacheName).map(key => caches.delete(key))
    ))
  );
});

// Intercepta requests e serve do cache, se possível
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
