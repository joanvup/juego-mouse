/* Mundo 3 — El jardín de la precisión
   Habilidad central: puntería y elección del objetivo correcto. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;
  const C = { rojo: '#e2474b', azul: '#2b7ff5', amarillo: '#f4c020', verde: '#2fae5e', morado: '#8a5ad6', rosado: '#ef5da8' };
  function it(emoji, label, color, correct) { return { emoji: emoji, label: label, color: color || null, correct: !!correct }; }

  MA.LevelDefs[3] = [
    B.level(3, 1, {
      name: 'Riega las flores',
      skill: 'precision', skills: ['click', 'reach'],
      goal: 'Haz clic en las 6 flores del jardín.',
      instructions: ['Primero pon la flecha sobre la flor.', 'Después haz clic. ¡Así de fácil!'],
      template: 'click',
      params: { count: 6, size: 94, style: 'flower', emoji: '🌸', label: 'flor', appear: 'all', guidedTargets: 2, dwellFirst: 320 },
      hints: ['Flecha encima, clic suave. Flecha encima, clic suave.']
    }),
    B.level(3, 2, {
      name: 'Flores de un color',
      skill: 'select', skills: ['precision', 'click'],
      goal: 'Toca solo las 4 flores amarillas.',
      instructions: ['Hay flores de muchos colores.', 'Haz clic únicamente en las amarillas.'],
      template: 'click',
      params: {
        count: 4, size: 88, style: 'flower',
        items: [
          it('🌻', 'flor amarilla', C.amarillo, true), it('🌻', 'flor amarilla', C.amarillo, true),
          it('🌻', 'flor amarilla', C.amarillo, true), it('🌻', 'flor amarilla', C.amarillo, true),
          it('🌷', 'tulipán rojo', C.rojo, false), it('🌷', 'tulipán rojo', C.rojo, false),
          it('🌸', 'flor rosada', C.rosado, false), it('🌺', 'flor rosada', C.rosado, false),
          it('🌼', 'margarita blanca', '#f7f4e8', false), it('🌸', 'flor rosada', C.rosado, false)
        ]
      },
      hints: ['Las flores amarillas se ven como el sol. Las demás no cuentan.']
    }),
    B.level(3, 3, {
      name: 'Recoge las gotas',
      skill: 'precision', skills: ['click', 'small-target'],
      goal: 'Recoge 8 gotas de agua con un clic.',
      instructions: ['Las gotas son pequeñitas.', 'Mueve la flecha despacio hasta la gota.'],
      template: 'click',
      params: { count: 8, size: 74, style: 'drop', emoji: '💧', label: 'gota', appear: 'one' },
      hints: ['Acércate a la gota y frena antes de hacer clic.']
    }),
    B.level(3, 4, {
      name: 'Insectos inquietos',
      skill: 'hand-eye', skills: ['click', 'precision'],
      goal: 'Toca 6 insectos que se mueven despacio.',
      instructions: ['Los insectos caminan despacio.', 'Sigue a uno y haz clic encima.'],
      template: 'click',
      params: { count: 6, size: 80, style: 'insect', emojis: ['🐞', '🦋', '🐝', '🐜', '🦗', '🐛'], label: 'insecto', appear: 'all', moving: 38 },
      hints: ['Sigue al insecto con la flecha antes de hacer clic.']
    }),
    B.level(3, 5, {
      name: 'Encuentra el caracol',
      skill: 'select', skills: ['precision', 'small-target', 'click'],
      goal: 'Encuentra y toca los 4 caracoles escondidos.',
      instructions: ['Los caracoles se esconden entre las plantas.', 'Busca con calma y haz clic en cada uno.'],
      template: 'click',
      params: {
        count: 4, size: 66, style: 'insect',
        items: [
          it('🐌', 'caracol', null, true), it('🐌', 'caracol', null, true),
          it('🐌', 'caracol', null, true), it('🐌', 'caracol', null, true),
          it('🌿', 'hoja', C.verde, false), it('🌿', 'hoja', C.verde, false),
          it('🍃', 'hoja', C.verde, false), it('🍄', 'hongo', null, false),
          it('🌱', 'brote', C.verde, false), it('🍀', 'trébol', C.verde, false),
          it('🌾', 'pasto', null, false), it('🌳', 'árbol', null, false)
        ]
      },
      hints: ['El caracol tiene su casa en la espalda. ¡Se mueve muy despacio!']
    }),
    B.level(3, 6, {
      name: 'Objetivos medianos',
      skill: 'precision', skills: ['click', 'small-target'],
      goal: 'Acierta en 8 flores cada vez más pequeñas.',
      instructions: ['Empieza por la flor grande.', 'Cada flor nueva es un poquito más pequeña.'],
      template: 'click',
      params: { count: 8, size: 84, sizeEnd: 62, style: 'flower', emoji: '🌻', label: 'flor', appear: 'one' },
      hints: ['Mueve el mouse despacio cuando la flor sea pequeña.']
    }),
    B.level(3, 7, {
      name: 'Mariposas lentas',
      skill: 'hand-eye', skills: ['click', 'speed-control'],
      goal: 'Atrapa 7 mariposas que vuelan despacio.',
      instructions: ['Las mariposas vuelan de un lado a otro.', 'Acompaña su vuelo y haz clic.'],
      template: 'click',
      params: { count: 7, size: 76, style: 'insect', emoji: '🦋', label: 'mariposa', appear: 'all', moving: 46 },
      hints: ['Las mariposas cambian de dirección. Mira hacia dónde van.']
    }),
    B.level(3, 8, {
      name: 'El color y la forma',
      skill: 'select', skills: ['precision', 'click'],
      goal: 'Toca solo los 3 girasoles amarillos.',
      instructions: ['Hay flores parecidas, pero solo los girasoles son amarillos.', 'Fíjate en el color y en la forma.'],
      template: 'click',
      params: {
        count: 3, size: 82, style: 'flower',
        items: [
          it('🌻', 'girasol amarillo', C.amarillo, true), it('🌻', 'girasol amarillo', C.amarillo, true),
          it('🌻', 'girasol amarillo', C.amarillo, true),
          it('🌷', 'tulipán rojo', C.rojo, false), it('🌷', 'tulipán rojo', C.rojo, false),
          it('🌼', 'margarita blanca', '#f7f4e8', false), it('🌺', 'flor rosada', C.rosado, false),
          it('🌸', 'flor rosada', C.rosado, false), it('🌼', 'margarita blanca', '#f7f4e8', false)
        ]
      },
      hints: ['El girasol es redondo y amarillo, con el centro cafecito.']
    }),
    B.level(3, 9, {
      name: 'Precisión fina',
      skill: 'small-target', skills: ['precision', 'click'],
      goal: 'Acierta en 8 objetivos pequeñitos.',
      instructions: ['Los objetivos son pequeños.', 'Mueve el mouse muy despacio y haz clic justo encima.'],
      template: 'click',
      params: { count: 8, size: 58, style: 'flower', emojis: ['🌸', '🌼', '🌺', '🌷'], label: 'flor pequeña', appear: 'one' },
      hints: ['Si te cuesta, usa el botón de ayuda: los objetivos se hacen más grandes un ratito.']
    }),
    B.level(3, 10, {
      name: 'El jardín perfecto',
      skill: 'precision', skills: ['hand-eye', 'click', 'select'],
      goal: 'Completa el jardín tocando 10 flores y mariposas.',
      instructions: ['El jardín está casi listo.', 'Toca cada objetivo con cuidado.'],
      template: 'click',
      params: { count: 10, size: 64, style: 'flower', emojis: ['🌸', '🌼', '🦋', '🌻', '🌷', '🐝', '🌺', '🌸', '🌼', '🌻'], label: 'objetivo', appear: 'all', moving: 34 },
      hints: ['Los objetivos que se mueven van despacio. Respira y apunta.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
