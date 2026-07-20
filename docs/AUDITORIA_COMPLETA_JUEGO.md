# Auditoria completa de Super Hero TD 2.44.0

> Actualizacion post-auditoria: este documento conserva la foto original del 2026-07-13, pero algunas cifras quedaron desactualizadas por fases posteriores. Ver `docs/PLAN_FASES_POST_AUDITORIA.md` para la comparacion viva: rarezas de heroes en seis tiers, 15 agrupaciones con rareza propia, README actualizado y correccion del codex de enemigos agrupados.

Fecha de auditoria: 2026-07-13  
Proyecto revisado: `C:\Users\W10\Documents\Tower Defense`

## Alcance y metodologia

Esta auditoria se realizo como equipo multidisciplinario: Game Design, Level Design, Programacion Senior, Pixel Art, UI/UX, QA, Retencion y Monetizacion responsable.

Evidencia usada:

- Lectura de `README.md`, `index.html`, `styles.css`, `src/`, `data/`, `assets/`, `test/` y `docs/`.
- Inventario real: 78 heroes, 49 enemigos, 11 mapas, 38 objetos, 5 modos especiales, 5 logros persistidos.
- Validacion: `npm.cmd run validate` paso con 0 errores y 0 advertencias.
- Tests: `npm.cmd test` paso con 319/319 tests.
- Balance: `npm.cmd run balance` paso; eficiencia mediana 0.229, creditos proyectados oleadas 1/5/10: 857 / 2021 / 4246.
- Benchmark: `npm.cmd run benchmark` paso; tick promedio 0.100 ms, p95 0.191 ms contra objetivo <16.67 ms.
- Accesibilidad: `npm.cmd run audit:a11y` paso con 0 errores.
- Release: `npm.cmd run release:check` paso con 0 errores.
- Smoke browser: paso; llego a oleada 2, vidas 13, desvio de ruta 0 px, textos flotantes 4, alerta elite OK, intel enemiga 2.
- Capturas manuales con Playwright del selector inicial, pantalla principal, colocacion, combate y mobile.

Limitaciones:

- No se hizo una partida completa de 50 oleadas en todos los mapas.
- No hay telemetria real de jugadores, cohortes, sesiones ni abandono.
- No hay archivos de musica/SFX externos; el audio es sintetico via Web Audio.
- Se verifico contrato completo de sprites para los 78 heroes; no se inspecciono pixel a pixel cada frame individual.
- No se evaluo monetizacion comercial real porque el proyecto declara ser fan, educativo y sin fines comerciales.

---

## PARTE 1 - RESUMEN GENERAL

Super Hero TD es un tower defense tactico web/PWA inspirado en superheroes. La partida se juega en un canvas central de 800x600 con rutas ortogonales, despliegue de heroes, oleadas escaladas, enemigos con roles, jefes, objetos, sinergias, progresion meta, mapas con mecanicas propias y modos especiales.

Genero principal:

- Tower Defense tactico.

Generos secundarios:

- Coleccion de heroes.
- RPG ligero por niveles, objetos, mejoras, evoluciones y maestrias.
- Roguelite ligero por semillas, ramas de oleada, draft y modos diarios.
- Estrategia de composicion por sinergias y counters.
- PWA arcade/tactica para sesiones cortas.

Publico objetivo:

- Jugadores de tower defense que disfrutan planificar rutas y counters.
- Fans de coleccion de personajes y progresion persistente.
- Jugadores de PC/web que aceptan UI densa y lectura tactica.
- Publico casual avanzado: facil de iniciar, pero con muchos sistemas para dominar.

Plataformas ideales:

- Desktop web: plataforma mas fuerte actualmente por densidad de UI y uso de mouse.
- PWA instalada en PC/tablet: viable.
- Tablet horizontal: viable con ajustes de escala.
- Mobile vertical: funciona por responsive, pero la experiencia se vuelve larga y menos ergonomica para jugar bajo presion.

Inspiraciones evidentes:

- Tower defense clasico tipo Bloons TD / Kingdom Rush en loop de oleadas, upgrades y rutas.
- Juegos de coleccion de heroes por rareza, desbloqueos, equipo y sinergias.
- Juegos tacticos modernos por intel previa de oleada, counters, target priority y reportes post-oleada.
- Universos Marvel por nombres, facciones, heroes, jefes y tono de fantasia de poder.

Que intenta ofrecer:

- Fantasia de "armar un equipo de superheroes" y defender escenarios tematicos.
- Lectura tactica antes de cada oleada: amenaza, salida, counters, botin, ETA y preparacion recomendada.
- Progresion persistente: heroes, objetos, mejoras, maestrias, codex, estrellas y records de modos.
- Variedad por mapas con reglas propias, enemigos con arquetipos, afijos y jefes.

Gameplay loop principal:

1. Elegir o ajustar equipo.
2. Leer la proxima oleada: enemigos, amenaza, counters, recompensa y ruta.
3. Colocar heroes en terreno valido cerca de la ruta.
4. Iniciar oleada.
5. Heroes atacan automaticamente; el jugador observa, selecciona prioridades, mejora, reposiciona o usa decisiones entre oleadas.
6. Obtener creditos de mision, botin y progreso meta.
7. Comprar/reclutar/equipar/mejorar.
8. Avanzar a oleadas, mapas, modos y retos mas dificiles.

---

## PARTE 2 - GAMEPLAY

Como empieza una partida:

- Si no hay progreso, el juego muestra selector inicial con Iron Man, Spider-Man y Capitan America.
- Tras elegir, el jugador entra al mapa guardado o al primer mapa, Manhattan.
- El HUD muestra vidas, creditos, estrellas, nivel, mapa y oleada.
- El panel derecho muestra radar de oleada con faccion, amenaza, defensa actual, enemigos, botin, velocidad, counters, ETA, objetivos y preparacion recomendada.
- El panel izquierdo muestra el equipo y acciones de cada heroe.

Que puede hacer el jugador:

- Seleccionar heroes.
- Colocarlos en celdas validas segun terreno.
- Confirmar colocacion sugerida con Enter.
- Ver cobertura real de ruta.
- Iniciar, pausar, acelerar y activar auto-oleada.
- Seleccionar enemigos para ver datos.
- Seleccionar heroes desplegados para ver stats, equipamiento, habilidades, cobertura y targeting.
- Mejorar heroes con creditos de partida.
- Reposicionar una vez por oleada.
- Vender heroes entre oleadas con 70% de reembolso.
- Cambiar prioridad de objetivo: Primero, Ultimo, Fuerte, Debil, Rapido, Sigilo, Jefe.
- Comprar objetos en tienda diaria.
- Reclutar heroes tipo gacha con pity.
- Equipar objetos por ranura.
- Reciclar y forjar objetos.
- Comprar upgrades meta por arbol.
- Cambiar modo de habilidades en heroes especificos.
- Jugar campana o modos especiales.

Objetivos:

- Evitar que enemigos lleguen al final de la ruta.
- Superar oleadas hasta el limite del modo.
- Completar objetivos secundarios de mapa.
- Derrotar jefes.
- Ganar estrellas, fondos meta, maestrias, logros y records.

Progresion:

- En partida: creditos, colocacion, mejoras de nivel, oleadas, bonus perfecto.
- Meta: fondos S.H.I.E.L.D., heroes desbloqueados, objetos, forja, arboles de mejora, estrellas por mapa, objetivos, records, codex, maestria, evoluciones.

Curva de dificultad:

- La campana arranca guiada: primeras 5 oleadas tienen scripts de apertura y counters legibles.
- Despues entran composiciones por presupuesto de amenaza, afijos y modificadores.
- Cada 10 oleadas aparece jefe.
- Oleada final usa Thanos final con enorme vida.
- Mapas pasan de Facil/Normal/Dificil a Extrema, con mecanicas de mapa mas agresivas.
- El director evita counters imposibles si el equipo no tiene deteccion o penetracion, especialmente al inicio.

Economia:

- Creditos de mision empiezan en 650 y se ganan por bajas, oleada completada y bonus perfecto.
- Recompensa base de oleada: `110 + oleada * 24`.
- Bonus perfecto: `min(140, 24 + oleada * 6)`.
- Mejoras de heroe cuestan `nivel * 120`.
- Fondos meta se ganan por oleada (`18 + oleada * 3`, +100 cada 10), objetivos y maestrias.
- Tienda diaria vende 3 objetos por rotacion y reclutamiento cuesta 500 fondos.

Recompensas:

- Creditos por enemigo.
- Botin de oleada.
- Bonus de oleada perfecta.
- Fondos meta.
- Estrellas por mejor oleada alcanzada.
- Objetivos secundarios.
- Maestrias de heroe (+100 fondos por desafio).
- Logros.
- Objetos y heroes por tienda/reclutamiento.

Penalizaciones:

- Perder vidas por fugas: normal 1, jefe 3.
- En convoy, fugas reducen integridad.
- Perder oleada o vidas lleva a derrota.
- Reposicion limitada.
- Venta bloqueada durante oleada.
- Terrenos invalidos bloquean colocacion.
- Enemigos stealth son invisibles para heroes sin deteccion.

Rejugabilidad:

- 11 mapas con mecanicas distintas.
- 5 modos especiales.
- Rotacion diaria de tienda.
- Operacion diaria con semilla compartida.
- Draft.
- Survival.
- Boss Rush.
- Ramas de oleada: Contencion o Cazar elite.
- 78 heroes y 38 objetos permiten muchas composiciones.

Balance general:

- Muy rico en sistemas.
- Early game guiado y razonable.
- El mayor riesgo no es falta de contenido sino sobrecarga cognitiva.
- Algunas eficiencias base favorecen fuertemente melee/urbano de bajo coste.
- Legendarios de rango alto parecen costar demasiado si se mide solo DPS/coste, aunque compensan con rango, area, control o habilidades.
- Los objetos pueden duplicar poder estimado con combinaciones top; eso da endgame pero puede romper campana si no se controla por disponibilidad.

