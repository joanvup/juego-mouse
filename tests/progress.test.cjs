'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

/* Simula localStorage antes de cargar el almacenamiento del juego. */
class MemStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(String(k), String(v)); }
  removeItem(k) { this.map.delete(String(k)); }
  clear() { this.map.clear(); }
  get length() { return this.map.size; }
}
globalThis.localStorage = new MemStorage();

const { loadGame } = require('./helpers/load-game.cjs');
const MA = loadGame();
require('../src/core/store.js');

test('el almacenamiento guarda y recupera el estado', () => {
  MA.Storage.save({ version: 1, profiles: {}, settings: {}, teacher: { pinHash: 'x' }, meta: { sessions: 1 } });
  const loaded = MA.Storage.load();
  assert.ok(loaded);
  assert.equal(loaded.version, 1);
});

test('los datos dañados se recuperan desde la copia de seguridad', () => {
  MA.Storage.save({ version: 1, profiles: { A: { code: 'A' } }, settings: {}, teacher: { pinHash: 'x' } });
  MA.Storage.save({ version: 1, profiles: { B: { code: 'B' } }, settings: {}, teacher: { pinHash: 'x' } });
  localStorage.setItem(MA.Storage.KEY, '{esto no es json');
  const loaded = MA.Storage.load();
  assert.ok(loaded);
  assert.ok(loaded.profiles.A, 'recuperó el respaldo');
  assert.ok(MA.Storage.lastError);
});

test('la migración completa perfiles incompletos', () => {
  const migrated = MA.Storage.migrate({ profiles: { X: {} }, settings: {} });
  assert.equal(migrated.version, MA.Storage.SCHEMA_VERSION);
  assert.equal(migrated.profiles.X.code, 'X');
  assert.deepEqual(migrated.profiles.X.avatar.accessories, []);
});

test('exportar e importar un respaldo conserva los perfiles', () => {
  const state = { version: 1, activeProfile: 'P1', profiles: { P1: { code: 'P1', name: 'Ana', levels: {}, skills: {}, totals: {} } }, settings: { sfx: 0.5 }, teacher: { pinHash: 'h1' }, meta: {} };
  MA.Storage.save(state);
  const text = MA.Storage.exportText(state);
  const res = MA.Storage.importText(text);
  assert.equal(res.ok, true);
  assert.ok(res.state.profiles.P1);
  const bad = MA.Storage.importText('{"foo":1}');
  assert.equal(bad.ok, false);
});

test('Store crea perfiles, guarda progreso y verifica el PIN', () => {
  localStorage.clear();
  MA.Store.init();
  const p = MA.Store.createProfile({ code: '1A-01', name: 'Ana', character: 'luna' });
  assert.equal(p.code, '1A-01');
  assert.equal(MA.Store.profile().code, '1A-01');
  assert.equal(MA.Store.checkPin('9513'), true);
  assert.equal(MA.Store.checkPin('0000'), false);
  const res = MA.Store.setPin('5678');
  assert.equal(res.ok, true);
  assert.equal(MA.Store.checkPin('5678'), true);
  assert.equal(MA.Store.checkPin('9513'), false);
  assert.equal(MA.Store.pinIsDefault(), false);
});

test('completar los 100 niveles otorga medallas, monedas y diploma', () => {
  localStorage.clear();
  MA.Store.init();
  const p = MA.Store.createProfile({ code: 'TEST-100', name: 'Prueba', character: 'mimo' });
  MA.Store.setActiveProfile(p.code);
  MA.Levels.all().forEach((level) => {
    MA.Store.startLevel(level.id);
    const metrics = {
      timeMs: 20000,
      hints: 0,
      clicks: { total: 10, correct: 9, wrong: 1 },
      targets: { total: 5, done: 5 },
      drags: { total: 5, ok: 5, wrong: 0 },
      deviations: 0,
      allowedDeviations: 3,
      rings: { total: 2, got: 2 },
      travel: 100,
      ideal: 100,
      stages: [0.9, 0.8],
      wheel: { target: 100, reached: 100 }
    };
    const result = MA.Scoring.result(level, metrics);
    MA.Store.finishLevel(level, result);
  });
  const profile = MA.Store.profile();
  assert.equal(MA.Progress.completedCount(profile), 100);
  assert.equal(MA.Progress.completedWorlds(profile).length, 10);
  assert.equal(profile.badges.length, 10);
  assert.ok(profile.coins > 1000, 'monedas ganadas: ' + profile.coins);
  assert.ok(MA.Progress.totalStars(profile) >= 200);
  assert.equal(Object.keys(profile.chests).length, 10);
  const diploma = MA.Progress.diploma(profile);
  assert.equal(diploma.completed, true);
  assert.equal(diploma.completedLevels, 100);
});

