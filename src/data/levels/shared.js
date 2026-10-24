/* =========================================================================
   Mouse Aventura — constructor y validación de niveles
   Cada nivel se declara con datos; el motor lo interpreta con una plantilla.
   ========================================================================= */
(function (G) {
  'use strict';
  const MA = (G.MA = G.MA || {});

  const TEMPLATE_INTERACTION = {
    move: 'move', click: 'click', sequence: 'click', drag: 'drag',
    path: 'path', wheel: 'wheel', mission: 'mission'
  };

  const GENERIC_HINTS = {
    move: ['Mueve el mouse despacio y mira cómo se mueve la flecha.', 'Si te pasas, regresa con movimientos cortos y suaves.'],
    click: ['Pon la flecha encima del objetivo y presiona el botón izquierdo una sola vez.', 'Si el clic no acierta, acomoda la flecha y vuelve a intentarlo.'],
    sequence: ['Mira el orden de la tira de arriba y toca un objeto a la vez.', 'Si te equivocas, el juego te muestra cuál sigue.'],
    drag: ['Pon la flecha sobre la pieza, mantén presionado el botón izquierdo, mueve y suelta.', 'Suelta cuando la pieza esté dentro del lugar que brilla.'],
    path: ['Avanza despacio y mira un poquito más adelante del camino.', 'Si te sales, vuelve a entrar al camino: no pierdes lo que llevas.'],
    wheel: ['Gira la rueda del mouse hacia ti, despacio, hasta llenar la barra.', 'La rueda está entre los dos botones del mouse.'],
    mission: ['Lee la indicación de cada parte antes de mover el mouse.', 'Puedes tomarte tu tiempo: nada se acaba por esperar.']
  };

  const TUTORIALS = {
    move: { kind: 'move', title: 'Mover el mouse', steps: ['Apoya la mano en el mouse.', 'Mueve el mouse sobre la mesa.', 'Mira cómo se mueve la flecha en la pantalla.'] },
    click: { kind: 'click', title: 'Hacer clic', steps: ['Mueve la flecha hasta el objetivo.', 'Presiona el botón izquierdo una vez.', 'Suelta el botón. ¡Listo!'] },
    drag: { kind: 'drag', title: 'Arrastrar y soltar', steps: ['Pon la flecha sobre la pieza.', 'Mantén presionado el botón izquierdo.', 'Mueve la pieza hasta el destino y suelta.'] },
    path: { kind: 'path', title: 'Seguir caminos', steps: ['Pon la flecha sobre la salida.', 'Avanza despacio siguiendo el camino.', 'Llega hasta la meta sin salirte.'] },
    wheel: { kind: 'wheel', title: 'La rueda del mouse', steps: ['La rueda está entre los dos botones.', 'Gírala con el dedo índice.', 'Mira cómo sube la barra.'] },
    rightclick: { kind: 'rightclick', title: 'El botón derecho', steps: ['El botón derecho está al lado derecho.', 'Pon la flecha en el objetivo.', 'Presiona una vez el botón derecho.'] }
  };

  const Builder = (MA.LevelBuilder = {
    /** Crea un nivel con valores por defecto y datos del mundo. */
    level: function (world, index, def) {
      const wm = MA.Worlds.get(world);
      const d = def || {};
      const template = d.template || 'click';
      const id = 'w' + world + 'l' + index;
      const level = Object.assign({}, d, {
        id: id,
        world: world,
        index: index,
        difficulty: (world - 1) * 10 + index,
        name: d.name || ('Nivel ' + index),
        template: template,
        interaction: d.interaction || TEMPLATE_INTERACTION[template] || 'click',
        scoring: d.scoring || TEMPLATE_INTERACTION[template] || 'click',
        skill: d.skill || (wm && wm.skills[0]) || 'click',
        skills: d.skills || [],
        goal: d.goal || '',
        instructions: d.instructions || [],
        params: d.params || {},
        hints: d.hints || [],
        rewards: Object.assign({ coins: 12 + world * 2 + index }, d.rewards || {}),
        tutorial: d.tutorial || null,
        timeLimit: d.timeLimit || 0,
        scene: d.scene || (wm ? wm.scene : 'forest'),
        worldName: wm ? wm.name : '',
        unlock: (world === 1 && index === 1) ? 'start' : 'previous'
      });
      level.skills = [level.skill].concat(level.skills).filter(function (s, i, a) { return s && a.indexOf(s) === i; });
      level.instructions = (level.instructions && level.instructions.length) ? level.instructions : [level.goal];
      level.hints = level.hints.concat(GENERIC_HINTS[template] || []);
      if (level.tutorial && typeof level.tutorial === 'string') {
        level.tutorial = TUTORIALS[level.tutorial] || (TUTORIALS[level.template] || null);
      }
      if (level.tutorial === true) level.tutorial = TUTORIALS[template] || null;
      level.win = d.win || Builder.winCondition(level);
      return level;
    },
    /** Regla de victoria derivada de la plantilla y sus parámetros. */
    winCondition: function (level) {
      const p = level.params || {};
      switch (level.template) {
        case 'move':
          return { type: 'targets', required: p.count || 1, description: 'Llegar con el cursor a todos los objetivos.' };
        case 'click': {
          const required = p.items ? p.items.filter(function (i) { return i.correct; }).length : (p.count || 1);
          return { type: 'clicks', required: required, maxWrong: p.missCounts === false ? null : 'sin límite', description: 'Hacer clic en todos los objetivos correctos.' };
        }
        case 'sequence':
          return { type: 'sequence', required: (p.order || []).length || 1, description: 'Tocar los elementos en el orden indicado.' };
        case 'drag':
          return { type: 'placements', required: (p.items || []).length || 1, description: 'Colocar cada pieza en una zona que la acepte.' };
        case 'path':
          return { type: 'route', maze: !!p.maze, rings: p.rings || 0, description: p.rings ? 'Llegar a la meta y recoger todas las estrellas del camino.' : 'Llegar hasta la meta siguiendo el camino.' };
        case 'wheel':
          return { type: 'wheel', target: p.target || 100, description: 'Llenar la barra con la rueda y confirmar.' };
        case 'mission':
          return { type: 'stages', required: (p.stages || []).length || 1, description: 'Completar todas las partes de la misión.' };
        default:
          return { type: 'targets', required: 1, description: 'Completar la actividad.' };
      }
    },
    templates: TEMPLATE_INTERACTION,
    genericHints: GENERIC_HINTS,
    tutorials: TUTORIALS
  });

  MA.Levels = {
    list: [],
    byId: {},
    _loaded: false,
    /** Carga las 10 partes definidas en src/data/levels/wN.js */
    load: function () {
      if (MA.Levels._loaded) return MA.Levels;
      const defs = MA.LevelDefs || {};
      const all = [];
      for (let w = 1; w <= MA.Worlds.count; w++) {
        const part = defs[w] || [];
        part.forEach(function (lv) { all.push(lv); });
      }
      MA.Levels.list = all;
      MA.Levels.byId = {};
      all.forEach(function (lv) { MA.Levels.byId[lv.id] = lv; });
      MA.Levels._loaded = true;
      return MA.Levels;
    },
    all: function () { return MA.Levels.load().list; },
    get: function (id) { return MA.Levels.load().byId[id] || null; },
    byWorld: function (world) {
      return MA.Levels.load().list.filter(function (l) { return l.world === world; });
    },
    worldLevels: function (world) { return MA.Levels.byWorld(world); },
    indexOf: function (id) {
      const list = MA.Levels.load().list;
      for (let i = 0; i < list.length; i++) if (list[i].id === id) return i;
      return -1;
    },
    prev: function (id) {
      const i = MA.Levels.indexOf(id);
      return i > 0 ? MA.Levels.list[i - 1] : null;
    },
    next: function (id) {
      const i = MA.Levels.indexOf(id);
      return i >= 0 && i < MA.Levels.list.length - 1 ? MA.Levels.list[i + 1] : null;
    },
    first: function () { return MA.Levels.load().list[0] || null; },
    count: function () { return MA.Levels.load().list.length; },
    skillsCovered: function () {
      const set = {};
      MA.Levels.all().forEach(function (l) { l.skills.forEach(function (s) { set[s] = true; }); });
      return Object.keys(set);
    },
    /** Revisión estructural. Devuelve {ok, errors[], warnings[], stats} */
    validate: function () {
      const errors = [];
      const warnings = [];
      const list = MA.Levels.all();
      if (list.length !== 100) errors.push('Se esperaban 100 niveles y hay ' + list.length + '.');
      const ids = {};
      const perWorld = {};
      const templates = {};
      const skills = {};
      list.forEach(function (lv) {
        if (ids[lv.id]) errors.push('Identificador repetido: ' + lv.id);
        ids[lv.id] = true;
        perWorld[lv.world] = (perWorld[lv.world] || 0) + 1;
        templates[lv.template] = (templates[lv.template] || 0) + 1;
        if (!MA.Worlds.get(lv.world)) errors.push(lv.id + ': mundo inexistente ' + lv.world);
        if (!MA.Templates || !MA.Templates.get(lv.template)) errors.push(lv.id + ': plantilla desconocida "' + lv.template + '"');
        if (!lv.name) errors.push(lv.id + ': sin nombre');
        if (!lv.goal) errors.push(lv.id + ': sin objetivo pedagógico');
        if (!lv.instructions.length) errors.push(lv.id + ': sin instrucciones');
        if (!lv.params || typeof lv.params !== 'object') errors.push(lv.id + ': sin parámetros');
        if (!lv.hints.length) warnings.push(lv.id + ': sin pistas');
        if (!Object.keys(MA.Skills.all).includes(lv.skill)) errors.push(lv.id + ': habilidad desconocida ' + lv.skill);
        lv.skills.forEach(function (s) {
          if (!MA.Skills.all[s]) errors.push(lv.id + ': habilidad secundaria desconocida ' + s);
          else skills[s] = (skills[s] || 0) + 1;
        });
        const p = lv.params || {};
        if (lv.template === 'move' && !(p.count > 0)) errors.push(lv.id + ': move necesita count');
        if (lv.template === 'click' && !(p.count > 0 || (p.items && p.items.length))) errors.push(lv.id + ': click necesita count o items');
        if (lv.template === 'click' && p.items) {
          if (!p.items.some(function (it) { return it.correct; })) errors.push(lv.id + ': ningún objetivo correcto');
        }
        if (lv.template === 'sequence') {
          if (!(p.cards && p.cards.length)) errors.push(lv.id + ': sequence necesita cards');
          else if (!(p.order && p.order.length)) errors.push(lv.id + ': sequence necesita order');
          else p.order.forEach(function (id) {
            if (!p.cards.some(function (c) { return c.id === id; })) errors.push(lv.id + ': order pide carta inexistente ' + id);
          });
        }
        if (lv.template === 'drag') {
          if (!(p.items && p.items.length)) errors.push(lv.id + ': drag necesita items');
          if (!(p.zones && p.zones.length)) errors.push(lv.id + ': drag necesita zones');
          if (p.items && p.zones) {
            p.items.forEach(function (it) {
              if (!p.zones.some(function (z) { return (z.accepts || []).indexOf(it.id) >= 0; })) {
                errors.push(lv.id + ': la pieza ' + it.id + ' no tiene zona que la acepte');
              }
            });
          }
        }
        if (lv.template === 'mission') {
          if (!(p.stages && p.stages.length >= 2)) errors.push(lv.id + ': mission necesita 2 o más etapas');
          else p.stages.forEach(function (st, i) {
            if (!MA.Templates.get(st.template)) errors.push(lv.id + ': etapa ' + (i + 1) + ' con plantilla desconocida');
          });
        }
        if (lv.template === 'path') {
          if (p.maze && !(p.cols >= 5 && p.rows >= 4)) errors.push(lv.id + ': laberinto con medidas inválidas');
        }
      });
      if (perWorld[1] !== 10) errors.push('El mundo 1 debe tener 10 niveles.');
      for (let w = 1; w <= 10; w++) if (perWorld[w] !== 10) errors.push('El mundo ' + w + ' tiene ' + (perWorld[w] || 0) + ' niveles.');
      if (Object.keys(templates).length < 6) warnings.push('Poca variedad de plantillas: ' + Object.keys(templates).join(', '));
      const missingSkills = Object.keys(MA.Skills.all).filter(function (s) { return !skills[s]; });
      if (missingSkills.length) warnings.push('Habilidades sin nivel que las trabaje: ' + missingSkills.join(', '));
      return {
        ok: errors.length === 0,
        errors: errors,
        warnings: warnings,
        stats: { levels: list.length, templates: templates, perWorld: perWorld, skills: Object.keys(skills).length }
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
