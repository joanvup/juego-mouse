'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load-game.cjs');

const MA = loadGame();

test('existen exactamente 100 niveles en 10 mundos', () => {
  const levels = MA.Levels.all();
  assert.equal(levels.length, 100);
  for (let w = 1; w <= 10; w++) {
    assert.equal(MA.Levels.byWorld(w).length, 10, 'mundo ' + w);
  }
});

test('los identificadores son únicos y ordenados', () => {
  const ids = new Set();
  MA.Levels.all().forEach((lv, i) => {
    assert.match(lv.id, /^w\d{1,2}l\d{1,2}$/);
    assert.equal(ids.has(lv.id), false);
    ids.add(lv.id);
    assert.equal(lv.difficulty, i + 1);
    assert.equal(lv.world, Math.floor(i / 10) + 1);
    assert.equal(lv.index, (i % 10) + 1);
  });
});

test('la validación estructural no reporta errores', () => {
  const v = MA.Levels.validate();
  assert.deepEqual(v.errors, []);
  assert.equal(v.ok, true);
  assert.ok(v.stats.templates.move >= 10);
  assert.ok(Object.keys(v.stats.templates).length >= 6);
});

test('todos los niveles tienen objetivo, instrucciones, pistas y recompensa', () => {
  MA.Levels.all().forEach((lv) => {
    assert.ok(lv.name && lv.name.length > 3, lv.id + ' nombre');
    assert.ok(lv.goal && lv.goal.length > 8, lv.id + ' objetivo');
    assert.ok(lv.instructions.length >= 1, lv.id + ' instrucciones');
    lv.instructions.forEach((t) => assert.ok(t.length > 4 && t.length < 180, lv.id + ' instrucción larga'));
    assert.ok(lv.hints.length >= 2, lv.id + ' pistas');
    assert.ok(lv.goal.length < 160, lv.id + ' objetivo demasiado largo');
    assert.ok(lv.rewards.coins >= 10, lv.id + ' monedas');
    assert.ok(['move', 'click', 'sequence', 'drag', 'path', 'wheel', 'mission'].includes(lv.template));
    assert.ok(lv.skills.length >= 1);
    lv.skills.forEach((s) => assert.ok(MA.Skills.all[s], lv.id + ' habilidad ' + s));
    assert.ok(MA.Skills.all[lv.skill], lv.id + ' habilidad principal');
    assert.ok(lv.win && lv.win.type, lv.id + ' sin regla de victoria');
    if (lv.win.required !== undefined) assert.ok(lv.win.required > 0, lv.id + ' victoria sin cantidad');
    assert.ok(lv.win.description && lv.win.description.length > 10, lv.id + ' victoria sin descripción');
  });
});

test('cada mundo trabaja su mecánica principal', () => {
  const mainOf = (w) => MA.Levels.byWorld(w).map((l) => l.template);
  assert.ok(mainOf(1).every((t) => t === 'move'), 'mundo 1 solo movimiento');
  assert.equal(mainOf(7).filter((t) => t === 'path').length, 10, 'mundo 7 rutas');
  assert.equal(mainOf(6).filter((t) => t === 'drag').length, 10, 'mundo 6 arrastre');
  assert.ok(mainOf(8).some((t) => t === 'mission'), 'mundo 8 combina');
  assert.ok(mainOf(9).some((t) => t === 'wheel'), 'mundo 9 rueda');
  assert.ok(mainOf(10).filter((t) => t === 'mission').length >= 2, 'mundo 10 misiones');
});

test('las 20 habilidades del currículo están cubiertas', () => {
  const covered = MA.Levels.skillsCovered();
  const missing = Object.keys(MA.Skills.all).filter((s) => covered.indexOf(s) < 0);
  assert.deepEqual(missing, []);
});

