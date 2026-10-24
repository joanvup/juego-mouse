/* =========================================================================
   Mouse Aventura — estado de la aplicación y guardado automático
   Un solo computador, varios perfiles de estudiante y un PIN docente básico.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  const DEFAULT_SETTINGS = {
    music: 0.45, sfx: 0.7, muted: false, musicOn: true,
    reduceMotion: false, biggerTargets: false, highContrast: false, autoHints: true
  };

  function hashPin(pin) {
    return 'h' + U.hash('mouse-aventura::' + String(pin));
  }

  function defaultData() {
    return {
      version: 1,
      createdAt: U.now(),
      activeProfile: null,
      settings: Object.assign({}, DEFAULT_SETTINGS),
      teacher: { pinHash: hashPin('9513'), pinChanged: false },
      profiles: {},
      meta: { sessions: 0, lastSaved: 0 }
    };
  }

  const Store = (MA.Store = {
    data: null,
    listeners: {},
    saveTimer: null,
    saveError: null,

    init: function () {
      const loaded = MA.Storage.load();
      const data = loaded || defaultData();
      data.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
      data.teacher = data.teacher || { pinHash: hashPin('9513'), pinChanged: false };
      if (!data.teacher.pinHash) data.teacher.pinHash = hashPin(data.teacher.pin || '9513');
      data.meta = data.meta || { sessions: 0 };
      data.meta.sessions = (data.meta.sessions || 0) + 1;
      if (MA.PLATFORM.prefersReducedMotion() && !loaded) data.settings.reduceMotion = true;
      if (!data.profiles) data.profiles = {};
      if (data.activeProfile && !data.profiles[data.activeProfile]) data.activeProfile = null;
      Store.data = data;
      Store.saveNow();
      Store.applyAudio();
      return data;
    },

    /* ---------- eventos ---------- */
    on: function (evt, fn) {
      (Store.listeners[evt] = Store.listeners[evt] || []).push(fn);
      return function () { Store.off(evt, fn); };
    },
    off: function (evt, fn) {
      Store.listeners[evt] = (Store.listeners[evt] || []).filter(function (f) { return f !== fn; });
    },
    emit: function (evt, payload) {
      (Store.listeners[evt] || []).forEach(function (fn) {
        try { fn(payload); } catch (e) { /* nunca romper la partida por un listener */ }
      });
    },

    /* ---------- guardado ---------- */
    scheduleSave: function () {
      if (Store.saveTimer) G.clearTimeout(Store.saveTimer);
      Store.saveTimer = G.setTimeout(function () { Store.saveTimer = null; Store.saveNow(); }, 250);
    },

    saveNow: function () {
      if (!Store.data) return false;
      Store.data.meta = Store.data.meta || {};
      Store.data.meta.lastSaved = U.now();
      const ok = MA.Storage.save(Store.data);
      Store.saveError = ok ? null : MA.Storage.lastError;
      if (!ok) Store.emit('save-error', Store.saveError);
      Store.emit('saved', Store.data.meta.lastSaved);
      return ok;
    },

    /* ---------- ajustes ---------- */
    settings: function () { return Store.data.settings; },

    setSettings: function (patch) {
      Store.data.settings = Object.assign({}, Store.data.settings, patch || {});
      Store.applyAudio();
      Store.scheduleSave();
      Store.emit('change', { type: 'settings' });
      return Store.data.settings;
    },

    applyAudio: function () {
      const s = Store.data && Store.data.settings;
      if (!s || !MA.Audio) return;
      MA.Audio.applySettings(s);
      if (s.musicOn && !s.muted) {
        if (MA.Audio.ready) MA.Audio.startMusic();
      } else {
        MA.Audio.stopMusic();
      }
    },

    /* ---------- perfiles ---------- */
    profiles: function () {
      const list = Store.data.profiles || {};
      return Object.keys(list).map(function (k) { return list[k]; }).sort(function (a, b) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    },

    profile: function (code) {
      if (code) return Store.data.profiles[code] || null;
      return Store.data.activeProfile ? Store.data.profiles[Store.data.activeProfile] : null;
    },

    activeProfile: function () { return Store.profile(); },

    nextCode: function () {
      let i = 1;
      while (Store.data.profiles['EXP-' + U.pad(i, 3)]) i++;
      return 'EXP-' + U.pad(i, 3);
    },

    normalizeCode: function (code) {
      return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '').slice(0, 16);
    },

    createProfile: function (opts) {
      const o = opts || {};
      let code = Store.normalizeCode(o.code) || Store.nextCode();
      let base = code;
      let n = 2;
      while (Store.data.profiles[code]) { code = base + '-' + n; n++; }
      const profile = MA.Progress.newProfile({
        code: code,
        name: String(o.name || '').trim().slice(0, 24),
        character: o.character || 'mimo'
      });
      Store.data.profiles[code] = profile;
      if (!Store.data.activeProfile) Store.data.activeProfile = code;
      Store.scheduleSave();
      Store.emit('change', { type: 'profile-created', code: code });
      return profile;
    },

    setActiveProfile: function (code) {
      if (!Store.data.profiles[code]) return false;
      Store.data.activeProfile = code;
      Store.scheduleSave();
      Store.emit('change', { type: 'profile-selected', code: code });
      return true;
    },

    removeProfile: function (code) {
      if (!Store.data.profiles[code]) return false;
      delete Store.data.profiles[code];
      if (Store.data.activeProfile === code) {
        const rest = Object.keys(Store.data.profiles);
        Store.data.activeProfile = rest.length ? rest[0] : null;
      }
      Store.scheduleSave();
      Store.emit('change', { type: 'profile-removed', code: code });
      return true;
    },

    /* ---------- partida ---------- */
    startLevel: function (levelId) {
      const p = Store.profile();
      if (!p) return null;
      const rec = MA.Progress.startLevel(p, levelId, U.now());
      p.totals.sessions = p.totals.sessions || 0;
      Store.scheduleSave();
      Store.emit('change', { type: 'level-started', levelId: levelId });
      return rec;
    },

    finishLevel: function (level, result) {
      const p = Store.profile();
      if (!p) return null;
      const summary = MA.Progress.award(p, level, result, U.now());
      Store.scheduleSave();
      Store.emit('change', { type: 'level-completed', levelId: level.id, summary: summary });
      return summary;
    },

    abandonLevel: function (levelId, elapsedMs, metrics) {
      const p = Store.profile();
      if (!p) return null;
      const rec = MA.Progress.abandonLevel(p, levelId, elapsedMs, metrics, U.now());
      Store.scheduleSave();
      Store.emit('change', { type: 'level-abandoned', levelId: levelId });
      return rec;
    },

    /* ---------- avatar y accesorios ---------- */
    selectCharacter: function (characterId) {
      const p = Store.profile();
      if (!p) return false;
      const ok = MA.Progress.selectCharacter(p, characterId);
      if (ok) { Store.scheduleSave(); Store.emit('change', { type: 'avatar' }); }
      return ok;
    },

    buyAccessory: function (accessoryId) {
      const p = Store.profile();
      if (!p) return { ok: false, reason: 'sin-perfil' };
      const res = MA.Progress.buyAccessory(p, accessoryId);
      if (res.ok) {
        MA.Progress.equipAccessory(p, accessoryId, true);
        Store.scheduleSave();
        Store.emit('change', { type: 'purchase', accessory: accessoryId });
      }
      return res;
    },

    equipAccessory: function (accessoryId, equip) {
      const p = Store.profile();
      if (!p) return false;
      const ok = MA.Progress.equipAccessory(p, accessoryId, equip);
      if (ok) { Store.scheduleSave(); Store.emit('change', { type: 'avatar' }); }
      return ok;
    },

    /* ---------- docente ---------- */
    checkPin: function (pin) {
      return !!pin && hashPin(pin) === Store.data.teacher.pinHash;
    },

    setPin: function (pin) {
      const clean = String(pin || '').replace(/\D/g, '').slice(0, 6);
      if (clean.length < 4) return { ok: false, message: 'El PIN debe tener al menos 4 números.' };
      Store.data.teacher.pinHash = hashPin(clean);
      Store.data.teacher.pinChanged = true;
      Store.scheduleSave();
      return { ok: true, message: 'PIN actualizado.' };
    },

    pinIsDefault: function () { return !Store.data.teacher.pinChanged; },

    resetProfile: function (code, keepAvatar) {
      const p = Store.data.profiles[code];
      if (!p) return false;
      const fresh = MA.Progress.newProfile({
        code: code,
        name: p.name,
        character: keepAvatar ? (p.avatar && p.avatar.character) : 'mimo'
      });
      fresh.createdAt = p.createdAt;
      Store.data.profiles[code] = fresh;
      Store.scheduleSave();
      Store.emit('change', { type: 'profile-reset', code: code });
      return true;
    },

    resetAll: function () {
      Store.data = defaultData();
      Store.data.meta.sessions = 1;
      Store.saveNow();
      Store.emit('change', { type: 'all-reset' });
      return true;
    },

    /* ---------- respaldo ---------- */
    exportText: function () {
      return MA.Storage.exportText(Store.data);
    },

    importText: function (text) {
      const res = MA.Storage.importText(text);
      if (!res.ok) return res;
      Store.data = MA.Storage.migrate(res.state);
      Store.saveNow();
      Store.emit('change', { type: 'imported' });
      return res;
    },

    /* ---------- reportes ---------- */
    studentsSummary: function () {
      return Store.profiles().map(function (p) {
        const completed = MA.Progress.completedCount(p);
        const stars = MA.Progress.totalStars(p);
        const worlds = MA.Progress.completedWorlds(p);
        const correct = (p.totals && p.totals.correctClicks) || 0;
        const wrong = (p.totals && p.totals.wrongClicks) || 0;
        return {
          code: p.code,
          name: p.name || '',
          character: (p.avatar && p.avatar.character) || 'mimo',
          completed: completed,
          total: MA.Levels.count(),
          pct: Math.round(completed / Math.max(1, MA.Levels.count()) * 100),
          stars: stars,
          worlds: worlds.length,
          timeMs: (p.totals && p.totals.timeMs) || 0,
          correct: correct,
          wrong: wrong,
          accuracy: correct + wrong > 0 ? Math.round(correct / (correct + wrong) * 100) : null,
          hints: (p.totals && p.totals.hints) || 0,
          lastPlayed: p.updatedAt || p.createdAt,
          coins: p.coins || 0,
          badges: p.badges || []
        };
      });
    },

    studentDetail: function (code) {
      const p = Store.data.profiles[code];
      if (!p) return null;
      const levels = MA.Levels.all().map(function (lv) {
        const r = MA.Progress.record(p, lv.id) || {};
        return {
          id: lv.id, world: lv.world, index: lv.index, name: lv.name,
          skill: lv.skill, skillName: MA.Skills.get(lv.skill).name,
          completed: !!r.completed, stars: r.stars || 0, plays: r.plays || 0,
          wins: r.wins || 0, abandoned: r.abandoned || 0, hints: r.hints || 0,
          timeMs: r.timeMs || 0, correct: r.correct || 0, wrong: r.wrong || 0,
          precision: r.precisionCount ? Math.round(r.precisionSum / r.precisionCount * 100) : null,
          lastPlayed: r.lastPlayed || 0
        };
      });
      return {
        profile: p,
        levels: levels,
        worlds: MA.Worlds.list.map(function (w) { return MA.Progress.worldStats(p, w.id); }),
        skills: MA.Progress.skillRecords(p),
        recommendations: MA.Progress.recommendations(p, 6)
      };
    },

    hardestLevels: function () {
      const agg = {};
      Store.profiles().forEach(function (p) {
        Object.keys(p.levels || {}).forEach(function (id) {
          const r = p.levels[id];
          if (!r || !r.plays) return;
          const a = agg[id] || (agg[id] = { id: id, plays: 0, wrong: 0, hints: 0, abandoned: 0, starsSum: 0, wins: 0 });
          a.plays += r.plays || 0;
          a.wrong += r.wrong || 0;
          a.hints += r.hints || 0;
          a.abandoned += r.abandoned || 0;
          a.wins += r.wins || 0;
          a.starsSum += (r.stars || 0) * Math.max(1, r.wins || 1);
        });
      });
      const rows = Object.keys(agg).map(function (id) {
        const a = agg[id];
        const lv = MA.Levels.get(id);
        const difficulty = (a.wrong + a.hints * 1.5 + a.abandoned * 2) / Math.max(1, a.plays);
        return Object.assign({}, a, {
          name: lv ? lv.name : id,
          world: lv ? lv.world : 0,
          worldName: lv ? lv.worldName : '',
          skillName: lv ? MA.Skills.get(lv.skill).name : '',
          difficulty: Math.round(difficulty * 10) / 10
        });
      }).sort(function (a, b) { return b.difficulty - a.difficulty; });
      return rows;
    },

    classSummary: function () {
      const students = Store.studentsSummary();
      const totalCompleted = students.reduce(function (s, st) { return s + st.completed; }, 0);
      const withAccuracy = students.filter(function (s) { return s.accuracy !== null; });
      return {
        students: students.length,
        completed: totalCompleted,
        avgCompleted: students.length ? Math.round(totalCompleted / students.length) : 0,
        avgAccuracy: withAccuracy.length
          ? Math.round(withAccuracy.reduce(function (s, st) { return s + st.accuracy; }, 0) / withAccuracy.length) : null,
        stars: students.reduce(function (s, st) { return s + st.stars; }, 0),
        timeMs: students.reduce(function (s, st) { return s + st.timeMs; }, 0),
        hardest: Store.hardestLevels().slice(0, 5)
      };
    }
  });

  Store.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
})(typeof window !== 'undefined' ? window : globalThis);
