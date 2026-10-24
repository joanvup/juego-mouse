/* Comprueba PWA, funcionamiento sin conexión, ausencia de peticiones externas
   y arranque desde file://. */
'use strict';
const path = require('node:path');
const { preparePage, sleep } = require('./helpers/cdp.cjs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
let passed = 0;
const failures = [];
function check(name, condition, detail) {
  if (condition) { passed++; console.log('✔ ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('✖ ' + name + (detail ? ' — ' + detail : '')); }
}

(async () => {
  /* ---------- 1. HTTP: service worker y caché ---------- */
  const page = await preparePage(BASE, { port: 9338, settle: 1200 });
  try {
    console.log('Esperando activación del service worker…');
    await sleep(2500);
    const regs = await page.evaluate("navigator.serviceWorker.getRegistrations().then(r => r.length)");
    check('el service worker se registra por HTTP', regs >= 1, 'registros: ' + regs);
    await page.client.send('Page.reload', { ignoreCache: false });
    await sleep(1600);
    check('la página queda controlada por el service worker', await page.evaluate("!!navigator.serviceWorker.controller"));
    const caches = await page.evaluate("caches.keys()");
    check('se crea la caché del juego', caches.some((k) => k.indexOf('mouse-aventura') === 0), caches.join(','));

    /* Una corrección de CSS/JS debe llegar al recargar: si el service worker
       sirve siempre la copia guardada, el juego se queda roto para siempre
       (fue la causa de que w5l4 no dejara arrastrar). */
    const fresh = await page.evaluate(`(async () => {
      const key = (await caches.keys()).find((k) => k.indexOf('mouse-aventura') === 0);
      const cache = await caches.open(key);
      const fake = (body) => new Response(body, { headers: { 'Content-Type': 'text/plain' } });
      await cache.put('/styles/play.css', fake('/* css viejo */'));
      await cache.put('/src/engine/templates/drag.js', fake('/* js viejo */'));
      const css = await (await fetch('/styles/play.css')).text();
      const js = await (await fetch('/src/engine/templates/drag.js')).text();
      return { css, js };
    })()`);
    check('el service worker no sirve CSS viejo de la caché', fresh.css.indexOf('css viejo') < 0, fresh.css.slice(0, 90));
    check('el service worker no sirve JS viejo de la caché', fresh.js.indexOf('js viejo') < 0, fresh.js.slice(0, 90));
    check('el CSS servido mantiene las piezas encima de la bandeja',
      /\.drag-item\s*\{[^}]*z-index:\s*15/.test(fresh.css) &&
      /\.drag-tray\s*\{[^}]*pointer-events:\s*none/.test(fresh.css));

    const cachedCount = await page.evaluate("caches.open(caches => caches).then(() => 0)").catch(() => 0);
    void cachedCount;

    const resources = await page.evaluate("performance.getEntriesByType('resource').map(r => r.name)");
    const external = resources.filter((u) => u.indexOf('http://127.0.0.1') !== 0 && u.indexOf('http://localhost') !== 0 && u.indexOf('data:') !== 0);
    check('no hay peticiones a servicios externos', external.length === 0, external.join(', '));
    check('el manifiesto está enlazado', await page.evaluate("!!document.querySelector('link[rel=manifest]')"));
    check('los iconos de la PWA existen', await page.evaluate("fetch('assets/icon-192.png').then(r => r.ok)"));
    check('el juego se cargó con 100 niveles por HTTP', (await page.evaluate('MA.Levels.count()')) === 100);

    /* ---------- 2. Sin conexión ---------- */
    await page.client.send('Network.enable');
    await page.client.send('Network.emulateNetworkConditions', {
      offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0
    });
    await page.client.send('Page.reload', { ignoreCache: true });
    await sleep(1800);
    const offlineOk = await page.evaluate("typeof MA !== 'undefined' && MA.Levels && MA.Levels.count() === 100");
    check('el juego abre sin conexión desde la caché', offlineOk);
    if (offlineOk) {
      await page.screenshot(path.join(__dirname, 'artifacts', 'pwa-offline.png'));
    }
    await page.client.send('Network.emulateNetworkConditions', {
      offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1
    });
    check('sin errores de consola en PWA/offline', page.errors.length === 0, page.errors.join(' | '));

    /* ---------- 3. Actualización desde una versión anterior ---------- */
    await page.evaluate(`(async () => {
      for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      for (const k of await caches.keys()) await caches.delete(k);
      const c = await caches.open('mouse-aventura-v0.0.0-prueba');
      await c.put('/styles/play.css', new Response('/* css viejo */', { headers: { 'Content-Type': 'text/css' } }));
      return true;
    })()`);
    let loads = 0;
    page.client.on('Page.loadEventFired', () => { loads++; });
    await page.client.send('Page.reload', { ignoreCache: false });
    await sleep(6000);
    const upgraded = await page.evaluate(`(async () => {
      const keys = await caches.keys();
      let css = '';
      for (const k of keys) {
        const c = await caches.open(k);
        const r = await c.match('/styles/play.css');
        if (r) css = await r.text();
      }
      return { keys, vieja: keys.indexOf('mouse-aventura-v0.0.0-prueba') >= 0, cssViejo: css.indexOf('css viejo') >= 0, app: MA.Levels.count() };
    })()`);
    check('al actualizar, la pestaña se recarga sola', loads >= 2, 'recargas: ' + loads);
    check('la caché de la versión anterior desaparece', upgraded.vieja === false && upgraded.keys.length === 1, upgraded.keys.join(','));
    check('tras actualizar se sirve el CSS nuevo', upgraded.cssViejo === false && upgraded.app === 100);
  } finally {
    await page.browser.close();
  }

  /* ---------- 4. file:// ---------- */
  const fileBase = 'file:///' + path.resolve(__dirname, '..').replace(/\\/g, '/');
  const filePage = await preparePage(fileBase, { port: 9339, path: '/index.html', settle: 1200 });
  try {
    const loaded = await filePage.evaluate("typeof MA !== 'undefined' && MA.Levels && MA.Levels.count() === 100");
    check('el juego abre desde file:// sin servidor', loaded);
    const current = await filePage.evaluate("MA.App && MA.App.currentName");
    check('el router funciona desde file://', current === 'onboarding' || current === 'home', current);
    const created = await filePage.evaluate(`(() => {
      const p = MA.Store.createProfile({ name: 'Archivo', character: 'mimo' });
      MA.Store.setActiveProfile(p.code);
      MA.Store.saveNow();
      return MA.Store.profile().code;
    })()`);
    check('el guardado local funciona desde file://', !!created);
    const noSw = await filePage.evaluate(`(() => {
      try { return !navigator.serviceWorker || !navigator.serviceWorker.controller; }
      catch (e) { return true; }
    })()`);
    check('no se intenta registrar service worker en file://', noSw === true);
    check('sin errores de consola desde file://', filePage.errors.length === 0, filePage.errors.join(' | '));
  } finally {
    await filePage.browser.close();
  }

  console.log('\nResultado: ' + passed + ' comprobaciones correctas, ' + failures.length + ' fallos.');
  if (failures.length) { failures.forEach((f) => console.log(' - ' + f)); process.exitCode = 1; }
})();
