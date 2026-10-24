/* Plantilla: ARRASTRAR Y SOLTAR — llevar piezas hasta su zona.
   Variantes: emparejar, clasificar, rompecabezas, construir y ordenar.
   El objeto sigue al cursor, vuelve a su sitio si se suelta mal y nunca
   reinicia el nivel. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  MA.Templates.register('drag', function (ctx) {
    const p = ctx.params || {};
    const api = ctx.api;
    const layer = ctx.layer;
    const stage = ctx.stage;
    const scale = ctx.sizeScale();
    const items = (p.items || []).map(function (it, i) {
      return {
        id: it.id || ('i' + i), emoji: it.emoji || '', label: it.label || 'pieza',
        color: it.color || null, shape: it.shape || null, scale: it.scale || 1,
        zone: null, placed: false, el: null, slot: { x: 0, y: 0 }, size: 0
      };
    });
    const zones = (p.zones || []).map(function (z, i) {
      return {
        id: z.id || ('z' + i), label: z.label || '', emoji: z.emoji || '',
        color: z.color || null, x: z.x, y: z.y, size: z.size || 110,
        accepts: (z.accepts || []).slice(), shape: z.shape || null,
        placed: 0, el: null
      };
    });

    let width = ctx.stageRect().width;
    let height = ctx.stageRect().height;
    let trayH = 0;
    let playH = height;
    let dragging = null;
    let dragOffset = { x: 0, y: 0 };
    let doneCount = 0;
    let completionTimer = null;
    let destroyed = false;
    let guideEl = null;
    let lastBubble = 0;
    let guidedActive = !!p.guided;
    let wrongShake = 0;

    const pieceSize = Math.max(54, (p.pieceSize || 86) * scale);
    const snap = Math.max(34, (p.snap || 56) * scale);

    api.setTotal(items.length);
    api.progress(0, items.length);

    /* ---------- tablero ---------- */
    const tray = U.el('div', { class: 'drag-tray' });
    const trayTitle = U.el('div', { class: 'drag-tray__title', text: p.trayLabel || 'Piezas para arrastrar' });
    tray.appendChild(trayTitle);
    layer.appendChild(tray);

    zones.forEach(function (z) {
      const el = U.el('div', {
        class: 'drag-zone drag-zone--' + (p.mode || 'match') + (z.shape ? ' drag-zone--shape' : ''),
        'data-zone': z.id,
        'data-accepts': z.accepts.join(','),
        'aria-label': 'Zona ' + (z.label || z.id),
        style: { width: '0px', height: '0px' }
      });
      if (z.color) el.style.setProperty('--zone-color', z.color);
      if (z.shape) {
        el.appendChild(U.el('span', { class: 'drag-zone__shape shape shape--' + z.shape, 'aria-hidden': 'true' }));
      }
      if (z.emoji) el.appendChild(U.el('span', { class: 'drag-zone__emoji', text: z.emoji }));
      if (z.label && (!z.shape || p.showZoneLabels === true)) el.appendChild(U.el('span', { class: 'drag-zone__label', text: z.label }));
      el.appendChild(U.el('span', { class: 'drag-zone__count', text: '0/' + z.accepts.length }));
      z.el = el;
      layer.appendChild(el);
    });

    items.forEach(function (item) {
      const el = U.el('div', {
        class: 'drag-item' + (item.shape ? ' drag-item--shape' : ''),
        'data-drag': item.id,
        role: 'button',
        tabindex: '-1',
        'aria-label': item.label + '. Arrastra y suelta en su lugar.',
        style: { width: '0px', height: '0px' }
      });
      if (item.color) el.style.setProperty('--item-color', item.color);
      if (item.shape) {
        el.appendChild(U.el('span', { class: 'shape shape--' + item.shape, 'aria-hidden': 'true' }));
        el.classList.add('drag-item--shape-' + item.shape);
      }
      if (item.emoji) {
        const em = U.el('span', { class: 'drag-item__emoji', text: item.emoji });
        em.style.fontSize = Math.round(pieceSize * 0.5) + 'px';
        el.appendChild(em);
      }
      item.el = el;
      layer.appendChild(el);
    });

    /* ---------- distribución ---------- */
    function layout() {
      const r = stage.getBoundingClientRect();
      width = r.width; height = r.height;
      const cols = Math.max(2, Math.min(items.length, Math.floor((width - 60) / (pieceSize + 16)) || 2));
      const rows = Math.ceil(items.length / cols);
      trayH = rows * (pieceSize + 12) + 40;
      playH = Math.max(180, height - trayH);
      tray.style.left = '0px';
      tray.style.right = '0px';
      tray.style.bottom = '0px';
      tray.style.height = trayH + 'px';

      const gap = 12;
      const cellW = (width - 40) / cols;
      items.forEach(function (item, i) {
        item.size = Math.round(pieceSize * (item.scale || 1));
        const c = i % cols, row = Math.floor(i / cols);
        const cx = 20 + cellW * (c + 0.5);
        const cy = height - trayH + 30 + row * (pieceSize + gap) + pieceSize / 2;
        item.slot = { x: cx, y: cy };
        item.el.style.width = item.size + 'px';
        item.el.style.height = item.size + 'px';
        if (!item.placed && !dragging) {
          item.el.style.left = (cx - item.size / 2) + 'px';
          item.el.style.top = (cy - item.size / 2) + 'px';
        }
      });

      zones.forEach(function (z) {
        const zs = z.size * scale;
        z.el.style.width = zs + 'px';
        z.el.style.height = zs + 'px';
        const cx = U.clamp(z.x * width, zs / 2 + 8, width - zs / 2 - 8);
        const cy = U.clamp(z.y * playH, zs / 2 + 8, playH - zs / 2 - 8);
        z.el.style.left = (cx - zs / 2) + 'px';
        z.el.style.top = (cy - zs / 2) + 'px';
        z.cx = cx; z.cy = cy; z.zs = zs;
      });

      items.forEach(function (item) {
        if (item.placed && item.zone) placeInZone(item);
      });
    }

    function placeInZone(item) {
      const z = item.zone;
      if (!z) return;
      const idx = z.placed - 1;
      const cols = Math.max(1, Math.min(2, Math.ceil(Math.sqrt(Math.max(1, z.accepts.length)))));
      const cell = z.zs * 0.36;
      const ox = ((idx % cols) - (cols - 1) / 2) * cell;
      const oy = (Math.floor(idx / cols) - 0.2) * cell;
      item.el.style.left = (z.cx + ox - item.size * 0.4) + 'px';
      item.el.style.top = (z.cy + oy - item.size * 0.4) + 'px';
      item.el.style.width = (item.size * 0.8) + 'px';
      item.el.style.height = (item.size * 0.8) + 'px';
    }

    /* ---------- guía de tres pasos ---------- */
    if (guidedActive) {
      guideEl = U.el('div', {
        class: 'drag-guide',
        html: '<div class="drag-guide__steps">' +
          '<div class="drag-guide__step"><span>1</span><b>Pon la flecha</b> sobre la pieza</div>' +
          '<div class="drag-guide__step"><span>2</span><b>Mantén</b> el botón izquierdo</div>' +
          '<div class="drag-guide__step"><span>3</span><b>Suelta</b> en el lugar que brilla</div>' +
          '</div>' +
          '<div class="drag-guide__hand" aria-hidden="true">🖐️</div>'
      });
      layer.appendChild(guideEl);
      G.setTimeout(dismissGuide, 9000);
    }

    function dismissGuide() {
      if (!guideEl) return;
      guideEl.classList.add('is-hidden');
      const g = guideEl;
      guideEl = null;
      G.setTimeout(function () { U.remove(g); }, 500);
    }

    /* ---------- arrastre ---------- */
    function itemFromEvent(ev) {
      let node = ev.target;
      while (node && node !== layer) {
        if (node.classList && node.classList.contains('drag-item')) return node;
        node = node.parentNode;
      }
      return null;
    }

    function itemByEl(el) {
      for (let i = 0; i < items.length; i++) if (items[i].el === el) return items[i];
      return null;
    }

    function zoneAtPoint(pt) {
      let best = null;
      zones.forEach(function (z) {
        if (!z.cx) return;
        const d = U.dist(pt.x, pt.y, z.cx, z.cy);
        const reach = z.zs / 2 + snap;
        if (d <= reach) {
          if (!best || d < best.d) best = { zone: z, d: d };
        }
      });
      return best ? best.zone : null;
    }

    function setDragging(item, on) {
      item.el.classList.toggle('is-dragging', on);
      item.el.style.zIndex = on ? '60' : '';
    }

    function beginDrag(item, ev) {
      if (item.placed || api.isPaused() || api.isFinished()) return;
      if (ev.button !== 0) {
        api.bubble('Para arrastrar, mantén presionado el botón izquierdo.', 'idle', 2400);
        return;
      }
      dragging = item;
      const r = stage.getBoundingClientRect();
      const baseLeft = parseFloat(item.el.style.left) || 0;
      const baseTop = parseFloat(item.el.style.top) || 0;
      dragOffset.x = ev.clientX - r.left - baseLeft;
      dragOffset.y = ev.clientY - r.top - baseTop;
      setDragging(item, true);
      api.sfx('drag');
      dismissGuide();
      if (api.assist()) item.el.classList.add('is-magnet');
    }

    function moveDrag(ev) {
      if (!dragging) return;
      const r = stage.getBoundingClientRect();
      let x = ev.clientX - r.left - dragOffset.x;
      let y = ev.clientY - r.top - dragOffset.y;
      x = U.clamp(x, 4, width - dragging.size - 4);
      y = U.clamp(y, 4, height - dragging.size - 4);
      dragging.el.style.left = x + 'px';
      dragging.el.style.top = y + 'px';
      const center = { x: x + dragging.size / 2, y: y + dragging.size / 2 };
      const zone = zoneAtPoint(center);
      zones.forEach(function (z) { z.el.classList.toggle('is-near', z === zone); });
    }

    function endDrag(ev) {
      if (!dragging) return;
      const item = dragging;
      dragging = null;
      setDragging(item, false);
      zones.forEach(function (z) { z.el.classList.remove('is-near'); });
      const r = stage.getBoundingClientRect();
      const center = {
        x: parseFloat(item.el.style.left) + item.size / 2,
        y: parseFloat(item.el.style.top) + item.size / 2
      };
      const zone = zoneAtPoint(center);
      if (zone && zone.accepts.indexOf(item.id) >= 0) {
        successDrop(item, zone);
      } else {
        api.drop(false);
        api.sfx('wrong');
        if (zone) {
          zone.el.classList.add('is-wrong');
          G.setTimeout(function () { zone.el.classList.remove('is-wrong'); }, 520);
          gentle('Esa no es su zona. Fíjate en el dibujo o en el color.');
        } else {
          gentle('Suelta la pieza dentro del lugar que brilla.');
        }
        item.el.classList.add('is-returning');
        item.el.style.left = (item.slot.x - item.size / 2) + 'px';
        item.el.style.top = (item.slot.y - item.size / 2) + 'px';
        G.setTimeout(function () { item.el.classList.remove('is-returning'); }, 380);
        wrongShake += 1;
        if (wrongShake >= 3) {
          wrongShake = 0;
          G.setTimeout(function () { if (!destroyed) api.bubble('Mira la forma del hueco: te dice dónde va la pieza.', 'idle', 3200); }, 600);
        }
      }
      dismissGuide();
    }

    function gentle(text) {
      const now = G.performance.now();
      if (now - lastBubble < 1200) return;
      lastBubble = now;
      api.bubble(text, 'idle', 3000);
    }

    function successDrop(item, zone) {
      item.placed = true;
      item.zone = zone;
      zone.placed += 1;
      zone.el.classList.add('is-filled');
      zone.el.querySelector('.drag-zone__count').textContent = zone.placed + '/' + zone.accepts.length;
      item.el.classList.add('is-placed');
      item.el.setAttribute('data-placed', 'true');
      item.el.setAttribute('aria-label', item.label + ' colocado en ' + (zone.label || zone.id));
      placeInZone(item);
      api.drop(true);
      api.sfx('plop');
      api.target();
      doneCount += 1;
      api.progress(doneCount, items.length);
      const rr = item.el.getBoundingClientRect();
      const base = stage.getBoundingClientRect();
      api.effect('spark', rr.left - base.left + rr.width / 2, rr.top - base.top + rr.height / 2, 5);
      if (p.mode === 'build') api.effect('star', rr.left - base.left + rr.width / 2, rr.top - base.top, 3);
      if (doneCount >= items.length) {
        api.sfx('celebrate');
        api.effect('celebrate', width / 2, playH * 0.4, 24);
        api.bubble('¡Excelente! Todo quedó en su lugar.', 'cheer', 3200);
        completionTimer = G.setTimeout(function () { if (!destroyed) api.complete(); }, 900);
      } else if (doneCount === items.length - 1) {
        api.bubble('¡Solo falta una pieza! ¡Muy bien!', 'happy', 2500);
      }
    }

    function onPointerDown(ev) {
      if (api.isPaused() || api.isFinished()) return;
      const el = itemFromEvent(ev);
      if (!el) return;
      const item = itemByEl(el);
      if (item) beginDrag(item, ev);
    }

    layer.addEventListener('pointerdown', onPointerDown);
    G.addEventListener('pointermove', moveDrag);
    G.addEventListener('pointerup', endDrag);
    G.addEventListener('pointercancel', endDrag);

    layout();
    /* re-layout tras montar (las medidas del escenario pueden cambiar) */
    G.requestAnimationFrame(layout);
    G.requestAnimationFrame(function () { G.requestAnimationFrame(layout); });

    function hint() {
      const next = items.filter(function (i) { return !i.placed; })[0];
      if (next) {
        api.arrowTo(next.el);
        next.el.classList.add('is-pulsing');
        G.setTimeout(function () { next.el.classList.remove('is-pulsing'); }, 3200);
        const zone = zones.filter(function (z) { return z.accepts.indexOf(next.id) >= 0; })[0];
        if (zone) zone.el.classList.add('is-pulsing');
        return 'Pon la flecha sobre ' + next.label + ', mantén el botón izquierdo, mueve y suelta donde brilla.';
      }
      return 'Arrastra cada pieza hasta su lugar.';
    }

    const resizeHandler = U.debounce(function () {
      if (!destroyed) layout();
    }, 150);
    G.addEventListener('resize', resizeHandler);

    return {
      hint: hint,
      destroy: function () {
        destroyed = true;
        if (completionTimer) G.clearTimeout(completionTimer);
        layer.removeEventListener('pointerdown', onPointerDown);
        G.removeEventListener('pointermove', moveDrag);
        G.removeEventListener('pointerup', endDrag);
        G.removeEventListener('pointercancel', endDrag);
      }
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
