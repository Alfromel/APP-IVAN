const CACHE_NAME = 'toktok-pwa-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/EXTENCIONES/R.T.html',
  '/EXTENCIONES/R.A.J.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  // Agrega aquí otros recursos que quieras cachear
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando cache antiguo');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interceptar solicitudes de fetch
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el recurso desde cache si está disponible
        if (response) {
          return response;
        }
        
        // Si no está en cache, haz la solicitud a la red
        return fetch(event.request)
          .then(response => {
            // Verifica si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona la respuesta
            const responseToCache = response.clone();
            
            // Abre el cache y guarda la respuesta
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // En caso de error, puedes devolver una página de fallback
            // Por ejemplo, si estás offline
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});