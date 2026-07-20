# Fases post-auditoria

Fecha de comparacion: 2026-07-13  
Base revisada: `docs/AUDITORIA_COMPLETA_JUEGO.md` contra el estado actual del repositorio.

## Estado actual confirmado

- 78 heroes, 49 enemigos, 19 jefes, 11 mapas y 38 objetos.
- Rarezas de heroes: Common 10, Rare 18, Epic 22, Legendary 17, Mythic 7, Secret 4.
- 15 agrupaciones con rarezas propias y requisitos variables entre 2 y 6 miembros.
- Rarezas de agrupaciones: Common 1, Rare 4, Epic 4, Legendary 3, Mythic 2, Secret 1.
- 6 sinergias de pareja.
- `npm.cmd run check` pasa con 364 tests tras las fases de interfaz.
- El README estaba desactualizado: mencionaba 52 heroes y 14 grupos.
- El codex de enemigos seguia siendo un pendiente real: la auditoria lo marco como sospecha y se confirmo que los enemigos agrupados no persistian correctamente.

## Hallazgos de la auditoria que ya quedaron obsoletos

- Rarezas antiguas: la auditoria indicaba 8 Common, 44 Rare y 26 Legendary. Ahora existen seis rarezas.
- Agrupaciones fijas 3/5: ahora cada grupo tiene rareza y umbrales propios.
- Sistema de barricada: ya fue retirado del flujo principal.
- Rango visual siempre visible: ya se muestra solo al seleccionar/clickear.
- Mejora rapida desincronizada: ya tiene pruebas que cubren creditos visibles y nivel vivo.
- Tests: la auditoria hablaba de 319; el proyecto ya supera esa cifra.

## Pendientes que siguen vigentes

- Reducir sobrecarga visual y cognitiva.
- Mejorar onboarding/tutorial contextual.
- Mejorar legibilidad de estados, counters y motivos de bloqueo.
- Revisar pixel art smoothing en heroes/enemigos.
- Expandir logros, codex narrativo y evoluciones.
- Medir contribucion tactica de soportes y heroes caros.
- Rebalancear overperformers con datos reales de combate.
- Separar UIManager en paneles mas pequenos.
- Mejorar experiencia mobile/touch.
- Crear audio y telegraphs mas memorables para jefes.

## Fase 1 - Auditoria viva y datos correctos

Objetivo: que la documentacion y el codex reflejen el juego real.

- Actualizar README a 78 heroes, 49 enemigos y 15 agrupaciones.
- Corregir codex de enemigos agrupados `normal/bosses`.
- Agregar pruebas para codex agrupado.
- Dejar esta hoja como plan operativo post-auditoria.

Estado: completada en esta pasada.

## Fase 2 - Claridad tactica

Objetivo: que el jugador entienda por que gana o pierde sin leer demasiado.

- Leyenda de estados con iconos.
- Mensaje claro cuando un heroe no puede ver sigilo.
- Panel "por que perdi vidas" con enemigo, tramo y counter.
- Explicar por que una celda sugerida es buena.
- Mejorar iconografia de counters y prioridades.

Estado: parcialmente completada en esta pasada.

Implementado:

- Leyenda compacta de counters clave por oleada.
- Lectura de cobertura anti-sigilo/faseador antes de iniciar.
- Registro de fugas desde el motor con enemigo, progreso de ruta, vida perdida y counter.
- Informe post-oleada con lectura de fugas.

Pendiente para una subfase visual:

- Explicar por que una celda sugerida es buena dentro del overlay de colocacion.
- Revisar iconografia completa de prioridades y estados en todo el HUD.

## Fase 3 - Onboarding y UI simplificada

Objetivo: bajar friccion de entrada.

- Tutorial contextual de 5 pasos.
- Modo UI simplificada para primeras partidas.
- Panel derecho por tabs o secciones colapsables.
- Radar tactico separado para mover ayudas e inteligencia fuera del panel derecho.
- Boton tactil visible para usar celda sugerida.
- Filtros de equipo por terreno, deteccion, antiarmadura, rol y rareza.

Estado: parcialmente completada en esta pasada.

Implementado:

