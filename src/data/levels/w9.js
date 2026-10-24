/* Mundo 9 — La aventura espacial
   Habilidad central: precisión, planificación y autonomía (incluye la rueda del mouse). */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  MA.LevelDefs = MA.LevelDefs || {};
  const B = MA.LevelBuilder;
  const C = { rojo: '#e2474b', azul: '#2b7ff5', amarillo: '#f4c020', verde: '#2fae5e', morado: '#8a5ad6', rosado: '#ef5da8', naranja: '#f2802e' };
  function piece(id, emoji, label, color) { return { id: id, emoji: emoji, label: label, color: color || null }; }
  function zone(id, label, emoji, color, x, y, size, accepts) {
    return { id: id, label: label, emoji: emoji, color: color || null, x: x, y: y, size: size, accepts: accepts };
  }

  MA.LevelDefs[9] = [
    B.level(9, 1, {
      name: 'Repara la nave',
      skill: 'precision', skills: ['click', 'small-target'],
      goal: 'Haz clic en las 5 piezas de la nave para repararla.',
      instructions: ['Las piezas están sueltas y son pequeñas.', 'Haz clic en cada una.'],
      template: 'click',
      params: { count: 5, size: 62, style: 'part', emojis: ['🔩', '⚙️', '🔧', '🔌', '🔨'], label: 'pieza', appear: 'all' },
      hints: ['Acércate despacio a cada pieza y frena antes del clic.']
    }),
    B.level(9, 2, {
      name: 'Llena el tanque',
      skill: 'drag', skills: ['drop', 'hold'],
      goal: 'Arrastra los 4 tanques de combustible hasta la nave.',
      instructions: ['Arrastra cada tanque al centro del tanque de la nave.', 'Suelta cuando la zona brille.'],
      template: 'drag',
      params: {
        mode: 'sort', snap: 64, pieceSize: 78,
        items: [
          piece('g1', '🛢️', 'combustible'), piece('g2', '🛢️', 'combustible'),
          piece('g3', '⛽', 'gasolina'), piece('g4', '⛽', 'gasolina')
        ],
        zones: [zone('tanque', 'tanque de la nave', '🚀', C.naranja, 0.5, 0.38, 210, ['g1', 'g2', 'g3', 'g4'])]
      },
      hints: ['Todos los tanques van al mismo lugar: el tanque grande de la nave.']
    }),
    B.level(9, 3, {
      name: 'Ruta de estrellas',
      skill: 'trace', skills: ['hand-eye', 'precision'],
      goal: 'Sigue la ruta espacial y recoge 5 estrellas.',
      instructions: ['El camino pasa entre las estrellas.', 'Recoge las 5 y llega a la meta.'],
      template: 'path',
      params: { shape: 'sCurve', tolerance: 28, rings: 5, mode: 'collect', ballEmoji: '🛸' },
      hints: ['Mantén la flecha sobre la línea luminosa.']
    }),
    B.level(9, 4, {
      name: 'Laberinto espacial',
      skill: 'maze', skills: ['trace', 'directions'],
      goal: 'Cruza el laberinto de asteroides y llega al planeta.',
      instructions: ['Los asteroides son las paredes.', 'Sigue el pasillo hasta el planeta.'],
      template: 'path',
      params: { maze: true, cols: 9, rows: 5, toleranceFactor: 0.45, rings: 2, mode: 'collect', ballEmoji: '🚀' },
      hints: ['Puedes devolverte para buscar otro camino: no pierdes el avance.']
    }),
    B.level(9, 5, {
      name: 'Elige el planeta',
      skill: 'select', skills: ['precision', 'click'],
      goal: 'Toca los 4 planetas con anillo, sin tocar los demás.',
      instructions: ['Solo los planetas con anillo cuentan.', 'Haz clic en ellos.'],
      template: 'click',
      params: {
        count: 4, size: 58, style: 'planet', appear: 'all',
        items: [
          { emoji: '🪐', label: 'planeta con anillo', correct: true },
          { emoji: '🪐', label: 'planeta con anillo', correct: true },
          { emoji: '🪐', label: 'planeta con anillo', correct: true },
          { emoji: '🪐', label: 'planeta con anillo', correct: true },
          { emoji: '🌕', label: 'luna', correct: false },
          { emoji: '🌍', label: 'planeta azul', correct: false },
          { emoji: '☀️', label: 'sol', correct: false },
          { emoji: '🌑', label: 'luna nueva', correct: false },
          { emoji: '⭐', label: 'estrella', correct: false },
          { emoji: '☄️', label: 'cometa', correct: false },
          { emoji: '🌙', label: 'luna', correct: false },
          { emoji: '💫', label: 'estrella', correct: false }
        ]
      },
      hints: ['El anillo se ve alrededor del planeta, como un aro.']
    }),
    B.level(9, 6, {
      name: 'Misión de la luna',
      skill: 'combine', skills: ['click', 'drag', 'precision'],
      goal: 'Recoge estrellas y guarda las rocas lunares en la caja.',
      instructions: ['Parte 1: toca 4 estrellas.', 'Parte 2: arrastra 3 rocas a la caja.'],
      template: 'mission',
      params: {
        stages: [
          {
            title: 'Parte 1: estrellas', instruction: 'Toca 4 estrellas pequeñas.', template: 'click',
            params: { count: 4, size: 70, style: 'star', emoji: '⭐', label: 'estrella', appear: 'all' }
          },
          {
            title: 'Parte 2: rocas lunares', instruction: 'Arrastra 3 rocas a la caja de muestras.', template: 'drag',
            params: {
              mode: 'sort', snap: 60, pieceSize: 78,
              items: [piece('r1', '⚫', 'roca'), piece('r2', '⚫', 'roca'), piece('r3', '⚫', 'roca')],
              zones: [zone('caja', 'caja de muestras', '📦', C.azul, 0.5, 0.4, 180, ['r1', 'r2', 'r3'])]
            }
          }
        ]
      },
      hints: ['Las rocas son grises y pesadas. Todas van a la misma caja.']
    }),
    B.level(9, 7, {
      name: 'La rueda de la nave',
      skill: 'wheel', skills: ['single-click', 'combine'],
      goal: 'Gira la rueda del mouse para cargar el motor de la nave.',
      instructions: ['La rueda del mouse está entre los botones.', 'Gírala hasta llenar la barra.'],
      template: 'wheel', tutorial: 'wheel',
      params: { target: 120, direction: 'down', label: 'Carga el motor', emoji: '🚀' },
      hints: ['Gira la rueda hacia ti, despacio. La barra debe subir.']
    }),
    B.level(9, 8, {
      name: 'Lluvia de meteoritos',
      skill: 'speed-control', skills: ['hand-eye', 'click', 'small-target'],
      goal: 'Destruye 10 meteoritos pequeños que se mueven.',
      instructions: ['Los meteoritos son pequeños y veloces.', 'Apunta bien antes de hacer clic.'],
      template: 'click',
      params: { count: 10, size: 54, style: 'meteor', emoji: '☄️', label: 'meteorito', appear: 'all', moving: 58 },
      hints: ['Es mejor acertar despacio que fallar rápido. La precisión sube la nota.']
    }),
    B.level(9, 9, {
      name: 'Rescate espacial',
      skill: 'combine', skills: ['maze', 'click', 'combine'],
      goal: 'Llega a la nave y rescata a los 3 astronautas.',
      instructions: ['Parte 1: cruza el laberinto.', 'Parte 2: toca a los astronautas.'],
      template: 'mission',
      params: {
        stages: [
          {
            title: 'Parte 1: el laberinto', instruction: 'Cruza el laberinto de asteroides.', template: 'path',
            params: { maze: true, cols: 7, rows: 4, toleranceFactor: 0.5, rings: 0, mode: 'follow' }
          },
          {
            title: 'Parte 2: el rescate', instruction: 'Toca 3 astronautas.', template: 'click',
            params: { count: 3, size: 86, style: 'astronaut', emoji: '👨‍🚀', label: 'astronauta', appear: 'all' }
          }
        ]
      },
      hints: ['Primero el camino y después los astronautas. Una cosa a la vez.']
    }),
    B.level(9, 10, {
      name: 'La gran misión espacial',
      skill: 'combine', skills: ['click', 'drag', 'maze', 'wheel', 'precision'],
      goal: 'Completa las 4 partes de la misión espacial.',
      instructions: ['Parte 1: toca los planetas.', 'Parte 2: carga combustible. Parte 3: cruza el laberinto. Parte 4: enciende el motor con la rueda.'],
      template: 'mission',
      params: {
        stages: [
          {
            title: 'Parte 1: planetas', instruction: 'Toca 2 planetas con anillo.', template: 'click',
            params: {
              count: 2, size: 74, style: 'planet',
              items: [
                { emoji: '🪐', label: 'planeta con anillo', correct: true },
                { emoji: '🪐', label: 'planeta con anillo', correct: true },
                { emoji: '🌕', label: 'luna', correct: false },
                { emoji: '🌍', label: 'planeta azul', correct: false },
                { emoji: '☄️', label: 'cometa', correct: false }
              ]
            }
          },
          {
            title: 'Parte 2: combustible', instruction: 'Arrastra 2 tanques al depósito.', template: 'drag',
            params: {
              mode: 'sort', snap: 60, pieceSize: 80,
              items: [piece('g1', '🛢️', 'combustible'), piece('g2', '⛽', 'gasolina')],
              zones: [zone('dep', 'depósito', '🚀', C.naranja, 0.5, 0.4, 190, ['g1', 'g2'])]
            }
          },
          {
            title: 'Parte 3: laberinto', instruction: 'Cruza el laberinto espacial.', template: 'path',
            params: { maze: true, cols: 8, rows: 4, toleranceFactor: 0.46, rings: 0, mode: 'follow' }
          },
          {
            title: 'Parte 4: encender', instruction: 'Gira la rueda para encender el motor.', template: 'wheel',
            params: { target: 90, direction: 'down', label: 'Enciende el motor', emoji: '🚀' }
          }
        ]
      },
      hints: ['Cuatro partes cortitas. Termina una y sigue con la otra.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
