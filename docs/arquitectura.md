# Arquitectura — Mouse Aventura: Pequeños Exploradores

## 1. Principios de diseño

1. **Sin instalación ni compilación.** El juego es HTML5 + CSS3 + JavaScript clásico. No hay bundler, framework ni dependencias externas: se puede abrir `index.html` directamente o servir la carpeta como archivos estáticos.
2. **Separación entre datos, lógica y presentación.** Los 100 niveles son datos declarativos; el motor los interpreta con plantillas reutilizables; la interfaz solo compone pantallas y HUD.
3. **Robustez pedagógica.** Nunca se castiga un error con pérdida de progreso. Repetir, salir, recargar o pedir pistas no borra recompensas ya obtenidas.
4. **Accesibilidad y lectura infantil.** Áreas de interacción grandes, textos cortos, refuerzo visual y sonoro, opciones de movimiento reducido, alto contraste y objetivos ampliables.
5. **Funcionamiento local y privado.** El progreso vive en `localStorage`; no hay servicios externos ni telemetría.
6. **Sin recursos externos.** Avatares e iconos son SVG generados en código; los sonidos se sintetizan con Web Audio API; los objetos del juego usan emoji del sistema para mantener el peso bajo.

### ¿Por qué JavaScript clásico y no módulos ES?

Los módulos ES (`import`/`export`) no funcionan desde `file://` por la política CORS del navegador. Para que un docente pueda abrir el juego con doble clic en un computador escolar, cada archivo declara un IIFE y publica su API en el espacio global `window.MA`. La carga ordenada de `index.html` hace el resto. Si se sirve por HTTP, la PWA y el service worker funcionan igualmente.

## 2. Mapa de módulos

```text
index.html
└─ src/core/utils.js          Utilidades DOM, matemáticas, RNG, formato, storage seguro
   src/core/storage.js        Persistencia versionada, copia de seguridad, importación
   src/core/audio.js          Sonidos y música procedural (Web Audio)
   src/data/worlds.js         10 mundos: nombres, escenarios, insignias
   src/data/skills.js         21 habilidades, estados y agrupaciones
   src/data/avatars.js        Personajes y accesorios en SVG
   src/data/levels/shared.js  Constructor de niveles, validación, hints y tutoriales
   src/data/levels/w1..w10.js Datos de los 100 niveles
   src/core/scoring.js        Indicadores, estrellas, puntaje y textos de resultado
   src/core/progress.js       Desbloqueo, recompensas, habilidades, diploma (sin DOM)
   src/core/store.js          Estado de la aplicación, perfiles, PIN, reportes
   src/engine/paths.js        Geometría de rutas y laberintos (sin DOM)
   src/engine/engine.js       Bucle, métricas, pistas, efectos y contrato de plantillas
   src/engine/templates/*.js  move, click, sequence, drag, path, wheel, mission
   src/ui/components.js       Botones, tarjetas, modales, toasts, figuras SVG
   src/ui/tutorial.js         Tutorial interactivo con práctica real
   src/ui/screens/*.js        Inicio, perfil, mapas, juego, progreso, personaje,
                              ajustes, ayuda, docente y diploma
   src/ui/app.js              Router por hash, shell y utilidades de pantalla
   src/main.js                Arranque, validación de niveles y service worker
```

Todo el estado compartido está en `window.MA` (`MA.Store`, `MA.Engine`, `MA.Templates`, `MA.Screens`, `MA.Progress`, `MA.Scoring`, `MA.Paths`, `MA.Levels`, …).

## 3. Flujo de arranque

1. `main.js` llama a `MA.Store.init()`:
   - Lee `localStorage`, migra el esquema si hace falta, recupera la copia de seguridad si los datos están dañados.
   - Incrementa el contador de sesiones y aplica la configuración de audio.
2. Se valida la estructura de los 100 niveles (`MA.Levels.validate()`) y se informa en consola si hay errores.
3. `MA.App.init()`:
   - Aplica clases de accesibilidad (`reduce-motion`, `high-contrast`, `bigger-targets`).
   - Escucha `hashchange` y renderiza la pantalla correspondiente.
   - El primer clic o tecla desbloquea el audio del navegador.
