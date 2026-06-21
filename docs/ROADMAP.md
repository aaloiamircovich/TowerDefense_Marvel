# Roadmap de Super Hero TD

Este roadmap convierte el prototipo actual en un tower defense pulido, escalable y visualmente coherente. El orden es intencional: cada fase estabiliza la base que necesita la siguiente.

## Estado actual auditado

- 31 heroes definidos; los cinco heroes del equipo central usan sprites direccionales y ataques animados.
- Cinco heroes tienen kits completos y el resto ya comparte el nucleo avanzado de proyectiles y estados.
- 15 enemigos normales y 15 jefes estan definidos para la siguiente fase.
- Hay 67 tests, validacion de datos, CI, audio sintetizado y pipeline de sprites.
- `UIManager.js` aun concentra demasiadas responsabilidades y debe dividirse antes de ampliar la progresion.
- `data/bootstrapData.js` se genera automaticamente desde los JSON fuente.

## Fase 0 - Baseline estable

**Objetivo:** poder cambiar el juego sin romperlo silenciosamente.

- Agregar Vitest o un runner minimo para combate, rutas, oleadas y recursos.
- Validar todos los JSON con esquemas.
- Crear un script que regenere `bootstrapData.js` desde `data/*.json`.
- Agregar comandos `npm test`, `npm run validate` y `npm run build:data`.
- Separar estado de simulacion y render para permitir tests sin canvas.

**Terminado cuando:** una validacion detecta IDs duplicados, sprites ausentes, referencias rotas y rutas diagonales antes de ejecutar el juego.

**Estado:** implementada. Hay tests nativos de Node, validacion de datos/assets, generacion automatica del respaldo y CI de GitHub. Los warnings de sprites pendientes alimentan la Fase 1.

## Fase 1 - Pipeline profesional de sprites

**Objetivo:** eliminar fallbacks visuales y unificar la produccion de assets.

- Adoptar el formato descrito en `docs/SPRITE_PIPELINE.md`.
- Conectar primero Iron Man y Spider-Man con retrato, idle direccional y ataque.
- Crear un `SpriteAnimator` con precarga, estados y fallback seguro.
- Usar atlas cuando el roster crezca para reducir requests y memoria.
- Separar `portrait`, `worldSprite`, `animations` y `projectileVfx` en datos.

**Terminado cuando:** Iron Man y Spider-Man se ven y animan correctamente en selector, roster, mapa y ataque sin crear `Image` durante el game loop.

**Estado:** vertical slice completada. El contrato visual, cache, precarga, ocho direcciones y animacion de ataque estan implementados y validados para Iron Man y Spider-Man. Los heroes restantes pasan a produccion incremental con este mismo contrato.

## Fase 2 - Nucleo de combate confiable

**Objetivo:** que todas las estadisticas y efectos tengan significado real.

- Unificar daño, critico, armadura, resistencias y multiplicadores de tipo.
- Implementar estados: slow, stun, burn, bleed, armor break, knockback y mark.
- Agregar daño de area, cadenas, penetracion y proyectiles retornables.
- Definir prioridades de objetivo por progreso real en la ruta.
- Crear telemetria de DPS, daño total, bajas y oro generado por heroe.

**Terminado cuando:** los resultados de combate son deterministas con semilla y tienen tests para cada efecto.

**Estado:** implementada. El daño usa una fuente aleatoria sembrable, todos los estados del listado tienen lógica real y la telemetría por héroe se muestra en partida.

## Fase 3 - Vertical slice Marvel

**Objetivo:** cinco heroes completos y claramente distintos.

1. **Iron Man:** repulsores, Sobrecarga ARC cada tres ataques y laser penetrante.
2. **Spider-Man:** telaraña acumulable, control de masas y deteccion arácnida.
3. **Capitan America:** escudo con rebotes y aura de liderazgo.
4. **Thor:** rayos encadenados y Tormenta Divina con cooldown visible.
5. **Doctor Strange:** portales que duplican proyectiles y control temporal.

- Cada heroe necesita animaciones, VFX, sonido, habilidad, mejora y nicho tactico.
- Reescribir las descripciones para que reflejen exactamente la implementacion.

**Terminado cuando:** los cinco permiten composiciones diferentes y ninguna habilidad es solo texto.

**Estado:** implementada. Los cinco kits tienen mecanicas, escalado por nivel, cooldown o carga visible, VFX y audio. Capitan America, Thor y Doctor Strange usan animacion procedural mientras sus sprites definitivos recorren el pipeline visual.

## Fase 4 - Enemigos, facciones y jefes

**Objetivo:** oleadas legibles con identidad Marvel.

- Facciones por mapa: Hydra/A.I.M. en Manhattan, Ultrón en Avengers HQ, mercenarios y Outriders en Wakanda.
- Arquetipos: corredor, tanque, escudo, sigilo, volador, invocador y soporte.
- Jefes con fases y telegraphs: Loki, Ultron Prime, Killmonger, Magneto y Thanos.
- El radar debe mostrar resistencias, sigilo, amenaza y recompensa.
- Agregar modificadores de oleada sin depender solo de subir HP.

**Terminado cuando:** el jugador cambia estrategia por composición enemiga, no solo por números más altos.

