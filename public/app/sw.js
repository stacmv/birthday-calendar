// Service worker: precaches the app shell (nothing here depends on who the user is).
// The VERSION and SHELL list between the BUILD markers are written by `make build`
// (scripts/build.mjs): VERSION is a content hash of the shell files, so the cache name
// changes exactly when a shipped file changes. Do not edit that block by hand.

/* BUILD:BEGIN */
const VERSION = '1a1017e752cb';
const SHELL = [
  './',
  '../shared/theme-init.js',
  '../shared/theme.js',
  '../shared/themes.css',
  'css/app.css',
  'icons/apple-touch-icon.png',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512-maskable.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'index.html',
  'js/app.js',
  'js/beautiful.js',
  'js/birth.js',
  'js/calc.js',
  'js/export.js',
  'js/format.js',
  'js/i18n.js',
  'js/model.js',
  'js/pwa.js',
  'js/storage.js',
  'manifest.webmanifest',
];
/* BUILD:END */

const CACHE_PREFIX = 'anniversary-calendar-';
const CACHE = CACHE_PREFIX + VERSION;
const OFFLINE_URL = 'offline.html';

const scoped = (path) => new URL(path, self.registration.scope).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(SHELL.concat(OFFLINE_URL).map((p) => new Request(scoped(p), { cache: 'reload' })))),
  );
  // No skipWaiting here: the page offers "Update" and sends SKIP_WAITING, so a running
  // session is never swapped under the user. The first install activates immediately.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Query strings (?d=..&t=..) must still hit the cached shell.
    event.respondWith(
      caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || caches.match(scoped('./'), { ignoreSearch: true }))
        .then((hit) => hit || fetch(req).catch(() => caches.match(scoped(OFFLINE_URL)))),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req)),
  );
});
