/* Genera docs/NIVELES.md con el índice de los 100 niveles. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('../tests/helpers/load-game.cjs');

const MA = loadGame();
const TEMPLATE_NAME = {
  move: 'Mover el cursor',
  click: 'Clic',
  sequence: 'Secuencia',
  drag: 'Arrastrar y soltar',
  path: 'Ruta o laberinto',
  wheel: 'Rueda del mouse',
  mission: 'Misión combinada'
};

const lines = [];
lines.push('# Los 100 niveles de Mouse Aventura');
lines.push('');
lines.push('Cada mundo tiene 10 niveles con objetivos, reglas y condiciones de victoria propias.');
lines.push('La dificultad sube poco a poco y cada nivel se desbloquea al completar el anterior.');
lines.push('');
lines.push('| # | Mundo | Nivel | Nombre | Mecánica | Habilidad principal | Objetivo |');
lines.push('|---:|---|---:|---|---|---|---|');
MA.Levels.all().forEach(function (lv, i) {
  const skill = MA.Skills.get(lv.skill);
  lines.push([
    i + 1,
    'M' + lv.world + ' · ' + MA.Worlds.get(lv.world).short,
    lv.index,
    lv.name,
    TEMPLATE_NAME[lv.template] || lv.template,
    skill.name,
    lv.goal
  ].map(function (cell) { return String(cell).replace(/\|/g, '\\|'); }).join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
});

lines.push('');
lines.push('## Distribución por mecánica');
lines.push('');
const byTemplate = {};
MA.Levels.all().forEach(function (lv) { byTemplate[lv.template] = (byTemplate[lv.template] || 0) + 1; });
Object.keys(byTemplate).forEach(function (key) {
  lines.push('- ' + (TEMPLATE_NAME[key] || key) + ': ' + byTemplate[key] + ' niveles');
});
lines.push('');
lines.push('## Habilidades trabajadas');
lines.push('');
MA.Skills.list().forEach(function (id) {
  const count = MA.Levels.all().filter(function (lv) { return lv.skills.indexOf(id) >= 0; }).length;
  const info = MA.Skills.get(id);
  lines.push('- ' + info.emoji + ' **' + info.name + '**: ' + count + ' niveles');
});
lines.push('');
lines.push('_Documento generado automáticamente desde `src/data/levels/`._');
lines.push('');

const out = path.join(__dirname, '..', 'docs', 'NIVELES.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log('Generado', out, 'con', MA.Levels.count(), 'niveles.');