4. Si la URL es HTTP/HTTPS, se registra `sw.js`.

### Rutas

| Hash | Pantalla |
|---|---|
| `#/inicio` | Inicio |
| `#/perfil` | Selección/creación de perfil |
| `#/mapa` | Mapa de los 10 mundos |
| `#/mundo/6` | Mapa de niveles del mundo 6 |
| `#/jugar/w6l2` | Nivel concreto |
| `#/progreso` | Progreso, habilidades e insignias |
| `#/personaje` | Avatar y accesorios |
| `#/ajustes` | Sonido y accesibilidad |
| `#/ayuda` | Ayuda y práctica libre |
| `#/docente` | Panel docente (PIN) |
| `#/diploma` | Diploma final |

Cada pantalla implementa `render(params) → { el, title, destroy? }`. `destroy` libera listeners y el motor de juego. Si no hay perfil, el router redirige a `#/perfil` salvo en Ayuda y en el panel docente.

## 4. Motor de niveles

### 4.1 Creación

```js
const engine = MA.Engine.create({
  level,          // objeto de nivel
  stage,          // elemento que recibe los eventos de puntero
  layer,          // contenedor donde la plantilla dibuja
  settings,       // { reduceMotion, biggerTargets, highContrast, autoHints }
  hud,            // { progress(done,total), timer(ms), assist(n), status(text), metrics(snapshot) }
  onFinish,       // (result) al completar
  onBubble, onToast, onSuggestHint, onTimeUp
});
engine.start();
```

El motor mide el tiempo, acumula métricas, controla la pausa, el temporizador opcional, el aviso de inactividad, el botón de ayuda y los efectos visuales. Durante la pausa no se actualizan las plantillas ni corre el reloj.

### 4.2 API que recibe cada plantilla

| Método | Uso |
|---|---|
| `api.setTotal(n)` / `api.progress(done,total)` | Barra de avance del HUD |
| `api.target()` | Registra un objetivo conseguido |
| `api.click(ok)` | Registra un clic correcto o incorrecto |
| `api.drop(ok)` | Registra un arrastre correcto o fallido |
| `api.deviation()` | Registra una salida del camino |
| `api.ring(got,total)` | Estrellas de ruta recogidas |
| `api.stagePrecision(v)` | Aporta la precisión de una etapa de misión |
| `api.wheel(reached,target)` | Progreso de la rueda |
| `api.complete()` | Finaliza el nivel |
| `api.bubble(texto,mood,ms)` | Bocadillo del personaje |
| `api.effect(kind,x,y,n)` | Partículas y celebraciones |
| `api.arrowTo(el)` / `clearArrow()` | Flecha de pista |
| `api.assist()` | Indica si la ayuda está activa |
| `api.isPaused()` / `isFinished()` | Estado del motor |
| `api.timeLeft()` | Tiempo restante si hay reloj |
| `api.sizeScale()` | Escala de tamaños según pantalla y accesibilidad |
| `api.sfx(nombre)` | Efecto de sonido |
| `api.setStatus(texto)` | Cambia la indicación de la barra inferior |
| `api.stageRect()` / `api.elapsed()` | Geometría y tiempo |

### 4.3 Contrato de plantilla

```js
MA.Templates.register('click', function (ctx) {
  // ctx = { level, params, stage, layer, settings, api, engine, U, sizeScale, stageRect }
  return {
    update(dt, dtMs) {},  // opcional, cada frame
    hint() { return 'texto de pista'; }, // opcional
    destroy() {},         // obligatorio: quitar listeners
    debugPath() {}        // solo rutas: puntos para pruebas
  };
});
```

El registro `MA.Templates` permite que `MA.Levels.validate()` compruebe que cada nivel usa una plantilla existente.

### 4.4 Métricas

```js
{
  timeMs, hints, assistUsed,
  clicks: { total, correct, wrong },
  targets: { total, done },
  drags: { total, ok, wrong },
  deviations, allowedDeviations,
  rings: { total, got },
  travel, ideal,                 // movimiento del cursor (px)
  stages: [0.8, 0.7],            // precisión de cada parte de una misión
  wheel: { target, reached },
  stageIndex, stageTotal
}
```

