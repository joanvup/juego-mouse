/* =========================================================================
   Mouse Aventura — geometría de rutas y laberintos
   Trabaja en un tablero virtual de 1000 × 600 (proporción 5:3).
   Lógica pura: se puede probar sin navegador.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  const W = 1000;
  const H = 600;

  function clampPoint(p) {
    return { x: U.clamp(p.x, 46, W - 46), y: U.clamp(p.y, 42, H - 42) };
  }

  /** Puntos densos de una forma predefinida. */
  function shapePoints(shape, rnd) {
    const pts = [];
    const N = 900;
    const rand = rnd || Math.random;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      let x, y;
      switch (shape) {
        case 'loop': {
          const turns = 1.55;
          const a = -Math.PI / 2 + t * Math.PI * 2 * turns;
          const r = 0.5 - t * 0.32;
          x = 500 + Math.cos(a) * r * 820;
          y = 300 + Math.sin(a) * r * 430;
          break;
        }
        case 'zigzag': {
          const seg = 3;
          const local = (t * seg) % 1;
          const tri = Math.abs(local * 2 - 1);
          x = 80 + t * 840;
          y = 140 + tri * 330;
          break;
        }
        case 'spiral': {
          const a = t * Math.PI * 4.4;
          const r = 1 - t * 0.82;
          x = 500 + Math.cos(a) * r * 430;
          y = 300 + Math.sin(a) * r * 245;
          break;
        }
        case 'bumps':
          x = 80 + t * 840;
          y = 300 + Math.sin(t * Math.PI * 7) * 170;
          break;
        case 'sCurve':
          x = 80 + t * 840;
          y = 300 + Math.sin(t * Math.PI * 2 - 0.4) * 200;
          break;
        case 'wave':
        default:
          x = 80 + t * 840;
          y = 300 + Math.sin(t * Math.PI * 3 + 0.3) * 180;
          break;
      }
      pts.push(clampPoint({ x: x, y: y }));
    }
    return pts;
  }

  function length(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) total += U.distPoint(points[i - 1], points[i]);
    return total;
  }

  /** Remuestrea una polilínea a un paso casi constante. */
  function resample(points, step) {
    if (!points.length) return [];
    const out = [points[0]];
    let acc = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const d = U.distPoint(a, b);
      if (d === 0) continue;
      let remain = d;
      let from = a;
      while (acc + remain >= step) {
        const need = step - acc;
        const t = need / remain;
        const p = { x: from.x + (b.x - from.x) * t, y: from.y + (b.y - from.y) * t };
        out.push(p);
        from = p;
        remain = U.distPoint(from, b);
        acc = 0;
      }
      acc += remain;
    }
    const last = points[points.length - 1];
    if (U.distPoint(out[out.length - 1], last) > 0.5) out.push(last);
    return out;
  }

  function toPathD(points) {
    if (!points.length) return '';
    let d = 'M ' + points[0].x.toFixed(1) + ' ' + points[0].y.toFixed(1);
    for (let i = 1; i < points.length; i++) d += ' L ' + points[i].x.toFixed(1) + ' ' + points[i].y.toFixed(1);
    return d;
  }

  /** Distancia de un punto a la polilínea (en unidades virtuales). */
  function distanceToPolyline(px, py, points) {
    let best = { dist: Infinity, index: 0, x: 0, y: 0 };
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      let t = len2 === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / len2;
      t = U.clamp(t, 0, 1);
      const x = a.x + dx * t, y = a.y + dy * t;
      const d = U.dist(px, py, x, y);
      if (d < best.dist) best = { dist: d, index: i - 1, x: x, y: y };
    }
    return best;
  }

  /** Laberinto perfecto (DFS). Devuelve pasillos, paredes y solución. */
  function maze(cols, rows, rnd) {
    const c = Math.max(5, cols || 8);
    const r = Math.max(4, rows || 5);
    const cellW = W / c;
    const cellH = H / r;
    const cells = [];
    for (let y = 0; y < r; y++) {
      const row = [];
      for (let x = 0; x < c; x++) {
        row.push({ x: x, y: y, n: true, e: true, s: true, w: true, visited: false, parent: null });
      }
      cells.push(row);
    }
    const at = function (x, y) { return (x >= 0 && y >= 0 && x < c && y < r) ? cells[y][x] : null; };
    const startCell = at(0, Math.floor(r / 2));
    const stack = [startCell];
    startCell.visited = true;
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const neighbors = [];
      const n = at(cur.x, cur.y - 1), e = at(cur.x + 1, cur.y), s = at(cur.x, cur.y + 1), w = at(cur.x - 1, cur.y);
      if (n && !n.visited) neighbors.push({ cell: n, dir: 'n' });
      if (e && !e.visited) neighbors.push({ cell: e, dir: 'e' });
      if (s && !s.visited) neighbors.push({ cell: s, dir: 's' });
      if (w && !w.visited) neighbors.push({ cell: w, dir: 'w' });
      if (!neighbors.length) { stack.pop(); continue; }
      const pick = neighbors[Math.floor((rnd() || 0.5) * neighbors.length) % neighbors.length];
      const next = pick.cell;
      if (pick.dir === 'n') { cur.n = false; next.s = false; }
      if (pick.dir === 'e') { cur.e = false; next.w = false; }
      if (pick.dir === 's') { cur.s = false; next.n = false; }
      if (pick.dir === 'w') { cur.w = false; next.e = false; }
      next.visited = true;
      next.parent = cur;
      stack.push(next);
    }

    const goalCell = at(c - 1, Math.floor(r / 2));
    const chain = [];
    let walker = goalCell;
    while (walker) { chain.push(walker); walker = walker.parent; }
    chain.reverse();

    const points = chain.map(function (cell) {
      return { x: (cell.x + 0.5) * cellW, y: (cell.y + 0.5) * cellH };
    });

    const walls = [];
    const addWall = function (x1, y1, x2, y2) { walls.push({ x1: x1, y1: y1, x2: x2, y2: y2 }); };
    for (let y = 0; y < r; y++) {
      for (let x = 0; x < c; x++) {
        const cell = cells[y][x];
        const left = x * cellW, top = y * cellH, right = left + cellW, bottom = top + cellH;
        if (cell.n) addWall(left, top, right, top);
        if (cell.w) addWall(left, top, left, bottom);
        if (y === r - 1 && cell.s) addWall(left, bottom, right, bottom);
        if (x === c - 1 && cell.e) addWall(right, top, right, bottom);
      }
    }

    return {
      kind: 'maze', cols: c, rows: r, cellW: cellW, cellH: cellH,
      points: points, walls: walls,
      start: points[0], goal: points[points.length - 1],
      startCell: startCell, goalCell: goalCell
    };
  }

  function buildRings(points, count) {
    const rings = [];
    const n = Math.max(0, count || 0);
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1);
      const idx = U.clamp(Math.round(t * (points.length - 1)), 1, points.length - 2);
      rings.push({ x: points[idx].x, y: points[idx].y, index: idx, got: false });
    }
    return rings;
  }

  const Paths = (MA.Paths = {
    W: W,
    H: H,
    length: length,
    resample: resample,
    toPathD: toPathD,
    distanceToPolyline: distanceToPolyline,
    maze: maze,
    shapePoints: shapePoints,
    buildRings: buildRings,

    /**
     * Construye el escenario de un nivel de rutas.
     * @param {object} params parámetros del nivel (shape, maze, cols, rows, rings...)
     * @param {string} seed semilla estable por nivel
     */
    build: function (params, seed) {
      const p = params || {};
      const rnd = U.rng(U.hash(String(seed || 'mouse')) || 1);
      let scenario;
      if (p.maze) {
        scenario = maze(p.cols, p.rows, rnd);
      } else {
        const dense = p.points && p.points.length
          ? p.points.map(clampPoint)
          : shapePoints(p.shape || 'wave', rnd);
        const points = resample(dense, 14);
        scenario = {
          kind: 'curve', points: points, walls: [],
          start: points[0], goal: points[points.length - 1]
        };
      }
      scenario.total = length(scenario.points);
      scenario.d = toPathD(scenario.points);
      scenario.rings = buildRings(resample(scenario.points, 30), p.rings || 0);
      scenario.rings.forEach(function (r) {
        const hit = distanceToPolyline(r.x, r.y, scenario.points);
        r.index = hit.index;
      });
      scenario.allowedDeviations = p.maze
        ? Math.max(3, Math.round(scenario.total / 260))
        : Math.max(2, Math.round(scenario.total / 300));
      scenario.toleranceFactor = p.toleranceFactor || (p.maze ? 0.44 : 0);
      return scenario;
    },

    /** Tolerancia en unidades virtuales según el ancho del tablero en píxeles. */
    toleranceVirtual: function (params, scenario, boardWidthPx) {
      const p = params || {};
      const scale = (boardWidthPx || 800) / W;
      if (scenario.kind === 'maze') {
        const factor = p.toleranceFactor || 0.44;
        return Math.min(scenario.cellW, scenario.cellH) * factor;
      }
      return Math.max(14, (p.tolerance || 36) / Math.max(0.35, scale));
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
