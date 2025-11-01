// ============================
// 🔸 IPTV Player Service Worker
// ============================

const APP_VERSION = 'v1.7.10'; // 🔁 Atualize conforme necessário
const cacheName = `iptvip-cache-${APP_VERSION}`;

const assetsToCache = [
  './',
  './index.html',
  './style.css',
  `./app.js?v=${APP_VERSION}`,
  'https://cdn.jsdelivr.net/npm/hls.js@latest'
];

// Instala e pré-carrega assets principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(assetsToCache))
      .then(() => self.skipWaiting())
  );
});

// Remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== cacheName).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Busca com cache dinâmico
self.addEventListener('fetch', event => {
  const reqUrl = event.request.url;

  // Se for do seu Worker IPTV
  if (reqUrl.includes('iptvip-proxy.lucianoffernands.workers.dev')) {
    event.respondWith(cacheFirstThenNetwork(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

// ============================
// 🔹 Comunicação com o front
// ============================

// Envia a versão atual quando solicitada
self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'GET_VERSION') {
    event.source.postMessage({ type: 'VERSION_INFO', version: APP_VERSION });
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================
// 🔹 Funções auxiliares
// ============================

async function cacheFirstThenNetwork(request) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(() => cachedResponse);
  return cachedResponse || fetchPromise;
    }