Se actualizan en el HUD como máximo cada 140 ms para no forzar repintados innecesarios.

### 4.5 Plantillas y variantes

| Plantilla | Qué hace | Variantes usadas en los 100 niveles |
|---|---|---|
| `move` | Detectar el cursor dentro de una zona | Objetos quietos, en orden numerado, en cuadrícula/aro/fila/esquinas, con movimiento lento, con espera (dwell) para enseñar a “mantenerse dentro”, mariposa que sigue al cursor |
| `click` | Clic sobre objetivos, con distractores | Aparecer uno por uno o todos, tamaños decrecientes, colores, movimiento, objetos dormidos, cofres, frutas, botones, puertas, partes de nave, botón derecho, clic guiado (primero colocar la flecha) |
| `sequence` | Clic siguiendo un orden | Números, colores, banderas, botones de interfaz, semáforo, orden por tamaño |
| `drag` | Arrastrar y soltar con retorno si falla | Emparejar, clasificar, rompecabezas de formas, construir torres, ordenar por tamaño, piezas de un carrito |
| `path` | Seguir una polilínea con tolerancia | Caminos anchos, curvos, estrechos, espirales, laberintos generados, recolección de estrellas |
| `wheel` | Acumular giro de rueda | Nivel avanzado con alternativa accesible si el mouse no tiene rueda |
| `mission` | Encadenar etapas | Combinaciones de clic + arrastre + ruta + secuencia + rueda |

### 4.6 Misiones

`mission` crea una sub-instancia de la plantilla de cada etapa con una API “envuelta”:

- `complete()` de la etapa avanza a la siguiente en lugar de terminar el nivel.
- `progress()` acumula el avance de todas las etapas.
- Al terminar una etapa se calcula su precisión con las métricas delta y se guarda en `metrics.stages`.
- La precisión final de la misión es el promedio de las etapas.
- `debugPath()` se reenvía a la etapa de ruta para las pruebas automáticas.

## 5. Modelo de datos de un nivel

```js
MA.LevelDefs[2] = [
  B.level(2, 6, {
    name: 'Globos de colores',
    skill: 'select',
    skills: ['click', 'precision', 'single-click'],
    goal: 'Haz clic solo en los 4 globos rojos.',
    instructions: ['Hay globos de varios colores.', 'Toca únicamente los rojos.'],
    template: 'click',
    params: {
      count: 4, size: 96, style: 'balloon',
      items: [
        { emoji: '🎈', label: 'globo rojo', color: '#e2474b', correct: true },
        /* … */
      ]
    },
    hints: ['Mira el color de cada globo antes de hacer clic.']
  })
];
```

`MA.LevelBuilder.level(world, index, def)` completa automáticamente:

- `id` (`w2l6`), `world`, `index`, `difficulty` (1…100).
- `interaction` y `scoring` derivados de la plantilla.
- `rewards.coins = 12 + world*2 + index`.
- `unlock`: `start` para el primer nivel o `previous` para el resto.
- `win`: regla de victoria derivada de la plantilla (`targets`, `clicks`, `sequence`, `placements`, `route`, `wheel` o `stages`, con la cantidad requerida y una descripción legible).
- Instrucciones y pistas genéricas de la mecánica.
- Tutorial asociado si se indica `tutorial: 'click'`.
- `scene` y `worldName` a partir del mundo.

### Validación automática

`MA.Levels.validate()` comprueba: 100 niveles, 10 por mundo, ids únicos, plantillas existentes, objetivos e instrucciones, habilidades conocidas, parámetros mínimos por plantilla (`count`, `items`, `cards`+`order`, `zones` que acepten cada pieza, etapas de misión válidas, medidas de laberinto) y variedad de plantillas. Se ejecuta al arrancar y en las pruebas.

## 6. Evaluación

### 6.1 Precisión por tipo

| Tipo | Fórmula |
|---|---|
| `click` / `sequence` | `correctos / (correctos + incorrectos)`; `null` si no hay clics |
| `move` | `0.45 * (objetivos logrados / total) + 0.55 * clamp(ideal / recorrido real)` |
| `drag` | `0.72 * (soltadas correctas / total de soltadas) + 0.28 * (piezas colocadas / total)` |
| `path` | `0.78 * clamp(1 − desviaciones / (2 * desviacionesPermitidas)) + 0.22 * (estrellas de ruta)` |
| `wheel` | `0.75 * (avance / objetivo) + 0.25 * (clics correctos / clics)` |
| `mission` | promedio de las precisiones de sus etapas |

