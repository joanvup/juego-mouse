/* =========================================================================
   Mouse Aventura — evaluación del desempeño
   Indicadores distintos según el tipo de actividad. Nunca divide por cero:
   si no hay datos, el indicador queda "pendiente" (null).
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  const INDICATORS = {
    click: { label: 'Precisión de clic', short: 'Precisión', unit: '%' },
    move: { label: 'Control del cursor', short: 'Control', unit: '%' },
    drag: { label: 'Aciertos al soltar', short: 'Soltar', unit: '%' },
    path: { label: 'Control del recorrido', short: 'Control', unit: '%' },
    wheel: { label: 'Control de la rueda', short: 'Rueda', unit: '%' },
    mission: { label: 'Desempeño de la misión', short: 'Misión', unit: '%' }
  };

  function clamp01(v) { return U.clamp(v, 0, 1); }
  function ratio(a, b) { return b > 0 ? a / b : null; }

  const Scoring = (MA.Scoring = {
    INDICATORS: INDICATORS,

    indicator: function (level) { return INDICATORS[level.scoring] || INDICATORS.click; },

    /** Tiempo de referencia (no es un límite): sirve para docentes y reportes. */
    parTime: function (level) {
      const p = level.params || {};
      const n = p.count || (p.items && p.items.length) || (p.cards && p.cards.length) ||
        (p.stages ? p.stages.length : 1);
      switch (level.template) {
        case 'move': return (6 + n * 5) * 1000;
        case 'click': return (5 + n * 4.5) * 1000;
        case 'sequence': return (5 + n * 7) * 1000;
        case 'drag': return (8 + n * 9) * 1000;
        case 'path': return (p.maze ? 40 : 30) * 1000 + n * 4000;
        case 'wheel': return 20000;
        case 'mission': return (p.stages || []).reduce(function (sum, st) {
          const fake = { template: st.template, params: st.params || {} };
          return sum + (st.params && st.params.count ? 5000 : 0) + 12000;
        }, 0);
        default: return (6 + n * 5) * 1000;
      }
    },

    /** Devuelve 0..1 o null si todavía no hay datos suficientes. */
    precision: function (type, m) {
      const metrics = m || {};
      const clicks = metrics.clicks || { correct: 0, wrong: 0 };
      const targets = metrics.targets || { total: 0, done: 0 };
      const drags = metrics.drags || { ok: 0, wrong: 0 };
      const totalClicks = (clicks.correct || 0) + (clicks.wrong || 0);

      switch (type) {
        case 'click':
        case 'sequence':
          return ratio(clicks.correct || 0, totalClicks);
        case 'move': {
          const doneRatio = targets.total ? (targets.done || 0) / targets.total : null;
          if (doneRatio === null) return null;
          const travel = metrics.travel || 0;
          const ideal = metrics.ideal || 0;
          const eff = travel > 0 && ideal > 0 ? clamp01(ideal / Math.max(ideal, travel)) : 1;
          return clamp01(0.45 * doneRatio + 0.55 * eff);
        }
        case 'drag': {
          const dropRatio = ratio(drags.ok || 0, (drags.ok || 0) + (drags.wrong || 0));
          const doneRatio = targets.total ? (targets.done || 0) / targets.total : 0;
          if (dropRatio === null) return doneRatio ? clamp01(doneRatio * 0.5) : null;
          return clamp01(0.72 * dropRatio + 0.28 * doneRatio);
        }
        case 'path': {
          const allowed = Math.max(2, metrics.allowedDeviations || 3);
          const control = clamp01(1 - (metrics.deviations || 0) / (allowed * 2));
          const rings = metrics.rings && metrics.rings.total
            ? (metrics.rings.got || 0) / metrics.rings.total : 1;
          return clamp01(0.78 * control + 0.22 * rings);
        }
        case 'wheel': {
          const wheel = metrics.wheel || {};
          if (!wheel.target) return null;
          const done = clamp01((wheel.reached || 0) / wheel.target);
          const clicksOk = ratio(clicks.correct || 0, totalClicks);
          if (clicksOk === null) return done;
          return clamp01(0.75 * done + 0.25 * clicksOk);
        }
        case 'mission': {
          const stages = (metrics.stages || []).filter(function (v) { return typeof v === 'number' && isFinite(v); });
          if (stages.length) return clamp01(stages.reduce(function (a, b) { return a + b; }, 0) / stages.length);
          const c = ratio(clicks.correct || 0, totalClicks);
          return c === null ? 1 : c;
        }
        default:
          return ratio(clicks.correct || 0, totalClicks);
      }
    },

    thresholds: function (level) {
      const d = Math.max(1, level.difficulty || 1);
      return { two: 0.55 + Math.min(0.10, d * 0.0012), three: 0.80 + Math.min(0.07, d * 0.0007) };
    },

    /** 1 estrella por completar; 2 y 3 por precisión. Nunca menos de 1. */
    stars: function (level, precision) {
      if (precision === null || precision === undefined) return 1;
      const t = Scoring.thresholds(level);
      let stars = 1;
      if (precision >= t.two) stars++;
      if (precision >= t.three) stars++;
      return stars;
    },

    score: function (stars, precision) {
      const p = (precision === null || precision === undefined) ? 0 : precision;
      return Math.round(stars * 100 + p * 100);
    },

    /** Detalle legible para el niño, la familia y el docente. */
    detail: function (level, m) {
      const metrics = m || {};
      const clicks = metrics.clicks || {};
      const targets = metrics.targets || {};
      const drags = metrics.drags || {};
      const out = [];
      if (level.scoring === 'click' || level.scoring === 'sequence') {
        out.push({ label: 'Clics correctos', value: String(clicks.correct || 0) });
        out.push({ label: 'Clics fuera del objetivo', value: String(clicks.wrong || 0) });
        out.push({ label: 'Objetivos logrados', value: (targets.done || 0) + ' de ' + (targets.total || 0) });
      } else if (level.scoring === 'move') {
        out.push({ label: 'Objetivos alcanzados', value: (targets.done || 0) + ' de ' + (targets.total || 0) });
        out.push({ label: 'Recorrido del cursor', value: Math.round((metrics.travel || 0) / 10) + ' cm aprox.' });
      } else if (level.scoring === 'drag') {
        out.push({ label: 'Piezas colocadas', value: String(drags.ok || 0) });
        out.push({ label: 'Intentos fallidos al soltar', value: String(drags.wrong || 0) });
        out.push({ label: 'Objetivos logrados', value: (targets.done || 0) + ' de ' + (targets.total || 0) });
      } else if (level.scoring === 'path') {
        out.push({ label: 'Salidas del camino', value: String(metrics.deviations || 0) });
        if (metrics.rings && metrics.rings.total) {
          out.push({ label: 'Estrellas del camino', value: (metrics.rings.got || 0) + ' de ' + metrics.rings.total });
        }
      } else if (level.scoring === 'wheel') {
        out.push({ label: 'Avance de la rueda', value: Math.min(100, Math.round(((metrics.wheel || {}).reached || 0) / Math.max(1, ((metrics.wheel || {}).target || 1)) * 100)) + '%' });
      } else if (level.scoring === 'mission') {
        out.push({ label: 'Partes completadas', value: (metrics.targets.done || 0) + ' de ' + (metrics.targets.total || 0) });
        out.push({ label: 'Clics correctos', value: String(clicks.correct || 0) });
        out.push({ label: 'Clics fuera del objetivo', value: String(clicks.wrong || 0) });
      }
      out.push({ label: 'Pistas usadas', value: String(metrics.hints || 0) });
      return out;
    },

    /** Resultado completo de un nivel. */
    result: function (level, metrics) {
      const m = metrics || {};
      const precision = Scoring.precision(level.scoring, m);
      const stars = Scoring.stars(level, precision);
      const score = Scoring.score(stars, precision);
      const indicator = Scoring.indicator(level);
      const pct = precision === null ? null : Math.round(precision * 100);
      return {
        levelId: level.id,
        precision: precision,
        precisionPct: pct,
        pending: precision === null,
        stars: stars,
        score: score,
        timeMs: m.timeMs || 0,
        hints: m.hints || 0,
        metrics: m,
        indicator: {
          label: indicator.label,
          short: indicator.short,
          value: pct,
          display: pct === null ? 'Pendiente' : pct + '%'
        },
        detail: Scoring.detail(level, m)
      };
    },

    /** Mensaje amable según el resultado. Nunca culpabiliza al estudiante. */
    message: function (result) {
      if (result.stars >= 3) return '¡Excelente! ¡Lo lograste con mucha precisión!';
      if (result.stars === 2) return '¡Muy bien! Cada vez controlas mejor el mouse.';
      if (result.pending) return '¡Lo lograste! Ahora ya tienes un dato para mejorar.';
      return '¡Lo lograste! Practicar otra vez te ayuda a mejorar tu precisión.';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
