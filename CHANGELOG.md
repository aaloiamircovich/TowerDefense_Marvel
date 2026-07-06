# Changelog

## 2.34.0 - 2026-07-06

- Agrega HUD activo de refuerzos con proximo enemigo, ETA y cantidad pendiente durante la oleada.
- El panel usa color por amenaza para anticipar elites, jefes y picos de presion mientras combate.
- Agrega pruebas para ocultar el HUD sin cola activa y calcular ETA/peligro del proximo spawn.

## 2.33.0 - 2026-07-06

- Agrega overlay de cobertura real para el heroe seleccionado durante el combate.
- El rango seleccionado ahora pinta los tramos de ruta cubiertos y etiqueta la calidad de cobertura.
- Agrega prueba para el estado de cobertura real del heroe desplegado.

## 2.32.0 - 2026-07-06

- Agrega una linea de tiempo compacta de salida enemiga antes de iniciar la oleada.
- Agrupa enemigos consecutivos con ETA, cantidad y color de peligro para anticipar aperturas, elites y jefes.
- Agrega pruebas para la cadencia de spawn y su inclusion en el resumen preparado.

## 2.31.0 - 2026-07-06

- Agrega HUD compacto de jefe activo con nombre, fase y barra de salud durante la oleada.
- El panel se oculta sin jefe vivo y marca estado critico cuando la vida cae por debajo de 30%.
- Agrega pruebas para visibilidad del HUD de jefe y calculo de salud critica.

## 2.30.0 - 2026-07-06

- Agrega ajuste para activar o desactivar el texto flotante de combate.
- El toggle se guarda en el perfil y se aplica al juego sin ocultar alertas tacticas de jefes o elites.
- Agrega prueba para asegurar que CombatSystem respete el ajuste de ruido visual.

## 2.29.0 - 2026-07-06

- El informe post-oleada ahora muestra una lectura de aprendizaje con prioridad de salida, segundo carry, maestria o economia.
- La recomendacion distingue fugas graves, fugas menores, falta de despliegue y dependencia excesiva del MVP.
- Agrega pruebas para lecciones de brecha, dependencia del MVP y economia estable.

## 2.28.0 - 2026-07-06

- La tienda ahora muestra si un objeto completa o acerca un bonus de set antes de comprarlo.
- El progreso combina copias disponibles y objetos equipados para marcar estados 1/2 o bonus listo.
- Agrega pruebas para compras que completan set y compras que solo avanzan hacia el bonus.

## 2.27.0 - 2026-07-05

- Agrega insight de tienda para explicar por que un objeto responde a la oleada preparada.
- Los objetos destacan deteccion, penetracion, control, DPS, limpieza de grupos, cobertura, economia o supervivencia segun sus efectos.
- Las cartas de tienda muestran el motivo recomendado con tono de counter, potencia o utilidad.

## 2.26.0 - 2026-07-05

- Hace visibles en el roster el score y las razones de counter de cada heroe contra la oleada preparada.
- Convierte el badge de ajuste en una mini ficha con label, puntaje y razones principales sin depender del tooltip.
- Agrega pruebas puras para la vista de counter del roster y mantiene la lectura previa de enemigos.

## 2.25.0 - 2026-07-05

- Convierte las tarjetas de preview enemigo en intel accionable con rol, rasgos, nivel de peligro y counter recomendado.
- Agrega lectura automatica para sigilo, barreras, blindaje, soporte, invocadores, auras, faseadores y corredores.
- El smoke browser valida que la UI previa de oleada renderice tarjetas de intel con counters visibles.

## 2.24.0 - 2026-07-05

- Anuncia jefes y elites al entrar en ruta con toast tactico, audio y telegraph visual sobre el spawn.
- La alerta usa anillo y texto flotante del sistema CombatVfx para mejorar lectura sin modificar balance ni caminos.
- El smoke browser ahora valida que la alerta de elite renderice toast, anillo y texto dentro de la app real.

## 2.23.0 - 2026-06-29