Si no hay datos suficientes se devuelve `null` y la interfaz muestra **“Pendiente”**. Nunca hay división por cero.

### 6.2 Estrellas y puntaje

- **1 estrella** por completar (siempre).
- **2 estrellas** si la precisión supera `0.55 + 0.0012 * dificultad` (aprox. 0.55–0.65).
- **3 estrellas** si supera `0.80 + 0.0007 * dificultad` (aprox. 0.80–0.87).
- `puntaje = estrellas * 100 + precisión * 100`.

El resultado incluye el indicador correspondiente, el detalle legible (aciertos, errores, objetivos, pistas…), el tiempo y un mensaje amable. No existe “nivel perdido”: abortar no quita estrellas ya ganadas.

### 6.3 Tiempo de referencia

`MA.Scoring.parTime(level)` estima una duración razonable según plantilla y cantidad de objetivos. Se usa en reportes docentes y no como límite. Los únicos relojes son opcionales y, al agotarse, permiten continuar sin reloj.

## 7. Progresión y recompensas

### Desbloqueo

Lineal: el nivel 1 está disponible desde el inicio y cada nivel se abre al completar el anterior. Se puede repetir cualquier nivel ya completado. No se exige puntuación perfecta, solo completar.

### Recompensas

| Evento | Monedas |
|---|---|
| Primera vez que se completa un nivel | `12 + mundo*2 + nivel` |
| Repetición que mejora estrellas | `4` por estrella nueva |
| Repetición sin mejorar | 0 (mensaje “¡Practicaste otra vez!”) |
| Completar un mundo | Insignia + cofre de 40 monedas, una sola vez |

Todo se controla con el registro del nivel (`completed`, `stars`, `wins`), por lo que **no se pueden duplicar recompensas** repitiendo o recargando.

### Habilidades

Cada nivel declara una habilidad principal y habilidades secundarias. Al completarlo se actualiza cada habilidad con:

- número de prácticas (`plays`),
- suma de estrellas de la mejor versión del nivel,
- precisión media,
- niveles distintos con evidencia.

Estados:

- **En aprendizaje:** una sola actividad.
- **En práctica:** evidencia en 2 niveles distintos.
- **Logrado:** 3 o más niveles distintos y promedio ≥ 2 estrellas.
- **Dominado:** 5 o más niveles distintos y promedio ≥ 2.4 estrellas.

Las recomendaciones de refuerzo priorizan habilidades en aprendizaje/práctica y niveles ya jugados con menos estrellas.

### Desbloqueo de personajes

- Mimo y Luna: disponibles desde el inicio.
- Tico: completar el mundo 2.
- Kira: mundo 4.
- Pico: mundo 6.
- Nube: mundo 8.

Los accesorios se compran con monedas virtuales (sin dinero real) y se equipan en `#/personaje`.

## 8. Almacenamiento y datos

### Claves

| Clave | Contenido |
|---|---|
| `mouseAventura.v1` | Estado completo serializado |
| `mouseAventura.backup.v1` | Copia del estado anterior a la última escritura |

Cada guardado copia primero el valor anterior a la clave de respaldo. Si el JSON principal está dañado, `MA.Storage.load()` intenta el respaldo y avisa al usuario. Los errores de cuota o de modo privado se capturan y se muestran como aviso, sin romper la partida.

### Esquema

