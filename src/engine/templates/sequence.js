/* Plantilla: SECUENCIA — hacer clic siguiendo un orden indicado.
   Se usa en botones de interfaz, semáforos, banderas y órdenes por tamaño. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  MA.Templates.register('sequence', function (ctx) {
    const p = ctx.params || {};
    const api = ctx.api;
    const layer = ctx.layer;
    const stage = ctx.stage;
    const scale = ctx.sizeScale();
    const cards = (p.cards || []).slice();
    const order = (p.order || cards.map(function (c) { return c.id; })).slice();
    const size = Math.max(62, (p.size || 100) * scale);
    const byId = {};
    cards.forEach(function (c) { byId[c.id] = c; });

    let step = 0;
    let width = ctx.stageRect().width;
    let height = ctx.stageRect().height;
    let completionTimer = null;
    let destroyed = false;
    let lastBubble = 0;

    api.setTotal(order.length);
    api.progress(0, order.length);

    /* ---------- tira de orden ---------- */
    const strip = U.el('div', { class: 'seq-strip', 'aria-label': 'Orden a seguir' });
    order.forEach(function (id, i) {
      const c = byId[id] || { emoji: '❔', label: id };
      const chip = U.el('div', {
        class: 'seq-chip' + (i === 0 ? ' is-next' : ''),
        'data-step': String(i),
        title: c.label || ''
      });
      if (c.color) chip.style.setProperty('--chip-color', c.color);
      chip.appendChild(U.el('span', { class: 'seq-chip__num', text: String(i + 1) }));
      chip.appendChild(U.el('span', { class: 'seq-chip__emoji', text: c.emoji || '●' }));
      if (c.color) chip.appendChild(U.el('span', { class: 'seq-chip__color', text: c.label || '' }));
      strip.appendChild(chip);
    });
    layer.appendChild(strip);

    /* ---------- tablero de cartas ---------- */
    const board = U.el('div', { class: 'seq-board' });
    layer.appendChild(board);

    const shuffled = U.shuffle(cards, Math.random);
    const elements = {};
    shuffled.forEach(function (c, index) {
      const el = U.el('div', {
        class: 'seq-card seq-card--' + (p.style || 'default'),
        'data-hit': '1',
        'data-card': c.id,
        role: 'button',
        tabindex: '-1',
        'aria-label': c.label || c.id,
        style: { width: size + 'px', height: size + 'px' }
      });
      if (c.color) el.style.setProperty('--item-color', c.color);
      if (c.scale) el.style.setProperty('--card-scale', String(c.scale));
      const em = U.el('span', { class: 'seq-card__emoji', text: c.emoji || '' });
      em.style.fontSize = Math.round(size * 0.44) + 'px';
      el.appendChild(em);
      if (p.showNumbers && c.number !== undefined) el.appendChild(U.el('span', { class: 'seq-card__num', text: String(c.number) }));
      if (c.color && p.showColorName !== false) el.appendChild(U.el('span', { class: 'seq-card__caption', text: c.label || '' }));
      else if (c.label && (p.showLabels || p.style === 'button')) el.appendChild(U.el('span', { class: 'seq-card__caption', text: c.label }));
      board.appendChild(el);
      elements[c.id] = el;
    });

    function nextId() { return order[step]; }

    function updateStrip() {
      Array.prototype.slice.call(strip.children).forEach(function (chip, i) {
        chip.classList.toggle('is-done', i < step);
        chip.classList.toggle('is-next', i === step);
      });
      Array.prototype.slice.call(board.children).forEach(function (el) {
        const id = el.dataset.card;
        el.classList.toggle('is-next', id === nextId());
      });
    }

    function gentle(text) {
      const now = G.performance.now();
      if (now - lastBubble < 1100) return;
      lastBubble = now;
      api.bubble(text, 'idle', 2600);
    }

    function completeCard(id) {
      const el = elements[id];
      if (!el) return;
      el.classList.add('is-done');
      el.setAttribute('data-done', 'true');
      const r = el.getBoundingClientRect();
      const base = stage.getBoundingClientRect();
      api.effect('star', r.left - base.left + r.width / 2, r.top - base.top + r.height / 2, 5);
      api.sfx('success');
      api.click(true);
      api.target();
      step += 1;
      api.progress(step, order.length);
      updateStrip();
      if (step >= order.length) {
        api.sfx('celebrate');
        api.effect('celebrate', width / 2, height * 0.4, 22);
        api.bubble('¡Excelente! Seguiste el orden perfecto.', 'cheer', 3200);
        completionTimer = G.setTimeout(function () { if (!destroyed) api.complete(); }, 850);
      } else {
        api.bubble('¡Muy bien! Ahora toca ' + labelOf(nextId()) + '.', 'happy', 2200);
      }
    }

    function labelOf(id) {
      const c = byId[id];
      return c ? (c.label || 'el siguiente') : 'el siguiente';
    }

    function onPointerDown(ev) {
      if (api.isPaused() || api.isFinished()) return;
      if (ev.button !== 0) return;
      let node = ev.target;
      while (node && node !== layer && !(node.classList && node.classList.contains('seq-card'))) node = node.parentNode;
      if (!node || node === layer) return;
      const id = node.dataset.card;
      if (id === nextId()) {
        completeCard(id);
      } else {
        api.click(false);
        api.sfx('wrong');
        node.classList.add('is-wrong');
        G.setTimeout(function () { node.classList.remove('is-wrong'); }, 520);
        gentle('Ese no es el que sigue. Mira la tira de arriba: ahora va ' + labelOf(nextId()) + '.');
      }
    }

    layer.addEventListener('pointerdown', onPointerDown);
    updateStrip();

    function hint() {
      const el = elements[nextId()];
      if (el) {
        api.arrowTo(el);
        el.classList.add('is-pulsing');
        G.setTimeout(function () { el.classList.remove('is-pulsing'); }, 3200);
      }
      api.sfx('hover');
      return 'Sigue el orden de la tira. Ahora toca ' + labelOf(nextId()) + '.';
    }

    function onResize() {
      const r = stage.getBoundingClientRect();
      width = r.width; height = r.height;
    }
    const resizeHandler = U.debounce(onResize, 160);
    G.addEventListener('resize', resizeHandler);

    return {
      hint: hint,
      destroy: function () {
        destroyed = true;
        if (completionTimer) G.clearTimeout(completionTimer);
        layer.removeEventListener('pointerdown', onPointerDown);
      }
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
