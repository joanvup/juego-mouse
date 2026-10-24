/* =========================================================================
   Mouse Aventura — habilidades y estados de aprendizaje
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});

  const SKILLS = {
    'mouse-basics': { name: 'Conozco el mouse', emoji: '🖱️', kid: 'Sé para qué sirve el mouse.', tip: 'Mueve el mouse sobre la mesa y mira cómo se mueve la flecha.' },
    'move': { name: 'Muevo el cursor', emoji: '➡️', kid: 'Muevo la flecha a donde quiero.', tip: 'Movimientos cortos y suaves funcionan mejor.' },
    'reach': { name: 'Llego a los objetos', emoji: '🎯', kid: 'Llevo la flecha hasta un objeto.', tip: 'Mira el objeto y luego mueve la mano despacio.' },
    'hand-eye': { name: 'Coordinación mano-vista', emoji: '👀', kid: 'Mis ojos y mi mano trabajan juntos.', tip: 'Sigue el objetivo con la mirada y mueve el mouse.' },
    'click': { name: 'Hago clic', emoji: '👆', kid: 'Uso el botón izquierdo.', tip: 'Pon la flecha encima y presiona una vez.' },
    'single-click': { name: 'Un solo clic', emoji: '1️⃣', kid: 'Hago un clic, no dos.', tip: 'Un clic corto y suave es suficiente.' },
    'hold': { name: 'Mantengo el clic', emoji: '✊', kid: 'Dejo el botón apretado un ratito.', tip: 'Mantén el botón presionado y luego suéltalo.' },
    'small-target': { name: 'Objetos pequeños', emoji: '🔍', kid: 'Acierto en objetos pequeños.', tip: 'Acércate despacio y frena antes de hacer clic.' },
    'click-vs-hold': { name: 'Clic o mantener', emoji: '🤏', kid: 'Sé cuándo hacer clic y cuándo mantener.', tip: 'Un clic es rapidito; mantener es dejar el botón apretado.' },
    'drag': { name: 'Arrastro objetos', emoji: '🖐️', kid: 'Muevo objetos con el botón apretado.', tip: 'Mantén presionado, mueve y suelta.' },
    'drop': { name: 'Suelto en el lugar correcto', emoji: '📦', kid: 'Dejo el objeto donde va.', tip: 'Suelta el botón cuando estés sobre la zona.' },
    'select': { name: 'Elijo de una colección', emoji: '🧺', kid: 'Escojo el objeto que me piden.', tip: 'Mira la indicación y busca la forma o el color.' },
    'trace': { name: 'Sigo caminos', emoji: '〰️', kid: 'Sigo un camino sin salirme.', tip: 'Avanza despacio y mira un poquito más adelante.' },
    'maze': { name: 'Resuelvo laberintos', emoji: '🧩', kid: 'Encuentro la salida.', tip: 'Prueba los caminos con calma; puedes devolverte.' },
    'directions': { name: 'Movimientos en todas direcciones', emoji: '↗️', kid: 'Muevo el mouse en diagonal, arriba y abajo.', tip: 'Mueve la mano en la misma dirección que quieres ir.' },
    'precision': { name: 'Precisión', emoji: '🎯', kid: 'Hago clic justo en el objetivo.', tip: 'No hay prisa: llegar bien es más importante que llegar rápido.' },
    'speed-control': { name: 'Control de la velocidad', emoji: '⏱️', kid: 'Voy rápido sin equivocarme.', tip: 'La seguridad primero; la velocidad llega sola.' },
    'click-challenges': { name: 'Clic para resolver', emoji: '💡', kid: 'Uso el clic para resolver retos.', tip: 'Piensa qué hay que tocar y luego haz clic.' },
    'right-click': { name: 'Botón derecho', emoji: '🖱️', kid: 'Uso el botón derecho cuando me lo piden.', tip: 'El botón derecho está al lado derecho del mouse.' },
    'wheel': { name: 'Rueda del mouse', emoji: '🎡', kid: 'Giro la rueda del mouse.', tip: 'Gira la rueda con el dedo índice, despacio.' },
    'combine': { name: 'Combino habilidades', emoji: '🌟', kid: 'Uso todo lo que aprendí en una misión.', tip: 'Lee la indicación, piensa y luego actúa.' }
  };

  /* Estados de dominio, ordenados de menor a mayor. */
  const STATES = [
    { id: 'none', label: 'Sin empezar', emoji: '⬜', color: '#9aa7b8' },
    { id: 'learning', label: 'En aprendizaje', emoji: '🌱', color: '#d98a1f' },
    { id: 'practice', label: 'En práctica', emoji: '🔁', color: '#2b7ff5' },
    { id: 'achieved', label: 'Logrado', emoji: '🌟', color: '#2fae5e' },
    { id: 'mastered', label: 'Dominado', emoji: '👑', color: '#b03a8c' }
  ];

  /* Agrupación para el panel docente y la pantalla de progreso. */
  const GROUPS = [
    { name: 'Movimiento', ids: ['mouse-basics', 'move', 'reach', 'hand-eye', 'directions'] },
    { name: 'Clic', ids: ['click', 'single-click', 'hold', 'click-vs-hold', 'click-challenges', 'small-target'] },
    { name: 'Selección y arrastre', ids: ['select', 'drag', 'drop', 'precision'] },
    { name: 'Rutas y laberintos', ids: ['trace', 'maze'] },
    { name: 'Autonomía', ids: ['speed-control', 'right-click', 'wheel', 'combine'] }
  ];

  MA.Skills = {
    all: SKILLS,
    states: STATES,
    groups: GROUPS,
    get: function (id) { return SKILLS[id] || { name: id, emoji: '⭐', kid: '', tip: '' }; },
    list: function () { return Object.keys(SKILLS); },
    state: function (id) {
      for (let i = 0; i < STATES.length; i++) if (STATES[i].id === id) return STATES[i];
      return STATES[0];
    },
    stateIndex: function (id) {
      for (let i = 0; i < STATES.length; i++) if (STATES[i].id === id) return i;
      return 0;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