```js
{
  version: 1,
  createdAt: 1710000000000,
  activeProfile: 'EXP-001',
  settings: { music, sfx, muted, musicOn, reduceMotion, biggerTargets, highContrast, autoHints },
  teacher: { pinHash: 'h123…', pinChanged: true },
  profiles: {
    'EXP-001': {
      id, code, name, createdAt, updatedAt,
      avatar: { character: 'mimo', accessories: ['gorra'] },
      coins, badges: ['badge-w1'], chests: { w1: true },
      levels: {
        'w1l1': { completed, stars, best, plays, wins, abandoned, timeMs, hints,
                  precisionSum, precisionCount, correct, wrong, lastPlayed }
      },
      skills: {
        click: { plays, starsSum, precisionSum, precisionCount,
                 levels: { w2l1: 3 }, lastPlayed }
      },
      totals: { timeMs, correctClicks, wrongClicks, dragsOk, dragsWrong,
                deviations, hints, targets, wins, sessions, plays },
      inventory: { accessories: [], characters: [] },
      tutorials: { move: true, click: true },
      lastLevel: 'w10l3'
    }
  },
  meta: { sessions, lastSaved }
}
```

El PIN se guarda como hash no reversible (`U.hash('mouse-aventura::' + pin)`). Esto evita que quede en texto plano, pero al estar en el mismo equipo **no constituye seguridad robusta**; la guía docente lo explica.

### Exportar / importar

`MA.Storage.exportText()` produce un JSON con envoltorio (`app`, `exportedAt`, `schema`, `data`). `importText()` acepta tanto ese formato como un estado plano, lo migra y lo valida. Las pantallas de Configuración y del panel docente ofrecen descargar e importar.

### Varios computadores

No hay sincronización. El diseño admite un backend futuro (API de perfiles y reportes), pero el juego **no simula** sincronización inexistente.

## 9. Rutas y laberintos

`MA.Paths` trabaja en un tablero virtual de **1000 × 600** para que la geometría sea independiente del tamaño de pantalla:

- `shapePoints(shape)` genera formas densas (`wave`, `loop`, `zigzag`, `spiral`, `bumps`, `sCurve`).
- `maze(cols, rows, rng)` genera un laberinto perfecto con DFS, guarda las paredes y la solución desde la entrada hasta la salida.
- `resample(points, step)` deja una polilínea con paso casi constante.
- `distanceToPolyline(px,py,points)` devuelve distancia al camino y el índice más cercano.
- `toleranceVirtual(params, scenario, boardWidthPx)` convierte la tolerancia en píxeles a unidades virtuales; en laberintos usa el ancho del pasillo.

La plantilla `path` muestra el camino, la meta, las estrellas y un marcador de avance. Si el cursor se sale, cuenta **una** desviación, avisa y permite reingresar por el punto más cercano; **el avance no se reinicia**. Si se queda fuera mucho tiempo, muestra la guía punteada.

## 10. Interfaz y accesibilidad

- **HUD**: pausa, mundo/nivel, nombre, barra de avance, reloj opcional, indicador de pista activa, ayuda y monedas/estrellas.
- **Barra inferior**: indicación actual, repetir y mapa.
- **Bocadillo del personaje**: instrucciones breves; se oculta al interactuar y al completar.
- **Modal de pausa**: seguir, repetir, instrucciones y salir.
- **Resultados**: estrellas animadas, mensaje, indicador, tiempo, pistas, detalle, monedas, insignias, mejoras de habilidad y siguiente paso.
- **Router**: `#/…` para poder recargar sin perder la pantalla; el progreso sobrevive a la recarga.

Accesibilidad implementada:

- Contraste alto y tipografía grande; botones con `:focus-visible` visible.
- `aria-label`, `role`, `aria-live` en instrucciones y modales; foco atrapado y `Esc` para cerrar.
- Opción de movimiento reducido (desactiva animaciones y decoración animada).
- Objetivos ampliables y tamaños mínimos razonables.
- Colores acompañados de nombres, formas o dibujos.
- El juego se completa solo con mouse; el teclado es opcional.

## 11. Sonido

`MA.Audio` sintetiza tonos con osciladores y envolventes suaves (sin archivos). Hay buses separados para música y efectos, con volúmenes independientes y silencio total. La música es un arpegio pentatónico lento que se programa con `setTimeout` y se detiene al silenciar. El contexto de audio se crea tras el primer gesto del usuario, como exigen los navegadores.

## 12. PWA y funcionamiento sin conexión