Relacion entre mecanicas:

- El radar de oleada informa counters.
- Los counters dependen de heroes, items, sinergias y targeting.
- El terreno limita colocacion y da identidad a mapas/heroes.
- Las mecanicas de mapa alteran ruta, control, recursos o presion.
- El director de encuentros adapta oleadas al equipo.
- La economia decide si conviene desplegar, mejorar, ahorrar o comprar.
- Los reportes post-oleada convierten resultados en aprendizaje.
- Progresion meta aumenta opciones, no solo numeros.

---

## PARTE 3 - MECANICAS

Mecanicas existentes:

| Mecanica | Que hace | Variables | Aporte | Integracion | Mejora sugerida |
|---|---|---:|---|---|---|
| Colocacion por grid | Permite desplegar heroes en celdas | gridSize, terreno, coste, rango, ocupacion | Nucleo TD | Muy buena | Mostrar hotkeys y confirmar con gamepad/touch mas claro |
| Terrenos | Agua, pasto, montana, bloqueados, camino | allowedTerrains, terrainRole | Diferencia heroes/mapas | Buena | Normalizar nombres visuales y filtros |
| Cobertura real de ruta | Mide px cubiertos por rango | coveredLength, quality | Enseña colocacion optima | Excelente | Reducir ruido visual en combate |
| Sugerencia de celda | Recomienda mejor celda | score, cobertura, distancia | Baja friccion | Excelente | Boton tactil visible en mobile |
| Oleadas | Spawnea enemigos por cola | currentWave, delay, maxWaves | Ritmo principal | Solida | Mas variedad de timings sonoros |
| Director de encuentros | Compone oleadas por presupuesto | threat, branch, seed, capabilities | Rejugabilidad | Muy buena | Explicar al jugador la rama elegida |
| Aperturas dirigidas | Primeras oleadas guian counters | scripts por mapa | Tutorial implicito | Muy buena | Convertir en tutorial opcional |
| Modificadores de oleada | Rush, shielded, covert, swarm, elite | hp/speed/count/armor/stealth | Variacion | Buena | Iconografia mas grande |
| Ramas de botin | Safe/bounty | threatFactor, rewardFactor | Decision riesgo/recompensa | Buena | Mostrar resultado historico de elegir bounty |
| Jefes cada 10 | Mete picos de dificultad | hp, armor, phases | Momentos memorables | Buena | Mas telegraphs visuales unicos |
| Jefe final | Thanos final en maxWaves | hp 150000, armor .65 | Metaobjetivo | Integrado | Requiere presentacion mas epica |
| IA de movimiento | Enemigos siguen ruta ortogonal | pathIndex, distanceTravelled | Base tecnica | Excelente | Ninguna urgente |
| Snap a ruta | Corrige desvio | closest path point | Evita bugs | Excelente | Mantener |
| Sigilo | Oculta enemigos a no detectores | stealth, canSeeStealth | Counter claro | Buena | Mas feedback cuando un heroe no puede disparar |
| Armadura | Reduce dano | armor, penetration, armorBreak | Profundidad | Buena | Mostrar armor efectiva post-ruptura |
| Resistencias | Reduce por categoria atacante | resistances | Counter adicional | Media | Exponer mas en UI |
| Barreras | Absorben dano y recargan | barrierRatio, recharge | Antiburst | Buena | Mejor barra visual diferenciada |
| Estados | slow, web, stun, burn, bleed, armorBreak, mark, haste, knockback | duration, power, stacks | Gran profundidad | Buena | Leyenda de estados |
| Prioridad de objetivo | Cambia target del heroe | targetingPriority | Control tactico | Excelente | Iconos en vez de texto abreviado |
| Criticos | Dano x2 | critChance | Variacion | Buena | Mostrar DPS esperado |
| Proyectiles | Disparos con perfiles | speed, radius, chain, splash, return | Feedback combate | Buena | Pixel art de proyectil mas consistente |
| Encadenamiento | Rebota proyectiles | chainCount, chainRange, chainFactor | Anti-grupo | Buena | Indicar en tarjeta de objeto/heroe |
| Splash | Dano de area | splashRadius, splashFactor | Anti-grupo | Buena | Mostrar radio al inspeccionar |
| Penetracion | Ignora armadura | armorPenetration | Counter tanques | Buena | Recomendaciones ya lo usan |
| Mejoras en partida | Sube stats por nivel | cost nivel*120, damage*1.18, range+3 | Escala defensa | Buena | Curva de coste mas explicita |
| Venta tactica | Reembolsa 70% | deployedCost | Corrige errores | Buena | Bloquear/avisar si rompe preparacion |
| Reposicion | Mover una vez por oleada | lastRepositionWave | Reduce frustracion | Muy buena | Feedback visual de "usado" |
| Sinergias de familias | Buff por tags | count 3/5, effects | Composicion | Muy buena | Normalizar tags/categorias |
| Sinergias de pareja | Buff por duo | pair heroIds | Fantasia de equipo | Buena | Mas parejas para roster grande |
| Formaciones | Buff por distancia/rol | vanguard/support/artillery radius | Posicionamiento avanzado | Buena | Visualizar antes de colocar |
| Objetos | Modifican stats/perfiles | effects, slot, tier, set | Buildcraft | Muy buena | Evitar power creep tier 4 |
| Sets | Bonus por 2 piezas | set counts | Objetivo de coleccion | Buena | Mostrar sets recomendados por heroe |
| Forja | Sube nivel objeto 1-3 | materials, tier*level*30 | Sink economico | Buena | Mas fuentes de materiales |
| Reciclaje | Dupes a materiales | tier*20 | Mitiga gacha | Buena | UI de comparacion antes de reciclar |
| Tienda diaria | 3 items rotativos | fecha, tier bands | Retencion diaria | Buena | Vista de proxima rotacion no necesaria |
| Reclutamiento | Gacha de heroes | coste 500, weights, pity | Coleccion | Funcional | Cuidado con monetizacion; mantener earnable |
| Pity | Garantiza no common tras 4 | heroPity | Reduce frustracion | Buena | Mostrar probabilidad real |
| Evoluciones | Variante de heroe | 3 evoluciones | Endgame individual | Baja cobertura | Expandir a mas heroes |
| Arbol de mejoras | 6 nodos por heroe | cost, requires, bonuses | Progresion meta | Buena | Diferenciar ramas por rol |
| Maestria | Desafios por heroe | impacto/especialista/protector | Retencion | Basica | Mas desafios especificos por heroe |
| Codex | Descubrimientos | heroes/enemies/items/factions/mechanics | Coleccion | Media | Faltan entradas narrativas reales |
| Logros | 5 hitos persistidos | achievements | Metaobjetivos | Basico | Ampliar fuertemente |
| Replays | Guarda semilla/acciones | seed, actions | QA y competicion | Muy buena | UI para importar/ver replay |
| Modos especiales | Daily, Boss Rush, Survival, Draft, Convoy | maxWaves, score, rules | Retencion | Muy buena | Leaderboards locales/asincronos |
| Convoy | Objetivo movil | integrity, progress | Variante | Buena | Mejor sprite/animacion del convoy |
| Survival | Oleadas infinitas/extraccion | milestones | Endgame | Buena | Recompensas escaladas |
| Draft | Elegir refuerzos | draftPool, pendingDraft | Roguelite | Buena | Ofertas con rareza/rol/counter |
| Boss Rush | Jefes seguidos | boss queue | Desafio | Bueno | Preparacion entre jefes mas interesante |
| Daily | Semilla diaria | dateKey | Retencion D1-D7 | Buena | Compartir codigo de semilla |
| Audio sintetico | Tonos por evento | frequency/duration/volume | Feedback ligero | Funcional | Reemplazar/mezclar con SFX reales |
| VFX | Beams, rings, lightning, burst, text | duration, color, radius | Claridad | Buena | Menos saturacion en mapas brillantes |
| PWA/offline | Manifest/service worker | cache | Portabilidad | Buena | Verificar actualizaciones de cache con UX |
| Accesibilidad | high contrast, reduce motion, ui scale, keybindings | settings | Inclusividad | Buena | Revisar tactil/mobile real |

---

## PARTE 4 - PERSONAJES

Lectura global del roster:

- Hay 78 heroes jugables con contrato visual completo: retrato, 8 direcciones idle y 9 frames de ataque.
- Rarezas: 8 Common, 44 Rare, 26 Legendary.
- Roles de formacion: 22 artillery, 34 support, 22 vanguard.
- Terrain roles: 24 flyer, 34 ground, 9 grass, 7 high, 3 aquatic, 1 amphibious.
- 41 heroes detectan sigilo de base; 37 no.
- Coste: 150 a 760, promedio 365.
- Dano: 15 a 100, promedio 40.77.
- Rango: 70 a 300, promedio 155.38.
- Cadencia: 0.5 a 2.5, promedio 1.44.

Nota de balance: la tabla usa DPS base `dano * cadencia`. La utilidad real puede ser mayor por rango, control, area, deteccion, habilidades, tags, terreno y objetos.