- Guia tactica contextual de 5 pasos con accion segun estado de partida.
- Ajuste persistente para activar/desactivar la guia tactica.
- Ajuste persistente de interfaz simplificada.
- Clase `simple-ui` aplicada desde progreso para reducir ruido del panel derecho.
- Boton visible para usar celda sugerida.
- Explicacion de celda sugerida con terreno, cobertura, tramo de ruta y distancia al camino.
- Panel derecho compactado: queda enfocado en enemigos de la oleada y controles de pausa, auto, velocidad e inicio.
- Nuevo boton `Radar tactico` junto a Perfil, con inteligencia de oleada, estado de mision, modo, refuerzos, jefe, reportes y archivo enemigo.

Pendiente para una subfase de organizacion:

- Agregar filtros de equipo por terreno, deteccion, antiarmadura, rol y rareza.

## Fase 4 - Pulido visual y sprites

Objetivo: subir presentacion sin rehacer todo el arte.

- Setting de pixel art crisp y revisar `imageSmoothingEnabled`.
- Reducir saturacion/textura en mapas con lectura pesada.
- Jefes mas grandes o con silueta mas clara.
- Telegraphs de jefe por faccion.
- Toggle de VFX reducido separado de reduce motion.

Estado: parcialmente completada en esta pasada.

Implementado:

- Ajuste persistente `Pixel art nitido`.
- Ajuste persistente `VFX reducido`, separado de reducir movimiento.
- Render de sprites y canvas respeta pixel art nitido.
- VFX reducido baja intensidad/duracion y omite rayos pesados.
- Jefes y jefe final tienen silueta mayor.
- Telegraphs de jefe ahora toman color/estilo por categoria.
- Capa visual tactica para HUD, paneles laterales, botones, cartas de heroes, rarezas y modales.
- Cartas del roster muestran badge de rareza dentro de la jerarquia visual.
- Renderer manual de Manhattan pulido con asfalto, carriles, agua con brillo, edificios con volumen, pasto menos repetitivo y montana mas legible.
- Capturas Playwright revisadas en 1366x768 con heroe colocado.
- Set dressing procedural por mapa clasico sin tocar sprites: Avengers HQ, Wakanda, Sanctum, X-Mansion, Knowhere, Latveria, Asgard, Dimension Oscura, Savage Land y The Raft.
- Selector de mapas con acentos visuales por mundo y cartas tematicas.
- Briefing de mision redisenado con hero visual tematico, sigilo tipografico por mapa, resumen operativo, comunicacion y objetivos en tarjetas.
- Briefing de modos especiales alineado al mismo lenguaje visual.
- Perfil redisenado como archivo S.H.I.E.L.D. con cabecera de progreso, tarjetas operativas, contratos, codice, logros y codigos compartibles mas legibles.
- Inventario redisenado como arsenal activo con cabecera de loadout, resumen de sets, ranuras y filtros mas claros.

Pendiente para una subfase artistica:

- Hacer una pasada fina de saturacion/contraste por mapa con capturas comparativas.
- Pulir pantalla de resultados e informes de oleada con el mismo lenguaje visual.
- Redisenar sprites base de heroes por rareza/rol con siluetas mas claras y poses menos genericas.
- Crear telegraphs unicos por jefe/faccion con iconografia propia.

## Fase 5 - Balance y metajuego

Objetivo: hacer que mas heroes y objetos se sientan valiosos.

- Reporte de contribucion tactica: control, marcas, curas, vidas salvadas, armadura rota.
- DPS esperado contra la oleada preparada.
- Rebalance suave de overperformers por coste antes que nerfear fantasia.
- Limitar o redisenar combos de objetos que duplican poder demasiado temprano.
- Presets/loadouts por mapa.

Estado: parcialmente completada en esta pasada.

Implementado:

- Nuevas metricas por heroe: control, rupturas, marcas, deteccion y vidas salvadas.
- Los estados aplicados a enemigos alimentan contribucion tactica automaticamente.
- Luke Cage y curaciones por bajas ya registran vidas salvadas.
- El informe de oleada incluye valor tactico agregado y heroes destacados por soporte/control.
- El MVP de oleada ahora considera aporte tactico ademas de dano y bajas.

Pendiente para subfases de balance:

- DPS esperado contra oleada preparada.
- Simulador comparativo por coste/rareza para overperformers.
- Rebalance suave de heroes con eficiencia extrema.
- Presets/loadouts por mapa.

## Fase 6 - Retencion y endgame

Objetivo: convertir contenido amplio en objetivos a largo plazo.

