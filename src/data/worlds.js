/* =========================================================================
   Mouse Aventura — mundos temáticos (10 mundos × 10 niveles)
   Cada mundo declara su objetivo pedagógico, habilidades y su escenario.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});

  const WORLDS = [
    {
      id: 1, key: 'bosque', name: 'El bosque de los primeros movimientos', short: 'Bosque',
      objective: 'Mover el cursor y llevarlo hasta los objetos.',
      skills: ['mouse-basics', 'move', 'reach', 'hand-eye'],
      scene: 'forest', icon: '🌳', decor: ['🌲', '🍄', '🦋', '🌼'],
      color: '#2f9e6b', color2: '#8fd6a8',
      badge: { id: 'badge-w1', name: 'Explorador del bosque', emoji: '🍃' },
      story: 'Mimo encontró un bosque lleno de amigos. ¡Muévete con el mouse para saludarlos!'
    },
    {
      id: 2, key: 'isla', name: 'La isla de los clics mágicos', short: 'Isla',
      objective: 'Hacer clic con el botón izquierdo sobre los objetivos.',
      skills: ['click', 'single-click', 'select'],
      scene: 'island', icon: '🏝️', decor: ['🌴', '🐚', '⛵', '🦜'],
      color: '#0e94c4', color2: '#8fe3ef',
      badge: { id: 'badge-w2', name: 'Amigo de la isla', emoji: '🐚' },
      story: 'En la isla hay cofres y globos que se despiertan con un clic.'
    },
    {
      id: 3, key: 'jardin', name: 'El jardín de la precisión', short: 'Jardín',
      objective: 'Mejorar la puntería eligiendo el objetivo correcto.',
      skills: ['precision', 'select', 'click', 'small-target'],
      scene: 'garden', icon: '🌸', decor: ['🌷', '🐞', '🦋', '🌻'],
      color: '#c4568f', color2: '#ffc8e2',
      badge: { id: 'badge-w3', name: 'Jardinero preciso', emoji: '🌷' },
      story: 'Las flores del jardín necesitan que las riegues con mucho cuidado.'
    },
    {
      id: 4, key: 'burbujas', name: 'La fábrica de burbujas', short: 'Burbujas',
      objective: 'Coordinar la vista y la mano con objetivos que se mueven.',
      skills: ['hand-eye', 'speed-control', 'click', 'hold'],
      scene: 'bubbles', icon: '🧼', decor: ['🧼', '✨', '🎈', '⭐'],
      color: '#4c6ef5', color2: '#bcd0ff',
      badge: { id: 'badge-w4', name: 'Cazador de burbujas', emoji: '🧼' },
      story: 'La fábrica produce burbujas por todas partes. ¡Explótalas sin prisa!'
    },
    {
      id: 5, key: 'granja', name: 'La granja de los animales', short: 'Granja',
      objective: 'Elegir el elemento correcto según color, forma o tipo.',
      skills: ['select', 'precision', 'click', 'click-vs-hold'],
      scene: 'farm', icon: '🚜', decor: ['🌾', '🐮', '🐔', '🍎'],
      color: '#d98a1f', color2: '#ffe0a3',
      badge: { id: 'badge-w5', name: 'Amigo de la granja', emoji: '🐮' },
      story: 'En la granja cada animal quiere su comida favorita. ¡Ayúdalos!'
    },
    {
      id: 6, key: 'taller', name: 'El taller de los pequeños constructores', short: 'Taller',
      objective: 'Arrastrar objetos y soltarlos en el lugar correcto.',
      skills: ['drag', 'drop', 'hold', 'select'],
      scene: 'workshop', icon: '🔧', decor: ['🔨', '🧱', '🔩', '📏'],
      color: '#8a5a2b', color2: '#e8c79a',
      badge: { id: 'badge-w6', name: 'Constructor experto', emoji: '🔨' },
      story: 'El taller abre sus puertas. Arrastra las piezas y construye.'
    },
    {
      id: 7, key: 'laberinto', name: 'El laberinto de los exploradores', short: 'Laberinto',
      objective: 'Seguir caminos y moverse con control por laberintos.',
      skills: ['trace', 'maze', 'directions', 'hand-eye'],
      scene: 'maze', icon: '🗺️', decor: ['🧭', '🌿', '⛰️', '🌳'],
      color: '#7b8f3a', color2: '#dce8b0',
      badge: { id: 'badge-w7', name: 'Explorador del laberinto', emoji: '🧭' },
      story: 'Sigue el camino con calma. Si te sales, puedes volver a entrar.'
    },
    {
      id: 8, key: 'ciudad', name: 'La ciudad de los botones', short: 'Ciudad',
      objective: 'Combinar clics, arrastres y secuencias en pantallas parecidas a las de verdad.',
      skills: ['click', 'drag', 'drop', 'combine', 'right-click'],
      scene: 'city', icon: '🏙️', decor: ['🏠', '🚦', '🚌', '🏪'],
      color: '#2b7ff5', color2: '#a7c8ff',
      badge: { id: 'badge-w8', name: 'Piloto de la ciudad', emoji: '🚦' },
      story: 'La ciudad tiene puertas, botones y semáforos. ¡Todo con el mouse!'
    },
    {
      id: 9, key: 'espacio', name: 'La aventura espacial', short: 'Espacio',
      objective: 'Planificar y combinar habilidades para completar misiones.',
      skills: ['combine', 'precision', 'drag', 'maze', 'wheel'],
      scene: 'space', icon: '🚀', decor: ['🪐', '⭐', '🌙', '🛸'],
      color: '#5b3fc4', color2: '#c3b3ff',
      badge: { id: 'badge-w9', name: 'Capitán espacial', emoji: '🚀' },
      story: 'El espacio necesita pilotos que piensen antes de moverse.'
    },
    {
      id: 10, key: 'castillo', name: 'La gran misión del maestro del mouse', short: 'Misión final',
      objective: 'Integrar todas las habilidades en misiones de varias etapas.',
      skills: ['combine', 'precision', 'trace', 'drag', 'click'],
      scene: 'castle', icon: '🏰', decor: ['🏰', '👑', '✨', '🎖️'],
      color: '#b03a8c', color2: '#ffb8eb',
      badge: { id: 'badge-w10', name: 'Maestro o Maestra del Mouse', emoji: '🏆' },
      story: 'La última aventura reúne todo lo aprendido. ¡Vas a lograrlo!'
    }
  ];

  const byId = {};
  WORLDS.forEach(function (w) { byId[w.id] = w; });

  MA.Worlds = {
    list: WORLDS,
    get: function (id) { return byId[id] || null; },
    count: WORLDS.length,
    badgeFor: function (worldId) { const w = byId[worldId]; return w ? w.badge : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
