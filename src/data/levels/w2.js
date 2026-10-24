/* Mundo 2 — La isla de los clics mágicos
   Habilidad central: colocar la flecha y hacer un clic con el botón izquierdo. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;
  const C = { rojo: '#e2474b', azul: '#2b7ff5', amarillo: '#f4c020', verde: '#2fae5e', morado: '#8a5ad6', rosado: '#ef5da8' };
  function it(emoji, label, color, correct) { return { emoji: emoji, label: label, color: color || null, correct: !!correct }; }

  MA.LevelDefs[2] = [
    B.level(2, 1, {
      name: 'El globo mágico',
      skill: 'click', skills: ['single-click', 'reach'],
      goal: 'Haz clic en 3 globos para que vuelen.',
      instructions: ['Pon la flecha encima del globo.', 'Presiona una vez el botón izquierdo.'],
      template: 'click', tutorial: 'click',
      params: { count: 3, size: 132, style: 'balloon', emoji: '🎈', label: 'globo', appear: 'one', guidedTargets: 1, dwellFirst: 400 },
      hints: ['Primero mueve la flecha encima del globo y después haz clic.']
    }),
    B.level(2, 2, {
      name: 'Despierta a los animales',
      skill: 'single-click', skills: ['click', 'select'],
      goal: 'Haz clic en 5 animalitos dormidos para despertarlos.',
      instructions: ['Los animalitos están dormidos.', 'Haz un clic sobre cada uno.'],
      template: 'click',
      params: { count: 5, size: 118, style: 'animal', emojis: ['🐶', '🐱', '🐰', '🐻', '🦊'], label: 'animal dormido', appear: 'one', sleeping: true },
      hints: ['Un solo clic es suficiente. Si haces dos, el animalito se vuelve a dormir un poquito.']
    }),
    B.level(2, 3, {
      name: 'Enciende las estrellas',
      skill: 'click', skills: ['single-click', 'precision'],
      goal: 'Enciende las 6 estrellas de la isla con un clic.',
      instructions: ['Cada estrella está apagada.', 'Haz clic para encenderla.'],
      template: 'click',
      params: { count: 6, size: 106, style: 'star', emoji: '⭐', label: 'estrella', appear: 'all' },
      hints: ['Mira bien la estrella antes de hacer clic.']
    }),
    B.level(2, 4, {
      name: 'Los cofres del tesoro',
      skill: 'click', skills: ['single-click', 'click-challenges'],
      goal: 'Abre los 5 cofres con un clic en cada uno.',
      instructions: ['Los cofres guardan monedas.', 'Haz clic para abrirlos.'],
      template: 'click',
      params: { count: 5, size: 104, style: 'chest', emoji: '🎁', label: 'cofre', appear: 'all' },
      hints: ['Cada cofre se abre con un clic. ¡Escucha el sonido de las monedas!']
    }),
    B.level(2, 5, {
      name: 'La fruta que pide Mimo',
      skill: 'select', skills: ['click', 'precision'],
      goal: 'Dale a Mimo las 3 manzanas, sin tocar otras frutas.',
      instructions: ['Mimo quiere manzanas rojas.', 'Haz clic solo en las manzanas.'],
      template: 'click',
      params: {
        count: 3, size: 100, style: 'fruit',
        items: [
          it('🍎', 'manzana', C.rojo, true), it('🍎', 'manzana', C.rojo, true), it('🍎', 'manzana', C.rojo, true),
          it('🍌', 'banano', C.amarillo, false), it('🍊', 'naranja', null, false),
          it('🍇', 'uvas', C.morado, false), it('🍐', 'pera', C.verde, false)
        ]
      },
      hints: ['Las manzanas son rojas y redondas. Las otras frutas no cuentan.']
    }),
    B.level(2, 6, {
      name: 'Globos de colores',
      skill: 'select', skills: ['click', 'precision', 'single-click'],
      goal: 'Haz clic solo en los 4 globos rojos.',
      instructions: ['Hay globos de varios colores.', 'Toca únicamente los rojos.'],
      template: 'click',
      params: {
        count: 4, size: 96, style: 'balloon',
        items: [
          it('🎈', 'globo rojo', C.rojo, true), it('🎈', 'globo rojo', C.rojo, true),
          it('🎈', 'globo rojo', C.rojo, true), it('🎈', 'globo rojo', C.rojo, true),
          it('🎈', 'globo azul', C.azul, false), it('🎈', 'globo amarillo', C.amarillo, false),
          it('🎈', 'globo verde', C.verde, false), it('🎈', 'globo azul', C.azul, false),
          it('🎈', 'globo amarillo', C.amarillo, false), it('🎈', 'globo morado', C.morado, false)
        ]
      },
      hints: ['Mira el color de cada globo antes de hacer clic.']
    }),
    B.level(2, 7, {
      name: 'Estrellas por toda la isla',
      skill: 'reach', skills: ['click', 'hand-eye'],
      goal: 'Acierta en 8 estrellas que aparecen en lugares distintos.',
      instructions: ['Cada estrella aparece en otro lugar.', 'Lleva la flecha y haz clic.'],
      template: 'click',
      params: { count: 8, size: 94, style: 'star', emoji: '⭐', label: 'estrella', appear: 'one' },
      hints: ['Mueve primero la flecha y después haz clic. No hay prisa.']
    }),
    B.level(2, 8, {
      name: 'Cofres grandes y pequeños',
      skill: 'small-target', skills: ['click', 'precision'],
      goal: 'Abre 7 cofres; cada vez son un poquito más pequeños.',
      instructions: ['Empieza por el cofre grande.', 'Los cofres se hacen pequeños poco a poco.'],
      template: 'click',
      params: { count: 7, size: 116, sizeEnd: 68, style: 'chest', emoji: '🎁', label: 'cofre', appear: 'one' },
      hints: ['Cuando el cofre sea pequeño, frena el mouse justo encima.']
    }),
    B.level(2, 9, {
      name: 'La playa de los animales',
      skill: 'select', skills: ['click', 'precision'],
      goal: 'Toca los 4 animales de la playa y evita los insectos.',
      instructions: ['En la playa hay animales y también insectos.', 'Haz clic solo en los animales.'],
      template: 'click',
      params: {
        count: 4, size: 94, style: 'animal',
        items: [
          it('🐢', 'tortuga', null, true), it('🐠', 'pez', null, true),
          it('🦀', 'cangrejo', null, true), it('🐬', 'delfín', null, true),
          it('🐝', 'abeja', C.amarillo, false), it('🐝', 'abeja', C.amarillo, false),
          it('🦟', 'mosquito', null, false)
        ]
      },
      hints: ['Las abejas y los mosquitos no cuentan como animales de la playa en este juego. ¡No los toques!']
    }),
    B.level(2, 10, {
      name: 'La fiesta de los globos',
      skill: 'click', skills: ['single-click', 'select', 'precision'],
      goal: 'Explota 10 globos de la fiesta. ¡Tú puedes!',
      instructions: ['La fiesta tiene globos por todas partes.', 'Haz clic en cada globo con calma.'],
      template: 'click',
      params: { count: 10, size: 102, sizeEnd: 74, style: 'balloon', emoji: '🎈', label: 'globo', appear: 'all', guidedTargets: 2, dwellFirst: 250 },
      hints: ['Busca el globo más cercano a la flecha y haz clic en él.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
