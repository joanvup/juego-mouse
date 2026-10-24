# Guía breve para docentes — Mouse Aventura: Pequeños Exploradores

## 1. Qué es y para quién

Mouse Aventura es un videojuego educativo para **primer grado de primaria (6 y 7 años)** que enseña a usar el mouse desde cero. No supone experiencia previa con computadores. Cada niño avanza a su ritmo: los errores no castigan, los niveles se pueden repetir y la ayuda está siempre visible.

El objetivo no es “ganar rápido”, sino desarrollar **coordinación visomotora, precisión, control del movimiento y autonomía** con el mouse.

## 2. Antes de la primera sesión (5 minutos)

1. Abre `index.html` con doble clic o, preferiblemente, sirve la carpeta con `node tools/serve.cjs 8123` y abre <http://127.0.0.1:8123>.
2. Comprueba que el mouse responde y que el clic izquierdo funciona. Evita *touchpads* para esta actividad: la destreza motora que se busca requiere un mouse físico.
3. Ajusta el volumen del computador a un nivel bajo y agradable.
4. Entra a **Ayuda → Practica aquí mismo** y prueba “Mover el mouse” y “Hacer un clic” delante del grupo.
5. Decide si los niños usarán un perfil cada uno o un perfil por equipo. También puedes crear perfiles con códigos desde el panel docente.

> El juego no necesita internet ni instalación. Si se sirve por HTTP, se puede instalar como aplicación y abrir sin conexión.

## 3. Primeros 15 minutos con el grupo

1. Presenta al personaje guía y explica que el mouse se mueve sobre la mesa, no en el aire.
2. Pide que todos muevan el mouse y observen la flecha (sin hacer clic todavía).
3. Muestra el **Mundo 1** en el proyector: “La mariposa curiosa”. La mariposa sigue a la flecha; no hay que hacer clic.
4. Deja que cada niño elija su avatar (Mimo, Luna y, más adelante, otros personajes).
5. Acuerda una señal para pedir ayuda: levantar la mano o tocar el botón 💡.

## 4. Rutina sugerida de una sesión (25–30 minutos)

| Momento | Tiempo | Actividad |
|---|---|---|
| Calentamiento | 5 min | Practicar el movimiento del mouse en **Ayuda**, sin presión. |
| Aventura | 15–20 min | 2 o 3 niveles del mundo en curso. Repetir si hace falta. |
| Cierre | 5 min | Mostrar una insignia o estrella conseguida y comentar qué se aprendió. |

Recomendación: **no más de 25–30 minutos continuos** frente al computador. El juego guarda todo automáticamente; se puede cerrar en cualquier momento.

## 5. Cómo acompañar cada mecánica

- **Mover el cursor (Mundo 1):** “Mueve el mouse despacio, como si acariciaras la mesa”. No hay clics en este mundo.
- **Hacer clic (Mundos 2 y 3):** “Primero la flecha encima, después un clic suave”. Un clic es suficiente; no hace falta doble clic.
- **Seleccionar por color o forma (Mundos 3 y 5):** leer la indicación en voz alta y comparar el objeto con el ejemplo. El juego muestra el nombre del color cuando es la regla.
- **Arrastrar y soltar (Mundo 6):** practicar los tres pasos: *poner la flecha, mantener presionado, mover y soltar*. El tutorial interactivo del primer nivel lo modela.
- **Rutas y laberintos (Mundo 7):** “Avanza despacio y mira un poquito más adelante”. Si el cursor se sale, el avance **no se pierde**.
- **Botón derecho y rueda (Mundos 8 y 9):** son contenidos avanzados y opcionales. Acompáñalos y explica que el botón derecho casi no se usa en las tareas escolares; la rueda solo se practica en un nivel, con alternativa accesible si el mouse no la tiene.
- **Misiones (Mundos 9 y 10):** leer la indicación de cada parte y esperar. No hay tiempo límite obligatorio.

Frases útiles: “Flecha encima, clic suave”, “Despacio es más rápido”, “Si te sales, vuelve a entrar”, “Puedes repetir las veces que quieras”.

## 6. El panel docente

### Entrar

Toca **Panel docente** (pie de la pantalla de inicio o enlace del menú). El **PIN inicial es `1234`**.

> El PIN es una **protección básica local** para evitar entradas accidentales de los niños. Se guarda en el mismo computador; no es seguridad robusta. Si el equipo es compartido, cambia el PIN y no uses el mismo de otras cuentas.

### Crear perfiles

1. En “Crear perfil de estudiante”, escribe un **código interno** (por ejemplo `1A-05`), un nombre o alias opcional y elige el personaje inicial.
2. También puedes dejar el código vacío: el juego asigna `EXP-001`, `EXP-002`…
3. Recomendación: usa códigos en lugar de nombres completos para reducir datos personales. Un nombre corto o alias es suficiente.

### Ver el avance

- **Resumen de la clase:** estudiantes, niveles completados, promedio por estudiante, precisión promedio, estrellas y tiempo total.
- **Estudiantes:** cada tarjeta muestra el avance, estrellas, precisión general, tiempo y pistas usadas.
- **Ver detalle:** progreso por mundo, habilidades con su estado, recomendaciones de refuerzo y una tabla con **los 100 niveles** (estado, estrellas, intentos, abandonos, tiempo, precisión, pistas y última actividad).
- **Actividades que generan más dificultad:** ranking construido con clics fuera del objetivo, pistas y abandonos. Sirve para reforzar antes de avanzar.

### Reportes e impresión

- **Exportar resumen CSV:** una fila por estudiante. Se abre en Excel (incluye BOM y punto y coma).
- **CSV detallado:** una fila por nivel del estudiante seleccionado.
- **Imprimir / guardar como PDF:** resumen individual con mundos, habilidades y recomendaciones.
- **Imprimir resumen** (desde “Mi progreso”): versión para la familia.

