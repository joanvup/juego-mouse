/* Mundo 5 — La granja de los animales
   Habilidad central: selección precisa y discriminación visual por color, tamaño y tipo. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;
  const C = { rojo: '#e2474b', azul: '#2b7ff5', amarillo: '#f4c020', verde: '#2fae5e', morado: '#8a5ad6', rosado: '#ef5da8', cafe: '#8a5a2b' };
  function it(emoji, label, color, correct, scale) { return { emoji: emoji, label: label, color: color || null, correct: !!correct, scale: scale || 1 }; }

  MA.LevelDefs[5] = [
    B.level(5, 1, {
      name: 'La comida del caballo',
      skill: 'select', skills: ['click', 'precision'],
      goal: 'Dale 3 manzanas al caballo, sin darle otras cosas.',
      instructions: ['El caballo tiene hambre.', 'Haz clic solo en las manzanas.'],
      template: 'click',
      params: {
        count: 3, size: 92, style: 'fruit',
        items: [
          it('🍎', 'manzana', C.rojo, true), it('🍎', 'manzana', C.rojo, true), it('🍎', 'manzana', C.rojo, true),
          it('🍌', 'banano', C.amarillo, false), it('🥕', 'zanahoria', null, false),
          it('🌽', 'maíz', C.amarillo, false), it('🍇', 'uvas', C.morado, false),
          it('🐴', 'caballo', null, false)
        ]
      },
      hints: ['Las manzanas son rojas. El caballo no come las otras cosas en este juego.']
    }),
    B.level(5, 2, {
      name: 'El establo correcto',
      skill: 'select', skills: ['click', 'precision'],
      goal: 'Abre las puertas de los establos en el orden indicado.',
      instructions: ['Mira el orden de colores.', 'Haz clic en la puerta correcta cada vez.'],
      template: 'sequence',
      params: {
        style: 'door', size: 118,
        cards: [
          { id: 'rojo', emoji: '🚪', label: 'establo rojo', color: C.rojo },
          { id: 'azul', emoji: '🚪', label: 'establo azul', color: C.azul },
          { id: 'amarillo', emoji: '🚪', label: 'establo amarillo', color: C.amarillo }
        ],
        order: ['azul', 'rojo', 'amarillo'],
        showNumbers: false
      },
      hints: ['La tira de arriba muestra el orden: azul, rojo, amarillo.']
    }),
    B.level(5, 3, {
      name: 'Animales de color café',
      skill: 'select', skills: ['precision', 'click'],
      goal: 'Toca solo los 4 animales de color café.',
      instructions: ['En la granja hay animales de varios colores.', 'Haz clic en los animalitos cafés.'],
      template: 'click',
      params: {
        count: 4, size: 88, style: 'animal',
        items: [
          it('🐴', 'caballo café', C.cafe, true), it('🐮', 'vaca café', C.cafe, true),
          it('🐔', 'gallina café', C.cafe, true), it('🐐', 'cabra café', C.cafe, true),
          it('🐑', 'oveja blanca', '#f7f4e8', false), it('🐖', 'cerdo rosado', C.rosado, false),
          it('🐓', 'gallo rojo', C.rojo, false), it('🦆', 'pato blanco', '#f7f4e8', false),
          it('🐇', 'conejo blanco', '#f7f4e8', false)
        ]
      },
      hints: ['El color café se parece al chocolate. Los animales blancos no cuentan.']
    }),
    B.level(5, 4, {
      name: 'Cada animal a su establo',
      skill: 'drag', skills: ['drop', 'select'],
      goal: 'Arrastra las ovejas al establo blanco y las vacas al establo rojo.',
      instructions: ['Mantén presionado el botón izquierdo.', 'Mueve el animal y suéltalo en su establo.'],
      template: 'drag', tutorial: 'drag',
      params: {
        mode: 'sort', snap: 100, pieceSize: 88, guided: true,
        items: [
          { id: 'oveja1', emoji: '🐑', label: 'oveja' }, { id: 'oveja2', emoji: '🐑', label: 'oveja' },
          { id: 'vaca1', emoji: '🐮', label: 'vaca' }, { id: 'vaca2', emoji: '🐮', label: 'vaca' }
        ],
        zones: [
          { id: 'blanco', label: 'establo blanco', emoji: '🏠', color: '#f7f4e8', x: 0.24, y: 0.46, size: 150, accepts: ['oveja1', 'oveja2'] },
          { id: 'rojo', label: 'establo rojo', emoji: '🏠', color: C.rojo, x: 0.76, y: 0.46, size: 150, accepts: ['vaca1', 'vaca2'] }
        ]
      },
      hints: ['Suelta la oveja cuando el establo blanco se ilumine.']
    }),
    B.level(5, 5, {
      name: 'Grandes y pequeños',
      skill: 'select', skills: ['precision', 'small-target', 'click'],
      goal: 'Haz clic solo en los 4 animales pequeños.',
      instructions: ['Hay animales grandes y pequeños.', 'Toca únicamente los pequeños.'],
      template: 'click',
      params: {
        count: 4, size: 84, style: 'animal',
        items: [
          it('🐤', 'pollito pequeño', C.amarillo, true, 0.62), it('🐥', 'patito pequeño', C.amarillo, true, 0.62),
          it('🐇', 'conejo pequeño', '#f7f4e8', true, 0.62), it('🐈', 'gatito pequeño', null, true, 0.62),
          it('🐄', 'vaca grande', C.cafe, false, 1.15), it('🐖', 'cerdo grande', C.rosado, false, 1.15),
          it('🐎', 'caballo grande', C.cafe, false, 1.15), it('🐏', 'carnero grande', '#f7f4e8', false, 1.15)
        ]
      },
      hints: ['Los animales pequeños se ven más chiquitos que los grandes.']
    }),
    B.level(5, 6, {
      name: 'Sigue la instrucción',
      skill: 'select', skills: ['click', 'precision', 'single-click'],
      goal: 'Toca los animales en el orden que te dicen.',
      instructions: ['La tira muestra el orden: vaca, pato, cerdo.', 'Haz clic en ese orden.'],
      template: 'sequence',
      params: {
        style: 'animal', size: 108, showNumbers: false,
        cards: [
          { id: 'vaca', emoji: '🐮', label: 'vaca' },
          { id: 'pato', emoji: '🦆', label: 'pato' },
          { id: 'cerdo', emoji: '🐖', label: 'cerdo' },
          { id: 'gallina', emoji: '🐔', label: 'gallina' }
        ],
        order: ['vaca', 'pato', 'cerdo']
      },
      hints: ['Mira la tira de arriba: el número 1 es la vaca.']
    }),
    B.level(5, 7, {
      name: 'Cuidado con el abejorro',
      skill: 'click', skills: ['select', 'precision'],
      goal: 'Recoge 4 flores sin tocar a los abejorros.',
      instructions: ['Las flores son para el jardín.', 'No toques a los abejorros: ellos trabajan.'],
      template: 'click',
      params: {
        count: 4, size: 86, style: 'flower',
        items: [
          it('🌻', 'flor', C.amarillo, true), it('🌷', 'flor', C.rojo, true),
          it('🌺', 'flor', C.rosado, true), it('🌼', 'flor', '#f7f4e8', true),
          it('🐝', 'abejorro', C.amarillo, false), it('🐝', 'abejorro', C.amarillo, false),
          it('🐝', 'abejorro', C.amarillo, false)
        ]
      },
      hints: ['Si tocas un abejorro, no pasa nada grave: solo pierdes un poquito de precisión.']
    }),
    B.level(5, 8, {
      name: 'Cuenta y toca',
      skill: 'precision', skills: ['click', 'select', 'single-click'],
      goal: 'Toca 3 manzanas. Hay otras frutas que no cuentan.',
      instructions: ['Cuenta 3 manzanas.', 'Haz clic en las manzanas, una por una.'],
      template: 'click',
      params: {
        count: 3, size: 88, style: 'fruit',
        items: [
          it('🍎', 'manzana', C.rojo, true), it('🍎', 'manzana', C.rojo, true), it('🍎', 'manzana', C.rojo, true),
          it('🍌', 'banano', C.amarillo, false), it('🍌', 'banano', C.amarillo, false),
          it('🍐', 'pera', C.verde, false), it('🍊', 'naranja', null, false)
        ]
      },
      hints: ['Solo las manzanas rojas. Las otras frutas no son manzanas.']
    }),
    B.level(5, 9, {
      name: 'La granja ordenada',
      skill: 'select', skills: ['click', 'precision', 'directions'],
      goal: 'Toca los animales del más pequeño al más grande.',
      instructions: ['Mira el tamaño de cada animal.', 'Empieza por el más pequeño.'],
      template: 'sequence',
      params: {
        style: 'animal', size: 92, showNumbers: true,
        cards: [
          { id: 'a', emoji: '🐤', label: 'pollito', scale: 0.68 },
          { id: 'b', emoji: '🐔', label: 'gallina', scale: 0.82 },
          { id: 'c', emoji: '🐑', label: 'oveja', scale: 0.96 },
          { id: 'd', emoji: '🐄', label: 'vaca', scale: 1.1 }
        ],
        order: ['a', 'b', 'c', 'd']
      },
      hints: ['El pollito es el más pequeño. Después sigue la gallina.']
    }),
    B.level(5, 10, {
      name: 'Fiesta en la granja',
      skill: 'precision', skills: ['select', 'hand-eye', 'click'],
      goal: 'Completa la fiesta tocando 10 animales de la granja.',
      instructions: ['Todos los animales están en la fiesta.', 'Toca 10 animalitos, con calma.'],
      template: 'click',
      params: {
        count: 10, size: 68, style: 'animal', appear: 'all', moving: 28,
        items: [
          it('🐮', 'vaca', null, true), it('🐖', 'cerdo', null, true), it('🐔', 'gallina', null, true),
          it('🐑', 'oveja', null, true), it('🦆', 'pato', null, true), it('🐐', 'cabra', null, true),
          it('🐴', 'caballo', null, true), it('🐓', 'gallo', null, true), it('🐇', 'conejo', null, true),
          it('🐤', 'pollito', null, true),
          it('🐊', 'cocodrilo', C.verde, false), it('🦁', 'león', C.amarillo, false),
          it('🐘', 'elefante', null, false), it('🐍', 'serpiente', C.verde, false)
        ]
      },
      hints: ['El cocodrilo, el león, el elefante y la serpiente no viven en esta granja.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
