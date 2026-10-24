/* Mapa de los 10 mundos */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  S.worldmap = {
    render: function () {
      const profile = MA.Store.profile();
      const screen = U.el('div', { class: 'screen screen--map ' + UI.sceneClass('forest') });
      screen.appendChild(UI.sceneDecor(MA.Worlds.get(1)));

      const header = U.el('header', { class: 'map-header' });
      const left = U.el('div', { class: 'map-header__left' });
      left.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver al inicio', onClick: function () { MA.App.go('inicio'); } }));
      const titles = U.el('div', {});
      titles.appendChild(U.el('h1', { class: 'map-title', text: 'Mapa de aventuras' }));
      titles.appendChild(U.el('p', { class: 'map-subtitle', text: '10 mundos · 100 niveles · ' + MA.Progress.completedCount(profile) + ' completados' }));
      left.appendChild(titles);
      header.appendChild(left);
      const right = U.el('div', { class: 'map-header__right' });
      right.appendChild(UI.chip(U.fmtNumber(profile.coins || 0), '💰', { className: 'chip--coin' }));
      right.appendChild(UI.chip(MA.Progress.totalStars(profile) + '/300', '⭐', { className: 'chip--star' }));
      right.appendChild(UI.btn({ label: 'Mi progreso', kind: 'soft', size: 'sm', onClick: function () { MA.App.go('progreso'); } }));
      header.appendChild(right);
      screen.appendChild(header);

      const grid = U.el('div', { class: 'world-grid' });
      const current = MA.Progress.nextPlayable(profile);
      MA.Worlds.list.forEach(function (w) {
        const stats = MA.Progress.worldStats(profile, w.id);
        const levels = MA.Levels.byWorld(w.id);
        const first = levels[0];
        const locked = first ? MA.Progress.levelStatus(profile, first).status === 'locked' : false;
        const card = U.el('button', {
          class: 'world-card ' + UI.sceneClass(w.scene) + (locked ? ' is-locked' : '') + (stats.done ? ' is-complete' : '') +
            (current && current.world === w.id ? ' is-current' : ''),
          type: 'button',
          'aria-label': 'Mundo ' + w.id + ': ' + w.name + (locked ? ', bloqueado' : stats.done ? ', completado' : ', disponible')
        });
        card.innerHTML =
          '<div class="world-card__scene">' +
          '<span class="world-card__num">Mundo ' + w.id + '</span>' +
          '<span class="world-card__emoji" aria-hidden="true">' + w.icon + '</span>' +
          '<span class="world-card__decor" aria-hidden="true">' + w.decor.slice(0, 3).join(' ') + '</span>' +
          (locked ? '<span class="world-card__lock" aria-hidden="true">🔒</span>' : '') +
          (stats.done ? '<span class="world-card__medal" aria-hidden="true">🏅</span>' : '') +
          '</div>' +
          '<div class="world-card__body">' +
          '<h2 class="world-card__name">' + U.esc(w.short) + '</h2>' +
          '<p class="world-card__obj">' + U.esc(w.objective) + '</p>' +
          '</div>' +
          '<div class="world-card__foot">' +
          '<span class="world-card__count">' + stats.completed + '/10 niveles</span>' +
          '<span class="world-card__stars" aria-hidden="true">⭐ ' + stats.stars + '/' + stats.maxStars + '</span>' +
          '</div>';
        const foot = card.querySelector('.world-card__foot');
        foot.appendChild(UI.bar(stats.pct, { className: 'bar--slim' }));
        card.addEventListener('click', function () {
          if (locked) {
            const prev = MA.Worlds.get(w.id - 1);
            MA.UI.toast('Este mundo se abre al completar el Mundo ' + (w.id - 1) + '.');
            if (prev) MA.UI.toast('¡Ya casi! Sigue con ' + prev.short + '.');
            MA.Audio.play('wrong');
            return;
          }
          MA.Audio.play('click');
          MA.App.go('mundo/' + w.id);
        });
        grid.appendChild(card);
      });
      screen.appendChild(grid);

      const foot = U.el('div', { class: 'map-footer' });
      foot.appendChild(U.el('span', { class: 'legend' }, [
        U.el('span', { class: 'legend__item', html: '<i class="dot dot--available"></i> Disponible' }),
        U.el('span', { class: 'legend__item', html: '<i class="dot dot--completed"></i> Completado' }),
        U.el('span', { class: 'legend__item', html: '<i class="dot dot--locked"></i> Bloqueado' })
      ]));
      foot.appendChild(UI.btn({ label: 'Panel docente', kind: 'ghost', size: 'sm', icon: 'teacher', onClick: function () { MA.App.go('docente'); } }));
      screen.appendChild(foot);

      return { el: screen, title: 'Mapa de aventuras' };
    }
  };

  /* Lista de niveles de un mundo, con camino visual */
  S.levelmap = {
    render: function (params) {
      const worldId = parseInt(params && params[0], 10) || 1;
      const world = MA.Worlds.get(worldId);
      if (!world) return { el: U.el('div', { class: 'screen' }) };
      const profile = MA.Store.profile();
      const levels = MA.Levels.byWorld(worldId);
      const stats = MA.Progress.worldStats(profile, worldId);
      const screen = U.el('div', { class: 'screen screen--levels ' + UI.sceneClass(world.scene) });
      screen.appendChild(UI.sceneDecor(world));

      const header = U.el('header', { class: 'lvl-header' });
      const left = U.el('div', { class: 'lvl-header__left' });
      left.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver al mapa', onClick: function () { MA.App.go('mapa'); } }));
      left.appendChild(UI.btn({ emoji: world.icon, label: 'Mundo ' + world.id, kind: 'soft', size: 'sm', onClick: function () { MA.App.go('mapa'); } }));
      const titles = U.el('div', {});
      titles.appendChild(U.el('h1', { class: 'lvl-title', text: world.name }));
      titles.appendChild(U.el('p', { class: 'lvl-subtitle', text: world.objective + ' · ' + stats.completed + ' de 10 completados' }));
      left.appendChild(titles);
      header.appendChild(left);
      const right = U.el('div', { class: 'lvl-header__right' });
      right.appendChild(UI.chip(stats.stars + '/' + stats.maxStars, '⭐', { className: 'chip--star' }));
      if (stats.done) right.appendChild(UI.chip('¡Mundo completado!', '🏅', { className: 'chip--badge' }));
      header.appendChild(right);
      screen.appendChild(header);

      const board = U.el('div', { class: 'level-board' });
      const positions = [];
      levels.forEach(function (lv, i) {
        const row = Math.floor(i / 5);
        const col = row === 0 ? i : (9 - i);
        positions.push({ x: 9 + col * 20.5, y: row === 0 ? 32 : 74 });
      });
      const svg = '<svg class="level-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
        '<polyline points="' + positions.map(function (p) { return p.x + ',' + p.y; }).join(' ') +
        '" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" stroke-dasharray="2 18"/>' +
        '</svg>';
      board.innerHTML = svg;

      levels.forEach(function (lv, i) {
        const st = MA.Progress.levelStatus(profile, lv);
        const node = U.el('button', {
          class: 'lvl-node lvl-node--' + st.status,
          type: 'button',
          style: { left: positions[i].x + '%', top: positions[i].y + '%' },
          'data-level': lv.id,
          'aria-label': 'Nivel ' + lv.index + ': ' + lv.name + '. ' + (st.status === 'completed' ? 'Completado con ' + st.stars + ' estrellas' : st.status === 'available' ? 'Disponible' : 'Bloqueado')
        });
        node.innerHTML =
          '<span class="lvl-node__circle">' +
          '<span class="lvl-node__num">' + lv.index + '</span>' +
          (st.status === 'completed' ? '<span class="lvl-node__check" aria-hidden="true">✓</span>' : '') +
          (st.status === 'locked' ? '<span class="lvl-node__lock" aria-hidden="true">🔒</span>' : '') +
          '</span>' +
          '<span class="lvl-node__name">' + U.esc(lv.name) + '</span>' +
          '<span class="lvl-node__stars" aria-hidden="true">' + (st.status === 'completed' ? UI.stars(st.stars, { small: true }).outerHTML : (st.status === 'available' ? '▶' : '')) + '</span>';
        node.addEventListener('click', function () {
          if (st.status === 'locked') {
            MA.UI.toast('Completa el nivel ' + (lv.index - 1) + ' para abrir este nivel.');
            MA.Audio.play('wrong');
            return;
          }
          MA.Audio.play('click');
          MA.App.go('jugar/' + lv.id);
        });
        board.appendChild(node);
      });
      screen.appendChild(board);

      const badge = U.el('div', { class: 'world-badge' + (stats.done ? ' is-earned' : '') });
      badge.innerHTML = '<span class="world-badge__emoji" aria-hidden="true">' + (stats.done ? world.badge.emoji : '🔒') + '</span>' +
        '<div><strong>' + U.esc(world.badge.name) + '</strong><small>' +
        (stats.done ? 'Insignia conseguida. ¡Excelente!' : 'Se consigue al completar los 10 niveles de este mundo.') +
        '</small></div>';
      screen.appendChild(badge);

      const recs = MA.Progress.recommendations(profile, 3);
      if (recs.length) {
        const recWrap = U.el('div', { class: 'recs' });
        recWrap.appendChild(U.el('h2', { class: 'recs__title', text: 'Sugerencias para practicar' }));
        const row = U.el('div', { class: 'recs__row' });
        recs.forEach(function (r) {
          const b = U.el('button', { class: 'rec-card', type: 'button' });
          b.innerHTML = '<span class="rec-card__emoji" aria-hidden="true">' + MA.Skills.get(r.skillId).emoji + '</span>' +
            '<span class="rec-card__text"><b>' + U.esc(r.level.name) + '</b><small>' + U.esc(r.reason) + '</small></span>';
          b.addEventListener('click', function () { MA.App.go('jugar/' + r.level.id); });
          row.appendChild(b);
        });
        recWrap.appendChild(row);
        screen.appendChild(recWrap);
      }

      return { el: screen, title: world.name };
    }
  };
})(window);
