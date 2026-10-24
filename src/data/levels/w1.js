/* Mundo 1 — El bosque de los primeros movimientos
   Habilidad central: mover el cursor y llegar a los objetos. Sin clics. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;

  MA.LevelDefs[1] = [
    B.level(1, 1, {
      name: 'La mariposa curiosa',
      skill: 'mouse-basics', skills: ['move'],
      goal: 'Mueve el mouse para llevar la mariposa hasta las 3 flores.',
      instructions: ['Apoya la mano sobre el mouse.', 'Mueve el mouse despacio y mira cómo vuela la mariposa.'],
      template: 'move', tutorial: 'move',
      params: { count: 3, size: 150, layout: 'random', emoji: '🌸', carry: true, carryEmoji: '🦋', dwell: 0 },
      hints: ['La mariposa vuela cerquita de la flecha. Mueve el mouse sin apurarte.']
    }),
    B.level(1, 2, {
      name: 'Sigue la estrella',
      skill: 'move', skills: ['reach', 'hand-eye'],
      goal: 'Lleva la flecha hasta la estrella y espera un momento.',
      instructions: ['Mueve la flecha hasta la estrella.', 'Quédate un momento sobre ella hasta que se ilumine.'],
      template: 'move',
      params: { count: 5, size: 124, layout: 'random', emoji: '⭐', dwell: 260, countVisible: 1 },
      hints: ['No necesitas hacer clic: solo dejar la flecha encima de la estrella.']
    }),
    B.level(1, 3, {
      name: 'Saluda a los amigos',
      skill: 'reach', skills: ['move', 'hand-eye'],
      goal: 'Visita a los 6 animalitos del bosque con la flecha.',
      instructions: ['Mueve la flecha hasta cada animalito.', 'Cuando lo toques, te saludará.'],
      template: 'move',
      params: { count: 6, size: 112, layout: 'random', emojis: ['🐿️', '🦊', '🐰', '🦉', '🐻', '🦌'], dwell: 120, countVisible: 2 },
      hints: ['Mira el animalito y luego mueve la mano hacia él.']
    }),
    B.level(1, 4, {
      name: 'Las cuatro esquinas',
      skill: 'hold', skills: ['move', 'reach', 'click-vs-hold'],
      goal: 'Lleva la flecha a cada esquina y mantente dentro.',
      instructions: ['Cada esquina tiene un aro mágico.', 'Entra al aro y espera a que se complete el círculo.'],
      template: 'move',
      params: { count: 4, size: 140, layout: 'corners', emoji: '🍄', dwell: 500 },
      hints: ['Cuando entres al aro, deja el mouse quietecito hasta que se ilumine.']
    }),
    B.level(1, 5, {
      name: 'El camino de las setas',
      skill: 'directions', skills: ['move', 'reach'],
      goal: 'Toca las 6 setas que están en línea, de izquierda a derecha.',
      instructions: ['Mueve la flecha en línea recta.', 'Toca todas las setas sin apurarte.'],
      template: 'move',
      params: { count: 6, size: 98, layout: 'row', emojis: ['🍄', '🍄', '🍄', '🍄', '🍄', '🍄'], dwell: 120, countVisible: 2 },
      hints: ['Mueve el mouse hacia un lado, despacio y en línea recta.']
    }),
    B.level(1, 6, {
      name: 'Sube y baja con el búho',
      skill: 'directions', skills: ['move', 'hand-eye'],
      goal: 'Visita a los 6 búhos, arriba y abajo del bosque.',
      instructions: ['Algunos búhos están arriba y otros abajo.', 'Mueve el mouse hacia arriba y hacia abajo.'],
      template: 'move',
      params: { count: 6, size: 100, layout: 'grid', emojis: ['🦉', '🐦', '🦉', '🐦', '🦉', '🐦'], dwell: 140, countVisible: 2 },
      hints: ['Para subir, mueve el mouse hacia arriba; para bajar, hacia abajo.']
    }),
    B.level(1, 7, {
      name: 'La ronda de las luciérnagas',
      skill: 'hand-eye', skills: ['move', 'reach'],
      goal: 'Toca las 8 luciérnagas que hacen una ronda.',
      instructions: ['Las luciérnagas están en círculo.', 'Mueve la flecha de una en una.'],
      template: 'move',
      params: { count: 8, size: 88, layout: 'ring', emojis: ['✨', '🌟', '💫', '⭐', '✨', '🌟', '💫', '⭐'], dwell: 150, countVisible: 3 },
      hints: ['Sigue el círculo con la flecha, sin saltar de una punta a la otra.']
    }),
    B.level(1, 8, {
      name: 'La estrella fugaz',
      skill: 'hand-eye', skills: ['move', 'speed-control'],
      goal: 'Atrapa la estrella que se mueve despacio, 6 veces.',
      instructions: ['La estrella se mueve despacio.', 'Sigue su camino con la flecha y tócala.'],
      template: 'move',
      params: { count: 6, size: 104, layout: 'random', emoji: '🌟', dwell: 120, countVisible: 1, motion: 55 },
      hints: ['Adivina hacia dónde va la estrella y acompaña su movimiento.']
    }),
    B.level(1, 9, {
      name: 'El bosque numerado',
      skill: 'reach', skills: ['move', 'directions'],
      goal: 'Toca los árboles en orden: 1, 2, 3, 4, 5 y 6.',
      instructions: ['Los árboles tienen un número.', 'Tócalos en orden, empezando por el 1.'],
      template: 'move',
      params: { count: 6, size: 92, layout: 'cluster', emoji: '🌳', order: true, labels: true, dwell: 120, countVisible: 6 },
      hints: ['Busca primero el número 1 y luego el 2.']
    }),
    B.level(1, 10, {
      name: 'La fiesta del bosque',
      skill: 'hand-eye', skills: ['move', 'reach', 'directions'],
      goal: 'Visita los 10 amigos de la fiesta con la flecha.',
      instructions: ['Todos los amigos están celebrando.', 'Tócalos uno por uno, sin prisa.'],
      template: 'move',
      params: {
        count: 10, size: 82, layout: 'random', dwell: 220, countVisible: 3,
        emojis: ['🍄', '🦋', '⭐', '🌼', '🐿️', '🌻', '🦊', '🐰', '🍁', '🦉']
      },
      hints: ['Puedes empezar por el que esté más cerca de la flecha.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
