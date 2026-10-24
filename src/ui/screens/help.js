/* Ayuda: cómo se juega, cómo usar el mouse y práctica libre */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  const PRACTICE = [
    { kind: 'move', emoji: '🖱️', title: 'Mover el mouse', text: 'Mueve la flecha de un lugar a otro sin hacer clic.' },
    { kind: 'click', emoji: '👆', title: 'Hacer clic', text: 'Coloca la flecha sobre el objeto y presiona una vez el botón izquierdo.' },
    { kind: 'drag', emoji: '🖐️', title: 'Arrastrar y soltar', text: 'Mantén el botón izquierdo, mueve y suelta en el destino.' },
    { kind: 'path', emoji: '🌀', title: 'Seguir caminos', text: 'Avanza despacio por el camino y llega a la meta.' },
    { kind: 'rightclick', emoji: '🖱️', title: 'Botón derecho', text: 'Se usa en un nivel avanzado, siempre con supervisión.' },
    { kind: 'wheel', emoji: '🎡', title: 'La rueda', text: 'Gira la rueda del mouse despacio para llenar la barra.' }
  ];

  S.help = {
    render: function () {
      const profile = MA.Store.profile();
      const screen = U.el('div', { class: 'screen screen--help ' + UI.sceneClass('forest') });
      screen.appendChild(UI.sceneDecor(MA.Worlds.get(1)));

      const header = U.el('header', { class: 'help-header' });
      const left = U.el('div', { class: 'help-header__left' });
      left.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver', onClick: function () { MA.App.go(profile ? 'inicio' : 'perfil'); } }));
      const titles = U.el('div', {});
      titles.appendChild(U.el('h1', { class: 'help-title', text: 'Ayuda' }));
      titles.appendChild(U.el('p', { class: 'help-subtitle', text: 'Todo lo que necesitas para jugar con el mouse.' }));
      left.appendChild(titles);
      header.appendChild(left);
      header.appendChild(UI.btn({
        emoji: '▶', label: profile ? 'Volver a jugar' : 'Empezar', kind: 'primary', size: 'sm',
        onClick: function () { MA.App.go(profile ? 'inicio' : 'perfil'); }
      }));
      screen.appendChild(header);

      const body = U.el('div', { class: 'help-body' });

      /* Cómo se juega */
      const how = U.el('section', { class: 'help-card help-card--how' });
      how.appendChild(U.el('h2', { text: '¿Cómo se juega?' }));
      const steps = U.el('ol', { class: 'help-steps' });
      ['Elige tu personaje.', 'Entra a un mundo y toca un nivel.', 'Escucha o lee la indicación de Mimo.', 'Mueve el mouse y completa la actividad.', 'Gana estrellas, monedas e insignias.'].forEach(function (t) {
        steps.appendChild(U.el('li', { text: t }));
      });
      how.appendChild(steps);
      body.appendChild(how);

      /* El mouse */
      const mouse = U.el('section', { class: 'help-card help-card--mouse' });
      mouse.appendChild(U.el('h2', { text: 'Este es el mouse' }));
      const mouseWrap = U.el('div', { class: 'help-mouse' });
      mouseWrap.innerHTML = UI.mouseFigure('left');
      const mouseInfo = U.el('div', { class: 'help-mouse__info' });
      mouseInfo.appendChild(mousePart('🖱️', 'Botón izquierdo', 'Es el que más vas a usar. Sirve para hacer clic y arrastrar.'));
      mouseInfo.appendChild(mousePart('🎡', 'Rueda o botón central', 'Se gira con el dedo para subir o bajar. La usamos en un nivel especial.'));
      mouseInfo.appendChild(mousePart('🖱️', 'Botón derecho', 'Se usa solo en un nivel avanzado y con ayuda del docente.'));
      mouseInfo.appendChild(U.el('p', { class: 'help-tip', text: 'Apoya la mano sobre el mouse con suavidad. No necesitas apretar fuerte.' }));
      mouseWrap.appendChild(mouseInfo);
      mouse.appendChild(mouseWrap);
      body.appendChild(mouse);

      /* Práctica */
      const practice = U.el('section', { class: 'help-card' });
      practice.appendChild(U.el('h2', { text: 'Practica aquí mismo' }));
      practice.appendChild(U.el('p', { class: 'help-text', text: 'Estos mini tutoriales no cuentan para tu progreso: son para probar el mouse.' }));
      const grid = U.el('div', { class: 'practice-grid' });
      PRACTICE.forEach(function (p) {
        const card = U.el('div', { class: 'practice-card' });
        card.innerHTML = '<span class="practice-card__emoji" aria-hidden="true">' + p.emoji + '</span>' +
          '<b>' + U.esc(p.title) + '</b><p>' + U.esc(p.text) + '</p>';
        card.appendChild(UI.btn({
          label: 'Practicar', kind: 'soft', size: 'sm',
          onClick: function () {
            const t = (MA.LevelBuilder.tutorials[p.kind]) || null;
            MA.Tutorial.open({
              kind: p.kind, title: p.title, steps: t ? t.steps : ['Sigue la indicación y prueba con el mouse.'],
              emoji: p.emoji
            });
          }
        }));
        grid.appendChild(card);
      });
      practice.appendChild(grid);
      body.appendChild(practice);

      /* Si algo cuesta */
      const tips = U.el('section', { class: 'help-card help-card--tips' });
      tips.appendChild(U.el('h2', { text: 'Si algo te cuesta' }));
      const tipList = U.el('ul', { class: 'help-list' });
      [
        'Toca el botón 💡 Ayuda dentro del nivel: te muestra dónde está el objetivo y hace las cosas más fáciles un ratito.',
        'Puedes repetir cualquier nivel las veces que quieras. Nunca pierdes lo que ya lograste.',
        'Si te sales de un camino o sueltas una pieza en el lugar equivocado, el juego te deja volver a intentarlo sin reiniciar todo.',
        'Con el botón ⏸ puedes pausar, leer las indicaciones o ir al mapa.',
        'No hay castigos: los errores son parte de aprender.'
      ].forEach(function (t) { tipList.appendChild(U.el('li', { text: t })); });
      tips.appendChild(tipList);
      body.appendChild(tips);

      /* Familias y docentes */
      const family = U.el('section', { class: 'help-card help-card--family' });
      family.appendChild(U.el('h2', { text: 'Para familias y docentes' }));
      family.appendChild(U.el('p', { class: 'help-text', text: 'Mouse Aventura está diseñado para primer grado (6 y 7 años). Enseña movimiento del cursor, clic, arrastre, rutas y laberintos con dificultad gradual. No tiene publicidad, compras ni enlaces externos.' }));
      const famActions = U.el('div', { class: 'help-actions' });
      famActions.appendChild(UI.btn({ emoji: '📊', label: 'Mi progreso', kind: 'soft', onClick: function () { MA.App.go(profile ? 'progreso' : 'perfil'); } }));
      famActions.appendChild(UI.btn({ emoji: '🎓', label: 'Panel docente', kind: 'ghost', onClick: function () { MA.App.go('docente'); } }));
      family.appendChild(famActions);
      body.appendChild(family);

      /* Preguntas frecuentes */
      const faq = U.el('section', { class: 'help-card' });
      faq.appendChild(U.el('h2', { text: 'Preguntas frecuentes' }));
      [
        ['¿Necesito internet para jugar?', 'No. El juego funciona sin conexión una vez que se cargó; si está instalado como aplicación web, se puede abrir sin internet.'],
        ['¿Se pierde el progreso si cierro el navegador?', 'No. Se guarda automáticamente en este computador. También puedes descargar una copia desde Configuración.'],
        ['¿Puedo jugar sin teclado?', 'Sí. Todo el juego se completa solo con el mouse. El teclado es opcional y solo sirve para atajos como pausar.'],
        ['¿El juego usa compras o publicidad?', 'No. Las monedas son virtuales y se ganan jugando. No hay anuncios, compras ni enlaces externos.'],
        ['¿El PIN del panel docente es privado?', 'El PIN es una protección básica para evitar entradas accidentales. Al guardarse en el mismo computador, no es una medida de seguridad robusta.']
      ].forEach(function (pair) {
        const det = U.el('details', { class: 'faq' });
        det.appendChild(U.el('summary', { text: pair[0] }));
        det.appendChild(U.el('p', { text: pair[1] }));
        faq.appendChild(det);
      });
      body.appendChild(faq);

      const foot = U.el('div', { class: 'help-footer' });
      foot.appendChild(U.el('span', { text: 'Mouse Aventura: Pequeños Exploradores · 100 niveles · 10 mundos' }));
      foot.appendChild(UI.btn({ emoji: '🏠', label: 'Inicio', kind: 'ghost', size: 'sm', onClick: function () { MA.App.go(profile ? 'inicio' : 'perfil'); } }));
      body.appendChild(foot);

      screen.appendChild(body);
      return { el: screen, title: 'Ayuda' };
    }
  };

  function mousePart(emoji, title, text) {
    const el = U.el('div', { class: 'mouse-part' });
    el.innerHTML = '<span aria-hidden="true">' + emoji + '</span><div><b>' + U.esc(title) + '</b><small>' + U.esc(text) + '</small></div>';
    return el;
  }
})(window);
