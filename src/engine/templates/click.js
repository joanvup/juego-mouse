/* Plantilla: CLIC — seleccionar objetivos con el botón izquierdo (o derecho).
   Variantes: objetivos quietos, en movimiento, de colores, con distractores,
   aparición uno por uno, clic guiado (primero colocar la flecha) y clic derecho. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  MA.Templates.register('click', function (ctx) {
    const p = ctx.params || {};
    const api = ctx.api;
    const layer = ctx.layer;
    const stage = ctx.stage;
    const level = ctx.level;
    const scale = ctx.sizeScale();
    const rightButton = p.button === 'right';
    const appearOne = p.appear === 'one';
    const tick = function () { return G.performance.now(); };

    let width = ctx.stageRect().width;
    let height = ctx.stageRect().height;

    /* ---------- construcción de la lista de objetos ---------- */
    function buildItems() {
      if (p.items && p.items.length) {
        return p.items.map(function (it, i) {
          return {
            id: 'it' + i, emoji: it.emoji !== undefined ? it.emoji : (p.emoji || '⭐'),
            label: it.label || p.label || 'objetivo', color: it.color || null,
            correct: !!it.correct, scale: it.scale || 1, avoid: !!it.avoid, el: null, done: false
          };
        });
      }
      const out = [];
      const emojis = p.emojis && p.emojis.length ? p.emojis : [p.emoji || '🎈'];
      const total = Math.max(1, p.count || 5);
      for (let i = 0; i < total; i++) {
        out.push({
          id: 'c' + i, emoji: emojis[i % emojis.length], label: p.label || 'objetivo',
          color: p.color || null, correct: true, scale: 1, avoid: false, el: null, done: false
        });
      }
      const decoyCount = p.decoys || 0;
      for (let d = 0; d < decoyCount; d++) {
        const em = (p.decoyEmojis && p.decoyEmojis.length) ? p.decoyEmojis[d % p.decoyEmojis.length] : '🐝';
        out.push({
          id: 'd' + d, emoji: em, label: p.decoyLabel || 'señuelo',
          color: null, correct: false, scale: 1, avoid: true, el: null, done: false
        });
      }
      return out;
    }

    const items = buildItems();
    const correctItems = items.filter(function (i) { return i.correct; });
    const totalCorrect = correctItems.length;
    let doneCount = 0;
    let spawnIndex = 0;
    let guidedRemaining = Math.min(totalCorrect, p.guidedTargets || 0);
    let hovered = null;
    let hoverAt = 0;
    let completionTimer = null;
    let destroyed = false;
    let wrongStreak = 0;
    let lastBubble = 0;
    let correctSeen = 0;

    api.setTotal(totalCorrect);
    api.progress(0, totalCorrect);

    /* ---------- tamaños y posiciones ---------- */
    function sizeFor(item) {
      const base = Math.max(46, (p.size || 90) * scale);
      const end = p.sizeEnd ? Math.max(42, p.sizeEnd * scale) : base;
      let idx = correctItems.indexOf(item);
      if (idx < 0) idx = correctItems.length - 1;
      const progressive = correctItems.length > 1 ? base + (end - base) * (idx / (correctItems.length - 1)) : base;
      return Math.max(38, progressive * (item.scale || 1));
    }

    function existingCenters() {
      return items.filter(function (i) { return i.el && !i.done; }).map(function (i) {
        const r = i.el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    }

    function findSpot(size) {
      const r = stage.getBoundingClientRect();
      const margin = size / 2 + 14;
      const minX = margin, maxX = Math.max(margin + 10, width - margin);
      const minY = margin, maxY = Math.max(margin + 10, height - margin);
      const centers = existingCenters();
      let best = null, bestGap = -1;
      for (let k = 0; k < 90; k++) {
        const candidate = {
          x: minX + Math.random() * Math.max(1, maxX - minX),
          y: minY + Math.random() * Math.max(1, maxY - minY)
        };
        let gap = Infinity;
        centers.forEach(function (c) { gap = Math.min(gap, U.dist(candidate.x, candidate.y, c.x, c.y)); });
        if (gap > bestGap) { bestGap = gap; best = candidate; }
        if (gap > size * 1.15 + 18) break;
      }
      return best || { x: width / 2, y: height / 2 };
    }

    const captions = ['button', 'card', 'door'].indexOf(p.style) >= 0;
    const colorStyle = p.style === 'balloon' || p.style === 'bubble';
    const hasColors = items.some(function (it) { return !!it.color; });

    function createEl(item) {
      const size = sizeFor(item);
      item.size = size;
      const pos = findSpot(size);
      item.x = pos.x;
      item.y = pos.y;
      const el = U.el('div', {
        class: 'target target--click target--' + (p.style || 'balloon') + (item.correct ? ' is-target' : ' is-decoy'),
        'data-hit': '1',
        'data-correct': item.correct ? 'true' : 'false',
        'data-item': item.id,
        role: 'button',
        tabindex: '-1',
        'aria-label': item.label + (item.correct ? '' : ' (no es el objetivo)'),
        style: {
          width: size + 'px', height: size + 'px',
          left: pos.x + 'px', top: pos.y + 'px'
        }
      });
      if (item.color) el.style.setProperty('--item-color', item.color);
      const hideEmoji = !!item.color && colorStyle;
      if (item.emoji && !hideEmoji) {
        const em = U.el('span', { class: 'target__emoji', text: item.emoji });
        em.style.fontSize = Math.round(size * 0.5) + 'px';
        el.appendChild(em);
      }
      el.appendChild(U.el('span', { class: 'target__shine', 'aria-hidden': 'true' }));
      if (captions && item.label) el.appendChild(U.el('span', { class: 'target__caption', text: item.label }));
      else if (hasColors && colorStyle && item.label) {
        const parts = String(item.label).split(' ');
        const colorName = parts.length > 1 ? parts.slice(1).join(' ') : item.label;
        el.appendChild(U.el('span', { class: 'target__caption', text: colorName }));
      }
      if (p.sleeping) el.appendChild(U.el('span', { class: 'target__badge', text: '💤' }));
      if (rightButton) el.appendChild(U.el('span', { class: 'target__mouse', text: '🖱️', 'aria-hidden': 'true' }));

      if (p.moving) {
        const axis = p.axis || 'both';
        const speed = p.moving * scale * (api.assist() ? 0.55 : 1) * (0.7 + Math.random() * 0.6);
        const a = Math.random() * Math.PI * 2;
        item.vx = axis === 'y' ? 0 : Math.cos(a) * speed;
        item.vy = axis === 'x' ? 0 : Math.sin(a) * speed;
        if (axis === 'y') item.vy = -Math.abs(speed) || -20;
      } else {
        item.vx = 0; item.vy = 0;
      }
      item.el = el;
      layer.appendChild(el);
    }

    function spawnNextCorrect() {
      const next = correctItems[spawnIndex];
      if (!next) return;
      spawnIndex += 1;
      createEl(next);
    }

    function initialSpawn() {
      items.filter(function (i) { return !i.correct; }).forEach(createEl);
      if (appearOne) spawnNextCorrect();
      else correctItems.forEach(createEl);
    }
    initialSpawn();

    /* ---------- pista visual de inicio ---------- */
    if (p.mouseHint) {
      const tip = U.el('div', { class: 'mouse-hint', html: p.mouseHint });
      layer.appendChild(tip);
      G.setTimeout(function () { tip.classList.remove('is-visible'); }, 4200);
      G.setTimeout(function () { U.remove(tip); }, 5000);
    }

    /* ---------- interacción ---------- */
    function itemFromEvent(ev) {
      let node = ev.target;
      while (node && node !== layer) {
        if (node.classList && node.classList.contains('target')) return node;
        node = node.parentNode;
      }
      return null;
    }

    function itemByEl(el) {
      for (let i = 0; i < items.length; i++) if (items[i].el === el) return items[i];
      return null;
    }

    function gentleWrong(text) {
      const now = tick();
      if (now - lastBubble < 1200) return;
      lastBubble = now;
      api.bubble(text, 'idle', 2600);
    }

    function markWrong(item) {
      if (!item || !item.el) return;
      item.el.classList.add('is-wrong');
      item.el.classList.remove('is-wrong');
      void item.el.offsetWidth;
      item.el.classList.add('is-wrong');
      G.setTimeout(function () { if (item.el) item.el.classList.remove('is-wrong'); }, 520);
    }

    function completeItem(item) {
      if (item.done) return;
      item.done = true;
      item.el.classList.add('is-done');
      item.el.setAttribute('data-done', 'true');
      const r = item.el.getBoundingClientRect();
      const base = stage.getBoundingClientRect();
      api.effect(p.style === 'chest' ? 'coin' : 'spark', r.left - base.left + r.width / 2, r.top - base.top + r.height / 2, 6);
      api.sfx(p.style === 'chest' ? 'coin' : 'pop');
      api.click(true);
      api.target();
      doneCount += 1;
      correctSeen += 1;
      if (guidedRemaining > 0) guidedRemaining -= 1;
      api.progress(doneCount, totalCorrect);
      if (doneCount >= totalCorrect) {
        api.sfx('celebrate');
        api.effect('celebrate', width / 2, height * 0.4, 24);
        api.bubble('¡Lo lograste! ¡Excelente!', 'cheer', 3000);
        completionTimer = G.setTimeout(function () { if (!destroyed) api.complete(); }, 900);
      } else {
        if (p.spawnOnHit !== false && appearOne) G.setTimeout(spawnNextCorrect, 380);
        if (doneCount === totalCorrect - 1) api.bubble('¡Solo falta uno! ¡Tú puedes!', 'happy', 2400);
      }
      G.setTimeout(function () {
        if (item.el) item.el.classList.add('is-gone');
      }, 300);
    }

    function handleItem(item, ev) {
      if (item.done || api.isFinished() || api.isPaused()) return;
      if (rightButton) {
        if (ev.button !== 2) {
          api.bubble('Este reto se juega con el botón derecho del mouse. 🖱️', 'idle', 3000);
          return;
        }
      } else if (ev.button !== 0) {
        return;
      }
      const guided = guidedRemaining > 0 && item.correct;
      if (guided) {
        const need = p.dwellFirst || 320;
        const held = hovered === item ? tick() - hoverAt : 0;
        if (held < need) {
          api.bubble('Primero pon la flecha encima del objetivo y después haz clic.', 'idle', 3200);
          item.el.classList.add('is-waiting');
          G.setTimeout(function () { item.el.classList.remove('is-waiting'); }, 700);
          return;
        }
      }
      if (item.correct) {
        completeItem(item);
      } else {
        api.click(false);
        api.sfx('wrong');
        markWrong(item);
        wrongStreak += 1;
        const msg = item.avoid
          ? '¡Cuidado! No toques ' + item.label + '.'
          : '¡Casi! Ese no es ' + (p.label || 'el objetivo') + '.';
        gentleWrong(msg);
        if (wrongStreak >= 3) {
          wrongStreak = 0;
          api.bubble('Fíjate bien: ' + (p.label ? 'busca ' + p.label + '.' : 'mira el objetivo que brilla.'), 'idle', 3000);
        }
      }
    }

    function handleBackground(ev) {
      if (rightButton && ev.button !== 2) return;
      if (!rightButton && ev.button !== 0) return;
      if (guidedRemaining > 0) {
        const next = items.filter(function (i) { return i.correct && !i.done && i.el; })[0];
        api.bubble('Mueve la flecha hasta ' + (next ? next.label : 'el objetivo') + ' y luego haz un clic.', 'idle', 3000);
        return;
      }
      if (p.missCounts === false) return;
      api.click(false);
      api.sfx('wrong');
      const msg = rightButton ? 'Prueba otra vez, con el botón derecho.' : 'Toca justo el objetivo, no el fondo.';
      gentleWrong(msg);
      const cx = ev.clientX - stage.getBoundingClientRect().left;
      const cy = ev.clientY - stage.getBoundingClientRect().top;
      api.effect('spark', cx, cy, 3);
    }

    function onPointerDown(ev) {
      if (api.isPaused() || api.isFinished()) return;
      const el = itemFromEvent(ev);
      if (el) {
        const item = itemByEl(el);
        if (item) handleItem(item, ev);
      } else {
        handleBackground(ev);
      }
      if (guidedRemaining > 0) {
        const next = items.filter(function (i) { return i.correct && !i.done && i.el; })[0];
        if (next) {
          api.bubble('Mueve la flecha hasta ' + next.label + ' y luego haz un clic.', 'idle', 3000);
        }
      }
    }

    function onOver(ev) {
      const el = itemFromEvent(ev);
      if (!el) return;
      const item = itemByEl(el);
      if (!item) return;
      if (hovered !== item) {
        hovered = item;
        hoverAt = tick();
        if (item.correct) api.sfx('hover');
      }
    }
    function onOut(ev) {
      const el = itemFromEvent(ev);
      if (!el) return;
      const item = itemByEl(el);
      if (item && hovered === item) hovered = null;
    }

    layer.addEventListener('pointerdown', onPointerDown);
    layer.addEventListener('pointerover', onOver);
    layer.addEventListener('pointerout', onOut);

    /* ---------- movimiento ---------- */
    function update(dt) {
      if (api.isPaused() || api.isFinished()) return;
      const ease = api.assist() ? 0.55 : 1;
      items.forEach(function (item) {
        if (!item.el || item.done || (!item.vx && !item.vy)) return;
        item.x += item.vx * dt * ease;
        item.y += item.vy * dt * ease;
        const half = (item.size || 60) / 2 + 6;
        if (item.x < half) { item.x = half; item.vx = Math.abs(item.vx); }
        if (item.x > width - half) { item.x = width - half; item.vx = -Math.abs(item.vx); }
        if (item.y < half) { item.y = half; item.vy = Math.abs(item.vy); }
        if (item.y > height - half) { item.y = height - half; item.vy = -Math.abs(item.vy); }
        item.el.style.left = item.x + 'px';
        item.el.style.top = item.y + 'px';
      });
    }

    function hint() {
      const target = correctItems.filter(function (i) { return !i.done && i.el; })[0] || correctItems[0];
      if (target && target.el) {
        api.arrowTo(target.el);
        target.el.classList.add('is-pulsing');
        G.setTimeout(function () { if (target.el) target.el.classList.remove('is-pulsing'); }, 3000);
        api.sfx('hover');
      }
      if (rightButton) return 'Pon la flecha sobre el objetivo y presiona el botón derecho una vez.';
      if (p.sleeping) return 'Toca al animal dormido con un solo clic para despertarlo.';
      if (p.avoidDecoys) return 'Toca solo los objetivos correctos. ¡Cuidado con los que no van!';
      return 'Pon la flecha encima de ' + (p.label || 'el objetivo') + ' y haz un clic suave.';
    }

    /* ---------- tamaño de ventana ---------- */
    function onResize() {
      const r = stage.getBoundingClientRect();
      if (!width || !height) return;
      const sx = r.width / width, sy = r.height / height;
      if (Math.abs(sx - 1) < 0.05 && Math.abs(sy - 1) < 0.05) return;
      width = r.width; height = r.height;
      items.forEach(function (item) {
        if (!item.el) return;
        item.x = U.clamp(item.x * sx, 40, width - 40);
        item.y = U.clamp(item.y * sy, 40, height - 40);
        item.el.style.left = item.x + 'px';
        item.el.style.top = item.y + 'px';
      });
    }
    const onResizeDebounced = U.debounce(onResize, 160);
    G.addEventListener('resize', onResizeDebounced);

    return {
      update: update,
      hint: hint,
      destroy: function () {
        destroyed = true;
        if (completionTimer) G.clearTimeout(completionTimer);
        layer.removeEventListener('pointerdown', onPointerDown);
        layer.removeEventListener('pointerover', onOver);
        layer.removeEventListener('pointerout', onOut);
      }
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
