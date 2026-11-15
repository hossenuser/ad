/* MH Apps Gallery — offline service worker */
const CACHE = 'mh-apps-gallery-v2.2.0';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/images/mh-logo.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).catch(() => null).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put('/index.html', copy)).catch(() => null);
        return response;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  const isImage = request.destination === 'image' || /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
  if (isImage) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(response => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => null);
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => null);
        return response;
      }).catch(() => caches.match('/index.html')))
    );
  }
});
