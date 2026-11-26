// Resource Manager service worker, build 85553337ad
const CACHE = 'rm-shell-85553337ad';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== 'rm-photos'; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Item photos (small thumbnails only) are kept on the phone: seen once, they never load again, so Find stays quick.
var PHOTOS = 'rm-photos';
function trim(c) { return c.keys().then(function (ks) { if (ks.length > 150) return Promise.all(ks.slice(0, ks.length - 150).map(function (k) { return c.delete(k); })); }); }
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method === 'GET' && url.hostname === 'lh3.googleusercontent.com' && url.pathname.indexOf('/d/') === 0) {
    e.respondWith(caches.open(PHOTOS).then(function (c) {
      return c.match(e.request.url).then(function (m) {
        return m || fetch(e.request.url, { mode: 'cors', credentials: 'omit' }).then(function (r) { if (r && r.ok) { c.put(e.request.url, r.clone()).then(function () { return trim(c); }); } return r; }).catch(function () { return fetch(e.request); });
      });
    }));
    return;
  }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (r && r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return r;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); });
  }));
});
