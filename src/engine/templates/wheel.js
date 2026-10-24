/* Plantilla: RUEDA — usar la rueda de desplazamiento (nivel avanzado opcional).
   Explica visualmente dónde está la rueda y permite una alternativa accesible
   si el mouse no tiene rueda. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  MA.Templates.register('wheel', function (ctx) {
    const p = ctx.params || {};
    const api = ctx.api;
    const layer = ctx.layer;
    const stage = ctx.stage;
    const target = Math.max(40, p.target || 100);
    let reached = 0;
    let full = false;
    let completed = false;
    let completionTimer = null;
    let destroyed = false;
    let lastWarn = 0;
    let startedAt = G.performance.now();
    let fallbackShown = false;
    let state = 'wheel';

    api.setTotal(2);
    api.progress(0, 2);

    const wrap = U.el('div', { class: 'wheel-stage' });
    wrap.innerHTML =
      '<div class="wheel-card">' +
      '<div class="wheel-title">' + U.esc(p.label || 'Gira la rueda del mouse') + '</div>' +
      '<div class="wheel-mouse" aria-hidden="true">' +
      '<svg viewBox="0 0 180 240" class="wheel-mouse__svg">' +
      '<rect x="16" y="12" width="148" height="214" rx="72" fill="#f9fcff" stroke="#26415e" stroke-width="6"/>' +
      '<path d="M90 14 L90 112" stroke="#26415e" stroke-width="4" opacity=".5"/>' +
      '<path d="M20 112 L160 112" stroke="#26415e" stroke-width="3" opacity=".22"/>' +
      '<path d="M34 100 Q34 32 88 22" fill="none" stroke="#c3d2e3" stroke-width="3" stroke-dasharray="4 6"/>' +
      '<rect x="76" y="30" width="28" height="58" rx="14" class="wheel-mouse__wheel" stroke="#26415e" stroke-width="3"/>' +
      '<path d="M84 42 L84 74 M96 42 L96 74" stroke="#26415e" stroke-width="2" opacity=".35"/>' +
      '<text x="90" y="196" text-anchor="middle" font-size="17" font-weight="800" fill="#3d5a7a">rueda</text>' +
      '<path d="M90 118 L90 148" stroke="#e0a800" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 7"/>' +
      '</svg>' +
      '<div class="wheel-hand" aria-hidden="true">☝️</div>' +
      '</div>' +
      '<div class="wheel-gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<i></i><span class="wheel-gauge__label">0%</span></div>' +
      '<p class="wheel-tip">Gira la rueda con el dedo índice, hacia ti, despacio.</p>' +
      '<button type="button" class="btn btn--primary wheel-btn" disabled>¡Listo! 🚀</button>' +
      '<button type="button" class="btn btn--ghost wheel-alt hidden">No tengo rueda: usar botón</button>' +
      '</div>' +
      '<div class="wheel-emoji" aria-hidden="true">' + (p.emoji || '🚀') + '</div>';
    layer.appendChild(wrap);

    const gauge = wrap.querySelector('.wheel-gauge');
    const fill = wrap.querySelector('.wheel-gauge i');
    const gaugeLabel = wrap.querySelector('.wheel-gauge__label');
    const readyBtn = wrap.querySelector('.wheel-btn');
    const altBtn = wrap.querySelector('.wheel-alt');
    const emojiEl = wrap.querySelector('.wheel-emoji');

    function paint() {
      const pct = Math.min(100, Math.round(reached / target * 100));
      fill.style.height = pct + '%';
      gauge.setAttribute('aria-valuenow', String(pct));
      gaugeLabel.textContent = pct + '%';
      api.wheel(Math.min(reached, target), target);
      if (pct >= 100 && !full) {
        full = true;
        readyBtn.disabled = false;
        emojiEl.classList.add('is-ready');
        api.target();
        api.progress(1, 2);
        api.sfx('success');
        api.bubble('¡La barra está llena! Ahora toca el botón ¡Listo!', 'happy', 3200);
      }
    }

    function addProgress(amount) {
      if (full || completed) return;
      const gain = amount * (api.assist() ? 1.5 : 1);
      reached = Math.min(target, reached + gain);
      paint();
      if (reached > 0 && reached < target && Math.random() < 0.3) api.sfx('wheel');
    }

    function onWheel(ev) {
      if (api.isPaused() || api.isFinished() || completed) return;
      const delta = Math.abs(ev.deltaY || ev.deltaX || 0);
      if (!delta) return;
      addProgress(Math.max(1, Math.min(30, delta * 0.35)));
      if (p.direction !== 'any' && ev.deltaY < 0 && G.performance.now() - lastWarn > 4000) {
        lastWarn = G.performance.now();
        api.bubble('Gira la rueda hacia ti (hacia abajo). ¡Así!', 'idle', 2600);
      }
    }

    function finish() {
      if (completed) return;
      completed = true;
      api.click(true);
      api.target();
      api.progress(2, 2);
      api.sfx('celebrate');
      api.effect('celebrate', wrap.getBoundingClientRect().width / 2, 120, 18);
      api.bubble('¡Excelente! Ya sabes usar la rueda del mouse.', 'cheer', 3200);
      completionTimer = G.setTimeout(function () { if (!destroyed) api.complete(); }, 900);
    }

    readyBtn.addEventListener('click', function () {
      if (!full || completed) return;
      finish();
    });

    altBtn.addEventListener('click', function () {
      if (completed) return;
      if (!fallbackShown) return;
      addProgress(target * 0.12);
      api.click(true);
      if (reached >= target) {
        readyBtn.disabled = false;
        if (!full) { full = true; paint(); }
      }
    });

    stage.addEventListener('wheel', onWheel, { passive: true });
    paint();

    /* Alternativa accesible si el mouse no tiene rueda. */
    const fallbackTimer = G.setTimeout(function () {
      if (completed || destroyed) return;
      fallbackShown = true;
      altBtn.classList.remove('hidden');
      api.bubble('Si tu mouse no tiene rueda, pide ayuda a tu docente y usa el botón alternativo.', 'idle', 5000);
    }, 12000);

    function update(dt) {
      if (api.isPaused() || api.isFinished()) return;
      if (!full && !fallbackShown && G.performance.now() - startedAt > 12000) {
        fallbackShown = true;
        altBtn.classList.remove('hidden');
      }
    }

    function hint() {
      wrap.querySelector('.wheel-mouse').classList.add('is-pulsing');
      G.setTimeout(function () {
        const m = wrap.querySelector('.wheel-mouse');
        if (m) m.classList.remove('is-pulsing');
      }, 3200);
      return 'La rueda está entre los dos botones. Gírala hacia ti, despacio, hasta llenar la barra.';
    }

    return {
      update: update,
      hint: hint,
      destroy: function () {
        destroyed = true;
        G.clearTimeout(fallbackTimer);
        if (completionTimer) G.clearTimeout(completionTimer);
        stage.removeEventListener('wheel', onWheel);
      }
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
