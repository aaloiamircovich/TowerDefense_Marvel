# Roadmap profesional 3.0

## Diagnostico honesto

La version 2.0 tiene una base tecnica amplia, pero todavia no presenta una experiencia lista para una entrega empresarial. La cantidad de sistemas supera a la calidad percibida del nucleo: hay muchos heroes, mapas y modos, pero el primer minuto, el combate y la identidad visual no comunican el mismo nivel de ambicion.

Durante la auditoria del 23 de junio de 2026 tambien se encontro una regresion que bloqueaba el arranque (`heroId is not defined`). Esto confirma que la suite necesita una prueba de humo del navegador, no solamente pruebas unitarias.

## Comparacion con referentes

### PokeLike y PokePath TD

La referencia indicada mezcla dos productos cercanos. PokeLike usa rutas ramificadas, elecciones excluyentes, armado de equipo y jefes como controles de progreso. PokePath TD lleva esas ideas al tower defense con unidades que suben de nivel y evolucionan durante la partida, rutas con necesidades diferentes, deteccion, control, dano de area, jefes y progreso persistente.

Debemos adoptar su ritmo de decisiones: cada pocos minutos el jugador elige una ruta, una evolucion, una mejora o una respuesta tactica.

### Stark Tower Defense TD

El antiguo juego de Stark Tower sigue siendo reconocible de inmediato por su arte de comic, personajes grandes y fantasia Marvel directa. Miniplay registra mas de 871.000 partidas y una valoracion 4,3/5 con 2.681 votos. Aunque su profundidad es limitada y su tecnologia Flash esta obsoleta, se entiende como Marvel antes de leer una sola etiqueta.

### Bloons TD 6 y Kingdom Rush

- Bloons TD 6 combina siluetas legibles, animacion expresiva, mejoras ramificadas, heroes, cooperativo, desafios y gran volumen de contenido. Steam muestra resenas recientes extremadamente positivas.
- Kingdom Rush concentra la estrategia en pocas torres, especializaciones claras, poderes activos, enemigos con counters y niveles dibujados a mano. Steam tambien mantiene resenas recientes extremadamente positivas.

Los dos demuestran que profundidad no significa llenar la pantalla de datos: las decisiones importantes se leen en segundos y cada accion tiene respuesta visual y sonora.

## Brecha actual

| Area | Super Hero TD 2.0 | Barra profesional |
| --- | --- | --- |
| Primera impresion | Modal oscuro, sprites muy pequenos y marca generica | Fantasia del producto visible en menos de 5 segundos |
| Mapa | Grilla funcional con tiles repetidos | Escenario ilustrado, puntos de interes y camino integrado al mundo |
| Heroes | Identidad mecanica amplia, presencia visual debil | Silueta, escala, animacion, retrato y VFX reconocibles |
| Combate | Mucha informacion lateral, poca respuesta en el centro | Impactos, telegraphs, prioridades y estados legibles sobre el campo |
| Progresion en partida | La mayor parte ocurre fuera de la mision | Mejoras y evoluciones decisivas durante cada partida |
| Onboarding | Explica poco y muestra demasiados conceptos juntos | Tutorial jugable de colocar, mejorar, iniciar y reaccionar |
| Contenido | 31 heroes, 11 mapas y 5 modos con calidad desigual | Menos contenido, pero cada pieza con acabado consistente |
| QA | 180 pruebas logicas y smoke browser de arranque | Smoke test real por viewport, capturas comparadas y cero errores de consola |
| Uso comercial | El NOTICE limita el proyecto a fan demo no comercial | Licencia valida o universo original antes de distribuir |

## Principios de reconstruccion

1. No agregar heroes, mapas ni modos hasta cerrar la vertical slice.
2. Priorizar la informacion que afecta la proxima decision del jugador.
3. Llevar progresion y evolucion al campo de batalla.
4. Usar arte final o prototipos visuales coherentes, no placeholders mezclados.
5. Validar cada fase en navegador a 1280x720, 1366x768 y movil.
6. Ninguna fase se publica con errores de consola, bloqueos o texto cortado.
7. Definir licencia Marvel o rebrand original antes de la release comercial.

## Fase 21 - Gate de estabilidad y producto

**Objetivo:** garantizar que cada build abre, permite jugar y puede evaluarse sin sorpresas.

- Prueba de humo real: cargar, elegir heroe, colocar, iniciar oleada y terminarla.
- Gate de consola sin errores y captura automatizada del primer minuto.
- Pantalla de carga con progreso de assets y recuperacion de guardados corruptos.
- Separar configuracion de desarrollo, demo interna y release.
- Decision empresarial documentada: licencia Marvel o rebrand completo.

**Terminado cuando:** una build limpia completa el tutorial y la primera oleada en los tres viewports objetivo.

## Fase 22 - Vertical slice visual de Manhattan

**Objetivo:** demostrar el acabado final en un solo mapa antes de escalar contenido.

- Redibujar Manhattan con calles, edificios, azoteas, trafico, senaletica y puntos Stark/Hydra.
- Camino integrado al escenario, sin apariencia de grilla de editor.
- Sprites de heroes y enemigos entre 64 y 96 px con siluetas legibles.
- Retratos grandes, tarjetas con comic art y jerarquia tipografica consistente.
- VFX de impacto, proyectiles, estados, criticos y derrota con presupuesto visual.
- HUD mas liviano: recursos y oleada arriba; detalle contextual al seleccionar.

