/* =========================================================================
   Mouse Aventura — progresión, recompensas y habilidades
   Lógica pura (sin DOM) para poder probarla de forma automática.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  function emptyLevelRecord() {
    return {
      completed: false, stars: 0, best: 0, plays: 0, wins: 0, abandoned: 0,
      timeMs: 0, hints: 0, precisionSum: 0, precisionCount: 0,
      correct: 0, wrong: 0, lastPlayed: 0
    };
  }

  function emptySkillRecord() {
    return { plays: 0, starsSum: 0, precisionSum: 0, precisionCount: 0, levels: {}, lastPlayed: 0 };
  }

  function ensureProfile(p) {
    p = p || {};
    p.levels = p.levels || {};
    p.skills = p.skills || {};
    p.totals = p.totals || {};
    p.badges = p.badges || [];
    p.chests = p.chests || {};
    p.coins = Number.isFinite(p.coins) ? p.coins : 0;
    p.inventory = p.inventory || { accessories: [], characters: [] };
    p.avatar = p.avatar || { character: 'mimo', accessories: [] };
    p.avatar.accessories = p.avatar.accessories || [];
    p.totals = Object.assign({
      timeMs: 0, correctClicks: 0, wrongClicks: 0, dragsOk: 0, dragsWrong: 0,
      deviations: 0, hints: 0, targets: 0, wins: 0, sessions: 0, plays: 0
    }, p.totals);
    return p;
  }

  const Progress = (MA.Progress = {
    emptyLevelRecord: emptyLevelRecord,
    emptySkillRecord: emptySkillRecord,
    ensureProfile: ensureProfile,

    newProfile: function (opts) {
      const o = opts || {};
      const now = U.now();
      return ensureProfile({
        id: o.code,
        code: o.code,
        name: o.name || '',
        createdAt: now,
        updatedAt: now,
        avatar: { character: o.character || 'mimo', accessories: [] },
        coins: 0,
        badges: [],
        chests: {},
        levels: {},
        skills: {},
        inventory: { accessories: [], characters: [] },
        lastLevel: 'w1l1',
        totals: { timeMs: 0, correctClicks: 0, wrongClicks: 0, dragsOk: 0, dragsWrong: 0, deviations: 0, hints: 0, targets: 0, wins: 0, sessions: 0, plays: 0 }
      });
    },

    record: function (profile, levelId) {
      return (profile && profile.levels && profile.levels[levelId]) || null;
    },

    isCompleted: function (profile, levelId) {
      const r = Progress.record(profile, levelId);
      return !!(r && r.completed);
    },

    starsFor: function (profile, levelId) {
      const r = Progress.record(profile, levelId);
      return r ? (r.stars || 0) : 0;
    },

    completedCount: function (profile) {
      if (!profile || !profile.levels) return 0;
      return Object.keys(profile.levels).filter(function (k) { return profile.levels[k].completed; }).length;
    },

    totalStars: function (profile) {
      if (!profile || !profile.levels) return 0;
      return Object.keys(profile.levels).reduce(function (sum, k) {
        return sum + (profile.levels[k].completed ? (profile.levels[k].stars || 0) : 0);
      }, 0);
    },

    maxStars: function () { return 300; },

    progressPercent: function (profile) {
      return Math.round(Progress.completedCount(profile) / Math.max(1, MA.Levels.count()) * 100);
    },

    /** Estado de desbloqueo lineal: se abre el siguiente al completar el anterior. */
    levelStatus: function (profile, level) {
      const rec = Progress.record(profile, level.id);
      if (rec && rec.completed) return { status: 'completed', stars: rec.stars || 0, record: rec };
      const index = MA.Levels.indexOf(level.id);
      if (index <= 0) return { status: 'available', stars: 0, record: rec };
      const prev = MA.Levels.list[index - 1];
      const prevDone = prev && Progress.isCompleted(profile, prev.id);
      return { status: prevDone ? 'available' : 'locked', stars: 0, record: rec };
    },

    isUnlocked: function (profile, level) { return Progress.levelStatus(profile, level).status !== 'locked'; },

    nextPlayable: function (profile) {
      const list = MA.Levels.all();
      for (let i = 0; i < list.length; i++) {
        const st = Progress.levelStatus(profile, list[i]);
        if (st.status === 'available') return list[i];
        if (st.status === 'locked') return null;
      }
      return null;
    },

    lastPlayedLevel: function (profile) {
      if (!profile) return null;
      if (profile.lastLevel && MA.Levels.get(profile.lastLevel)) return MA.Levels.get(profile.lastLevel);
      return MA.Levels.first();
    },

    worldStats: function (profile, worldId) {
      const levels = MA.Levels.byWorld(worldId);
      let completed = 0, stars = 0, plays = 0, timeMs = 0;
      levels.forEach(function (lv) {
        const r = Progress.record(profile, lv.id);
        if (r) {
          plays += r.plays || 0;
          timeMs += r.timeMs || 0;
          if (r.completed) { completed++; stars += r.stars || 0; }
        }
      });
      const total = levels.length;
      return {
        world: worldId, completed: completed, total: total, stars: stars,
        maxStars: total * 3, plays: plays, timeMs: timeMs,
        pct: total ? Math.round(completed / total * 100) : 0,
        done: completed === total && total > 0
      };
    },

    worldCompleted: function (profile, worldId) {
      return Progress.worldStats(profile, worldId).done;
    },

    completedWorlds: function (profile) {
      const out = [];
      for (let w = 1; w <= MA.Worlds.count; w++) if (Progress.worldCompleted(profile, w)) out.push(w);
      return out;
    },

    unlockedCharacters: function (profile) {
      const worlds = Progress.completedWorlds(profile);
      return MA.Avatars.characters.filter(function (ch) {
        return MA.Avatars.isCharacterUnlocked(ch.id, worlds);
      }).map(function (ch) { return ch.id; });
    },

    totalTime: function (profile) {
      return (profile && profile.totals && profile.totals.timeMs) || 0;
    },

    /** Motivo corto para sugerir refuerzo. */
    skillState: function (profile, skillId) {
      const rec = profile && profile.skills ? profile.skills[skillId] : null;
      if (!rec || !rec.plays) return 'none';
      const distinct = Object.keys(rec.levels || {}).length;
      const avgStars = rec.starsSum / Math.max(1, rec.plays);
      if (distinct >= 5 && avgStars >= 2.4) return 'mastered';
      if (distinct >= 3 && avgStars >= 2.0) return 'achieved';
      if (distinct >= 2) return 'practice';
      return 'learning';
    },

    skillRecords: function (profile) {
      return MA.Skills.list().map(function (id) {
        const rec = (profile && profile.skills && profile.skills[id]) || null;
        const info = MA.Skills.get(id);
        const state = Progress.skillState(profile, id);
        return {
          id: id, name: info.name, emoji: info.emoji, kid: info.kid, tip: info.tip,
          state: state, stateInfo: MA.Skills.state(state),
          plays: rec ? rec.plays : 0,
          levels: rec ? Object.keys(rec.levels || {}).length : 0,
          avgStars: rec && rec.plays ? rec.starsSum / rec.plays : 0,
          avgPrecision: rec && rec.precisionCount ? rec.precisionSum / rec.precisionCount : null
        };
      });
    },

    /** Habilidades que necesitan refuerzo y niveles recomendados. */
    recommendations: function (profile, limit) {
      const max = limit || 4;
      const skills = Progress.skillRecords(profile).filter(function (s) {
        return s.plays > 0 && (s.state === 'learning' || s.state === 'practice');
      });
      const out = [];
      const used = {};
      skills.forEach(function (s) {
        const candidates = MA.Levels.all().filter(function (lv) {
          return lv.skills.indexOf(s.id) >= 0 && Progress.isCompleted(profile, lv.id) && !used[lv.id];
        });
        const pick = candidates.sort(function (a, b) {
          return (Progress.starsFor(profile, a.id) - Progress.starsFor(profile, b.id)) || (a.difficulty - b.difficulty);
        })[0];
        if (pick) {
          used[pick.id] = true;
          out.push({
            levelId: pick.id, level: pick, skillId: s.id, skillName: s.name,
            reason: 'Reforzar «' + s.name + '» en «' + pick.name + '».'
          });
        }
      });
      if (out.length < max) {
        const next = Progress.nextPlayable(profile);
        if (next && !used[next.id]) out.push({ levelId: next.id, level: next, skillId: next.skill, skillName: MA.Skills.get(next.skill).name, reason: 'Continuar la aventura.' });
      }
      return out.slice(0, max);
    },

    /** Registra el inicio de un nivel (para estadísticas docentes). */
    startLevel: function (profile, levelId, now) {
      ensureProfile(profile);
      const rec = profile.levels[levelId] || (profile.levels[levelId] = emptyLevelRecord());
      rec.plays = (rec.plays || 0) + 1;
      rec.lastPlayed = now || U.now();
      profile.lastLevel = levelId;
      profile.totals.plays = (profile.totals.plays || 0) + 1;
      return rec;
    },

    /** Registra el abandono de un nivel sin castigar ni quitar recompensas. */
    abandonLevel: function (profile, levelId, elapsedMs, metrics, now) {
      ensureProfile(profile);
      const rec = profile.levels[levelId] || (profile.levels[levelId] = emptyLevelRecord());
      rec.abandoned = (rec.abandoned || 0) + 1;
      rec.timeMs = (rec.timeMs || 0) + Math.max(0, elapsedMs || 0);
      rec.lastPlayed = now || U.now();
      if (metrics) {
        rec.correct = (rec.correct || 0) + ((metrics.clicks && metrics.clicks.correct) || 0);
        rec.wrong = (rec.wrong || 0) + ((metrics.clicks && metrics.clicks.wrong) || 0);
      }
      profile.totals.timeMs += Math.max(0, elapsedMs || 0);
      return rec;
    },

    /**
     * Otorga recompensas por completar un nivel.
     * - Primera vez: monedas completas del nivel.
     * - Repetición: solo monedas si mejora las estrellas (no se duplican).
     * - Insignia y cofre una sola vez por mundo.
     */
    award: function (profile, level, result, now) {
      ensureProfile(profile);
      const ts = now || U.now();
      const rec = profile.levels[level.id] || (profile.levels[level.id] = emptyLevelRecord());
      const first = !rec.completed;
      const prevStars = rec.stars || 0;
      const stars = Math.max(prevStars, result.stars || 1);
      const improved = stars > prevStars;

      rec.completed = true;
      rec.wins = (rec.wins || 0) + 1;
      rec.stars = stars;
      rec.best = Math.max(rec.best || 0, result.score || 0);
      rec.timeMs = (rec.timeMs || 0) + Math.max(0, result.timeMs || 0);
      rec.hints = (rec.hints || 0) + Math.max(0, result.hints || 0);
      rec.lastPlayed = ts;
      if (result.precision !== null && result.precision !== undefined) {
        rec.precisionSum = (rec.precisionSum || 0) + result.precision;
        rec.precisionCount = (rec.precisionCount || 0) + 1;
      }
      const m = result.metrics || {};
      rec.correct = (rec.correct || 0) + ((m.clicks && m.clicks.correct) || 0);
      rec.wrong = (rec.wrong || 0) + ((m.clicks && m.clicks.wrong) || 0);

      let coins = 0;
      if (first) coins += (level.rewards && level.rewards.coins) || 15;
      else if (improved) coins += (stars - prevStars) * 4;

      profile.totals.wins = (profile.totals.wins || 0) + 1;
      profile.totals.timeMs = (profile.totals.timeMs || 0) + Math.max(0, result.timeMs || 0);
      profile.totals.correctClicks = (profile.totals.correctClicks || 0) + ((m.clicks && m.clicks.correct) || 0);
      profile.totals.wrongClicks = (profile.totals.wrongClicks || 0) + ((m.clicks && m.clicks.wrong) || 0);
      profile.totals.dragsOk = (profile.totals.dragsOk || 0) + ((m.drags && m.drags.ok) || 0);
      profile.totals.dragsWrong = (profile.totals.dragsWrong || 0) + ((m.drags && m.drags.wrong) || 0);
      profile.totals.deviations = (profile.totals.deviations || 0) + (m.deviations || 0);
      profile.totals.hints = (profile.totals.hints || 0) + (result.hints || 0);
      profile.totals.targets = (profile.totals.targets || 0) + ((m.targets && m.targets.done) || 0);

      /* Habilidades */
      const skillUps = [];
      level.skills.forEach(function (skillId) {
        const before = Progress.skillState(profile, skillId);
        const srec = profile.skills[skillId] || (profile.skills[skillId] = emptySkillRecord());
        srec.plays = (srec.plays || 0) + 1;
        srec.starsSum = (srec.starsSum || 0) + stars;
        if (result.precision !== null && result.precision !== undefined) {
          srec.precisionSum = (srec.precisionSum || 0) + result.precision;
          srec.precisionCount = (srec.precisionCount || 0) + 1;
        }
        srec.levels = srec.levels || {};
        srec.levels[level.id] = Math.max(srec.levels[level.id] || 0, stars);
        srec.lastPlayed = ts;
        const after = Progress.skillState(profile, skillId);
        if (MA.Skills.stateIndex(after) > MA.Skills.stateIndex(before)) {
          skillUps.push({ id: skillId, name: MA.Skills.get(skillId).name, state: after });
        }
      });

      /* Insignia de mundo y cofre */
      let badge = null;
      let chestCoins = 0;
      const worldDone = Progress.worldCompleted(profile, level.world);
      if (worldDone) {
        const w = MA.Worlds.get(level.world);
        if (w && w.badge && profile.badges.indexOf(w.badge.id) < 0) {
          profile.badges.push(w.badge.id);
          badge = w.badge;
          if (!profile.chests['w' + level.world]) {
            profile.chests['w' + level.world] = true;
            chestCoins = 40;
            coins += chestCoins;
          }
        }
      }

      profile.coins = (profile.coins || 0) + coins;
      profile.lastLevel = level.id;
      profile.updatedAt = ts;

      const next = MA.Levels.next(level.id);
      return {
        first: first,
        stars: stars,
        prevStars: prevStars,
        improved: improved,
        coins: coins,
        chestCoins: chestCoins,
        badge: badge,
        skillUps: skillUps,
        worldCompleted: worldDone,
        unlockedLevel: next ? next.id : null,
        graduation: !!level.graduation && first
      };
    },

    /** Compra un accesorio con monedas virtuales (sin dinero real). */
    buyAccessory: function (profile, accessoryId) {
      ensureProfile(profile);
      const acc = MA.Avatars.accessory(accessoryId);
      if (!acc) return { ok: false, reason: 'no-existe' };
      if (profile.inventory.accessories.indexOf(accessoryId) >= 0) return { ok: false, reason: 'ya-lo-tiene' };
      if ((profile.coins || 0) < acc.price) return { ok: false, reason: 'sin-monedas', missing: acc.price - profile.coins };
      profile.coins -= acc.price;
      profile.inventory.accessories.push(accessoryId);
      return { ok: true, accessory: acc, coins: profile.coins };
    },

    equipAccessory: function (profile, accessoryId, equip) {
      ensureProfile(profile);
      const owned = profile.inventory.accessories;
      if (owned.indexOf(accessoryId) < 0) return false;
      const list = profile.avatar.accessories.filter(function (id) { return id !== accessoryId; });
      if (equip) list.push(accessoryId);
      profile.avatar.accessories = list;
      return true;
    },

    selectCharacter: function (profile, characterId) {
      ensureProfile(profile);
      if (Progress.unlockedCharacters(profile).indexOf(characterId) < 0) return false;
      profile.avatar.character = characterId;
      return true;
    },

    /** Datos del diploma final. */
    diploma: function (profile) {
      ensureProfile(profile);
      const final = MA.Levels.get('w10l10');
      const completed = final ? Progress.isCompleted(profile, final.id) : false;
      return {
        completed: completed,
        name: profile.name || profile.code,
        code: profile.code,
        date: U.now(),
        stars: Progress.totalStars(profile),
        completedLevels: Progress.completedCount(profile),
        worlds: Progress.completedWorlds(profile).length,
        badges: profile.badges.slice(),
        skills: Progress.skillRecords(profile).filter(function (s) { return s.state !== 'none'; })
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