- `manifest.webmanifest` define nombre, colores, iconos 192/512 y máscara.
- `sw.js` precarga todos los archivos del juego. La **navegación, el CSS y el JS van primero a la red** (y se guardan una copia); los iconos y el manifiesto salen primero de la caché. Sin conexión, todo se sirve desde la caché.
- El service worker se registra solo en HTTP/HTTPS.
- En `file://` el juego funciona, pero sin instalación ni caché offline.
- **Al publicar una actualización**, cambia el nombre de la constante `CACHE` de `sw.js` (por ejemplo `mouse-aventura-v1.0.2`). Al activarse, borra la caché anterior, toma el control y **recarga las pestañas una sola vez** para que dejen de usar el CSS/JS viejos que ya tenían cargados.

## 13. Pruebas

### Unitarias (Node)

`tests/helpers/load-game.cjs` carga los módulos en Node (`globalThis` en lugar de `window`). Se prueba:

- estructura y contenido de los 100 niveles (`levels.test.cjs`),
- progresión, recompensas, habilidades, almacenamiento, importación y perfiles (`progress.test.cjs`),
- fórmulas de evaluación y estrellas (`scoring.test.cjs`),
- geometría de rutas y laberintos (`paths.test.cjs`).

### Navegador (Chrome headless + DevTools Protocol)

`tests/helpers/cdp.cjs` implementa un cliente CDP mínimo con `WebSocket` nativo de Node (sin dependencias):

- `tests/smoke.cjs`: crea un perfil y recorre los 100 niveles con eventos de puntero sintéticos, comprobando desbloqueo, recompensas, guardado y recarga.
- `tests/flows.cjs`: prueba con eventos reales de ratón la pausa, repetir, abandonar, ajustes, tutorial, PIN, creación de estudiantes, CSV, impresión simulada, restablecimiento y recarga.
- `tests/screens.cjs`: captura todas las pantallas en 1366×768 y 1920×1080.
- `tests/autoplay.cjs`: “jugador automático” basado en el DOM que usa la misma API de eventos que un mouse real a nivel de página.

La automatización no reemplaza la observación docente: sirve para detectar regresiones en las 100 actividades.

## 14. Cómo ampliar el juego

### Añadir un nivel

1. Abre el archivo del mundo, por ejemplo `src/data/levels/w9.js`.
2. Añade una entrada con `B.level(9, 11, { … })` (o sustituye un nivel existente).
3. Usa una plantilla existente o crea una nueva en `src/engine/templates/`.
4. Ejecuta `npm test`: la validación avisará si faltan parámetros.
5. Si añades un nivel al final de un mundo, el desbloqueo lineal se ajusta solo.

### Añadir un mundo

1. Añade la entrada en `src/data/worlds.js` (`id`, nombre, escenario, insignia, habilidades).
2. Crea `src/data/levels/w11.js` con `MA.LevelDefs[11] = [ … ]`.
3. Incluye el archivo en `index.html` y en la lista de `sw.js`.
4. Ajusta las expectativas de las pruebas (100 niveles → nuevo total).
5. Define una escena CSS nueva (`.scene--mi-mundo`) con sus gradientes.

### Añadir una plantilla

1. Crea `src/engine/templates/miPlantilla.js` con `MA.Templates.register('miPlantilla', factory)`.
2. Devuelve `{ update, hint, destroy }` y usa la API del motor para registrar objetivos.
3. Enlaza la plantilla en `MA.LevelBuilder.templates` (`shared.js`) para que se derive `interaction`/`scoring`.
4. Añade reglas de validación y una fórmula de precisión si es necesaria.
5. Inclúyela en `index.html` y en `sw.js`.

### Añadir un personaje o accesorio

- Personajes: `src/data/avatars.js` (`CHARACTERS`, colores, especie, condición de desbloqueo).
- Accesorios: añade el objeto a `ACCESSORIES`, su dibujo en `accessory()` y el equipamiento se resuelve solo.

## 15. Decisiones y límites conocidos

