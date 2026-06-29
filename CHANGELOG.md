# Changelog

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
