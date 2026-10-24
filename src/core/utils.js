/* =========================================================================
   Mouse Aventura — utilidades compartidas
   Funciona en el navegador y en Node (pruebas) sin tocar el DOM al cargar.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = (MA.Utils = {});

  /* ---------- DOM ---------- */
  U.$ = function (sel, root) { return (root || G.document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || G.document).querySelectorAll(sel)); };

  /**
   * Crea un elemento.
   * U.el('button', { class:'btn', onclick: fn, dataset:{x:1}, text:'Hola' }, [hijo1, hijo2])
   * Atributos especiales: class, text, html, style (objeto o texto), dataset, on* (eventos).
   */
  U.el = function (tag, props, children) {
    const node = G.document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        const val = props[key];
        if (val === null || val === undefined || val === false) return;
        if (key === 'class' || key === 'className') node.className = val;
        else if (key === 'text') node.textContent = val;
        else if (key === 'html') node.innerHTML = val;
        else if (key === 'dataset') Object.keys(val).forEach(function (k) { node.dataset[k] = val[k]; });
        else if (key === 'style' && typeof val === 'object') Object.keys(val).forEach(function (k) { node.style.setProperty(k, val[k]); });
        else if (key === 'style') node.setAttribute('style', val);
        else if (key.slice(0, 2) === 'on' && typeof val === 'function') node.addEventListener(key.slice(2).toLowerCase(), val);
        else if (val === true) node.setAttribute(key, '');
        else node.setAttribute(key, val);
      });
    }
    U.append(node, children);
    return node;
  };

  U.append = function (node, children) {
    if (children === null || children === undefined) return node;
    const list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === 'string' || typeof child === 'number'
        ? G.document.createTextNode(String(child)) : child);
    });
    return node;
  };

  U.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; };
  U.remove = function (node) { if (node && node.parentNode) node.parentNode.removeChild(node); };

  U.announce = function (message) {
    const live = G.document && G.document.getElementById('sr-live');
    if (live) live.textContent = message;
  };

  U.show = function (node, visible) { if (node) node.hidden = !visible; };

  /* ---------- Matemáticas ---------- */
  U.clamp = function (v, min, max) { return v < min ? min : v > max ? max : v; };
  U.clamp01 = function (v) { return U.clamp(v, 0, 1); };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.round = function (v, decimals) { const f = Math.pow(10, decimals || 0); return Math.round(v * f) / f; };
  U.dist = function (ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); };
  U.distPoint = function (a, b) { return U.dist(a.x, a.y, b.x, b.y); };

  /* ---------- Aleatoriedad reproducible ---------- */
  U.rng = function (seed) {
    let a = (seed >>> 0) || 0x9e3779b9;
    return function () {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  U.shuffle = function (arr, rnd) {
    const r = rnd || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  U.pick = function (arr, rnd) { return arr[Math.floor((rnd || Math.random)() * arr.length)]; };
  U.range = function (n) { const out = []; for (let i = 0; i < n; i++) out.push(i); return out; };
  U.sample = function (arr, n, rnd) { return U.shuffle(arr, rnd).slice(0, n); };

  /* ---------- Formato ---------- */
  U.pad = function (n, len) { let s = String(n); while (s.length < (len || 2)) s = '0' + s; return s; };
  U.fmtClock = function (ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    return Math.floor(total / 60) + ':' + U.pad(total % 60);
  };
  U.fmtDuration = function (ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return s + ' s';
    const m = Math.floor(s / 60), r = s % 60;
    if (m < 60) return m + ' min' + (r ? ' ' + r + ' s' : '');
    const h = Math.floor(m / 60);
    return h + ' h ' + (m % 60) + ' min';
  };
  U.fmtDate = function (ts) {
    const d = new Date(ts || Date.now());
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return d.getDate() + ' de ' + months[d.getMonth()] + ' de ' + d.getFullYear();
  };
  U.fmtNumber = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  U.esc = function (str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  U.slug = function (str) {
    return String(str).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };
  U.uid = function (prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
  };
  U.debounce = function (fn, wait) {
    let t = null;
    return function () {
      const args = arguments, self = this;
      if (t) G.clearTimeout(t);
      t = G.setTimeout(function () { t = null; fn.apply(self, args); }, wait);
    };
  };
  U.sleep = function (ms) { return new Promise(function (resolve) { G.setTimeout(resolve, ms); }); };

  /* ---------- Geometría ---------- */
  U.pointInRect = function (x, y, r) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
  U.rectCenter = function (r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  U.rectFromEl = function (el) { const r = el.getBoundingClientRect(); return r; };
  U.distanceToSegment = function (px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = U.clamp(t, 0, 1);
    return U.dist(px, py, ax + t * dx, ay + t * dy);
  };

  /* ---------- Almacenamiento seguro ---------- */
  U.storage = {
    available: function () {
      try {
        const k = '__ma_test__';
        G.localStorage.setItem(k, '1');
        G.localStorage.removeItem(k);
        return true;
      } catch (e) { return false; }
    },
    get: function (key) {
      try { return G.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { G.localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    remove: function (key) { try { G.localStorage.removeItem(key); return true; } catch (e) { return false; } }
  };

  /* ---------- Tiempo ---------- */
  U.now = function () { return Date.now(); };
  U.dayKey = function (ts) {
    const d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate());
  };

  MA.PLATFORM = {
    isNode: typeof G.window === 'undefined',
    prefersReducedMotion: function () {
      try { return !!(G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
