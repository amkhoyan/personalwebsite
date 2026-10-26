/* Minimal app-shell service worker: cache-first for built assets, network-first for navigation. */
const VERSION = 'gymverse-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // never touch Convex / external calls
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      // Deep links 404 on static hosting; the app shell handles every route, so never cache the 404 page as the shell
      if (!res.ok) return caches.match('./index.html').then((hit) => hit || res);
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.pathname.includes('/assets/') || /\.(svg|png|webmanifest|css|js)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
  }
});
