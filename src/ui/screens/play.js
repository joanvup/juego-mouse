/* Pantalla de juego: HUD, escenario, pausa, ayuda y resultados */
(function (G) {
  'use strict';
  const MA = G.MA;
  const U = MA.Utils;
  const UI = MA.UI;
  const S = (MA.Screens = MA.Screens || {});

  function mechanicInfo(level) {
    if (level.template === 'move') return { emoji: '🖱️', title: 'Solo mover el mouse', hint: 'No hay que hacer clic.' };
    if (level.template === 'click') {
      return level.params && level.params.button === 'right'
        ? { emoji: '🖱️', title: 'Clic con el botón derecho', hint: 'Esta vez usamos el botón derecho.' }
        : { emoji: '👆', title: 'Un clic con el botón izquierdo', hint: 'Flecha encima y un clic suave.' };
    }
    if (level.template === 'sequence') return { emoji: '🔢', title: 'Seguir un orden', hint: 'Mira la tira de arriba.' };
    if (level.template === 'drag') return { emoji: '🖐️', title: 'Arrastrar y soltar', hint: 'Mantén, mueve y suelta.' };
    if (level.template === 'path') return { emoji: '🌀', title: 'Seguir el camino', hint: 'Avanza despacio.' };
    if (level.template === 'wheel') return { emoji: '🎡', title: 'Girar la rueda', hint: 'La rueda está entre los botones.' };
    return { emoji: '🌟', title: 'Misión con varias partes', hint: 'Una parte a la vez.' };
  }

  S.play = {
    render: function (params) {
      const level = MA.Levels.get(params[0]);
      const profile = MA.Store.profile();
      if (!level) {
        const errorScreen = U.el('div', { class: 'screen screen--play' });
        errorScreen.innerHTML = '<div class="error-card"><h1>No encontramos ese nivel</h1>' +
          '<p>Vuelve al mapa y elige otro.</p><button class="btn btn--primary" data-go-map>Ir al mapa</button></div>';
        errorScreen.querySelector('[data-go-map]').addEventListener('click', function () { MA.App.go('mapa'); });
        return { el: errorScreen, title: 'Nivel no encontrado' };
      }
      if (!profile) { G.setTimeout(function () { MA.App.go('perfil'); }, 0); return { el: U.el('div', { class: 'screen' }) }; }

      const isTeacherPlay = sessionStorage.getItem('ma.teacherPlay') === '1';
      if (isTeacherPlay) sessionStorage.removeItem('ma.teacherPlay');

      const status = MA.Progress.levelStatus(profile, level);
      if (status.status === 'locked' && !isTeacherPlay) {
        G.setTimeout(function () { MA.App.go('mundo/' + level.world); }, 0);
        MA.UI.toast('Primero completa el nivel anterior.');
        return { el: U.el('div', { class: 'screen' }) };
      }

      const world = MA.Worlds.get(level.world);
      const info = mechanicInfo(level);
      const screen = U.el('div', { class: 'screen screen--play ' + UI.sceneClass(level.scene) });
      screen.dataset.level = level.id;
      if (level.template === 'drag' || level.template === 'wheel') screen.classList.add('has-top-bubble');

      /* ---------- HUD ---------- */
      const hud = U.el('header', { class: 'hud' });
      const hudLeft = U.el('div', { class: 'hud__left' });
      const pauseBtn = UI.btn({ icon: 'pause', kind: 'soft', className: 'hud__pause', ariaLabel: 'Pausar la actividad', onClick: function () { openPause(); } });
      hudLeft.appendChild(pauseBtn);
      const titles = U.el('div', { class: 'hud__titles' });
      titles.appendChild(U.el('span', { class: 'hud__world', text: 'Mundo ' + level.world + ' · Nivel ' + level.index + ' de 10' }));
      titles.appendChild(U.el('h1', { class: 'hud__title', text: level.name }));
      hudLeft.appendChild(titles);
      hud.appendChild(hudLeft);

      const progressWrap = U.el('div', { class: 'hud__progress' });
      const bar = UI.bar(0, { className: 'bar--progress' });
      const progressText = U.el('span', { class: 'hud__progress-text', text: '0 / 0' });
      progressWrap.appendChild(bar);
      progressWrap.appendChild(progressText);
      hud.appendChild(progressWrap);

      const hudRight = U.el('div', { class: 'hud__right' });
      const timerChip = U.el('span', { class: 'hud__timer', hidden: 'hidden' });
      hudRight.appendChild(timerChip);
      const assistChip = U.el('span', { class: 'hud__assist', hidden: 'hidden', text: '💡 Pista activa' });
      hudRight.appendChild(assistChip);
      const hintBtn = UI.btn({ emoji: '💡', label: 'Ayuda', kind: 'help', className: 'hud__help', onClick: function () { useHint(); } });
      hudRight.appendChild(hintBtn);
      const coinChip = UI.chip(U.fmtNumber(profile.coins || 0), '💰', { className: 'chip--coin hud__chip' });
      const starChip = UI.chip(MA.Progress.totalStars(profile), '⭐', { className: 'chip--star hud__chip' });
      hudRight.appendChild(coinChip);
      hudRight.appendChild(starChip);
      hud.appendChild(hudRight);
      screen.appendChild(hud);

      /* ---------- escenario ---------- */
      const stage = U.el('main', { class: 'play-stage', id: 'play-stage', 'aria-label': 'Área de juego' });
      stage.appendChild(U.el('div', { class: 'stage-bg', 'aria-hidden': 'true' }));
      stage.appendChild(UI.sceneDecor(world));
      const layer = U.el('div', { class: 'stage-layer', id: 'stage-layer' });
      stage.appendChild(layer);

      const bubbleEl = U.el('div', { class: 'mascot-bubble', 'aria-live': 'polite' });
      const bubbleAvatar = U.el('div', { class: 'mascot-bubble__avatar' });
      const bubbleText = U.el('p', { class: 'mascot-bubble__text' });
      bubbleEl.appendChild(bubbleAvatar);
      bubbleEl.appendChild(bubbleText);
      stage.appendChild(bubbleEl);
      screen.appendChild(stage);

      /* ---------- barra de tarea ---------- */
      const taskbar = U.el('footer', { class: 'taskbar' });
      const taskIcon = U.el('span', { class: 'taskbar__icon', 'aria-hidden': 'true', text: info.emoji });
      const taskText = U.el('p', { class: 'taskbar__text', text: level.goal });
      const taskInfo = U.el('div', { class: 'taskbar__info' });
      taskInfo.appendChild(taskIcon);
      taskInfo.appendChild(taskText);
      taskbar.appendChild(taskInfo);
      const taskActions = U.el('div', { class: 'taskbar__actions' });
      taskActions.appendChild(UI.btn({ emoji: '🔁', label: 'Repetir', kind: 'soft', size: 'sm', onClick: function () { restart(); } }));
      taskActions.appendChild(UI.btn({ label: 'Mapa', kind: 'ghost', size: 'sm', icon: 'home', onClick: function () { leave('mundo/' + level.world); } }));
      taskbar.appendChild(taskActions);
      screen.appendChild(taskbar);

      /* ---------- introducción ---------- */
      const intro = U.el('div', { class: 'level-intro' });
      const card = U.el('div', { class: 'level-intro__card' });
      card.innerHTML =
        '<div class="level-intro__stripe"><span>Mundo ' + level.world + '</span><span>Nivel ' + level.index + ' de 10</span><span class="level-intro__diff">Dificultad ' + Math.ceil(level.difficulty / 10) + '/10</span></div>' +
        '<div class="level-intro__mechanic"><span class="level-intro__emoji" aria-hidden="true">' + info.emoji + '</span>' +
        '<div><b>' + U.esc(info.title) + '</b><small>' + U.esc(info.hint) + '</small></div></div>' +
        '<h2 class="level-intro__name">' + U.esc(level.name) + '</h2>' +
        '<p class="level-intro__goal">' + U.esc(level.goal) + '</p>' +
        '<ul class="level-intro__list">' + level.instructions.slice(0, 3).map(function (t) { return '<li>' + U.esc(t) + '</li>'; }).join('') + '</ul>' +
        '<div class="level-intro__rewards">' + UI.stars(0).outerHTML +
        '<span class="level-intro__cap">Hasta 3 estrellas</span>' +
        '<span class="level-intro__coins">💰 +' + (level.rewards.coins || 0) + ' al terminarlo</span>' +
        (level.timeLimit ? '<span class="level-intro__time">⏱ reloj opcional</span>' : '') + '</div>';
      const introActions = U.el('div', { class: 'level-intro__actions' });
      const startBtn = UI.btn({ label: '¡Empezar!', emoji: '▶', kind: 'primary', size: 'xl', onClick: function () { begin(); } });
      introActions.appendChild(startBtn);
      if (level.tutorial) {
        introActions.appendChild(UI.btn({
          label: 'Ver tutorial', kind: 'soft', emoji: '🎓',
          onClick: function () { showTutorial(function () { begin(); }); }
        }));
      }
      introActions.appendChild(UI.btn({ label: 'Volver al mapa', kind: 'ghost', onClick: function () { leave('mundo/' + level.world); } }));
      card.appendChild(introActions);
      intro.appendChild(card);
      screen.appendChild(intro);

      /* ---------- estado ---------- */
      let engine = null;
      let started = false;
      let finished = false;
      let abandoned = false;
      let bubbleTimer = 0;
      let introVisible = true;
      let resultsTimer = 0;

      function clearResultsTimer() {
        if (resultsTimer) { G.clearTimeout(resultsTimer); resultsTimer = 0; }
      }

      const hudBridge = {
        progress: function (done, total) {
          showProgress(done, total);
        },
        timer: function (ms) {
          if (ms === null || ms === undefined) { timerChip.hidden = true; return; }
          timerChip.hidden = false;
          timerChip.textContent = '⏱ ' + U.fmtClock(ms);
          timerChip.classList.toggle('is-low', ms <= 15000);
          timerChip.classList.toggle('is-off', ms <= 0);
        },
        assist: function (n) {
          assistChip.hidden = !n;
        },
        status: function (text) {
          if (text) taskText.textContent = text;
        }
      };

      function showProgress(done, total) {
        const t = Math.max(1, total || 0);
        const pct = total ? U.clamp(done / total * 100, 0, 100) : 0;
        bar.querySelector('i').style.width = pct + '%';
        progressText.textContent = done + ' / ' + (total || 0);
        bar.setAttribute('aria-valuenow', String(Math.round(pct)));
      }

      function bubble(text, mood, ms) {
        bubbleText.textContent = text;
        bubbleAvatar.innerHTML = MA.Avatars.svg((profile.avatar && profile.avatar.character) || 'mimo', {
          size: 64, accessories: (profile.avatar && profile.avatar.accessories) || [], mood: mood || 'idle'
        });
        bubbleEl.classList.add('is-visible');
        if (bubbleTimer) G.clearTimeout(bubbleTimer);
        bubbleTimer = G.setTimeout(function () { bubbleEl.classList.remove('is-visible'); }, ms || 3600);
      }

      function hideBubble() {
        bubbleEl.classList.remove('is-visible');
      }

      /* Al empezar a interactuar, la burbuja se aparta para no estorbar. */
      const onStageDown = function () { hideBubble(); };
      stage.addEventListener('pointerdown', onStageDown);

      /* ---------- motor ---------- */
      function createEngine() {
        if (engine) { try { engine.destroy(); } catch (e) {} engine = null; }
        U.clear(layer);
        engine = MA.Engine.create({
          level: level,
          stage: stage,
          layer: layer,
          settings: MA.Store.settings(),
          hud: hudBridge,
          onBubble: function (b) { bubble(b.text, b.mood, b.ms); },
          onToast: function (t) { MA.UI.toast(t); },
          onSuggestHint: function () {
            if (finished) return;
            hintBtn.classList.add('is-pulsing');
            G.setTimeout(function () { hintBtn.classList.remove('is-pulsing'); }, 4000);
            bubble('¿Quieres una pista? Toca el botón 💡 Ayuda.', 'happy', 4200);
          },
          onTimeUp: function () {
            if (finished) return;
            engine.pause();
            var m = UI.modal({
              title: 'Se acabó el reloj',
              emoji: '⏱️',
              dismissible: false,
              html: '<p class="modal-text">El reloj era opcional. Puedes seguir practicando sin reloj: no pierdes nada de lo que llevas.</p>',
              actions: [
                { label: 'Seguir sin reloj', kind: 'primary', onClick: function () { if (engine) { engine.resume(); bubble('¡Seguimos sin reloj! Tómate tu tiempo.', 'happy', 3200); } } },
                { label: 'Repetir el nivel', kind: 'soft', onClick: function () { restart(); } }
              ]
            });
            void m;
          },
          onFinish: function (result) { onFinish(result); }
        });
        engine.start();
        G.requestAnimationFrame(function () {
          if (engine) showProgress(engine.metrics.targets.done, engine.metrics.targets.total);
        });
      }

      function markTutorialSeen(kind) {
        profile.tutorials = profile.tutorials || {};
        profile.tutorials[kind] = true;
        MA.Store.scheduleSave();
      }

      function showTutorial(after) {
        const t = level.tutorial || { kind: 'click', title: 'Cómo jugar', steps: [] };
        MA.Tutorial.open({
          kind: t.kind, title: t.title, steps: t.steps,
          onDone: function () { markTutorialSeen(t.kind); if (after) after(); }
        });
      }

      function begin() {
        if (introVisible) {
          intro.classList.add('is-hidden');
          introVisible = false;
          G.setTimeout(function () { if (intro.parentNode) U.remove(intro); }, 320);
        }
        if (engine) { if (engine.isPaused()) engine.resume(); return; }
        const t = level.tutorial;
        if (t && !(profile.tutorials && profile.tutorials[t.kind])) {
          showTutorial(function () { startAttempt(); });
          return;
        }
        startAttempt();
      }

      function startAttempt() {
        finished = false;
        abandoned = false;
        hideBubble();
        MA.Store.startLevel(level.id);
        taskText.textContent = level.goal;
        assistChip.hidden = true;
        timerChip.hidden = !level.timeLimit;
        createEngine();
        started = true;
        bubble(level.goal, 'idle', 4200);
        MA.Audio.resume();
        MA.Audio.play('whoosh');
      }

      function useHint() {
        if (!engine || finished) {
          bubble('Primero empieza la actividad con el botón ¡Empezar!', 'idle', 2600);
          return;
        }
        const text = engine.hint();
        if (text) taskText.textContent = level.goal;
        hintBtn.classList.remove('is-pulsing');
      }

      function openPause() {
        if (!engine || finished) {
          if (!started) leave('mundo/' + level.world);
          return;
        }
        engine.pause();
        var paused = UI.modal({
          title: 'Pausa',
          emoji: '⏸️',
          dismissible: true,
          html:
            '<div class="pause-block"><h3>' + U.esc(level.name) + '</h3>' +
            '<ul class="pause-list">' + level.instructions.map(function (t) { return '<li>' + U.esc(t) + '</li>'; }).join('') + '</ul>' +
            '<p class="pause-goal"><b>Objetivo:</b> ' + U.esc(level.goal) + '</p></div>',
          actions: [
            { label: 'Seguir jugando', kind: 'primary', emoji: '▶', onClick: function () { if (engine) engine.resume(); } },
            { label: 'Repetir', kind: 'soft', emoji: '🔁', onClick: function () { restart(); } },
            { label: 'Ir al mapa', kind: 'ghost', emoji: '🗺️', onClick: function () { leave('mundo/' + level.world); } }
          ],
          onClose: function () { if (engine) engine.resume(); }
        });
        void paused;
      }

      function restart() {
        clearResultsTimer();
        if (engine) { try { engine.destroy(); } catch (e) {} engine = null; }
        finished = false;
        G.setTimeout(function () { startAttempt(); }, 120);
      }

      function leave(target) {
        clearResultsTimer();
        if (engine && started && !finished && !abandoned) {
          abandoned = true;
          try { MA.Store.abandonLevel(level.id, engine.elapsed(), engine.getMetrics()); } catch (e) {}
        }
        if (engine) { try { engine.destroy(); } catch (e) {} engine = null; }
        MA.App.go(target || ('mundo/' + level.world));
      }

      /* ---------- resultados ---------- */
      function onFinish(result) {
        if (finished) return;
        finished = true;
        hideBubble();
        const summary = MA.Store.finishLevel(level, result);
        coinChip.querySelector('span:last-child').textContent = U.fmtNumber(MA.Store.profile().coins || 0);
        starChip.querySelector('span:last-child').textContent = String(MA.Progress.totalStars(MA.Store.profile()));
        clearResultsTimer();
        resultsTimer = G.setTimeout(function () {
          resultsTimer = 0;
          if (!screen.isConnected || !finished) return;
          showResults(result, summary);
        }, 950);
      }

      function showResults(result, summary) {
        const p = MA.Store.profile();
        const next = MA.Levels.next(level.id);
        const completedAll = MA.Progress.completedCount(p) >= MA.Levels.count();
        const content = U.el('div', { class: 'results' });
        const starWrap = U.el('div', { class: 'results__stars' });
        starWrap.innerHTML = UI.stars(result.stars, { animate: true }).outerHTML;
        content.appendChild(starWrap);
        content.appendChild(U.el('p', { class: 'results__message', text: MA.Scoring.message(result) }));
        const chips = U.el('div', { class: 'results__chips' });
        chips.appendChild(UI.chip(result.indicator.label + ': ' + result.indicator.display, result.pending ? '⏳' : '🎯'));
        chips.appendChild(UI.chip('Tiempo: ' + U.fmtClock(result.timeMs), '⏱️'));
        chips.appendChild(UI.chip('Pistas: ' + (result.hints || 0), '💡'));
        content.appendChild(chips);

        const detail = U.el('ul', { class: 'results__detail' });
        result.detail.forEach(function (d) {
          detail.appendChild(U.el('li', {}, [U.el('span', { text: d.label }), U.el('b', { text: d.value })]));
        });
        content.appendChild(detail);

        const rewards = U.el('div', { class: 'results__rewards' });
        rewards.appendChild(U.el('span', { class: 'reward reward--coin', text: (summary.coins > 0 ? '+' + summary.coins : '+0') + ' monedas 💰' }));
        if (summary.first) rewards.appendChild(U.el('span', { class: 'reward reward--new', text: '¡Primera vez completado!' }));
        else if (summary.improved) rewards.appendChild(U.el('span', { class: 'reward reward--new', text: '¡Mejoraste tus estrellas!' }));
        else rewards.appendChild(U.el('span', { class: 'reward', text: '¡Practicaste otra vez!' }));
        if (summary.badge) {
          rewards.appendChild(U.el('span', { class: 'reward reward--badge', text: '🏅 Insignia: ' + summary.badge.name }));
        }
        if (summary.chestCoins) {
          rewards.appendChild(U.el('span', { class: 'reward reward--chest', text: '🎁 Cofre del mundo: +' + summary.chestCoins + ' monedas' }));
        }
        (summary.skillUps || []).forEach(function (s) {
          rewards.appendChild(U.el('span', { class: 'reward reward--skill', text: '🌟 ' + s.name + ': ' + MA.Skills.state(s.state).label }));
        });
        content.appendChild(rewards);

        if (completedAll) {
          const all = U.el('div', { class: 'results__great' });
          all.innerHTML = '<span aria-hidden="true">🏆</span><div><b>¡Completaste los 100 niveles!</b><small>Eres Maestro o Maestra del Mouse. Tu diploma está listo.</small></div>';
          content.appendChild(all);
        }

        const actions = [];
        if (completedAll || level.graduation) {
          actions.push({ label: 'Ver mi diploma', emoji: '🎓', kind: 'primary', onClick: function () { leave('diploma'); } });
        }
        if (next) {
          actions.push({
            label: 'Siguiente nivel', emoji: '➡️', kind: 'primary',
            onClick: function () { MA.App.go('jugar/' + next.id); }
          });
        }
        actions.push({ label: 'Repetir', emoji: '🔁', kind: 'soft', onClick: function () { restart(); } });
        actions.push({ label: 'Ir al mapa', emoji: '🗺️', kind: 'ghost', onClick: function () { leave('mundo/' + level.world); } });

        UI.modal({
          title: '¡Nivel completado!',
          emoji: '🎉',
          dismissible: false,
          content: content,
          className: 'modal--results',
          actions: actions,
          onClose: function () { /* el niño elige una opción */ }
        });
        MA.Audio.play('celebrate');
      }

      /* ---------- teclado y visibilidad ---------- */
      function onKey(ev) {
        if (ev.key === 'Escape' && engine && !finished) {
          ev.preventDefault();
          if (engine.isPaused()) engine.resume();
          else openPause();
        }
        if ((ev.key === 'h' || ev.key === 'H') && engine && !finished && !engine.isPaused()) {
          useHint();
        }
      }
      function onVisibility() {
        if (document.hidden && engine && !engine.isPaused() && !finished) openPause();
      }
      G.document.addEventListener('keydown', onKey);
      G.document.addEventListener('visibilitychange', onVisibility);

      const destroy = function () {
        G.document.removeEventListener('keydown', onKey);
        G.document.removeEventListener('visibilitychange', onVisibility);
        stage.removeEventListener('pointerdown', onStageDown);
        clearResultsTimer();
        if (bubbleTimer) G.clearTimeout(bubbleTimer);
        if (engine && started && !finished && !abandoned) {
          abandoned = true;
          try { MA.Store.abandonLevel(level.id, engine.elapsed(), engine.getMetrics()); } catch (e) {}
        }
        if (engine) { try { engine.destroy(); } catch (e) {} engine = null; }
      };

      G.requestAnimationFrame(function () {
        if (introVisible) bubble('Lee el objetivo y toca ¡Empezar!', 'idle', 5200);
      });

      return { el: screen, title: level.name, destroy: destroy };
    }
  };
})(window);
