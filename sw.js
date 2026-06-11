const CACHE_NAME = 'chifftown-v15';
const PRECACHE = [
  '/',
  '/about.html',
  '/blog/',
  '/blog/virtual-pub-online.html',
  '/blog/online-hangout-with-friends.html',
  '/blog/host-virtual-movie-night.html',
  '/blog/chifftown-vs-discord.html',
  '/blog/virtual-game-night-ideas.html',
  '/blog/virtual-pub-quiz-night.html',
  '/press.html',
  '/main-home-styles.min.css',
  '/images/chifftown-map-wide.webp',
  '/images/og-image.jpg',
  '/images/favicon-32x32.png',
  '/manifest.json',
  '/main-home.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Network-first for HTML, cache-first for assets
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});
