# Roadmap de expansion 1.2 a 2.0

Este segundo ciclo parte de una base estable: campaña de siete mapas, cinco heroes completos, 31 heroes definidos, diez objetos, progresion persistente, PWA y 67 tests. El objetivo es aumentar profundidad y variedad sin perder claridad tactica, rendimiento ni identidad por mapa.

## Principios del ciclo

- Cada personaje nuevo debe incluir mecanica, sprites, VFX, audio, mejoras y tests; no se agregan heroes que solo cambien numeros.
- Toda ruta enemiga se normaliza y prueba para impedir que unidades, invocaciones o retrocesos abandonen el camino.
- Los objetos crean estilos de juego, no aumentos obligatorios de poder.
- Las sinergias premian composiciones tematicas sin castigar equipos mixtos.
- El progreso se obtiene jugando; no se diseñan esperas artificiales, energia ni monetizacion.
- Cada fase conserva 60 FPS, cero errores de consola y compatibilidad con guardados anteriores.

## Fase 10 - Mesa tactica

**Objetivo:** mejorar las decisiones durante la partida antes de ampliar el roster.

- Vista previa de colocacion con alcance, terreno valido y distancia al camino.
- Vender, reposicionar una vez por oleada y cancelar acciones sin perder recursos.
- Prioridades `Primero`, `Ultimo`, `Fuerte`, `Debil`, `Rapido`, `Sigilo` y `Jefe` desde la tarjeta del heroe.
- Pausa tactica con inspeccion de enemigos, resistencias y daño previsto.
- Resumen de la siguiente oleada con faccion, roles, modificadores y recompensas.
- Atajos de seleccion y grupos de heroes sin comprometer accesibilidad tactil.

**Terminado cuando:** colocar, mover, vender y cambiar objetivos es reversible, legible y esta cubierto por pruebas de economia y rutas.

**Estado:** implementada en la version 1.2.0. La colocacion muestra sprite, alcance y distancia al camino; los clics invalidos no cancelan la accion. Cada heroe puede reposicionarse una vez por oleada, venderse al 70% entre oleadas y usar siete prioridades. La pausa tactica conserva seleccion y el radar calcula cantidad, botin, velocidad, amenaza y respuesta recomendada.

## Fase 11 - Objetos 2.0 y forja

**Objetivo:** convertir el inventario en una fuente de builds, no en una lista de bonificaciones.

- Ampliar de 10 a 30 objetos: tecnologia, mistico, cosmico, urbano y mutante.
- Tres ranuras con categorias `arma`, `armadura` y `artefacto`.
- Bonos de dos piezas para familias como Stark, Vibranium, Pym, Mistica y Simbionte.
- Forja para reciclar duplicados y mejorar objetos sin azar destructivo.
- Loadouts guardados por heroe, comparador completo e iconos para todos los objetos.
- Simulacion automatizada de combinaciones dominantes y limites de acumulacion.

**Terminado cuando:** cada heroe central tiene al menos tres builds viables y no quedan warnings de iconos de objetos.

**Estado:** implementada en la version 1.3.0. El catalogo contiene 30 objetos con iconos, tres ranuras, seis familias y bonus de dos piezas. La forja recicla duplicados, mejora hasta nivel tres y guarda materiales; los loadouts restauran configuraciones de forma atomica. La migracion conserva el objeto de guardados 1.2 y la simulacion evalua 960 builds con un techo de poder controlado.

## Fase 12 - Refuerzos de los Avengers

**Objetivo:** producir seis heroes completos con roles que el equipo actual no cubre.

- **Hulk:** tanque de corto alcance, furia por daño recibido y salto gamma.
- **Black Widow:** sigilo, sabotaje de soportes y descarga en cadena.
- **Hawkeye:** cambio manual de flechas explosiva, criogenica y perforante.
- **Black Panther:** energia cinetica, contraataque y aura de Vibranium.
- **Vision:** fases de intangibilidad y rayo de densidad variable.
- **Falcon:** Redwing controlable para revelar rutas y marcar objetivos.
- Contratos visuales completos, dos ramas de mejora y pruebas individuales.

**Terminado cuando:** los seis se ven, suenan y juegan de forma distinta en los siete mapas.

