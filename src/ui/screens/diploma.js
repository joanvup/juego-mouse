/* Diploma final: Maestro o Maestra del Mouse (se puede imprimir) */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  S.diploma = {
    render: function () {
      const profile = MA.Store.profile();
      const data = MA.Progress.diploma(profile);
      const screen = U.el('div', { class: 'screen screen--diploma ' + UI.sceneClass('castle') });
      screen.appendChild(UI.sceneDecor(MA.Worlds.get(10)));

      const header = U.el('header', { class: 'dip-header' });
      const left = U.el('div', { class: 'dip-header__left' });
      left.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver', onClick: function () { MA.App.go('inicio'); } }));
      left.appendChild(U.el('h1', { class: 'dip-title', text: 'Mi diploma' }));
      header.appendChild(left);
      header.appendChild(UI.btn({ emoji: '🏠', label: 'Inicio', kind: 'soft', size: 'sm', onClick: function () { MA.App.go('inicio'); } }));
      screen.appendChild(header);

      if (!data.completed) {
        const next = MA.Progress.nextPlayable(profile);
        const card = U.el('div', { class: 'dip-locked' });
        card.innerHTML =
          '<div class="dip-locked__icon" aria-hidden="true">🎓</div>' +
          '<h2>Tu diploma te espera</h2>' +
          '<p>Para recibir el diploma de <b>Maestro o Maestra del Mouse</b> hay que completar la última misión del Mundo 10.</p>' +
          '<div class="dip-locked__progress"></div>' +
          '<p class="dip-locked__note">Llevas ' + data.completedLevels + ' de ' + MA.Levels.count() + ' niveles y ' + data.stars + ' estrellas. ¡Vas muy bien!</p>';
        card.querySelector('.dip-locked__progress').appendChild(UI.bar(MA.Progress.progressPercent(profile), { className: 'bar--slim' }));
        const actions = U.el('div', { class: 'dip-actions' });
        if (next) actions.appendChild(UI.btn({ emoji: '▶', label: 'Seguir la aventura', kind: 'primary', onClick: function () { MA.App.go('jugar/' + next.id); } }));
        actions.appendChild(UI.btn({ emoji: '📊', label: 'Mi progreso', kind: 'soft', onClick: function () { MA.App.go('progreso'); } }));
        card.appendChild(actions);
        screen.appendChild(card);
        return { el: screen, title: 'Mi diploma' };
      }

      const actions = U.el('div', { class: 'dip-actions' });
      actions.appendChild(UI.btn({ emoji: '🖨️', label: 'Imprimir diploma', kind: 'primary', size: 'lg', onClick: function () { UI.printHTML(buildDiplomaHTML(profile, data, true), { className: 'print-area--diploma' }); } }));
      actions.appendChild(UI.btn({ emoji: '📊', label: 'Mi progreso', kind: 'soft', onClick: function () { MA.App.go('progreso'); } }));
      actions.appendChild(UI.btn({ emoji: '🎉', label: 'Seguir practicando', kind: 'ghost', onClick: function () { MA.App.go('mapa'); } }));
      screen.appendChild(actions);

      const page = buildDiplomaHTML(profile, data, false);
      const wrap = U.el('div', { class: 'dip-wrap' });
      wrap.innerHTML = page;
      screen.appendChild(wrap);

      const note = U.el('p', { class: 'dip-note', text: 'Puedes imprimir el diploma o guardarlo como PDF desde la ventana de impresión. Compártelo con tu docente y tu familia.' });
      screen.appendChild(note);

      return { el: screen, title: 'Mi diploma' };
    }
  };

  function buildDiplomaHTML(profile, data, forPrint) {
    const name = U.esc(data.name || profile.code);
    const skills = data.skills
      .filter(function (s) { return ['achieved', 'mastered', 'practice'].indexOf(s.state) >= 0; })
      .sort(function (a, b) { return MA.Skills.stateIndex(b.state) - MA.Skills.stateIndex(a.state); })
      .slice(0, 12);
    const badges = (profile.badges || []).map(function (id) {
      const w = MA.Worlds.list.filter(function (x) { return x.badge.id === id; })[0];
      return w ? w.badge.emoji : '🏅';
    }).join(' ');
    return '' +
      '<div class="diploma' + (forPrint ? ' diploma--print' : '') + '">' +
      '<div class="diploma__border" aria-hidden="true"></div>' +
      '<div class="diploma__seal" aria-hidden="true"><span>🎖️</span></div>' +
      '<div class="diploma__content">' +
      '<p class="diploma__kicker">Mouse Aventura · Pequeños Exploradores</p>' +
      '<h1 class="diploma__title">Diploma</h1>' +
      '<p class="diploma__subtitle">Maestro o Maestra del Mouse</p>' +
      '<p class="diploma__lead">Se otorga con orgullo a</p>' +
      '<p class="diploma__name">' + name + '</p>' +
      '<p class="diploma__code">Código de explorador: ' + U.esc(profile.code) + '</p>' +
      '<p class="diploma__text">por completar los <b>100 niveles</b> de los <b>10 mundos</b> de Mouse Aventura, demostrando control del mouse, precisión, coordinación y perseverancia.</p>' +
      '<div class="diploma__stats">' +
      '<div class="diploma__stat"><b>' + data.completedLevels + '</b><small>niveles completados</small></div>' +
      '<div class="diploma__stat"><b>' + data.stars + '</b><small>estrellas ganadas</small></div>' +
      '<div class="diploma__stat"><b>' + data.worlds + '</b><small>mundos superados</small></div>' +
      '<div class="diploma__stat"><b>' + (badges ? data.badges.length : 0) + '</b><small>insignias</small></div>' +
      '</div>' +
      (skills.length ? '<div class="diploma__skills"><p>Habilidades demostradas</p><div class="diploma__skill-grid">' + UI.diplomaSkills(skills) + '</div></div>' : '') +
      (badges ? '<p class="diploma__badges">' + badges + '</p>' : '') +
      '<div class="diploma__foot">' +
      '<div class="diploma__sign"><span></span><b>Docente</b></div>' +
      '<div class="diploma__date"><b>' + U.fmtDate(data.date) + '</b><small>Fecha</small></div>' +
      '<div class="diploma__sign"><span></span><b>Familia</b></div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }
})(window);
