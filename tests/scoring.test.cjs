'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load-game.cjs');
const MA = loadGame();

function baseMetrics(extra) {
  return Object.assign({
    timeMs: 10000, hints: 0,
    clicks: { total: 0, correct: 0, wrong: 0 },
    targets: { total: 0, done: 0 },
    drags: { total: 0, ok: 0, wrong: 0 },
    deviations: 0, allowedDeviations: 3,
    rings: { total: 0, got: 0 },
    travel: 0, ideal: 0, stages: [],
    wheel: { target: 0, reached: 0 }
  }, extra || {});
}

test('sin clics la precisión queda pendiente (no divide por cero)', () => {
  const p = MA.Scoring.precision('click', baseMetrics());
  assert.equal(p, null);
  const level = MA.Levels.first();
  const result = MA.Scoring.result(level, baseMetrics());
  assert.equal(result.precision, null);
  assert.equal(result.pending, true);
  assert.equal(result.indicator.display, 'Pendiente');
  assert.equal(result.stars, 1);
});

test('la precisión de clic es aciertos sobre intentos', () => {
  const p = MA.Scoring.precision('click', baseMetrics({ clicks: { total: 10, correct: 8, wrong: 2 } }));
  assert.equal(p, 0.8);
  const p2 = MA.Scoring.precision('click', baseMetrics({ clicks: { total: 4, correct: 1, wrong: 3 } }));
  assert.equal(p2, 0.25);
});

test('el control del cursor usa el recorrido y los objetivos alcanzados', () => {
  const perfect = MA.Scoring.precision('move', baseMetrics({
    targets: { total: 5, done: 5 }, travel: 1000, ideal: 1000
  }));
  assert.ok(perfect > 0.95);
  const wandering = MA.Scoring.precision('move', baseMetrics({
    targets: { total: 5, done: 5 }, travel: 3000, ideal: 1000
  }));
  assert.ok(wandering < perfect);
  assert.ok(wandering >= 0 && wandering <= 1);
});

test('el arrastre mide piezas colocadas y errores al soltar', () => {
  const p = MA.Scoring.precision('drag', baseMetrics({
    targets: { total: 4, done: 4 }, drags: { total: 6, ok: 4, wrong: 2 }
  }));
  assert.ok(p > 0.6 && p < 0.9);
  const perfect = MA.Scoring.precision('drag', baseMetrics({
    targets: { total: 4, done: 4 }, drags: { total: 4, ok: 4, wrong: 0 }
  }));
  assert.ok(perfect > 0.95);
});

test('las rutas castigan desviaciones pero nunca por debajo de cero', () => {
  const clean = MA.Scoring.precision('path', baseMetrics({
    deviations: 0, rings: { total: 4, got: 4 }, allowedDeviations: 3
  }));
  assert.equal(clean, 1);
  const many = MA.Scoring.precision('path', baseMetrics({
    deviations: 30, rings: { total: 4, got: 1 }, allowedDeviations: 3
  }));
  assert.ok(many >= 0 && many < 0.5);
});

test('las misiones promedian las etapas', () => {
  const p = MA.Scoring.precision('mission', baseMetrics({ stages: [1, 0.5, 0] }));
  assert.equal(p, 0.5);
});

test('la rueda mide el avance y los clics', () => {
  const p = MA.Scoring.precision('wheel', baseMetrics({ wheel: { target: 100, reached: 100 }, clicks: { total: 1, correct: 1, wrong: 0 } }));
  assert.ok(p > 0.9);
});

test('las estrellas dependen de la precisión y nunca bajan de 1 al completar', () => {
  const level = MA.Levels.byWorld(5)[4];
  const t = MA.Scoring.thresholds(level);
  assert.equal(MA.Scoring.stars(level, null), 1);
  assert.equal(MA.Scoring.stars(level, 0), 1);
  assert.equal(MA.Scoring.stars(level, t.two - 0.01), 1);
  assert.equal(MA.Scoring.stars(level, t.two), 2);
  assert.equal(MA.Scoring.stars(level, t.three), 3);
  assert.equal(MA.Scoring.stars(level, 1), 3);
});

test('el resultado incluye detalle, mensaje amable y tiempo de referencia', () => {
  const level = MA.Levels.byWorld(2)[0];
  const result = MA.Scoring.result(level, baseMetrics({
    clicks: { total: 3, correct: 3, wrong: 0 },
    targets: { total: 3, done: 3 },
    timeMs: 9000
  }));
  assert.equal(result.stars, 3);
  assert.ok(result.score > 0);
  assert.ok(result.detail.length >= 3);
  assert.ok(MA.Scoring.message(result).length > 5);
  assert.ok(MA.Scoring.parTime(level) > 5000);
});

test('cada tipo de actividad tiene su propio indicador', () => {
  const labels = {
    click: 'Precisión de clic', move: 'Control del cursor',
    drag: 'Aciertos al soltar', path: 'Control del recorrido',
    wheel: 'Control de la rueda', mission: 'Desempeño de la misión'
  };
  Object.keys(labels).forEach((type) => {
    assert.equal(MA.Scoring.INDICATORS[type].label, labels[type]);
  });
});