- Agrega texto flotante de dano, criticos y bajas sobre los impactos de combate.
- El feedback visual usa el sistema CombatVfx existente, con colores y duracion segun golpe normal, CRIT o KO.
- El combate emite la lectura desde el dano real aplicado, incluyendo area, cadenas y habilidades que pasan por CombatSystem.

## 2.22.0 - 2026-06-29

- Permite confirmar con Enter la celda sugerida durante colocacion o reposicion.
- El despliegue recomendado ahora puede ejecutarse con una accion de HUD y una confirmacion de teclado.
- Agrega prueba automatizada del flujo completo de recomendacion, descuento de creditos y despliegue.

## 2.21.0 - 2026-06-29

- Agrega sugerencia visual de celda al entrar en modo colocacion.
- El recomendador evalua terreno, ocupacion, alcance y cobertura real de ruta antes de marcar una posicion.
- La sugerencia ayuda a convertir recomendaciones tacticas en despliegues mas rapidos sin quitar control manual.

## 2.20.0 - 2026-06-29

- Convierte la preparacion recomendada en acciones directas desde el HUD.
- Las recomendaciones de colocar heroe activan modo de despliegue y las de mejora ejecutan mejora rapida.
- Agrega estados accesibles y tests para diferenciar acciones clickeables de notas informativas.

## 2.19.0 - 2026-06-29

- Agrega preparacion recomendada en el radar previo de oleada.
- El HUD sugiere desplegar counters, mejorar defensas o ahorrar segun sigilo, blindaje, velocidad, amenaza y creditos.
- La recomendacion se cubre con tests unitarios y queda integrada a la lectura de amenaza existente.

## 2.18.0 - 2026-06-29

- Agrega atajo configurable para mejorar al heroe seleccionado.
- La tecla por defecto `U` ejecuta la mejora rapida existente y respeta creditos disponibles.
- Ajustes muestra Mejorar seleccionado junto a los demas controles reconfigurables.

## 2.17.0 - 2026-06-29

- Agrega atajo configurable para ciclar prioridad de objetivo del heroe seleccionado.
- La tecla por defecto `T` cambia el modo de targeting, refresca roster y muestra confirmacion en HUD.
- Ajustes ahora permite reconfigurar Cambiar objetivo junto a pausa, velocidad, oleada y cancelar.

## 2.16.0 - 2026-06-29

- Agrega control rapido de prioridad de objetivo en cartas de heroes desplegados.
- El roster permite ciclar Primero, Ultimo, Fuerte, Debil, Rapido, Sigilo y Jefe sin abrir modal.
- Cada prioridad muestra etiqueta, icono, tooltip y refresca el HUD tactico al instante.

## 2.15.0 - 2026-06-29

- Convierte el informe de oleada en una accion directa sobre el MVP.
- Si hay creditos suficientes, el HUD permite mejorar al heroe destacado desde el informe.
- Si faltan recursos, el informe indica cuanto falta y prioriza refuerzo tras fugas.

## 2.14.0 - 2026-06-29

- Agrega informe tactico persistente al cerrar cada oleada.
- El HUD resume fugas, bajas, dano, creditos y MVP de la oleada con tono visual propio.
- El informe recomienda la siguiente accion: ahorrar, reforzar salida, desplegar dano o revisar maestrias.

## 2.13.0 - 2026-06-29

- Agrega respuesta tactica de mejora desde el panel de presion de fuga.
- El HUD recomienda el heroe desplegado mas conveniente si hay creditos suficientes.
- Si faltan recursos o no hay defensa desplegada, la alerta explica la siguiente accion util.

## 2.12.0 - 2026-06-28

- Agrega panel de presion de fuga durante oleadas activas.
- El HUD mide el enemigo mas avanzado, cuantos rivales estan en zona de salida y recomienda pausa tactica si el frente se rompe.
- La alerta usa progreso real de ruta para mantener la lectura de peligro alineada con la integridad del camino.

## 2.11.0 - 2026-06-28

