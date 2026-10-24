/* =========================================================================
   Mouse Aventura — componentes de interfaz reutilizables
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});
  const U = MA.Utils;

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.5 7 .8-5.2 4.6 1.5 6.9L12 17.3 5.7 20.8l1.5-6.9L2 9.3l7-.8z" fill="currentColor"/></svg>',
    coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm2 0h6V8a3 3 0 0 0-6 0z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 5.5 5.5L20 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.6 9a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4c0-.6-.1-1.2-.2-1.7l2-1.6-2-3.4-2.4 1a9 9 0 0 0-2.9-1.7L14.9 2h-4l-.5 2.6a9 9 0 0 0-2.9 1.7l-2.4-1-2 3.4 2 1.6a9 9 0 0 0 0 3.4l-2 1.6 2 3.4 2.4-1a9 9 0 0 0 2.9 1.7l.5 2.6h4l.5-2.6a9 9 0 0 0 2.9-1.7l2.4 1 2-3.4-2-1.6c.1-.5.2-1.1.2-1.7z" fill="currentColor"/></svg>',
    teacher: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 1 8l11 5 9-4.1V16h2V8zM5 12.6V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-4.4l-7 3.2z" fill="currentColor"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v4H7zM5 8h14a2 2 0 0 1 2 2v7h-4v4H7v-4H3v-7a2 2 0 0 1 2-2zm4 9h6v5H9z" fill="currentColor"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v9l3.5-3.5 1.4 1.4L12 16.8 6.1 9.9l1.4-1.4L11 12zM4 19h16v2H4z" fill="currentColor"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 21h2v-9l3.5 3.5 1.4-1.4L12 7.2 6.1 14.1l1.4 1.4L11 12zM4 3h16v2H4z" fill="currentColor"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.9 5.8H3a9 9 0 1 0 9-9v-2L7 3.5 12 7z" fill="currentColor"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3l5-4v14l-5-4H4zm12.5-1.8a6 6 0 0 1 0 9.6l-1.2-1.6a4 4 0 0 0 0-6.4z" fill="currentColor"/></svg>',
    music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm10-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 4h9v4h-7v9h-2z" fill="currentColor"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5v9H8l7 7 7-7h-5V5z" fill="currentColor"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v3h3v3a4 4 0 0 1-4 4h-.4A6 6 0 0 1 13 17.9V20h3v3H8v-3h3v-2.1A6 6 0 0 1 8.4 14H8a4 4 0 0 1-4-4V7h3zm0 5H6v2a2 2 0 0 0 1 1.7zm10 0v3.7A2 2 0 0 0 18 11V9z" fill="currentColor"/></svg>',
    mouse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7v8a7 7 0 0 1-14 0V9a7 7 0 0 1 7-7zm-1 2.1A5 5 0 0 0 7 9v2h4zm2 0V11h4V9a5 5 0 0 0-4-4.9z" fill="currentColor"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5.6l3.4 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const UI = (MA.UI = {
    icon: function (name) { return ICONS[name] || ''; },

    btn: function (opts) {
      const o = opts || {};
      const b = U.el('button', {
        class: 'btn btn--' + (o.kind || 'primary') + (o.size ? ' btn--' + o.size : '') + (o.block ? ' btn--block' : '') + (o.className ? ' ' + o.className : ''),
        type: 'button',
        'aria-label': o.ariaLabel || null,
        title: o.title || null
      });
      if (o.icon) {
        const icon = U.el('span', { class: 'btn__icon', 'aria-hidden': 'true' });
        icon.innerHTML = UI.icon(o.icon);
        b.appendChild(icon);
      }
      if (o.emoji) b.appendChild(U.el('span', { class: 'btn__emoji', 'aria-hidden': 'true', text: o.emoji }));
      if (o.label) b.appendChild(U.el('span', { class: 'btn__label', text: o.label }));
      if (o.onClick) b.addEventListener('click', o.onClick);
      if (o.disabled) b.disabled = true;
      return b;
    },

    iconBtn: function (opts) {
      const o = opts || {};
      const b = UI.btn({ icon: o.icon, label: '', kind: o.kind || 'soft', className: 'icon-btn', ariaLabel: o.ariaLabel, title: o.title, onClick: o.onClick });
      return b;
    },

    stars: function (n, opts) {
      const o = opts || {};
      const max = o.max || 3;
      const wrap = U.el('div', { class: 'stars' + (o.small ? ' stars--small' : ''), 'aria-label': (n || 0) + ' de ' + max + ' estrellas' });
      for (let i = 0; i < max; i++) {
        const s = U.el('span', { class: 'stars__star' + (i < (n || 0) ? ' is-on' : ''), 'aria-hidden': 'true', text: '⭐' });
        if (i < (n || 0) && o.animate) s.style.animationDelay = (i * 0.16) + 's';
        wrap.appendChild(s);
      }
      return wrap;
    },

    bar: function (pct, opts) {
      const o = opts || {};
      const wrap = U.el('div', { class: 'bar' + (o.className ? ' ' + o.className : ''), role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pct || 0)) });
      const fill = U.el('i', { style: { width: U.clamp(pct || 0, 0, 100) + '%' } });
      if (o.color) fill.style.background = o.color;
      wrap.appendChild(fill);
      if (o.label) wrap.appendChild(U.el('span', { class: 'bar__label', text: o.label }));
      return wrap;
    },

    chip: function (label, emoji, opts) {
      const o = opts || {};
      const c = U.el('span', { class: 'chip' + (o.className ? ' ' + o.className : '') });
      if (emoji) c.appendChild(U.el('span', { class: 'chip__emoji', 'aria-hidden': 'true', text: emoji }));
      c.appendChild(U.el('span', { text: label }));
      return c;
    },

    avatar: function (characterId, accessories, size, mood) {
      const wrap = U.el('div', { class: 'avatar', style: { width: size + 'px', height: Math.round(size * 1.25) + 'px' } });
      wrap.innerHTML = MA.Avatars.svg(characterId, { size: size, accessories: accessories || [], mood: mood || 'idle' });
      return wrap;
    },

    profileAvatar: function (profile, size, mood) {
      profile = profile || {};
      const av = profile.avatar || {};
      return UI.avatar(av.character || 'mimo', av.accessories || [], size, mood);
    },

    profileName: function (profile) {
      if (!profile) return 'Explorador';
      return (profile.name && profile.name.trim()) || profile.code || 'Explorador';
    },

    mouseFigure: function (highlight, opts) {
      const o = opts || {};
      const h = highlight || 'left';
      const label = h === 'right' ? 'botón derecho' : h === 'wheel' ? 'rueda central' : 'botón izquierdo';
      return '' +
        '<svg viewBox="0 0 260 330" class="mouse-figure" role="img" aria-label="Mouse con el ' + label + ' resaltado">' +
        '<ellipse cx="130" cy="312" rx="76" ry="13" fill="#0b2038" opacity=".12"/>' +
        '<g class="mouse-figure__body">' +
        '<rect x="42" y="14" width="176" height="286" rx="86" fill="#f7faff" stroke="#27415e" stroke-width="7"/>' +
        '<path d="M130 16 L130 164" stroke="#27415e" stroke-width="5" opacity=".55"/>' +
        '<path d="M44 164 L216 164" stroke="#27415e" stroke-width="4" opacity=".25"/>' +
        '<path class="mouse-figure__zone mouse-figure__left' + (h === 'left' ? ' is-highlight' : '') + '" d="M52 108 Q52 22 122 20 L122 156 L52 156 Z" fill="' + (h === 'left' ? '#ffd9a8' : '#eaf1fb') + '" stroke="none"/>' +
        '<path class="mouse-figure__zone mouse-figure__right' + (h === 'right' ? ' is-highlight' : '') + '" d="M208 108 Q208 22 138 20 L138 156 L208 156 Z" fill="' + (h === 'right' ? '#ffd9a8' : '#eaf1fb') + '" stroke="none"/>' +
        '<rect class="mouse-figure__zone mouse-figure__wheel' + (h === 'wheel' ? ' is-highlight' : '') + '" x="118" y="38" width="24" height="62" rx="12" fill="' + (h === 'wheel' ? '#ffc233' : '#c9d6e8') + '" stroke="#27415e" stroke-width="3"/>' +
        '<path d="M126 50 L126 84 M134 50 L134 84" stroke="#27415e" stroke-width="2" opacity=".4"/>' +
        (h === 'left' ? '<path d="M86 196 L86 236" stroke="#f0a04b" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 7"/>' : '') +
        (h === 'right' ? '<path d="M174 196 L174 236" stroke="#f0a04b" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 7"/>' : '') +
        (h === 'wheel' ? '<path d="M130 110 L130 150" stroke="#e0a800" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 7"/>' : '') +
        '</g>' +
        '</svg>';
    },

    /**
     * Diálogo modal. cfg: {title, html, content, actions:[{label, kind, onClick, close}],
     * dismissible, className, onClose, wide, icon}
     */
    modal: function (cfg) {
      const c = cfg || {};
      const root = G.document.getElementById('modal-root');
      const previousFocus = G.document.activeElement;
      root.hidden = false;
      root.innerHTML = '';
      const overlay = U.el('div', { class: 'modal-overlay' + (c.className ? ' ' + c.className : '') });
      const card = U.el('div', {
        class: 'modal-card' + (c.wide ? ' modal-card--wide' : '') + (c.narrow ? ' modal-card--narrow' : ''),
        role: 'dialog', 'aria-modal': 'true', 'aria-label': c.title || 'Ventana'
      });
      if (c.title) {
        const head = U.el('div', { class: 'modal-head' });
        if (c.emoji) head.appendChild(U.el('span', { class: 'modal-head__emoji', 'aria-hidden': 'true', text: c.emoji }));
        head.appendChild(U.el('h2', { class: 'modal-title', text: c.title }));
        if (c.dismissible !== false) {
          head.appendChild(UI.btn({ icon: 'close', kind: 'ghost', className: 'modal-close', ariaLabel: 'Cerrar', onClick: function () { close(); } }));
        }
        card.appendChild(head);
      }
      const body = U.el('div', { class: 'modal-body' });
      if (c.html) body.innerHTML = c.html;
      if (c.content) body.appendChild(c.content);
      card.appendChild(body);
      let actionsEl = null;
      if (c.actions && c.actions.length) {
        actionsEl = U.el('div', { class: 'modal-actions' });
        c.actions.forEach(function (a) {
          const btn = UI.btn({
            label: a.label, emoji: a.emoji, kind: a.kind || 'primary', icon: a.icon,
            onClick: function () {
              if (a.close !== false) close();
              if (a.onClick) a.onClick();
            }
          });
          actionsEl.appendChild(btn);
        });
        card.appendChild(actionsEl);
      }
      overlay.appendChild(card);
      root.appendChild(overlay);
      G.requestAnimationFrame(function () { overlay.classList.add('is-open'); });

      function onKey(ev) {
        if (ev.key === 'Escape' && c.dismissible !== false) { ev.preventDefault(); close(); }
        if (ev.key === 'Tab') {
          const focusables = U.$$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', card)
            .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
          if (!focusables.length) return;
          const first = focusables[0], last = focusables[focusables.length - 1];
          if (ev.shiftKey && G.document.activeElement === first) { ev.preventDefault(); last.focus(); }
          else if (!ev.shiftKey && G.document.activeElement === last) { ev.preventDefault(); first.focus(); }
        }
      }
      function close() {
        if (!overlay.parentNode) return;
        G.document.removeEventListener('keydown', onKey);
        overlay.classList.remove('is-open');
        G.setTimeout(function () {
          U.remove(overlay);
          if (!root.children.length) { root.hidden = true; root.innerHTML = ''; }
          if (previousFocus && previousFocus.focus) { try { previousFocus.focus(); } catch (e) {} }
        }, 180);
        if (c.onClose) c.onClose();
      }
      overlay.addEventListener('pointerdown', function (ev) {
        if (ev.target === overlay && c.dismissible !== false) close();
      });
      G.document.addEventListener('keydown', onKey);
      G.setTimeout(function () {
        const target = card.querySelector('button:not([disabled])') || card;
        if (target.focus) target.focus();
      }, 60);
      return { el: card, body: body, actions: actionsEl, close: close, overlay: overlay };
    },

    confirm: function (cfg) {
      return new Promise(function (resolve) {
        UI.modal({
          title: cfg.title || '¿Seguro?',
          html: '<p class="modal-text">' + U.esc(cfg.message || '') + '</p>',
          emoji: cfg.emoji || '❓',
          dismissible: true,
          narrow: true,
          actions: [
            { label: cfg.cancelLabel || 'Cancelar', kind: 'ghost', onClick: function () { resolve(false); } },
            { label: cfg.confirmLabel || 'Sí, continuar', kind: cfg.danger ? 'danger' : 'primary', onClick: function () { resolve(true); } }
          ],
          onClose: function () { resolve(false); }
        });
      });
    },

    toast: function (message) {
      const root = G.document.getElementById('toast-root');
      if (!root) return;
      root.setAttribute('aria-hidden', 'false');
      const el = U.el('div', { class: 'toast', role: 'status' });
      el.innerHTML = '<span class="toast__emoji" aria-hidden="true">✨</span><span>' + U.esc(message) + '</span>';
      root.appendChild(el);
      G.requestAnimationFrame(function () { el.classList.add('is-open'); });
      G.setTimeout(function () {
        el.classList.remove('is-open');
        G.setTimeout(function () {
          U.remove(el);
          if (!root.children.length) root.setAttribute('aria-hidden', 'true');
        }, 320);
      }, 3000);
    },

    sceneClass: function (scene) { return 'scene--' + (scene || 'forest'); },

    sceneDecor: function (world) {
      const decor = (world && world.decor) || ['✨'];
      const wrap = U.el('div', { class: 'scene-decor', 'aria-hidden': 'true' });
      const spots = [
        { x: 4, y: 12, s: 1.5 }, { x: 92, y: 8, s: 1.2 }, { x: 8, y: 78, s: 1.1 },
        { x: 88, y: 72, s: 1.4 }, { x: 50, y: 4, s: 0.9 }, { x: 20, y: 42, s: 0.8 },
        { x: 78, y: 40, s: 0.9 }, { x: 62, y: 88, s: 1 }
      ];
      spots.forEach(function (spot, i) {
        const el = U.el('span', { class: 'scene-decor__item', text: decor[i % decor.length] });
        el.style.left = spot.x + '%';
        el.style.top = spot.y + '%';
        el.style.fontSize = Math.round(26 * spot.s) + 'px';
        el.style.animationDelay = (i * 0.7) + 's';
        wrap.appendChild(el);
      });
      return wrap;
    },

    levelBadge: function (status, stars) {
      const wrap = U.el('div', { class: 'level-badge level-badge--' + status });
      if (status === 'locked') wrap.innerHTML = '<span aria-hidden="true">🔒</span>';
      else if (status === 'completed') wrap.innerHTML = '<span aria-hidden="true">⭐</span>';
      else wrap.innerHTML = '<span aria-hidden="true">▶</span>';
      return wrap;
    },

    /** Descarga un archivo de texto generado en el navegador. */
    download: function (filename, text, mime) {
      try {
        const blob = new Blob([text], { type: mime || 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = U.el('a', { href: url, download: filename });
        G.document.body.appendChild(a);
        a.click();
        G.setTimeout(function () { U.remove(a); URL.revokeObjectURL(url); }, 500);
        return true;
      } catch (e) {
        UI.toast('No se pudo descargar el archivo.');
        return false;
      }
    },

    /** Imprime un bloque de HTML aislado (resúmenes y diploma). */
    printHTML: function (html, opts) {
      const o = opts || {};
      const area = U.el('div', { class: 'print-area' + (o.className ? ' ' + o.className : '') });
      area.innerHTML = html;
      G.document.body.appendChild(area);
      G.document.body.classList.add('is-printing');
      const cleanup = function () {
        G.document.body.classList.remove('is-printing');
        if (area.parentNode) U.remove(area);
        G.removeEventListener('afterprint', cleanup);
      };
      G.addEventListener('afterprint', cleanup);
      G.setTimeout(function () {
        try { G.print(); } catch (e) { UI.toast('El navegador no permitió imprimir.'); cleanup(); }
      }, 120);
      G.setTimeout(function () { if (area.parentNode) cleanup(); }, 60000);
    },

    diplomaSkills: function (skills) {
      return skills.map(function (s) {
        return '<span class="diploma-skill"><b>' + U.esc(s.name) + '</b><small>' + U.esc(s.stateInfo.label) + '</small></span>';
      }).join('');
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
