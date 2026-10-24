/* Captura las pantallas principales a 1366x768 y 1920x1080 para revisión visual. */
'use strict';
const path = require('node:path');
const { preparePage, sleep } = require('./helpers/cdp.cjs');
const { installAuto, solveLevel } = require('./helpers/autoplay.cjs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
const OUT = path.join(__dirname, 'artifacts');

const SEED = (upto) => `(() => {
  const p = MA.Store.profile();
  const levels = MA.Levels.all();
  levels.forEach((lv, i) => {
    if (i >= ${upto}) return;
    MA.Progress.award(p, lv, {
      stars: (i % 3) + 1,
      score: 200 + (i % 3) * 100,
      precision: 0.6 + (i % 4) * 0.09,
      timeMs: 14000 + (i % 7) * 3000,
      hints: i % 5 === 0 ? 1 : 0,
      metrics: {
        clicks: { correct: 6, wrong: i % 4, total: 6 + (i % 4) },
        targets: { total: 4, done: 4 },
        drags: { ok: 3, wrong: i % 3, total: 3 + (i % 3) },
        deviations: i % 6,
        rings: { total: 2, got: 2 },
        stages: [0.8, 0.7]
      }
    });
  });
  p.coins = 1240;
  p.badges = p.badges || [];
  p.avatar.accessories = ['gorra', 'capa'];
  p.inventory.accessories = ['gorra', 'capa', 'gafas', 'moño'];
  p.tutorials = { move: 1, click: 1, drag: 1, path: 1, wheel: 1, rightclick: 1 };
  MA.Store.saveNow();
  return { completed: MA.Progress.completedCount(p), stars: MA.Progress.totalStars(p) };
})()`;

async function capture(name, page) {
  await page.screenshot(path.join(OUT, name));
  console.log('captura:', name);
}

async function run(width, height, port, prefix) {
  const page = await preparePage(BASE, { width, height, port, settle: 800 });
  const { evaluate } = page;
  try {
    await page.clickSelector('.avatar-card');
    await evaluate("document.querySelector('#onb-name').value = 'Ana'");
    await page.clickText('Empezar');
    await sleep(900);
    console.log(prefix + ' perfil:', await evaluate('MA.Store.profile().code'));

    /* home sin progreso */
    await evaluate("MA.App.go('inicio')");
    await sleep(600);
    await capture(prefix + '-01-inicio.png', page);

    /* sembrar progreso y capturar mapa */
    console.log(prefix + ' seed:', JSON.stringify(await evaluate(SEED(90))));
    await evaluate("MA.App.go('mapa')");
    await sleep(700);
    await capture(prefix + '-02-mapa.png', page);

    await evaluate("MA.App.go('mundo/6')");
    await sleep(700);
    await capture(prefix + '-03-niveles.png', page);

    await evaluate("MA.App.go('progreso')");
    await sleep(700);
    await capture(prefix + '-04-progreso.png', page);

    await evaluate("MA.App.go('personaje')");
    await sleep(700);
    await capture(prefix + '-05-personaje.png', page);

    await evaluate("MA.App.go('ajustes')");
    await sleep(600);
    await capture(prefix + '-06-ajustes.png', page);

    await evaluate("MA.App.go('ayuda')");
    await sleep(600);
    await capture(prefix + '-07-ayuda.png', page);

    /* docente */
    await evaluate("sessionStorage.removeItem('ma.teacherUnlocked'); MA.App.go('docente')");
    await sleep(600);
    await capture(prefix + '-08-docente-pin.png', page);
    await evaluate("sessionStorage.setItem('ma.teacherUnlocked','1'); MA.App.refresh()");
    await sleep(700);
    await capture(prefix + '-09-docente.png', page);
    await evaluate("MA.App.go('docente')");
    await sleep(300);

    /* juego: intro y tablero */
    await evaluate("MA.Store.profile().tutorials = {move:1,click:1,drag:1,path:1,wheel:1,rightclick:1}; MA.App.go('jugar/w6l2')");
    await sleep(800);
    await capture(prefix + '-10-intro.png', page);
    await evaluate("document.querySelector('.level-intro .btn--primary').click()");
    await sleep(700);
    await capture(prefix + '-11-drag.png', page);

    await evaluate("MA.App.go('jugar/w2l6')");
    await sleep(700);
    await evaluate("document.querySelector('.level-intro .btn--primary').click()");
    await sleep(700);
    await capture(prefix + '-12-click.png', page);

    await evaluate("MA.App.go('jugar/w7l4')");
    await sleep(700);
    await evaluate("document.querySelector('.level-intro .btn--primary').click()");
    await sleep(800);
    await capture(prefix + '-13-laberinto.png', page);

    await evaluate("MA.App.go('jugar/w9l7')");
    await sleep(700);
    await evaluate("document.querySelector('.level-intro .btn--primary').click()");
    await sleep(700);
    await capture(prefix + '-14-rueda.png', page);

    /* resultados reales */
    await installAuto(page);
    const res = await solveLevel(page, 'w3l2', { timeout: 60000 });
    console.log(prefix + ' resultado:', JSON.stringify(res));
    await sleep(600);
    await capture(prefix + '-15-resultados.png', page);
    await evaluate("(() => { const b = Array.from(document.querySelectorAll('.modal-actions button')).find(x => (x.textContent||'').includes('Ir al mapa')); if (b) b.click(); return true; })()");
    await sleep(300);

    /* diploma bloqueado */
    await evaluate("MA.App.go('diploma')");
    await sleep(600);
    await capture(prefix + '-16-diploma-bloqueado.png', page);

    /* completar todo y diploma final */
    console.log(prefix + ' seed100:', JSON.stringify(await evaluate(SEED(100))));
    await evaluate("MA.App.go('diploma')");
    await sleep(800);
    await capture(prefix + '-17-diploma.png', page);
    await evaluate("MA.App.go('inicio')");
    await sleep(600);
    await capture(prefix + '-18-inicio-completo.png', page);

    console.log(prefix + ' errores:', page.errors);
  } finally {
    await page.browser.close();
  }
}

(async () => {
  await run(1366, 768, 9334, '1366');
  await run(1920, 1080, 9335, '1920');
  console.log('Listo.');
})().catch((e) => { console.error("FALLÓ", e); process.exitCode = 1; });