**Estado:** implementada en la version 1.4.0. Hulk usa furia y salto gamma; Black Widow sabotea soportes y encadena descargas; Hawkeye alterna tres flechas; Black Panther acumula energia, contraataca y proyecta un aura; Vision controla densidad y atraviesa lineas; Falcon dirige a Redwing en reconocimiento o asalto. Los seis incorporan 108 assets, audio, mejoras, controles, balance y pruebas de seguridad de ruta.

## Fase 13 - Sinergias y formaciones

**Objetivo:** hacer que elegir un equipo sea una decision tactica reconocible.

- Etiquetas Avengers, Defenders, Guardianes, X-Men, Mistico, Callejero, Wakanda y Tecnologia.
- Bonos escalonados de dos y cuatro miembros con rendimientos decrecientes.
- Sinergias de pareja: Steve/Tony, Thor/Hulk, Strange/Wanda y T'Challa/Shuri como sistema extensible.
- Formaciones de vanguardia, apoyo y artilleria con radios visibles.
- Constructor de equipo que compara cobertura, control, daño, deteccion y coste.
- Telemetria para detectar composiciones obligatorias o bonos demasiado fuertes.

**Terminado cuando:** existen varias composiciones competitivas y un equipo mixto sigue siendo valido.

**Estado:** implementada en la version 1.5.0. Ocho familias activan bonus totales de dos o cuatro miembros, cuatro parejas usan un contrato extensible y los equipos mixtos reciben versatilidad. Vanguardia, apoyo y artilleria dependen de radios reales visibles en el mapa. El constructor compara cinco métricas y coste; la simulacion evalua 462 equipos, con 399 competitivos y 337 mixtos.

## Fase 14 - Expansion cosmica

**Objetivo:** incorporar movilidad, invocaciones y control de grandes grupos.

- **Captain Marvel:** energia binaria acumulable y vuelo entre posiciones.
- **Star-Lord:** doble objetivo, municion elemental y ordenes de equipo.
- **Groot:** muros de raices temporales y curacion de Guardianes.
- **Gamora:** ejecuciones, cadenas cuerpo a cuerpo y prioridad manual.
- **Silver Surfer:** trayectorias atravesables y Poder Cosmico configurable.
- Enemigos Kree, Chitauri y tropas de la Orden Negra con nuevos roles.

**Terminado cuando:** el contenido cosmico habilita estrategias que no dependen de torres estaticas tradicionales.

**Estado:** implementada en la version 1.6.0. Captain Marvel vuela temporalmente entre posiciones, Star-Lord combina doble blanco y tres municiones, Groot crea muros de control y cura Guardianes, Gamora encadena ejecuciones y Silver Surfer atraviesa líneas con tres configuraciones. Knowhere incorpora comandantes Kree, faseadores y tropas Chitauri y de la Orden Negra; rutas, invocaciones y raíces están cubiertas por pruebas.

## Fase 15 - Heroes callejeros y Midnight Suns

**Objetivo:** profundizar control, riesgo y combate cercano.

- **Daredevil:** radar global temporal y contraataques por esquiva.
- **Moon Knight:** ciclo lunar que alterna alcance, daño y control.
- **Blade:** sangrado, caza de elites y robo de vida limitado.
- **Ghost Rider:** cadenas de arrastre y Mirada de Penitencia contra jefes.
- **Luke Cage:** interceptacion de fugas y proteccion de aliados.
- **Shang-Chi:** Diez Anillos orbitables con patrones configurables.
- **She-Hulk:** empuje controlado, provocacion y daño por impacto.

**Terminado cuando:** los siete pueden defender zonas estrechas sin romper rutas ni trivializar jefes.

**Estado:** implementada en la version 1.7.0. Daredevil comparte deteccion global, Moon Knight alterna tres fases, Blade caza elites con robo de vida limitado, Ghost Rider arrastra y reserva Penitencia para jefes, Luke Cage intercepta fugas, Shang-Chi configura sus anillos y She-Hulk combina provocacion con impacto. Los siete incluyen sprites, audio, mejoras, balance y pruebas que verifican el trazado.

## Fase 16 - Mutantes y reserva tactica

**Objetivo:** completar los 31 heroes definidos y cerrar el backlog principal de sprites.