| Heroe | Rol/rareza/categoria | Stats base | Fortaleza | Debilidad | Habilidad/sinergias | Utilidad/balance/diversion |
|---|---|---:|---|---|---|---|
| Iron Man | Artillery, Rare, Tecnologico | $250 / 25 / 160 / 1.5 | Linea antiarmadura, detecta sigilo | Depende de alineacion | Sobrecarga ARC; Avengers/Tecnologia/Rivales; evoluciona a Extremis | Muy buen starter, divertido por laser cada 3/2 ataques |
| Spider-Man | Support, Common, Urbano | $150 / 15 / 110 / 2.2 | Control web, deteccion, coste bajo | DPS bajo | Telarana; Callejero/Tecnologia/Rivales; Iron Spider | Excelente tutorial de control, balance sano |
| Capitan America | Vanguard, Rare, Urbano | $200 / 30 / 100 / 1.2 | Buff cercano, rebotes | Rango corto | Rebote de escudo; Avengers/Rivales | Divertido como ancla; necesita buenas posiciones |
| Thor | Artillery, Legendary, Mistico | $600 / 70 / 180 / 0.8 | Stun/AOE, cadenas | Caro, sin deteccion | Tormenta divina; Avengers/Cosmico/Rivales | Poderoso pero tarda en entrar; fantasia fuerte |
| Hulk | Vanguard, Rare, Mutante | $400 / 80 / 80 / 0.5 | Escala con furia, salto AOE | Rango minimo, lento | Furia gamma; Avengers/Rivales | Muy divertido si hay presion; irregular en mapas abiertos |
| Black Widow | Support, Common, Urbano | $190 / 18 / 130 / 2.0 | Sabotea soportes, detecta | Dano bajo | Sabotaje Widow; Avengers/Callejero/Espias/Rivales | Gran counter, muy util por coste |
| Hawkeye | Artillery, Common, Urbano | $180 / 22 / 220 / 1.1 | Rango, municion manual, detecta | Fragil si falta dano bruto | Carcaj tactico; Avengers/Callejero/Espias/Rivales | Excelente profundidad temprana |
| Black Panther | Vanguard, Rare, Tecnologico | $320 / 35 / 90 / 1.8 | Contraataque, critico, detecta | Rango corto | Carga vibranium; Avengers/Wakanda/Marciales/Rivales | Muy eficiente y tactico |
| Doctor Strange | Support, Legendary, Mistico | $550 / 55 / 200 / 1.0 | Slow global, duplicado, detecta | Caro | Portal mistico; Mistico/Oscuros/Rivales | Muy divertido; alto valor control |
| Captain Marvel | Artillery, Legendary, Cosmico | $650 / 90 / 250 / 0.7 | Rango enorme, vuelo binario | Cara, sin deteccion | Energia binaria; Avengers/Cosmico | Gran fantasia, eficiencia base baja compensada por alcance |
| Wolverine | Vanguard, Rare, Mutante | $420 / 40 / 70 / 2.5 | Top DPS, salto, regen, detecta | Rango minimo | Frenesi regenerativo; X-Men/Mutantes/Rivales | Muy fuerte; candidato a nerf leve |
| Daredevil | Support, Common, Urbano | $150 / 20 / 100 / 2.0 | Radar global, coste bajo, detecta | Rango corto | Radar; Defenders/Callejero/Marciales/Rivales | Sobresale por eficiencia; excelente starter alternativo |
| Ant-Man | Support, Rare, Tecnologico | $190 / 28 / 110 / 1.4 | Modos Pym, detecta | Requiere micro | Escala Pym; Avengers/Tecnologia | Profundo y barato; puede ser demasiado eficiente |
| Star-Lord | Artillery, Common, Cosmico | $220 / 20 / 160 / 1.6 | Doble disparo, municion | Sin deteccion | Blasters elementales; Guardianes/Cosmico/Rivales | Divertido, flexible |
| Groot | Support, Rare, Cosmico | $300 / 45 / 120 / 0.6 | Raices, cura Guardianes | DPS bajo | Muro de raices; Guardianes/Cosmico/Rivales | Mas util que su DPS indica |
| Gamora | Vanguard, Rare, Cosmico | $360 / 42 / 90 / 1.9 | Ejecuta no-jefes, cadenas | Rango corto | Asesina elite; Guardianes/Cosmico/Marciales | Muy fuerte en early/mid |
| Scarlet Witch | Support, Legendary, Mistico | $650 / 65 / 220 / 0.9 | Mark, slow, cadenas, detecta | Cara | Realidad enlazada; Avengers/Mistico/Mutantes/Oscuros/Rivales | Alto techo, coste elevado |
| Vision | Artillery, Legendary, Tecnologico | $520 / 50 / 190 / 1.3 | Modos densidad, penetracion, detecta | Requiere modo correcto | Control de densidad; Avengers/Tecnologia | Muy profundo y satisfactorio |
| Falcon | Support, Common, Tecnologico | $210 / 16 / 150 / 2.1 | Redwing, deteccion compartida | Dano bajo | Redwing; Avengers/Tecnologia | Buen soporte, no carry |
| Winter Soldier | Artillery, Rare, Urbano | $270 / 38 / 180 / 1.3 | Municiones, rango | Sin deteccion base | Arsenal; Callejero/Tecnologia/Espias/Rivales | Flexible y claro |
| Shang-Chi | Vanguard, Rare, Urbano | $410 / 45 / 80 / 2.2 | Top DPS, modos de anillos | Rango corto, sin deteccion | Diez Anillos; Callejero/Marciales | Muy fuerte; vigilar meta melee |
| Moon Knight | Artillery, Rare, Urbano | $250 / 32 / 120 / 1.7 | Ciclo lunar, detecta | Valor variable por fase | Khonshu; Mistico/Callejero/Oscuros/Rivales | Muy divertido, eficiente |
| She-Hulk | Vanguard, Rare, Mutante | $350 / 55 / 90 / 1.1 | Knockback/mark | Sin deteccion | Objecion definitiva; Callejero | Buena defensora final |
| Jean Grey | Support, Legendary, Mutante | $600 / 60 / 210 / 1.0 | Push, Phoenix, detecta | Cara | Fuerza Phoenix; X-Men/Mutantes/Rivales | Buena pero menos eficiente base |
| Cyclops | Artillery, Rare, Mutante | $260 / 40 / 240 / 1.2 | Rango, modo penetrante/rebote, detecta | Menos area sin modo | Visor optico; X-Men/Mutantes/Rivales | Muy buen antiarmadura |
| Storm | Support, Rare, Mutante | $300 / 35 / 200 / 1.4 | Clima, control, rango | Sin deteccion | Diosa clima; X-Men/Mutantes/Rivales | Muy util, balance sano |
| Silver Surfer | Artillery, Legendary, Cosmico | $760 / 100 / 300 / 0.6 | Max rango, modos, detecta | Coste maximo, baja eficiencia base | Poder cosmico; Cosmico | Fantasia premium; necesita escenarios largos |
| Blade | Vanguard, Rare, Mistico | $330 / 36 / 110 / 1.8 | Bleed elites, lifesteal, detecta | Rango corto | Daywalker; Mistico/Callejero/Oscuros/Rivales | Muy buen sustain |
| Ghost Rider | Vanguard, Legendary, Mistico | $520 / 75 / 150 / 0.9 | Burn, pull, boss damage, detecta | Caro | Espiritu venganza; Mistico/Oscuros | Excelente contra jefes |
| Luke Cage | Vanguard, Common, Urbano | $210 / 25 / 85 / 1.4 | Intercepcion de fugas | Rango bajo, sin deteccion | Defensor; Defenders/Callejero | Buen seguro defensivo |
| Domino | Support, Legendary, Mutante | $220 / 20 / 140 / 1.5 | Suerte, desvia fugas, detecta | RNG, DPS bajo | Suerte imposible; X-Men/Mutantes | Barata para legendary; balance raro pero divertido |
| War Machine | Artillery, Rare, Tecnologico | $360 / 48 / 175 / 1.1 | Artilleria y splash por items | Sin deteccion | Artilleria pesada; Avengers/Tecnologia | Solido |
| Nick Fury | Support, Rare, Urbano | $210 / 20 / 180 / 1.8 | Deteccion, espias, soporte | Dano medio | Director SHIELD; Callejero/Tecnologia/Espias | Muy util por intel |
| Wasp | Support, Rare, Tecnologico | $230 / 18 / 135 / 2.5 | Cadencia, slow posible, detecta | Golpes livianos | Picadura Wasp; Avengers/Tecnologia | Buen aplicador de efectos |
| Nova | Artillery, Legendary, Cosmico | $520 / 58 / 205 / 1.0 | Rango y dano cosmico | Sin deteccion | Pulso Nova; Guardianes/Tecnologia/Cosmico | Buen mid/late |
| Quake | Support, Rare, Tecnologico | $290 / 32 / 165 / 1.45 | Slow/ruptura por kit/item, detecta | Dano medio | Onda sismica; Callejero/Tecnologia | Buen counter blindaje |
| Medusa | Support, Rare, Mistico | $280 / 30 / 145 / 1.6 | Control medio | Sin deteccion | Cabello prensil; Mistico/Inhumanos | Correcta |
| Namor | Vanguard, Legendary, Mutante | $470 / 62 / 115 / 0.95 | Agua, dano, Atlante | Sin deteccion | Tridente Atlante; Avengers/Mutantes/Atlanticos/Rivales | Situacional fuerte en agua |
| Iron Fist | Vanguard, Rare, Mistico | $240 / 38 / 105 / 1.55 | Eficiente, marcial | Sin deteccion | Chi Kun-Lun; Defenders/Callejero/Marciales/Rivales | Muy buen melee |
| Punisher | Artillery, Rare, Urbano | $260 / 34 / 190 / 1.55 | Rango y DPS | Sin deteccion | Fuego supresor; Callejero/Espias/Rivales | Muy competitivo |
| Elektra | Vanguard, Rare, Urbano | $235 / 36 / 115 / 1.9 | Mayor eficiencia base | Sin deteccion | Sai letal; Defenders/Callejero/Espias/Marciales | Probable overperformer |
| Jessica Jones | Vanguard, Common, Urbano | $185 / 42 / 95 / 1.05 | Barata y golpe fuerte | Sin deteccion/rango | Golpe privado; Defenders/Callejero | Buena comun |
| Cloak | Support, Rare, Mistico | $300 / 22 / 170 / 1.35 | Deteccion, mistico, soporte | DPS bajo | Manto oscuro; Defenders/Mistico/Oscuros/Rivales | Utilidad defensiva |
| Dagger | Artillery, Rare, Mistico | $285 / 33 / 175 / 1.65 | Rango, detecta | Depende de proyectil | Dagas de luz; Defenders/Mistico/Oscuros/Rivales | Solida |
| Magik | Vanguard, Legendary, Mistico | $540 / 54 / 150 / 1.05 | Mistica/mutante, melee alto | Sin deteccion | Espada alma; X-Men/Mistico/Mutantes/Oscuros/Rivales | Buen late |
| Iceman | Support, Rare, Mutante | $310 / 28 / 165 / 1.55 | Control hielo | Sin deteccion | Cero absoluto; X-Men/Mutantes | Buen anti-runner |
| Shuri | Support, Legendary, Tecnologico | $420 / 38 / 190 / 1.45 | Deteccion, Wakanda, rango | Categoria sin tilde inconsistente | Guanteletes; Wakanda/Tecnologia | Buena, revisar normalizacion |
| Okoye | Vanguard, Rare, Urbano | $260 / 40 / 110 / 1.55 | Marcial eficiente | Sin deteccion | Lanza Dora; Wakanda/Marciales | Muy buena por coste |
| Black Bolt | Artillery, Legendary, Cosmico | $560 / 66 / 170 / 0.9 | Burst tematico | Sin deteccion, categoria inconsistente | Susurro Attilan; Inhumanos/Cosmico | Buen jefe/elite |
| Crystal | Support, Rare, Cosmico | $330 / 32 / 175 / 1.35 | Elemental/control | Sin deteccion | Elementos Attilan; Inhumanos/Cosmico | Correcta |
| Namora | Vanguard, Rare, Atlantico | $300 / 44 / 125 / 1.35 | Agua/marcial | Sin deteccion, categoria inconsistente | Hoja Atlante; Atlanticos/Marciales | Situacional |
| Triton | Support, Rare, Atlantico | $280 / 30 / 160 / 1.45 | Agua + detecta | Categoria inconsistente | Rastreador abisal; Atlanticos/Inhumanos/Cosmico | Buen soporte anfibio |
| Black Cat | Support, Rare, Urbano | $245 / 31 / 135 / 2.05 | Eficiente, detecta | Menos identidad visible en sistemas | Golpe suerte; Callejero/Espias/Rivales | Muy fuerte por coste |
| Elsa Bloodstone | Artillery, Rare, Mistico | $330 / 44 / 170 / 1.3 | Anti oscuro, detecta | Dano medio | Bloodstone; Oscuros/Callejero/Rivales | Solida |
| Gambit | Artillery, Rare, Mutante | $335 / 37 / 165 / 1.55 | Dano estable | Sin deteccion | Carga cinetica; Mutantes/X-Men/Rivales | Solido |
| Hela | Artillery, Legendary, Mistico | $620 / 70 / 180 / 0.85 | Dano alto | Cara, sin deteccion | Espinas Hel; Mistico/Oscuros/Rivales | Buen late |
| Human Torch | Artillery, Rare, Cosmico | $360 / 36 / 175 / 1.65 | Fuego/area potencial | Sin deteccion | Nova Flame; Cosmico/Rivales | Solido |
| The Hood | Support, Rare, Mistico | $310 / 40 / 155 / 1.35 | Detecta, oscuros | Menos rol unico | Pacto demoniaco; Oscuros/Callejero/Rivales | Correcto |
| Psylocke | Vanguard, Legendary, Mutante | $455 / 48 / 135 / 1.55 | DPS alto, detecta, marcial | Coste medio alto | Katana psiquica; Mutantes/X-Men/Marciales/Rivales | Muy fuerte |
| Squirrel Girl | Support, Rare, Urbano | $255 / 24 / 150 / 2.15 | Cadencia y soporte | Sin deteccion | Emboscada improbable; Callejero/Rivales | Buena por tempo |
| Venom | Vanguard, Legendary, Mutante | $500 / 58 / 120 / 1.18 | Dano sostenido | Sin deteccion | Simbionte depredador; Oscuros/Callejero/Rivales | Buen tanque ofensivo |
| Angela | Vanguard, Legendary, Cosmico | $540 / 62 / 150 / 1.05 | Dano alto, flyer | Sin deteccion | Hojas Heven; Cosmico/Marciales/Rivales | Buena |
| Devil Dinosaur | Vanguard, Legendary, Mutante | $575 / 68 / 105 / 0.92 | Golpe fuerte | Rango bajo, sin deteccion | Estampida roja; Rivales | Divertido, necesita mapas cerrados |
| Emma Frost | Support, Legendary, Mutante | $470 / 34 / 180 / 1.45 | Soporte, detecta | DPS medio | Diamante psiquico; Mutantes/X-Men/Rivales | Buena utilidad |
| Magneto | Artillery, Legendary, Mutante | $590 / 55 / 205 / 0.95 | Rango, control magnetico | Baja eficiencia base, sin deteccion | Campo magnetico; Mutantes/X-Men/Rivales | Necesita que su kit destaque mas |
| Peni Parker | Support, Rare, Tecnologico | $345 / 29 / 165 / 1.9 | Detecta, tecnologia | Dano medio | SP//DR Link; Tecnologia/Callejero/Rivales | Buena |
| Adam Warlock | Support, Legendary, Cosmico | $610 / 52 / 205 / 1.0 | Soporte cosmico | Muy caro, sin deteccion | Capullo cuantico; Cosmico/Rivales | Requiere mas payoff visible |
| Deadpool | Vanguard, Legendary, Urbano | $390 / 34 / 155 / 2.05 | DPS alto, coste razonable | Sin deteccion | Regenerativo; Callejero/Espias/Rivales | Muy divertido; vigilar coste |
| Invisible Woman | Support, Legendary, Tecnologico | $430 / 28 / 185 / 1.55 | Detecta, soporte | Dano bajo | Campo invisible; Tecnologia/Rivales | Buena si protege/soporta mas visible |
| Jeff The Land Shark | Support, Rare, Mutante | $260 / 26 / 135 / 1.75 | Amphibious, detecta | Stats medios | Marea amable; Rivales | Nicho divertido |
| Jubilee | Support, Rare, Mutante | $300 / 30 / 170 / 1.75 | Cadencia/rango | Sin deteccion | Fuegos plasmoides; Mutantes/X-Men/Rivales | Solida |
| Loki | Support, Legendary, Mistico | $560 / 42 / 190 / 1.25 | Detecta, mistico/oscuros | Baja eficiencia base | Ilusion real; Mistico/Oscuros/Cosmico/Rivales | Requiere efectos mas visibles |
| Luna Snow | Support, Rare, Cosmico | $340 / 31 / 180 / 1.55 | Detecta, control hielo | Dano medio | Hielo pop; Cosmico/Rivales | Buena |
| Mantis | Support, Rare, Cosmico | $305 / 24 / 175 / 1.65 | Detecta, Guardianes | DPS bajo | Empatia psiquica; Guardianes/Rivales | Soporte correcto |
| Mister Fantastic | Support, Legendary, Tecnologico | $415 / 35 / 175 / 1.45 | Flexible | Sin deteccion | Elasticidad tactica; Tecnologia/Rivales | Correcto |
| Rocket Raccoon | Artillery, Rare, Tecnologico | $335 / 36 / 185 / 1.65 | Rango, detecta, tecnologia | Fragil tematico | Arsenal Guardian; Guardianes/Tecnologia/Rivales | Muy bueno |
| Nightcrawler | Support, Rare, Mutante | $330 / 30 / 145 / 1.85 | Detecta, movilidad tematica | Stats medios | Salto BAMF; X-Men/Mutantes/Mistico | Divertido si el salto se percibe |
| Ms. Marvel | Artillery, Rare, Cosmico | $410 / 44 / 180 / 1.35 | Rango/dano | Sin deteccion | Descarga fotonica; Avengers/Cosmico | Solida |