- Agrega recomendaciones de counter en las cartas del roster segun la proxima oleada.
- La lectura tactica identifica deteccion, antiarmadura, control, alcance, DPS de jefe y heroes asequibles.
- Las rutas de encuentro actualizan el roster para convertir el radar de oleada en decisiones inmediatas.

## 2.10.0 - 2026-06-28

- Agrega asesor de preparacion tactica previo a la oleada.
- El radar compara amenaza con heroes desplegados, dano, alcance, deteccion, control y creditos disponibles.
- La UI muestra estados Sin defensa, Defensa debil, Defensa justa, Defensa estable y Preparado.

## 2.9.0 - 2026-06-28

- Conecta el boton de inicio de oleada con el tier de amenaza calculado.
- El CTA distingue amenaza baja, media, alta, critica y oleada en curso con copy y color propios.
- Agrega estado accesible con puntaje y recomendacion tactica en el boton principal.

## 2.8.0 - 2026-06-28

- Agrega medicion de cobertura real de ruta durante colocacion y reposicion.
- El preview del canvas resalta los segmentos de camino cubiertos por el rango del heroe.
- Los mensajes de colocacion ahora indican calidad y px de ruta cubierta antes de confirmar.

## 2.7.0 - 2026-06-28

- Agrega Intel de Amenaza por oleada con puntaje y tier visible en el panel tactico.
- El calculo considera cantidad, velocidad, amenaza base, sigilo, barreras, armadura y jefes.
- Refuerza la toma de decisiones antes de iniciar oleada sin modificar rutas ni spawn.

## 2.6.0 - 2026-06-28

- Mejora la lectura del roster: heroes desplegados muestran nivel actual y coste de la siguiente mejora.
- El coste de mejora de campo queda resaltado para tomar decisiones sin abrir el modal.
- Mantiene coste y rareza visibles antes de desplegar.

## 2.5.0 - 2026-06-28

- Agrega apertura dirigida para las primeras cinco oleadas de campaña.
- Manhattan y Avengers HQ reciben composiciones de inicio con labels y counters propios.
- El guion respeta capacidades del equipo: no fuerza sigilo si el roster no tiene deteccion.
- Las oleadas posteriores siguen usando el director dinamico con afijos, ramas y jefes.
- Amplia la suite a 182 pruebas mas smoke browser.

## 2.4.0 - 2026-06-28

- Agrega guardarrail runtime para corregir enemigos que queden fuera de su ruta.
- El ajuste reubica al enemigo en el punto mas cercano del camino, actualiza segmento y distancia recorrida.
- Cubre el caso con prueba automatizada para proteger futuras habilidades de empuje, salto o teletransporte.
- Amplia la suite a 181 pruebas mas smoke browser.

## 2.3.0 - 2026-06-28

- Agrega mejora de campo rapida desde el roster para heroes desplegados.
- La mejora de campo consume creditos, sube nivel, actualiza dano/alcance, refresca HUD y registra replay.
- Reutiliza la misma formula del modal de mejoras para evitar diferencias entre flujos.
- Agrega estado disabled en botones de accion cuando no hay creditos suficientes.

## 2.2.0 - 2026-06-28

- Mejora el vertical slice inicial de Manhattan con set dressing procedimental: agua del Hudson, azoteas, señal Stark, carriles, cruces y taxis.
- Agrega placa de operación sobre el canvas con mapa, misión, speaker y briefing ambiental.
- Cambia el grid visible por defecto en perfiles nuevos para que el primer vistazo parezca más producto y menos editor.
- Mantiene el pathfinding intacto: las mejoras visuales no alteran rutas ni colisiones.

## 2.1.0 - 2026-06-28

- Inicia la reconstruccion profesional 3.0 con un gate browser real del primer minuto de juego.
- Agrega smoke automatizado en Chromium: carga, seleccion inicial, despliegue, oleada completa y control de enemigos sobre la ruta.
- Incorpora pantalla de arranque con estados visibles y recuperacion segura de guardados corruptos.
- Conecta Playwright al pipeline local y a GitHub Actions mediante `npm ci` y Chromium.
- Amplia la suite a 180 pruebas unitarias mas smoke browser.

