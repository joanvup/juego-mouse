'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load-game.cjs');
const MA = loadGame();
const P = MA.Paths;

test('los caminos curvos tienen puntos suficientes y longitudes positivas', () => {
  ['wave', 'loop', 'zigzag', 'spiral', 'bumps', 'sCurve'].forEach((shape) => {
    const s = P.build({ shape: shape, rings: 3 }, 'test-' + shape);
    assert.ok(s.points.length > 40, shape + ' puntos');
    assert.ok(s.total > 200, shape + ' longitud');
    assert.ok(s.d.length > 20);
    assert.ok(s.rings.length === 3);
    assert.ok(s.start && s.goal);
    assert.ok(s.start.x >= 0 && s.start.x <= 1000);
    assert.ok(s.start.y >= 0 && s.start.y <= 600);
  });
});

test('los puntos están dentro del tablero', () => {
  const s = P.build({ shape: 'wave' }, 'bounds');
  s.points.forEach((pt) => {
    assert.ok(pt.x >= 0 && pt.x <= 1000);
    assert.ok(pt.y >= 0 && pt.y <= 600);
  });
});

test('el remuestreo mantiene un espaciado casi constante', () => {
  const points = P.shapePoints('wave');
  const sampled = P.resample(points, 20);
  assert.ok(sampled.length > 20);
  for (let i = 2; i < sampled.length - 2; i++) {
    const d = Math.hypot(sampled[i].x - sampled[i - 1].x, sampled[i].y - sampled[i - 1].y);
    assert.ok(d > 10 && d < 32, 'distancia ' + d);
  }
});

test('el laberinto tiene solución desde la salida hasta la meta', () => {
  const m = P.build({ maze: true, cols: 7, rows: 5, rings: 2 }, 'maze-1');
  assert.equal(m.kind, 'maze');
  assert.ok(m.walls.length > 10);
  assert.ok(m.points.length >= 8);
  for (let i = 1; i < m.points.length; i++) {
    const dx = Math.abs(m.points[i].x - m.points[i - 1].x);
    const dy = Math.abs(m.points[i].y - m.points[i - 1].y);
    assert.ok((dx < 1 && dy < 1) === false, 'puntos repetidos');
    assert.ok(dx < m.cellW + 1 && dy < m.cellH + 1);
    assert.ok(dx < 1 || dy < 1, 'el camino debe ser ortogonal');
  }
  assert.ok(m.allowedDeviations >= 3);
});

test('la distancia a la polilínea detecta puntos dentro y fuera', () => {
  const s = P.build({ shape: 'wave' }, 'dist');
  const onPath = s.points[Math.floor(s.points.length / 2)];
  const hit = P.distanceToPolyline(onPath.x, onPath.y, s.points);
  assert.ok(hit.dist < 2);
  const far = P.distanceToPolyline(0, 0, s.points);
  assert.ok(far.dist > 20);
});

test('la tolerancia crece en tableros pequeños y en laberintos usa el ancho del pasillo', () => {
  const curve = P.build({ shape: 'sCurve', tolerance: 30 }, 'tol');
  const t1 = P.toleranceVirtual({ tolerance: 30 }, curve, 900);
  const t2 = P.toleranceVirtual({ tolerance: 30 }, curve, 450);
  assert.ok(t2 > t1);
  const maze = P.build({ maze: true, cols: 6, rows: 4 }, 'tol-maze');
  const tm = P.toleranceVirtual({}, maze, 900);
  assert.ok(tm > 20 && tm < Math.min(maze.cellW, maze.cellH));
});

test('las estrellas del camino se ubican sobre la ruta', () => {
  const s = P.build({ shape: 'bumps', rings: 5 }, 'rings');
  assert.equal(s.rings.length, 5);
  s.rings.forEach((r) => {
    const hit = P.distanceToPolyline(r.x, r.y, s.points);
    assert.ok(hit.dist < 6);
    assert.ok(r.index > 0 && r.index < s.points.length - 1);
  });
});
