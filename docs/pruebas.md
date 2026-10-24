# Pruebas y control de calidad

Este documento resume **qué se probó, cómo reproducirlo y qué resultados se obtuvieron** en la versión entregada. El juego no tiene dependencias de npm: las pruebas usan Node.js y un Chrome/Edge en modo headless controlado por DevTools Protocol.

## 1. Entorno de prueba

- Windows 11, Node.js v24.
- Google Chrome estable (headless).
- Pantallas probadas: **1366 × 768** y **1920 × 1080**.
- Servidor local: `node tools/serve.cjs 8123` en `http://127.0.0.1:8123`.

Las pruebas de navegador lanzan una instancia de Chrome con un perfil temporal propio, por lo que **no afectan el progreso real** del usuario. Si Chrome no está en la ruta habitual, define `CHROME_PATH`.

## 2. Cómo ejecutar las pruebas

```bash
# Servidor para las pruebas de navegador
node tools/serve.cjs 8123

# 1) Pruebas unitarias (datos, progreso, evaluación, rutas)
npm test
# equivalente:
node --test tests/levels.test.cjs tests/progress.test.cjs tests/scoring.test.cjs tests/paths.test.cjs

# 2) Recorrido automático de los 100 niveles
npm run smoke

# 3) Flujos de interfaz con ratón simulado (pausa, docente, CSV, impresión, PIN…)
node tests/flows.cjs

# 4) PWA, sin conexión y arranque desde file://
node tests/pwa.cjs

# 5) Accesibilidad básica (nombres accesibles, contraste, etiquetas)
node tests/a11y.cjs

# 6) Capturas de pantalla en dos resoluciones
node tests/screens.cjs

# 7) Pantallas pequeñas (1024×700 y 800×600)
npm run small

# 8) Integridad de archivos y referencias
npm run check

# 9) Arrastre con mouse real y apilado de las piezas
npm run drag
```

Los scripts `smoke`, `flows`, `pwa`, `drag`, `a11y` y `screens` necesitan el servidor local en marcha (o `BASE_URL` apuntando a otro servidor). Cada script abre y cierra su propio Chrome.

## 3. Resultados de la entrega

| Prueba | Resultado |
|---|---|
| Pruebas unitarias Node | **42 / 42 correctas** |
| Recorrido automático de los 100 niveles | **100 / 100 completados**; 300 ⭐, 3.250 monedas, 10 insignias, diploma y progreso conservado tras recargar |
| Flujos de interfaz con ratón | **34 / 34 comprobaciones correctas** |
| Arrastre real y apilado de piezas | **11 / 11 comprobaciones correctas** |
| PWA, modo sin conexión y `file://` | **20 / 20 correctas** |
| Accesibilidad básica | **16 / 16 correctas** |
| Capturas de pantalla | 36 capturas (18 por resolución), sin errores de consola |
| Pantallas pequeñas (1024×700 y 800×600) | Sin desborde horizontal, sin errores y con menús utilizables |
| Errores de JavaScript en consola | **0** en todas las corridas |

Duración aproximada del recorrido completo de los 100 niveles: **7 minutos** en modo automático.

Evidencias:

- `tests/artifacts/full-sweep.log` — salida completa del recorrido de los 100 niveles.
- `tests/artifacts/1366-*.png` y `tests/artifacts/1920-*.png` — capturas de todas las pantallas.
- `tests/artifacts/pwa-offline.png` — juego abierto sin conexión.

## 4. Qué cubren las pruebas unitarias

### `tests/levels.test.cjs`

