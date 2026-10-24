/* Arranque de Mouse Aventura */
(function (G) {
  'use strict';
  const MA = G.MA;

  function boot() {
    try {
      MA.Store.init();
      if (G.console && console.info) {
        const issues = MA.Levels.validate();
        if (!issues.ok) console.error('[Mouse Aventura] Niveles con problemas:', issues.errors);
        else console.info('[Mouse Aventura] ' + issues.stats.levels + ' niveles listos.', issues.stats.templates);
      }
    } catch (e) {
      if (G.console) console.error('[Mouse Aventura] Error al iniciar', e);
    }
    MA.App.init();

    if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;

      function reloadForUpdate() {
        if (reloading) return;
        reloading = true;
        if (MA.UI && MA.UI.toast) MA.UI.toast('El juego se actualizó. Recargando…');
        G.setTimeout(function () { location.reload(); }, 400);
      }

      navigator.serviceWorker.addEventListener('controllerchange', function () {
        /* La primera instalación también dispara el evento: no recargar. */
        if (!hadController || reloading) return;
        /* No cortar un nivel a medias: se aplica al volver al mapa. */
        if (/^#\/jugar\//.test(location.hash)) {
          const onLeave = function () {
            if (/^#\/jugar\//.test(location.hash)) return;
            G.removeEventListener('hashchange', onLeave);
            reloadForUpdate();
          };
          G.addEventListener('hashchange', onLeave);
          if (MA.UI && MA.UI.toast) MA.UI.toast('Hay una versión nueva. Se aplicará al salir del nivel.');
          return;
        }
        reloadForUpdate();
      });

      G.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').then(function (reg) {
          /* Buscar actualización ahora y no dentro de 24 h. */
          try { reg.update(); } catch (e) {}
        }).catch(function () { /* sin conexión opcional */ });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
