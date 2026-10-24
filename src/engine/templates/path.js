/* Plantilla: RUTAS Y LABERINTOS — seguir un camino con el cursor.
   Tolera pequeñas desviaciones y nunca reinicia el nivel: el avance se
   conserva y se puede volver a entrar al camino por el punto más cercano. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  MA.Templates.register('path', function (ctx) {
    const p = ctx.params || {};
    const api = ctx.api;
    const layer = ctx.layer;
    const stage = ctx.stage;
    const level = ctx.level;
    const scenario = MA.Paths.build(p, level.id + '-' + (api.metrics.stageIndex || 0));
    const ringTotal = scenario.rings.length;
    const totalSamples = scenario.points.length;
    let board, svg;
    let tolV = 26;
    let boardRect = { left: 0, top: 0, width: 800, height: 480 };
    let progressIndex = 0;
    let maxIndex = 0;
    let inside = true;
    let wasInside = true;
    let hasEntered = false;
    let offTimer = 0;
    let ringGot = 0;
    let completed = false;
    let completionTimer = null;
    let destroyed = false;
    let offCounted = false;
    let lastWarn = 0;
    let started = false;
    let boardScale = 1;
    let cursorEl, ballG, progressFill, guideEl;
    let markerMatrix = {};

    api.setTotal(ringTotal || 1);
    api.progress(0, ringTotal || 1);
    api.setStageInfo(api.metrics.stageIndex || 0, api.metrics.stageTotal || 0, scenario.allowedDeviations);

    const roadWidth = scenario.kind === 'maze'
      ? Math.min(scenario.cellW, scenario.cellH) * 0.8
      : Math.max(54, (p.tolerance || 36) * 2.1);

    /* ---------- construcción del SVG ---------- */
    function buildBoard() {
      board = U.el('div', { class: 'path-board', 'data-path-board': '1' });
      const walls = scenario.walls.map(function (w) {
        return '<line class="path-wall" x1="' + w.x1.toFixed(1) + '" y1="' + w.y1.toFixed(1) +
          '" x2="' + w.x2.toFixed(1) + '" y2="' + w.y2.toFixed(1) + '" stroke-width="' + Math.max(8, Math.min(scenario.cellW, scenario.cellH) * 0.12).toFixed(1) + '"/>';
      }).join('');
      const rings = scenario.rings.map(function (r, i) {
        return '<g class="path-ring" data-ring="' + i + '" transform="translate(' + r.x.toFixed(1) + ',' + r.y.toFixed(1) + ')">' +
          '<circle r="34" class="path-ring__halo"/>' +
          '<text class="path-ring__star" y="13" text-anchor="middle">⭐</text></g>';
      }).join('');
      const startLabel = scenario.kind === 'maze' ? 'SALIDA' : 'SALIDA';
      board.innerHTML =
        '<svg class="path-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Camino por seguir">' +
        '<path class="path-road" d="' + scenario.d + '" fill="none" stroke-width="' + roadWidth.toFixed(1) + '"/>' +
        '<path class="path-dash" d="' + scenario.d + '" fill="none" stroke-width="3" stroke-dasharray="2 18"/>' +
        walls +
        rings +
        '<g class="path-start" transform="translate(' + scenario.start.x.toFixed(1) + ',' + scenario.start.y.toFixed(1) + ')">' +
        '<circle r="26" class="path-start__circle"/><text y="8" text-anchor="middle" class="path-start__text">🚩</text></g>' +
        '<g class="path-goal" transform="translate(' + scenario.goal.x.toFixed(1) + ',' + scenario.goal.y.toFixed(1) + ')">' +
        '<circle r="30" class="path-goal__circle"/><text y="10" text-anchor="middle" class="path-goal__text">🏁</text></g>' +
        '<g class="path-ball" data-ball="1" transform="translate(' + scenario.start.x.toFixed(1) + ',' + scenario.start.y.toFixed(1) + ')">' +
        '<circle r="19" class="path-ball__circle"/><text y="8" text-anchor="middle" class="path-ball__emoji">' + (p.ballEmoji || '🔵') + '</text></g>' +
        '<g class="path-guide" aria-hidden="true"><path d="' + scenario.d + '" fill="none" stroke-width="6" stroke-dasharray="10 14"/></g>' +
        '</svg>' +
        '<div class="path-progress" aria-hidden="true"><i></i></div>' +
        '<div class="path-cursor" aria-hidden="true"></div>' +
        '<div class="path-label path-label--start">' + startLabel + '</div>' +
        '<div class="path-label path-label--goal">META</div>';
      layer.appendChild(board);

      svg = board.querySelector('svg');
      cursorEl = board.querySelector('.path-cursor');
      ballG = board.querySelector('.path-ball');
      progressFill = board.querySelector('.path-progress i');
      guideEl = board.querySelector('.path-guide');

      const startLabelEl = board.querySelector('.path-label--start');
      const goalLabelEl = board.querySelector('.path-label--goal');
      positionLabel(startLabelEl, scenario.start, -44);
      positionLabel(goalLabelEl, scenario.goal, -44);
    }

    function positionLabel(el, pt, dy) {
      if (!el) return;
      el.style.left = (pt.x / 1000 * 100) + '%';
      el.style.top = (pt.y / 600 * 100) + '%';
      el.style.transform = 'translate(-50%, ' + dy + 'px)';
    }

    function layoutBoard() {
      const r = stage.getBoundingClientRect();
      const availW = Math.max(240, r.width - 22);
      const availH = Math.max(160, r.height - 22);
      let w = Math.min(availW, availH * (5 / 3));
      let h = w * 3 / 5;
      if (h > availH) { h = availH; w = h * 5 / 3; }
      board.style.width = w + 'px';
      board.style.height = h + 'px';
      board.style.left = ((r.width - w) / 2) + 'px';
      board.style.top = ((r.height - h) / 2) + 'px';
      boardRect = board.getBoundingClientRect();
      tolV = MA.Paths.toleranceVirtual(p, scenario, w);
      boardScale = w / 1000;
    }

    /* ---------- eventos ---------- */
    function toVirtual(ev) {
      const r = board.getBoundingClientRect();
      boardRect = r;
      return {
        x: (ev.clientX - r.left) / Math.max(1, r.width) * 1000,
        y: (ev.clientY - r.top) / Math.max(1, r.height) * 600,
        px: ev.clientX - r.left,
        py: ev.clientY - r.top
      };
    }

    function moveBallTo(index) {
      const pt = scenario.points[U.clamp(index, 0, totalSamples - 1)];
      const rot = index * 0.10;
      ballG.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ') rotate(' + (p.mode === 'ball' ? rot.toFixed(0) : 0) + ')');
    }

    function updateProgressBar() {
      const pct = totalSamples > 1 ? (maxIndex / (totalSamples - 1)) * 100 : 0;
      if (progressFill) progressFill.style.width = pct.toFixed(1) + '%';
    }

    function collectRingsUpTo(index) {
      scenario.rings.forEach(function (ring, i) {
        if (ring.got) return;
        if (index >= ring.index - 1) {
          ring.got = true;
          ringGot += 1;
          const g = svg.querySelector('[data-ring="' + i + '"]');
          if (g) g.classList.add('is-got');
          api.ring(ringGot, ringTotal);
          api.progress(ringGot, ringTotal);
          api.sfx('star');
          api.bubble('¡Estrella del camino! Llevas ' + ringGot + ' de ' + ringTotal + '.', 'happy', 1900);
        }
      });
    }

    function onMove(ev) {
      if (api.isPaused() || api.isFinished() || completed) return;
      const pt = toVirtual(ev);
      if (cursorEl) {
        cursorEl.style.left = pt.px + 'px';
        cursorEl.style.top = pt.py + 'px';
        cursorEl.classList.remove('is-hidden');
      }
      if (!started) {
        started = true;
        api.sfx('hover');
      }

      const searchFrom = Math.max(0, progressIndex - 40);
      const searchTo = Math.min(totalSamples - 1, progressIndex + 140);
      const windowPts = scenario.points.slice(searchFrom, searchTo + 1);
      let hit = MA.Paths.distanceToPolyline(pt.x, pt.y, windowPts);
      let hitIndex = hit.index + searchFrom;
      let allowed = tolV * (api.assist() ? 1.45 : 1);
      if (hit.dist > allowed) {
        const full = MA.Paths.distanceToPolyline(pt.x, pt.y, scenario.points);
        if (full.dist < allowed) {
          hit = full;
          hitIndex = full.index;
        }
      }

      const isInside = hit.dist <= allowed;
      if (isInside) {
        inside = true;
        hasEntered = true;
        offTimer = 0;
        offCounted = false;
        if (!wasInside) {
          api.bubble('¡Muy bien! Volviste al camino. Sigue así.', 'happy', 2200);
          api.sfx('success');
        }
        wasInside = true;
        progressIndex = hitIndex;
        if (hitIndex > maxIndex) {
          maxIndex = hitIndex;
          moveBallTo(maxIndex);
          updateProgressBar();
          collectRingsUpTo(maxIndex);
        }
        board.classList.remove('is-off');
        if (maxIndex >= totalSamples - 3) finishPath();
      } else {
        inside = false;
        if (wasInside) {
          wasInside = false;
          if (hasEntered && !offCounted) {
            offCounted = true;
            api.deviation();
          }
          board.classList.add('is-off');
          const now = G.performance.now();
          if (now - lastWarn > 3500) {
            lastWarn = now;
            api.bubble('Te saliste un poquito del camino. Vuelve cuando quieras: no pierdes nada.', 'idle', 3000);
          }
        }
      }
    }

    function finishPath() {
      if (completed) return;
      completed = true;
      if (ringTotal && ringGot < ringTotal) {
        // Por seguridad: si llega a la meta, recoge las estrellas pendientes.
        scenario.rings.forEach(function (ring, i) {
          if (!ring.got) {
            ring.got = true; ringGot += 1;
            const g = svg.querySelector('[data-ring="' + i + '"]');
            if (g) g.classList.add('is-got');
          }
        });
        api.ring(ringGot, ringTotal);
        api.progress(ringGot, ringTotal);
      }
      if (!ringTotal) {
        api.target();
        api.progress(1, 1);
      }
      board.classList.add('is-finished');
      api.sfx('celebrate');
      api.effect('celebrate', boardRect.width / 2, boardRect.height / 2, 22);
      api.bubble(ringTotal ? '¡Llegaste a la meta con ' + ringGot + ' estrellas!' : '¡Llegaste a la meta! ¡Excelente!', 'cheer', 3200);
      completionTimer = G.setTimeout(function () { if (!destroyed) api.complete(); }, 950);
    }

    function onLeave() {
      if (cursorEl) cursorEl.classList.add('is-hidden');
    }
    function onEnter() {
      if (cursorEl) cursorEl.classList.remove('is-hidden');
    }

    buildBoard();
    G.requestAnimationFrame(function () { layoutBoard(); moveBallTo(0); });
    G.requestAnimationFrame(function () { G.requestAnimationFrame(function () { layoutBoard(); moveBallTo(0); }); });

    board.addEventListener('pointermove', onMove);
    board.addEventListener('pointerleave', onLeave);
    board.addEventListener('pointerenter', onEnter);

    /* ---------- bucle ---------- */
    function update(dt) {
      if (api.isPaused() || api.isFinished()) return;
      if (!inside) {
        offTimer += dt;
        if (offTimer > 1.4) {
          board.classList.add('is-guiding');
          if (guideEl) guideEl.classList.add('is-visible');
        }
      } else if (guideEl && !api.assist()) {
        guideEl.classList.remove('is-visible');
        board.classList.remove('is-guiding');
      }
      if (api.assist() && guideEl) guideEl.classList.add('is-visible');
    }

    function hint() {
      if (guideEl) guideEl.classList.add('is-visible');
      board.classList.add('is-guiding', 'is-assisted');
      const remaining = scenario.rings.filter(function (r) { return !r.got; });
      let text = 'Avanza despacio por el camino iluminado. Si te sales, puedes volver a entrar.';
      if (remaining.length) {
        text = 'Sigue la línea y pasa por las estrellas. Te faltan ' + remaining.length + '.';
      }
      const pt = scenario.points[U.clamp(maxIndex + 25, 0, totalSamples - 1)];
      api.arrowTo({ x: pt.x * boardScale + parseFloat(board.style.left || 0), y: pt.y * boardScale + parseFloat(board.style.top || 0) });
      api.sfx('hover');
      return text;
    }

    const resizeHandler = U.debounce(function () {
      if (!destroyed && board) layoutBoard();
    }, 150);
    G.addEventListener('resize', resizeHandler);

    return {
      update: update,
      hint: hint,
      destroy: function () {
        destroyed = true;
        if (completionTimer) G.clearTimeout(completionTimer);
        board.removeEventListener('pointermove', onMove);
        board.removeEventListener('pointerleave', onLeave);
        board.removeEventListener('pointerenter', onEnter);
      },
      /** Puntos del camino para pruebas automáticas. */
      debugPath: function () {
        return {
          points: scenario.points, start: scenario.start, goal: scenario.goal,
          board: board.getBoundingClientRect(), tolerance: tolV, kind: scenario.kind
        };
      }
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
