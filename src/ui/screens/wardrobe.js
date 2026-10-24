/* Mi personaje: avatar y accesorios */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  S.wardrobe = {
    render: function () {
      const profile = MA.Store.profile();
      const unlockedWorlds = MA.Progress.completedWorlds(profile);
      const unlockedChars = MA.Progress.unlockedCharacters(profile);
      const owned = profile.inventory.accessories || [];
      const equipped = (profile.avatar && profile.avatar.accessories) || [];

      const screen = U.el('div', { class: 'screen screen--wardrobe ' + UI.sceneClass('forest') });
      screen.appendChild(UI.sceneDecor(MA.Worlds.get(1)));

      const header = U.el('header', { class: 'wd-header' });
      const left = U.el('div', { class: 'wd-header__left' });
      left.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver', onClick: function () { MA.App.go('inicio'); } }));
      const titles = U.el('div', {});
      titles.appendChild(U.el('h1', { class: 'wd-title', text: 'Mi personaje' }));
      titles.appendChild(U.el('p', { class: 'wd-subtitle', text: 'Elige tu avatar y personalízalo con monedas ganadas jugando.' }));
      left.appendChild(titles);
      header.appendChild(left);
      const right = U.el('div', { class: 'wd-header__right' });
      right.appendChild(UI.chip(U.fmtNumber(profile.coins || 0) + ' monedas', '💰', { className: 'chip--coin' }));
      right.appendChild(UI.btn({ label: 'Mi progreso', kind: 'soft', size: 'sm', onClick: function () { MA.App.go('progreso'); } }));
      header.appendChild(right);
      screen.appendChild(header);

      const body = U.el('div', { class: 'wd-body' });
      const preview = U.el('div', { class: 'wd-preview' });
      preview.appendChild(UI.profileAvatar(profile, 220, 'happy'));
      preview.appendChild(U.el('h2', { class: 'wd-preview__name', text: UI.profileName(profile) + ' · ' + MA.Avatars.character(profile.avatar.character).name }));
      preview.appendChild(UI.btn({
        label: 'Cambiar de personaje', kind: 'soft', size: 'sm',
        onClick: function () { document.getElementById('wd-characters').scrollIntoView({ behavior: MA.Store.settings().reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
      }));
      const equippedNames = equipped.map(function (id) {
        const a = MA.Avatars.accessory(id); return a ? a.name : '';
      }).filter(Boolean);
      preview.appendChild(U.el('p', { class: 'wd-preview__acc', text: equippedNames.length ? 'Accesorios: ' + equippedNames.join(', ') : 'Sin accesorios puestos' }));
      body.appendChild(preview);

      const main = U.el('div', { class: 'wd-main' });

      /* Personajes */
      const charSection = U.el('section', { class: 'wd-section', id: 'wd-characters' });
      charSection.appendChild(U.el('h2', { class: 'wd-section__title', text: 'Personajes' }));
      charSection.appendChild(U.el('p', { class: 'wd-help', text: 'Algunos personajes se abren al completar mundos. No cuestan monedas.' }));
      const charGrid = U.el('div', { class: 'char-grid' });
      MA.Avatars.characters.forEach(function (ch) {
        const isUnlocked = unlockedChars.indexOf(ch.id) >= 0;
        const isSelected = profile.avatar.character === ch.id;
        const card = U.el('button', {
          class: 'char-card' + (isSelected ? ' is-selected' : '') + (isUnlocked ? '' : ' is-locked'),
          type: 'button', 'aria-pressed': isSelected ? 'true' : 'false',
          'aria-label': ch.name + (isUnlocked ? '' : ', bloqueado')
        });
        card.appendChild(UI.avatar(ch.id, isSelected ? equipped : [], 92, isSelected ? 'happy' : 'idle'));
        card.appendChild(U.el('b', { text: ch.name }));
        card.appendChild(U.el('small', { text: isUnlocked ? ch.desc : 'Se abre al completar el mundo ' + ch.unlockWorld }));
        if (isSelected) card.appendChild(U.el('span', { class: 'char-card__tag', text: 'Elegido' }));
        card.addEventListener('click', function () {
          if (!isUnlocked) {
            MA.UI.toast('Completa el Mundo ' + ch.unlockWorld + ' para abrir a ' + ch.name + '.');
            return;
          }
          if (MA.Store.selectCharacter(ch.id)) {
            MA.Audio.play('success');
            MA.App.refresh();
          }
        });
        charGrid.appendChild(card);
      });
      charSection.appendChild(charGrid);
      main.appendChild(charSection);

      /* Accesorios */
      const accSection = U.el('section', { class: 'wd-section' });
      accSection.appendChild(U.el('h2', { class: 'wd-section__title', text: 'Accesorios' }));
      accSection.appendChild(U.el('p', { class: 'wd-help', text: 'Se compran con monedas virtuales. No se usa dinero real ni hay compras.' }));
      const accGrid = U.el('div', { class: 'acc-grid' });
      MA.Avatars.accessories.forEach(function (acc) {
        const has = owned.indexOf(acc.id) >= 0;
        const isOn = equipped.indexOf(acc.id) >= 0;
        const canBuy = !has && (profile.coins || 0) >= acc.price;
        const card = U.el('div', { class: 'acc-card' + (has ? ' is-owned' : '') + (isOn ? ' is-equipped' : '') });
        card.innerHTML =
          '<span class="acc-card__emoji" aria-hidden="true">' + acc.emoji + '</span>' +
          '<div class="acc-card__info"><b>' + U.esc(acc.name) + '</b>' +
          '<small>' + (has ? (isOn ? 'Puesto ahora' : 'En tu mochila') : (acc.price === 0 ? 'Gratis' : acc.price + ' monedas')) + '</small></div>';
        const actions = U.el('div', { class: 'acc-card__actions' });
        if (!has) {
          const buyBtn = UI.btn({
            label: acc.price === 0 ? 'Gratis' : acc.price + ' 💰', kind: canBuy ? 'primary' : 'soft', size: 'sm',
            onClick: function () {
              const res = MA.Store.buyAccessory(acc.id);
              if (res.ok) { MA.Audio.play('coin'); MA.UI.toast('¡' + acc.name + ' es tuyo!'); MA.App.refresh(); }
              else if (res.reason === 'sin-monedas') MA.UI.toast('Te faltan ' + res.missing + ' monedas. ¡Sigue jugando!');
              else MA.UI.toast('No se pudo comprar ese accesorio.');
            }
          });
          if (!canBuy) buyBtn.disabled = true;
          actions.appendChild(buyBtn);
        } else {
          actions.appendChild(UI.btn({
            label: isOn ? 'Quitar' : 'Poner', kind: isOn ? 'ghost' : 'soft', size: 'sm',
            onClick: function () {
              MA.Store.equipAccessory(acc.id, !isOn);
              MA.Audio.play('click');
              MA.App.refresh();
            }
          }));
        }
        card.appendChild(actions);
        accGrid.appendChild(card);
      });
      accSection.appendChild(accGrid);
      main.appendChild(accSection);

      if (unlockedWorlds.length < 10) {
        const note = U.el('div', { class: 'wd-note' });
        note.innerHTML = '<span aria-hidden="true">🎁</span><p>Al completar cada mundo ganas una insignia y un cofre con monedas extra para tus accesorios.</p>';
        main.appendChild(note);
      }

      body.appendChild(main);
      screen.appendChild(body);
      return { el: screen, title: 'Mi personaje' };
    }
  };
})(window);
