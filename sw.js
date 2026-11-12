/* Offline support. Every request tries the network first, so changes to js/data.js show up
 * straight away; the saved copy is only used when the network is gone. Bump VERSION after
 * renaming or removing files to drop the old cache. */
const VERSION = 'christian-xp-v1';
const CORE = [
  './',
  'index.html',
  'css/xp.css',
  'css/matrix.css',
  'js/data.js',
  'js/icons.js',
  'js/sound.js',
  'js/rain.js',
  'js/wm.js',
  'js/apps.js',
  'js/office.js',
  'js/games.js',
  'js/terminal.js',
  'js/main.js',
  'assets/bliss.jpg',
  'assets/favicon.svg',
  'assets/fonts/share-tech-mono.woff2',
  'assets/cursors/arrow.png',
  'assets/cursors/hand.png',
  'assets/cursors/busy.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => Promise.all(CORE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error()))
      )
  );
});
