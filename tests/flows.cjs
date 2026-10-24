/* Pruebas de flujos reales de la interfaz: pausa, repetir, ajustes, docente,
   respaldos, CSV, impresión y persistencia al recargar. */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { preparePage, sleep } = require('./helpers/cdp.cjs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
const downloads = fs.mkdtempSync(path.join(os.tmpdir(), 'ma-downloads-'));
let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) { passed++; console.log('✔ ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('✖ ' + name + (detail ? ' — ' + detail : '')); }
}

async function toDashboard(ev) {
  if (await ev("!!document.querySelector('.td-table--levels')")) {
    await ev("(() => { const b = document.querySelector('.td-header__left .btn'); if (b) b.click(); return true; })()");
    await sleep(500);
  }
}

async function modalAction(ev, text) {
  const ok = await ev(`(() => {
    const buttons = Array.from(document.querySelectorAll('.modal-actions button'));
    const btn = buttons.find((x) => (x.textContent || '').includes(${JSON.stringify(text)}));
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  await sleep(400);
  return ok;
}

(async () => {
  const page = await preparePage(BASE, { port: 9336 });
  const ev = page.evaluate;
  try {
    await page.client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

    /* Perfil */
    await page.clickSelector('.avatar-card');
    await ev("document.querySelector('#onb-name').value = 'Flujos'");
    await page.clickText('Empezar');
    await sleep(800);
    const code = await ev('MA.Store.profile().code');
    check('se crea el perfil desde la interfaz', !!code);

    /* Empezar nivel 1 (incluye tutorial interactivo) */
    await ev("MA.App.go('jugar/w1l1')");
    await sleep(600);
    await page.clickText('¡Empezar!');
    await sleep(600);
    check('aparece el tutorial de la mecánica nueva', await ev("!!document.querySelector('.tutorial')"));
    await ev(`(() => {
      const t = document.querySelector('.practice-target');
      const r = t.getBoundingClientRect();
      t.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'mouse' }));
      return true;
    })()`);
    await sleep(1000);
    check('el tutorial reconoce la práctica correcta', await ev("!!document.querySelector('.tutorial__practice.is-success')"));
    check('el tutorial ofrece continuar', await modalAction(ev, '¡Vamos a jugar!'));
    await sleep(600);
    check('el motor arranca tras el tutorial', await ev('!!MA.Engine.active && !MA.Engine.active.isFinished()'));

    /* Jugar un objetivo */
    await ev(`(() => {
      const st = document.getElementById('play-stage');
      const t = document.querySelector('.target--move');
      const r = t.getBoundingClientRect();
      for (let i = 0; i < 30; i++) st.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'mouse' }));
      return true;
    })()`);
    await page.clickSelector('.hud__pause');
    await sleep(400);
    check('el botón de pausa abre el diálogo', await ev("!!document.querySelector('.modal-overlay')"));
    check('el motor queda pausado', await ev('MA.Engine.active.isPaused()'));
    check('se reanuda la partida', await modalAction(ev, 'Seguir jugando') && await ev('!MA.Engine.active.isPaused()'));

    /* Repetir */
    const playsBefore = await ev("MA.Store.profile().levels['w1l1'].plays");
    await page.clickSelector('.hud__pause');
    await sleep(300);
    check('se puede repetir desde la pausa', await modalAction(ev, 'Repetir'));
    await sleep(600);
    const playsAfter = await ev("MA.Store.profile().levels['w1l1'].plays");
    check('repetir reinicia y cuenta un intento nuevo', playsAfter === playsBefore + 1, playsBefore + ' → ' + playsAfter);

    /* Salir al mapa = abandono registrado */
    await page.clickSelector('.hud__pause');
    await sleep(300);
    await modalAction(ev, 'Ir al mapa');
    await sleep(600);
    check('salir al mapa vuelve al mundo', (await ev('location.hash')).indexOf('mundo/1') >= 0);
    const abandoned = await ev("MA.Store.profile().levels['w1l1'].abandoned");
    check('se registra el abandono sin borrar recompensas', abandoned >= 1);
    check('el nivel no queda completado al abandonar', !(await ev("!!MA.Store.profile().levels['w1l1'].completed")));

    /* Ajustes persistentes */
    await ev("MA.App.go('ajustes')");
    await sleep(500);
    await ev(`(() => {
      const row = Array.from(document.querySelectorAll('.set-row')).find(r => (r.textContent||'').includes('Movimiento reducido'));
      row.querySelector('.switch__input').click();
      return true;
    })()`);
    await sleep(200);
    check('movimiento reducido se aplica al documento', await ev("document.body.classList.contains('reduce-motion')"));
    const muted = await ev(`(() => {
      const row = Array.from(document.querySelectorAll('.set-row')).find(r => (r.textContent||'').includes('Silenciar todo'));
      row.querySelector('.switch__input').click();
      return MA.Store.settings().muted;
    })()`);
    check('el silencio total se guarda', muted === true);

    /* Respaldo export/import */
    const backup = await ev('MA.Store.exportText()');
    check('el respaldo contiene perfiles', backup.indexOf('"profiles"') >= 0 && backup.length > 500);
    const imported = await ev(`(() => { const r = MA.Store.importText(${JSON.stringify(backup)}); return r.ok; })()`);
    check('el respaldo se puede importar', imported === true);

    /* Panel docente: PIN incorrecto y correcto */
    await ev("sessionStorage.removeItem('ma.teacherUnlocked'); MA.App.go('docente')");
    await sleep(500);
    await ev(`(() => {
      const keys = Array.from(document.querySelectorAll('.gate-key'));
      const press = (t) => keys.find(k => k.textContent.trim() === t).click();
      ['9','9','9','9'].forEach(press);
      keys.find(k => k.classList.contains('gate-key--go')).click();
      return true;
    })()`);
    await sleep(300);
    check('el PIN incorrecto muestra error', (await ev("document.querySelector('.gate-error').textContent")).length > 5);
    await ev("document.querySelector('.gate-input').value = ''");
    await ev(`(() => {
      const keys = Array.from(document.querySelectorAll('.gate-key'));
      const press = (t) => keys.find(k => k.textContent.trim() === t).click();
      ['9','5','1','3'].forEach(press);
      keys.find(k => k.classList.contains('gate-key--go')).click();
      return true;
    })()`);
    await sleep(600);
    check('el PIN 9513 abre el panel', await ev("!!document.querySelector('.screen--teacher')"));

    /* Crear estudiante */
    await ev(`(() => {
      const inputs = document.querySelectorAll('.td-create .td-input');
      inputs[0].value = '1A-05';
      inputs[1].value = 'Camilo';
      return true;
    })()`);
    await page.clickText('Crear estudiante');
    await sleep(700);
    check('se crea un estudiante desde el panel', await ev("!!MA.Store.data.profiles['1A-05']"));
    check('se abre el detalle del nuevo estudiante', await ev("!!document.querySelector('.td-table--levels')"));
    await toDashboard(ev);

    /* CSV */
    await page.clickText('Exportar resumen CSV');
    await sleep(900);
    const files = fs.readdirSync(downloads);
    const csv = files.find((f) => f.endsWith('.csv'));
    check('se descarga el CSV de estudiantes', !!csv, files.join(', '));
    if (csv) {
      const text = fs.readFileSync(path.join(downloads, csv), 'utf8');
      check('el CSV tiene BOM y cabecera', text.charCodeAt(0) === 0xFEFF && text.indexOf('Código;Nombre') >= 0);
      check('el CSV incluye al estudiante', text.indexOf('1A-05') >= 0);
    }

    /* Impresión simulada */
    await ev("MA.App.go('progreso')");
    await sleep(400);
    await ev("window.__printed = 0; window.print = function () { window.__printed++; };");
    await page.clickText('Imprimir resumen');
    await sleep(600);
    check('se genera el área de impresión', await ev("!!document.querySelector('.print-area')"));
    check('se llama a la impresión', (await ev('window.__printed')) >= 1);
    await ev("document.body.classList.remove('is-printing'); const p = document.querySelector('.print-area'); if (p) p.remove();");

    /* Restablecer un estudiante (con confirmación por código) */
    await ev("MA.App.go('docente')");
    await sleep(400);
    await toDashboard(ev);
    await ev(`(() => {
      const cards = Array.from(document.querySelectorAll('.td-student'));
      const card = cards.find(c => (c.textContent||'').includes('1A-05'));
      const btn = Array.from(card.querySelectorAll('button')).find(b => (b.textContent||'').includes('Restablecer'));
      btn.click();
      return true;
    })()`);
    await sleep(400);
    await ev("document.querySelector('.td-confirm .td-input').value = 'NO'");
    await ev(`(() => {
      const btn = Array.from(document.querySelectorAll('.td-confirm button')).find((b) => (b.textContent || '').includes('Borrar progreso'));
      if (btn) btn.click();
      return !!btn;
    })()`);
    await sleep(300);
    check('el restablecimiento exige el código exacto', (await ev("document.querySelector('.td-confirm .td-msg').textContent")).indexOf('no coincide') >= 0);
    await ev("document.querySelector('.td-confirm .td-input').value = '1A-05'");
    await ev(`(() => {
      const btn = Array.from(document.querySelectorAll('.td-confirm button')).find((b) => (b.textContent || '').includes('Borrar progreso'));
      if (btn) btn.click();
      return !!btn;
    })()`);
    await sleep(600);
    check('el restablecimiento borra el progreso del estudiante', (await ev("MA.Progress.completedCount(MA.Store.data.profiles['1A-05'])")) === 0);
    await toDashboard(ev);

    /* Cambiar PIN */
    await ev("sessionStorage.setItem('ma.teacherUnlocked','1'); MA.App.refresh()");
    await sleep(500);
    await ev(`(() => {
      const inputs = Array.from(document.querySelectorAll('.td-section--security .td-input'));
      inputs[0].value = '9513'; inputs[1].value = '2468'; inputs[2].value = '2468';
      return true;
    })()`);
    await page.clickText('Cambiar PIN');
    await sleep(400);
    check('el PIN se cambia', (await ev("MA.Store.checkPin('2468')")) === true && (await ev("MA.Store.checkPin('9513')")) === false);
    await ev("MA.Store.setPin('9513')");

    /* Recarga a mitad de nivel */
    await ev("MA.App.go('jugar/w1l1')");
    await sleep(600);
    await page.clickText('¡Empezar!');
    await sleep(700);
    await ev(`(() => {
      const st = document.getElementById('play-stage');
      const t = document.querySelector('.target--move');
      const r = t.getBoundingClientRect();
      for (let i = 0; i < 30; i++) st.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'mouse' }));
      return true;
    })()`);
    await sleep(400);
    const beforeReload = await ev("(() => { const p = MA.Store.profile(); return { plays: p.levels['w1l1'].plays || 0, done: (MA.Engine.active||{}).metrics ? MA.Engine.active.metrics.targets.done : 0 }; })()");
    await page.client.send('Page.reload', { ignoreCache: true });
    await sleep(1400);
    const afterReload = await ev("(() => { const p = MA.Store.profile(); return { code: p && p.code, plays: p && p.levels['w1l1'] ? p.levels['w1l1'].plays : 0, completed: !!(p && p.levels['w1l1'] && p.levels['w1l1'].completed), lastLevel: p && p.lastLevel }; })()");
    check('el perfil se conserva al recargar', afterReload.code === code);
    check('el intento en curso queda registrado', afterReload.plays === beforeReload.plays);
    check('el nivel no se marca completado sin terminar', afterReload.completed === false);
    check('se recuerda el último nivel', afterReload.lastLevel === 'w1l1');

    /* Errores de consola */
    check('sin errores de JavaScript en los flujos', page.errors.length === 0, page.errors.join(' | '));
  } catch (e) {
    failures.push('Excepción: ' + e.message);
    console.error('✖ Excepción:', e.message);
    console.error(page.errors);
    try { await page.screenshot(path.join(__dirname, 'artifacts', 'flows-failure.png')); } catch (err) {}
  } finally {
    await page.browser.close();
    try { fs.rmSync(downloads, { recursive: true, force: true }); } catch (e) {}
    console.log('\nResultado: ' + passed + ' comprobaciones correctas, ' + failures.length + ' fallos.');
    if (failures.length) { console.log('Fallos:'); failures.forEach((f) => console.log(' - ' + f)); process.exitCode = 1; }
  }
})();
