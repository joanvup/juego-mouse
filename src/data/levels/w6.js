/* Mundo 6 — El taller de los pequeños constructores
   Habilidad central: arrastrar con el botón izquierdo y soltar en el destino. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;
  const C = { rojo: '#e2474b', azul: '#2b7ff5', amarillo: '#f4c020', verde: '#2fae5e', morado: '#8a5ad6', rosado: '#ef5da8', naranja: '#f2802e' };
  function piece(id, emoji, label, color, shape) { return { id: id, emoji: emoji, label: label, color: color || null, shape: shape || 'square' }; }
  function zone(id, label, emoji, color, x, y, size, accepts, shape) {
    return { id: id, label: label, emoji: emoji, color: color || null, x: x, y: y, size: size, accepts: accepts, shape: shape || 'square' };
  }

  MA.LevelDefs[6] = [
    B.level(6, 1, {
      name: 'Mi primera torre',
      skill: 'drag', skills: ['drop', 'hold'],
      goal: 'Arrastra 3 bloques para construir tu primera torre.',
      instructions: ['Pon la flecha sobre un bloque.', 'Mantén presionado, mueve y suelta en el número que le toca.'],
      template: 'drag', tutorial: 'drag',
      params: {
        mode: 'build', snap: 66, pieceSize: 96, guided: true,
        items: [
          piece('b1', '🧱', 'bloque rojo', C.rojo, 'square'),
          piece('b2', '🧱', 'bloque azul', C.azul, 'square'),
          piece('b3', '🧱', 'bloque amarillo', C.amarillo, 'square')
        ],
        zones: [
          zone('z1', '1', '1️⃣', null, 0.5, 0.76, 110, ['b1']),
          zone('z2', '2', '2️⃣', null, 0.5, 0.6, 110, ['b2']),
          zone('z3', '3', '3️⃣', null, 0.5, 0.44, 110, ['b3'])
        ]
      },
      hints: ['Primero pon el bloque abajo, en el número 1.']
    }),
    B.level(6, 2, {
      name: 'Las piezas en su lugar',
      skill: 'drag', skills: ['drop', 'select'],
      goal: 'Lleva cada figura a su hueco igual.',
      instructions: ['Hay 4 figuras y 4 huecos.', 'Arrastra cada pieza al hueco que tiene su misma forma.'],
      template: 'drag',
      params: {
        mode: 'puzzle', snap: 58, pieceSize: 92,
        items: [
          piece('p1', '', 'triángulo', C.rojo, 'triangle'),
          piece('p2', '', 'cuadrado', C.azul, 'square'),
          piece('p3', '', 'círculo', C.amarillo, 'circle'),
          piece('p4', '', 'estrella', C.verde, 'star')
        ],
        zones: [
          zone('z1', 'triángulo', '', null, 0.28, 0.4, 104, ['p1'], 'triangle'),
          zone('z2', 'cuadrado', '', null, 0.46, 0.4, 104, ['p2'], 'square'),
          zone('z3', 'círculo', '', null, 0.64, 0.4, 104, ['p3'], 'circle'),
          zone('z4', 'estrella', '', null, 0.82, 0.4, 104, ['p4'], 'star')
        ]
      },
      hints: ['La forma del hueco es igualita a la de la pieza.']
    }),
    B.level(6, 3, {
      name: 'Arma el rompecabezas',
      skill: 'drag', skills: ['drop', 'precision'],
      goal: 'Arma el rompecabezas de 4 piezas de colores.',
      instructions: ['El dibujo está incompleto.', 'Arrastra cada pieza a su lugar en el cuadro.'],
      template: 'drag',
      params: {
        mode: 'puzzle', snap: 46, pieceSize: 96,
        items: [
          piece('p1', '🟥', 'pieza roja', C.rojo, 'square'),
          piece('p2', '🟦', 'pieza azul', C.azul, 'square'),
          piece('p3', '🟨', 'pieza amarilla', C.amarillo, 'square'),
          piece('p4', '🟩', 'pieza verde', C.verde, 'square')
        ],
        zones: [
          zone('z1', '', '', C.rojo, 0.4, 0.32, 108, ['p1']),
          zone('z2', '', '', C.azul, 0.54, 0.32, 108, ['p2']),
          zone('z3', '', '', C.amarillo, 0.4, 0.52, 108, ['p3']),
          zone('z4', '', '', C.verde, 0.54, 0.52, 108, ['p4'])
        ]
      },
      hints: ['El color de la pieza te dice dónde va.']
    }),
    B.level(6, 4, {
      name: 'Ordena por tamaño',
      skill: 'drag', skills: ['drop', 'select', 'directions'],
      goal: 'Ordena los 4 animalitos del más pequeño al más grande.',
      instructions: ['Mira el tamaño de cada animal.', 'Arrastra el más pequeño al número 1.'],
      template: 'drag',
      params: {
        mode: 'order', snap: 62, pieceSize: 92,
        items: [
          { id: 'a', emoji: '🐤', label: 'pollito', scale: 0.72 },
          { id: 'b', emoji: '🐔', label: 'gallina', scale: 0.88 },
          { id: 'c', emoji: '🐑', label: 'oveja', scale: 1.02 },
          { id: 'd', emoji: '🐄', label: 'vaca', scale: 1.16 }
        ],
        zones: [
          zone('z1', '1', '1️⃣', null, 0.2, 0.4, 100, ['a']),
          zone('z2', '2', '2️⃣', null, 0.4, 0.4, 100, ['b']),
          zone('z3', '3', '3️⃣', null, 0.6, 0.4, 100, ['c']),
          zone('z4', '4', '4️⃣', null, 0.8, 0.4, 100, ['d'])
        ]
      },
      hints: ['El pollito es el más pequeño de todos.']
    }),
    B.level(6, 5, {
      name: 'Frutas a las canastas',
      skill: 'drag', skills: ['drop', 'select'],
      goal: 'Lleva cada fruta a su canasta: manzanas, bananos y uvas.',
      instructions: ['Hay 6 frutas y 3 canastas.', 'Arrastra cada fruta a la canasta correcta.'],
      template: 'drag',
      params: {
        mode: 'sort', snap: 54, pieceSize: 84,
        items: [
          piece('m1', '🍎', 'manzana'), piece('m2', '🍎', 'manzana'),
          piece('b1', '🍌', 'banano'), piece('b2', '🍌', 'banano'),
          piece('u1', '🍇', 'uvas'), piece('u2', '🍇', 'uvas')
        ],
        zones: [
          zone('zm', 'manzanas', '🧺', C.rojo, 0.24, 0.42, 138, ['m1', 'm2']),
          zone('zb', 'bananos', '🧺', C.amarillo, 0.5, 0.42, 138, ['b1', 'b2']),
          zone('zu', 'uvas', '🧺', C.morado, 0.76, 0.42, 138, ['u1', 'u2'])
        ]
      },
      hints: ['Cada canasta tiene un dibujo de su fruta.']
    }),
    B.level(6, 6, {
      name: 'Figuras geométricas',
      skill: 'drag', skills: ['drop', 'precision', 'select'],
      goal: 'Completa la figura con sus 5 piezas geométricas.',
      instructions: ['Mira los huecos de la figura.', 'Arrastra 5 piezas a su lugar.'],
      template: 'drag',
      params: {
        mode: 'puzzle', snap: 44, pieceSize: 82,
        items: [
          piece('p1', '', 'círculo', C.naranja, 'circle'),
          piece('p2', '', 'cuadrado', C.azul, 'square'),
          piece('p3', '', 'triángulo', C.verde, 'triangle'),
          piece('p4', '', 'estrella', C.amarillo, 'star'),
          piece('p5', '', 'rombo', C.morado, 'diamond')
        ],
        zones: [
          zone('z1', '', '', null, 0.34, 0.28, 92, ['p1'], 'circle'),
          zone('z2', '', '', null, 0.5, 0.28, 92, ['p2'], 'square'),
          zone('z3', '', '', null, 0.66, 0.28, 92, ['p3'], 'triangle'),
          zone('z4', '', '', null, 0.42, 0.52, 92, ['p4'], 'star'),
          zone('z5', '', '', null, 0.58, 0.52, 92, ['p5'], 'diamond')
        ]
      },
      hints: ['Mira el contorno del hueco: es la misma forma de la pieza.']
    }),
    B.level(6, 7, {
      name: 'La torre alta',
      skill: 'drag', skills: ['hold', 'drop', 'directions'],
      goal: 'Arrastra 5 bloques para levantar una torre bien alta.',
      instructions: ['Empieza por el bloque de abajo.', 'Cada bloque va en su número.'],
      template: 'drag',
      params: {
        mode: 'build', snap: 60, pieceSize: 78,
        items: [
          piece('b1', '🧱', 'bloque 1', C.rojo), piece('b2', '🧱', 'bloque 2', C.naranja),
          piece('b3', '🧱', 'bloque 3', C.amarillo), piece('b4', '🧱', 'bloque 4', C.verde),
          piece('b5', '🧱', 'bloque 5', C.azul)
        ],
        zones: [
          zone('z1', '1', '1️⃣', null, 0.5, 0.82, 92, ['b1']),
          zone('z2', '2', '2️⃣', null, 0.5, 0.68, 92, ['b2']),
          zone('z3', '3', '3️⃣', null, 0.5, 0.54, 92, ['b3']),
          zone('z4', '4', '4️⃣', null, 0.5, 0.4, 92, ['b4']),
          zone('z5', '5', '5️⃣', null, 0.5, 0.26, 92, ['b5'])
        ]
      },
      hints: ['Si la torre se cae, no pasa nada: vuelve a intentarlo.']
    }),
    B.level(6, 8, {
      name: 'Cajas por color',
      skill: 'drag', skills: ['drop', 'select', 'precision'],
      goal: 'Clasifica 8 piezas en las cajas roja y azul.',
      instructions: ['Hay piezas rojas y piezas azules.', 'Arrastra cada una a su caja.'],
      template: 'drag',
      params: {
        mode: 'sort', snap: 52, pieceSize: 76,
        items: [
          piece('r1', '🔴', 'círculo rojo', C.rojo, 'circle'), piece('r2', '⭐', 'estrella roja', C.rojo, 'star'),
          piece('r3', '🟥', 'cuadrado rojo', C.rojo, 'square'), piece('r4', '🔺', 'triángulo rojo', C.rojo, 'triangle'),
          piece('a1', '🔵', 'círculo azul', C.azul, 'circle'), piece('a2', '🌟', 'estrella azul', C.azul, 'star'),
          piece('a3', '🟦', 'cuadrado azul', C.azul, 'square'), piece('a4', '💠', 'rombo azul', C.azul, 'diamond')
        ],
        zones: [
          zone('zr', 'caja roja', '📦', C.rojo, 0.3, 0.42, 190, ['r1', 'r2', 'r3', 'r4']),
          zone('za', 'caja azul', '📦', C.azul, 0.7, 0.42, 190, ['a1', 'a2', 'a3', 'a4'])
        ]
      },
      hints: ['Mira el color de la pieza y el color de la caja.']
    }),
    B.level(6, 9, {
      name: 'El carrito del taller',
      skill: 'drag', skills: ['drop', 'precision', 'combine'],
      goal: 'Arma el carrito colocando sus 5 partes.',
      instructions: ['Cada parte tiene su lugar.', 'Arrastra las ruedas, la caja y el manubrio.'],
      template: 'drag',
      params: {
        mode: 'puzzle', snap: 50, pieceSize: 80,
        items: [
          piece('rueda1', '⚙️', 'rueda izquierda'), piece('rueda2', '⚙️', 'rueda derecha'),
          piece('caja', '📦', 'caja'), piece('manubrio', '🔧', 'manubrio'), piece('asiento', '💺', 'asiento')
        ],
        zones: [
          zone('z1', 'rueda izq.', '⚪', null, 0.34, 0.52, 96, ['rueda1']),
          zone('z2', 'rueda der.', '⚪', null, 0.66, 0.52, 96, ['rueda2']),
          zone('z3', 'caja', '📦', null, 0.5, 0.4, 112, ['caja']),
          zone('z4', 'manubrio', '🔧', null, 0.32, 0.3, 88, ['manubrio']),
          zone('z5', 'asiento', '💺', null, 0.66, 0.3, 88, ['asiento'])
        ]
      },
      hints: ['Las ruedas van abajo, a los lados de la caja.']
    }),
    B.level(6, 10, {
      name: 'El taller completo',
      skill: 'drag', skills: ['drop', 'select', 'hold', 'combine'],
      goal: 'Clasifica 8 objetos del taller en sus 4 cajones.',
      instructions: ['Cada cajón guarda un tipo de cosa.', 'Arrastra los objetos al cajón correcto.'],
      template: 'drag',
      params: {
        mode: 'sort', snap: 48, pieceSize: 76,
        items: [
          piece('h1', '🔨', 'martillo'), piece('h2', '🔧', 'destornillador'),
          piece('t1', '🔩', 'tornillo'), piece('t2', '⚙️', 'tuerca'),
          piece('m1', '🟫', 'madera'), piece('m2', '📏', 'regla'),
          piece('p1', '🎨', 'pintura'), piece('p2', '🖌️', 'pincel')
        ],
        zones: [
          zone('zh', 'herramientas', '🔧', C.azul, 0.2, 0.42, 150, ['h1', 'h2']),
          zone('zt', 'tornillos', '🔩', C.naranja, 0.4, 0.42, 150, ['t1', 't2']),
          zone('zm', 'maderas', '🟫', '#8a5a2b', 0.6, 0.42, 150, ['m1', 'm2']),
          zone('zp', 'pinturas', '🎨', C.morado, 0.8, 0.42, 150, ['p1', 'p2'])
        ]
      },
      hints: ['Puedes mirar el dibujo del cajón si dudas dónde va una pieza.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
