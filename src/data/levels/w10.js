/* Mundo 10 — La gran misión del maestro del mouse
   Integración de todas las habilidades. El nivel 100 entrega el diploma. */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;
  const C = { rojo: '#e2474b', azul: '#2b7ff5', amarillo: '#f4c020', verde: '#2fae5e', morado: '#8a5ad6', rosado: '#ef5da8', naranja: '#f2802e', dorado: '#ffc233' };
  function piece(id, emoji, label, color) { return { id: id, emoji: emoji, label: label, color: color || null }; }
  function zone(id, label, emoji, color, x, y, size, accepts) {
    return { id: id, label: label, emoji: emoji, color: color || null, x: x, y: y, size: size, accepts: accepts };
  }

  MA.LevelDefs[10] = [
    B.level(10, 1, {
      name: 'Las llaves del castillo',
      skill: 'precision', skills: ['click', 'small-target'],
      goal: 'Encuentra y toca las 5 llaves del castillo.',
      instructions: ['Las llaves son pequeñas.', 'Haz clic en cada llave con cuidado.'],
      template: 'click',
      params: { count: 5, size: 60, style: 'key', emoji: '🗝️', label: 'llave', appear: 'all' },
      hints: ['Las llaves brillan un poquito. Mira bien antes de hacer clic.']
    }),
    B.level(10, 2, {
      name: 'El puente del castillo',
      skill: 'maze', skills: ['trace', 'directions'],
      goal: 'Cruza el puente y llega a la puerta del castillo.',
      instructions: ['El puente tiene un camino.', 'Sigue el pasillo hasta la puerta.'],
      template: 'path',
      params: { maze: true, cols: 8, rows: 5, toleranceFactor: 0.46, rings: 3, mode: 'collect', ballEmoji: '🛡️' },
      hints: ['Mira el camino iluminado. No necesitas ir rápido.']
    }),
    B.level(10, 3, {
      name: 'Las banderas',
      skill: 'click', skills: ['single-click', 'precision', 'combine'],
      goal: 'Toca las 5 banderas en el orden de la tira.',
      instructions: ['Mira el orden de los colores.', 'Haz clic en las banderas una por una.'],
      template: 'sequence',
      params: {
        style: 'flag', size: 100, showNumbers: true,
        cards: [
          { id: 'b1', emoji: '🚩', label: 'bandera roja', color: C.rojo },
          { id: 'b2', emoji: '🚩', label: 'bandera azul', color: C.azul },
          { id: 'b3', emoji: '🚩', label: 'bandera amarilla', color: C.amarillo },
          { id: 'b4', emoji: '🚩', label: 'bandera verde', color: C.verde },
          { id: 'b5', emoji: '🚩', label: 'bandera morada', color: C.morado }
        ],
        order: ['b1', 'b2', 'b3', 'b4', 'b5']
      },
      hints: ['La tira de arriba te muestra el orden. Puedes mirarla otra vez.']
    }),
    B.level(10, 4, {
      name: 'Los engranajes',
      skill: 'drag', skills: ['drop', 'precision'],
      goal: 'Coloca los 5 engranajes de la máquina del castillo.',
      instructions: ['Cada engranaje tiene su hueco.', 'Arrastra las piezas y suéltalas encima.'],
      template: 'drag',
      params: {
        mode: 'puzzle', snap: 48, pieceSize: 80,
        items: [
          { id: 'e1', emoji: '⚙️', label: 'engranaje rojo', color: C.rojo, shape: 'circle' },
          { id: 'e2', emoji: '⚙️', label: 'engranaje azul', color: C.azul, shape: 'circle' },
          { id: 'e3', emoji: '⚙️', label: 'engranaje verde', color: C.verde, shape: 'circle' },
          { id: 'e4', emoji: '⚙️', label: 'engranaje amarillo', color: C.amarillo, shape: 'circle' },
          { id: 'e5', emoji: '⚙️', label: 'engranaje morado', color: C.morado, shape: 'circle' }
        ],
        zones: [
          zone('z1', '', '', C.rojo, 0.36, 0.3, 92, ['e1'], 'circle'),
          zone('z2', '', '', C.azul, 0.5, 0.3, 92, ['e2'], 'circle'),
          zone('z3', '', '', C.verde, 0.64, 0.3, 92, ['e3'], 'circle'),
          zone('z4', '', '', C.amarillo, 0.43, 0.52, 92, ['e4'], 'circle'),
          zone('z5', '', '', C.morado, 0.57, 0.52, 92, ['e5'], 'circle')
        ]
      },
      hints: ['El color del engranaje coincide con el color del hueco.']
    }),
    B.level(10, 5, {
      name: 'El salón de los espejos',
      skill: 'precision', skills: ['click', 'small-target', 'speed-control'],
      goal: 'Toca 8 estrellas pequeñas que se mueven en el salón.',
      instructions: ['Las estrellas son pequeñas y flotan.', 'Apunta con calma antes de hacer clic.'],
      template: 'click',
      params: { count: 8, size: 52, style: 'star', emoji: '✨', label: 'estrella', appear: 'all', moving: 30 },
      hints: ['Respira y apunta. El tiempo no corre en tu contra.']
    }),
    B.level(10, 6, {
      name: 'La carrera de obstáculos',
      skill: 'combine', skills: ['maze', 'click', 'precision'],
      goal: 'Cruza el laberinto y acierta en los 3 escudos.',
      instructions: ['Parte 1: cruza el laberinto.', 'Parte 2: toca los 3 escudos.'],
      template: 'mission',
      params: {
        stages: [
          {
            title: 'Parte 1: el laberinto', instruction: 'Cruza el laberinto del castillo.', template: 'path',
            params: { maze: true, cols: 9, rows: 5, toleranceFactor: 0.46, rings: 2, mode: 'collect', ballEmoji: '🏇' }
          },
          {
            title: 'Parte 2: los escudos', instruction: 'Toca los 3 escudos.', template: 'click',
            params: { count: 3, size: 84, style: 'shield', emoji: '🛡️', label: 'escudo', appear: 'all' }
          }
        ]
      },
      hints: ['Primero el camino, después los escudos. Todo a su tiempo.']
    }),
    B.level(10, 7, {
      name: 'El trono',
      skill: 'drag', skills: ['drop', 'hold', 'combine'],
      goal: 'Construye el trono colocando sus 6 piezas.',
      instructions: ['Cada pieza del trono tiene su lugar.', 'Arrastra y suelta con cuidado.'],
      template: 'drag',
      params: {
        mode: 'build', snap: 56, pieceSize: 76,
        items: [
          piece('b1', '🟫', 'base', '#8a5a2b'), piece('b2', '🟫', 'respaldo', '#a9743b'),
          piece('b3', '🔴', 'cojín', C.rojo), piece('b4', '👑', 'corona', C.dorado),
          piece('b5', '⭐', 'estrella', C.amarillo), piece('b6', '✨', 'brillo', C.morado)
        ],
        zones: [
          zone('z1', 'base', '1️⃣', null, 0.5, 0.8, 92, ['b1']),
          zone('z2', 'respaldo', '2️⃣', null, 0.5, 0.66, 92, ['b2']),
          zone('z3', 'cojín', '3️⃣', null, 0.5, 0.52, 92, ['b3']),
          zone('z4', 'corona', '4️⃣', null, 0.5, 0.38, 92, ['b4']),
          zone('z5', 'estrella', '5️⃣', null, 0.36, 0.52, 76, ['b5']),
          zone('z6', 'brillo', '6️⃣', null, 0.64, 0.52, 76, ['b6'])
        ]
      },
      hints: ['Empieza por la base del trono, abajo, y sigue hacia arriba.']
    }),
    B.level(10, 8, {
      name: 'La batalla de precisión',
      skill: 'speed-control', skills: ['click', 'small-target', 'hand-eye'],
      goal: 'Toca 12 estrellas pequeñas. El reloj es opcional.',
      instructions: ['Las estrellas son pequeñas y se mueven.', 'Si el reloj se acaba, sigues practicando sin reloj.'],
      template: 'click', timeLimit: 120,
      params: { count: 12, size: 50, style: 'star', emoji: '⭐', label: 'estrella', appear: 'all', moving: 26 },
      hints: ['La precisión sube tu nota. No hace falta correr.']
    }),
    B.level(10, 9, {
      name: 'El gran laberinto',
      skill: 'maze', skills: ['trace', 'precision', 'directions'],
      goal: 'Atraviesa el gran laberinto del castillo y recoge 5 estrellas.',
      instructions: ['El laberinto es grande, pero el camino existe.', 'Sigue el pasillo y recoge las estrellas.'],
      template: 'path',
      params: { maze: true, cols: 12, rows: 7, toleranceFactor: 0.42, rings: 5, mode: 'collect', ballEmoji: '🏆' },
      hints: ['Si te pierdes, devuélvete al camino iluminado. Nada se reinicia.']
    }),
    B.level(10, 10, {
      name: 'La gran misión del maestro del mouse',
      skill: 'combine', skills: ['click', 'drag', 'maze', 'precision', 'select', 'single-click'],
      goal: 'Supera las 5 partes de la misión final y recibe tu diploma.',
      instructions: ['Parte 1: toca 3 objetos.', 'Parte 2: arrastra 3 piezas.', 'Parte 3: cruza el laberinto.', 'Parte 4: sigue la secuencia.', 'Parte 5: toca la medalla final.'],
      template: 'mission', graduation: true,
      params: {
        stages: [
          {
            title: 'Parte 1: los objetos', instruction: 'Toca 3 objetos mágicos.', template: 'click',
            params: { count: 3, size: 90, style: 'star', emoji: '✨', label: 'objeto mágico', appear: 'all' }
          },
          {
            title: 'Parte 2: las piezas', instruction: 'Arrastra las 3 piezas a su lugar.', template: 'drag',
            params: {
              mode: 'match', snap: 58, pieceSize: 80,
              items: [piece('a', '🔑', 'llave'), piece('b', '🛡️', 'escudo'), piece('c', '👑', 'corona')],
              zones: [
                zone('za', 'llave', '🔑', null, 0.28, 0.4, 120, ['a']),
                zone('zb', 'escudo', '🛡️', null, 0.5, 0.4, 120, ['b']),
                zone('zc', 'corona', '👑', null, 0.72, 0.4, 120, ['c'])
              ]
            }
          },
          {
            title: 'Parte 3: el laberinto', instruction: 'Cruza el último laberinto.', template: 'path',
            params: { maze: true, cols: 8, rows: 5, toleranceFactor: 0.5, rings: 2, mode: 'collect', ballEmoji: '🏰' }
          },
          {
            title: 'Parte 4: la secuencia', instruction: 'Toca las banderas en orden.', template: 'sequence',
            params: {
              style: 'flag', size: 92, showNumbers: false,
              cards: [
                { id: 'r', emoji: '🚩', label: 'roja', color: C.rojo },
                { id: 'a', emoji: '🚩', label: 'azul', color: C.azul },
                { id: 'v', emoji: '🚩', label: 'verde', color: C.verde }
              ],
              order: ['r', 'a', 'v']
            }
          },
          {
            title: 'Parte 5: la medalla', instruction: 'Toca la medalla dorada para terminar.', template: 'click',
            params: { count: 1, size: 160, style: 'medal', emoji: '🎖️', label: 'medalla', appear: 'all' }
          }
        ]
      },
      hints: ['Esta es la última misión. Haz cada parte con calma: ya sabes cómo hacerlo.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