## 2.0.1 - 2026-06-23

- Corrige un bloqueo de arranque causado por el registro de replay del Draft.
- Agrega una prueba de regresión para reinicio y elección de Draft con replay activo.
- Incorpora el roadmap profesional 3.0 basado en una auditoría comparativa del producto.
- Amplía la suite a 179 pruebas automatizadas.

## 2.0.0 - 2026-06-23

- Evoluciones reversibles Iron Man Extremis, Iron Spider y Phoenix con cambios reales de combate.
- Maestría por desafíos, códice de descubrimientos, logros y estadísticas históricas.
- Informes detallados de misión y guardados exportables/importables con migración v7.
- Soporte base de mando, teclas reasignables y catálogo de textos preparado para ES/EN.
- Replays por semilla y decisiones, presupuesto de memoria de 128 MB y auditoría accesible.
- Checklist 2.0 integrado a la validación de lanzamiento; suite ampliada a 178 pruebas.

## 1.11.0 - 2026-06-23

- Operación diaria comparte mapa, roster y semilla por fecha con ranking local propio.
- Boss Rush encadena diez jefes y habilita reparación entre combates.
- Supervivencia agrega hitos, oleadas ilimitadas y extracción voluntaria.
- Draft heroico comienza con tres héroes y ofrece refuerzos bloqueantes cada tres rondas.
- Defensa de convoy incorpora un objetivo móvil con integridad visible sobre la ruta.
- Guardado v6 separa puntuaciones, oleadas y resultados de modo del progreso de campaña.
- 163 pruebas automatizadas cubren los cinco flujos y su persistencia.

## 1.10.0 - 2026-06-22

- Director de encuentros reproducible por mapa, oleada y rama elegida.
- Presupuesto de amenaza reemplaza composiciones rígidas y valida detección y perforación disponibles.
- Afijos Regenerador, Reflector, Comandante, Inestable y Cazador modifican comportamiento y recompensa.
- Mini-jefes con fase anunciada aparecen cada cinco oleadas entre jefes principales.
- Contención y Cazar élite ofrecen decisiones explícitas de seguridad o botín cada cuatro oleadas.
- 156 pruebas automatizadas cubren semillas, counters, ramas, afijos y telegraphs.

## 1.9.0 - 2026-06-22

- Asgard, Dimensión Oscura, Savage Land y The Raft amplían la campaña a once mapas.
- Bifrost, ciclos de inversión, vegetación destructible y celdas por daño colateral cambian la geometría y el ritmo de defensa.
- Ocho tropas, cuatro jefes con fases, objetivos secundarios, diálogos y ambientación propia por mundo.
- Todas las aceleraciones, teletransportes y apariciones conservan el segmento de ruta del enemigo.
- 150 pruebas automatizadas, 30 enemigos normales y 19 jefes validados.

## 1.8.0 - 2026-06-22

- Wolverine, Jean Grey, Cyclops, Storm, Domino, Scarlet Witch, Ant-Man y Winter Soldier completan los 31 kits del roster.
- Frenesí, Phoenix, visor óptico, clima, suerte sembrada, maldiciones, escala Pym y munición táctica incorporan controles y estados propios.
- Telequinesis, saltos, desvíos e impactos conservan la posición enemiga dentro de los segmentos de ruta.
- 144 recursos visuales nuevos y atlas completo de 558 sprites.
- 144 pruebas automatizadas y simulación de 736.281 composiciones de seis héroes.

## 1.7.0 - 2026-06-22

- Daredevil, Moon Knight, Blade, Ghost Rider, Luke Cage, Shang-Chi y She-Hulk reciben kits completos, mejoras, audio y estados visibles.
- Radar global, ciclo lunar, sangrado de élites, Penitencia contra jefes, intercepción, patrones de anillos y provocación gamma amplían el combate cercano.
- Todo arrastre, intercepción y retroceso usa segmentos del trazado y mantiene a los enemigos sobre su ruta.
- 126 recursos visuales nuevos y atlas ampliado a 414 sprites.
- 128 pruebas automatizadas y simulación ampliada a 100.947 composiciones de seis héroes.