Diseno y legibilidad visual:

- Todos los heroes tienen sprites completos, lo que es una fortaleza de produccion.
- En canvas se leen mejor como unidades tacticas que como personajes, porque el tamano en juego es pequeno y se superponen anillos, barras, etiquetas y VFX.
- El selector inicial deberia usar retratos o sprites mas grandes para reforzar fantasia.
- `imageSmoothingEnabled = true` en `SpriteAnimator` y fallback puede suavizar el pixel art; para pixel art conviene `false` o una opcion configurable.

Heroes probablemente demasiado fuertes:

- Wolverine, Shang-Chi, Elektra, Daredevil, Black Cat, Iron Fist, Okoye, Gamora.
- Motivo: eficiencia base alta, coste bajo/medio y/o utilidad adicional.

Heroes que podrian sentirse debiles si su kit no se percibe:

- Silver Surfer, Adam Warlock, Magneto, Scarlet Witch, Groot, Thor, Hela, Loki.
- Motivo: coste alto y eficiencia DPS/coste baja; necesitan mostrar claramente su valor de rango/control/area.

---

## PARTE 5 - ENEMIGOS

Lectura global:

- 49 enemigos: 30 normales y 19 jefes.
- Categorias: 8 Urbano, 8 Tecnologico, 13 Cosmico, 12 Mistico, 8 Mutante.
- Arquetipos principales: shield, support, tank, runner, stealth, summoner, flying, commander, phaser, soldier, boss.
- HP normal: 85 a 600; jefes: 3500 a 150000.
- Velocidad: 20 a 110.
- Armadura: 0 a 0.7.
- Sigilo: 7 enemigos lo usan de forma base.