test('las recompensas no se duplican al repetir un nivel', () => {
  localStorage.clear();
  MA.Store.init();
  const p = MA.Store.createProfile({ code: 'REP-1', character: 'mimo' });
  MA.Store.setActiveProfile(p.code);
  const level = MA.Levels.first();
  const metrics = {
    timeMs: 10000, hints: 0,
    clicks: { total: 0, correct: 0, wrong: 0 },
    targets: { total: 3, done: 3 },
    drags: { total: 0, ok: 0, wrong: 0 },
    deviations: 0, rings: { total: 0, got: 0 }, travel: 100, ideal: 100, stages: []
  };
  const first = MA.Store.finishLevel(level, MA.Scoring.result(level, metrics));
  const coinsAfterFirst = MA.Store.profile().coins;
  assert.equal(first.first, true);
  assert.ok(coinsAfterFirst > 0);
  const second = MA.Store.finishLevel(level, MA.Scoring.result(level, metrics));
  assert.equal(second.first, false);
  assert.equal(MA.Store.profile().coins, coinsAfterFirst, 'sin monedas duplicadas');
  assert.equal(second.coins, 0);
});

test('un perfil nuevo no tiene niveles desbloqueados más allá del primero', () => {
  localStorage.clear();
  MA.Store.init();
  const p = MA.Store.createProfile({ code: 'NEW-1', character: 'mimo' });
  const levels = MA.Levels.all();
  assert.equal(MA.Progress.levelStatus(p, levels[0]).status, 'available');
  assert.equal(MA.Progress.levelStatus(p, levels[1]).status, 'locked');
  assert.equal(MA.Progress.levelStatus(p, levels[10]).status, 'locked');
  const first = MA.Progress.nextPlayable(p);
  assert.equal(first.id, levels[0].id);
});

test('al completar un nivel se desbloquea el siguiente', () => {
  localStorage.clear();
  MA.Store.init();
  const p = MA.Store.createProfile({ code: 'UNLOCK-1', character: 'mimo' });
  const levels = MA.Levels.all();
  const metrics = {
    timeMs: 8000, hints: 0,
    clicks: { total: 3, correct: 3, wrong: 0 },
    targets: { total: 3, done: 3 },
    drags: { total: 0, ok: 0, wrong: 0 },
    deviations: 0, rings: { total: 0, got: 0 }, travel: 0, ideal: 0, stages: []
  };
  MA.Progress.award(p, levels[0], MA.Scoring.result(levels[0], metrics));
  assert.equal(MA.Progress.levelStatus(p, levels[1]).status, 'available');
  assert.equal(MA.Progress.isCompleted(p, levels[0].id), true);
});

test('las habilidades suben de estado con evidencia en varios niveles', () => {
  localStorage.clear();
  MA.Store.init();
  const p = MA.Store.createProfile({ code: 'SKILL-1', character: 'mimo' });
  const clickLevels = MA.Levels.all().filter((l) => l.skill === 'click').slice(0, 5);
  assert.ok(clickLevels.length >= 3);
  clickLevels.forEach((level) => {
    MA.Progress.award(p, level, { stars: 3, score: 300, precision: 0.95, timeMs: 1000, hints: 0, metrics: { clicks: { correct: 5, wrong: 0 }, targets: { total: 5, done: 5 }, drags: { ok: 0, wrong: 0 }, deviations: 0 } });
  });
  assert.equal(MA.Progress.skillState(p, 'click'), 'mastered');
  const rec = MA.Progress.skillRecords(p).filter((r) => r.id === 'click')[0];
  assert.ok(rec.levels >= 5);
});

test('el perfil compra y equipa accesorios con monedas virtuales', () => {
  localStorage.clear();
  MA.Store.init();
  const p = MA.Store.createProfile({ code: 'SHOP-1', character: 'mimo' });
  p.coins = 500;
  const acc = MA.Avatars.accessories.filter((a) => a.price > 0)[0];
  const res = MA.Progress.buyAccessory(p, acc.id);
  assert.equal(res.ok, true);
  assert.equal(p.coins, 500 - acc.price);
  assert.equal(MA.Progress.buyAccessory(p, acc.id).ok, false);
  assert.equal(MA.Progress.equipAccessory(p, acc.id, true), true);
  assert.ok(p.avatar.accessories.indexOf(acc.id) >= 0);
});

test('los personajes se desbloquean al completar mundos', () => {
  const p = MA.Progress.newProfile({ code: 'CH-1', character: 'mimo' });
  assert.deepEqual(MA.Progress.unlockedCharacters(p).sort(), ['luna', 'mimo']);
  for (let w = 1; w <= 2; w++) {
    MA.Levels.byWorld(w).forEach((lv) => {
      MA.Progress.award(p, lv, { stars: 2, score: 200, precision: 0.7, timeMs: 5000, hints: 0, metrics: {} });
    });
  }
  assert.ok(MA.Progress.unlockedCharacters(p).indexOf('tico') >= 0);
});

test('el resumen docente y el detalle se construyen sin errores', () => {
  const summary = MA.Store.studentsSummary();
  assert.ok(Array.isArray(summary));
  const code = summary.length ? summary[0].code : null;
  if (code) {
    const detail = MA.Store.studentDetail(code);
    assert.equal(detail.levels.length, 100);
    assert.equal(detail.worlds.length, 10);
    assert.equal(detail.skills.length, Object.keys(MA.Skills.all).length);
  }
  assert.ok(Array.isArray(MA.Store.hardestLevels()));
  assert.ok(typeof MA.Store.classSummary().students === 'number');
});
