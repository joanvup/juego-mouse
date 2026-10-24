/* Mouse Aventura — service worker
   Cachea todos los archivos del juego para poder abrir sin conexión
   después de la primera carga. */
'use strict';

/* IMPORTANTE: subir este número en cada entrega. La caché es la que
   garantiza el juego sin conexión, pero si no cambia de nombre el navegador
   sigue sirviendo el CSS y el JS antiguos aunque los archivos se corrijan. */
const CACHE = 'mouse-aventura-v1.0.2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/base.css',
  './styles/game.css',
  './styles/play.css',
  './styles/print.css',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './src/core/utils.js',
  './src/core/storage.js',
  './src/core/audio.js',
  './src/data/worlds.js',
  './src/data/skills.js',
  './src/data/avatars.js',
  './src/data/levels/shared.js',
  './src/data/levels/w1.js',
  './src/data/levels/w2.js',
  './src/data/levels/w3.js',
  './src/data/levels/w4.js',
  './src/data/levels/w5.js',
  './src/data/levels/w6.js',
  './src/data/levels/w7.js',
  './src/data/levels/w8.js',
  './src/data/levels/w9.js',
  './src/data/levels/w10.js',
  './src/core/scoring.js',
  './src/core/progress.js',
  './src/core/store.js',
  './src/engine/paths.js',
  './src/engine/engine.js',
  './src/engine/templates/move.js',
  './src/engine/templates/click.js',
  './src/engine/templates/sequence.js',
  './src/engine/templates/drag.js',
  './src/engine/templates/path.js',
  './src/engine/templates/wheel.js',
  './src/engine/templates/mission.js',
  './src/ui/components.js',
  './src/ui/tutorial.js',
  './src/ui/screens/home.js',
  './src/ui/screens/onboarding.js',
  './src/ui/screens/worldmap.js',
  './src/ui/screens/play.js',
  './src/ui/screens/progress.js',
  './src/ui/screens/wardrobe.js',
  './src/ui/screens/settings.js',
  './src/ui/screens/help.js',
  './src/ui/screens/teacher.js',
  './src/ui/screens/diploma.js',
  './src/ui/app.js',
  './src/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(
      /* Si un archivo falla, no se bloquea la actualización completa. */
      ASSETS.map((url) => cache.add(url).catch(() => null))
    )).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      /* Si había otra caché del juego, venimos de una versión anterior: al
         tomar el control hay que recargar las pestañas para que dejen de usar
         el CSS/JS viejos que ya estaban cargados en memoria. */
      const upgrade = keys.some((key) => key !== CACHE && key.indexOf('mouse-aventura') === 0);
      const cleanup = keys.filter((key) => key !== CACHE).map((key) => caches.delete(key));
      return Promise.all(cleanup)
        .then(() => self.clients.claim())
        .then(() => {
          if (!upgrade) return null;
          /* No se espera a navigate(): la navegación necesita que esta
             activación termine, así que esperarla aquí bloquearía el
             service worker. Se lanza y se sigue. */
          self.clients.matchAll({ type: 'window' }).then((clients) => {
            clients.forEach((client) => {
              /* Una sola recarga al actualizar: es la única forma de que la
                 pestaña deje de usar el CSS/JS viejos que ya tenía cargados. */
              client.navigate(client.url).catch(() => {});
            });
          }).catch(() => {});
          return null;
        });
    })
  );
});

/* Estrategia:
   - Navegación, CSS y JS: primero la red, para que una corrección llegue en
     cuanto se recarga (antes se quedaba en caché para siempre).
   - Resto (iconos, manifiesto): primero la caché, que es más rápido.
   - Si no hay conexión, todo se sirve desde la caché. */
function isFreshFirst(request, url) {
  if (request.mode === 'navigate') return true;
  if (request.destination === 'style' || request.destination === 'script') return true;
  return /\.(?:css|js)$/i.test(url.pathname);
}

function saveCopy(request, response) {
  if (!response || !response.ok || response.type !== 'basic') return response;
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
  return response;
}

function offlineFallback(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./index.html');
    return new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isFreshFirst(req, url)) {
    event.respondWith(
      fetch(req).then((response) => saveCopy(req, response)).catch(() => offlineFallback(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => saveCopy(req, response)).catch(() => offlineFallback(req));
    })
  );
});
