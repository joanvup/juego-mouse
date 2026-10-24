/* Automatización de partidas con eventos sintéticos (para pruebas).
   No se entrega al usuario: vive solo en la carpeta de pruebas. */
'use strict';
const { sleep } = require('./cdp.cjs');

const INSTALL = `(() => {
  window.__AUTO__ = {
    lastHover: null, hoverAt: 0, pathIndex: 0, pathKey: '',
    center(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; },
    visible(el) {
      if (!el || !el.isConnected) return false;
      if (el.classList.contains('is-gone') || el.classList.contains('is-done') || el.classList.contains('is-placed')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    },
    first(sel, root) {
      return Array.from((root || document).querySelectorAll(sel)).filter((e) => this.visible(e))[0] || null;
    },
    fire(el, type, x, y, button, buttons) {
      const ev = new PointerEvent(type, {
        bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y,
        button: button || 0, buttons: buttons || 0, pointerId: 1, pointerType: 'mouse',
        isPrimary: true, width: 1, height: 1
      });
      return el.dispatchEvent(ev);
    },
    step() {
      const eng = MA.Engine.active;
      if (document.querySelector('.modal--results')) return { done: true, kind: 'results' };
      if (!eng) return { done: false, kind: 'no-engine' };
      if (eng.isFinished()) return { done: true, kind: 'finished' };
      if (eng.isPaused()) return { done: false, kind: 'paused' };
      const params = eng.level.params || {};
      const stage = document.getElementById('play-stage');
      if (!stage) return { done: false, kind: 'no-stage' };

      const board = document.querySelector('.path-board');
      const dbg = board && eng.debug && eng.debug().path;
      if (board && dbg) {
        const key = eng.level.id + ':' + dbg.points.length + ':' + Math.round(dbg.board.width);
        if (this.pathKey !== key) { this.pathKey = key; this.pathIndex = 0; }
        const idx = Math.min(dbg.points.length - 1, this.pathIndex);
        const pt = dbg.points[idx];
        const r = board.getBoundingClientRect();
        const x = r.left + pt.x / 1000 * r.width;
        const y = r.top + pt.y / 600 * r.height;
        this.fire(board, 'pointerenter', x, y, 0, 0);
        this.fire(board, 'pointermove', x, y, 0, 0);
        this.pathIndex = Math.min(dbg.points.length, idx + 8);
        return { kind: 'path', progress: idx / dbg.points.length };
      }

      const wheelBtn = document.querySelector('.wheel-btn');
      if (wheelBtn) {
        if (wheelBtn.disabled) {
          for (let i = 0; i < 8; i++) {
            stage.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 40, deltaMode: 0 }));
          }
          return { kind: 'wheel' };
        }
        wheelBtn.click();
        return { kind: 'wheel-done' };
      }

      const nextCard = document.querySelector('.seq-strip') && document.querySelector('.seq-card.is-next');
      if (nextCard) {
        const c = this.center(nextCard);
        this.fire(nextCard, 'pointerover', c.x, c.y, 0, 0);
        this.fire(nextCard, 'pointerdown', c.x, c.y, 0, 1);
        this.fire(nextCard, 'pointerup', c.x, c.y, 0, 0);
        return { kind: 'sequence' };
      }

      const item = this.first('.drag-item:not(.is-placed)');
      if (item) {
        const id = item.dataset.drag;
        const zone = Array.from(document.querySelectorAll('[data-zone]')).find((z) =>
          (z.dataset.accepts || '').split(',').includes(id)
        );
        if (!zone) return { done: false, kind: 'drag-no-zone' };
        const ic = this.center(item);
        const zc = this.center(zone);
        this.fire(item, 'pointerdown', ic.x, ic.y, 0, 1);
        for (let k = 1; k <= 12; k++) {
          const x = ic.x + (zc.x - ic.x) * k / 12;
          const y = ic.y + (zc.y - ic.y) * k / 12;
          window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y, button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse' }));
        }
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: zc.x, clientY: zc.y, button: 0, buttons: 0, pointerId: 1, pointerType: 'mouse' }));
        return { kind: 'drag', id: id };
      }

      const clickTarget = this.first('.target--click[data-correct="true"]');
      let moveTarget = this.first('.target--move');
      if (moveTarget && params.order) {
        const list = Array.from(document.querySelectorAll('.target--move')).filter((e) => this.visible(e));
        list.sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
        moveTarget = list[0] || moveTarget;
      }
      const target = clickTarget || moveTarget;
      if (target) {
        const c = this.center(target);
        if (clickTarget) {
          this.fire(target, 'pointerover', c.x, c.y, 0, 0);
          this.fire(target, 'pointermove', c.x, c.y, 0, 0);
          const guidedTotal = params.guidedTargets || 0;
          const doneCount = document.querySelectorAll('.target--click[data-correct="true"][data-done="true"]').length;
          const needHover = guidedTotal > 0 && doneCount < guidedTotal;
          if (needHover) {
            if (this.lastHover !== target || !this.hoverAt) {
              this.lastHover = target; this.hoverAt = performance.now();
              return { kind: 'hover' };
            }
            if (performance.now() - this.hoverAt < (params.dwellFirst || 320) + 80) return { kind: 'hover-wait' };
          }
          const button = params.button === 'right' ? 2 : 0;
          this.fire(target, 'pointerdown', c.x, c.y, button, button === 2 ? 2 : 1);
          this.fire(target, 'pointerup', c.x, c.y, button, 0);
          this.lastHover = null; this.hoverAt = 0;
          return { kind: 'click' };
        }
        const reps = params.carry ? 26 : 1;
        for (let i = 0; i < reps; i++) this.fire(stage, 'pointermove', c.x, c.y, 0, 0);
        return { kind: 'move' };
      }

      if (document.querySelector('.mission-banner')) return { done: false, kind: 'stage-transition' };
      return { done: false, kind: 'idle' };
    }
  };
  return 'installed';
})()`;

