// Service worker: cache only the static app shell. Supabase data, auth, and
// third-party libraries always go to the network.
//
// The cache version must change when the app shell changes. In particular,
// v2 clears the old Firebase-era shell that could otherwise keep serving a
// stale index.html/script.js after the Supabase migration.

const CACHE_NAME = 'sms-shell-v2';
const SHELL_FILES = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './file_0000000080f081f6aacdb770d3c41620.png',
  './Snapchat-1003517570.jpg',
  './IMG-20260802-WA0002.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Do not make the entire install fail because one optional asset is
      // temporarily unavailable. The shell entries above are all same-origin
      // files, and a partial cache is still safer than keeping an old shell.
      Promise.all(
        SHELL_FILES.map((file) =>
          cache.add(file).catch((error) => {
            console.warn('Could not cache shell file:', file, error);
          })
        )
      )
    )
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
  const request = event.request;

  // Only handle GET requests for same-origin shell files. Everything else
  // (Supabase, fonts, Font Awesome, PDF libraries, etc.) goes to the network.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      // Serve a cached shell instantly while refreshing it in the background.
      return cached || networkFetch;
    })
  );
});
