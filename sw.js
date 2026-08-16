const APP_VERSION = 'v162';
const CACHE_NAME = 'fe-quest-v162-1';
const CACHE_PREFIX = 'fe-quest-';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  // v117 emergency hotfix: v116 can enter a false save-block loop during startup.
  // Activate this release immediately so the learner only needs one normal reload.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_SHELL.map(url => new Request(url,{cache:'reload'})))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async() => {
      try {
        const fresh = await fetch(new Request(req, { cache: 'no-store' }));
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', fresh.clone());
          return fresh;
        }
      } catch (_) {}
      return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
    })());
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (!response || !response.ok || response.type !== 'basic') return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return response;
    }))
  );
});