test('la dificultad crece por mundo y la primera actividad es muy fácil', () => {
  const first = MA.Levels.first();
  assert.equal(first.template, 'move');
  assert.equal(first.params.count, 3);
  assert.ok(first.params.size >= 120);
  assert.equal(first.params.dwell, 0);
  for (let w = 1; w <= 10; w++) {
    const levels = MA.Levels.byWorld(w);
    for (let i = 1; i < levels.length; i++) {
      assert.ok(levels[i].difficulty >= levels[i - 1].difficulty);
    }
  }
  assert.ok(MA.Levels.byWorld(10)[9].difficulty === 100);
  assert.ok(MA.Levels.byWorld(10)[9].template === 'mission');
});

test('los niveles de clic tienen objetivos correctos y datos completos', () => {
  MA.Levels.all().filter((l) => l.template === 'click').forEach((lv) => {
    const p = lv.params;
    if (p.items) {
      assert.ok(p.items.some((i) => i.correct), lv.id);
      p.items.forEach((i) => {
        assert.ok(typeof i.emoji === 'string', lv.id + ' emoji');
        assert.ok(i.label, lv.id + ' etiqueta');
      });
    } else {
      assert.ok(p.count > 0, lv.id);
      assert.ok(p.emoji || (p.emojis && p.emojis.length) || p.style === 'bubble', lv.id + ' emoji del objetivo');
    }
  });
});

test('los niveles de arrastre tienen zonas que aceptan sus piezas', () => {
  MA.Levels.all().filter((l) => l.template === 'drag').forEach((lv) => {
    const ids = lv.params.items.map((i) => i.id);
    const accepted = [].concat.apply([], lv.params.zones.map((z) => z.accepts));
    ids.forEach((id) => assert.ok(accepted.indexOf(id) >= 0, lv.id + ' pieza ' + id));
    assert.equal(new Set(ids).size, ids.length, lv.id + ' ids de pieza únicos');
    lv.params.zones.forEach((z) => {
      assert.ok(z.x >= 0 && z.x <= 1, lv.id + ' x de zona');
      assert.ok(z.y >= 0 && z.y <= 1, lv.id + ' y de zona');
      assert.ok(z.size >= 60, lv.id + ' tamaño de zona');
    });
  });
});

test('los niveles de misión tienen etapas válidas y con parámetros', () => {
  MA.Levels.all().filter((l) => l.template === 'mission').forEach((lv) => {
    assert.ok(lv.params.stages.length >= 2, lv.id);
    lv.params.stages.forEach((st) => {
      assert.ok(MA.Templates.get(st.template), lv.id + ' plantilla de etapa');
      assert.ok(st.params && typeof st.params === 'object', lv.id + ' params de etapa');
      assert.ok(st.title && st.instruction, lv.id + ' textos de etapa');
    });
  });
});

test('los laberintos tienen medidas razonables y estrellas de camino', () => {
  const mazes = MA.Levels.all().filter((l) => l.template === 'path' && l.params.maze);
  assert.ok(mazes.length >= 5, 'hay laberintos en varios mundos');
  mazes.forEach((lv) => {
    assert.ok(lv.params.cols >= 5 && lv.params.rows >= 4, lv.id);
    assert.ok(lv.params.rings >= 0);
    const scenario = MA.Paths.build(lv.params, lv.id);
    assert.ok(scenario.points.length > 10, lv.id + ' camino demasiado corto');
    assert.ok(scenario.walls.length > 10, lv.id + ' sin paredes');
  });
});

test('los tutoriales son breves y tienen pasos', () => {
  MA.Levels.all().filter((l) => l.tutorial).forEach((lv) => {
    assert.ok(lv.tutorial.kind, lv.id);
    assert.ok(lv.tutorial.title, lv.id);
    assert.ok(Array.isArray(lv.tutorial.steps) && lv.tutorial.steps.length >= 2, lv.id);
  });
  const withTutorial = MA.Levels.all().filter((l) => l.tutorial);
  assert.ok(withTutorial.length >= 6);
});