async function installAuto(page) {
  return page.evaluate(INSTALL);
}

async function clickStart(page) {
  const clicked = await page.evaluate(`(() => {
    const btn = document.querySelector('.level-intro .btn--primary');
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  return clicked;
}

async function autoStep(page) {
  return page.evaluate('window.__AUTO__.step()');
}

async function solveLevel(page, levelId, opts) {
  const options = opts || {};
  const timeout = options.timeout || 60000;
  await page.evaluate(`MA.App.go('jugar/${levelId}')`);
  await sleep(600);
  const started = await clickStart(page);
  if (!started) throw new Error('No apareció el botón de empezar en ' + levelId);
  await sleep(450);
  const t0 = Date.now();
  let lastKind = null;
  let steps = 0;
  while (Date.now() - t0 < timeout) {
    const st = await autoStep(page);
    steps++;
    if (st.done) {
      if (st.kind !== 'results') {
        for (let k = 0; k < 20; k++) {
          const hasModal = await page.evaluate("!!document.querySelector('.modal--results')");
          if (hasModal) break;
          await sleep(150);
        }
      }
      const profile = await page.evaluate('MA.Store.profile()');
      const rec = profile.levels[levelId] || {};
      return { levelId: levelId, steps: steps, ms: Date.now() - t0, kind: st.kind, completed: !!rec.completed, stars: rec.stars || 0 };
    }
    lastKind = st.kind;
    if (st.kind === 'hover') await sleep(430);
    else if (st.kind === 'hover-wait') await sleep(120);
    else if (st.kind === 'path') await sleep(10);
    else if (st.kind === 'idle' || st.kind === 'stage-transition') await sleep(160);
    else if (st.kind === 'paused') await sleep(250);
    else await sleep(45);
  }
  const debug = await page.evaluate(`(() => {
    const eng = MA.Engine && MA.Engine.active;
    return {
      level: eng ? eng.level.id : null,
      template: eng ? eng.level.template : null,
      finished: eng ? eng.isFinished() : null,
      metrics: eng ? eng.getMetrics() : null,
      targets: Array.from(document.querySelectorAll('.target')).map(t => ({cls:t.className, done:t.dataset.done||''})),
      html: (document.getElementById('stage-layer')||{}).innerHTML ? document.getElementById('stage-layer').innerHTML.slice(0, 600) : ''
    };
  })()`);
  throw new Error('Tiempo agotado en ' + levelId + ' (último: ' + lastKind + ') ' + JSON.stringify(debug));
}

module.exports = { installAuto, clickStart, autoStep, solveLevel };
