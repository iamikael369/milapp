const CACHE_NAME = 'milapp-v2';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/pergaminos.html',
  '/numerologia.html',
  '/astrologia.html',
  '/diario.html',
  '/biblioteca.html',
  '/billetera.html',
  '/mapadesuenos.html',
  '/hipnosis.html',
  '/emilybooks.html',
  '/assets/css/style.css',
  '/assets/js/universo.js',
  '/assets/images/icons/icon-192.png',
  '/assets/images/icons/icon-512.png',
  '/assets/images/icons/apple-touch-icon.png',
  '/assets/images/parchment-texture-dark.jpg',
  '/assets/images/parchment-texture.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