| Enemigo | Grupo | Stats | IA/arquetipo | Dificultad y estrategia |
|---|---|---:|---|---|
| Soldado de Hydra | Normal | HP100, Spd50, $10, Arm0 | shield, barrera | Basico blindado; ensena dano sostenido/perforacion |
| Cientifico A.I.M. | Normal | HP85, Spd55, $12 | support, cura | Prioridad alta; obliga a target support |
| Centinela | Normal | HP500, Spd35, $45, Arm.6 | tank | Exige penetracion/armor break |
| Outrider | Normal | HP120, Spd75, $15, Arm.1 | runner | Exige ralentizacion/cobertura final |
| Guerrero Chitauri | Normal | HP150, Spd50, $18, Arm.2 | shield | Tanque ligero |
| Elfo Oscuro | Normal | HP130, Spd60, $20, stealth | stealth | Exige deteccion |
| Infiltrado Skrull | Normal | HP110, Spd65, $25, stealth | stealth | Deteccion y targeting sigilo |
| Ninja de La Mano | Normal | HP90, Spd90, $22, stealth | runner | Muy peligroso si no hay deteccion/control |
| Simbionte | Normal | HP180, Spd80, $30, Arm.3 | tank | Dano sostenido/ruptura |
| Doombot | Normal | HP200, Spd45, $20, Arm.35 | summoner | Controlar invocaciones |
| Guardia Hellfire | Normal | HP160, Spd50, $20, Arm.15 | support | Foco a soporte |
| Gigante de Hielo | Normal | HP600, Spd30, $50, Arm.2 | tank | Pico de vida, anti-burst |
| Soldado Sakaarano | Normal | HP140, Spd55, $15, Arm.25 | flying | Cobertura/rango |
| Mutante Hermandad | Normal | HP170, Spd60, $25 | support | Soporte medio |
| Dron de Ultron | Normal | HP120, Spd70, $15, Arm.2 | flying | Rango/antiaereo tactico |
| Saqueador Vibranium | Normal | HP125, Spd82, $18, Arm.12 | runner | Control de velocidad |
| Comandante Kree | Normal | HP260, Spd44, $34, Arm.32 | commander | Acelera aliados; prioridad alta |
| Centinela Kree | Normal | HP230, Spd48, $26, Arm.28 | shield | Perforacion |
| Faseador Chitauri | Normal | HP145, Spd72, $28, Arm.08 | phaser | Sigilo temporal; deteccion |
| Deslizador Chitauri | Normal | HP165, Spd78, $24, Arm.12 | flying | Alcance/cadenas |
| Cazador de la Orden | Normal | HP210, Spd86, $36, stealth | runner | Amenaza alta, control/deteccion |
| Magus de la Orden | Normal | HP280, Spd42, $42, Arm.2 | summoner | Prioridad a invocador |
| Traidor Asgardiano | Normal | HP240, Spd58, $34, Arm.25 | soldier | Enemigo medio robusto |
| Hostigador Elfo Oscuro | Normal | HP175, Spd86, $31, stealth | runner | Runner stealth peligroso |
| Sin Mente | Normal | HP390, Spd38, $46, Arm.36 | tank | Tanque de mapa oscuro |
| Fanatico Oscuro | Normal | HP210, Spd64, $37, Arm.16 | support | Soporte ofensivo |
| Raptor Salvaje | Normal | HP150, Spd102, $29 | runner | Control obligatorio |
| Bruto Mutado | Normal | HP440, Spd34, $52, Arm.34 | tank | Perforacion y single target |
| Fugitivo Raft | Normal | HP235, Spd72, $35, Arm.18 | soldier | Presion media |
| Saboteador de Celdas | Normal | HP190, Spd78, $42, stealth | stealth | Deteccion prioritaria en The Raft |
| Loki | Jefe | HP4000, Spd70, $1000, stealth | boss | Deteccion y burst sostenido |
| Doctor Doom | Jefe | HP6000, Spd40, $1500, Arm.5 | boss | Antiarmadura |
| Magneto | Jefe | HP5500, Spd45, $1200, Arm.4 | boss | Dano sostenido |
| Duende Verde | Jefe | HP3500, Spd90, $800, Arm.2 | boss rapido | Control final |
| Red Skull | Jefe | HP4500, Spd50, $1000, Arm.3 | boss | Balanceado |
| Ultron Prime | Jefe | HP7000, Spd40, $2000, Arm.55 | boss | Penetracion alta |
| Kingpin | Jefe | HP8000, Spd30, $1500, Arm.45 | boss tanque | DPS sostenido |
| Kang | Jefe | HP6500, Spd50, $1800, Arm.35 | boss | Solido |
| Apocalypse | Jefe | HP12000, Spd35, $3000, Arm.5 | boss | Gran muro de vida |
| Carnage | Jefe | HP4000, Spd110, $1000, Arm.15 | boss runner | Control extremo |
| Hela | Jefe | HP9000, Spd40, $2500, Arm.3 | boss | Dano sostenido |
| Killmonger | Jefe | HP5000, Spd60, $1200, Arm.4 | boss | Antiarmadura/control |
| Dormammu | Jefe | HP15000, Spd25, $5000, Arm.2 | boss | Larga pelea |
| Galactus | Jefe | HP50000, Spd20, $10000, Arm.7 | boss titan | Prueba de build endgame |
| Thanos final | Jefe final | HP150000, Spd25, $0, Arm.65 | boss final | Requiere composicion optimizada |
| Malekith | Jefe | HP5200, Spd32, $720, Arm.38 | boss | Asgard |
| Baron Mordo | Jefe | HP5600, Spd30, $760, Arm.3 | boss | Dimension Oscura |
| Sauron | Jefe | HP6100, Spd36, $800, Arm.32 | boss | Savage Land |
| Abominacion | Jefe | HP7200, Spd28, $860, Arm.45 | boss | The Raft |

Como obligan a cambiar estrategia:

- Runner: cerrar salida, slow, knockback, prioridad Rapido.
- Stealth/phaser: deteccion, Radar, items tipo EDITH/Baliza.
- Tank/shield: penetracion, armor break, DPS sostenido.
- Support/summoner/commander: target priority y burst temprano.
- Flying: rango, cadenas y cobertura amplia.
- Bosses: single target, fases, mejoras, antiarmadura, control de salida.

Problema: algunos jefes antiguos no declaran faccion/arquetipo/fases tan completos como los nuevos. Esto reduce consistencia de intel y del codex.

---

## PARTE 6 - MAPAS

| Mapa | Dificultad | Mecanica | Flujo y estrategias | Evaluacion |
|---|---|---|---|---|
| Calles de Nueva York | Facil | Evacuacion urbana, convoyes, alcantarillas | Ruta con grandes curvas; enseña cobertura y oleadas limpias | Muy buen mapa inicial; visual brillante puede saturar |
| Base de los Vengadores | Normal | Puerta + torreta, blackout cada 4 oleadas | Enseña defensas del mapa y timing | Buena variedad; blackout debe ser muy visible |
| Reino de Wakanda | Dificil | Ruta alterna, pulso vibranium, escudo de fugas | Pide adaptacion y antiarmadura | Excelente identidad mecanica |
| Sanctum Sanctorum | Dificil | Runas marcan enemigos | Colocar dano alrededor de landmarks | Buen mapa de amplificacion |
| Instituto Xavier | Dificil | Balizas aturden | Defensa por zonas y oleadas limpias | Claro y tematico |
| Knowhere | Extrema | Salvage cada 8 bajas da creditos | Premia matar rapido y snowball | Bueno para economia agresiva |
| Latveria | Extrema | Sabotaje cada 10 bajas rompe armadura | Anti-blindaje y control de oleada | Fuerte identidad contra tanques |
| Asgard | Extrema | Bifrost alterna rutas y adelanta enemigos | Requiere controlar salidas y portales | Muy interesante; alta presion |
| Dimension Oscura | Extrema | Runas alternan slow/haste cada 6s | Timing y reposicion | Muy buena profundidad; puede frustrar sin feedback |
| Savage Land | Extrema | Vegetacion destructible y rutas ocultas | Control de runners y adaptacion | Buena rejugabilidad |
| The Raft | Extrema | Celdas liberan mini-jefes si enemigos heridos cruzan | Evitar dano temprano en zonas malas o burst controlado | Mecanica avanzada y memorable |

Balance de mapas:

- Todos usan rutas ortogonales; tests verifican integridad.
- Varios mapas tienen solo 6 puntos de ruta; The Raft usa 8 y se siente mas complejo.
- Manhattan tiene la mejor funcion tutorial.
- Los mapas extremos tienen mecanicas interesantes, pero requieren telegraphs muy claros.
- El aprovechamiento de espacio es bueno, aunque en desktop los paneles reducen el protagonismo del canvas.

---

## PARTE 7 - SISTEMA DE PROGRESION

Niveles:

- Heroes suben nivel dentro de partida con creditos.
- Coste: `nivel * 120`.
- Dano escala con `baseDamage * 1.18^(nivel-1)`.
- Rango sube `+3` por nivel.

Experiencia:

- No existe XP clasica por heroe. La maestria se completa por desafios de rendimiento.

Monedas:

- Creditos de mision: economia temporal de partida.
- Fondos S.H.I.E.L.D. / metaCredits: economia persistente.
- Materiales de forja: obtenidos al reciclar objetos.
- Estrellas: progreso de mapas.

Desbloqueos:

- Heroes por reclutamiento.
- Objetos por tienda.
- Objetivos de mapa por metricas.
- Logros por hitos.
- Codex por descubrimientos.

Arboles de mejoras:

- Cada heroe usa 6 nodos genericos/especificos desde `HeroUpgradeCatalog`.
- Requieren fondos meta y dependencias.
- Dan dano, rango, cadencia, critico, poder de habilidad y cooldown.

Objetos/equipamiento:

- 3 slots: weapon, armor, artifact.
- 38 objetos, 6 sets.
- Efectos: dano, cadencia, rango, critico, deteccion, agua, splash, cadenas, slow, armor break, penetracion, curacion, low-life buffs.

Talentos/ascensos/evoluciones:

- Hay 3 evoluciones: Iron Man Extremis, Iron Spider, Phoenix.
- Son reversibles y no reemplazan identidad base.
- No hay ascension amplia para todo el roster.

Conexion:

- Jugar oleadas da fondos.
- Fondos compran upgrades/reclutamiento/items.
- Items mejoran heroes.
- Heroes completan maestrias.
- Maestrias y objetivos aumentan fondos.
- Mas heroes/items permiten mas modos/mapas.

