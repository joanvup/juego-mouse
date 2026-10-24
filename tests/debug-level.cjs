/* Depura un nivel concreto: node tests/debug-level.cjs w1l2 */
'use strict';
const path = require('node:path');
const { preparePage, sleep } = require('./helpers/cdp.cjs');
const { installAuto, clickStart } = require('./helpers/autoplay.cjs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
const levelId = process.argv[2] || 'w1l1';

(async () => {
  const page = await preparePage(BASE);
  const { evaluate, errors } = page;
  try {
    const has = await evaluate('!!MA.Store.profile()');
    if (!has) {
      await page.clickSelector('.avatar-card');
      await page.clickText('Empezar');
      await sleep(800);
    }
    await evaluate(`(() => { const p = MA.Store.profile(); p.tutorials = { move:1, click:1, drag:1, path:1, wheel:1, rightclick:1 }; MA.Levels.all().forEach(l => { if (l.world < 6) { MA.Progress.award(p, l, { stars:2, score:200, precision:0.7, timeMs:1000, hints:0, metrics:{} }); } }); MA.Store.saveNow(); return true; })()`);
    await installAuto(page);
    await evaluate(`MA.App.go('jugar/${levelId}')`);
    await sleep(900);
    await clickStart(page);
    await sleep(600);
    for (let i = 0; i < 80; i++) {
      const st = await evaluate('window.__AUTO__.step()');
      if (i % 5 === 0) console.log(i, JSON.stringify(st));
      if (st.done) { console.log('DONE', JSON.stringify(st)); break; }
      const info = await evaluate(`(() => {
        const e = MA.Engine.active;
        return {
          paused: e && e.isPaused(), finished: e && e.isFinished(),
          metrics: e && e.getMetrics(),
          targets: Array.from(document.querySelectorAll('.target')).map(t => ({ c: t.className, d: t.dataset.done || '', r: (() => { const r=t.getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top),Math.round(r.width)]; })() })),
          modal: !!document.querySelector('.modal--results')
        };
      })()`);
      if (i % 5 === 0) console.log('   ', JSON.stringify(info).slice(0, 700));
      await sleep(120);
    }
    console.log('record:', JSON.stringify(await evaluate(`MA.Store.profile().levels['${levelId}'] || null`)));
    await page.screenshot(path.join(__dirname, 'artifacts', 'debug-' + levelId + '.png'));
    console.log('errores:', errors);
  } catch (e) {
    console.error('ERROR:', e.message);
    console.log(errors);
    try { await page.screenshot(path.join(__dirname, 'artifacts', 'debug-fail.png')); } catch (err) {}
  } finally {
    await page.browser.close();
  }
})();
