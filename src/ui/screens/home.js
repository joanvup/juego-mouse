/* Pantalla de inicio */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  S.home = {
    render: function () {
      const profile = MA.Store.profile();
      const next = MA.Progress.nextPlayable(profile) || MA.Progress.lastPlayedLevel(profile) || MA.Levels.first();
      const last = MA.Progress.lastPlayedLevel(profile);
      const hasProgress = MA.Progress.completedCount(profile) > 0;
      const completedAll = MA.Progress.completedCount(profile) >= MA.Levels.count();
      const world = next ? MA.Worlds.get(next.world) : MA.Worlds.get(1);
      const nextStatus = next ? MA.Progress.levelStatus(profile, next) : { status: 'available' };

      const screen = U.el('div', { class: 'screen screen--home ' + UI.sceneClass(world ? world.scene : 'forest') });
      screen.appendChild(UI.sceneDecor(world));

      const top = U.el('div', { class: 'home-top' });
      const who = U.el('div', { class: 'home-who' });
      who.appendChild(UI.profileAvatar(profile, 62, 'happy'));
      const whoText = U.el('div', { class: 'home-who__text' });
      whoText.appendChild(U.el('span', { class: 'home-who__hi', text: '¡Hola, ' + UI.profileName(profile) + '!' }));
      whoText.appendChild(U.el('span', { class: 'home-who__code', text: 'Código ' + (profile.code || '—') }));
      who.appendChild(whoText);
      who.appendChild(UI.btn({
        label: 'Cambiar', kind: 'soft', size: 'sm', onClick: function () { MA.App.go('perfil'); }
      }));
      top.appendChild(who);

      const stats = U.el('div', { class: 'home-stats' });
      stats.appendChild(UI.chip(U.fmtNumber(profile.coins || 0), '💰', { className: 'chip--coin' }));
      stats.appendChild(UI.chip(MA.Progress.totalStars(profile) + '/' + MA.Progress.maxStars(), '⭐', { className: 'chip--star' }));
      stats.appendChild(UI.chip(MA.Progress.completedWorlds(profile).length + '/10', '🏅', { className: 'chip--badge' }));
      top.appendChild(stats);
      screen.appendChild(top);

      const main = U.el('div', { class: 'home-main' });

      const hero = U.el('div', { class: 'home-hero' });
      const logo = U.el('div', { class: 'home-logo' });
      logo.innerHTML =
        '<div class="home-logo__mouse" aria-hidden="true">🐭</div>' +
        '<h1 class="home-title"><span class="home-title__a">Mouse</span> <span class="home-title__b">Aventura</span></h1>' +
        '<p class="home-subtitle">Pequeños Exploradores</p>' +
        '<p class="home-tagline">Mueve, haz clic, arrastra y recorre 10 mundos mágicos.</p>';
      hero.appendChild(logo);

      const mascot = U.el('div', { class: 'home-mascot' });
      mascot.appendChild(UI.profileAvatar(profile, 168, hasProgress ? 'happy' : 'idle'));
      const bubbleText = completedAll
        ? '¡Completaste los 100 niveles! Tu diploma te espera.'
        : hasProgress
          ? '¡Qué bueno verte otra vez! Continuemos la aventura.'
          : '¡Hola! Soy tu guía. Vamos a aprender a usar el mouse jugando.';
      mascot.appendChild(U.el('div', { class: 'home-bubble', text: bubbleText }));
      hero.appendChild(mascot);
      main.appendChild(hero);

      const menu = U.el('nav', { class: 'home-menu', 'aria-label': 'Menú principal' });

      const playLabel = completedAll ? 'VER MI DIPLOMA' : (hasProgress ? 'SEGUIR JUGANDO' : 'JUGAR');
      const playHint = completedAll
        ? 'Revisa tu diploma y tus medallas'
        : next ? ('Mundo ' + next.world + ' · Nivel ' + next.index + ': ' + next.name) : 'Empezar la aventura';
      const playBtn = U.el('button', { class: 'home-play', type: 'button' });
      playBtn.innerHTML = '<span class="home-play__icon" aria-hidden="true">▶</span>' +
        '<span class="home-play__text"><b>' + playLabel + '</b><small>' + U.esc(playHint) + '</small></span>';
      playBtn.addEventListener('click', function () {
        if (completedAll) { MA.App.go('diploma'); return; }
        if (next) MA.App.go('jugar/' + next.id);
      });
      menu.appendChild(playBtn);

      if (hasProgress && !completedAll) {
        menu.appendChild(homeButton({
          emoji: '📖', label: 'CONTINUAR AVENTURA',
          hint: last ? (last.name + ' · Mundo ' + last.world) : 'Tu último nivel',
          onClick: function () { MA.App.go('jugar/' + (last ? last.id : next.id)); }
        }));
      }
      menu.appendChild(homeButton({
        emoji: '🗺️', label: 'MAPA DE MUNDOS',
        hint: 'Elige un mundo y un nivel',
        onClick: function () { MA.App.go('mapa'); }
      }));
      menu.appendChild(homeButton({
        emoji: '📊', label: 'MI PROGRESO',
        hint: 'Estrellas, medallas y habilidades',
        onClick: function () { MA.App.go('progreso'); }
      }));
      menu.appendChild(homeButton({
        emoji: '🧢', label: 'MI PERSONAJE',
        hint: 'Cambia tu avatar y accesorios',
        onClick: function () { MA.App.go('personaje'); }
      }));
      menu.appendChild(homeButton({
        emoji: '⚙️', label: 'CONFIGURACIÓN',
        hint: 'Sonido, movimiento y accesibilidad',
        onClick: function () { MA.App.go('ajustes'); }
      }));
      menu.appendChild(homeButton({
        emoji: '❓', label: 'AYUDA',
        hint: 'Cómo se juega y cómo usar el mouse',
        onClick: function () { MA.App.go('ayuda'); }
      }));

      main.appendChild(menu);

      const progressNote = U.el('div', { class: 'home-progress-note' });
      progressNote.appendChild(U.el('span', { class: 'home-progress-note__label', text: 'Tu aventura va así:' }));
      progressNote.appendChild(UI.bar(MA.Progress.progressPercent(profile), { className: 'bar--slim' }));
      progressNote.appendChild(U.el('span', { class: 'home-progress-note__pct', text: MA.Progress.progressPercent(profile) + '%' }));
      main.appendChild(progressNote);

      screen.appendChild(main);

      const footer = U.el('div', { class: 'home-footer' });
      footer.appendChild(U.el('span', { text: 'Primer grado · 6 y 7 años · 100 niveles' }));
      footer.appendChild(UI.btn({
        label: 'Panel docente', kind: 'ghost', size: 'sm', icon: 'teacher',
        onClick: function () { MA.App.go('docente'); }
      }));
      screen.appendChild(footer);

      return { el: screen, title: 'Inicio' };
    }
  };

  function homeButton(opts) {
    const b = U.el('button', { class: 'home-btn', type: 'button' });
    b.innerHTML = '<span class="home-btn__emoji" aria-hidden="true">' + opts.emoji + '</span>' +
      '<span class="home-btn__text"><b>' + U.esc(opts.label) + '</b><small>' + U.esc(opts.hint || '') + '</small></span>' +
      '<span class="home-btn__arrow" aria-hidden="true">›</span>';
    b.addEventListener('click', opts.onClick);
    return b;
  }
})(window);