**Terminado cuando:** una captura sin texto permite reconocer Manhattan, el heroe, el enemigo y la direccion del ataque.

## Fase 23 - Nucleo de combate profundo

**Objetivo:** convertir cada despliegue en una decision que evoluciona durante la mision.

- Tres niveles comprables por heroe en partida.
- Dos ramas excluyentes y una habilidad definitiva por heroe de la vertical slice.
- Evoluciones activas durante la oleada, con cambio visible de sprite y kit.
- Enfriamientos y poderes manuales con telegraph de area.
- Economia recalibrada alrededor de colocar, mejorar, vender y guardar para el jefe.
- Limite de despliegue y roles claros para impedir estrategias automaticas.

**Terminado cuando:** al menos tres builds distintas superan Manhattan con ventajas y debilidades demostrables.

## Fase 24 - Oleadas, enemigos y jefes dirigidos

**Objetivo:** que las oleadas cuenten una historia tactica y no parezcan listas aleatorias.

- Diez primeras oleadas disenadas a mano con introduccion gradual de counters.
- Entradas, carriles y objetivos secundarios visibles antes de iniciar.
- Enemigos con silueta, sonido y telegraph propios.
- Jefe con introduccion, tres fases, cambio de patron y ventana de vulnerabilidad.
- Resumen previo corto: amenaza principal, counter recomendado y recompensa.
- Director procedural reservado para variantes posteriores, no para onboarding.

**Terminado cuando:** un jugador puede explicar por que perdio y que cambiaria en el siguiente intento.

## Fase 25 - Campana roguelite de decisiones

**Objetivo:** adoptar la tension de rutas de PokeLike sin perder el combate TD.

- Mapa de operacion con nodos ramificados: combate, elite, evento, tienda, descanso y jefe.
- Elecciones excluyentes con riesgo, recompensa y consecuencias visibles.
- Reclutamiento, objetos y curacion dentro de la run.
- Runs de 20 a 35 minutos con semilla reproducible.
- Tres arquetipos de ruta: segura, tecnologia y alto riesgo.
- Meta progreso desbloquea opciones, no poder bruto infinito.

**Terminado cuando:** dos runs del mismo acto producen equipos y decisiones realmente diferentes.

## Fase 26 - Hub, coleccion y onboarding

**Objetivo:** transformar los paneles actuales en una experiencia de producto coherente.

- Hub diegetico inspirado en una sala de operaciones, sin dashboard generico.
- Tutorial jugable de 3 minutos con objetivos paso a paso.
- Coleccion con retrato, rol, demostracion animada, mejoras y sinergias.
- Constructor de equipo con comparacion directa y alertas de counters faltantes.
- Reducir texto tecnico y revelar sistemas de forma progresiva.
- Guardado, accesibilidad y controles disponibles antes de comenzar una run.

**Terminado cuando:** un usuario nuevo completa una mision sin explicacion externa.

## Fase 27 - Audio, narrativa y respuesta emocional

**Objetivo:** dar peso a cada personaje, oleada y victoria.

- Tema musical por acto con capas de preparacion, combate y jefe.
- Firmas sonoras por heroe y enemigo; limitar repeticion y mezcla saturada.
- Briefings en paneles de comic, dialogos cortos y barks contextuales.
- Camera shake opcional, hit stop breve y animaciones de anticipacion.
- Victoria, derrota y desbloqueos con secuencias propias.

**Terminado cuando:** las acciones principales se reconocen tambien sin mirar el HUD.

## Fase 28 - Modos y contenido bajo nueva barra

**Objetivo:** recuperar solamente el contenido que alcance la calidad de la vertical slice.

- Migrar mapas uno por uno al nuevo pipeline visual.
- Reequilibrar Boss Rush, Supervivencia, Draft y Convoy sobre mejoras en partida.
- Operacion diaria con modificadores curados y comparacion de puntuacion.
- Archivar temporalmente heroes o mapas sin arte, VFX y kit completos.
- Presupuesto de produccion por unidad para evitar volver a priorizar cantidad.

**Terminado cuando:** cada modo se siente intencional y no una variacion numerica de campana.

## Fase 29 - Release candidate empresarial

**Objetivo:** producir un entregable defendible ante QA, producto y legal.

- Matriz funcional, visual, accesible, responsive y de rendimiento.
- Pruebas de sesiones de 15, 30 y 60 minutos con usuarios externos.
- Telemetria opcional para abandono, derrota y elecciones.
- Presupuesto de memoria, carga, FPS y peso de assets por plataforma.
- Revision legal de nombre, personajes, imagenes, musica y distribucion.
- Paquete de release, manual de soporte, changelog y rollback probado.

**Terminado cuando:** producto, QA y legal pueden aprobar la misma build sin excepciones abiertas.

## Referencias auditadas

- PokeLike: https://pokelike.org/
- PokePath TD: https://pokelike.org/game/pokepath-td
- Stark Tower Defense TD: https://www.miniplay.com/game/stark-tower-defense-td
- Bloons TD 6: https://store.steampowered.com/app/960090/Bloons_TD_6/
- Kingdom Rush: https://store.steampowered.com/app/246420/Kingdom_Rush___Tower_Defense/
