const CACHE_NAME = 'toktok-pwa-v1.3'; // ⚠️ Súbelo en cada deploy a producción
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// ---------- INSTALL ----------
self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando cache antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ---------- FETCH ----------
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo GET
  if (request.method !== 'GET') return;

  // Ignorar peticiones a otros dominios (APIs externas, etc.)
  if (url.origin !== self.location.origin) return;

  // 🟢 HTML → Network First (siempre lo más fresco)
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // 🔵 JS / CSS / Imágenes → Cache First + revalidación en background
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached); // si falla la red, usa el caché

      return cached || fetchPromise; // devuelve caché al instante, actualiza en background
    })
  );
});
