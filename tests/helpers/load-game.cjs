/* Carga los módulos del juego en Node (sin navegador) para las pruebas. */
'use strict';
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const CORE_FILES = [
  'src/core/utils.js',
  'src/core/storage.js',
  'src/core/audio.js'
];

const DATA_FILES = [
  'src/data/worlds.js',
  'src/data/skills.js',
  'src/data/avatars.js',
  'src/data/levels/shared.js',
  'src/data/levels/w1.js',
  'src/data/levels/w2.js',
  'src/data/levels/w3.js',
  'src/data/levels/w4.js',
  'src/data/levels/w5.js',
  'src/data/levels/w6.js',
  'src/data/levels/w7.js',
  'src/data/levels/w8.js',
  'src/data/levels/w9.js',
  'src/data/levels/w10.js'
];

const LOGIC_FILES = [
  'src/core/scoring.js',
  'src/core/progress.js'
];

const ENGINE_FILES = [
  'src/engine/paths.js',
  'src/engine/engine.js',
  'src/engine/templates/move.js',
  'src/engine/templates/click.js',
  'src/engine/templates/sequence.js',
  'src/engine/templates/drag.js',
  'src/engine/templates/path.js',
  'src/engine/templates/wheel.js',
  'src/engine/templates/mission.js'
];

function loadGame() {
  const all = CORE_FILES.concat(DATA_FILES, LOGIC_FILES, ENGINE_FILES);
  all.forEach(function (rel) {
    require(path.join(ROOT, rel));
  });
  const MA = globalThis.MA;
  MA.Levels.load();
  return MA;
}

module.exports = { loadGame: loadGame, ROOT: ROOT, FILES: CORE_FILES.concat(DATA_FILES, LOGIC_FILES, ENGINE_FILES) };