- Hay exactamente **100 niveles**, 10 por mundo, con ids únicos y orden correcto.
- La validación estructural no reporta errores: plantillas existentes, objetivos, instrucciones, pistas, recompensas y habilidades válidas.
- Cada mundo trabaja su mecánica principal (movimiento, rutas, arrastre, misiones, rueda…).
- Las 21 habilidades del diseño están cubiertas por al menos un nivel.
- La dificultad crece de forma monótona y la primera actividad es muy fácil (3 objetivos grandes, sin clics).
- Los niveles de clic tienen objetivos correctos y datos completos; los de arrastre tienen zonas que aceptan cada pieza; las misiones tienen al menos dos etapas válidas; los laberintos tienen solución y paredes.
- Los tutoriales son breves y tienen pasos.

### `tests/progress.test.cjs`

- El almacenamiento guarda y recupera; los datos dañados se recuperan desde la copia de seguridad; la migración completa perfiles incompletos.
- Exportar e importar un respaldo conserva los perfiles; un archivo inválido se rechaza con mensaje.
- Creación de perfiles, selección, PIN inicial `1234`, cambio de PIN y verificación.
- **Completar los 100 niveles** otorga medallas, cofres, monedas y diploma; la recarga conserva el avance.
- **Las recompensas no se duplican** al repetir un nivel.
- Un perfil nuevo solo tiene disponible el primer nivel; al completarlo se abre el siguiente.
- Las habilidades suben de estado con evidencia en varios niveles distintos.
- Compra y equipamiento de accesorios; desbloqueo de personajes por mundo.
- Construcción del resumen docente, el detalle por nivel y el ranking de actividades difíciles.

### `tests/scoring.test.cjs`

- Sin datos, el indicador es **“Pendiente”** y no se divide por cero.
- Fórmulas de precisión para clic, movimiento, arrastre, rutas, misiones y rueda.
- Estrellas: 1 al completar y hasta 3 según precisión; nunca 0 por completar.
- El resultado incluye detalle legible, mensaje amable y tiempo de referencia.

### `tests/paths.test.cjs`

- Las seis formas de camino generan puntos dentro del tablero y longitudes válidas.
- El remuestreo mantiene un espaciado casi constante.
- Los laberintos tienen solución ortogonal, paredes y desviaciones permitidas.
- La distancia a la polilínea detecta puntos dentro y fuera; las estrellas de ruta están sobre el camino.
- La tolerancia crece en tableros pequeños y usa el ancho del pasillo en laberintos.

## 5. Recorrido automático de los 100 niveles (`tests/smoke.cjs`)

El script:

1. Crea un perfil nuevo desde la interfaz.
2. Instala un “jugador automático” en la página que usa **eventos de puntero** sobre el DOM real (mover, hacer clic, arrastrar, soltar, rueda, ruta).
3. Entra a cada nivel, pulsa **¡Empezar!**, resuelve la actividad y verifica que el nivel quede completado.
4. Cierra el resultado y avanza al siguiente nivel, comprobando el desbloqueo progresivo.
5. Al final recarga la página y verifica que el progreso se conserve.

Casos que cubre de forma explícita: clics fuera del objetivo, objetivos que aparecen uno por uno, clic guiado (primero colocar la flecha), botón derecho, arrastre con retorno al fallar, laberintos, misiones de varias etapas, rueda del mouse, temporizadores opcionales y recompensas.

Resultado: **100 niveles completados** en 436 s, con **300 estrellas**, **10 insignias**, diploma disponible y **100 niveles conservados tras recargar**.

## 6. Flujos de interfaz con ratón (`tests/flows.cjs`)

Usa el ratón real de Chrome (`Input.dispatchMouseEvent`) para probar la interfaz y eventos sintéticos solo dentro del nivel. Comprueba:

| Comprobación | Resultado |
|---|---|
| Creación del perfil desde la interfaz | ✔ |
| Tutorial interactivo de la primera mecánica y práctica correcta | ✔ |
| Inicio del motor tras el tutorial | ✔ |
| Pausa con el botón del HUD | ✔ |
| Estado pausado y reanudación | ✔ |
| Repetir desde la pausa (nuevo intento contabilizado) | ✔ |
| Salir al mapa vuelve al mundo correcto | ✔ |
| Abandono registrado sin borrar recompensas | ✔ |
| El nivel no queda completado al abandonar | ✔ |
| Movimiento reducido aplicado al documento | ✔ |
| Silencio total guardado | ✔ |
| Respaldo exportable e importable | ✔ |
| PIN incorrecto muestra error | ✔ |
| PIN correcto abre el panel docente | ✔ |
| Crear estudiante con código | ✔ |
| Detalle del estudiante | ✔ |
| Descarga de CSV con BOM y cabecera | ✔ |
| CSV incluye al estudiante | ✔ |
| Impresión simulada (área de impresión y llamada a `print`) | ✔ |
| Restablecimiento exige el código exacto | ✔ |
| Restablecimiento borra el progreso del estudiante | ✔ |
| Cambio de PIN | ✔ |
| Perfil conservado al recargar | ✔ |
| Intento en curso registrado | ✔ |
| Nivel no completado sin terminar | ✔ |
| Último nivel recordado | ✔ |
| Sin errores de JavaScript | ✔ |

**34/34 comprobaciones correctas.**

## 7. Arrastre real y apilado de piezas (`tests/drag.cjs`)

Reproduce el gesto completo con el botón izquierdo mantenido (eventos `buttons: 1`, como un mouse real) en el nivel **w5l4 «Cada animal a su establo»**:

- El nivel abre con su introducción y muestra 4 piezas y 2 establos.
- `document.elementFromPoint` en el centro de **cada pieza** devuelve la pieza, no la bandeja. Esta es la comprobación que detecta el fallo: si el CSS deja las piezas debajo de `.drag-tray`, la bandeja se come el `pointerdown` y el arrastre no empieza.
- Las zonas también reciben el puntero.
- Se arrastran las 2 ovejas al establo blanco y las 2 vacas al rojo: cada establo queda en `2/2`, con `drags.ok = 4` y `drags.wrong = 0`.
- El nivel se completa y aparece la pantalla de resultados, sin errores de consola.

**11/11 comprobaciones correctas.**

> El recorrido automático (`smoke`) no detecta este fallo porque dispara los eventos directamente sobre la pieza, sin preguntar al navegador qué elemento hay debajo del cursor.

## 8. PWA, sin conexión y `file://` (`tests/pwa.cjs`)

- El service worker se registra por HTTP y controla la página tras una recarga.
- Se crea la caché `mouse-aventura-v1.0.2`.
- **El CSS y el JS se piden primero a la red**: una corrección llega al recargar aunque la caché tenga una copia anterior. La prueba guarda una copia falsa en la caché y comprueba que no se sirve.
- Al activarse una versión nueva se borra la caché anterior y las pestañas se recargan una sola vez.
- **No hay peticiones a servicios externos**: todos los recursos son locales.
- El manifiesto y los iconos están enlazados y disponibles.
- Con la red desconectada, el juego **abre completo y con los 100 niveles** desde la caché.
- El juego abre desde `file://` sin servidor, el router funciona y el guardado local también.
- En `file://` no se intenta registrar el service worker y la consola queda limpia.

**20/20 comprobaciones correctas.**

## 9. Accesibilidad (`tests/a11y.cjs`)

- Idioma `es-CO` en todas las pantallas.
- Todos los controles visibles tienen **nombre accesible** (texto, `aria-label` o `label` asociado).
- Contraste suficiente en botones primarios y de riesgo, barra de indicaciones, HUD, indicadores y nombres de nivel (≥ 4,5:1 para texto normal; ≥ 3:1 para texto grande).
- Cada pantalla tiene un encabezado principal.
- Los objetivos del juego tienen etiquetas descriptivas y los botones del HUD tienen nombre.
- Existe una región viva (`aria-live`) para anuncios de pantalla y de nivel.
- Sin errores de JavaScript durante la auditoría.

**16/16 comprobaciones correctas.**

