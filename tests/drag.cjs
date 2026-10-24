/* Arrastre con mouse real y comprobación de apilado (hit-testing).

   Cubre el fallo del nivel w5l4 «Cada animal a su establo»: si las piezas
   quedan pintadas debajo de .drag-tray, la bandeja se come el pointerdown y
   el niño no puede arrastrar nada. El recorrido automático de niveles no lo
   detecta porque dispara los eventos directamente sobre la pieza.

   Uso: node tests/drag.cjs
   Requiere el servidor local en http://127.0.0.1:8123 (npm run serve). */
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
  const page = await preparePage(BASE, { width: 1366, height: 768 });
  const { evaluate, errors, screenshot, dragTo, rectOf } = page;
  try {
    /* Perfil de prueba con el nivel anterior aprobado y los tutoriales vistos */
    const code = await evaluate(`(() => {
      const p = MA.Store.createProfile({ code: 'DRAG', name: 'Arrastre', character: 'mimo' });
      p.tutorials = { move: true, click: true, drag: true, path: true, wheel: true, rightclick: true };
      p.levels['w5l3'] = { completed: true, stars: 3, best: 300, plays: 1, wins: 1 };
      MA.Store.setActiveProfile(p.code);
      MA.Store.saveNow();
      return p.code;
    })()`);
    check('se crea el perfil de prueba', !!code);

    await evaluate("location.hash = '#/jugar/w5l4'");
    await sleep(900);
    check('w5l4 abre con su introducción', await evaluate("!!document.querySelector('.level-intro')"));
    await page.clickSelector('.level-intro__actions .btn--primary');
    await sleep(900);

    /* --- Apilado: cada pieza y cada zona deben recibir el puntero --- */
    const hit = await evaluate(`(() => {
      const items = Array.from(document.querySelectorAll('.drag-item'));
      const zones = Array.from(document.querySelectorAll('.drag-zone'));
      const at = (el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!(top && (top === el || el.contains(top)));
      };
      return { count: items.length, items: items.map(at), zones: zones.map(at) };
    })()`);
    check('hay 4 piezas y 2 establos', hit.count === 4 && hit.zones.length === 2, JSON.stringify(hit));
    check('las piezas reciben el puntero (no la bandeja)', hit.items.length > 0 && hit.items.every(Boolean), JSON.stringify(hit.items));
    check('los establos reciben el puntero', hit.zones.length > 0 && hit.zones.every(Boolean), JSON.stringify(hit.zones));

    /* --- Arrastre real de las 4 piezas a su establo --- */
    const plan = [['oveja', 'blanco'], ['oveja', 'blanco'], ['vaca', 'rojo'], ['vaca', 'rojo']];
    for (let i = 0; i < plan.length; i++) {
      const label = plan[i][0];
      const zoneId = plan[i][1];
      const from = await evaluate(`(() => {
        const el = Array.from(document.querySelectorAll('.drag-item:not([data-placed="true"])'))
          .find((e) => (e.getAttribute('aria-label') || '').indexOf(${JSON.stringify(label)}) === 0);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);
      const zone = await rectOf('[data-zone="' + zoneId + '"]');
      if (!from || !zone) {
        check('arrastrar ' + label + ' al establo ' + zoneId, false, JSON.stringify({ from: !!from, zone: !!zone }));
        continue;
      }
      await dragTo(from, { x: zone.x, y: zone.y });
    }

    const state = await evaluate(`(() => {
      const dbg = MA.Engine.active ? MA.Engine.active.debug() : {};
      const count = (id) => {
        const el = document.querySelector('[data-zone="' + id + '"] .drag-zone__count');
        return el ? el.textContent : null;
      };
      return {
        placed: document.querySelectorAll('.drag-item[data-placed="true"]').length,
        blanco: count('blanco'),
        rojo: count('rojo'),
        drags: dbg.metrics ? dbg.metrics.drags : null,
        finished: !!dbg.finished
      };
    })()`);
    check('las 4 piezas quedan colocadas', state.placed === 4, JSON.stringify(state));
    check('cada establo queda en 2/2', state.blanco === '2/2' && state.rojo === '2/2', state.blanco + ' / ' + state.rojo);
    check('el arrastre se registra sin errores', !!(state.drags && state.drags.ok === 4 && state.drags.wrong === 0), JSON.stringify(state.drags));

    await sleep(2600);
    check('el nivel se completa', await evaluate("!!(MA.Engine.active && MA.Engine.active.debug().finished)"));
    const results = await evaluate("!!document.querySelector('.modal--results')");
    check('aparece la pantalla de resultados', results);
    check('sin errores de consola', errors.length === 0, errors.join(' | '));
    if (!results) await screenshot(path.join(__dirname, 'artifacts', 'drag-failure.png'));
  } finally {
    await page.browser.close();
  }

  console.log('\nResultado: ' + passed + ' comprobaciones correctas, ' + failures.length + ' fallos.');
  if (failures.length) { failures.forEach((f) => console.log(' - ' + f)); process.exitCode = 1; }
})();
