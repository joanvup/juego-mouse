/* =========================================================================
   Mouse Aventura — motor de niveles
   Mantiene el bucle, los indicadores, las pistas y la interfaz común que
   usan todas las plantillas de juego.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  const REGISTRY = {};

  MA.Templates = {
    registry: REGISTRY,
    register: function (id, factory) { REGISTRY[id] = factory; },
    get: function (id) { return REGISTRY[id] || null; },
    has: function (id) { return !!REGISTRY[id]; },
    list: function () { return Object.keys(REGISTRY); }
  };

  function emptyMetrics() {
    return {
      timeMs: 0,
      hints: 0,
      assistUsed: false,
      clicks: { total: 0, correct: 0, wrong: 0 },
      targets: { total: 0, done: 0 },
      drags: { total: 0, ok: 0, wrong: 0 },
      deviations: 0,
      allowedDeviations: 3,
      rings: { total: 0, got: 0 },
      travel: 0,
      ideal: 0,
      stages: [],
      wheel: { target: 0, reached: 0 },
      stageIndex: 0,
      stageTotal: 0
    };
  }

  const Engine = (MA.Engine = {
    active: null,

    create: function (opts) {
      const options = opts || {};
      const level = options.level;
      const params = level.params || {};
      const stage = options.stage;
      const layer = options.layer || stage;
      const settings = options.settings || { reduceMotion: false, biggerTargets: false, highContrast: false };
      const hud = options.hud || {};
      const metrics = emptyMetrics();
      const cleanups = [];
      let templateInstance = null;
      let running = false;
      let paused = false;
      let finished = false;
      let destroyed = false;
      let assistLevel = 0;
      let startedAt = 0;
      let pausedTotal = 0;
      let pauseStarted = 0;
      let lastFrame = 0;
      let raf = 0;
      let idleMs = 0;
      let lastSuggest = -99999;
      let lastMetricsPush = 0;
      let timeLeftMs = level.timeLimit ? level.timeLimit * 1000 : 0;
      let timerDisabled = false;
      let lastPointer = null;

      function nowPerf() {
        return (G.performance && G.performance.now) ? G.performance.now() : Date.now();
      }
      function elapsed() {
        const base = nowPerf() - startedAt - pausedTotal;
        return pauseStarted ? base - (nowPerf() - pauseStarted) : base;
      }
      function stageRect() { return stage.getBoundingClientRect(); }

      function sizeScale() {
        const r = stageRect();
        const base = U.clamp(Math.min(r.width / 1000, r.height / 640), 0.6, 1.4);
        return base * (settings.biggerTargets ? 1.3 : 1);
      }

      function pushMetrics(force) {
        const t = nowPerf();
        if (!force && t - lastMetricsPush < 140) return;
        lastMetricsPush = t;
        try { if (hud.metrics) hud.metrics(snapshot()); } catch (e) {}
      }

      function snapshot() {
        return {
          timeMs: Math.round(elapsed()),
          hints: metrics.hints,
          clicks: Object.assign({}, metrics.clicks),
          targets: Object.assign({}, metrics.targets),
          drags: Object.assign({}, metrics.drags),
          deviations: metrics.deviations,
          allowedDeviations: metrics.allowedDeviations,
          rings: Object.assign({}, metrics.rings),
          travel: Math.round(metrics.travel),
          ideal: Math.round(metrics.ideal),
          stages: metrics.stages.slice(),
          wheel: Object.assign({}, metrics.wheel),
          stageIndex: metrics.stageIndex,
          stageTotal: metrics.stageTotal,
          assistUsed: metrics.assistUsed,
          timeLeftMs: Math.max(0, timeLeftMs)
        };
      }

      function effectsLayer() {
        let el = layer.querySelector('.fx-layer');
        if (!el) {
          el = U.el('div', { class: 'fx-layer', 'aria-hidden': 'true' });
          layer.appendChild(el);
        }
        return el;
      }

      function updateProgressHud() {
        try {
          if (hud.progress) hud.progress(metrics.targets.done, metrics.targets.total);
        } catch (e) {}
      }

      const api = {
        level: level,
        params: params,
        settings: settings,
        metrics: metrics,
        stage: stage,
        layer: layer,
        U: U,

        sfx: function (name) { try { MA.Audio.play(name); } catch (e) {} },

        setTotal: function (total) {
          metrics.targets.total = total;
          updateProgressHud();
        },

        target: function () {
          metrics.targets.done = Math.min(metrics.targets.total || 999, metrics.targets.done + 1);
          updateProgressHud();
          pushMetrics(true);
        },

        click: function (ok) {
          metrics.clicks.total += 1;
          if (ok) metrics.clicks.correct += 1; else metrics.clicks.wrong += 1;
          pushMetrics(true);
        },

        drop: function (ok) {
          metrics.drags.total += 1;
          if (ok) metrics.drags.ok += 1; else metrics.drags.wrong += 1;
          pushMetrics(true);
        },

        deviation: function () {
          metrics.deviations += 1;
          pushMetrics(true);
        },

        ring: function (got, total) {
          metrics.rings.got = got;
          metrics.rings.total = total;
        },

        stagePrecision: function (value) {
          if (typeof value === 'number' && isFinite(value)) metrics.stages.push(value);
        },

        wheel: function (reached, target) {
          metrics.wheel.reached = reached;
          metrics.wheel.target = target;
        },

        setStageInfo: function (index, total, allowed) {
          metrics.stageIndex = index;
          metrics.stageTotal = total;
          if (typeof allowed === 'number') metrics.allowedDeviations = allowed;
        },

        progress: function (done, total) {
          metrics.targets.done = done;
          metrics.targets.total = total;
          updateProgressHud();
        },

        complete: function (extra) {
          if (finished || destroyed) return;
          finish(extra);
        },

        bubble: function (text, mood, ms) {
          if (options.onBubble) options.onBubble({ text: text, mood: mood || 'idle', ms: ms || 3200 });
        },

        toast: function (text) {
          if (options.onToast) options.onToast(text);
        },

        effect: function (kind, x, y, count) {
          const fx = effectsLayer();
          const n = count || (kind === 'celebrate' ? 18 : 6);
          for (let i = 0; i < n; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 26 + Math.random() * 70;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist - 16;
            const span = U.el('span', {
              class: 'fx fx--' + kind,
              text: kind === 'star' ? '⭐' : kind === 'coin' ? '💰' : kind === 'pop' ? '✨' : kind === 'spark' ? '✨' : '✨',
              style: {
                left: (x || 0) + 'px',
                top: (y || 0) + 'px',
                '--dx': dx.toFixed(1) + 'px',
                '--dy': dy.toFixed(1) + 'px',
                '--rot': (Math.random() * 90 - 45).toFixed(0) + 'deg'
              }
            });
            fx.appendChild(span);
            G.setTimeout(function () { U.remove(span); }, 950);
          }
        },

        arrowTo: function (target) {
          api.clearArrow();
          const fx = effectsLayer();
          const arrow = U.el('div', { class: 'hint-arrow', 'aria-hidden': 'true', html: '<span>👇</span>' });
          let x = 0, y = 0;
          if (target && target.getBoundingClientRect) {
            const r = target.getBoundingClientRect();
            const base = stageRect();
            x = r.left - base.left + r.width / 2;
            y = r.top - base.top + r.height + 6;
          } else if (target && typeof target.x === 'number') {
            x = target.x;
            y = target.y;
          }
          arrow.style.left = x + 'px';
          arrow.style.top = y + 'px';
          fx.appendChild(arrow);
          fx.dataset.arrowFor = 'x';
        },

        clearArrow: function () {
          const fx = layer.querySelector('.fx-layer');
          if (!fx) return;
          Array.prototype.slice.call(fx.querySelectorAll('.hint-arrow')).forEach(function (n) { U.remove(n); });
        },

        assist: function () { return assistLevel > 0; },
        assistLevel: function () { return assistLevel; },
        isPaused: function () { return paused; },
        isFinished: function () { return finished; },
        timeLeft: function () { return timeLeftMs; },
        sizeScale: sizeScale,
        stageRect: stageRect,
        setStatus: function (text) { try { if (hud.status) hud.status(text); } catch (e) {} },
        elapsed: elapsed,
        snapshot: snapshot,

        /** Añade un elemento al escenario con posición absoluta en píxeles. */
        place: function (el, x, y) {
          el.style.left = x + 'px';
          el.style.top = y + 'px';
          return el;
        }
      };

      /* Pistas: además de explicar, reducen la dificultad temporalmente. */
      function useHint() {
        if (finished) return null;
        metrics.hints += 1;
        metrics.assistUsed = true;
        assistLevel = Math.min(2, assistLevel + 1);
        layer.classList.add('assist-' + assistLevel);
        try { if (hud.assist) hud.assist(assistLevel); } catch (e) {}
        let text = null;
        if (templateInstance && typeof templateInstance.hint === 'function') {
          text = templateInstance.hint(assistLevel);
        }
        if (!text) {
          const hints = level.hints || [];
          text = hints[Math.min(assistLevel - 1, Math.max(0, hints.length - 1))] || 'Haz el movimiento despacio y con calma.';
        }
        api.bubble(text, 'happy', 5000);
        pushMetrics(true);
        return text;
      }

      function finish() {
        if (finished) return;
        finished = true;
        running = false;
        if (raf) { G.cancelAnimationFrame(raf); raf = 0; }
        metrics.timeMs = Math.round(elapsed());
        api.clearArrow();
        const result = MA.Scoring.result(level, metrics);
        result.metrics = snapshot();
        result.timeMs = metrics.timeMs;
        result.hints = metrics.hints;
        try {
          if (options.onFinish) options.onFinish(result);
        } catch (e) {}
      }

      function frame(t) {
        if (destroyed || !running) return;
        if (paused) { lastFrame = t; raf = G.requestAnimationFrame(frame); return; }
        const dt = Math.min(64, Math.max(0, t - lastFrame)) || 16;
        lastFrame = t;
        metrics.timeMs = Math.round(elapsed());

        if (!timerDisabled && level.timeLimit) {
          timeLeftMs = Math.max(0, timeLeftMs - dt);
          if (hud.timer) hud.timer(timeLeftMs);
          if (timeLeftMs <= 0) {
            timerDisabled = true;
            if (options.onTimeUp) options.onTimeUp();
          }
        }

        idleMs += dt;
        if (settings.autoHints !== false && idleMs > 16000 && !finished &&
            nowPerf() - lastSuggest > 25000 && options.onSuggestHint) {
          lastSuggest = nowPerf();
          idleMs = 0;
          options.onSuggestHint();
        }
        if (idleMs > 16000) idleMs = 0;

        if (templateInstance && templateInstance.update) {
          try { templateInstance.update(dt / 1000, dt); } catch (e) { /* estable */ }
        }
        pushMetrics();
        raf = G.requestAnimationFrame(frame);
      }

      /* Movimiento del cursor: distancia recorrida y despertador de inactividad */
      function onPointerMove(ev) {
        if (paused || finished) return;
        idleMs = 0;
        const r = stageRect();
        const x = ev.clientX - r.left;
        const y = ev.clientY - r.top;
        if (lastPointer) {
          const d = U.dist(x, y, lastPointer.x, lastPointer.y);
          if (d > 0.5 && d < 400) metrics.travel += d;
        }
        lastPointer = { x: x, y: y };
      }
      function onActivity() { idleMs = 0; }

      function onContextMenu(ev) { ev.preventDefault(); }
      function onWheel(ev) { ev.preventDefault(); }

      stage.addEventListener('pointermove', onPointerMove);
      stage.addEventListener('pointerdown', onActivity);
      stage.addEventListener('contextmenu', onContextMenu);
      stage.addEventListener('wheel', onWheel, { passive: false });
      cleanups.push(function () {
        stage.removeEventListener('pointermove', onPointerMove);
        stage.removeEventListener('pointerdown', onActivity);
        stage.removeEventListener('contextmenu', onContextMenu);
        stage.removeEventListener('wheel', onWheel);
      });

      const instance = {
        level: level,
        metrics: metrics,
        api: api,
        start: function () {
          if (running || destroyed) return;
          startedAt = nowPerf();
          lastFrame = nowPerf();
          idleMs = 0;
          const factory = MA.Templates.get(level.template);
          U.clear(layer);
          layer.classList.remove('assist-1', 'assist-2');
          if (!factory) {
            layer.appendChild(U.el('div', { class: 'level-error', html: 'No encontramos esta actividad.<br><small>Plantilla: ' + U.esc(level.template) + '</small>' }));
            if (hud.progress) hud.progress(0, 1);
            return;
          }
          const ctx = {
            level: level, params: params, stage: stage, layer: layer,
            settings: settings, api: api, engine: instance, U: U,
            sizeScale: sizeScale, stageRect: stageRect
          };
          try {
            templateInstance = factory(ctx);
          } catch (e) {
            templateInstance = null;
            layer.appendChild(U.el('div', { class: 'level-error', html: 'Ups, esta actividad tuvo un problema.<br><small>' + U.esc(e && e.message ? e.message : '') + '</small>' }));
            if (hud.progress) hud.progress(0, 1);
            return;
          }
          if (hud.timer) hud.timer(level.timeLimit ? timeLeftMs : null);
          running = true;
          raf = G.requestAnimationFrame(frame);
          pushMetrics(true);
        },
        pause: function () {
          if (paused || finished || destroyed) return;
          paused = true;
          pauseStarted = nowPerf();
          layer.classList.add('is-paused');
          stage.classList.add('is-paused');
        },
        resume: function () {
          if (!paused) return;
          paused = false;
          pausedTotal += nowPerf() - pauseStarted;
          pauseStarted = 0;
          lastFrame = nowPerf();
          layer.classList.remove('is-paused');
          stage.classList.remove('is-paused');
        },
        hint: useHint,
        finish: finish,
        isPaused: function () { return paused; },
        isFinished: function () { return finished; },
        elapsed: elapsed,
        getMetrics: snapshot,
        setStageInfo: api.setStageInfo,
        destroy: function () {
          if (destroyed) return;
          destroyed = true;
          running = false;
          if (raf) { G.cancelAnimationFrame(raf); raf = 0; }
          if (templateInstance && templateInstance.destroy) {
            try { templateInstance.destroy(); } catch (e) {}
          }
          cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
          cleanups.length = 0;
          templateInstance = null;
          U.clear(layer);
          if (Engine.active === instance) Engine.active = null;
        },
        /** Para pruebas automáticas y depuración. */
        debug: function () {
          return {
            level: level.id, template: level.template, paused: paused, finished: finished,
            metrics: snapshot(), assistLevel: assistLevel,
            path: (templateInstance && templateInstance.debugPath) ? templateInstance.debugPath() : null
          };
        }
      };

      Engine.active = instance;
      return instance;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
