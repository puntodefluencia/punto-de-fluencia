// Versión web: guarda los archivos de la app para abrirla sin conexión.
// Primero intenta la red (así cada cambio publicado se ve al abrirla) y, si no hay, usa la copia.
// No toca los pedidos al script de Google: esos los maneja la app con su propia cola.
const VERSION = 'pf-web-20261120184726';
const ARCHIVOS = ['./', './index.html', './config.js', './vendor/qrcode.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
