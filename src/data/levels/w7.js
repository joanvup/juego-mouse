/* Mundo 7 — El laberinto de los exploradores
   Habilidad central: seguir caminos y moverse con control (sin reiniciar el nivel). */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;

  MA.LevelDefs[7] = [
    B.level(7, 1, {
      name: 'El sendero ancho',
      skill: 'trace', skills: ['hand-eye', 'move'],
      goal: 'Sigue el sendero desde la salida hasta la meta.',
      instructions: ['Pon la flecha en el círculo verde.', 'Avanza por el camino sin salirte.'],
      template: 'path', tutorial: 'path',
      params: { shape: 'wave', tolerance: 46, rings: 0, mode: 'follow' },
      hints: ['El sendero es ancho. Ve despacio y mira un poquito más adelante.']
    }),
    B.level(7, 2, {
      name: 'La pelota que rueda',
      skill: 'trace', skills: ['hand-eye', 'directions'],
      goal: 'Guía la pelota por el circuito completo.',
      instructions: ['La pelota avanza cuando la flecha sigue el camino.', 'Llega hasta la meta.'],
      template: 'path',
      params: { shape: 'loop', tolerance: 40, rings: 0, mode: 'ball', ballEmoji: '⚽' },
      hints: ['Si la pelota se queda quieta, acerca la flecha al camino.']
    }),
    B.level(7, 3, {
      name: 'Caminos curvos',
      skill: 'trace', skills: ['hand-eye', 'precision'],
      goal: 'Recorre el camino curvo y recoge 3 estrellas del camino.',
      instructions: ['El camino tiene curvas.', 'Pasa por las 3 estrellas y llega a la meta.'],
      template: 'path',
      params: { shape: 'bumps', tolerance: 34, rings: 3, mode: 'collect', ballEmoji: '🔵' },
      hints: ['Las estrellas están sobre el camino. Pasa por encima de ellas.']
    }),
    B.level(7, 4, {
      name: 'El primer laberinto',
      skill: 'maze', skills: ['trace', 'directions'],
      goal: 'Encuentra la salida del primer laberinto.',
      instructions: ['Mira el camino iluminado.', 'Sigue el pasillo hasta la bandera de meta.'],
      template: 'path',
      params: { maze: true, cols: 6, rows: 4, toleranceFactor: 0.52, rings: 0, mode: 'follow' },
      hints: ['Puedes devolverte si te equivocas. El nivel no se reinicia.']
    }),
    B.level(7, 5, {
      name: 'El río de las piedras',
      skill: 'trace', skills: ['precision', 'speed-control'],
      goal: 'Cruza el río por las piedras y recoge 4 estrellas.',
      instructions: ['El camino es más estrecho.', 'Avanza despacio y recoge las 4 estrellas.'],
      template: 'path',
      params: { shape: 'zigzag', tolerance: 26, rings: 4, mode: 'collect', ballEmoji: '🟢' },
      hints: ['Movimientos cortitos: si te apuras, te sales del camino.']
    }),
    B.level(7, 6, {
      name: 'El sendero estrecho',
      skill: 'hand-eye', skills: ['trace', 'precision'],
      goal: 'Recorre un camino estrecho sin salirte.',
      instructions: ['El camino es delgadito.', 'Mueve el mouse muy despacio y con calma.'],
      template: 'path',
      params: { shape: 'sCurve', tolerance: 24, rings: 2, mode: 'follow' },
      hints: ['Mira el borde del camino y mantén la flecha en el centro.']
    }),
    B.level(7, 7, {
      name: 'La cueva de los murciélagos',
      skill: 'maze', skills: ['trace', 'directions'],
      goal: 'Sal de la cueva recogiendo 3 estrellas.',
      instructions: ['La cueva tiene pasillos.', 'Sigue el camino y recoge las estrellas.'],
      template: 'path',
      params: { maze: true, cols: 8, rows: 5, toleranceFactor: 0.46, rings: 3, mode: 'collect', ballEmoji: '🟡' },
      hints: ['Si te sales, vuelve a entrar al camino por el lugar más cercano.']
    }),
    B.level(7, 8, {
      name: 'El río sinuoso',
      skill: 'trace', skills: ['hand-eye', 'precision', 'directions'],
      goal: 'Sigue el río que da vueltas y recoge 4 estrellas.',
      instructions: ['El camino da muchas vueltas.', 'No hay prisa: llega hasta el final.'],
      template: 'path',
      params: { shape: 'spiral', tolerance: 26, rings: 4, mode: 'collect', ballEmoji: '🔴' },
      hints: ['Las curvas cerradas se pasan mejor con movimientos lentos.']
    }),
    B.level(7, 9, {
      name: 'El laberinto del tesoro',
      skill: 'maze', skills: ['trace', 'precision'],
      goal: 'Encuentra el tesoro en un laberinto más grande.',
      instructions: ['El laberinto es más grande.', 'Sigue el camino y recoge 4 estrellas.'],
      template: 'path',
      params: { maze: true, cols: 10, rows: 6, toleranceFactor: 0.44, rings: 4, mode: 'collect', ballEmoji: '🟠' },
      hints: ['Puedes mirar el camino iluminado antes de empezar a moverte.']
    }),
    B.level(7, 10, {
      name: 'La salida del explorador',
      skill: 'maze', skills: ['trace', 'combine', 'hand-eye'],
      goal: 'Atraviesa el gran laberinto final y recoge 5 estrellas.',
      instructions: ['Este es el laberinto más grande del mundo.', 'Sigue el camino hasta la salida.'],
      template: 'path',
      params: { maze: true, cols: 11, rows: 7, toleranceFactor: 0.42, rings: 5, mode: 'collect', ballEmoji: '🟣' },
      hints: ['Respira. Los laberintos se resuelven paso a paso.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
