/* Plantilla: MOVER — llevar el cursor a zonas u objetos, sin hacer clic.
   Variantes: objetos quietos, en orden, con movimiento lento y "llevar a un
   amigo" (la mariposa sigue al cursor hasta las flores). */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  MA.Templates.register('move', function (ctx) {
    const p = ctx.params || {};
    const api = ctx.api;
    const layer = ctx.layer;
    const stage = ctx.stage;
    const level = ctx.level;
    const count = Math.max(1, p.count || 4);
    const visibleMax = Math.max(1, Math.min(count, p.countVisible || count));
    const scale = ctx.sizeScale();
    const baseSize = Math.max(58, (p.size || 100) * scale);
    const endSize = p.sizeEnd ? Math.max(46, p.sizeEnd * scale) : baseSize;
    const ordered = !!p.order;
    const emojis = p.emojis && p.emojis.length ? p.emojis : [p.emoji || '⭐'];
    const dwellBase = p.dwell || 0;
    const carry = !!p.carry;
    const motion = p.motion || 0;

    let rect = ctx.stageRect();
    let width = rect.width;
    let height = rect.height;
    let targets = [];
    let nextToSpawn = 0;
    let doneCount = 0;
    let expected = 0;
    let hovered = null;
    let hoverStart = 0;
    let cursor = { x: width / 2, y: height / 2 };
    let follower = null;
    let cursorRing = null;
    let completionTimer = null;
    let destroyed = false;
    let hintCooldown = 0;
    let idealTotal = 0;
    let lastHintAt = 0;

    const rand = function (a, b) { return a + Math.random() * (b - a); };

    function sizeFor(i) {
      if (count <= 1) return baseSize;
      return baseSize + (endSize - baseSize) * (i / (count - 1));
    }

    /* ---------- distribución de posiciones ---------- */
    function layoutPositions() {
      const margin = baseSize * 0.62 + 16;
      const minX = margin, maxX = Math.max(margin + 1, width - margin);
      const minY = margin * 0.8, maxY = Math.max(margin + 1, height - margin);
      const mode = p.layout || 'random';
      const pts = [];
      if (mode === 'corners') {
        const ins = baseSize * 0.75;
        const corners = [
          { x: ins, y: ins }, { x: width - ins, y: ins },
          { x: ins, y: height - ins }, { x: width - ins, y: height - ins }
        ];
        const mids = [
          { x: width / 2, y: ins }, { x: width / 2, y: height - ins },
          { x: ins, y: height / 2 }, { x: width - ins, y: height / 2 }
        ];
        const all = Math.random() < 0.5 ? corners.concat(mids) : mids.concat(corners);
        for (let i = 0; i < count; i++) pts.push(all[i % all.length]);
        return pts;
      }
      if (mode === 'edges') {
        const ring = [];
        const n = Math.max(4, count);
        for (let i = 0; i < n; i++) {
          const t = i / n;
          if (t < 0.25) ring.push({ x: margin + (width - 2 * margin) * (t / 0.25), y: margin });
          else if (t < 0.5) ring.push({ x: width - margin, y: margin + (height - 2 * margin) * ((t - 0.25) / 0.25) });
          else if (t < 0.75) ring.push({ x: width - margin - (width - 2 * margin) * ((t - 0.5) / 0.25), y: height - margin });
          else ring.push({ x: margin, y: height - margin - (height - 2 * margin) * ((t - 0.75) / 0.25) });
        }
        return ring.slice(0, count);
      }
      if (mode === 'row') {
        const usable = width - 2 * margin;
        const step = count > 1 ? usable / (count - 1) : 0;
        for (let i = 0; i < count; i++) pts.push({ x: margin + step * i, y: height * (0.42 + (i % 2) * 0.14) });
        return pts;
      }
      if (mode === 'grid') {
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const cellW = (width - 2 * margin) / Math.max(1, cols - 1 || 1);
        const cellH = (height - 2 * margin) / Math.max(1, rows - 1 || 1);
        for (let i = 0; i < count; i++) {
          const c = i % cols, r = Math.floor(i / cols);
          pts.push({ x: cols === 1 ? width / 2 : margin + cellW * c, y: rows === 1 ? height / 2 : margin + cellH * r });
        }
        return pts;
      }
      if (mode === 'ring') {
        const cx = width / 2, cy = height / 2;
        const radius = Math.min(width, height) * 0.34;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 - Math.PI / 2;
          pts.push({ x: cx + Math.cos(a) * radius * (width / height > 1.4 ? 1.25 : 1), y: cy + Math.sin(a) * radius });
        }
        return pts;
      }
      if (mode === 'center') {
        pts.push({ x: width / 2, y: height / 2 });
        for (let i = 1; i < count; i++) pts.push({ x: width / 2 + rand(-40, 40), y: height / 2 + rand(-30, 30) });
        return pts;
      }
      if (mode === 'cluster') {
        const clusters = Math.min(3, Math.max(1, Math.round(count / 3)));
        const centers = [];
        for (let i = 0; i < clusters; i++) {
          centers.push({ x: rand(margin + 40, width - margin - 40), y: rand(minY + 30, maxY - 30) });
        }
        for (let i = 0; i < count; i++) {
          const c = centers[i % clusters];
          pts.push({
            x: U.clamp(c.x + rand(-width * 0.12, width * 0.12), minX, maxX),
            y: U.clamp(c.y + rand(-height * 0.14, height * 0.14), minY, maxY)
          });
        }
        return pts;
      }
      /* random con separación mínima */
      for (let i = 0; i < count; i++) {
        let best = null, bestGap = -Infinity;
        for (let k = 0; k < 120; k++) {
          const candidate = { x: rand(minX, maxX), y: rand(minY, maxY) };
          let gap = Infinity;
          pts.forEach(function (q) { gap = Math.min(gap, U.dist(candidate.x, candidate.y, q.x, q.y)); });
          if (gap > bestGap) { bestGap = gap; best = candidate; }
          if (gap > Math.max(76, baseSize * 1.05)) break;
        }
        pts.push(best);
      }
      return pts;
    }

    const positions = layoutPositions();
    let ideal = 0;
    for (let i = 1; i < positions.length; i++) ideal += U.distPoint(positions[i - 1], positions[i]);
    idealTotal = ideal;
    api.metrics.ideal = Math.round(idealTotal);

    /* ---------- elementos ---------- */
    function makeTarget(i) {
      const size = sizeFor(i);
      const pos = positions[i];
      const el = U.el('div', {
        class: 'target target--' + (p.style || 'zone') + ' target--move' + (ordered ? ' target--ordered' : ''),
        'data-hit': String(i + 1),
        'data-order': String(i + 1),
        role: 'img',
        'aria-label': (ordered ? 'Objetivo número ' + (i + 1) + '. ' : '') + (p.label || 'Objetivo'),
        style: {
          width: size + 'px', height: size + 'px',
          left: pos.x + 'px', top: pos.y + 'px',
          '--dwell': '0'
        }
      });
      const ring = U.el('span', { class: 'target__ring', 'aria-hidden': 'true' });
      const emoji = U.el('span', { class: 'target__emoji', text: emojis[i % emojis.length] });
      emoji.style.fontSize = Math.round(size * 0.52) + 'px';
      el.appendChild(ring);
      el.appendChild(emoji);
      if (ordered && p.labels !== false) {
        const label = U.el('span', { class: 'target__label', text: String(i + 1) });
        el.appendChild(label);
      }
      const target = {
        i: i, el: el, size: size, x: pos.x, y: pos.y,
        done: false, dwellStart: 0, vx: 0, vy: 0, hovered: false
      };
      if (motion) {
        const a = Math.random() * Math.PI * 2;
        target.vx = Math.cos(a) * motion * scale;
        target.vy = Math.sin(a) * motion * 0.7 * scale;
      }
      layer.appendChild(el);
      return target;
    }

    function spawnSome() {
      while (nextToSpawn < count && targets.filter(function (t) { return !t.done; }).length < visibleMax) {
        targets.push(makeTarget(nextToSpawn));
        nextToSpawn++;
      }
    }

    if (carry) {
      follower = U.el('div', { class: 'move-follower', 'aria-hidden': 'true' });
      follower.innerHTML = '<span>' + (p.carryEmoji || '🦋') + '</span>';
      follower.style.left = width / 2 + 'px';
      follower.style.top = height / 2 + 'px';
      layer.appendChild(follower);
    } else {
      cursorRing = U.el('div', { class: 'cursor-ring is-hidden', 'aria-hidden': 'true' });
      layer.appendChild(cursorRing);
    }

    /* invitación inicial */
    const intro = U.el('div', { class: 'stage-tip', html: '<span>' + (p.carry ? (p.carryEmoji || '🦋') : '👆') + '</span> ' + U.esc(p.tipText || 'Mueve el mouse hasta los objetivos') });
    layer.appendChild(intro);
    G.setTimeout(function () { intro.classList.add('is-hidden'); }, 3600);

    api.setTotal(count);
    api.progress(0, count);
    spawnSome();

    function localPoint(ev) {
      const r = stage.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }

    function activeTargets() { return targets.filter(function (t) { return !t.done; }); }

    function hitTest(pt) {
      const list = activeTargets();
      const base = stage.getBoundingClientRect();
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        const r = t.el.getBoundingClientRect();
        const cx = r.left - base.left + r.width / 2;
        const cy = r.top - base.top + r.height / 2;
        const rad = Math.max(28, r.width / 2);
        if (U.dist(pt.x, pt.y, cx, cy) <= rad) return t;
      }
      return null;
    }

    function completeTarget(t) {
      if (t.done) return;
      if (ordered && t.i !== expected) {
        if (hintCooldown <= 0) {
          api.bubble('Primero busca el número ' + (expected + 1) + '.', 'idle', 2400);
          hintCooldown = 2;
        }
        return;
      }
      t.done = true;
      t.el.classList.add('is-done');
      t.el.setAttribute('data-done', 'true');
      const r = t.el.getBoundingClientRect();
      const base = stage.getBoundingClientRect();
      const cx = r.left - base.left + r.width / 2;
      const cy = r.top - base.top + r.height / 2;
      api.effect(p.style === 'flower' ? 'star' : 'spark', cx, cy, 6);
      api.sfx(p.carry ? 'success' : 'pop');
      api.target();
      doneCount += 1;
      api.progress(doneCount, count);
      if (ordered) expected += 1;
      G.setTimeout(function () { t.el.classList.add('is-gone'); }, 260);
      spawnSome();
      if (doneCount >= count) {
        api.sfx('celebrate');
        api.effect('celebrate', width / 2, height * 0.42, 22);
        if (follower) follower.classList.add('is-cheering');
        completionTimer = G.setTimeout(function () { if (!destroyed) api.complete(); }, 700);
      } else if (doneCount === count - 1) {
        api.bubble('¡Casi terminas! Solo falta uno.', 'happy', 2600);
      }
    }

    function onMove(ev) {
      if (api.isPaused() || api.isFinished()) return;
      cursor = localPoint(ev);
      if (follower) {
        const tx = cursor.x, ty = cursor.y - 6;
        follower.style.left = U.lerp(parseFloat(follower.style.left) || width / 2, tx, 0.22) + 'px';
        follower.style.top = U.lerp(parseFloat(follower.style.top) || height / 2, ty, 0.22) + 'px';
      }
      if (cursorRing) {
        cursorRing.style.transform = 'translate(' + (cursor.x - 22) + 'px,' + (cursor.y - 22) + 'px)';
      }
      updateHover();
    }

    function onLeave() {
      if (cursorRing) cursorRing.classList.add('is-hidden');
    }
    function onEnter() {
      if (cursorRing) cursorRing.classList.remove('is-hidden');
    }

    function updateHover() {
      let pt = cursor;
      if (follower) {
        pt = { x: parseFloat(follower.style.left) || cursor.x, y: parseFloat(follower.style.top) || cursor.y };
      }
      const hit = hitTest(pt);
      if (hit !== hovered) {
        activeTargets().forEach(function (t) { t.hovered = false; t.el.classList.remove('is-hovered'); t.dwellStart = 0; t.el.style.setProperty('--dwell', '0'); });
        hovered = hit;
        if (hit) {
          hit.hovered = true;
          hit.el.classList.add('is-hovered');
          hoverStart = G.performance.now();
          if (dwellBase === 0) {
            completeTarget(hit);
          } else {
            api.sfx('hover');
          }
        }
      }
      if (hit && dwellBase > 0) {
        const need = dwellBase * (api.assist() ? 0.65 : 1);
        const held = G.performance.now() - hoverStart;
        hit.el.style.setProperty('--dwell', U.clamp01(held / need).toFixed(2));
        if (held >= need) {
          completeTarget(hit);
          hovered = null;
        }
      }
    }

    function update(dt) {
      if (hintCooldown > 0) hintCooldown -= dt;
      if (api.isPaused() || api.isFinished()) return;
      const easing = api.assist() ? 0.5 : 1;
      targets.forEach(function (t) {
        if (t.done || !motion) return;
        t.x += t.vx * dt * easing;
        t.y += t.vy * dt * easing;
        const half = t.size / 2 + 4;
        if (t.x < half) { t.x = half; t.vx = Math.abs(t.vx); }
        if (t.x > width - half) { t.x = width - half; t.vx = -Math.abs(t.vx); }
        if (t.y < half) { t.y = half; t.vy = Math.abs(t.vy); }
        if (t.y > height - half) { t.y = height - half; t.vy = -Math.abs(t.vy); }
        t.el.style.left = t.x + 'px';
        t.el.style.top = t.y + 'px';
      });
      if (follower) {
        updateHover();
      }
    }

    function hint() {
      const list = activeTargets();
      const t = (ordered ? list.filter(function (x) { return x.i === expected; })[0] : list[0]) || null;
      if (t) {
        api.arrowTo(t.el);
        t.el.classList.add('is-pulsing');
        G.setTimeout(function () { t.el.classList.remove('is-pulsing'); }, 3200);
        api.sfx('hover');
      }
      if (p.carry) return 'Mueve el mouse despacio: la mariposa vuela cerquita de la flecha.';
      return 'Lleva la flecha hasta el objetivo que brilla. No hace falta hacer clic.';
    }

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    stage.addEventListener('pointerenter', onEnter);
    lastHintAt = G.performance.now();

    function onResize() {
      const r = stage.getBoundingClientRect();
      const sx = r.width / Math.max(1, width);
      const sy = r.height / Math.max(1, height);
      if (Math.abs(sx - 1) < 0.06 && Math.abs(sy - 1) < 0.06) return;
      width = r.width; height = r.height;
      targets.forEach(function (t) {
        t.x *= sx; t.y *= sy;
        t.el.style.left = t.x + 'px';
        t.el.style.top = t.y + 'px';
      });
    }
    G.addEventListener('resize', U.debounce(onResize, 140));

    return {
      update: update,
      hint: hint,
      destroy: function () {
        destroyed = true;
        if (completionTimer) G.clearTimeout(completionTimer);
        stage.removeEventListener('pointermove', onMove);
        stage.removeEventListener('pointerleave', onLeave);
        stage.removeEventListener('pointerenter', onEnter);
      }
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
