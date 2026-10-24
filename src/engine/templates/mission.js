/* Plantilla: MISIÓN — varias partes con plantillas distintas, una tras otra.
   Suma el desempeño de cada parte y conserva el avance entre etapas. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  MA.Templates.register('mission', function (ctx) {
    const p = ctx.params || {};
    const api = ctx.api;
    const layer = ctx.layer;
    const stage = ctx.stage;
    const stages = (p.stages || []).slice();
    const level = ctx.level;
    let index = -1;
    let sub = null;
    let subApi = null;
    let accDone = 0;
    let accTotal = 0;
    let stageDone = 0;
    let stageTotal = 0;
    let completed = false;
    let destroyed = false;
    let bannerTimer = 0;
    let banner = null;
    let beforeCounters = null;
    let stageFinishing = false;

    api.setStageInfo(0, stages.length);

    if (!stages.length) {
      api.complete();
      return { destroy: function () {} };
    }

    function counters() {
      const m = api.metrics;
      return {
        correct: m.clicks.correct, wrong: m.clicks.wrong,
        targets: m.targets.done, dragsOk: m.drags.ok, dragsWrong: m.drags.wrong,
        deviations: m.deviations, ringsGot: m.rings.got, ringsTotal: m.rings.total
      };
    }

    function diffCounters(after, before) {
      return {
        clicks: { correct: after.correct - before.correct, wrong: after.wrong - before.wrong, total: (after.correct - before.correct) + (after.wrong - before.wrong) },
        targets: { done: Math.max(0, after.targets - before.targets), total: stageTotal || 0 },
        drags: { ok: after.dragsOk - before.dragsOk, wrong: after.dragsWrong - before.dragsWrong },
        deviations: after.deviations - before.deviations,
        rings: { got: after.ringsGot, total: after.ringsTotal },
        allowedDeviations: api.metrics.allowedDeviations || 3
      };
    }

    function mapping(template) {
      return ({ click: 'click', sequence: 'click', move: 'move', drag: 'drag', path: 'path', wheel: 'wheel' })[template] || 'click';
    }

    function buildSubApi() {
      const wrapped = Object.create(api);
      wrapped.setTotal = function (n) {
        stageTotal = n;
        api.setTotal(accTotal + n);
      };
      wrapped.progress = function (done, total) {
        stageDone = done;
        if (typeof total === 'number') stageTotal = total;
        api.progress(accDone + done, accTotal + (typeof total === 'number' ? total : stageTotal));
      };
      wrapped.target = function () { /* el avance se cuenta con progress() */ };
      wrapped.complete = function () { stageFinished(); };
      wrapped.setStatus = function (text) { api.setStatus(text); };
      return wrapped;
    }

    function showBanner(stageCfg, i) {
      if (banner) U.remove(banner);
      banner = U.el('div', { class: 'mission-banner', 'aria-live': 'polite' });
      banner.innerHTML =
        '<div class="mission-banner__count">Parte ' + (i + 1) + ' de ' + stages.length + '</div>' +
        '<div class="mission-banner__title">' + U.esc(stageCfg.title || 'Siguiente parte') + '</div>' +
        '<div class="mission-banner__text">' + U.esc(stageCfg.instruction || '') + '</div>';
      layer.appendChild(banner);
      G.requestAnimationFrame(function () { if (banner) banner.classList.add('is-visible'); });
      bannerTimer = G.setTimeout(function () {
        if (banner) banner.classList.remove('is-visible');
        G.setTimeout(function () { if (banner) { U.remove(banner); banner = null; } }, 400);
      }, 2100);
    }

    function startStage(i) {
      if (destroyed) return;
      if (sub && sub.destroy) { try { sub.destroy(); } catch (e) {} }
      sub = null;
      index = i;
      if (i >= stages.length) {
        completed = true;
        api.setStatus('');
        api.complete();
        return;
      }
      const cfg = stages[i];
      stageFinishing = false;
      api.setStageInfo(i + 1, stages.length);
      api.setStatus(cfg.instruction || '');
      stageDone = 0;
      stageTotal = (cfg.params && (cfg.params.count || (cfg.params.items && cfg.params.items.length) || (cfg.params.cards && cfg.params.order && cfg.params.order.length))) || 0;
      U.clear(layer);
      showBanner(cfg, i);
      api.bubble(cfg.instruction || cfg.title || 'Sigue con la misión.', 'idle', 4200);
      const factory = MA.Templates.get(cfg.template);
      if (!factory) {
        api.complete();
        return;
      }
      beforeCounters = counters();
      const subCtx = Object.assign({}, ctx, {
        level: Object.assign({}, level, { template: cfg.template, params: cfg.params || {} }),
        params: cfg.params || {},
        api: subApi,
        layer: layer
      });
      try {
        sub = factory(subCtx);
      } catch (e) {
        sub = null;
      }
      api.progress(accDone, accTotal + stageTotal);
    }

    function stageFinished() {
      if (completed || destroyed || stageFinishing) return;
      stageFinishing = true;
      const after = counters();
      const before = beforeCounters || after;
      const mini = diffCounters(after, before);
      const value = MA.Scoring.precision(mapping(stages[index].template), mini);
      if (value !== null) api.stagePrecision(value);
      accDone += Math.max(stageDone, stageTotal);
      accTotal += stageTotal;
      stageDone = 0;
      api.progress(accDone, accTotal);
      if (sub && sub.destroy) { try { sub.destroy(); } catch (e) {} }
      sub = null;
      api.sfx('success');
      api.effect('star', (stage.getBoundingClientRect().width || 800) / 2, 120, 8);
      if (index + 1 >= stages.length) {
        completed = true;
        G.setTimeout(function () { if (!destroyed) api.sfx('celebrate'); }, 300);
        G.setTimeout(function () { if (!destroyed) api.complete(); }, 800);
      } else {
        api.bubble('¡Parte completada! Vamos con la siguiente.', 'happy', 2200);
        G.setTimeout(function () { if (!destroyed) startStage(index + 1); }, 650);
      }
    }

    function update(dt) {
      if (banner) {
        /* el cartel de la parte no debe estorbar */
      }
      if (sub && sub.update) sub.update(dt);
    }

    function hint() {
      if (sub && sub.hint) return sub.hint();
      const cfg = stages[index] || {};
      return cfg.instruction || 'Lee la indicación y sigue con calma.';
    }

    subApi = buildSubApi();
    startStage(0);

    return {
      update: update,
      hint: hint,
      debugPath: function () { return (sub && sub.debugPath) ? sub.debugPath() : null; },
      destroy: function () {
        destroyed = true;
        G.clearTimeout(bannerTimer);
        if (sub && sub.destroy) { try { sub.destroy(); } catch (e) {} }
        sub = null;
      }
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
