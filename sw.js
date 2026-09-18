// Service worker: cache only the static app shell. Supabase data, auth, and
// third-party libraries always go to the network.
//
// The cache version must change when the app shell changes. In particular,
// v2 cleared the old Firebase-era shell. v3 clears any v2 cache that may
// hold a stale index.html/script.js pair (a stale page declaring its own
// `supabase` next to a freshly loaded script.js is what crashed the login
// page with "Identifier 'supabase' has already been declared").
const CACHE_NAME = 'sms-shell-v3';
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

// Last-resort fallback so event.respondWith() can NEVER resolve to undefined
// (which throws "TypeError: Failed to convert value to 'Response'") and can
// never reject (which surfaces as "the FetchEvent ... resulted in a network
// error response"). Both errors were seen on the login page.
function offlineFallback(isNavigation) {
  if (isNavigation) {
    return new Response(
      '<!DOCTYPE html><meta charset="utf-8">' +
      '<title>You are offline</title>' +
      '<p>You appear to be offline. Reconnect and reload to use the app.</p>',
      {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests for same-origin shell files. Everything else
  // (Supabase, fonts, Font Awesome, PDF libraries, etc.) goes to the network.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  const isNavigation = request.mode === 'navigate';

  // "cache.add('./index.html')" stores the page under ".../index.html", but a
  // navigation to the site root asks for ".../" — a plain caches.match("/")
  // therefore ALWAYS missed, which forced navigations onto the network and,
  // when the network failed, into the undefined-Response crash below.
  // Normalize navigations to the canonical cache key.
  const cacheKey = isNavigation
    ? new Request(new URL('index.html', self.registration.scope))
    : request;

  event.respondWith(
    (async () => {
      try {
        // Network-first: always prefer the freshly deployed file so the HTML
        // and the script.js/style.css it loads can never come from two
        // different app versions (that exact mismatch crashed the login
        // page with a duplicate `supabase` declaration).
        const fresh = await fetch(request);

        if (fresh && fresh.ok) {
          const copy = fresh.clone();
          // Fire-and-forget; swallow errors so cache.put can never surface
          // as an unhandled rejection.
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(cacheKey, copy))
            .catch(() => {});
        }

        // Even a non-OK response (404, etc.) is a valid Response.
        return fresh;
      } catch (networkError) {
        // Offline or the network request failed: fall back to the cache.
        const cached = await caches.match(cacheKey);
        if (cached) {
          return cached;
        }

        // Nothing cached either way — still return a REAL Response.
        return offlineFallback(isNavigation);
      }
    })()
  );
});
