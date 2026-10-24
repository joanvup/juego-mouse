/* =========================================================================
   Mouse Aventura — tutorial interactivo
   Antes de una mecánica nueva, el niño practica en un espacio pequeño.
   Se puede repetir cuantas veces quiera o saltar sin perder nada.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  const KIND_LABEL = {
    move: { title: 'Mueve el mouse', highlight: 'wheel' },
    click: { title: 'Haz un clic', highlight: 'left' },
    drag: { title: 'Arrastra y suelta', highlight: 'left' },
    path: { title: 'Sigue el camino', highlight: 'left' },
    wheel: { title: 'La rueda del mouse', highlight: 'wheel' },
    rightclick: { title: 'El botón derecho', highlight: 'right' }
  };

  function practiceFor(kind, area, statusEl, onSuccess) {
    let cleanup = function () {};
    let succeeded = false;
    const done = function (message) {
      if (succeeded) return;
      succeeded = true;
      area.classList.add('is-success');
      statusEl.textContent = message || '¡Muy bien! Lo lograste.';
      statusEl.classList.add('is-ok');
      MA.Audio.play('celebrate');
      onSuccess();
    };
    const setStatus = function (t) { statusEl.textContent = t; };
    const rectOf = function (el) { return el.getBoundingClientRect(); };

    if (kind === 'move' || kind === 'click' || kind === 'rightclick') {
      const right = kind === 'rightclick';
      area.innerHTML = '';
      const target = U.el('div', { class: 'practice-target', 'data-practice': 'target', role: 'button', 'aria-label': 'Estrella de práctica' });
      target.innerHTML = '<span>⭐</span>';
      target.style.left = '62%';
      target.style.top = '46%';
      area.appendChild(target);
      let hoveredAt = 0;
      let raf = 0;
      const ring = U.el('span', { class: 'practice-target__ring' });
      target.appendChild(ring);
      setStatus(kind === 'click' ? 'Paso 1: mueve la flecha hasta la estrella.' :
        right ? 'Paso 1: mueve la flecha hasta la estrella.' : 'Mueve la flecha hasta la estrella y espera.');

      function onOver() {
        hoveredAt = G.performance.now();
        if (!succeeded) {
          setStatus(kind === 'click' ? '¡Ahora haz un clic suave!' :
            right ? '¡Ahora presiona el botón derecho!' : 'Quédate un momento sobre la estrella…');
        }
      }
      function onOut() { hoveredAt = 0; ring.style.setProperty('--p', '0'); }
      function frame() {
        if (succeeded) return;
        if (hoveredAt) {
          const held = G.performance.now() - hoveredAt;
          const dwell = U.clamp01(held / 650);
          ring.style.setProperty('--p', dwell.toFixed(2));
          if (kind === 'move' && dwell >= 1) done('¡Muy bien! Ya sabes mover el mouse.');
        }
        raf = G.requestAnimationFrame(frame);
      }
      function onDown(ev) {
        if (right) {
          if (ev.button !== 2) {
            setStatus('Ese es el botón izquierdo. Prueba con el de la derecha.');
            return;
          }
        } else if (ev.button !== 0) {
          return;
        }
        if (!hoveredAt) {
          setStatus('Primero lleva la flecha encima de la estrella.');
          return;
        }
        done(kind === 'click' ? '¡Perfecto! Un clic y listo.' : right ? '¡Excelente! Ese es el botón derecho.' : '¡Muy bien!');
      }
      const onCtx = function (ev) { ev.preventDefault(); };
      target.addEventListener('pointerenter', onOver);
      target.addEventListener('pointerleave', onOut);
      area.addEventListener('pointerdown', onDown);
      area.addEventListener('contextmenu', onCtx);
      raf = G.requestAnimationFrame(frame);
      cleanup = function () {
        G.cancelAnimationFrame(raf);
        target.removeEventListener('pointerenter', onOver);
        target.removeEventListener('pointerleave', onOut);
        area.removeEventListener('pointerdown', onDown);
        area.removeEventListener('contextmenu', onCtx);
      };
      return cleanup;
    }

    if (kind === 'drag') {
      area.innerHTML = '';
      const piece = U.el('div', { class: 'practice-piece', 'data-practice': 'piece', role: 'button', 'aria-label': 'Estrella para arrastrar' });
      piece.innerHTML = '<span>⭐</span>';
      piece.style.left = '14%';
      piece.style.top = '58%';
      const zone = U.el('div', { class: 'practice-zone', 'data-practice': 'zone' });
      zone.innerHTML = '<span>🧺</span><small>Aquí</small>';
      zone.style.left = '66%';
      zone.style.top = '46%';
      area.appendChild(piece);
      area.appendChild(zone);
      setStatus('Paso 1: pon la flecha sobre la estrella.');
      let dragging = false;
      const offset = { x: 0, y: 0 };
      function down(ev) {
        if (ev.button !== 0) return;
        const r = rectOf(piece);
        dragging = true;
        offset.x = ev.clientX - r.left;
        offset.y = ev.clientY - r.top;
        piece.classList.add('is-dragging');
        setStatus('Paso 2: mantén presionado y mueve la estrella a la canasta.');
        ev.preventDefault();
      }
      function move(ev) {
        if (!dragging) return;
        const ar = rectOf(area);
        piece.style.left = (ev.clientX - ar.left - offset.x) + 'px';
        piece.style.top = (ev.clientY - ar.top - offset.y) + 'px';
        piece.style.transform = 'none';
        const zr = rectOf(zone);
        const hit = ev.clientX > zr.left - 20 && ev.clientX < zr.right + 20 && ev.clientY > zr.top - 20 && ev.clientY < zr.bottom + 20;
        zone.classList.toggle('is-near', hit);
        if (hit) setStatus('Paso 3: ¡suelta el botón ahora!');
      }
      function up() {
        if (!dragging) return;
        dragging = false;
        piece.classList.remove('is-dragging');
        const zr = rectOf(zone);
        const ar = rectOf(area);
        const pr = rectOf(piece);
        const cx = pr.left + pr.width / 2, cy = pr.top + pr.height / 2;
        const inZone = cx > zr.left && cx < zr.right && cy > zr.top && cy < zr.bottom;
        if (inZone) {
          piece.style.left = ((zr.left - ar.left) + zr.width / 2 - pr.width / 2) + 'px';
          piece.style.top = ((zr.top - ar.top) + zr.height / 2 - pr.height / 2) + 'px';
          piece.classList.add('is-placed');
          zone.classList.remove('is-near');
          done('¡Muy bien! Arrastraste y soltaste en el lugar correcto.');
        } else {
          piece.style.left = '14%';
          piece.style.top = '58%';
          piece.style.transform = '';
          zone.classList.remove('is-near');
          setStatus('Casi. Mantén el botón apretado y suelta dentro de la canasta.');
        }
      }
      piece.addEventListener('pointerdown', down);
      G.addEventListener('pointermove', move);
      G.addEventListener('pointerup', up);
      cleanup = function () {
        piece.removeEventListener('pointerdown', down);
        G.removeEventListener('pointermove', move);
        G.removeEventListener('pointerup', up);
      };
      return cleanup;
    }

    if (kind === 'path') {
      area.innerHTML = '';
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        pts.push({ x: 18 + t * 264, y: 120 - Math.sin(t * Math.PI) * 78 });
      }
      const d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');
      area.innerHTML = '<svg viewBox="0 0 300 170" class="practice-path"><path d="' + d + '" fill="none" stroke="#dfe9f7" stroke-width="34" stroke-linecap="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#2b7ff5" stroke-width="3" stroke-dasharray="3 12" stroke-linecap="round"/>' +
        '<circle cx="18" cy="120" r="11" fill="#2fae5e"/><text x="282" y="60" font-size="22">🏁</text></svg>' +
        '<div class="practice-cursor" aria-hidden="true"></div>';
      setStatus('Pon la flecha en el círculo verde y sigue la línea hasta la bandera.');
      const cursor = area.querySelector('.practice-cursor');
      let maxT = 0;
      function onMove(ev) {
        if (succeeded) return;
        const r = rectOf(area);
        const sx = r.width / 300, sy = r.height / 170;
        const x = (ev.clientX - r.left) / sx, y = (ev.clientY - r.top) / sy;
        if (cursor) { cursor.style.left = (x * sx) + 'px'; cursor.style.top = (y * sy) + 'px'; }
        let best = 1e9, bi = 0;
        for (let i = 0; i < pts.length; i++) {
          const dd = U.dist(x, y, pts[i].x, pts[i].y);
          if (dd < best) { best = dd; bi = i; }
        }
        if (best < 26) {
          if (bi > maxT) maxT = bi;
          if (maxT >= 56) done('¡Excelente! Seguiste el camino completo.');
          else if (maxT > 20) setStatus('¡Bien! Sigue hasta la bandera.');
        }
      }
      area.addEventListener('pointermove', onMove);
      cleanup = function () { area.removeEventListener('pointermove', onMove); };
      return cleanup;
    }

    if (kind === 'wheel') {
      area.innerHTML = '<div class="practice-wheel"><div class="practice-wheel__icon">🖱️</div>' +
        '<div class="practice-gauge"><i></i></div><div class="practice-wheel__hint">Gira la rueda hacia ti</div></div>';
      const gauge = area.querySelector('.practice-gauge i');
      let sum = 0;
      const target = 160;
      setStatus('Gira la rueda del mouse hacia ti, despacio.');
      function onWheel(ev) {
        if (succeeded) return;
        sum += Math.abs(ev.deltaY || 0);
        gauge.style.height = Math.min(100, sum / target * 100) + '%';
        if (sum >= target) done('¡Muy bien! Así se usa la rueda.');
      }
      area.addEventListener('wheel', onWheel, { passive: true });
      cleanup = function () { area.removeEventListener('wheel', onWheel); };
      return cleanup;
    }

    return function () {};
  }

  const Tutorial = (MA.Tutorial = {
    open: function (cfg) {
      const c = cfg || {};
      const kind = c.kind || 'click';
      const meta = KIND_LABEL[kind] || KIND_LABEL.click;
      const steps = c.steps || [];
      const content = U.el('div', { class: 'tutorial' });
      const stepsEl = U.el('ol', { class: 'tutorial__steps' });
      steps.forEach(function (text, i) {
        stepsEl.appendChild(U.el('li', { class: 'tutorial__step' + (i === 0 ? ' is-current' : ''), html: '<span class="tutorial__num">' + (i + 1) + '</span><span>' + U.esc(text) + '</span>' }));
      });

      const stageEl = U.el('div', { class: 'tutorial__stage' });
      const mouseEl = U.el('div', { class: 'tutorial__mouse', html: MA.UI.mouseFigure(meta.highlight) });
      const practiceWrap = U.el('div', { class: 'tutorial__practice-wrap' });
      const practice = U.el('div', { class: 'tutorial__practice', 'data-practice-area': '1' });
      const status = U.el('p', { class: 'tutorial__status', role: 'status', text: 'Sigue los pasos con el mouse.' });
      practiceWrap.appendChild(practice);
      practiceWrap.appendChild(status);
      stageEl.appendChild(mouseEl);
      stageEl.appendChild(practiceWrap);

      content.appendChild(stepsEl);
      content.appendChild(stageEl);

      const modal = MA.UI.modal({
        title: c.title || meta.title,
        emoji: c.emoji || (kind === 'drag' ? '🖐️' : kind === 'wheel' ? '🎡' : kind === 'rightclick' ? '🖱️' : '👆'),
        content: content,
        className: 'modal--tutorial',
        dismissible: false,
        actions: [
          { label: 'Ya sé hacerlo', kind: 'ghost', onClick: function () { finish(true); } },
          { label: 'Volver a practicar', kind: 'soft', onClick: function () { reset(); } },
          { label: '¡Vamos a jugar!', kind: 'primary', onClick: function () { finish(false); } }
        ]
      });

      let cleanup = null;
      function attach() {
        if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
        practice.classList.remove('is-success');
        status.classList.remove('is-ok');
        status.textContent = 'Sigue los pasos con el mouse.';
        cleanup = practiceFor(kind, practice, status, function () {
          stepsEl.classList.add('is-complete');
        });
      }
      function reset() { attach(); }
      function finish(skipped) {
        if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
        modal.close();
        if (c.onDone) c.onDone({ skipped: skipped });
      }
      attach();
      return { close: modal.close };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