- **Sin Canvas para los objetivos.** Se usa DOM/SVG porque el hit-testing es nativo, accesible y suficiente para estas actividades. El SVG se usa para rutas, laberintos, avatares e iconos.
- **Emoji como arte de objetos.** Reduce peso y funciona sin red; el estilo visual se unifica con marcos, sombras y animaciones CSS. Los personajes son SVG propios.
- **Sin cuentas.** Un navegador = un almacén de perfiles. Para uso compartido entre equipos hace falta backend.
- **PIN local.** Protección básica; documentada como tal.
- **Rueda del mouse.** Solo un nivel avanzado, con alternativa accesible.
- **Service worker.** Requiere HTTP/HTTPS; no funciona en `file://`.
- **Audio.** Requiere un primer gesto del usuario.
- **Emoji del sistema.** El aspecto exacto puede variar ligeramente entre versiones de Windows; el diseño no depende de ello.

## 16. Compatibilidad

- Chrome/Edge basados en Chromium, versiones recientes (probado con Chrome headless moderno).
- Windows 10 y 11; también macOS/Linux con Chromium.
- Resoluciones probadas: 1366×768 y 1920×1080; responsive por debajo.
- Sin conexión tras la primera carga cuando se sirve por HTTP/HTTPS e instala la PWA.

## 17. Arquitectura opcional con backend (no implementada)

La versión actual es **local y monousuario por navegador**. Para un colegio que necesite compartir progreso entre computadores se puede añadir un backend sin cambiar el motor de juego, porque toda la lógica de progreso (`MA.Progress`) ya está separada del DOM y del almacenamiento.

### Diseño propuesto

```text
Navegador (el mismo juego)
  └─ MA.BackendSync (nuevo módulo opcional)
       ├─ POST /api/sessions        → inicio de sesión con código + PIN de aula
       ├─ GET  /api/students/:code  → perfil y progreso
       ├─ PUT  /api/students/:code  → actualiza perfil/progreso (idempotente)
       ├─ POST /api/students/:code/events → telemetría de intentos (lote)
       └─ GET  /api/reports/...     → CSV/JSON para el panel docente

Servidor (Node/Express o Fastify + PostgreSQL)
  ├─ auth de docentes (contraseña con hash argon2 + sesión firmada)
  ├─ auth de estudiantes (código + PIN corto de aula; sin datos personales)
  ├─ validación de esquema y límites de tamaño
  └─ tareas de respaldo diario

Base de datos
  students(code PK, alias, avatar_json, created_at, updated_at)
  progress(code FK, level_id, completed, stars, best_score, plays, wins,
           abandoned, time_ms, hints, precision_sum, precision_count,
           correct, wrong, last_played, PRIMARY KEY(code, level_id))
  skill_progress(code FK, skill_id, plays, stars_sum, precision_sum,
                 precision_count, levels_json, updated_at,
                 PRIMARY KEY(code, skill_id))
  rewards(code FK, badge_id, chest_id, coins, awarded_at)
  teacher_accounts(id PK, email, password_hash, role, created_at)
  audit_log(id, actor, action, target, created_at)
```

### Sincronización y conflictos

- El juego sigue funcionando **offline**: escribe primero en `localStorage` y encola eventos.
- `MA.BackendSync` envía lotes con un `client_event_id` único; el servidor es idempotente (no duplica monedas ni insignias).
- Para los campos acumulativos (tiempo, intentos, clics) se usan operaciones `+=` validadas en el servidor.
- Para los campos “mejor resultado” (`stars`, `best_score`) se aplica `max()`.
- Si dos equipos editan el mismo perfil, gana el mayor avance y se registra el conflicto en `audit_log`; nunca se reduce el progreso del estudiante.
- La importación/exportación JSON sigue disponible como respaldo manual.

### Seguridad y privacidad

- TLS obligatorio; contraseñas con `argon2`; sesiones `HttpOnly`/`SameSite`.
- Los estudiantes usan **código + PIN de aula**, no datos personales; el servidor no guarda nombres completos.
- Límite de intentos y bloqueo temporal en el PIN docente.
- Los reportes solo son accesibles para docentes autenticados de ese colegio.
- Retención configurable y borrado por solicitud del acudiente.

### Por qué no se implementó aquí

El requisito principal era un juego que funcionara en un computador escolar **sin instalar nada ni depender de la red**. Un backend añade infraestructura, mantenimiento y riesgos de privacidad que no son necesarios para la versión de un solo equipo. La interfaz y la lógica ya están preparadas para conectarse a este diseño sin reescribir los 100 niveles.

