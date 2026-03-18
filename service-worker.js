const CACHE_NAME = 'milapp-v3';
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
  '/manifest.webmanifest',
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#050312">
  <title>MilApp · Refugio sin conexión</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: radial-gradient(circle at top, #1a1538 0%, #050312 70%);
      --panel: rgba(255,255,255,0.06);
      --border: rgba(242,185,13,0.18);
      --text: #f4efe6;
      --muted: rgba(244,239,230,0.72);
      --gold: #f2b90d;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, system-ui, sans-serif;
    }
    main {
      width: min(100%, 420px);
      padding: 28px 24px;
      border-radius: 28px;
      background: var(--panel);
      border: 1px solid var(--border);
      backdrop-filter: blur(16px);
      text-align: center;
      box-shadow: 0 24px 48px rgba(0,0,0,0.3);
    }
    h1 {
      margin: 0 0 12px;
      font: 700 1.3rem/1.2 "Cinzel", Georgia, serif;
      letter-spacing: 0.06em;
      color: var(--gold);
    }
    p {
      margin: 0 0 18px;
      line-height: 1.55;
      color: var(--muted);
    }
    button {
      appearance: none;
      border: 1px solid rgba(242,185,13,0.35);
      background: rgba(242,185,13,0.12);
      color: var(--text);
      border-radius: 999px;
      padding: 12px 18px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <main>
    <h1>El templo sigue contigo</h1>
    <p>No hay conexión ahora mismo, pero MilApp conserva su refugio. Cuando vuelva la red, podrás retomar el ritual donde lo dejaste.</p>
    <button type="button" onclick="location.reload()">Reintentar</button>
  </main>
</body>
</html>`;

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    status: 200,
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
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
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return offlineResponse();
          return Response.error();
        });

      return cached || fetchPromise;
    })
  );
});
