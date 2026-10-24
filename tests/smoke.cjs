/* Prueba de humo completa: crea un perfil y juega niveles con mouse simulado.
   Uso:
     node tests/smoke.cjs                 (los 100 niveles)
     node tests/smoke.cjs --to=10         (solo los primeros 10)
     node tests/smoke.cjs --from=45 --to=60
   Requiere el servidor local en http://127.0.0.1:8123 (npm run serve). */
'use strict';
const path = require('node:path');
const { preparePage, sleep } = require('./helpers/cdp.cjs');
const { installAuto, solveLevel } = require('./helpers/autoplay.cjs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
const args = {};
process.argv.slice(2).forEach((a) => {
  const m = a.match(/^--([a-z]+)=(.*)$/);
  if (m) args[m[1]] = m[2];
});

(async () => {
  const started = Date.now();
  const page = await preparePage(BASE, { width: 1366, height: 768 });
  const { evaluate, errors, screenshot } = page;
  let failed = false;
  try {
    /* Perfil nuevo desde la interfaz */
    await page.clickSelector('.avatar-card');
    await evaluate("document.querySelector('#onb-name').value = 'Prueba'");
    await page.clickText('Empezar');
    await sleep(900);

    const profileCode = await evaluate('MA.Store.profile().code');
    console.log('Perfil creado:', profileCode);
    await evaluate(`(() => { const p = MA.Store.profile(); p.tutorials = { move: 1, click: 1, drag: 1, path: 1, wheel: 1, rightclick: 1 }; MA.Store.saveNow(); return true; })()`);

    const all = await evaluate('MA.Levels.all().map(l => ({id:l.id, world:l.world, index:l.index, name:l.name, template:l.template}))');
    const from = Math.max(0, (Number(args.from || 1) - 1));
    const to = Math.min(all.length, Number(args.to || all.length));

    /* Si se empieza en un nivel avanzado, se marca lo anterior como completado
       con 2 estrellas para poder probar el tramo sin jugarlo completo. */
    if (from > 0) {
      const ids = all.slice(0, from).map((l) => l.id);
      await evaluate(`(() => {
        const p = MA.Store.profile();
        const ids = ${JSON.stringify(ids)};
        ids.forEach((id) => {
          MA.Progress.award(p, MA.Levels.get(id), {
            stars: 2, score: 240, precision: 0.72, timeMs: 9000, hints: 0,
            metrics: {
              clicks: { correct: 3, wrong: 1, total: 4 },
              targets: { total: 3, done: 3 },
              drags: { ok: 2, wrong: 0, total: 2 },
              deviations: 0, rings: { total: 0, got: 0 }, stages: []
            }
          });
        });
        MA.Store.saveNow();
        return ids.length;
      })()`);
      console.log('Sembrados ' + from + ' niveles previos.');
    }
    await installAuto(page);

    const results = [];

    for (let i = from; i < to; i++) {
      const lv = all[i];
      const t0 = Date.now();
      const r = await solveLevel(page, lv.id, { timeout: 75000 });
      if (!r.completed) throw new Error('El nivel no quedó completado: ' + lv.id);
      results.push(Object.assign(r, { name: lv.name, world: lv.world, index: lv.index, template: lv.template }));
      console.log('✔ ' + lv.id + ' ' + lv.template.padEnd(8) + ' ' + String(r.stars) + '⭐  ' +
        String(Date.now() - t0).padStart(5) + ' ms  ' + lv.name);

      /* Cerrar el modal de resultados e ir al mapa */
      for (let k = 0; k < 20; k++) {
        const hasModal = await evaluate("!!document.querySelector('.modal--results')");
        if (hasModal) break;
        await sleep(150);
      }
      const closed = await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('.modal--results button, .modal-actions button'));
        const btn = btns.find(b => (b.textContent||'').includes('Ir al mapa')) || btns[btns.length-1];
        if (btn) { btn.click(); return true; }
        return false;
      })()`);
      if (!closed) {
        await evaluate("document.querySelector('#modal-root').innerHTML = ''; document.querySelector('#modal-root').hidden = true;");
      }
      await sleep(220);

      if (i === from) {
        try { await screenshot(path.join(__dirname, 'artifacts', '10-first-level.png')); } catch (e) {}
      }
      if (lv.template === 'drag' && !args.noShots) {
        try { await screenshot(path.join(__dirname, 'artifacts', '11-drag.png')); } catch (e) {}
      }
      if (lv.template === 'path' && !args.noShots) {
        try { await screenshot(path.join(__dirname, 'artifacts', '12-path.png')); } catch (e) {}
      }
      if (lv.template === 'click' && !args.noShots) {
        try { await screenshot(path.join(__dirname, 'artifacts', '13-click.png')); } catch (e) {}
      }
    }

    /* Estado final y verificación */
    const summary = await evaluate(`(() => {
      const p = MA.Store.profile();
      const recs = Object.values(p.levels);
      return {
        completed: recs.filter(r => r.completed).length,
        stars: MA.Progress.totalStars(p),
        coins: p.coins,
        badges: p.badges.length,
        worlds: MA.Progress.completedWorlds(p).length,
        skillsMastered: MA.Progress.skillRecords(p).filter(s => s.state === 'mastered').length,
        skillsAchieved: MA.Progress.skillRecords(p).filter(s => s.state === 'achieved').length,
        diploma: MA.Progress.diploma(p).completed,
        levelsWithStars: recs.filter(r => r.completed && r.stars >= 1).length,
        zeroStar: recs.filter(r => r.completed && !r.stars).length
      };
    })()`);
    console.log('\nResumen:', JSON.stringify(summary, null, 2));

    /* Persistencia: recargar y verificar */
    const before = summary.completed;
    await page.client.send('Page.reload', { ignoreCache: true });
    await sleep(1400);
    const afterReload = await evaluate(`(() => {
      const p = MA.Store.profile();
      return { code: p && p.code, completed: p ? MA.Progress.completedCount(p) : -1, levels: MA.Levels.count() };
    })()`);
    console.log('Tras recargar:', JSON.stringify(afterReload));
    if (afterReload.completed !== before) throw new Error('El progreso no se conservó al recargar: ' + before + ' vs ' + afterReload.completed);

    console.log('\nNiveles jugados en esta corrida: ' + results.length);
    console.log('Duración total: ' + Math.round((Date.now() - started) / 1000) + ' s');
    if (errors.length) {
      console.log('\nErrores de consola (' + errors.length + '):');
      errors.slice(0, 20).forEach((e) => console.log(' - ' + e));
      throw new Error('La página registró errores de JavaScript.');
    }
    console.log('Sin errores de consola.');
  } catch (e) {
    failed = true;
    console.error('\n✖ FALLÓ:', e.message);
    if (errors.length) {
      console.error('Errores de consola:');
      errors.slice(0, 20).forEach((x) => console.error(' - ' + x));
    }
    try { await screenshot(path.join(__dirname, 'artifacts', 'smoke-failure.png')); } catch (err) {}
    process.exitCode = 1;
  } finally {
    await page.browser.close();
    if (failed) process.exitCode = 1;
  }
})();