- **Wolverine:** regeneracion, frenesí y salto al objetivo prioritario.
- **Jean Grey:** telequinesis, retroceso seguro y medidor de Phoenix.
- **Cyclops:** linea de tiro orientable y rebotes opticos.
- **Storm:** clima por zona y combinaciones de hielo y electricidad.
- **Domino:** suerte sembrada, criticos controlables y desvio de proyectiles.
- **Scarlet Witch:** maldiciones enlazadas y alteracion temporal de oleadas.
- **Ant-Man:** alternancia tactica entre forma diminuta y gigante.
- **Winter Soldier:** municion seleccionable y ruptura de armadura.

**Terminado cuando:** los 31 heroes tienen contrato visual, kit completo, mejoras, audio y tests sin assets ausentes.

## Fase 17 - Campaña de mundos en colision

**Objetivo:** agregar mapas donde la geometria y las reglas cambien la estrategia.

- **Asgard:** Bifrost que teletransporta grupos entre dos entradas.
- **Dark Dimension:** zonas que invierten buffs y debuffs por ciclos.
- **Savage Land:** vegetacion destructible, dinosaurios neutrales y rutas ocultas.
- **The Raft:** celdas que liberan mini-jefes si reciben daño colateral.
- Facciones, jefes, objetivos secundarios, dialogos y recompensas propias.
- Selector de actos con continuidad narrativa y dificultad recomendada.

**Terminado cuando:** los cuatro mapas requieren equipos y colocaciones diferentes a los siete actuales.

## Fase 18 - Director de encuentros

**Objetivo:** generar variedad justa sin sustituir el diseño manual de oleadas.

- Elites con afijos legibles: regeneracion, reflector, comandante, inestable y cazador.
- Mini-jefes con telegraphs y recompensas de riesgo.
- Ramas de oleada donde el jugador elige entre seguridad y botin.
- Presupuesto de amenaza que combina roles en lugar de inflar solo HP.
- Semillas reproducibles para balance, desafios y reportes de errores.
- Reglas que garantizan counters disponibles para cada composicion generada.

**Terminado cuando:** dos partidas del mismo mapa varian sin producir combinaciones imposibles o ilegibles.

## Fase 19 - Modos de juego

**Objetivo:** reutilizar el combate en experiencias con ritmos distintos.

- **Operación diaria:** mapa, roster y semilla compartida con puntuacion local.
- **Boss Rush:** secuencia de jefes con tienda breve entre combates.
- **Supervivencia:** oleadas infinitas, hitos y retirada voluntaria.
- **Draft heroico:** elecciones de heroes y objetos entre rondas.
- **Defensa de convoy:** objetivo movil que cambia las zonas de colocacion.
- Reglas, guardados y rankings locales separados para no contaminar la campaña.

**Terminado cuando:** cada modo tiene inicio, progresion, derrota, recompensa y tests de flujo propios.

## Fase 20 - Maestria y lanzamiento 2.0

**Objetivo:** cerrar el ciclo con endgame, calidad de vida y mantenimiento sostenible.

- Evoluciones reales para Iron Man Extremis, Iron Spider y Phoenix, con decisiones reversibles.
- Maestria por heroe basada en desafios, no en repeticion de oleadas.
- Codice de heroes, enemigos, objetos, facciones y mecanicas descubiertas.
- Logros, estadisticas historicas y resumen detallado al terminar una mision.
- Exportar/importar guardado, soporte de mando, reasignacion de teclas y localizacion preparada.
- Replays por semilla, auditoria de accesibilidad, presupuesto de memoria y checklist de version 2.0.

**Terminado cuando:** un guardado 1.x migra sin perdida, todo el contenido principal es alcanzable jugando y la build 2.0 supera QA funcional, visual y de rendimiento.

## Orden recomendado

1. Fases 10 y 11: ergonomia tactica y objetos.
2. Fases 12 y 13: primer roster ampliado y sinergias.
3. Fases 14, 15 y 16: completar los 31 heroes por familias.
4. Fases 17 y 18: campaña y director de encuentros.
5. Fases 19 y 20: modos, endgame y lanzamiento 2.0.

Cada fase debe publicarse por separado con migracion de guardado, changelog, pruebas y benchmark. No se inicia la siguiente tanda de personajes hasta cerrar visuales, audio y balance de la anterior.
