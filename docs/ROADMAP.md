# Roadmap de Super Hero TD

Este roadmap convierte el prototipo actual en un tower defense pulido, escalable y visualmente coherente. El orden es intencional: cada fase estabiliza la base que necesita la siguiente.

## Estado actual auditado

- 31 heroes definidos, pero 31 rutas `sprite` apuntan a archivos inexistentes.
- Solo Iron Man y Spider-Man tienen assets locales aprovechables.
- 4 heroes tienen logica de habilidad especifica; el resto solo tiene descripcion.
- 15 enemigos normales y 15 jefes definidos.
- No hay tests automatizados, guardado persistente, audio ni pipeline de sprites.
- `UIManager.js` concentra demasiadas responsabilidades y debe dividirse.
- `data/bootstrapData.js` duplica los JSON y necesita generacion automatica.

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

## Fase 2 - Nucleo de combate confiable

**Objetivo:** que todas las estadisticas y efectos tengan significado real.

- Unificar daño, critico, armadura, resistencias y multiplicadores de tipo.
- Implementar estados: slow, stun, burn, bleed, armor break, knockback y mark.
- Agregar daño de area, cadenas, penetracion y proyectiles retornables.
- Definir prioridades de objetivo por progreso real en la ruta.
- Crear telemetria de DPS, daño total, bajas y oro generado por heroe.

**Terminado cuando:** los resultados de combate son deterministas con semilla y tienen tests para cada efecto.

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

## Fase 4 - Enemigos, facciones y jefes

**Objetivo:** oleadas legibles con identidad Marvel.

- Facciones por mapa: Hydra/A.I.M. en Manhattan, Ultrón en Avengers HQ, mercenarios y Outriders en Wakanda.
- Arquetipos: corredor, tanque, escudo, sigilo, volador, invocador y soporte.
- Jefes con fases y telegraphs: Loki, Ultron Prime, Killmonger, Magneto y Thanos.
- El radar debe mostrar resistencias, sigilo, amenaza y recompensa.
- Agregar modificadores de oleada sin depender solo de subir HP.

**Terminado cuando:** el jugador cambia estrategia por composición enemiga, no solo por números más altos.

## Fase 5 - Progresion y economia

**Objetivo:** crear decisiones entre partidas sin convertir el juego en espera.

- Guardado versionado en `localStorage` con migraciones.
- Progreso por mapa, estrellas, dificultades y desafíos.
- Arboles de mejora con dos ramas por heroe.
- Inventario con equipar, desequipar, comparar y filtros.
- Tienda con rotacion controlada y proteccion contra duplicados injustos.
- Rebalancear costes mediante simulaciones de oleadas.

**Terminado cuando:** cerrar y abrir conserva progreso, y cada compra compite con otra decision valiosa.

## Fase 6 - Campaña Marvel y mapas

**Objetivo:** que cada escenario cambie reglas, no solo colores.

- **Manhattan:** calles bloqueables, alcantarillas y eventos de civiles.
- **Avengers HQ:** puertas de seguridad, torretas auxiliares y cortes de energia.
- **Wakanda:** nodos de Vibranium, escudos cineticos y rutas que reaccionan a eventos.
- Nuevos mapas: Sanctum Sanctorum, X-Mansion, Knowhere y Latveria.
- Briefing, objetivos secundarios, dialogos breves y recompensas tematicas.

**Terminado cuando:** cada mapa exige una composicion y colocacion distinta.

## Fase 7 - UI, audio y accesibilidad

**Objetivo:** feedback inmediato, ergonomia y personalidad.

- Dividir `UIManager` en paneles y componentes pequeños.
- Tooltips de stats, comparacion antes/despues y cooldowns visibles.
- Escalado responsive real para desktop y tablet.
- Musica y SFX con buses separados y controles de volumen.
- Modo alto contraste, reduccion de movimiento y tamaño de UI.
- Reemplazar `alert()` por modales/toasts integrados.

**Terminado cuando:** las acciones importantes tienen feedback visual y sonoro, y la interfaz puede usarse sin adivinar.

## Fase 8 - Rendimiento, QA y lanzamiento

**Objetivo:** preparar una build compartible y mantenible.

- Object pools para proyectiles/VFX y atlas de sprites.
- Medicion de frame time con 100+ enemigos.
- Tests end-to-end del flujo selector -> colocacion -> oleada -> recompensa.
- CI de GitHub para validar JS, datos y assets en cada push.
- PWA opcional, versionado y changelog.
- Disclaimer claro de fan project no oficial de Marvel.

**Terminado cuando:** 60 FPS estables en el objetivo definido, cero errores de consola y checks verdes en GitHub.

## Orden de produccion recomendado

1. Fases 0 y 1.
2. Fases 2 y 3.
3. Fases 4 y 5.
4. Fases 6 y 7.
5. Fase 8.

No conviene producir sprites para los 31 heroes antes de cerrar el contrato de datos, animacion y combate con la vertical slice de cinco heroes.