**Estado:** implementada. Cada mapa genera facciones propias, los siete arquetipos tienen conducta real, cinco jefes usan fases con telegraph y el radar anticipa rol, sigilo, resistencias, amenaza, recompensa y modificadores.

## Fase 5 - Progresion y economia

**Objetivo:** crear decisiones entre partidas sin convertir el juego en espera.

- Guardado versionado en `localStorage` con migraciones.
- Progreso por mapa, estrellas, dificultades y desafíos.
- Arboles de mejora con dos ramas por heroe.
- Inventario con equipar, desequipar, comparar y filtros.
- Tienda con rotacion controlada y proteccion contra duplicados injustos.
- Rebalancear costes mediante simulaciones de oleadas.

**Terminado cuando:** cerrar y abrir conserva progreso, y cada compra compite con otra decision valiosa.

**Estado:** implementada. El guardado versionado conserva equipo, inventario, mejoras, fondos, ajustes y progreso por mapa. Cada heroe dispone de dos ramas persistentes, la tienda rota diariamente sin duplicados injustos y una simulacion automatizada controla costes, recompensas y eficiencia.

## Fase 6 - Campaña Marvel y mapas

**Objetivo:** que cada escenario cambie reglas, no solo colores.

- **Manhattan:** calles bloqueables, alcantarillas y eventos de civiles.
- **Avengers HQ:** puertas de seguridad, torretas auxiliares y cortes de energia.
- **Wakanda:** nodos de Vibranium, escudos cineticos y rutas que reaccionan a eventos.
- Nuevos mapas: Sanctum Sanctorum, X-Mansion, Knowhere y Latveria.
- Briefing, objetivos secundarios, dialogos breves y recompensas tematicas.

**Terminado cuando:** cada mapa exige una composicion y colocacion distinta.

**Estado:** implementada. Manhattan incorpora barricadas, desvios por alcantarillas y convoyes civiles; Avengers HQ combina puerta, torreta y cortes de energia; Wakanda alterna rutas y usa pulsos y escudos de Vibranium. Sanctum, Instituto Xavier, Knowhere y Latveria amplian la campana con facciones, rutas, briefings, objetivos, recompensas y reglas propias.

## Fase 7 - UI, audio y accesibilidad

**Objetivo:** feedback inmediato, ergonomia y personalidad.

- Dividir `UIManager` en paneles y componentes pequeños.
- Tooltips de stats, comparacion antes/despues y cooldowns visibles.
- Escalado responsive real para desktop y tablet.
- Musica y SFX con buses separados y controles de volumen.
- Modo alto contraste, reduccion de movimiento y tamaño de UI.
- Reemplazar `alert()` por modales/toasts integrados.

**Terminado cuando:** las acciones importantes tienen feedback visual y sonoro, y la interfaz puede usarse sin adivinar.

**Estado:** implementada. Campana, perfil y ajustes viven en modulos separados; las estadisticas comparan valores base y efectivos, las habilidades exponen su estado y los controles incluyen tooltips y navegacion por teclado. El audio dispone de buses general, musica y SFX con ambiente por mapa, mientras contraste, movimiento y escala de UI se guardan entre sesiones.

## Fase 8 - Rendimiento, QA y lanzamiento

**Objetivo:** preparar una build compartible y mantenible.

- Object pools para proyectiles/VFX y atlas de sprites.
- Medicion de frame time con 100+ enemigos.
- Tests end-to-end del flujo selector -> colocacion -> oleada -> recompensa.
- CI de GitHub para validar JS, datos y assets en cada push.
- PWA opcional, versionado y changelog.
- Disclaimer claro de fan project no oficial de Marvel.

**Terminado cuando:** 60 FPS estables en el objetivo definido, cero errores de consola y checks verdes en GitHub.

**Estado:** implementada. Proyectiles y VFX usan object pools, los heroes animados se sirven desde atlas y el HUD mide FPS, frame promedio, p95, pico de entidades y reutilizacion. El benchmark de 150 enemigos, 300 proyectiles y 120 VFX queda por debajo del presupuesto de 16.67 ms; la suite cubre 64 pruebas, incluyendo el flujo completo de partida. La version 1.0.0 incorpora PWA actualizable, changelog, control de lanzamiento y aviso de proyecto fan.

## Fase 9 - Produccion visual del equipo central

**Objetivo:** eliminar el arte procedural temporal de la vertical slice de cinco heroes.

- Crear retratos y ocho direcciones para Capitan America, Thor y Doctor Strange.
- Dar a cada uno nueve frames de ataque legibles y tematicos.
- Integrar todos los assets al atlas y a la precarga.
- Mantener un generador reproducible y validar dimensiones, rutas y frames.

**Terminado cuando:** los cinco heroes centrales usan sprites reales en selector, roster, mapa y combate sin depender de fallbacks especiales.

**Estado:** implementada en la version 1.1.0. Capitan America lanza su escudo, Thor alza Mjolnir con relampagos y Doctor Strange abre un sello mistico. El atlas contiene 90 sprites y la suite valida automaticamente los contratos visuales de los tres heroes nuevos.

## Orden de produccion recomendado

1. Fases 0 y 1.
2. Fases 2 y 3.
3. Fases 4 y 5.
4. Fases 6 y 7.
5. Fases 8 y 9.

No conviene producir sprites para los 31 heroes antes de cerrar el contrato de datos, animacion y combate con la vertical slice de cinco heroes.
