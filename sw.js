// Service worker: required for the browser to consider this app installable.
// This app needs Firebase/internet to actually work, so we only cache the
// app "shell" (the static files), not any data. That's enough to satisfy
// install criteria and make the app open instantly instead of showing a
// blank white screen while the network connects.

const CACHE_NAME = 'sms-shell-v1';
const SHELL_FILES = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon1.jpg',
  './icon2.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests for same-origin shell files.
  // Everything else (Firebase, fonts, Font Awesome, etc.) goes straight
  // to the network as normal — we never cache user data.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => cached);

      // Serve cached shell instantly, update cache in background.
      return cached || networkFetch;
    })
  );
});
