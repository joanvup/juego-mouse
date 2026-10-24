/* =========================================================================
   Mouse Aventura — almacenamiento local
   - Lectura/escritura tolerante a fallos (cuota, modo privado, datos dañados).
   - Copia de seguridad automática antes de sobrescribir.
   - Migración de versiones del formato de datos.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  const KEY = 'mouseAventura.v1';
  const BACKUP_KEY = 'mouseAventura.backup.v1';
  const SCHEMA_VERSION = 1;

  const Storage = (MA.Storage = {
    KEY: KEY,
    BACKUP_KEY: BACKUP_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    lastError: null,

    /** Lee y sanea el estado guardado. Devuelve null si no hay nada válido. */
    load: function () {
      const raw = U.storage.get(KEY);
      const parsed = Storage._parse(raw);
      if (parsed) return parsed;
      // Intento con la copia de seguridad
      const backupRaw = U.storage.get(BACKUP_KEY);
      const backup = Storage._parse(backupRaw);
      if (backup) {
        Storage.lastError = 'Se recuperó la copia de seguridad porque los datos principales estaban dañados.';
        return backup;
      }
      if (raw) Storage.lastError = 'Los datos guardados estaban dañados y no se pudieron recuperar.';
      return null;
    },

    _parse: function (raw) {
      if (!raw) return null;
      let data;
      try { data = JSON.parse(raw); } catch (e) { return null; }
      if (!data || typeof data !== 'object' || !data.profiles) return null;
      return Storage.migrate(data);
    },

    /** Guarda el estado. Antes copia el anterior a la clave de respaldo. */
    save: function (state) {
      if (!state || typeof state !== 'object') return false;
      try {
        const previous = U.storage.get(KEY);
        if (previous) U.storage.set(BACKUP_KEY, previous);
        const payload = JSON.stringify(state);
        const ok = U.storage.set(KEY, payload);
        if (!ok) {
          Storage.lastError = 'No se pudo guardar el progreso. El almacenamiento del navegador está lleno o bloqueado.';
        } else {
          Storage.lastError = null;
        }
        return ok;
      } catch (e) {
        Storage.lastError = 'No se pudo guardar el progreso: ' + (e && e.message ? e.message : 'error desconocido');
        return false;
      }
    },

    /** Ajusta datos antiguos o incompletos al formato actual. */
    migrate: function (data) {
      const out = data;
      out.version = SCHEMA_VERSION;
      out.settings = out.settings || {};
      out.teacher = out.teacher || { pin: '1234' };
      out.profiles = out.profiles || {};
      out.meta = out.meta || { sessions: 0 };
      Object.keys(out.profiles).forEach(function (code) {
        const p = out.profiles[code] || {};
        p.id = p.id || code;
        p.code = p.code || code;
        p.avatar = p.avatar || { character: 'mimo', accessories: [] };
        p.avatar.accessories = p.avatar.accessories || [];
        p.levels = p.levels || {};
        p.skills = p.skills || {};
        p.totals = p.totals || {};
        p.badges = p.badges || [];
        p.chests = p.chests || {};
        p.coins = Number.isFinite(p.coins) ? p.coins : 0;
        p.inventory = p.inventory || { accessories: [], characters: [] };
        p.inventory.accessories = p.inventory.accessories || [];
        p.inventory.characters = p.inventory.characters || [];
        if (p.name === undefined) p.name = '';
        out.profiles[code] = p;
      });
      if (!out.activeProfile || !out.profiles[out.activeProfile]) out.activeProfile = null;
      return out;
    },

    exportText: function (state) {
      return JSON.stringify({
        app: 'mouse-aventura',
        exportedAt: new Date().toISOString(),
        schema: SCHEMA_VERSION,
        data: state
      }, null, 2);
    },

    /** Importa una copia de seguridad. Devuelve {ok, message, state}. */
    importText: function (text) {
      let raw;
      try { raw = JSON.parse(text); } catch (e) { return { ok: false, message: 'El archivo no es un respaldo válido (JSON dañado).' }; }
      const data = raw && raw.data ? raw.data : raw;
      if (!data || typeof data !== 'object' || !data.profiles) {
        return { ok: false, message: 'El archivo no contiene perfiles de Mouse Aventura.' };
      }
      try { return { ok: true, message: 'Respaldo importado.', state: Storage.migrate(data) }; }
      catch (e) { return { ok: false, message: 'El respaldo tiene un formato desconocido.' }; }
    },

    /** Borra TODO el progreso local (solo desde el panel docente, con confirmación). */
    wipeAll: function () {
      U.storage.remove(KEY);
      U.storage.remove(BACKUP_KEY);
    },

    clearBackup: function () { U.storage.remove(BACKUP_KEY); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