Mayor debilidad: el sistema es amplio pero algunas capas estan poco profundas respecto al roster total: solo 3 evoluciones y 5 logros para 78 heroes/11 mapas.

---

## PARTE 8 - LOGROS

Logros existentes:

| Logro | Condicion | Dificultad | Recompensa/incentivo | Evaluacion |
|---|---|---|---|---|
| primera_defensa | Registrar una mision | Muy baja | Reconocimiento inicial | Correcto como onboarding |
| intocable | Victoria con vidas maximas | Media/alta | Prestigio | Buen incentivo a jugar limpio |
| cazajefes | Alcanzar oleada >=10 | Media | Progreso | Correcto, basico |
| maestro | Alguna maestria con 3 desafios | Media | Dominio de heroe | Buen puente a retencion |
| coleccionista | 10 heroes desbloqueados | Media | Coleccion | Buen objetivo D7-D30 |

Problema:

- Solo 5 logros es muy poco para 78 heroes, 11 mapas, 38 objetos y 5 modos.
- No hay recompensas diferenciadas visibles mas alla de estar desbloqueado.

Logros nuevos sugeridos:

- Manhattan sin fugas: completar 10 oleadas en New York sin perder vidas.
- Ingeniero Stark: activar 10 veces Sobrecarga ARC en una mision.
- Red de barrio: ganar con 3 Callejeros activos.
- Contra blindaje: romper 100 armaduras.
- Ojo tactico: derrotar 50 enemigos sigilosos.
- Ultima linea: ganar una oleada con 1 vida.
- Curador improbable: recuperar 10 vidas con objetos/heroes.
- Arquitecto de rutas: usar 25 colocaciones sugeridas.
- Equipo mixto: activar Versatilidad 10 veces.
- Familia completa: activar un tier 5 de cualquier sinergia.
- Forjador: subir 10 objetos a nivel 3.
- Armario Stark: completar set Stark.
- Wakanda Forever: ganar Wakanda sin gastar escudo.
- Portal cerrado: derrotar a Dormammu.
- Jefe final: derrotar a Thanos.
- Daily regular: jugar 7 operaciones diarias distintas.
- Draft perfecto: terminar Draft sin reemplazar el ultimo slot.
- Boss Rush limpio: ganar 3 jefes seguidos sin fugas.
- Convoy intacto: terminar convoy al 100%.
- Superviviente: extraer en wave 30.

---

## PARTE 9 - MISIONES

Misiones principales:

- 11 mapas de campana, cada uno con briefing, speaker, mecanica, objetivos y tema.

Secundarias:

- Cada mapa tiene 2 objetivos secundarios.
- Total: 22 objetivos.

Diarias:

- Operacion diaria: mapa/equipo/semilla compartidos por fecha.

Semanales:

- No existen.

Eventos:

- No existe sistema de eventos temporales persistentes.

Desafios:

- Boss Rush, Survival, Draft, Convoy.
- Ramas de oleada safe/bounty.
- Maestrias por heroe.

Variedad:

- Buena en mapas y modos.
- Insuficiente en misiones recurrentes a largo plazo: faltan semanales, eventos tematicos, contratos por faccion y objetivos por composicion.

---

## PARTE 10 - ECONOMIA

Monedas:

- Creditos: partida.
- Fondos meta: tienda, reclutamiento, upgrades.
- Materiales: forja.
- Estrellas: avance de mapa.

Tienda:

- 3 objetos diarios por bandas de tier.
- Compra con fondos meta.
- Reclutamiento cuesta 500.
- Pity: tras 4 comunes, garantiza no comun si hay candidatos.

Precios de objetos:

- Tier 1: mediana $375.
- Tier 2: mediana $900.
- Tier 3: mediana $1700.
- Tier 4: mediana $2800.
- Min 300, max 4000, promedio 1403.95.

Ritmo:

- Fondos por oleadas y objetivos es generoso al inicio.
- Simulacion: oleada 1/5/10 proyecta creditos de mision 857/2021/4246.
- Build top de 3 ranuras puede llegar a multiplicador estimado 2.01.

Inflacion/riesgos:

- Riesgo de inflacion meta si el jugador farmea oleadas tempranas y compra muchos heroes/items sin nuevos sinks.
- Forja funciona como sink, pero necesita mejor motivacion visual.
- Objetos tier 4 pueden crear salto fuerte de poder.

Falta de incentivos:

- Cuando el jugador ya tenga muchos heroes, el reclutamiento pierde valor.
- El codex no parece recompensar suficientemente.
- Logros no sostienen economia a largo plazo.

Recomendacion:

- Mantener todo earnable.
- Agregar contratos semanales que paguen fondos/materiales.
- Agregar cosmesticos o variantes visuales no comerciales si el proyecto sigue fan.
- Si algun dia fuera IP original, monetizar solo expansiones cosmeticas/QoL no competitivas, nunca poder directo.

---

## PARTE 11 - INTERFAZ UI

Pantallas/paneles:

- Boot screen.
- Selector inicial.
- HUD superior.
- Panel equipo.
- Canvas central.
- Operation banner.
- Toast.
- Radar de oleada.
- Spawn queue.
- Boss HUD.
- Wave report.
- Mission status.
- Enemy info.
- Controles de oleada.
- Overlay modal.
- Perfil, coleccion, inventario, tienda, mapa/campana, ajustes.

Fortalezas UI:

- Mucha informacion accionable.
- Iconos en botones principales.
- CTA de oleada incluye amenaza y bonus perfecto.
- Radar de oleada es excelente para toma de decisiones.
- Preparacion recomendada conecta sistema con accion.
- Tooltips y `aria-live` presentes.
- Responsive no se rompe.

Problemas UI:

- Densidad muy alta.
- Tipografia pequena en panel derecho.
- El mapa compite con paneles y textos.
- En mobile el flujo se vuelve scroll largo.
- El selector inicial desaprovecha sprites/retratos por escala pequena.
- El pixel art del mapa Manhattan es muy saturado: verde/azul fuertes, textura repetida, edificios de alto contraste.
- Los enemigos se leen por iconos/circulos mas que por sprite.
- Algunas etiquetas como "7 pts", "2/5 amenaza", "Counter ideal" requieren aprendizaje.
- En combate, VFX + rango + etiquetas pueden ensuciar la escena.

Accesibilidad:

- Tiene high contrast, reduce motion, escala UI, keybindings y auditoria automatica 0 errores.
- Falta validar con usuarios: daltonismo, touch, lectura pequena, mando real.

Responsive:

- Desktop: fuerte.
- Mobile: funcional, pero no ideal para jugar intensamente.
- Recomendacion: modo mobile con canvas sticky y paneles colapsables.

---

## PARTE 12 - UX

Fluidez:

- Muy buena en primer minuto: elegir, colocar con sugerencia, iniciar oleada.
- Smoke confirma flujo basico real.

Curva de aprendizaje:

- El juego ayuda mucho con radar, preparacion y apertura dirigida.
- Aun asi, la cantidad de sistemas puede abrumar.

Tutorial:

- No hay tutorial tradicional; hay tutorial implicito.
- Recomendable agregar misiones tutorial breves o checklist contextual.

Cantidad de clics:

- Colocar con sugerencia reduce clicks.
- Paneles modales pueden aumentar navegacion para equipo/inventario/tienda.

Frustraciones posibles:

- No entender por que un heroe no dispara a sigilo.
- No entender terreno invalido.
- No entender por que Dimension Oscura acelera enemigos.
- Perder en mapas extremos por mecanicas poco telegrapheadas.
- Mobile requiere demasiado scroll.

Tiempos muertos:

- Entre oleadas son productivos por preparacion.
- Puede haber espera si el jugador ya no necesita tomar decisiones.

Partes que pueden aburrir:

- Primeras oleadas si se juega con composicion muy eficiente.
- Farmeo meta sin objetivos variados.
- Repeticion si los heroes declarativos se sienten demasiado similares.

Sensacion general:

- Juego muy avanzado para proyecto web, con fuerte capa tactica.
- Se siente mas como prototipo profesional denso que como demo simple.

---

## PARTE 13 - DIRECCION ARTISTICA

Estilo grafico:

- Pixel art top-down con UI sci-fi oscura.
- Mapas tematicos por color/acento.
- Heroes con sprites direccionales y ataque.

Paleta:

- UI: azul oscuro, cian, amarillo, verde, rojo.
- Manhattan: verde/azul muy saturado.
- Riesgo: lectura cansada por textura alta y contrastes repetitivos.

Sombras/iluminacion:

- UI usa sombras, bordes y glow.
- Canvas usa tile art mas plano.

Coherencia:

- UI tactica coherente.
- Pixel art de heroes completo.
- Enemigos parecen mas iconograficos en combate.

Escala/siluetas:

- Heroes pequenos; buena lectura de posicion, menos de identidad.
- Enemigos con circulos grandes: lectura tactica excelente, identidad artistica menor.

Mejoras:

- Desactivar smoothing para pixel art.
- Reducir saturacion/textura de tiles de fondo.
- Aumentar presencia de retratos en seleccion y panel de heroe.
- Crear sprites/telegraphs mas unicos para jefes.

---

## PARTE 14 - SPRITES

Inventario:

- 78/78 heroes completos.
- Cada heroe tiene retrato, 8 direcciones y 9 frames de ataque.
- 38 iconos de objetos.
- Tiles manuales de Manhattan y tileset.

Calidad:

- Muy buena cobertura de produccion.
- La consistencia contractual es excelente.
- Falta inspeccion artistica individual frame a frame.

Animaciones:

- Ataque no loop de 9 frames a 16 FPS.
- Idle direccional, no necesariamente animado.

Legibilidad:

- En canvas se pierde identidad por escala y overlays.
- En selector inicial los sprites son demasiado chicos.

Proporciones:

- Visual size 96, render en heroe 36/fallback; puede haber perdida de detalle.

Direccion de movimiento:

- No hay movimiento de heroes salvo saltos/teleports; direccion de ataque funciona por `faceVector`.

Sprites que necesitan rehacerse:

- No se detecto asset faltante.
- Prioridad no es rehacer sino ajustar render/escala/smoothing y revisar manualmente los heroes mas pequenos o con paleta parecida.

---

## PARTE 15 - EFECTOS VISUALES

Existentes:

- Beams.
- Rings.
- Lightning.
- Burst.
- Floating text.
- Telegraphs de jefe/elite.
- Barreras.
- Pips de estados.
- Linea de target intent.
- Cobertura de rango.
- Rutas resaltadas.

Fortalezas:

- Feedback muy claro.
- VFX estan poolizados.
- Texto flotante configurable.
- Boss/elite tienen telegraph y HUD.

Debilidades:

- No hay sacudida de camara.
- No hay particulas complejas.
- Algunos efectos son geometricos/abstractos, no pixel-art puros.
- Riesgo de exceso visual con muchos heroes.

Mejoras:

- Hit spark pixelado por categoria.
- Animacion especial unica por jefe.
- Efectos de curacion mas legibles.
- Toggle "VFX reducido" separado de reduce motion.
- Screen shake leve para jefes, desactivable.

---

## PARTE 16 - SONIDO

Musica:

- Ambient sintetico por dos tonos segun mapa.
- No hay musica compuesta.

SFX:

- Cues generados via osciladores: repulsor, arc, web, shield, thunder, portal, gamma, etc.
- Hay buses master/music/sfx y volumen configurable.

Feedback:

- Funcional y muy liviano.
- Diferencia eventos principales.

Debilidades:

- Identidad sonora limitada.
- Poca variedad temporal.
- Puede sonar prototipo si se compara con juegos comerciales.

Mejoras:

- Capas musicales por mapa.
- Stingers para jefe, victoria, derrota y oleada perfecta.
- SFX pixelados/8-bit por categoria.
- Variacion aleatoria ligera de pitch.
- Limiter/mezclador para evitar fatiga en oleadas densas.

---

## PARTE 17 - RENDIMIENTO

Resultados:

- Benchmark 150 enemigos / 300 proyectiles / 120 VFX: promedio 0.100 ms, p95 0.191 ms.
- Objetivo 60 FPS: margen enorme en logica simulada.
- Pool de proyectiles y VFX presente.
- Smoke browser OK.

Cuellos potenciales:

- DOM denso en paneles y full UI.
- Re-render de roster/paneles durante combate.
- Preload de todos los sprites de 78 heroes puede afectar arranque.
- Canvas con muchos overlays y texturas repetidas.
- `imageSmoothingQuality = high` puede costar y suavizar pixel art.

Carga de recursos:

- Muchos PNG pero atlas existe.
- Service worker/PWA mejora offline.

Organizacion:

- Buena separacion por sistemas.
- Tests de rendimiento presentes.

---

## PARTE 18 - CODIGO

Arquitectura:

- Modular y bastante profesional.
- Sistemas separados: GameLoop, Input, UI, Resources, Waves, Progression, Shop, Missions, Modes, Replay, Audio, VFX.
- Datos declarativos en JSON.
- Tests amplios.

Escalabilidad:

- Alta para agregar heroes declarativos, objetos, mapas y enemigos.
- Media para habilidades unicas: hay varios KitSystems pero pueden crecer demasiado.

Buenas practicas:

- Object pools.
- Validacion de datos.
- Migracion de saves.
- Smoke browser.
- Auditoria a11y.
- Semillas deterministas.
- Sanitizacion de save.

Posibles bugs/riesgos:

- Normalizacion inconsistente de categorias/tags: Tecnologico/Tecnologico con tilde, Cosmico/Cosmico, Atlantico/Atlanticos.
- Algunos jefes tienen datos menos completos que enemigos nuevos.
- `discoverCodex('enemies')` parece esperar estructura plana, pero `data.enemies` esta agrupado en normal/bosses; revisar si descubrimiento enemigo persiste correctamente.
- `imageSmoothingEnabled = true` afecta pixel art.
- `README` dice 52 heroes, pero datos reales tienen 78.
- Mobile funcional pero no optimizado como experiencia tactil.

Duplicacion/complejidad:

- Hay logica similar de line targets/endpoints en varios kits.
- KitSystems pueden crecer a un "god layer" por familia.
- UIManager es grande y concentra muchas responsabilidades.

Mantenibilidad:

- Muy buena por tests.
- Mejoraria separando render de paneles en componentes mas pequenos y normalizando schemas.

---

## PARTE 19 - BALANCE

Meta actual probable:

- Early/mid favorece heroes eficientes de bajo coste con control/deteccion: Daredevil, Spider-Man, Black Widow, Hawkeye, Iron Man.
- Si el jugador desbloquea melee eficientes, Wolverine/Shang-Chi/Elektra/Black Cat/Okoye pueden dominar por DPS/coste.
- Late depende de antiarmadura, cadenas, control y rangos largos.

Demasiado fuertes:

- Wolverine: top DPS bruto y eficiencia alta, detecta y tiene salto/regen.
- Elektra: eficiencia base mas alta.
- Daredevil: comun barato con deteccion global.
- Black Cat: eficiencia alta + deteccion.
- Shang-Chi: DPS enorme con modos.
- Gamora: execute no-jefes y buen DPS.

Debiles o poco evidentes:

- Adam Warlock, Magneto, Loki, Silver Surfer, Groot si el jugador mira solo DPS.
- Necesitan UI de contribucion: dano mitigado, vidas salvadas, control aplicado, distancia cubierta.

Mecanicas inutiles:

- Ninguna claramente inutil, pero codex/logros estan subdesarrollados.

Objetos rotos:

- Gema del Poder + Reactor ARC + Alas Wasp u otras combinaciones de cadencia/dano pueden duplicar poder.
- Contrato Stark puede generar economia fuerte en heroes de mucha cadencia.

Estrategias dominantes:

- Colocar heroe eficiente cerca de curva con cobertura excelente.
- Stack de cadencia + dano.
- Deteccion temprana evita problemas de sigilo.
- Melee de alto DPS en curvas cerradas.

Recomendacion de balance:

- No nerfear solo por DPS: primero medir dano real por mapa/oleada.
- Agregar "contribucion tactica" al reporte para soportes.
- Ajustar costes de overperformers en +5% a +12% antes que reducir fantasia.

---

## PARTE 20 - RETENCION

Probabilidad D1:

- Alta. El primer flujo es claro, el selector es simple y la colocacion sugerida ayuda.

Probabilidad 1 semana:

- Media-alta. Hay tienda diaria, mapas, modos y coleccion. Falta rutina semanal/eventos.

Probabilidad 1 mes:

- Media. El roster y objetos sostienen, pero logros/evoluciones/codex son insuficientes para largo plazo.

Probabilidad 6 meses:

- Baja-media sin contenido vivo. Necesita temporadas, eventos, leaderboards o retos semanales.

Probabilidad 1 ano:

- Baja como proyecto actual. Subiria si se vuelve IP original, con updates, social, eventos y endgame.

Por que:

- El juego tiene profundidad sistemica real.
- La retencion esta mas limitada por objetivos a largo plazo, variedad recurrente y presentacion que por cantidad de contenido base.

---

## PARTE 21 - CONTENIDO

Contenido existente:

- 78 heroes.
- 49 enemigos.
- 19 jefes.
- 11 mapas.
- 22 objetivos secundarios de mapa.
- 38 objetos.
- 6 sets de objetos.
- 14 familias/sinergias.
- 6 sinergias de pareja.
- 3 evoluciones.
- 5 modos especiales.
- 5 logros.
- 3 desafios de maestria por heroe.
- Codex por heroes/enemigos/items/facciones/mecanicas.
- Replays.
- PWA/offline.
- Ajustes accesibles.

Horas aproximadas:

- Primer contacto: 20-40 minutos.
- Completar primeras 10 oleadas en varios mapas: 2-4 horas.
- Explorar campana completa casual: 6-12 horas.
- Desbloquear/probar roster y objetos: 20-40+ horas segun ritmo de fondos.
- Endgame real actual: limitado; sin temporadas/social, puede agotarse al completar mapas/modos principales.

---

## PARTE 22 - COMPARACION

Vs Kingdom Rush:

- Hace mejor: composicion de heroes, objetos, radar tactico, progreso meta.
- Hace peor: claridad visual, narrativa, polish sonoro, niveles hechos a mano con setpieces.
- Le falta: personalidad artistica propia y tutorial premium.

Vs Bloons TD:

- Hace mejor: fantasia de equipo, heroes individualizados, mapas con objetivos.
- Hace peor: claridad de masas, escalado infinito, economia hyperpulida.
- Le falta: sandbox/endgame infinito mas robusto.

Vs Arknights:

- Hace mejor: partida mas rapida y accesible en web.
- Hace peor: profundidad posicional, produccion audiovisual, historia.
- Le falta: roles mucho mas definidos por clase y tutorial de retos.

Diferenciador:

- Tower defense de superheroes con lectura tactica previa de oleada y equipo coleccionable en PWA.

---

## PARTE 23 - FORTALEZAS

- Muchisimo contenido real.
- 78 heroes con sprites completos.
- Arquitectura modular.
- 319 tests pasando.
- Validacion, benchmark, release check, smoke y a11y automatizados.
- Director de oleadas inteligente.
- Radar de oleada accionable.
- Colocacion sugerida y cobertura real.
- Sistemas de mapa variados.
- Replays por semilla.
- PWA/offline.
- Objetos/sets/forja.
- Modos especiales.
- Accesibilidad basica muy por encima de prototipo comun.
- Alto potencial de retencion si se expande endgame.

---

## PARTE 24 - DEBILIDADES

Ordenadas por importancia:

