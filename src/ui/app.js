/* =========================================================================
   Mouse Aventura — enrutador y armazón de la aplicación
   Rutas: #/inicio, #/perfil, #/mapa, #/mundo/1, #/jugar/w1l1, #/progreso,
          #/personaje, #/ajustes, #/ayuda, #/docente, #/diploma
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  const ROUTES = {
    '': 'home', 'inicio': 'home', 'perfil': 'onboarding', 'mapa': 'worldmap',
    'mundo': 'levelmap', 'jugar': 'play', 'progreso': 'progress',
    'personaje': 'wardrobe', 'ajustes': 'settings', 'ayuda': 'help',
    'docente': 'teacher', 'diploma': 'diploma'
  };

  const App = (MA.App = {
    root: null,
    screenEl: null,
    cleanup: null,
    currentName: null,
    currentParams: null,
    booted: false,

    init: function () {
      App.root = G.document.getElementById('app');
      App.applySettings();
      MA.Store.on('save-error', function (msg) { MA.UI.toast(msg || 'No se pudo guardar el progreso.'); });
      MA.Store.on('change', function () { App.applySettings(); });
      G.addEventListener('hashchange', function () { App.renderCurrent(true); });

      const unlock = function () {
        try {
          MA.Audio.init(MA.Store.settings());
          MA.Store.applyAudio();
        } catch (e) {}
        G.document.removeEventListener('pointerdown', unlock);
        G.document.removeEventListener('keydown', unlock);
      };
      G.document.addEventListener('pointerdown', unlock);
      G.document.addEventListener('keydown', unlock);

      if (MA.Storage.lastError) G.setTimeout(function () { MA.UI.toast(MA.Storage.lastError); }, 900);
      App.booted = true;
      App.renderCurrent(false);
    },

    applySettings: function () {
      const s = MA.Store.settings();
      if (!s) return;
      const body = G.document.body;
      body.classList.toggle('reduce-motion', !!s.reduceMotion || MA.PLATFORM.prefersReducedMotion());
      body.classList.toggle('high-contrast', !!s.highContrast);
      body.classList.toggle('bigger-targets', !!s.biggerTargets);
    },

    parseHash: function () {
      const raw = (G.location.hash || '').replace(/^#\/?/, '');
      const parts = raw.split('/').filter(Boolean);
      const name = ROUTES[(parts[0] || '').toLowerCase()] || 'home';
      return { name: name, params: parts.slice(1), raw: raw };
    },

    go: function (path) {
      const clean = String(path || '').replace(/^#?\/?/, '');
      const target = '#/' + clean;
      if (G.location.hash === target) App.renderCurrent(true);
      else G.location.hash = target;
    },

    /** Re-render de la pantalla actual sin cambiar la ruta. */
    refresh: function () { App.renderCurrent(false); },

    renderCurrent: function (fromHashChange) {
      const route = App.parseHash();
      let name = route.name;
      const profile = MA.Store.profile();

      if (!profile && name !== 'onboarding' && name !== 'teacher' && name !== 'help') {
        App.go('perfil');
        return;
      }
      if (profile && name === 'onboarding' && route.params.length === 0) {
        // Si ya hay perfil, el perfil se puede elegir desde inicio; mostramos igual la galería.
      }
      if (name === 'play' && !route.params[0]) { App.go('mapa'); return; }

      const screen = MA.Screens[name];
      if (!screen) { App.go('inicio'); return; }

      if (App.cleanup) { try { App.cleanup(); } catch (e) {} App.cleanup = null; }
      App.screenEl = null;
      U.clear(App.root);

      let result;
      try {
        result = screen.render(route.params, route);
      } catch (e) {
        App.renderError(e);
        return;
      }
      if (result && result.el) {
        App.root.appendChild(result.el);
        App.screenEl = result.el;
        App.cleanup = result.destroy || null;
      }
      App.currentName = name;
      App.currentParams = route.params;
      if (result && result.title) G.document.title = result.title + ' · Mouse Aventura';
      else G.document.title = 'Mouse Aventura: Pequeños Exploradores';
      try { G.scrollTo(0, 0); } catch (e) {}
      if (result && result.onShow) { try { result.onShow(); } catch (e) {} }
      MA.App.announceScreen(name);
    },

    renderError: function (err) {
      U.clear(App.root);
      const box = U.el('div', { class: 'screen screen--error' });
      box.innerHTML =
        '<div class="error-card">' +
        '<div class="error-card__emoji" aria-hidden="true">🛠️</div>' +
        '<h1>Ups, algo no cargó bien</h1>' +
        '<p>Tu progreso está guardado. Puedes volver al inicio e intentarlo otra vez.</p>' +
        '<button type="button" class="btn btn--primary" id="btn-error-home">Volver al inicio</button>' +
        '</div>';
      App.root.appendChild(box);
      const btn = box.querySelector('#btn-error-home');
      if (btn) btn.addEventListener('click', function () { App.go('inicio'); });
      if (G.console && G.console.error) G.console.error('[Mouse Aventura]', err);
    },

    announceScreen: function (name) {
      const messages = {
        home: 'Pantalla de inicio', onboarding: 'Elige tu personaje', worldmap: 'Mapa de mundos',
        levelmap: 'Niveles del mundo', play: 'Comenzando actividad', progress: 'Mi progreso',
        wardrobe: 'Mi personaje', settings: 'Configuración', help: 'Ayuda',
        teacher: 'Panel docente', diploma: 'Diploma'
      };
      U.announce(messages[name] || '');
    },

    /* Cabecera común para pantallas internas (no la de juego). */
    header: function (opts) {
      const o = opts || {};
      const bar = U.el('header', { class: 'topbar' });
      const left = U.el('div', { class: 'topbar__left' });
      if (o.backTo) {
        left.appendChild(MA.UI.btn({
          icon: 'back', kind: 'ghost', className: 'btn--back',
          ariaLabel: 'Volver', onClick: function () { App.go(o.backTo); }
        }));
      }
      if (o.avatarProfile !== undefined) {
        left.appendChild(MA.UI.profileAvatar(o.avatarProfile, 44));
      }
      left.appendChild(U.el('div', { class: 'topbar__titles' }, [
        U.el('h1', { class: 'topbar__title', text: o.title || 'Mouse Aventura' }),
        o.subtitle ? U.el('p', { class: 'topbar__subtitle', text: o.subtitle }) : null
      ]));
      bar.appendChild(left);

      const right = U.el('div', { class: 'topbar__right' });
      if (o.stats && o.stats.profile) {
        right.appendChild(App.coinChip(o.stats.profile));
        right.appendChild(App.starChip(o.stats.profile));
      }
      if (o.actions) o.actions.forEach(function (a) { right.appendChild(a); });
      bar.appendChild(right);
      return bar;
    },

    coinChip: function (profile) {
      return MA.UI.chip(U.fmtNumber((profile && profile.coins) || 0) + ' monedas', '💰', { className: 'chip--coin' });
    },

    starChip: function (profile) {
      return MA.UI.chip(MA.Progress.totalStars(profile) + '/' + MA.Progress.maxStars(), '⭐', { className: 'chip--star' });
    },

    footer: function (text) {
      const f = U.el('footer', { class: 'app-footer' });
      f.innerHTML = '<span>Mouse Aventura · Pequeños Exploradores</span>' +
        '<span class="app-footer__sep">·</span>' +
        '<button type="button" class="link-btn" data-teacher>Panel docente</button>' +
        (text ? '<span class="app-footer__sep">·</span><span>' + U.esc(text) + '</span>' : '');
      const btn = f.querySelector('[data-teacher]');
      if (btn) btn.addEventListener('click', function () { App.go('docente'); });
      return f;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
