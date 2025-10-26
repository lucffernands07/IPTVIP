// ============================
// 🔸 IPTV Player Service Worker
// ============================

const APP_VERSION = 'v1.4.1';
const cacheName = `iptvip-cache-${APP_VERSION}`;

const assetsToCache = [
  '/',
  '/index.html',
  '/style.css',
  `/app.js?v=${APP_VERSION}`,
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

// Fetch com cache dinâmico para assets e páginas de canais
self.addEventListener('fetch', event => {
  const reqUrl = event.request.url;

  // Se for do seu Worker (lista IPTV)
  if (reqUrl.includes('iptvip-proxy.lucianoffernands.workers.dev')) {
    event.respondWith(cacheFirstThenNetwork(event.request));
  } else {
    // Padrão: cache estático
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

// Mensagem para exibir versão no front
self.addEventListener('message', (event) => {
  if (event.data?.type === 'get-sw-version') {
    event.source.postMessage({ type: 'sw-version', version: APP_VERSION });
  }
});

// ============================
// 🔹 Funções auxiliares
// ============================

// Cache primeiro, mas atualiza em background
async function cacheFirstThenNetwork(request) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(() => cachedResponse);
  return cachedResponse || fetchPromise;
}