> La auditoría de contraste mide fondos sólidos. Los elementos con degradados (por ejemplo el botón JUGAR) se revisaron con la paleta calculada: texto blanco sobre azul oscurecido (#1f7ac0 → #176fb8) y títulos sobre el fondo claro del bosque.

## 10. Casos de prueba manuales recomendados

Antes de usar el juego en clase, un docente puede verificar en 5 minutos:

- [ ] Abrir `index.html` o el servidor local y ver la pantalla de inicio.
- [ ] Elegir avatar y empezar la aventura.
- [ ] Completar el nivel 1 moviendo el mouse (sin clics).
- [ ] Hacer clic en un objetivo grande del Mundo 2 y observar la celebración.
- [ ] Hacer clic fuera de un objetivo y comprobar que el mensaje es amable.
- [ ] Pausar, leer las instrucciones, repetir y volver al mapa.
- [ ] Recargar la página y comprobar que el perfil y el progreso siguen ahí.
- [ ] Abrir el panel docente con `1234`, crear un perfil de prueba, ver el detalle y exportar el CSV.
- [ ] Restablecer el perfil de prueba escribiendo su código.
- [ ] Cambiar el PIN y volver a entrar.
- [ ] Descargar un respaldo e importarlo.
- [ ] Activar “Movimiento reducido”, “Objetivos más grandes” y “Silencio total”.
- [ ] Imprimir el resumen de un estudiante (o guardarlo como PDF).
- [ ] Completar el nivel 100 (o simular el progreso) y comprobar el diploma y su impresión.
- [ ] Probar en la resolución real del computador del aula (1366×768 o 1920×1080).

## 11. Limitaciones conocidas de las pruebas

- El jugador automático usa eventos de puntero sintéticos dentro de la página. Esto ejercita la misma lógica que un mouse real, pero no sustituye una sesión de observación con niños.
- No se automatiza el diálogo nativo de impresión: se verifica que se genere el contenido imprimible y que se invoque `print()`.
- La rueda del mouse se prueba con eventos `WheelEvent`; no se probó con hardware de rueda deteriorada. El nivel incluye una alternativa accesible.
- La auditoría de contraste no cubre todos los degradados ni imágenes; se complementó con cálculo de paleta.
- No hay pruebas automatizadas con lectores de pantalla (NVDA/Narrator). La estructura incluye `aria-label`, roles, foco atrapado en modales y región viva, pero se recomienda una revisión con el lector que use el colegio.
- La sincronización entre computadores no existe y no se prueba: no está implementada.
- El rendimiento se probó en Chrome headless moderno; en equipos muy antiguos conviene verificar la fluidez.

## 12. Cómo interpretar un fallo

Si una prueba falla:

1. Revisa que el servidor local esté en el puerto correcto (`8123`) y que `BASE_URL` coincida.
2. Ejecuta primero `npm test`: los errores de datos son los más fáciles de localizar.
3. Usa `node tests/debug-level.cjs <id>` para depurar un nivel concreto (imprime métricas, objetivos y estado del motor).
4. Las capturas de fallo quedan en `tests/artifacts/` (`smoke-failure.png`, `flows-failure.png`, `debug-*.png`).
5. Los errores de consola de la página se imprimen al final de cada corrida.

## 13. Criterio de aceptación usado

Se consideró la versión lista cuando:

- Los 100 niveles se iniciaron y completaron de forma automática.
- El progreso se conservó al recargar y al cerrar/abrir el navegador.
- Las recompensas no se duplicaron al repetir.
- El panel docente permitió crear, consultar, exportar, imprimir y restablecer.
- Los flujos de pausa, repetir, abandonar y volver al mapa funcionaron.
- El juego abrió sin conexión y desde `file://`.
- No hubo errores de JavaScript en consola.
- La revisión visual en 1366×768 y 1920×1080 no mostró elementos cortados ni inutilizables.