- Expandir logros.
- Plan integral de evoluciones para todo el roster, sin activacion parcial.
- Contratos semanales por faccion.
- Retos por pareja y por agrupacion.
- Exportar build/replay como codigo compartible.

Estado: parcialmente completada en esta pasada.

Implementado:

- Catalogo ampliado de logros tacticos: valor tactico, vidas salvadas, control, habilidades, sinergias y exploracion.
- Resumen de mision guarda aportes tacticos, agrupaciones activas y faccion enemiga.
- Contratos semanales persistentes con recompensa unica por semana.
- Contratos por defensa limpia, control, agrupacion activa y faccion semanal.
- Panel de perfil muestra contratos semanales, progreso y estado cobrado/pendiente.
- Codigo compartible de build con equipo activo, objetos equipados, evoluciones futuras y ultimo mapa.
- Importador de build valida heroes/objetos desbloqueados y mantiene consistencia de inventario.
- Plan futuro de evoluciones completas documentado en `docs/PLAN_EVOLUCIONES_COMPLETAS.md`.
- Evoluciones parciales retiradas del roster visible para evitar un sistema incompleto hasta producir sprites para todos.
- Retos persistentes por agrupacion y pareja con recompensa unica.
- Perfil muestra retos de agrupacion activos, pendientes y cobrados.
- Codigo compacto de replay con acciones, resumen de mision y build asociada.
- Perfil permite copiar build o replay desde una misma seccion de codigos compartibles.

Pendiente para subfases de endgame:

- Producir sprites de evolucion para todo el roster antes de reactivar `evolutionId`.
- Recompensas cosmeticas o emblemas por completar contratos varias semanas seguidas.

## Fase 7 - Mantenibilidad

Objetivo: que el juego pueda seguir creciendo sin volverse fragil.

- Separar `UIManager` en paneles independientes.
- Schema JSON mas estricto para heroes, enemigos, items y niveles.
- Utilidades compartidas para line targets/endpoints en kits.
- Lazy preload por equipo/mapa.
- Tests de regresion para cada bug encontrado por auditoria.

Estado: iniciada en esta pasada.

Implementado:

- `validate-data` ahora aplica schema de claves permitidas en heroes, enemigos, items y niveles.
- Todos los heroes deben tener visual completo, habilidad, descripcion, nicho, terrenos, tags, rol de formacion y metricas.
- `evolutionId` queda protegido como sistema all-or-none: no se permiten evoluciones parciales del roster.
- Evoluciones declaradas deben existir en `EVOLUTION_CATALOG`, pertenecer al heroe correcto y no apuntar a otro heroe base.
- Tests de integracion del validador verifican contrato actual, bloqueo de evoluciones parciales y bloqueo de campos inventados.
- Utilidad compartida `LineTargeting` para rayos, trayectorias y ataques en linea de Iron Man, Vision, Captain Marvel, Silver Surfer y Cyclops.
- Tests directos para endpoint, filtrado de objetivos vivos/alineados y el caso borde de origen/objetivo coincidentes.
- Schema estricto ampliado a estructuras internas de mapas: `rendering`, `theme`, `mission`, `mechanic` y objetivos.
- Tests de datos bloquean campos inventados dentro de tema, mecanica y objetivos de nivel.
- `special.statModifiers.cooldown` ahora alimenta los cooldowns de habilidades en todos los kits.
- Schema estricto ampliado a `special`: modificadores, efectos, perfiles de proyectil, estilos visuales y colores.
- Tests de datos bloquean campos inventados y valores fuera de rango dentro de `special`.
- Precarga de assets convertida a `AssetPreloader`, orientada a equipo activo, starter pool, mapa actual, tienda y modos especiales.
- Tests de precarga verifican deduplicacion de sprites, assets de mapa reales y bloqueo de recargas repetidas.
- `ModePanel` extrae la presentacion de modos especiales, draft y resultados fuera de `UIManager`, manteniendo compatibilidad de llamadas publicas.
- Tests de `ModePanel` cubren status de modo, acciones disponibles y escape de texto dinamico.

Pendiente para subfases de mantenibilidad:

- Terminar de retirar codigo legacy inalcanzable de modos dentro de `UIManager`.
- Separar mas secciones grandes de `UIManager`: roster, tienda, informes de oleada y briefing de enemigos.
