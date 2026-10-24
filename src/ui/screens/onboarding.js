/* Selección de perfil y creación del explorador */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  S.onboarding = {
    render: function () {
      const profiles = MA.Store.profiles();
      const active = MA.Store.profile();
      const screen = U.el('div', { class: 'screen screen--onboarding ' + UI.sceneClass('forest') });
      screen.appendChild(UI.sceneDecor(MA.Worlds.get(1)));

      const bar = U.el('header', { class: 'onb-top' });
      if (active) {
        bar.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver al inicio', onClick: function () { MA.App.go('inicio'); } }));
      }
      bar.appendChild(U.el('h1', { class: 'onb-title', text: '¿Quién va a jugar hoy?' }));
      screen.appendChild(bar);

      if (profiles.length) {
        const list = U.el('div', { class: 'profile-list' });
        profiles.forEach(function (p) {
          const card = U.el('button', { class: 'profile-card' + (active && active.code === p.code ? ' is-active' : ''), type: 'button' });
          card.appendChild(UI.profileAvatar(p, 64, 'happy'));
          const info = U.el('div', { class: 'profile-card__info' });
          info.appendChild(U.el('strong', { text: UI.profileName(p) }));
          info.appendChild(U.el('small', { text: 'Código ' + p.code }));
          const pct = MA.Progress.completedCount(p) / MA.Levels.count() * 100;
          info.appendChild(UI.bar(pct, { className: 'bar--slim' }));
          info.appendChild(U.el('small', { text: MA.Progress.completedCount(p) + ' de ' + MA.Levels.count() + ' niveles · ' + MA.Progress.totalStars(p) + ' estrellas' }));
          card.appendChild(info);
          card.addEventListener('click', function () {
            MA.Store.setActiveProfile(p.code);
            MA.Audio.play('success');
            MA.App.go('inicio');
          });
          list.appendChild(card);
        });
        screen.appendChild(list);
      }

      const newPanel = U.el('section', { class: 'onb-new' });
      newPanel.appendChild(U.el('h2', { class: 'onb-subtitle', text: profiles.length ? 'O crea un explorador nuevo' : 'Elige tu personaje' }));
      newPanel.appendChild(U.el('p', { class: 'onb-help', text: 'Elige el personaje que te acompañará en los 10 mundos.' }));

      let selected = 'mimo';
      const grid = U.el('div', { class: 'avatar-grid', role: 'radiogroup', 'aria-label': 'Personajes' });
      const completedWorlds = [];
      MA.Avatars.characters.forEach(function (ch) {
        const unlocked = MA.Avatars.isCharacterUnlocked(ch.id, completedWorlds);
        const card = U.el('button', {
          class: 'avatar-card' + (ch.id === selected ? ' is-selected' : '') + (unlocked ? '' : ' is-locked'),
          type: 'button', role: 'radio', 'aria-checked': ch.id === selected ? 'true' : 'false',
          'aria-label': ch.name + (unlocked ? '' : ', se desbloquea al completar el mundo ' + ch.unlockWorld)
        });
        card.appendChild(UI.avatar(ch.id, [], 96, 'idle'));
        card.appendChild(U.el('strong', { class: 'avatar-card__name', text: ch.name }));
        card.appendChild(U.el('span', { class: 'avatar-card__desc', text: ch.desc }));
        if (!unlocked) {
          card.appendChild(U.el('span', { class: 'avatar-card__lock', html: '🔒<small>Se abre al completar el mundo ' + ch.unlockWorld + '</small>' }));
        }
        card.addEventListener('click', function () {
          if (!unlocked) {
            MA.UI.toast('Ese personaje se abre al completar el mundo ' + ch.unlockWorld + '.');
            return;
          }
          selected = ch.id;
          U.$$('.avatar-card', grid).forEach(function (c) { c.classList.remove('is-selected'); c.setAttribute('aria-checked', 'false'); });
          card.classList.add('is-selected');
          card.setAttribute('aria-checked', 'true');
          try { localStorage.setItem('ma.lastCharacter', ch.id); } catch (e) {}
          MA.Audio.play('hover');
        });
        grid.appendChild(card);
      });
      try {
        const remembered = localStorage.getItem('ma.lastCharacter');
        if (remembered && MA.Avatars.character(remembered) && MA.Avatars.character(remembered).free) selected = remembered;
      } catch (e) {}
      newPanel.appendChild(grid);

      const form = U.el('div', { class: 'onb-form' });
      const label = U.el('label', { class: 'onb-label', for: 'onb-name', text: 'Tu nombre (opcional)' });
      const input = U.el('input', {
        id: 'onb-name', class: 'onb-input', type: 'text', maxlength: '24',
        placeholder: 'Ejemplo: Ana', autocomplete: 'off', 'aria-describedby': 'onb-name-help'
      });
      form.appendChild(label);
      form.appendChild(input);
      form.appendChild(U.el('p', { id: 'onb-name-help', class: 'onb-help', text: 'Puedes escribir solo tu primer nombre o dejar el código. No pedimos datos personales.' }));

      const startBtn = UI.btn({
        label: profiles.length ? '¡Crear explorador!' : '¡Empezar la aventura!',
        emoji: '🚀', kind: 'primary', size: 'xl',
        onClick: function () {
          const p = MA.Store.createProfile({ name: input.value, character: selected });
          MA.Store.setActiveProfile(p.code);
          MA.Audio.play('celebrate');
          MA.UI.toast('¡Bienvenido, ' + UI.profileName(p) + '! Tu aventura comienza en el Mundo 1.');
          MA.App.go('mapa');
        }
      });
      form.appendChild(startBtn);
      newPanel.appendChild(form);
      screen.appendChild(newPanel);

      const foot = U.el('div', { class: 'onb-foot' });
      foot.appendChild(U.el('span', { text: 'Un docente puede crear perfiles con códigos desde el panel docente.' }));
      foot.appendChild(UI.btn({ label: 'Panel docente', kind: 'ghost', size: 'sm', icon: 'teacher', onClick: function () { MA.App.go('docente'); } }));
      screen.appendChild(foot);

      return { el: screen, title: 'Elige tu personaje' };
    }
  };
})(window);