## 1.6.0 - 2026-06-22

- Captain Marvel, Star-Lord, Groot, Gamora y Silver Surfer reciben kits completos, mejoras, audio y estados visibles.
- Vuelo binario temporal, doble objetivo elemental, muros de raíces, ejecuciones y trayectorias cósmicas configurables.
- Comandantes Kree y faseadores Chitauri estrenan roles de haste y cambio de fase sobre rutas seguras.
- Seis tropas Kree, Chitauri y de la Orden Negra amplían la progresión de Knowhere.
- 90 recursos visuales nuevos, atlas de 288 sprites y 114 pruebas automatizadas.
- Simulación ampliada a 8.008 composiciones de seis héroes.

## 1.5.0 - 2026-06-22

- Ocho familias Marvel con bonos de dos y cuatro miembros y rendimientos decrecientes.
- Parejas extensibles para Steve/Tony, Thor/Hulk, Strange/Wanda y T'Challa/Shuri.
- Formaciones de vanguardia, apoyo y artillería basadas en distancia real, con radios visibles.
- Constructor de equipo con seis espacios, coste, cobertura, daño, control, detección y apoyo.
- Bono de versatilidad para composiciones mixtas y simulación de 462 equipos posibles.
- 101 pruebas automatizadas y telemetría de composición en el perfil.

## 1.4.0 - 2026-06-22

- Hulk, Black Widow, Hawkeye, Black Panther, Vision y Falcon reciben kits completos y roles diferenciados.
- Munición manual para Hawkeye, densidad configurable para Vision y órdenes de reconocimiento o asalto para Redwing.
- Furia gamma, sabotaje de soportes, energía cinética, contraataque y auras tácticas con indicadores visibles.
- 108 recursos visuales para los seis Avengers, 198 sprites en atlas y seis señales de audio nuevas.
- Costes simulados, seguridad de rutas y 96 pruebas automatizadas.
- La colección permite inspeccionar héroes completos antes de reclutarlos y la caja S.H.I.E.L.D. excluye personajes aún en producción.

## 1.3.0 - 2026-06-21

- Catálogo ampliado de 10 a 30 objetos con iconos propios.
- Ranuras separadas de arma, armadura y artefacto.
- Seis familias con bonus de dos piezas y efectos declarativos.
- Forja de duplicados, tres niveles de mejora y materiales persistentes.
- Loadouts guardados por héroe y migración automática del formato anterior.
- Simulación de 960 builds y 84 tests automatizados.

## 1.2.0 - 2026-06-21

- Mesa táctica con pausa, selección persistente y siete prioridades de objetivo.
- Previsualización de colocación con sprite, alcance y distancia real al camino.
- Reposición gratuita una vez por oleada y venta segura al 70% entre oleadas.
- Radar ampliado con cantidad, botín, velocidad, amenaza y counter recomendado.
- Atajos de selección para los seis espacios del equipo y 77 tests automatizados.

## 1.1.0 - 2026-06-21

- Sprites direccionales y retratos para Capitán América, Thor y Doctor Strange.
- Nueve frames de ataque por héroe con escudo, relámpago y sello místico.
- Generador reproducible de pixel art y atlas ampliado a 90 sprites.
- Validación automatizada de contratos visuales, dimensiones y atlas.

## 1.0.0 - 2026-06-21

- Campaña de siete mapas con reglas, facciones, jefes y objetivos propios.
- Cinco héroes con kits completos, progresión persistente, inventario y economía simulada.
- Interfaz responsive y accesible con audio por buses y música temática.
- Pools de proyectiles/VFX, atlas de sprites, benchmark de carga y PWA offline.
- Suite automatizada de combate, rutas, progreso, tienda, audio, misiones y flujo de partida.
