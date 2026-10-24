/* Configuración: sonido, movimiento, accesibilidad y respaldos */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  S.settings = {
    render: function () {
      const profile = MA.Store.profile();
      const s = MA.Store.settings();
      const screen = U.el('div', { class: 'screen screen--settings ' + UI.sceneClass('forest') });
      screen.appendChild(UI.sceneDecor(MA.Worlds.get(1)));

      const header = U.el('header', { class: 'set-header' });
      const left = U.el('div', { class: 'set-header__left' });
      left.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver', onClick: function () { MA.App.go('inicio'); } }));
      const titles = U.el('div', {});
      titles.appendChild(U.el('h1', { class: 'set-title', text: 'Configuración' }));
      titles.appendChild(U.el('p', { class: 'set-subtitle', text: 'Ajusta el sonido y la accesibilidad a tu gusto.' }));
      left.appendChild(titles);
      header.appendChild(left);
      header.appendChild(UI.btn({ emoji: '🏠', label: 'Volver al inicio', kind: 'soft', size: 'sm', onClick: function () { MA.App.go('inicio'); } }));
      screen.appendChild(header);

      const body = U.el('div', { class: 'set-body' });

      /* Sonido */
      const audio = U.el('section', { class: 'set-card' });
      audio.appendChild(U.el('h2', { class: 'set-card__title', html: '🔊 Sonido' }));
      audio.appendChild(toggleRow('Silenciar todo', 'Deja el juego sin sonido.', s.muted, function (v) {
        update({ muted: v });
      }));
      audio.appendChild(toggleRow('Música de fondo', 'Música suave y opcional.', s.musicOn, function (v) {
        update({ musicOn: v });
        if (v) MA.Audio.startMusic(); else MA.Audio.stopMusic();
      }));
      audio.appendChild(sliderRow('Volumen de la música', s.music, function (v) {
        update({ music: v });
      }));
      audio.appendChild(sliderRow('Volumen de los efectos', s.sfx, function (v) {
        update({ sfx: v });
      }));
      const testRow = U.el('div', { class: 'set-row set-row--inline' });
      testRow.appendChild(UI.btn({ emoji: '🔔', label: 'Probar sonido', kind: 'soft', size: 'sm', onClick: function () { MA.Audio.play('celebrate'); } }));
      testRow.appendChild(UI.btn({ emoji: '🎵', label: 'Probar música', kind: 'ghost', size: 'sm', onClick: function () { MA.Audio.init(MA.Store.settings()); MA.Audio.startMusic(); } }));
      audio.appendChild(testRow);
      body.appendChild(audio);

      /* Movimiento y accesibilidad */
      const access = U.el('section', { class: 'set-card' });
      access.appendChild(U.el('h2', { class: 'set-card__title', html: '🌿 Movimiento y accesibilidad' }));
      access.appendChild(toggleRow('Movimiento reducido', 'Menos animaciones y transiciones.', s.reduceMotion, function (v) { update({ reduceMotion: v }); }));
      access.appendChild(toggleRow('Objetivos más grandes', 'Los blancos del juego se agrandan un poco.', s.biggerTargets, function (v) { update({ biggerTargets: v }); }));
      access.appendChild(toggleRow('Alto contraste', 'Bordes y textos con más contraste.', s.highContrast, function (v) { update({ highContrast: v }); }));
      access.appendChild(toggleRow('Sugerencias automáticas', 'Ofrecer una pista si el niño se queda quieto un rato.', s.autoHints, function (v) { update({ autoHints: v }); }));
      access.appendChild(U.el('p', { class: 'set-note', text: 'Los colores nunca son la única pista: siempre hay dibujos, formas y palabras que acompañan.' }));
      body.appendChild(access);

      /* Respaldo */
      const backup = U.el('section', { class: 'set-card' });
      backup.appendChild(U.el('h2', { class: 'set-card__title', html: '💾 Copia de seguridad' }));
      backup.appendChild(U.el('p', { class: 'set-note', text: 'El progreso se guarda automáticamente en este computador. Puedes descargar una copia o restaurarla en otro equipo.' }));
      const fileInput = U.el('input', { type: 'file', accept: '.json,application/json', id: 'set-import-file', hidden: 'hidden' });
      const row = U.el('div', { class: 'set-row set-row--inline' });
      row.appendChild(UI.btn({
        emoji: '⬇️', label: 'Descargar copia', kind: 'soft',
        onClick: function () {
          UI.download('mouse-aventura-respaldo-' + U.dayKey() + '.json', MA.Store.exportText());
          MA.UI.toast('Copia descargada. Guárdala en un lugar seguro.');
        }
      }));
      row.appendChild(UI.btn({
        emoji: '⬆️', label: 'Restaurar copia', kind: 'ghost',
        onClick: function () { fileInput.click(); }
      }));
      fileInput.addEventListener('change', function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new G.FileReader();
        reader.onload = function () {
          UI.confirm({
            title: 'Restaurar copia de seguridad',
            message: 'La copia reemplazará el progreso guardado en este computador. ¿Quieres continuar?',
            confirmLabel: 'Sí, restaurar',
            danger: true
          }).then(function (ok) {
            if (!ok) { fileInput.value = ''; return; }
            const res = MA.Store.importText(String(reader.result || ''));
            fileInput.value = '';
            if (res.ok) { MA.UI.toast('Copia restaurada.'); MA.App.go('inicio'); }
            else MA.UI.toast(res.message);
          });
        };
        reader.readAsText(file);
      });
      row.appendChild(fileInput);
      backup.appendChild(row);
      backup.appendChild(U.el('p', { class: 'set-note', text: 'Para restablecer el progreso de un estudiante, entra al Panel docente (con PIN).' }));
      body.appendChild(backup);

      /* Acerca de */
      const about = U.el('section', { class: 'set-card set-card--about' });
      about.innerHTML = '<h2 class="set-card__title">ℹ️ Acerca de</h2>' +
        '<p><b>Mouse Aventura: Pequeños Exploradores</b></p>' +
        '<p class="set-note">Videojuego educativo para aprender a usar el mouse. 100 niveles, 10 mundos y un diploma final. Funciona sin internet después de la primera carga si se instala como aplicación web.</p>' +
        '<p class="set-note">Código de este perfil: <b>' + U.esc(profile.code) + '</b> · Niveles completados: ' + MA.Progress.completedCount(profile) + '</p>';
      body.appendChild(about);

      screen.appendChild(body);
      return { el: screen, title: 'Configuración' };
    }
  };

  function update(patch) {
    MA.Store.setSettings(patch);
    MA.Audio.applySettings(MA.Store.settings());
  }

  function toggleRow(label, help, checked, onChange) {
    const row = U.el('label', { class: 'set-row' });
    const text = U.el('div', { class: 'set-row__text' });
    text.appendChild(U.el('b', { text: label }));
    text.appendChild(U.el('small', { text: help }));
    row.appendChild(text);
    const sw = U.el('span', { class: 'switch' });
    const input = U.el('input', { type: 'checkbox', class: 'switch__input' });
    input.checked = !!checked;
    sw.appendChild(input);
    sw.appendChild(U.el('span', { class: 'switch__track', 'aria-hidden': 'true', html: '<i></i>' }));
    input.addEventListener('change', function () { onChange(input.checked); });
    row.appendChild(sw);
    return row;
  }

  function sliderRow(label, value, onChange) {
    const row = U.el('div', { class: 'set-row set-row--slider' });
    const text = U.el('div', { class: 'set-row__text' });
    text.appendChild(U.el('b', { text: label }));
    const out = U.el('output', { class: 'set-row__value', text: Math.round((value || 0) * 100) + '%' });
    text.appendChild(out);
    row.appendChild(text);
    const input = U.el('input', {
      type: 'range', min: '0', max: '100', step: '5', value: String(Math.round((value || 0) * 100)),
      class: 'set-slider', 'aria-label': label
    });
    input.addEventListener('input', function () {
      const v = Number(input.value) / 100;
      out.textContent = input.value + '%';
      onChange(v);
    });
    row.appendChild(input);
    return row;
  }
})(window);