### Restablecer o borrar

- **Restablecer:** borra el progreso de un estudiante y conserva su avatar. Exige escribir el código exacto para confirmar.
- **Borrar todos los datos:** elimina todos los perfiles y la configuración del equipo. Descarga un respaldo antes.

### Respaldos

- **Configuración → Descargar copia** o **Panel docente → Exportar todo (JSON)**.
- **Importar** reemplaza los datos del equipo. Úsalo para llevar el progreso de un computador a otro o para recuperar una copia.
- No existe sincronización automática entre equipos: si el colegio necesita compartir progreso, se debe diseñar un backend propio (el juego no lo simula).

### Cambiar el PIN y perderlo

- En **Seguridad del panel** escribe el PIN actual y el nuevo (4 a 6 números).
- Si se olvida el PIN, no se puede recuperar desde el juego: restaura un respaldo JSON o borra los datos del sitio desde el navegador (esto elimina el progreso). Por eso se recomienda mantener un respaldo.

## 7. Cómo leer la evaluación

No hay exámenes ni notas. Cada nivel otorga **1 estrella por completarlo** y hasta 3 según la precisión. El indicador cambia según la actividad:

| Tipo de nivel | Indicador | Qué mide |
|---|---|---|
| Clic y secuencias | Precisión de clic | Clics correctos / clics totales |
| Movimiento del cursor | Control del cursor | Objetivos alcanzados + eficiencia del recorrido |
| Arrastrar y soltar | Aciertos al soltar | Piezas colocadas bien / intentos de soltar |
| Rutas y laberintos | Control del recorrido | Salidas del camino y estrellas recogidas |
| Rueda | Control de la rueda | Avance y clics |
| Misiones | Desempeño de la misión | Promedio de las partes |

Si un indicador no tiene datos, se muestra **“Pendiente”**; nunca se divide por cero ni se etiqueta al niño como fracasado.

**Habilidades:** cada habilidad acumula evidencia en varios niveles. Los estados son *En aprendizaje → En práctica → Logrado → Dominado*. Una habilidad se considera **lograda** cuando hay desempeño consistente en al menos 3 niveles distintos, no por completar una sola actividad.

**Refuerzo:** cuando una habilidad aparece como “En aprendizaje” o “En práctica” con varios intentos, el juego sugiere niveles para practicar. También se puede repetir cualquier nivel desbloqueado.

## 8. Plan de 6 sesiones (sugerencia)

| Sesión | Mundos | Foco |
|---|---|---|
| 1 | 1 | Movimiento, llegar a objetivos y mantener el cursor en una zona. |
| 2 | 2–3 | Clic izquierdo, un solo clic, precisión y elección del objetivo. |
| 3 | 4–5 | Coordinación, objetivos en movimiento, discriminación por color y tamaño. |
| 4 | 6 | Arrastrar, soltar y clasificar; práctica guiada de los tres pasos. |
| 5 | 7–8 | Rutas, laberintos, interfaces de botones y secuencias. |
| 6 | 9–10 | Misiones combinadas, autonomía y diploma. |

En cada sesión conviene empezar por un nivel ya conocido y luego avanzar uno o dos niveles nuevos.

## 9. Accesibilidad y adaptaciones

- **Configuración → Movimiento reducido:** menos animaciones.
- **Objetivos más grandes:** amplía los blancos del juego.
- **Alto contraste:** bordes y textos más marcados.
- **Volúmenes independientes** de música y efectos, y **silencio total**.
- **Sugerencias automáticas:** ofrece una pista si el niño se queda quieto; se puede desactivar.
- El juego se completa **solo con el mouse**; el teclado es opcional (pausa con `Esc`, pista con `H`).
- Los textos no dependen solo del color y los botones principales son grandes.

## 10. Preguntas frecuentes

**No suena nada.** El audio necesita un primer clic en la página (política de los navegadores). Revisa también el volumen y la opción de silencio.

**El progreso no aparece al abrir de nuevo.** Asegúrate de abrir el juego desde la misma ruta y el mismo navegador. Si se borraron los datos del sitio o se usó otro perfil del navegador, restaura un respaldo.

**Se puede jugar sin internet.** Sí, una vez cargado el juego. Para abrirlo sin conexión, instálalo como PWA desde un servidor local o HTTPS.

**¿Se puede usar con tablet?** El juego está pensado para mouse físico; el arrastre con dedo puede funcionar, pero no se evalúa igual. Se recomienda computador de escritorio.

**¿Cuánto tarda en completarse?** Entre 6 y 10 horas de juego efectivo para un niño que empieza desde cero, repartidas en varias sesiones. No hay que completarlo en un solo periodo.

**¿Los datos viajan al colegio?** No. Todo queda en el computador. Usa los respaldos o el servidor interno si necesitas centralizar.

## 11. Privacidad

- No se solicita correo, teléfono ni documento.
- El nombre es opcional; se recomienda usar códigos de estudiante.
- No hay cuentas externas, publicidad, compras ni seguimiento.
- Los reportes los genera el docente y quedan en el equipo.

## 12. Lista rápida antes de entregar el equipo al niño

- [ ] El juego abre y se ve a pantalla completa.
- [ ] El mouse y el clic izquierdo funcionan.
- [ ] El volumen es bajo o está en silencio según el contexto.
- [ ] El perfil del niño está seleccionado (o se creará en el primer inicio).
- [ ] El PIN del panel docente está cambiado si el equipo es compartido.
- [ ] Hay un respaldo reciente si se van a usar varios equipos.
