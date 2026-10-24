/* Panel docente: PIN, estadísticas, perfiles, reportes y respaldos
   Nota de seguridad: el PIN se guarda en este mismo computador. Es una
   protección básica contra entradas accidentales, no seguridad robusta. */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  let selectedCode = null;
  let pinAttempts = 0;
  let lockedUntil = 0;
  let message = null;

  function sessionGet(k) { try { return G.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionSet(k, v) { try { G.sessionStorage.setItem(k, v); } catch (e) {} }
  function sessionDel(k) { try { G.sessionStorage.removeItem(k); } catch (e) {} }
  function isUnlocked() { return sessionGet('ma.teacherUnlocked') === '1'; }

  function csvEscape(value) {
    let s = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    if (/[;"\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function toCSV(rows) {
    return '\ufeff' + rows.map(function (row) { return row.map(csvEscape).join(';'); }).join('\r\n');
  }
  function dateOrDash(ts) { return ts ? U.fmtDate(ts) : '—'; }

  S.teacher = {
    render: function () {
      if (!isUnlocked()) return renderGate();
      const profile = MA.Store.profile();
      if (selectedCode && MA.Store.data.profiles[selectedCode]) return renderDetail(selectedCode);
      return renderDashboard(profile);
    }
  };

  /* =====================  PUERTA CON PIN  ===================== */
  function renderGate() {
    const screen = U.el('div', { class: 'screen screen--teacher-gate ' + UI.sceneClass('city') });
    screen.appendChild(UI.sceneDecor(MA.Worlds.get(8)));
    const card = U.el('div', { class: 'gate-card' });
    card.innerHTML =
      '<div class="gate-card__icon" aria-hidden="true">🎓</div>' +
      '<h1 class="gate-card__title">Panel docente</h1>' +
      '<p class="gate-card__text">Ingresa el PIN para ver estadísticas y gestionar perfiles. <br><small>Este PIN evita entradas accidentales de los niños.</small></p>';

    const locked = G.Date.now() < lockedUntil;
    const form = U.el('form', { class: 'gate-form' });
    const input = U.el('input', {
      type: 'password', inputmode: 'numeric', maxlength: '6', class: 'gate-input',
      'aria-label': 'PIN del panel docente', placeholder: '', autocomplete: 'off',
      disabled: locked ? 'disabled' : null
    });
    const dots = U.el('div', { class: 'gate-dots', 'aria-hidden': 'true' });
    const error = U.el('p', { class: 'gate-error', role: 'alert' });
    if (message) error.textContent = message;

    function paintDots() {
      dots.innerHTML = '';
      const len = Math.min(6, input.value.length);
      for (let i = 0; i < Math.max(4, len); i++) {
        dots.appendChild(U.el('span', { class: 'gate-dot' + (i < len ? ' is-on' : '') }));
      }
    }
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 6);
      paintDots();
    });
    paintDots();

    const keypad = U.el('div', { class: 'gate-keypad' });
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'entrar'].forEach(function (key) {
      const b = U.el('button', {
        type: 'button',
        class: 'gate-key' + (key === 'entrar' ? ' gate-key--go' : key === 'borrar' ? ' gate-key--del' : ''),
        text: key === 'borrar' ? '⌫' : key === 'entrar' ? '✓' : key,
        'aria-label': key === 'borrar' ? 'Borrar un número' : key === 'entrar' ? 'Entrar' : key,
        disabled: locked ? 'disabled' : null
      });
      b.addEventListener('click', function () {
        if (G.Date.now() < lockedUntil) return;
        if (key === 'borrar') { input.value = input.value.slice(0, -1); paintDots(); return; }
        if (key === 'entrar') { submit(); return; }
        if (input.value.length < 6) { input.value += key; paintDots(); }
        if (input.value.length === 4 || input.value.length === 6) { /* el docente decide cuándo entrar */ }
      });
      keypad.appendChild(b);
    });

    function submit() {
      const pin = input.value;
      if (!pin) { error.textContent = 'Escribe el PIN de 4 números.'; return; }
      if (MA.Store.checkPin(pin)) {
        pinAttempts = 0;
        message = null;
        sessionSet('ma.teacherUnlocked', '1');
        MA.Audio.play('success');
        MA.App.refresh();
      } else {
        pinAttempts += 1;
        input.value = '';
        paintDots();
        MA.Audio.play('wrong');
        if (pinAttempts >= 5) {
          lockedUntil = G.Date.now() + 15000;
          error.textContent = 'Demasiados intentos. Espera 15 segundos antes de volver a intentar.';
          G.setTimeout(function () { lockedUntil = 0; MA.App.refresh(); }, 15500);
        } else {
          error.textContent = 'PIN incorrecto. Intenta otra vez (' + (5 - pinAttempts) + ' intentos).';
        }
        card.classList.add('is-shake');
        G.setTimeout(function () { card.classList.remove('is-shake'); }, 500);
      }
    }

    form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(); });
    form.appendChild(input);
    form.appendChild(dots);
    form.appendChild(error);
    form.appendChild(keypad);
    card.appendChild(form);

    if (MA.Store.pinIsDefault()) {
      card.appendChild(U.el('p', { class: 'gate-hint', html: 'Cambia el PIN en la sección de seguridad después de entrar.' }));
    }
    card.appendChild(U.el('p', { class: 'gate-note', text: 'Protección básica local: el PIN se guarda en este equipo y no reemplaza la seguridad de una cuenta.' }));
    const actions = U.el('div', { class: 'gate-actions' });
    actions.appendChild(UI.btn({ emoji: '🏠', label: 'Volver al juego', kind: 'ghost', onClick: function () { MA.App.go(MA.Store.profile() ? 'inicio' : 'perfil'); } }));
    card.appendChild(actions);
    screen.appendChild(card);
    G.setTimeout(function () { if (input && !locked) input.focus(); }, 100);
    return { el: screen, title: 'Panel docente' };
  }

  /* =====================  TABLERO  ===================== */
  function renderDashboard(profile) {
    const summary = MA.Store.classSummary();
    const students = MA.Store.studentsSummary();
    const screen = U.el('div', { class: 'screen screen--teacher ' + UI.sceneClass('city') });
    screen.appendChild(UI.sceneDecor(MA.Worlds.get(8)));

    const header = U.el('header', { class: 'td-header' });
    const left = U.el('div', { class: 'td-header__left' });
    left.appendChild(UI.btn({ emoji: '🏠', label: 'Juego', kind: 'ghost', size: 'sm', onClick: function () { MA.App.go(profile ? 'inicio' : 'perfil'); } }));
    const titles = U.el('div', {});
    titles.appendChild(U.el('h1', { class: 'td-title', text: 'Panel docente' }));
    titles.appendChild(U.el('p', { class: 'td-subtitle', text: 'Estadísticas, perfiles y reportes · datos guardados en este computador' }));
    left.appendChild(titles);
    header.appendChild(left);
    const right = U.el('div', { class: 'td-header__right' });
    right.appendChild(UI.btn({ emoji: '🔒', label: 'Salir del panel', kind: 'soft', size: 'sm', onClick: function () { sessionDel('ma.teacherUnlocked'); selectedCode = null; MA.App.go(profile ? 'inicio' : 'perfil'); } }));
    header.appendChild(right);
    screen.appendChild(header);

    const body = U.el('div', { class: 'td-body' });

    /* resumen */
    const statsRow = U.el('div', { class: 'td-stats' });
    statsRow.appendChild(tdStat('👧', String(summary.students), 'Estudiantes'));
    statsRow.appendChild(tdStat('✅', String(summary.completed), 'Niveles completados'));
    statsRow.appendChild(tdStat('📈', String(summary.avgCompleted), 'Promedio por estudiante'));
    statsRow.appendChild(tdStat('🎯', summary.avgAccuracy === null ? 'Pendiente' : summary.avgAccuracy + '%', 'Precisión promedio'));
    statsRow.appendChild(tdStat('⭐', String(summary.stars), 'Estrellas totales'));
    statsRow.appendChild(tdStat('⏱️', U.fmtDuration(summary.timeMs), 'Tiempo de juego'));
    body.appendChild(statsRow);

    /* acceso rápido a niveles */
    const quickSection = U.el('section', { class: 'td-section' });
    quickSection.appendChild(U.el('h2', { text: 'Jugar cualquier nivel (Modo Docente)' }));
    const quickGrid = U.el('div', { class: 'td-students' });

    // Generamos botones para todos los mundos y niveles
    MA.Worlds.list.forEach(function (w) {
      const worldRow = U.el('div', { class: 'td-row', style: { marginBottom: '12px' } });
      worldRow.appendChild(U.el('div', { class: 'td-label', style: { fontWeight: 'bold', marginBottom: '4px' }, text: 'Mundo ' + w.id + ': ' + w.short }));

      const levelsRow = U.el('div', { class: 'td-students', style: { gap: '4px' } });
      const levels = MA.Levels.byWorld(w.id);
      levels.forEach(function (lv) {
        const b = UI.btn({
          emoji: '▶', label: lv.index.toString(), kind: 'soft', size: 'sm',
          onClick: function () {
            sessionStorage.setItem('ma.teacherPlay', '1');
            MA.App.go('jugar/' + lv.id);
          }
        });
        levelsRow.appendChild(b);
      });
      worldRow.appendChild(levelsRow);
      quickGrid.appendChild(worldRow);
    });
    quickSection.appendChild(quickGrid);
    body.appendChild(quickSection);

    /* estudiantes */
    const studentsSection = U.el('section', { class: 'td-section' });
    const studentsHead = U.el('div', { class: 'td-section__head' });
    studentsHead.appendChild(U.el('h2', { text: 'Estudiantes' }));
    studentsHead.appendChild(UI.btn({ emoji: '⬇️', label: 'Exportar resumen CSV', kind: 'soft', size: 'sm', onClick: exportSummaryCSV }));
    studentsSection.appendChild(studentsHead);
    if (!students.length) {
      studentsSection.appendChild(U.el('p', { class: 'td-empty', text: 'Todavía no hay estudiantes. Crea el primero abajo o pide al niño que elija su personaje en la pantalla de inicio.' }));
    } else {
      const grid = U.el('div', { class: 'td-students' });
      students.forEach(function (st) { grid.appendChild(studentCard(st)); });
      studentsSection.appendChild(grid);
    }
    body.appendChild(studentsSection);

    /* actividades difíciles */
    const hardSection = U.el('section', { class: 'td-section' });
    hardSection.appendChild(U.el('h2', { text: 'Actividades que generan más dificultad' }));
    hardSection.appendChild(U.el('p', { class: 'td-help', text: 'Se calcula con clics fuera del objetivo, pistas usadas y niveles abandonados. Útil para reforzar antes de avanzar.' }));
    const hardest = MA.Store.hardestLevels().slice(0, 8);
    if (!hardest.length) {
      hardSection.appendChild(U.el('p', { class: 'td-empty', text: 'Aún no hay datos suficientes. Cuando los estudiantes jueguen aparecerán aquí.' }));
    } else {
      const table = U.el('table', { class: 'td-table' });
      table.innerHTML = '<thead><tr><th>Nivel</th><th>Mundo</th><th>Habilidad</th><th>Intentos</th><th>Clics fuera</th><th>Pistas</th><th>Abandonos</th><th>Índice de dificultad</th></tr></thead>' +
        '<tbody>' + hardest.map(function (h) {
          return '<tr><td>' + U.esc(h.name) + '</td><td>M' + h.world + '</td><td>' + U.esc(h.skillName) + '</td><td>' + h.plays + '</td><td>' + h.wrong + '</td><td>' + h.hints + '</td><td>' + h.abandoned + '</td><td><b>' + h.difficulty + '</b></td></tr>';
        }).join('') + '</tbody>';
      const wrap = U.el('div', { class: 'td-table-wrap' });
      wrap.appendChild(table);
      hardSection.appendChild(wrap);
    }
    body.appendChild(hardSection);

    /* crear estudiante */
    const createSection = U.el('section', { class: 'td-section' });
    createSection.appendChild(U.el('h2', { text: 'Crear perfil de estudiante' }));
    createSection.appendChild(U.el('p', { class: 'td-help', text: 'Puedes usar un código interno (por ejemplo 1A-05) en lugar del nombre completo, para no guardar datos personales innecesarios.' }));
    const form = U.el('div', { class: 'td-create' });
    const codeInput = U.el('input', { class: 'td-input', placeholder: 'Código (ej. 1A-05)', maxlength: '16', 'aria-label': 'Código del estudiante' });
    const nameInput = U.el('input', { class: 'td-input', placeholder: 'Nombre o alias (opcional)', maxlength: '24', 'aria-label': 'Nombre o alias' });
    const charSelect = U.el('select', { class: 'td-input', 'aria-label': 'Personaje inicial' });
    ['mimo', 'luna'].forEach(function (id) {
      const ch = MA.Avatars.character(id);
      charSelect.appendChild(U.el('option', { value: id, text: ch.name }));
    });
    const createBtn = UI.btn({
      emoji: '➕', label: 'Crear estudiante', kind: 'primary',
      onClick: function () {
        if (codeInput.value && MA.Store.data.profiles[MA.Store.normalizeCode(codeInput.value)]) {
          MA.UI.toast('Ese código ya existe. Usa otro.');
          return;
        }
        const p = MA.Store.createProfile({ code: codeInput.value, name: nameInput.value, character: charSelect.value });
        MA.UI.toast('Perfil ' + p.code + ' creado.');
        codeInput.value = ''; nameInput.value = '';
        selectedCode = p.code;
        MA.App.refresh();
      }
    });
    form.appendChild(codeInput);
    form.appendChild(nameInput);
    form.appendChild(charSelect);
    form.appendChild(createBtn);
    createSection.appendChild(form);
    body.appendChild(createSection);

    /* seguridad y datos */
    body.appendChild(renderSecurity());
    body.appendChild(renderDataSection(students));

    screen.appendChild(body);
    return { el: screen, title: 'Panel docente' };
  }

  function tdStat(emoji, value, label) {
    const el = U.el('div', { class: 'td-stat' });
    el.innerHTML = '<span aria-hidden="true">' + emoji + '</span><b>' + U.esc(value) + '</b><small>' + U.esc(label) + '</small>';
    return el;
  }

  function studentCard(st) {
    const profile = MA.Store.data.profiles[st.code];
    const card = U.el('div', { class: 'td-student' });
    const head = U.el('div', { class: 'td-student__head' });
    head.appendChild(UI.profileAvatar(profile, 52, 'happy'));
    const info = U.el('div', {});
    info.innerHTML = '<b>' + U.esc(st.name || st.code) + '</b><small>Código ' + U.esc(st.code) + ' · última actividad ' + dateOrDash(st.lastPlayed) + '</small>';
    head.appendChild(info);
    card.appendChild(head);
    const bar = U.el('div', { class: 'td-student__bar' });
    bar.appendChild(UI.bar(st.pct, { className: 'bar--slim' }));
    bar.appendChild(U.el('span', { text: st.completed + '/' + st.total }));
    card.appendChild(bar);
    const chips = U.el('div', { class: 'td-student__chips' });
    chips.appendChild(UI.chip(st.stars + ' ⭐', ''));
    chips.appendChild(UI.chip('Precisión ' + (st.accuracy === null ? '—' : st.accuracy + '%'), '🎯'));
    chips.appendChild(UI.chip(U.fmtDuration(st.timeMs), '⏱️'));
    chips.appendChild(UI.chip('Pistas ' + st.hints, '💡'));
    card.appendChild(chips);
    const actions = U.el('div', { class: 'td-student__actions' });
    actions.appendChild(UI.btn({ label: 'Ver detalle', kind: 'primary', size: 'sm', onClick: function () { selectedCode = st.code; MA.App.refresh(); } }));
    actions.appendChild(UI.btn({ emoji: '⬇️', label: 'CSV', kind: 'soft', size: 'sm', onClick: function () { exportDetailCSV(st.code); } }));
    actions.appendChild(UI.btn({ emoji: '🖨️', label: 'Imprimir', kind: 'ghost', size: 'sm', onClick: function () { printStudent(st.code); } }));
    actions.appendChild(UI.btn({ emoji: '♻️', label: 'Restablecer', kind: 'danger', size: 'sm', onClick: function () { confirmReset(st.code); } }));
    card.appendChild(actions);
    return card;
  }

  /* =====================  DETALLE  ===================== */
  function renderDetail(code) {
    const detail = MA.Store.studentDetail(code);
    if (!detail) { selectedCode = null; MA.App.refresh(); return { el: U.el('div', { class: 'screen' }) }; }
    const p = detail.profile;
    const screen = U.el('div', { class: 'screen screen--teacher ' + UI.sceneClass('city') });
    screen.appendChild(UI.sceneDecor(MA.Worlds.get(8)));

    const header = U.el('header', { class: 'td-header' });
    const left = U.el('div', { class: 'td-header__left' });
    left.appendChild(UI.btn({ icon: 'back', kind: 'ghost', ariaLabel: 'Volver a la lista', onClick: function () { selectedCode = null; MA.App.refresh(); } }));
    left.appendChild(UI.profileAvatar(p, 54, 'happy'));
    const titles = U.el('div', {});
    titles.appendChild(U.el('h1', { class: 'td-title', text: (p.name || p.code) }));
    titles.appendChild(U.el('p', { class: 'td-subtitle', text: 'Código ' + p.code + ' · ' + MA.Progress.completedCount(p) + ' de ' + MA.Levels.count() + ' niveles · ' + MA.Progress.totalStars(p) + ' estrellas' }));
    left.appendChild(titles);
    header.appendChild(left);
    const right = U.el('div', { class: 'td-header__right' });
    right.appendChild(UI.btn({ emoji: '⬇️', label: 'CSV detallado', kind: 'primary', size: 'sm', onClick: function () { exportDetailCSV(code); } }));
    right.appendChild(UI.btn({ emoji: '🖨️', label: 'Imprimir', kind: 'soft', size: 'sm', onClick: function () { printStudent(code); } }));
    right.appendChild(UI.btn({ emoji: '♻️', label: 'Restablecer', kind: 'danger', size: 'sm', onClick: function () { confirmReset(code); } }));
    header.appendChild(right);
    screen.appendChild(header);

    const body = U.el('div', { class: 'td-body' });

    /* mundos */
    const worldSection = U.el('section', { class: 'td-section' });
    worldSection.appendChild(U.el('h2', { text: 'Progreso por mundo' }));
    const wtable = U.el('table', { class: 'td-table' });
    wtable.innerHTML = '<thead><tr><th>Mundo</th><th>Nombre</th><th>Completados</th><th>Estrellas</th><th>Tiempo</th><th>Estado</th></tr></thead><tbody>' +
      detail.worlds.map(function (w) {
        const wm = MA.Worlds.get(w.world);
        return '<tr><td>M' + w.world + '</td><td>' + U.esc(wm.short) + '</td><td>' + w.completed + '/10</td><td>' + w.stars + '/' + w.maxStars + '</td><td>' + U.fmtDuration(w.timeMs) + '</td><td>' + (w.done ? '✅ Completado' : 'En proceso') + '</td></tr>';
      }).join('') + '</tbody>';
    const wwrap = U.el('div', { class: 'td-table-wrap' });
    wwrap.appendChild(wtable);
    worldSection.appendChild(wwrap);
    body.appendChild(worldSection);

    /* habilidades */
    const skillSection = U.el('section', { class: 'td-section' });
    skillSection.appendChild(U.el('h2', { text: 'Habilidades' }));
    const st = U.el('table', { class: 'td-table' });
    st.innerHTML = '<thead><tr><th>Habilidad</th><th>Estado</th><th>Niveles con evidencia</th><th>Promedio estrellas</th><th>Precisión promedio</th><th>Refuerzo</th></tr></thead><tbody>' +
      detail.skills.map(function (s) {
        const needs = (s.state === 'learning' || s.state === 'practice') && s.plays > 0;
        return '<tr class="' + (needs ? 'is-needs' : '') + '"><td>' + s.emoji + ' ' + U.esc(s.name) + '</td><td>' + s.stateInfo.label + '</td><td>' + s.levels + '</td><td>' + (s.avgStars ? s.avgStars.toFixed(1) : '—') + '</td><td>' + (s.avgPrecision === null ? 'Pendiente' : Math.round(s.avgPrecision * 100) + '%') + '</td><td>' + (needs ? 'Sí, practicar' : s.state === 'none' ? 'Sin empezar' : '—') + '</td></tr>';
      }).join('') + '</tbody>';
    const swrap = U.el('div', { class: 'td-table-wrap' });
    swrap.appendChild(st);
    skillSection.appendChild(swrap);
    if (detail.recommendations.length) {
      const rec = U.el('div', { class: 'td-recs' });
      rec.innerHTML = '<b>Sugerencias de refuerzo:</b> ' + detail.recommendations.map(function (r) { return U.esc(r.reason); }).join(' ');
      skillSection.appendChild(rec);
    }
    body.appendChild(skillSection);

    /* niveles */
    const levelSection = U.el('section', { class: 'td-section' });
    levelSection.appendChild(U.el('h2', { text: 'Detalle por nivel' }));
    const ltable = U.el('table', { class: 'td-table td-table--levels' });
    ltable.innerHTML = '<thead><tr><th>Mundo</th><th>Nivel</th><th>Nombre</th><th>Habilidad</th><th>Estado</th><th>⭐</th><th>Intentos</th><th>Completados</th><th>Abandonos</th><th>Tiempo</th><th>Precisión</th><th>Pistas</th><th>Última vez</th></tr></thead><tbody>' +
      detail.levels.map(function (lv) {
        return '<tr><td>M' + lv.world + '</td><td>' + lv.index + '</td><td>' + U.esc(lv.name) + '</td><td>' + U.esc(lv.skillName) + '</td><td>' +
          (lv.completed ? '✅' : '—') + '</td><td>' + (lv.stars ? '⭐'.repeat(lv.stars) : '—') + '</td><td>' + (lv.plays || 0) + '</td><td>' + (lv.wins || 0) + '</td><td>' + (lv.abandoned || 0) + '</td><td>' + (lv.timeMs ? U.fmtDuration(lv.timeMs) : '—') + '</td><td>' + (lv.precision === null ? '—' : lv.precision + '%') + '</td><td>' + (lv.hints || 0) + '</td><td>' + dateOrDash(lv.lastPlayed) + '</td></tr>';
      }).join('') + '</tbody>';
    const lwrap = U.el('div', { class: 'td-table-wrap td-table-wrap--levels' });
    lwrap.appendChild(ltable);
    levelSection.appendChild(lwrap);
    body.appendChild(levelSection);

    screen.appendChild(body);
    return { el: screen, title: 'Detalle del estudiante' };
  }

  /* =====================  SEGURIDAD Y DATOS  ===================== */
  function renderSecurity() {
    const section = U.el('section', { class: 'td-section td-section--security' });
    section.appendChild(U.el('h2', { text: 'Seguridad del panel' }));
    section.appendChild(U.el('p', { class: 'td-help', text: 'El PIN protege el panel de entradas accidentales de los niños. Se guarda en este computador, así que no es una medida de seguridad robusta. No uses el mismo PIN de otras cuentas.' }));

    const form = U.el('div', { class: 'td-create' });
    const current = U.el('input', { type: 'password', inputmode: 'numeric', maxlength: '6', class: 'td-input', placeholder: 'PIN actual', 'aria-label': 'PIN actual' });
    const next = U.el('input', { type: 'password', inputmode: 'numeric', maxlength: '6', class: 'td-input', placeholder: 'Nuevo PIN (4 a 6 números)', 'aria-label': 'Nuevo PIN' });
    const next2 = U.el('input', { type: 'password', inputmode: 'numeric', maxlength: '6', class: 'td-input', placeholder: 'Repite el nuevo PIN', 'aria-label': 'Repetir nuevo PIN' });
    const msg = U.el('p', { class: 'td-msg', role: 'status' });
    const btn = UI.btn({
      emoji: '🔑', label: 'Cambiar PIN', kind: 'soft',
      onClick: function () {
        if (!MA.Store.checkPin(current.value)) { msg.textContent = 'El PIN actual no es correcto.'; return; }
        if (next.value !== next2.value) { msg.textContent = 'Los PIN nuevos no coinciden.'; return; }
        const res = MA.Store.setPin(next.value);
        msg.textContent = res.message;
        if (res.ok) { current.value = ''; next.value = ''; next2.value = ''; MA.UI.toast('PIN actualizado.'); }
      }
    });
    form.appendChild(current);
    form.appendChild(next);
    form.appendChild(next2);
    form.appendChild(btn);
    section.appendChild(form);
    section.appendChild(msg);
    return section;
  }

  function renderDataSection(students) {
    const section = U.el('section', { class: 'td-section' });
    section.appendChild(U.el('h2', { text: 'Datos y respaldos' }));
    section.appendChild(U.el('p', { class: 'td-help', text: 'Toda la información vive en este navegador (localStorage). Para compartir entre computadores tendrías que usar una copia de seguridad o un servidor propio; el juego no simula sincronización.' }));
    const row = U.el('div', { class: 'td-create' });
    row.appendChild(UI.btn({ emoji: '⬇️', label: 'Exportar resumen CSV', kind: 'soft', onClick: exportSummaryCSV }));
    row.appendChild(UI.btn({ emoji: '🧾', label: 'Exportar todo (JSON)', kind: 'soft', onClick: function () {
      UI.download('mouse-aventura-docente-' + U.dayKey() + '.json', MA.Store.exportText());
      MA.UI.toast('Respaldo completo descargado.');
    } }));
    const fileInput = U.el('input', { type: 'file', accept: '.json,application/json', hidden: 'hidden' });
    fileInput.addEventListener('change', function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new G.FileReader();
      reader.onload = function () {
        UI.confirm({
          title: 'Importar respaldo completo',
          message: 'Se reemplazarán todos los perfiles guardados en este computador. ¿Continuar?',
          confirmLabel: 'Sí, importar', danger: true
        }).then(function (ok) {
          if (!ok) { fileInput.value = ''; return; }
          const res = MA.Store.importText(String(reader.result || ''));
          fileInput.value = '';
          if (res.ok) { MA.UI.toast('Respaldo importado.'); MA.App.refresh(); }
          else MA.UI.toast(res.message);
        });
      };
      reader.readAsText(file);
    });
    row.appendChild(UI.btn({ emoji: '⬆️', label: 'Importar respaldo', kind: 'ghost', onClick: function () { fileInput.click(); } }));
    row.appendChild(fileInput);
    row.appendChild(UI.btn({ emoji: '🗑️', label: 'Borrar todos los datos', kind: 'danger', onClick: confirmResetAll }));
    section.appendChild(row);
    return section;
  }

  /* =====================  ACCIONES  ===================== */
  function exportSummaryCSV() {
    const rows = [['Código', 'Nombre', 'Niveles completados', 'Total niveles', 'Porcentaje', 'Estrellas', 'Mundos completados', 'Tiempo (min)', 'Clics correctos', 'Clics incorrectos', 'Precisión (%)', 'Pistas', 'Monedas', 'Insignias', 'Última actividad']];
    MA.Store.studentsSummary().forEach(function (s) {
      rows.push([s.code, s.name, s.completed, s.total, s.pct, s.stars, s.worlds, Math.round(s.timeMs / 60000), s.correct, s.wrong, s.accuracy === null ? 'Pendiente' : s.accuracy, s.hints, s.coins, s.badges.length, dateOrDash(s.lastPlayed)]);
    });
    UI.download('mouse-aventura-estudiantes-' + U.dayKey() + '.csv', toCSV(rows), 'text/csv;charset=utf-8');
    MA.UI.toast('Resumen CSV descargado.');
  }

  function exportDetailCSV(code) {
    const detail = MA.Store.studentDetail(code);
    if (!detail) return;
    const rows = [['Código', 'Mundo', 'Nivel', 'Nombre', 'Habilidad', 'Completado', 'Estrellas', 'Intentos', 'Completados', 'Abandonos', 'Tiempo (s)', 'Clics correctos', 'Clics incorrectos', 'Precisión (%)', 'Pistas', 'Última actividad']];
    detail.levels.forEach(function (lv) {
      rows.push([detail.profile.code, lv.world, lv.index, lv.name, lv.skillName, lv.completed ? 'Sí' : 'No', lv.stars, lv.plays, lv.wins, lv.abandoned, Math.round(lv.timeMs / 1000), lv.correct, lv.wrong, lv.precision === null ? 'Pendiente' : lv.precision, lv.hints, dateOrDash(lv.lastPlayed)]);
    });
    UI.download('mouse-aventura-detalle-' + code + '-' + U.dayKey() + '.csv', toCSV(rows), 'text/csv;charset=utf-8');
    MA.UI.toast('Detalle CSV descargado.');
  }

  function printStudent(code) {
    const detail = MA.Store.studentDetail(code);
    if (!detail) return;
    const p = detail.profile;
    const worlds = detail.worlds.map(function (w) {
      const wm = MA.Worlds.get(w.world);
      return '<tr><td>' + w.world + '</td><td>' + U.esc(wm.short) + '</td><td>' + w.completed + '/10</td><td>' + w.stars + '/' + w.maxStars + '</td><td>' + U.fmtDuration(w.timeMs) + '</td></tr>';
    }).join('');
    const skills = detail.skills.filter(function (s) { return s.plays > 0; }).map(function (s) {
      return '<tr><td>' + U.esc(s.name) + '</td><td>' + s.stateInfo.label + '</td><td>' + s.levels + '</td><td>' + (s.avgStars ? s.avgStars.toFixed(1) : '—') + '</td></tr>';
    }).join('');
    const html = '<div class="print-page">' +
      '<h1>Resumen individual de progreso</h1>' +
      '<p><b>Estudiante:</b> ' + U.esc(p.name || p.code) + ' &nbsp; <b>Código:</b> ' + U.esc(p.code) + ' &nbsp; <b>Fecha:</b> ' + U.fmtDate() + '</p>' +
      '<p><b>Niveles completados:</b> ' + MA.Progress.completedCount(p) + ' de ' + MA.Levels.count() + ' &nbsp; <b>Estrellas:</b> ' + MA.Progress.totalStars(p) + ' de 300 &nbsp; <b>Tiempo:</b> ' + U.fmtDuration(p.totals.timeMs || 0) + '</p>' +
      '<h2>Progreso por mundo</h2><table class="print-table"><thead><tr><th>Mundo</th><th>Nombre</th><th>Niveles</th><th>Estrellas</th><th>Tiempo</th></tr></thead><tbody>' + worlds + '</tbody></table>' +
      '<h2>Habilidades observadas</h2>' + (skills ? '<table class="print-table"><thead><tr><th>Habilidad</th><th>Estado</th><th>Niveles</th><th>Promedio estrellas</th></tr></thead><tbody>' + skills + '</tbody></table>' : '<p>Sin datos todavía.</p>') +
      '<h2>Recomendaciones de refuerzo</h2><ul>' + (detail.recommendations.length ? detail.recommendations.map(function (r) { return '<li>' + U.esc(r.reason) + '</li>'; }).join('') : '<li>Continuar con la aventura.</li>') + '</ul>' +
      '<p class="print-note">El PIN del panel docente es una protección básica local. Documento generado por Mouse Aventura.</p></div>';
    UI.printHTML(html);
  }

  function confirmReset(code) {
    const content = U.el('div', { class: 'td-confirm' });
    content.innerHTML = '<p>Se borrarán las estrellas, monedas, insignias y estadísticas de <b>' + U.esc(code) + '</b>. El avatar elegido se conserva. <br><small>Esta acción no se puede deshacer.</small></p>' +
      '<label class="td-confirm__label">Escribe el código <b>' + U.esc(code) + '</b> para confirmar</label>';
    const input = U.el('input', { class: 'td-input', 'aria-label': 'Código para confirmar' });
    const err = U.el('p', { class: 'td-msg', role: 'alert' });
    content.appendChild(input);
    content.appendChild(err);
    const modal = UI.modal({
      title: 'Restablecer progreso',
      emoji: '♻️',
      content: content,
      dismissible: true,
      actions: [{ label: 'Cancelar', kind: 'ghost' }]
    });
    const go = UI.btn({
      emoji: '♻️', label: 'Borrar progreso del estudiante', kind: 'danger',
      onClick: function () {
        if (input.value.trim().toUpperCase() !== code.toUpperCase()) {
          err.textContent = 'El código no coincide. Escríbelo exactamente para confirmar.';
          return;
        }
        MA.Store.resetProfile(code, true);
        modal.close();
        MA.UI.toast('Progreso de ' + code + ' restablecido.');
        MA.App.refresh();
      }
    });
    content.appendChild(go);
    G.setTimeout(function () { input.focus(); }, 120);
  }

  function confirmResetAll() {
    const content = U.el('div', { class: 'td-confirm' });
    content.innerHTML = '<p>Se borrarán <b>todos los perfiles, progresos, medallas y configuraciones</b> guardados en este computador. <br><small>Antes de continuar, considera descargar un respaldo.</small></p>' +
      '<label class="td-confirm__label">Escribe <b>BORRAR TODO</b> para confirmar</label>';
    const input = U.el('input', { class: 'td-input', 'aria-label': 'Confirmación' });
    const err = U.el('p', { class: 'td-msg', role: 'alert' });
    content.appendChild(input);
    content.appendChild(err);
    const modal = UI.modal({ title: 'Borrar todos los datos', emoji: '🗑️', content: content, dismissible: true, actions: [{ label: 'Cancelar', kind: 'ghost' }] });
    const go = UI.btn({
      label: 'Borrar todo', kind: 'danger',
      onClick: function () {
        if (input.value.trim().toUpperCase() !== 'BORRAR TODO') { err.textContent = 'Escribe exactamente BORRAR TODO.'; return; }
        MA.Store.resetAll();
        modal.close();
        selectedCode = null;
        MA.UI.toast('Todos los datos se borraron.');
        MA.App.go('perfil');
      }
    });
    content.appendChild(go);
  }
})(window);
