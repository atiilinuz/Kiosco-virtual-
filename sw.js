
const CACHE_NAME = 'kiosco-portable-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdn-icons-png.flaticon.com/512/3081/3081559.png'
];

// Instalación: Precarga de recursos críticos
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activar inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim(); // Tomar control de clientes inmediatamente
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Estrategia Cache-First para dependencias externas (ESM, Fuentes, Imágenes estáticas)
  // Esto asegura que una vez descargadas, la app funcione sin internet.
  if (
    url.hostname.includes('esm.sh') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('tailwindcss.com') ||
    url.hostname.includes('flaticon.com') ||
    url.hostname.includes('images.unsplash.com') ||
    url.hostname.includes('picsum.photos')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            // Solo cacheamos respuestas válidas
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => {
            // Fallback opcional para imágenes si falla la red y no está en caché
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          });
      })
    );
    return;
  }

  // 2. Estrategia Stale-While-Revalidate para archivos locales de la app
  // Intenta servir rápido desde caché, pero actualiza en segundo plano.
  // Si no hay red, usa caché.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
             const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then((cache) => {
               cache.put(event.request, responseToCache);
             });
          }
          return networkResponse;
        })
        .catch(() => {
           // Si falla red y no había caché (caso raro para app shell), retornamos algo
           if (event.request.mode === 'navigate') {
             return caches.match('./index.html');
           }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
