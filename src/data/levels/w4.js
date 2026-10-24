/* Mundo 4 — La fábrica de burbujas
   Habilidad central: coordinación mano-vista, control del tiempo y de la velocidad. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;
  const C = { rojo: '#e2474b', azul: '#2b7ff5', amarillo: '#f4c020', verde: '#2fae5e', morado: '#8a5ad6', rosado: '#ef5da8' };
  function it(emoji, label, color, correct) { return { emoji: emoji, label: label, color: color || null, correct: !!correct }; }

  MA.LevelDefs[4] = [
    B.level(4, 1, {
      name: 'Explota burbujas',
      skill: 'hand-eye', skills: ['click', 'reach'],
      goal: 'Explota 8 burbujas con un clic.',
      instructions: ['Las burbujas flotan quietecitas.', 'Haz clic para explotarlas.'],
      template: 'click',
      params: { count: 8, size: 102, style: 'bubble', emoji: '', label: 'burbuja', appear: 'one' },
      hints: ['Las burbujas no se mueven. Solo tienes que hacer clic encima.']
    }),
    B.level(4, 2, {
      name: 'Burbujas que suben',
      skill: 'hand-eye', skills: ['click', 'speed-control'],
      goal: 'Explota 8 burbujas que suben despacio.',
      instructions: ['Las burbujas suben poquito a poco.', 'Haz clic antes de que lleguen arriba.'],
      template: 'click',
      params: { count: 8, size: 92, style: 'bubble', emoji: '', label: 'burbuja', appear: 'one', moving: 30, axis: 'y' },
      hints: ['Mira la burbuja y acompaña su subida con la flecha.']
    }),
    B.level(4, 3, {
      name: 'La nube de burbujas',
      skill: 'hand-eye', skills: ['click', 'select'],
      goal: 'Explota 10 burbujas que flotan juntas.',
      instructions: ['Hay muchas burbujas al mismo tiempo.', 'Elige una, haz clic y sigue con otra.'],
      template: 'click',
      params: { count: 10, size: 86, style: 'bubble', emoji: '', label: 'burbuja', appear: 'all', moving: 26 },
      hints: ['No intentes seguirlas todas. Elige la más cercana.']
    }),
    B.level(4, 4, {
      name: 'Sigue la estrella',
      skill: 'reach', skills: ['hand-eye', 'click'],
      goal: 'Acierta en 10 estrellas que aparecen una por una.',
      instructions: ['Cada estrella aparece en otro sitio.', 'Lleva la flecha y haz clic.'],
      template: 'click',
      params: { count: 10, size: 88, style: 'star', emoji: '⭐', label: 'estrella', appear: 'one' },
      hints: ['La estrella espera por ti. No hay prisa.']
    }),
    B.level(4, 5, {
      name: 'Burbujas de colores',
      skill: 'select', skills: ['click', 'precision'],
      goal: 'Explota solo las 4 burbujas rojas.',
      instructions: ['Hay burbujas de muchos colores.', 'Toca únicamente las rojas.'],
      template: 'click',
      params: {
        count: 4, size: 84, style: 'bubble',
        items: [
          it('', 'burbuja roja', C.rojo, true), it('', 'burbuja roja', C.rojo, true),
          it('', 'burbuja roja', C.rojo, true), it('', 'burbuja roja', C.rojo, true),
          it('', 'burbuja azul', C.azul, false), it('', 'burbuja verde', C.verde, false),
          it('', 'burbuja amarilla', C.amarillo, false), it('', 'burbuja morada', C.morado, false),
          it('', 'burbuja rosada', C.rosado, false), it('', 'burbuja azul', C.azul, false),
          it('', 'burbuja verde', C.verde, false), it('', 'burbuja amarilla', C.amarillo, false)
        ]
      },
      hints: ['Fíjate en el color y no en el tamaño.']
    }),
    B.level(4, 6, {
      name: 'Mantén la burbuja',
      skill: 'hold', skills: ['hand-eye', 'move', 'click-vs-hold'],
      goal: 'Mantén la flecha dentro de 3 burbujas grandes.',
      instructions: ['Entra a la burbuja y no te muevas.', 'El aro se llena cuando la flecha se queda dentro.'],
      template: 'move',
      params: { count: 3, size: 156, layout: 'random', style: 'bubble', emoji: '', dwell: 1400, countVisible: 1, holdFactor: true },
      hints: ['Cuando el aro esté lleno, la burbuja se rompe y aparece otra.']
    }),
    B.level(4, 7, {
      name: 'Estrellas veloces',
      skill: 'speed-control', skills: ['hand-eye', 'click'],
      goal: 'Atrapa 8 estrellas que se mueven rápido.',
      instructions: ['Las estrellas se mueven más rápido.', 'Apunta y haz clic con seguridad.'],
      template: 'click',
      params: { count: 8, size: 80, style: 'star', emoji: '⭐', label: 'estrella', appear: 'all', moving: 66 },
      hints: ['Si te cuesta, pide ayuda: las estrellas se moverán más despacio.']
    }),
    B.level(4, 8, {
      name: 'La cadena de colores',
      skill: 'select', skills: ['click', 'precision', 'speed-control'],
      goal: 'Explota las burbujas en el orden de colores que se muestra.',
      instructions: ['Mira la tira de arriba.', 'Haz clic en el mismo orden: rojo, azul, amarillo, verde.'],
      template: 'sequence',
      params: {
        style: 'bubble', size: 96,
        cards: [
          { id: 'rojo', emoji: '', label: 'rojo', color: C.rojo },
          { id: 'azul', emoji: '', label: 'azul', color: C.azul },
          { id: 'amarillo', emoji: '', label: 'amarillo', color: C.amarillo },
          { id: 'verde', emoji: '', label: 'verde', color: C.verde }
        ],
        order: ['rojo', 'azul', 'amarillo', 'verde'],
        showNumbers: false
      },
      hints: ['La tira de arriba te recuerda el orden. Puedes mirarla otra vez.']
    }),
    B.level(4, 9, {
      name: 'Burbujas pequeñas',
      skill: 'small-target', skills: ['click', 'precision', 'hand-eye'],
      goal: 'Explota 10 burbujas pequeñitas en movimiento.',
      instructions: ['Las burbujas son pequeñas y flotan.', 'Ve despacio y apunta bien.'],
      template: 'click',
      params: { count: 10, size: 56, style: 'bubble', emoji: '', label: 'burbuja', appear: 'all', moving: 24 },
      hints: ['Con burbujas pequeñas funciona mejor moverse despacio.']
    }),
    B.level(4, 10, {
      name: 'El reto de la fábrica',
      skill: 'speed-control', skills: ['hand-eye', 'click', 'select'],
      goal: 'Explota 12 burbujas. El reloj es opcional y generoso.',
      instructions: ['Hay un reloj, pero no es obligatorio.', 'Si se acaba, puedes seguir practicando sin reloj.'],
      template: 'click', timeLimit: 100,
      params: { count: 12, size: 64, style: 'bubble', emoji: '', label: 'burbuja', appear: 'all', moving: 40 },
      hints: ['La precisión vale más que la velocidad. ¡No corras!']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