1. Sobrecarga visual y cognitiva: demasiada informacion simultanea.
2. UI mobile funcional pero no ideal para jugar.
3. Audio sin identidad comercial.
4. Logros y eventos muy subdesarrollados frente al contenido total.
5. Solo 3 evoluciones para 78 heroes.
6. Balance con overperformers claros por eficiencia.
7. Heroes de soporte/caros pueden no comunicar valor.
8. Mapas brillantes/texturados reducen legibilidad.
9. Enemigos se leen mas como iconos que como personajes.
10. README desactualizado respecto al roster real.
11. Posibles inconsistencias de categorias/tags.
12. Algunos jefes menos completos en datos.
13. UIManager y kits pueden crecer en complejidad.
14. Falta social/leaderboards/endgame persistente.
15. Monetizacion comercial bloqueada por IP fan.

---

## PARTE 25 - ROADMAP DE MEJORAS

Cambios urgentes:

- Actualizar README: 78 heroes, 49 enemigos, estado real.
- Normalizar categorias y tags.
- Revisar codex de enemigos con data agrupada.
- Cambiar pixel art a render crisp o agregar setting.
- Mejorar legibilidad de Manhattan bajando saturacion de tiles.

Cambios importantes:

- Tutorial contextual de 5 pasos.
- Leyenda de estados.
- Panel de contribucion de soportes.
- Rebalance inicial de overperformers.
- Expandir logros.
- Expandir evoluciones a 12-15 heroes clave.

Cambios recomendados:

- Modo UI simplificada.
- Collapse/expand de panel derecho.
- Comparador de objetos.
- Mas parejas de sinergia.
- Mas jefes con fases declarativas.

QoL:

- Boton "usar sugerencia" visible en mobile.
- Filtros por rol, terreno, deteccion, antiarmadura.
- Presets de equipo.
- Favoritos.
- Marcador de "ya reposicionado".

Contenido nuevo:

- Mapas de tutorial.
- Mapas de reto con restricciones.
- Contratos semanales.
- Eventos por faccion.

Nuevos modos:

- Puzzle Defense.
- Endless con mutadores acumulativos.
- Draft diario.
- Gauntlet de facciones.
- Defensa inversa con ruta variable.

Nuevos personajes:

- Priorizar heroes con roles faltantes: detectores acuaticos, soportes antiarmadura, controladores de flying.

Nuevos enemigos:

- Enemigos que bloqueen targeting.
- Enemigos con escudo frontal.
- Enemigos que dividan en dos.
- Enemigos que desactiven zonas temporalmente.

Nuevos objetos:

- Objetos de utilidad no solo dano.
- Objetos que cambien targeting.
- Objetos de economia con limites.
- Objetos de terreno.

Nuevas mecanicas:

- Clima de mapa.
- Cobertura por altura.
- Objetivos defendibles.
- Draft de objetos entre oleadas.
- Fatiga de heroes en modos largos.

Mejoras visuales:

- Tiles menos ruidosos.
- Jefes mas grandes.
- VFX pixelados.
- Retratos grandes.

Mejoras UI:

- Jerarquia tipografica mas clara.
- Panel derecho por tabs.
- Iconos para estados/counters.
- Modo compacto real.

Mejoras UX:

- Tutorial.
- Feedback de "no puede ver sigilo".
- Explicar por que una celda es ideal.
- Informes menos densos.

Rendimiento:

- Lazy preload por equipo/mapa.
- Reducir DOM updates.
- Pixel smoothing configurable.

Tecnicas:

- Schema JSON estricto.
- Normalizador de tags.
- Separar UIManager.
- Compartir utilidades de lineTargets.

Eventos:

- Semana Hydra.
- Invasion Kree.
- Crisis Mistica.
- Escape de The Raft.

Sistema social:

- Leaderboards locales/por semilla.
- Exportar replay.
- Compartir build.

Personalizacion:

- Skins cosmeticas si la IP fuera original.
- Banners de perfil.
- Bordes de cartas por maestria.

Progresion/endgame:

- Ascension por heroe.
- Maestria especifica.
- Modificadores infinitos.
- Mapas heroic/nightmare.

Accesibilidad:

- Paletas daltonismo.
- Tamano de texto por panel.
- Pausa automatica al abrir modal.
- Touch mode.

Monetizacion responsable:

- En este proyecto fan: no monetizar.
- Si se convierte a IP original: vender cosmeticos, expansiones de contenido o supporter pack; nunca vender poder, nunca energia, nunca paywalls de counters.

---

## PARTE 26 - 50 IDEAS NUEVAS ESPECIFICAS

1. Panel "Por que perdi vidas" con enemigo, tramo y counter recomendado.
2. Replay fantasma de la fuga mas peligrosa.
3. Contratos por faccion: "Derrota 80 Hydra con 2 Callejeros".
4. Modo Puzzle con creditos y equipo fijos.
5. Indicador de "este heroe no puede ver sigilo" sobre el heroe.
6. Modo entrenamiento de estados.
7. Set de objetos de control puro.
8. Evolucion para Capitan America con aura defensiva.
9. Evolucion para Thor con cadena de rayos o tormenta persistente.
10. Evolucion para Wolverine con mas regen pero menos rango.
11. Mini-bosses con debilidad visible por categoria.
12. Rutas con semaforos/puentes que cambian cada oleada.
13. Eventos de mapa con civiles opcionales que dan fondos.
14. "Plan recomendado" de 3 acciones antes de oleada.
15. Comparador DPS esperado vs oleada.
16. Score de cobertura por equipo completo.
17. Heatmap de dano por tramo.
18. Heatmap de fugas.
19. Historial de MVP por mapa.
20. Maestrias especificas por heroe, no solo 3 genericas.
21. Cartas de reto semanal con mutadores.
22. Draft de objetos cada 5 oleadas en Survival.
23. Boss Rush con tienda entre jefes.
24. Convoy con upgrades del convoy.
25. Modo "Sin legendarios".
26. Modo "Solo terreno agua/montana".
27. Sistema de fatiga opcional para fomentar roster amplio.
28. Loadouts por mapa.
29. Boton "equipo recomendado contra esta oleada".
30. Codex con consejos desbloqueados tras perder.
31. Filtro "detecta sigilo".
32. Filtro "rompe armadura".
33. Filtro "control de runners".
34. Reto "sin vender".
35. Reto "sin mejorar".
36. Reto "oleadas bounty obligatorias".
37. Enemigo disruptor que cambia prioridad de heroes cercanos.
38. Enemigo espejo que refleja parte del dano hasta romper barrera.
39. Enemigo split que se divide al morir.
40. Enemigo hacker que apaga torre auxiliar.
41. Jefes con partes/escudos direccionales.
42. Alarmas visuales de salida con color por tiempo estimado.
43. UI de estado compacta sobre enemigos solo al hover/seleccion.
44. Retratos animados en selector inicial.
45. Skins de mapa desbloqueables no comerciales.
46. Temporizador opcional de preparacion para modo competitivo.
47. Semilla compartible para daily.
48. Exportar build como codigo.
49. Galeria de sprites por heroe en codex.
50. "Lecciones tacticas" tras oleada que se guardan como tips vistos.
51. Misiones de pareja: ganar con Iron Man + Capitan America.
52. Objetos malditos con bonus fuerte y penalizacion.
53. Mutadores de clima por mapa.
54. Botin de "pieza de set garantizada" al completar objetivos perfectos.
55. Modo foto/replay para capturar oleadas.

---

## PARTE 27 - EVALUACION FINAL

| Apartado | Puntuacion |
|---|---:|
| Gameplay | 8.2 |
| Diversion | 8.0 |
| Profundidad | 8.8 |
| Balance | 7.0 |
| Contenido | 8.7 |
| Arte | 7.0 |
| Sprites | 8.5 |
| Animaciones | 7.4 |
| UI | 7.2 |
| UX | 7.6 |
| Sonido | 5.4 |
| Optimizacion | 8.8 |
| Progresion | 7.8 |
| Retencion | 7.2 |
| Originalidad | 7.0 |
| Dificultad | 7.6 |
| Rejugabilidad | 8.1 |
| Calidad tecnica | 8.7 |
| Calidad artistica | 7.1 |
| Potencial comercial | 4.0 como fan IP / 8.0 si se convierte a IP original |
| Potencial competitivo | 7.0 |
| Potencial para volverse popular | 7.5 con polish, IP propia y mejor onboarding |

Conclusion:

El proyecto esta bastante avanzado. No se siente como una prueba basica, sino como una base de juego completa con sistemas reales, contenido amplio, validacion automatizada y decisiones de diseno maduras. La sensacion que transmite es la de un tower defense tactico muy cargado de informacion, con mucho amor por la fantasia de equipo y una clara ambicion de convertirse en algo rejugable.

Las prioridades deberian ser: claridad visual, onboarding, normalizacion de datos, balance inicial, expansion de logros/evoluciones y audio. El mayor impacto positivo vendria de hacer que el jugador entienda menos cosas a la vez pero tome mejores decisiones: paneles colapsables, tutorial contextual, estados con iconos claros, feedback de counters y mapas menos saturados. El segundo impacto mayor seria convertir progresion larga en objetivos concretos: semanales, maestrias especificas, mas logros, evoluciones y retos por faccion.

No deberian modificarse de raiz: el radar de oleada, la cobertura real de ruta, la colocacion sugerida, el director que evita counters imposibles, la modularidad de datos, los modos especiales, el sistema de objetos/sets y el enfoque de pruebas automatizadas. Esas piezas ya funcionan muy bien y son diferenciales.

Tiene potencial para convertirse en un juego de alta calidad porque ya resolvio muchos problemas dificiles: arquitectura, contenido, validacion, rendimiento, PWA, sistemas tacticos y flujo jugable. Para volverse realmente popular necesita tres cambios: identidad propia legal/comercial, una presentacion audiovisual mas fuerte y una UX menos intimidante. La base jugable esta; ahora el trabajo mas valioso es pulir, enfocar y hacer que el jugador sienta la fantasia sin tener que leer un tablero de control completo en cada segundo.
