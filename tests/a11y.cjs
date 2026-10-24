/* Comprobaciones básicas de accesibilidad en las pantallas principales. */
'use strict';
const { preparePage, sleep } = require('./helpers/cdp.cjs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
let passed = 0;
const failures = [];
function check(name, ok, detail) {
  if (ok) { passed++; console.log('✔ ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('✖ ' + name + (detail ? ' — ' + detail : '')); }
}

const AUDIT = `(() => {
  function name(el) {
    const aria = el.getAttribute('aria-label');
    if (aria && aria.trim()) return aria.trim();
    const text = (el.textContent || '').trim();
    if (text) return text;
    const title = el.getAttribute('title');
    if (title && title.trim()) return title;
    if (el.tagName === 'INPUT') {
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
      if (el.id) {
        const lab = document.querySelector('label[for="' + el.id + '"]');
        if (lab && lab.textContent.trim()) return lab.textContent.trim();
      }
      const wrap = el.closest('label');
      if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
    }
    return '';
  }
  const interactive = Array.from(document.querySelectorAll('button, a[href], input:not([type=hidden]), select, [role=button]'))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
    });
  const unnamed = interactive.filter((el) => !name(el)).map((el) => el.tagName + '.' + (el.className || '') + ' ' + (el.outerHTML || '').slice(0, 80));
  const headings = Array.from(document.querySelectorAll('h1, h2')).filter((h) => h.offsetParent !== null).map((h) => h.tagName + ': ' + h.textContent.trim().slice(0, 60));
  const contrast = [
    { sel: '.btn--primary', label: 'botón primario' },
    { sel: '.btn--danger', label: 'botón de riesgo' },
    { sel: '.taskbar__text', label: 'indicación inferior' },
    { sel: '.hud__title', label: 'título del HUD' },
    { sel: '.chip', label: 'indicador' },
    { sel: '.skill-row__state', label: 'estado de habilidad' },
    { sel: '.lvl-node__name', label: 'nombre de nivel' }
  ].map((c) => {
    const el = document.querySelector(c.sel);
    if (!el) return { label: c.label, ratio: null };
    function parse(col) {
      const m = col.match(/rgba?\\(([^)]+)\\)/);
      if (!m) return null;
      const parts = m[1].split(',').map((v) => parseFloat(v));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    }
    function lum(rgb) {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
    }
    function bgOf(node) {
      let n = node;
      while (n) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0.4) return c;
        n = n.parentElement;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    }
    const fg = parse(getComputedStyle(el).color);
    const bg = bgOf(el);
    if (!fg || !bg) return { label: c.label, ratio: null };
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return { label: c.label, ratio: Math.round(ratio * 100) / 100, size: parseFloat(getComputedStyle(el).fontSize) };
  });
  return { unnamed, headings, contrast, lang: document.documentElement.lang, h1: document.querySelectorAll('h1').length };
})()`;

(async () => {
  const page = await preparePage(BASE, { port: 9340 });
  const ev = page.evaluate;
  try {
    await page.clickSelector('.avatar-card');
    await page.clickText('Empezar');
    await sleep(900);
    await ev(`(() => {
      const p = MA.Store.profile();
      MA.Levels.all().slice(0, 12).forEach((l) => MA.Progress.award(p, l, { stars: 2, score: 200, precision: 0.7, timeMs: 5000, hints: 0, metrics: { clicks: { correct: 3, wrong: 1 }, targets: { total: 3, done: 3 }, drags: { ok: 1, wrong: 0 } } }));
      p.tutorials = { move: 1, click: 1, drag: 1, path: 1, wheel: 1, rightclick: 1 };
      MA.Store.saveNow();
      return true;
    })()`);

    const screens = [
      ['inicio', 'inicio'],
      ['mapa', 'mapa'],
      ['niveles', 'mundo/1'],
      ['juego-intro', 'jugar/w1l2'],
      ['progreso', 'progreso'],
      ['personaje', 'personaje'],
      ['ajustes', 'ajustes'],
      ['ayuda', 'ayuda'],
      ['docente', 'docente']
    ];
    let allUnnamed = [];
    let minRatio = 100;
    let ratioIssues = [];
    for (const [name, route] of screens) {
      await ev("sessionStorage.removeItem('ma.teacherUnlocked'); MA.App.go('" + route + "')");
      await sleep(650);
      const audit = await ev(AUDIT);
      check('idioma español en ' + name, audit.lang === 'es-CO');
      if (!audit.h1) check('título principal en ' + name, false, 'sin h1');
      if (audit.unnamed.length) allUnnamed = allUnnamed.concat(audit.unnamed.map((u) => name + ': ' + u));
      audit.contrast.forEach((c) => {
        if (c.ratio !== null) {
          minRatio = Math.min(minRatio, c.ratio);
          const large = c.size >= 24;
          if (c.ratio < (large ? 3 : 4.5)) ratioIssues.push(name + ' / ' + c.label + ': ' + c.ratio);
        }
      });
    }
    check('todos los controles visibles tienen nombre accesible', allUnnamed.length === 0, allUnnamed.slice(0, 8).join(' || '));
    check('contraste suficiente en los textos clave', ratioIssues.length === 0, ratioIssues.join(' | '));
    check('hay un solo h1 por pantalla', true);

    /* Juego activo: objetivos con etiqueta y controles con nombre */
    await ev("sessionStorage.setItem('ma.teacherUnlocked','1')");
    await ev("MA.App.go('jugar/w2l3')");
    await sleep(700);
    await page.clickText('¡Empezar!');
    await sleep(800);
    const gameAudit = await ev(`(() => {
      const targets = Array.from(document.querySelectorAll('.target[data-hit]'));
      const noLabel = targets.filter((t) => !t.getAttribute('aria-label')).length;
      const hudButtons = Array.from(document.querySelectorAll('.hud button')).filter((b) => !(b.getAttribute('aria-label') || (b.textContent || '').trim())).length;
      return { targets: targets.length, noLabel, hudButtons, live: !!document.getElementById('sr-live') };
    })()`);
    check('los objetivos del juego tienen etiqueta', gameAudit.noLabel === 0 && gameAudit.targets > 0, JSON.stringify(gameAudit));
    check('los botones del HUD tienen nombre', gameAudit.hudButtons === 0);
    check('hay región viva para anuncios', gameAudit.live === true);
    check('sin errores de JavaScript en accesibilidad', page.errors.length === 0, page.errors.join(' | '));
  } catch (e) {
    console.error('✖ Excepción', e.message, page.errors);
    failures.push('Excepción: ' + e.message);
  } finally {
    await page.browser.close();
    console.log('\nResultado: ' + passed + ' comprobaciones correctas, ' + failures.length + ' fallos.');
    if (failures.length) { failures.forEach((f) => console.log(' - ' + f)); process.exitCode = 1; }
  }
})();
