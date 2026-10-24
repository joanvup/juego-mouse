/* =========================================================================
   Mouse Aventura — avatares y accesorios (SVG originales, sin imágenes externas)
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});

  const CHARACTERS = [
    {
      id: 'mimo', name: 'Mimo', species: 'mouse', free: true,
      desc: 'Un ratoncito explorador al que le encanta el queso y las aventuras.',
      colors: { fur: '#b8c3d8', furDark: '#8b99b4', inner: '#ffc3d1', belly: '#f2f6ff', nose: '#f2789c', accent: '#6d7c99' }
    },
    {
      id: 'luna', name: 'Luna', species: 'fox', free: true,
      desc: 'Una zorrita muy curiosa que siempre encuentra el camino.',
      colors: { fur: '#f79a3e', furDark: '#d97a22', inner: '#ffe3c7', belly: '#fff3e4', nose: '#4a2b16', accent: '#c06a17' }
    },
    {
      id: 'tico', name: 'Tico', species: 'turtle', free: false, unlockWorld: 2,
      desc: 'Una tortuga tranquila que avanza paso a paso, sin prisa.',
      colors: { fur: '#67c08c', furDark: '#3f8f63', inner: '#c8f0d6', belly: '#f2ffe9', nose: '#2f7a53', accent: '#4f9f70' }
    },
    {
      id: 'kira', name: 'Kira', species: 'cat', free: false, unlockWorld: 4,
      desc: 'Una gatita juguetona con muy buena puntería.',
      colors: { fur: '#a78bfa', furDark: '#7c5fe0', inner: '#ffd1f0', belly: '#f5eeff', nose: '#f06aa8', accent: '#8465e8' }
    },
    {
      id: 'pico', name: 'Pico', species: 'bird', free: false, unlockWorld: 6,
      desc: 'Un pajarito veloz que vigila todo desde arriba.',
      colors: { fur: '#ffd23f', furDark: '#e0a800', inner: '#fff0b3', belly: '#fff8d9', nose: '#f2802e', accent: '#d9a400' }
    },
    {
      id: 'nube', name: 'Nube', species: 'panda', free: false, unlockWorld: 8,
      desc: 'Un pandita tranquilo que adora los bambúes y los abrazos.',
      colors: { fur: '#f7f9ff', furDark: '#c9d2e2', inner: '#e9edf7', belly: '#ffffff', nose: '#2b3446', accent: '#2b3446', patch: '#2b3446' }
    }
  ];

  const ACCESSORIES = [
    { id: 'gorra', name: 'Gorra de explorador', emoji: '🧢', price: 0, free: true },
    { id: 'moño', name: 'Moño alegre', emoji: '🎀', price: 60 },
    { id: 'gafas', name: 'Gafas de sol', emoji: '🕶️', price: 90 },
    { id: 'mochila', name: 'Mochila de aventuras', emoji: '🎒', price: 100 },
    { id: 'auriculares', name: 'Auriculares musicales', emoji: '🎧', price: 130 },
    { id: 'corona', name: 'Corona dorada', emoji: '👑', price: 160 },
    { id: 'capa', name: 'Capa de superhéroe', emoji: '🦸', price: 200 }
  ];

  const chById = {};
  CHARACTERS.forEach(function (c) { chById[c.id] = c; });
  const accById = {};
  ACCESSORIES.forEach(function (a) { accById[a.id] = a; });

  function ears(ch) {
    const c = ch.colors;
    switch (ch.species) {
      case 'mouse':
        return '<circle cx="54" cy="52" r="30" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3"/>' +
          '<circle cx="146" cy="52" r="30" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3"/>' +
          '<circle cx="54" cy="55" r="18" fill="' + c.inner + '"/>' +
          '<circle cx="146" cy="55" r="18" fill="' + c.inner + '"/>';
      case 'fox':
        return '<path d="M32 92 L44 14 L100 58 Z" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M168 92 L156 14 L100 58 Z" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M46 78 L52 36 L86 62 Z" fill="' + c.inner + '"/>' +
          '<path d="M154 78 L148 36 L114 62 Z" fill="' + c.inner + '"/>';
      case 'cat':
        return '<path d="M34 96 L46 22 L98 58 Z" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M166 96 L154 22 L102 58 Z" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M48 82 L55 42 L84 64 Z" fill="' + c.inner + '"/>' +
          '<path d="M152 82 L145 42 L116 64 Z" fill="' + c.inner + '"/>';
      case 'panda':
        return '<circle cx="48" cy="54" r="27" fill="' + c.patch + '"/>' +
          '<circle cx="152" cy="54" r="27" fill="' + c.patch + '"/>';
      case 'turtle':
        return '<circle cx="46" cy="66" r="13" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3"/>' +
          '<circle cx="154" cy="66" r="13" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3"/>';
      case 'bird':
        return '<path d="M100 34 Q92 12 112 18 Q106 30 100 34 Z" fill="' + c.furDark + '"/>';
      default: return '';
    }
  }

  function eyes(ch, mood) {
    const c = ch.colors;
    if (mood === 'happy' || mood === 'cheer') {
      return '<path d="M60 102 Q74 86 88 102" fill="none" stroke="#26313f" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M112 102 Q126 86 140 102" fill="none" stroke="#26313f" stroke-width="7" stroke-linecap="round"/>';
    }
    let out = '';
    if (ch.species === 'panda') {
      out += '<ellipse cx="74" cy="99" rx="21" ry="24" fill="' + c.patch + '"/>' +
        '<ellipse cx="126" cy="99" rx="21" ry="24" fill="' + c.patch + '"/>';
    }
    out += '<ellipse cx="74" cy="100" rx="15" ry="17" fill="#ffffff"/>' +
      '<ellipse cx="126" cy="100" rx="15" ry="17" fill="#ffffff"/>' +
      '<circle cx="76" cy="102" r="8" fill="#26313f"/>' +
      '<circle cx="128" cy="102" r="8" fill="#26313f"/>' +
      '<circle cx="72.5" cy="97" r="3.2" fill="#ffffff"/>' +
      '<circle cx="124.5" cy="97" r="3.2" fill="#ffffff"/>';
    return out;
  }

  function mouth(ch, mood) {
    const c = ch.colors;
    if (ch.species === 'bird') {
      return '<path d="M100 110 L84 124 L100 132 L116 124 Z" fill="' + c.nose + '" stroke="#d96c1f" stroke-width="2" stroke-linejoin="round"/>';
    }
    if (mood === 'cheer') {
      return '<ellipse cx="100" cy="134" rx="17" ry="12" fill="#7a3b52"/>' +
        '<ellipse cx="100" cy="140" rx="11" ry="6" fill="#ff8fa8"/>' +
        '<ellipse cx="100" cy="118" rx="7" ry="5.5" fill="' + c.nose + '"/>';
    }
    if (mood === 'happy') {
      return '<path d="M84 128 Q100 146 116 128" fill="none" stroke="#7a3b52" stroke-width="6" stroke-linecap="round"/>' +
        '<ellipse cx="100" cy="119" rx="7" ry="5.5" fill="' + c.nose + '"/>';
    }
    return '<path d="M86 128 Q100 140 114 128" fill="none" stroke="#7a3b52" stroke-width="5.5" stroke-linecap="round"/>' +
      '<ellipse cx="100" cy="119" rx="7" ry="5.5" fill="' + c.nose + '"/>';
  }

  function body(ch) {
    const c = ch.colors;
    let out = '<ellipse cx="100" cy="196" rx="66" ry="46" fill="' + c.fur + '" stroke="' + c.furDark + '" stroke-width="3"/>' +
      '<ellipse cx="100" cy="200" rx="44" ry="30" fill="' + c.belly + '"/>';
    if (ch.species === 'turtle') {
      out += '<ellipse cx="100" cy="196" rx="60" ry="42" fill="' + c.furDark + '"/>' +
        '<path d="M100 156 L100 236 M56 178 L144 214 M144 178 L56 214" stroke="' + c.inner + '" stroke-width="4" stroke-linecap="round"/>' +
        '<ellipse cx="100" cy="196" rx="24" ry="17" fill="' + c.inner + '" opacity=".55"/>';
    }
    if (ch.species === 'bird') {
      out += '<ellipse cx="62" cy="196" rx="20" ry="30" fill="' + c.furDark + '" transform="rotate(-18 62 196)"/>' +
        '<ellipse cx="138" cy="196" rx="20" ry="30" fill="' + c.furDark + '" transform="rotate(18 138 196)"/>';
    }
    return out;
  }

  function accessory(id, ch) {
    const c = ch.colors;
    switch (id) {
      case 'gorra':
        return '<path d="M40 62 Q100 0 160 62 Q100 80 40 62 Z" fill="#e2474b" stroke="#a82c30" stroke-width="3"/>' +
          '<ellipse cx="100" cy="64" rx="58" ry="12" fill="#f26d70" stroke="#a82c30" stroke-width="3"/>' +
          '<circle cx="100" cy="26" r="7" fill="#ffd23f"/>';
      case 'corona':
        return '<path d="M50 56 L62 16 L80 44 L100 10 L120 44 L138 16 L150 56 Z" fill="#ffc233" stroke="#c8901a" stroke-width="3" stroke-linejoin="round"/>' +
          '<circle cx="100" cy="40" r="6" fill="#e2474b"/>' +
          '<circle cx="70" cy="46" r="5" fill="#2b7ff5"/>' +
          '<circle cx="130" cy="46" r="5" fill="#2fae5e"/>';
      case 'gafas':
        return '<g fill="rgba(30,45,66,.25)" stroke="#26313f" stroke-width="6">' +
          '<circle cx="74" cy="100" r="24"/><circle cx="126" cy="100" r="24"/></g>' +
          '<path d="M98 100 L102 100" stroke="#26313f" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M48 96 L30 92 M152 96 L170 92" stroke="#26313f" stroke-width="5" stroke-linecap="round"/>';
      case 'moño':
        return '<g transform="translate(148 40) rotate(12)">' +
          '<path d="M0 0 L-26 -14 L-24 16 Z" fill="#ff5d8f" stroke="#c93a6b" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<path d="M0 0 L26 -14 L24 16 Z" fill="#ff5d8f" stroke="#c93a6b" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<circle cx="0" cy="0" r="8" fill="#ff8fb3" stroke="#c93a6b" stroke-width="2.5"/></g>';
      case 'auriculares':
        return '<path d="M34 96 Q100 -4 166 96" fill="none" stroke="#2b7ff5" stroke-width="11" stroke-linecap="round"/>' +
          '<rect x="20" y="80" width="26" height="42" rx="12" fill="#2b7ff5" stroke="#1a5fae" stroke-width="3"/>' +
          '<rect x="154" y="80" width="26" height="42" rx="12" fill="#2b7ff5" stroke="#1a5fae" stroke-width="3"/>';
      case 'capa':
        return '<path d="M54 168 Q100 142 146 168 L170 236 Q100 214 30 236 Z" fill="#e2474b" stroke="#a82c30" stroke-width="3" stroke-linejoin="round"/>';
      case 'mochila':
        return '<path d="M62 168 Q58 150 72 148 L76 176 Z" fill="#2fae5e" stroke="#1d7a41" stroke-width="2.5"/>' +
          '<path d="M138 168 Q142 150 128 148 L124 176 Z" fill="#2fae5e" stroke="#1d7a41" stroke-width="2.5"/>' +
          '<rect x="74" y="206" width="52" height="26" rx="8" fill="#2fae5e" stroke="#1d7a41" stroke-width="2.5"/>';
      default: return '';
    }
  }

  function svg(characterId, opts) {
    const ch = chById[characterId] || CHARACTERS[0];
    const o = opts || {};
    const mood = o.mood || 'idle';
    const accessories = o.accessories || [];
    const size = o.size ? ' width="' + o.size + '" height="' + Math.round(o.size * 1.25) + '"' : '';
    const extraClass = o.className ? ' ' + o.className : '';
    let out = '<svg class="avatar-svg avatar-svg--' + ch.id + extraClass + '" viewBox="0 0 200 250"' + size +
      ' role="img" aria-label="' + ch.name + (accessories.length ? ' con accesorios' : '') + '">';
    if (accessories.indexOf('capa') >= 0) out += accessory('capa', ch);
    out += body(ch);
    out += ears(ch);
    out += '<circle cx="100" cy="100" r="58" fill="' + ch.colors.fur + '" stroke="' + ch.colors.furDark + '" stroke-width="3.5"/>';
    out += '<ellipse cx="100" cy="126" rx="34" ry="26" fill="' + ch.colors.belly + '"/>';
    out += '<ellipse cx="62" cy="124" rx="12" ry="8" fill="#ff9db4" opacity=".45"/>' +
      '<ellipse cx="138" cy="124" rx="12" ry="8" fill="#ff9db4" opacity=".45"/>';
    out += eyes(ch, mood);
    out += mouth(ch, mood);
    if (mood === 'cheer') {
      out += '<g fill="#ffd23f"><path d="M22 56 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z"/>' +
        '<path d="M178 84 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z"/></g>';
    }
    accessories.forEach(function (id) {
      if (id !== 'capa') out += accessory(id, ch);
    });
    out += '</svg>';
    return out;
  }

  MA.Avatars = {
    characters: CHARACTERS,
    accessories: ACCESSORIES,
    character: function (id) { return chById[id] || CHARACTERS[0]; },
    accessory: function (id) { return accById[id] || null; },
    isCharacterUnlocked: function (characterId, completedWorlds) {
      const ch = chById[characterId];
      if (!ch) return false;
      if (ch.free) return true;
      return (completedWorlds || []).indexOf(ch.unlockWorld) >= 0;
    },
    defaultAccessories: function () { return []; },
    svg: svg,
    moods: function (pct) { return pct >= 0.9 ? 'cheer' : pct >= 0.6 ? 'happy' : 'idle'; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
