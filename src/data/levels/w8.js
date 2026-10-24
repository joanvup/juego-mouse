/* Mundo 8 — La ciudad de los botones
   Habilidad central: combinar interacciones (clic, clic derecho, arrastre y secuencias). */
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

  MA.LevelDefs[8] = [
    B.level(8, 1, {
      name: 'Los botones de la ciudad',
      skill: 'click', skills: ['single-click', 'click-challenges'],
      goal: 'Presiona los 3 botones en el orden correcto.',
      instructions: ['Mira la tira de arriba.', 'Haz clic en los botones en ese orden.'],
      template: 'sequence', tutorial: 'click',
      params: {
        style: 'button', size: 118, showNumbers: false,
        cards: [
          { id: 'luz', emoji: '💡', label: 'encender la luz' },
          { id: 'puerta', emoji: '🚪', label: 'abrir la puerta' },
          { id: 'bus', emoji: '🚌', label: 'llamar el bus' }
        ],
        order: ['luz', 'puerta', 'bus']
      },
      hints: ['Los botones dicen lo que hacen. Mira la tira para recordar el orden.']
    }),
    B.level(8, 2, {
      name: 'Abre las puertas',
      skill: 'click', skills: ['single-click', 'precision'],
      goal: 'Abre las 5 puertas de la ciudad con un clic.',
      instructions: ['Cada puerta tiene una ventana.', 'Haz clic en la puerta para abrirla.'],
      template: 'click',
      params: { count: 5, size: 110, style: 'door', emoji: '🚪', label: 'puerta', appear: 'all' },
      hints: ['Toca la puerta una vez. Si haces doble clic, se cierra otra vez.']
    }),
    B.level(8, 3, {
      name: 'Clasifica los objetos',
      skill: 'drag', skills: ['drop', 'select'],
      goal: 'Lleva 6 objetos a los contenedores de papel y de plástico.',
      instructions: ['El contenedor azul es para el papel.', 'El contenedor amarillo es para el plástico.'],
      template: 'drag',
      params: {
        mode: 'sort', snap: 54, pieceSize: 82,
        items: [
          piece('p1', '📰', 'periódico'), piece('p2', '📄', 'hoja'), piece('p3', '📚', 'libro'),
          piece('l1', '🧴', 'botella'), piece('l2', '🥤', 'vaso'), piece('l3', '🛍️', 'bolsa')
        ],
        zones: [
          zone('papel', 'papel', '♻️', C.azul, 0.3, 0.44, 180, ['p1', 'p2', 'p3']),
          zone('plastico', 'plástico', '♻️', C.amarillo, 0.7, 0.44, 180, ['l1', 'l2', 'l3'])
        ]
      },
      hints: ['El papel se dobla y se rompe. El plástico es brillante y se estira.']
    }),
    B.level(8, 4, {
      name: 'La secuencia del semáforo',
      skill: 'click', skills: ['single-click', 'precision', 'directions'],
      goal: 'Enciende el semáforo en el orden correcto.',
      instructions: ['El semáforo cambia de color.', 'Haz clic en el orden: rojo, amarillo, verde.'],
      template: 'sequence',
      params: {
        style: 'light', size: 100, showNumbers: false,
        cards: [
          { id: 'rojo', emoji: '🔴', label: 'rojo', color: C.rojo },
          { id: 'amarillo', emoji: '🟡', label: 'amarillo', color: C.amarillo },
          { id: 'verde', emoji: '🟢', label: 'verde', color: C.verde }
        ],
        order: ['rojo', 'amarillo', 'verde']
      },
      hints: ['Todos los semáforos del mundo siguen ese orden.']
    }),
    B.level(8, 5, {
      name: 'El ascensor',
      skill: 'click', skills: ['click-challenges', 'single-click'],
      goal: 'Lleva el ascensor al piso 3, paso a paso.',
      instructions: ['Primero el piso 1, luego el 2 y luego el 3.', 'Haz clic en los botones del ascensor.'],
      template: 'sequence',
      params: {
        style: 'button', size: 108, showNumbers: true,
        cards: [
          { id: 'p1', emoji: '1️⃣', label: 'piso 1' },
          { id: 'p2', emoji: '2️⃣', label: 'piso 2' },
          { id: 'p3', emoji: '3️⃣', label: 'piso 3' }
        ],
        order: ['p1', 'p2', 'p3']
      },
      hints: ['Los botones del ascensor tienen números. Tócalos en orden.']
    }),
    B.level(8, 6, {
      name: 'El botón derecho',
      skill: 'right-click', skills: ['click', 'select'],
      goal: 'Abre el menú de 4 objetos con el botón derecho.',
      instructions: ['Esta vez usa el botón derecho del mouse.', 'Pon la flecha encima y presiona una vez.'],
      template: 'click', tutorial: 'rightclick',
      params: { count: 4, size: 108, style: 'card', emoji: '📨', label: 'mensaje', button: 'right', guidedTargets: 1 },
      hints: ['El botón derecho está debajo del dedo del medio, al lado derecho del mouse.']
    }),
    B.level(8, 7, {
      name: 'Arrastra los paquetes',
      skill: 'drag', skills: ['drop', 'precision', 'select'],
      goal: 'Entrega 5 paquetes en las casas correctas.',
      instructions: ['Cada casa tiene un número.', 'Arrastra el paquete a la casa que le corresponde.'],
      template: 'drag',
      params: {
        mode: 'match', snap: 56, pieceSize: 80,
        items: [
          piece('c1', '📦', 'paquete 1'), piece('c2', '📦', 'paquete 2'),
          piece('c3', '📦', 'paquete 3'), piece('c4', '🎁', 'regalo'), piece('c5', '✉️', 'carta')
        ],
        zones: [
          zone('h1', 'casa 1', '🏠', null, 0.24, 0.42, 140, ['c1']),
          zone('h2', 'casa 2', '🏠', null, 0.5, 0.42, 140, ['c2', 'c4']),
          zone('h3', 'casa 3', '🏠', null, 0.76, 0.42, 140, ['c3', 'c5'])
        ]
      },
      hints: ['Suelta el paquete cuando la casa brille.']
    }),
    B.level(8, 8, {
      name: 'La máquina de la ciudad',
      skill: 'combine', skills: ['click', 'drag', 'click-challenges'],
      goal: 'Enciende la máquina: 3 botones, 2 piezas y el botón final.',
      instructions: ['Parte 1: presiona los 3 botones.', 'Parte 2: arrastra las piezas. Parte 3: presiona encender.'],
      template: 'mission',
      params: {
        stages: [
          {
            title: 'Parte 1: los botones', instruction: 'Presiona los 3 botones de la máquina.', template: 'click',
            params: { count: 3, size: 104, style: 'button', emoji: '🔘', label: 'botón', appear: 'all' }
          },
          {
            title: 'Parte 2: las piezas', instruction: 'Arrastra las 2 piezas al lugar que les toca.', template: 'drag',
            params: {
              mode: 'match', snap: 58, pieceSize: 84,
              items: [piece('a', '⚙️', 'engranaje'), piece('b', '🔋', 'batería')],
              zones: [
                zone('za', 'engranaje', '⚙️', null, 0.35, 0.42, 120, ['a']),
                zone('zb', 'batería', '🔋', null, 0.65, 0.42, 120, ['b'])
              ]
            }
          },
          {
            title: 'Parte 3: encender', instruction: 'Presiona el botón grande de encender.', template: 'click',
            params: { count: 1, size: 150, style: 'button', emoji: '⚡', label: 'encender', appear: 'all' }
          }
        ]
      },
      hints: ['Cada parte tiene su propia indicación. Léela con calma.']
    }),
    B.level(8, 9, {
      name: 'La ciudad ordenada',
      skill: 'combine', skills: ['click', 'drag', 'select'],
      goal: 'Pon el semáforo en verde y recoge la basura del parque.',
      instructions: ['Parte 1: toca el semáforo en orden.', 'Parte 2: lleva los objetos a su contenedor.'],
      template: 'mission',
      params: {
        stages: [
          {
            title: 'Parte 1: el semáforo', instruction: 'Toca rojo, amarillo y verde.', template: 'sequence',
            params: {
              style: 'light', size: 96, showNumbers: false,
              cards: [
                { id: 'rojo', emoji: '🔴', label: 'rojo', color: C.rojo },
                { id: 'amarillo', emoji: '🟡', label: 'amarillo', color: C.amarillo },
                { id: 'verde', emoji: '🟢', label: 'verde', color: C.verde }
              ],
              order: ['rojo', 'amarillo', 'verde']
            }
          },
          {
            title: 'Parte 2: el parque limpio', instruction: 'Arrastra cada objeto al contenedor correcto.', template: 'drag',
            params: {
              mode: 'sort', snap: 54, pieceSize: 78,
              items: [piece('p1', '📰', 'papel'), piece('p2', '📦', 'cartón'), piece('l1', '🧴', 'botella'), piece('l2', '🥤', 'vaso')],
              zones: [
                zone('z1', 'papel', '♻️', C.azul, 0.3, 0.44, 170, ['p1', 'p2']),
                zone('z2', 'plástico', '♻️', C.amarillo, 0.7, 0.44, 170, ['l1', 'l2'])
              ]
            }
          }
        ]
      },
      hints: ['Al terminar una parte, aparece la siguiente. ¡Tú puedes!']
    }),
    B.level(8, 10, {
      name: 'Día de mercado',
      skill: 'combine', skills: ['click', 'drag', 'precision', 'combine'],
      goal: 'Compra en el mercado: recoge frutas, llévalas a los puestos y paga.',
      instructions: ['Parte 1: toca 3 frutas.', 'Parte 2: arrástralas a su puesto. Parte 3: toca el botón de pagar.'],
      template: 'mission',
      params: {
        stages: [
          {
            title: 'Parte 1: las frutas', instruction: 'Toca 3 frutas del mercado.', template: 'click',
            params: { count: 3, size: 96, style: 'fruit', emoji: '🍎', label: 'fruta', appear: 'all' }
          },
          {
            title: 'Parte 2: los puestos', instruction: 'Arrastra cada fruta a su puesto.', template: 'drag',
            params: {
              mode: 'match', snap: 56, pieceSize: 80,
              items: [piece('f1', '🍎', 'manzana'), piece('f2', '🍌', 'banano'), piece('f3', '🍇', 'uvas')],
              zones: [
                zone('p1', 'puesto de manzanas', '🍎', C.rojo, 0.26, 0.42, 140, ['f1']),
                zone('p2', 'puesto de bananos', '🍌', C.amarillo, 0.5, 0.42, 140, ['f2']),
                zone('p3', 'puesto de uvas', '🍇', C.morado, 0.74, 0.42, 140, ['f3'])
              ]
            }
          },
          {
            title: 'Parte 3: pagar', instruction: 'Presiona el botón verde para pagar.', template: 'click',
            params: { count: 1, size: 140, style: 'button', emoji: '💰', label: 'pagar', appear: 'all' }
          }
        ]
      },
      hints: ['Cada parte es cortita. Respira entre una parte y otra.']
    })
  ];
})(typeof window !== 'undefined' ? window : globalThis);
