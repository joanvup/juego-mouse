/* =========================================================================
   Mouse Aventura — sonido
   Sonidos generados con Web Audio API (sin archivos externos).
   Volumen independiente para música y efectos, y silencio total.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});

  const Audio = (MA.Audio = {
    ctx: null,
    master: null,
    musicBus: null,
    sfxBus: null,
    settings: { music: 0.45, sfx: 0.7, muted: false },
    ready: false,
    musicTimer: null,
    musicStep: 0,
    musicOn: false,
    failed: false,

    /** Debe llamarse tras el primer gesto del usuario (política de autoplay). */
    init: function (settings) {
      if (settings) Audio.applySettings(settings);
      if (Audio.ctx || Audio.failed) return Audio.ctx;
      try {
        const Ctx = G.AudioContext || G.webkitAudioContext;
        if (!Ctx) { Audio.failed = true; return null; }
        Audio.ctx = new Ctx();
        Audio.master = Audio.ctx.createGain();
        Audio.master.gain.value = 1;
        Audio.master.connect(Audio.ctx.destination);
        Audio.musicBus = Audio.ctx.createGain();
        Audio.musicBus.gain.value = 0;
        Audio.musicBus.connect(Audio.master);
        Audio.sfxBus = Audio.ctx.createGain();
        Audio.sfxBus.gain.value = 0.7;
        Audio.sfxBus.connect(Audio.master);
        Audio.ready = true;
        Audio.applySettings(Audio.settings);
        return Audio.ctx;
      } catch (e) {
        Audio.failed = true;
        return null;
      }
    },

    applySettings: function (settings) {
      if (!settings) return;
      Audio.settings.muted = !!settings.muted;
      Audio.settings.music = typeof settings.music === 'number' ? settings.music : Audio.settings.music;
      Audio.settings.sfx = typeof settings.sfx === 'number' ? settings.sfx : Audio.settings.sfx;
      if (!Audio.ready) return;
      const now = Audio.ctx.currentTime;
      const sfx = Audio.settings.muted ? 0 : Audio.settings.sfx;
      Audio.sfxBus.gain.setTargetAtTime(sfx * 0.85, now, 0.05);
      const music = Audio.settings.muted ? 0 : Audio.settings.music;
      Audio.musicBus.gain.setTargetAtTime(Audio.musicOn ? music * 0.16 : 0, now, 0.2);
      if (Audio.musicOn && Audio.settings.muted) Audio.stopMusic();
      else if (Audio.musicOn && !Audio.settings.muted && !Audio.musicTimer) Audio._scheduleMusic();
    },

    resume: function () {
      if (Audio.ctx && Audio.ctx.state === 'suspended') Audio.ctx.resume().catch(function () {});
    },

    /** Tono simple con envolvente suave. */
    tone: function (opts) {
      if (!Audio.ready || Audio.settings.muted || Audio.failed) return;
      try {
        const ctx = Audio.ctx;
        const t0 = ctx.currentTime + (opts.delay || 0);
        const dur = opts.duration || 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = opts.type || 'sine';
        osc.frequency.setValueAtTime(opts.freq, t0);
        if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.freqEnd), t0 + dur);
        const vol = (opts.volume === undefined ? 0.35 : opts.volume);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.min(0.03, dur * 0.3));
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain);
        gain.connect(Audio.sfxBus);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      } catch (e) { /* el audio nunca debe romper el juego */ }
    },

    /** Sonidos con nombre. Todos suaves, sin alarmas. */
    play: function (name) {
      if (!Audio.ready && !Audio.init()) return;
      if (Audio.settings.muted) return;
      switch (name) {
        case 'click':
          Audio.tone({ freq: 620, freqEnd: 760, duration: 0.09, volume: 0.18, type: 'triangle' });
          break;
        case 'hover':
          Audio.tone({ freq: 880, duration: 0.05, volume: 0.05, type: 'sine' });
          break;
        case 'pop':
          Audio.tone({ freq: 480, freqEnd: 980, duration: 0.12, volume: 0.25, type: 'sine' });
          break;
        case 'success':
          Audio.tone({ freq: 784, duration: 0.12, volume: 0.22, type: 'triangle' });
          Audio.tone({ freq: 1046, duration: 0.18, volume: 0.2, type: 'triangle', delay: 0.09 });
          break;
        case 'star':
          Audio.tone({ freq: 1046, duration: 0.1, volume: 0.16, type: 'sine' });
          Audio.tone({ freq: 1318, duration: 0.12, volume: 0.14, type: 'sine', delay: 0.07 });
          break;
        case 'wrong':
          Audio.tone({ freq: 300, freqEnd: 220, duration: 0.18, volume: 0.14, type: 'sine' });
          break;
        case 'coin':
          Audio.tone({ freq: 1200, duration: 0.07, volume: 0.14, type: 'square' });
          Audio.tone({ freq: 1600, duration: 0.1, volume: 0.12, type: 'square', delay: 0.06 });
          break;
        case 'plop':
          Audio.tone({ freq: 340, freqEnd: 190, duration: 0.14, volume: 0.22, type: 'triangle' });
          break;
        case 'drag':
          Audio.tone({ freq: 500, duration: 0.06, volume: 0.1, type: 'sine' });
          break;
        case 'wake':
          Audio.tone({ freq: 523, duration: 0.1, volume: 0.16, type: 'sine' });
          Audio.tone({ freq: 659, duration: 0.1, volume: 0.16, type: 'sine', delay: 0.1 });
          Audio.tone({ freq: 784, duration: 0.14, volume: 0.16, type: 'sine', delay: 0.2 });
          break;
        case 'unlock':
          Audio.tone({ freq: 659, duration: 0.14, volume: 0.2, type: 'triangle' });
          Audio.tone({ freq: 784, duration: 0.14, volume: 0.2, type: 'triangle', delay: 0.13 });
          Audio.tone({ freq: 988, duration: 0.2, volume: 0.2, type: 'triangle', delay: 0.26 });
          Audio.tone({ freq: 1318, duration: 0.26, volume: 0.18, type: 'triangle', delay: 0.4 });
          break;
        case 'celebrate':
          [523, 659, 784, 1046, 1318].forEach(function (f, i) {
            Audio.tone({ freq: f, duration: 0.22, volume: 0.18, type: 'triangle', delay: i * 0.11 });
          });
          break;
        case 'whoosh':
          Audio.tone({ freq: 220, freqEnd: 700, duration: 0.25, volume: 0.1, type: 'sine' });
          break;
        case 'wheel':
          Audio.tone({ freq: 700, duration: 0.04, volume: 0.08, type: 'square' });
          break;
        default:
          Audio.tone({ freq: 660, duration: 0.08, volume: 0.12, type: 'sine' });
      }
    },

    startMusic: function () {
      if (!Audio.ready && !Audio.init()) return;
      Audio.musicOn = true;
      if (Audio.musicBus) {
        const target = Audio.settings.muted ? 0 : Audio.settings.music * 0.16;
        Audio.musicBus.gain.setTargetAtTime(target, Audio.ctx.currentTime, 0.4);
      }
      Audio._scheduleMusic();
    },

    stopMusic: function () {
      Audio.musicOn = false;
      if (Audio.musicTimer) { G.clearTimeout(Audio.musicTimer); Audio.musicTimer = null; }
      if (Audio.musicBus && Audio.ctx) Audio.musicBus.gain.setTargetAtTime(0, Audio.ctx.currentTime, 0.2);
    },

    /** Melodía pentatónica muy suave, en bucle, sin percusión fuerte. */
    _scheduleMusic: function () {
      if (!Audio.musicOn || !Audio.ready) return;
      if (Audio.musicTimer) G.clearTimeout(Audio.musicTimer);
      const ctx = Audio.ctx;
      const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
      const pattern = [0, 2, 4, 5, 4, 2, 1, 3, 0, 2, 3, 5, 6, 5, 3, 2];
      const step = Audio.musicStep++;
      const note = scale[pattern[step % pattern.length]];
      try {
        const t0 = ctx.currentTime + 0.02;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1600;
        osc.type = 'sine';
        osc.frequency.value = note;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.85);
        osc.connect(filter); filter.connect(gain); gain.connect(Audio.musicBus);
        osc.start(t0); osc.stop(t0 + 0.9);
        // bajo cada 4 pasos
        if (step % 4 === 0) {
          const bass = ctx.createOscillator();
          const bg = ctx.createGain();
          bass.type = 'sine';
          bass.frequency.value = note / 2;
          bg.gain.setValueAtTime(0.0001, t0);
          bg.gain.exponentialRampToValueAtTime(0.06, t0 + 0.1);
          bg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
          bass.connect(bg); bg.connect(Audio.musicBus);
          bass.start(t0); bass.stop(t0 + 1.3);
        }
      } catch (e) { /* silencio */ }
      Audio.musicTimer = G.setTimeout(Audio._scheduleMusic, 420);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
