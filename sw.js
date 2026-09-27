const CACHE = 'saffron-table-v4-5';

const ASSETS = [
  './',
  'index.html',
  'styles.css?v=4.5',
  'app.js?v=4.5',
  'manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('saffron-table-') && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  const refreshFromNetwork =
    request.mode === 'navigate' ||
    request.destination === 'style' ||
    request.destination === 'script';

  if (refreshFromNetwork) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          if (request.mode === 'navigate') {
            const home = await caches.match('index.html');
            if (home) return home;
          }

          return Response.error();
        })
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) => cached || fetch(request)
    )
  );
});