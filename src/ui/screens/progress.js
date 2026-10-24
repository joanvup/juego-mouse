/* Mi progreso: estrellas, mundos, habilidades e insignias */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  S.progress = {
    render: function () {
      const profile = MA.Store.profile();
      const totalLevels = MA.Levels.count();
      const completed = MA.Progress.completedCount(profile);
      const pct = Math.round(completed / totalLevels * 100);
      const totals = profile.totals || {};
      const accuracy = (totals.correctClicks || 0) + (totals.wrongClicks || 0) > 0
        ? Math.round(totals.correctClicks / (totals.correctClicks + totals.wrongClicks) * 100) : null;

      const screen = U.el('div', { class: 'screen screen--progress ' + UI.sceneClass('forest') });
      screen.appendChild(UI.sceneDecor(MA.Worlds.get(1)));

      const header = U.el('header', { class: 'prog-header' });
      const left = U.el('div', { class: 'prog-header__left' });
      left.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver al inicio', onClick: function () { MA.App.go('inicio'); } }));
      left.appendChild(UI.profileAvatar(profile, 62, MA.Avatars.moods(completed / totalLevels)));
      const titles = U.el('div', {});
      titles.appendChild(U.el('h1', { class: 'prog-title', text: UI.profileName(profile) }));
      titles.appendChild(U.el('p', { class: 'prog-subtitle', text: 'Código ' + profile.code + ' · ' + completed + ' de ' + totalLevels + ' niveles' }));
      left.appendChild(titles);
      header.appendChild(left);
      const right = U.el('div', { class: 'prog-header__right' });
      right.appendChild(UI.btn({ emoji: '🧢', label: 'Mi personaje', kind: 'soft', size: 'sm', onClick: function () { MA.App.go('personaje'); } }));
      right.appendChild(UI.btn({ icon: 'print', label: 'Imprimir resumen', kind: 'ghost', size: 'sm', onClick: function () { printSummary(profile); } }));
      header.appendChild(right);
      screen.appendChild(header);

      const body = U.el('div', { class: 'prog-body' });

      /* Resumen general */
      const overview = U.el('section', { class: 'prog-overview' });
      const ring = U.el('div', { class: 'prog-ring' });
      ring.innerHTML =
        '<svg viewBox="0 0 120 120" class="prog-ring__svg" aria-hidden="true">' +
        '<circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="12"/>' +
        '<circle cx="60" cy="60" r="52" fill="none" stroke="#ffd23f" stroke-width="12" stroke-linecap="round" ' +
        'stroke-dasharray="326.7" stroke-dasharray="' + (2 * Math.PI * 52).toFixed(1) + '" stroke-dashoffset="' + (2 * Math.PI * 52 * (1 - pct / 100)).toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
        '</svg>' +
        '<div class="prog-ring__text"><b>' + pct + '%</b><small>completado</small></div>';
      overview.appendChild(ring);
      const stats = U.el('div', { class: 'prog-stats' });
      stats.appendChild(statCard('⭐', MA.Progress.totalStars(profile) + ' / 300', 'Estrellas ganadas'));
      stats.appendChild(statCard('💰', U.fmtNumber(profile.coins || 0), 'Monedas virtuales'));
      stats.appendChild(statCard('🏅', MA.Progress.completedWorlds(profile).length + ' / 10', 'Mundos completados'));
      stats.appendChild(statCard('⏱️', U.fmtDuration(totals.timeMs || 0), 'Tiempo jugando'));
      stats.appendChild(statCard('🎯', accuracy === null ? 'Pendiente' : accuracy + '%', 'Precisión general'));
      stats.appendChild(statCard('💡', String(totals.hints || 0), 'Pistas usadas'));
      overview.appendChild(stats);
      body.appendChild(overview);

      /* Mundos */
      const worldsSection = U.el('section', { class: 'prog-section' });
      worldsSection.appendChild(U.el('h2', { class: 'prog-section__title', text: 'Progreso por mundo' }));
      const worldList = U.el('div', { class: 'prog-worlds' });
      MA.Worlds.list.forEach(function (w) {
        const ws = MA.Progress.worldStats(profile, w.id);
        const row = U.el('div', { class: 'prog-world ' + UI.sceneClass(w.scene) + (ws.done ? ' is-done' : '') });
        row.innerHTML =
          '<span class="prog-world__icon" aria-hidden="true">' + w.icon + '</span>' +
          '<div class="prog-world__main"><b>' + U.esc(w.short) + '</b><small>' + U.esc(w.objective) + '</small></div>' +
          '<div class="prog-world__bar">' + UI.bar(ws.pct, { className: 'bar--slim' }).outerHTML + '<span>' + ws.completed + '/10</span></div>' +
          '<span class="prog-world__stars" aria-label="' + ws.stars + ' estrellas">⭐ ' + ws.stars + '/' + ws.maxStars + '</span>' +
          '<span class="prog-world__badge" title="' + (ws.done ? 'Insignia conseguida' : 'Insignia pendiente') + '">' + (ws.done ? w.badge.emoji : '🔒') + '</span>';
        const btn = U.el('button', { class: 'prog-world__go', type: 'button', text: 'Ver', 'aria-label': 'Ver niveles de ' + w.short });
        btn.addEventListener('click', function () { MA.App.go('mundo/' + w.id); });
        row.appendChild(btn);
        worldList.appendChild(row);
      });
      worldsSection.appendChild(worldList);
      body.appendChild(worldsSection);

      /* Habilidades */
      const skillsSection = U.el('section', { class: 'prog-section' });
      skillsSection.appendChild(U.el('h2', { class: 'prog-section__title', text: 'Mis habilidades' }));
      const legend = U.el('div', { class: 'skill-legend' });
      ['learning', 'practice', 'achieved', 'mastered'].forEach(function (id) {
        const st = MA.Skills.state(id);
        legend.appendChild(U.el('span', { class: 'skill-legend__item', html: st.emoji + ' ' + st.label }));
      });
      skillsSection.appendChild(legend);
      const groups = U.el('div', { class: 'skill-groups' });
      MA.Skills.groups.forEach(function (group) {
        const g = U.el('div', { class: 'skill-group' });
        g.appendChild(U.el('h3', { class: 'skill-group__title', text: group.name }));
        const rows = U.el('div', { class: 'skill-rows' });
        group.ids.forEach(function (skillId) {
          const rec = MA.Progress.skillRecords(profile).filter(function (r) { return r.id === skillId; })[0];
          if (!rec) return;
          const st = MA.Skills.state(rec.state);
          const row = U.el('div', { class: 'skill-row skill-row--' + rec.state, style: { '--state-color': st.color } });
          row.innerHTML =
            '<span class="skill-row__emoji" aria-hidden="true">' + rec.emoji + '</span>' +
            '<div class="skill-row__main"><b>' + U.esc(rec.name) + '</b><small>' + U.esc(rec.kid) + '</small></div>' +
            '<span class="skill-row__meta">' + (rec.levels || 0) + ' nivel(es) · ' + (rec.avgStars ? rec.avgStars.toFixed(1) + ' ⭐' : 'sin datos') + '</span>' +
            '<span class="skill-row__state">' + st.emoji + ' ' + st.label + '</span>';
          rows.appendChild(row);
        });
        g.appendChild(rows);
        groups.appendChild(g);
      });
      skillsSection.appendChild(groups);
      body.appendChild(skillsSection);

      /* Insignias */
      const badgesSection = U.el('section', { class: 'prog-section' });
      badgesSection.appendChild(U.el('h2', { class: 'prog-section__title', text: 'Mis insignias' }));
      const badgeGrid = U.el('div', { class: 'badge-grid' });
      MA.Worlds.list.forEach(function (w) {
        const earned = (profile.badges || []).indexOf(w.badge.id) >= 0;
        const b = U.el('div', { class: 'badge-item' + (earned ? ' is-earned' : '') });
        b.innerHTML = '<span class="badge-item__emoji" aria-hidden="true">' + (earned ? w.badge.emoji : '🔒') + '</span>' +
          '<span class="badge-item__name">' + U.esc(w.badge.name) + '</span>' +
          '<small>' + (earned ? '¡Conseguida!' : 'Completa el mundo ' + w.id) + '</small>';
        badgeGrid.appendChild(b);
      });
      badgesSection.appendChild(badgeGrid);
      body.appendChild(badgesSection);

      /* Recomendaciones */
      const recs = MA.Progress.recommendations(profile, 4);
      if (recs.length) {
        const recSection = U.el('section', { class: 'prog-section' });
        recSection.appendChild(U.el('h2', { class: 'prog-section__title', text: 'Qué practicar ahora' }));
        const row = U.el('div', { class: 'recs__row' });
        recs.forEach(function (r) {
          const btn = U.el('button', { class: 'rec-card', type: 'button' });
          btn.innerHTML = '<span class="rec-card__emoji" aria-hidden="true">' + MA.Skills.get(r.skillId).emoji + '</span>' +
            '<span class="rec-card__text"><b>' + U.esc(r.level.name) + '</b><small>' + U.esc(r.reason) + '</small></span>';
          btn.addEventListener('click', function () { MA.App.go('jugar/' + r.level.id); });
          row.appendChild(btn);
        });
        recSection.appendChild(row);
        body.appendChild(recSection);
      }

      /* Acciones */
      const actions = U.el('section', { class: 'prog-actions' });
      actions.appendChild(UI.btn({
        emoji: '💾', label: 'Exportar mi progreso', kind: 'soft',
        onClick: function () {
          const name = 'mouse-aventura-' + profile.code + '-' + U.dayKey() + '.json';
          UI.download(name, MA.Store.exportText());
          UI.toast('Copia de seguridad descargada.');
        }
      }));
      actions.appendChild(UI.btn({ emoji: '🏆', label: 'Ver mi diploma', kind: 'soft', onClick: function () { MA.App.go('diploma'); } }));
      actions.appendChild(UI.btn({ emoji: '🏠', label: 'Volver al inicio', kind: 'ghost', onClick: function () { MA.App.go('inicio'); } }));
      body.appendChild(actions);

      screen.appendChild(body);
      return { el: screen, title: 'Mi progreso' };
    }
  };

  function statCard(emoji, value, label) {
    const c = U.el('div', { class: 'stat-card' });
    c.innerHTML = '<span class="stat-card__emoji" aria-hidden="true">' + emoji + '</span>' +
      '<b class="stat-card__value">' + U.esc(value) + '</b>' +
      '<span class="stat-card__label">' + U.esc(label) + '</span>';
    return c;
  }

  function printSummary(profile) {
    const completed = MA.Progress.completedCount(profile);
    const worlds = MA.Worlds.list.map(function (w) {
      const s = MA.Progress.worldStats(profile, w.id);
      return '<tr><td>' + w.id + '</td><td>' + U.esc(w.short) + '</td><td>' + s.completed + '/10</td><td>' + s.stars + '/' + s.maxStars + '</td><td>' + (s.done ? 'Completado' : 'En proceso') + '</td></tr>';
    }).join('');
    const skills = MA.Progress.skillRecords(profile).filter(function (s) { return s.state !== 'none'; })
      .map(function (s) { return '<tr><td>' + U.esc(s.name) + '</td><td>' + s.stateInfo.label + '</td><td>' + s.levels + '</td><td>' + (s.avgStars ? s.avgStars.toFixed(1) : '—') + '</td></tr>'; }).join('');
    const html =
      '<div class="print-page">' +
      '<h1>Resumen de progreso · Mouse Aventura</h1>' +
      '<p><b>Estudiante:</b> ' + U.esc(UI.profileName(profile)) + ' &nbsp; <b>Código:</b> ' + U.esc(profile.code) + ' &nbsp; <b>Fecha:</b> ' + U.fmtDate() + '</p>' +
      '<p><b>Niveles completados:</b> ' + completed + ' de ' + MA.Levels.count() + ' &nbsp; <b>Estrellas:</b> ' + MA.Progress.totalStars(profile) + ' de 300 &nbsp; <b>Tiempo:</b> ' + U.fmtDuration(profile.totals.timeMs || 0) + '</p>' +
      '<h2>Progreso por mundo</h2>' +
      '<table class="print-table"><thead><tr><th>Mundo</th><th>Nombre</th><th>Niveles</th><th>Estrellas</th><th>Estado</th></tr></thead><tbody>' + worlds + '</tbody></table>' +
      '<h2>Habilidades</h2>' +
      (skills ? '<table class="print-table"><thead><tr><th>Habilidad</th><th>Estado</th><th>Niveles</th><th>Promedio estrellas</th></tr></thead><tbody>' + skills + '</tbody></table>' : '<p>Todavía no hay habilidades registradas.</p>') +
      '<p class="print-note">Documento generado por el juego educativo Mouse Aventura. Sin datos personales sensibles.</p>' +
      '</div>';
    UI.printHTML(html);
  }
})(window);
