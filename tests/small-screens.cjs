/* Revisión rápida en una pantalla pequeña (1024×700) y en formato 800×600. */
'use strict';
const path = require('node:path');
const { preparePage, sleep } = require('./helpers/cdp.cjs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';

(async () => {
  for (const [w, h, port] of [[1024, 700, 9341], [800, 600, 9342]]) {
    const page = await preparePage(BASE, { width: w, height: h, port, settle: 900 });
    try {
      await page.evaluate(`(() => {
        const p = MA.Store.createProfile({ name: 'Peque', character: 'luna' });
        MA.Store.setActiveProfile(p.code);
        MA.Levels.all().slice(0, 12).forEach((l) => MA.Progress.award(p, l, { stars: 2, score: 200, precision: 0.7, timeMs: 5000, hints: 0, metrics: {} }));
        p.tutorials = { move: 1, click: 1, drag: 1, path: 1, wheel: 1, rightclick: 1 };
        MA.Store.saveNow();
        MA.App.go('inicio');
        return true;
      })()`);
      await sleep(700);
      await page.screenshot(path.join(__dirname, 'artifacts', 'small-' + w + '-inicio.png'));
      await page.evaluate("MA.App.go('mapa')");
      await sleep(600);
      await page.screenshot(path.join(__dirname, 'artifacts', 'small-' + w + '-mapa.png'));
      await page.evaluate("MA.App.go('jugar/w1l3')");
      await sleep(700);
      await page.evaluate("document.querySelector('.level-intro .btn--primary').click()");
      await sleep(700);
      await page.screenshot(path.join(__dirname, 'artifacts', 'small-' + w + '-juego.png'));
      const overflow = await page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 2");
      console.log(w + '×' + h + ': sin desborde horizontal → ' + (!overflow) + '; errores: ' + page.errors.length);
    } finally {
      await page.browser.close();
    }
  }
})();
