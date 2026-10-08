# Cobertura de contratos de heroes

Actualizado: 2026-09-22. Roster: 105. No es una certificacion de balance.

## Cobertura comun ejecutable

### F4/lote 7: cuatro heroes (2026-10-08)

`test/jabari-interception-contract.test.js`: 40 pruebas de M'Baku, Korg,
Red Guardian y Echo en niveles 1/49/50/51/99/100; barreras con limite por
poder y sin HP sobrante, pisoton con quorum/limite 5, inmunidades, rutas
propias para intercepcion, bandera de proyectil reciclado, reinicio del
aprendizaje y conservacion de dinero/vidas/prioridad. Sustituye los dos
contratos antiguos de probabilidades de Red Guardian/Echo en
hero-description-contract.test.js. Total global: 1.821 pruebas aprobadas.
No certifica balance de todos los equipos, rutas ni presupuesto (fase 10).

`test/hero-roster-contract.test.js` recorre el catalogo real, no una lista de
nombres extraida de textos de habilidades. Tambien exige que cada ID aparezca
una sola vez en MATRIZ_IDENTIDAD_HEROES.md y valida referencias de signatures.

| Escenario | Cobertura | Limite |
| --- | --- | --- |
| Stats, medidores, efectos, evolucion base | 105 heroes en niveles 1/49/50/51/99/100 y todos sus modos | Sin objetos ni equipos |
| Seleccion primaria | Blanco valido, sigilo segun deteccion, fuera de rango y muerto | No prueba excepciones autonomas; ver suites especificas |
| Combate por heroe | 40 s a nivel 1 y 100; tres blancos estacionarios | Impactos inmediatos, no simula viaje ni ruta |
| Atacantes | 96 disparan y registran dano finito | No compara DPS ni eleccion optima |
| Soportes puros | Nueve sin disparos, dano ni estados ofensivos | No valida todavia diferencias entre sus buffs |
| Salud de base | No aumenta en estos escenarios | Contratos de bajas y objetos tienen suites propias |

La tirada 0.01 ejercita efectos frecuentes, pero no demuestra probabilidades
estadisticas ni cubre todos los ciclos de objeto. No usa enemigos inmortales:
si mueren dejan de ser blancos; la prueba exige actividad, no 400 impactos.
Cada escenario comienza sin enemigos para comprobar ausencia de disparos.

## Contratos especificos existentes

### Primera y ultima linea: fase 4, lote 6 (2026-10-08)

`test/frontline-contract.test.js`: 24 pruebas, niveles 1/49/50/51/99/100.
Jessica: progreso relativo por ruta propia, umbral inclusivo 75%, cobertura,
sigilo, prioridad conservada, cooldown y stun inmune/resistible. Okoye:
ruptura solo en tercer disparo consecutivo, consumo y reinicio por cambios,
movimiento, stun, retiro, muerte, cobertura/deteccion o inactividad. PathUtils
rechaza rutas degeneradas y avances invalidos. Sin certificacion de balance global.

### Luna y chi: fase 4, lote 5 (2026-10-07)

`test/moon-chi-contract.test.js`: 19 pruebas en niveles 1/49/50/51/99/100.
Moon Knight: fortalezas/costes de fase, prioridad preservada, deltas largos,
perfil fijado al disparar y transicion sin stats de la fase anterior. Iron
Fist: preparacion 5s, dano/stun primario, consumo ante proyectil perdido,
inmunidad/resistencia de jefe, critico sin duplicacion de bonus, sin curacion
ni recarga por consultas/movimiento. Sin certificacion de balance de equipos.

### Pym y anillos: fase 4, lote 4 (2026-10-07)

`test/pym-ring-combo-contract.test.js`: 31 pruebas, niveles 1/49/50/51/99/100.
Ant-Man carga diminuta/descarga gigante, cinco victimas, consumo, recarga,
cobertura, inmunidades y retroceso sobre ruta. Shang-Chi prueba cada finalizador,
su consumo al disparar, perfil de proyectil fijado aunque cambie modo antes
de impactar, slow primario resistible y sin transmision por rebote. Ambos
conservan recarga/carga ante consultas y cambios validos/invalidos. No es
certificacion del balance de equipos de seis heroes a lo largo de la campania.

### Asesinas: fase 4, lote 3 (2026-10-07)

`test/assassin-finishers-contract.test.js`: 23 pruebas con niveles
1/49/50/51/99/100. Gamora conserva ejecucion primaria y contador; combo limitado
a dos heridos detectables en cobertura, empate por avance, sin ejecuciones
secundarias. Elektra respeta preparacion temporal, consumo al disparar, umbral
50%, sangrado vigente, sigilo, cobertura y defensas del boss. Consultas y
ataques no reducen recarga. La suite execution-contract mantiene recompensa
unica y exclusion de todas las variantes de jefe. No certifica balance global.

### Garras: fase 4, lote 2 (2026-10-07)

`test/claw-pursuit-contract.test.js`: 30 pruebas, niveles 1/49/50/51/99/100.
Wolverine: carga repetida, penalizacion por cambio, techo, decaimiento temporal,
sin bonus de multitudes, vaciado al mover/stun/retirar y retorno seguro del salto.
X-23: preparacion y consumo de critico x3 resistible por jefes, critico mayor sin
doble multiplicacion, perdida por cambio/cobertura/sigilo/muerte/stun/pausa,
y convivencia con Danger Room. Se conservan pruebas de salto y buffs temporales.
No es simulacion de balance de equipos en cien oleadas.

### Gamma: fase 4, lote 1 (2026-10-07)

`test/gamma-pressure-contract.test.js`: 19 pruebas de Hulk/She-Hulk en niveles
1/49/50/51/99/100 con evoluciones reales. Presion acotada e independiente del
framerate antes de descarga, furia sin vidas perdidas ni cadencia adicional;
Objecion preparada, recarga desde despliegue, cuatro victimas como maximo,
inmunidades, sigilo y resistencias. Mantiene los contratos de salto autonomo
y signatures existentes. No simula balance de equipos de seis contra 100 oleadas.

| Familia | Suites en test/ |
| --- | --- |
| DoT y duraciones | status-damage-contract, status-duration-contract, poison-stacks |
| DoT de catalogo, kits y objetos | catalog-burn-contract, kit-status-damage, item-status-damage, signature-burn-contract |
| Seleccion y geometria | hero-targeting, autonomous-kit-targeting, area-recon-contract, beam-contract, line-targeting |
| Impactos secundarios | secondary-impact-contract, signature-secondary-targeting |
| Ciclos, marcas y ventanas | signature-cycle-contract, signature-mark-contract, signature-timing-contract |
| Ejecuciones | execution-contract |
| Fichas corregidas | hero-description-contract |
| Soportes y economia | support-economy-system; ampliacion individual pendiente |
| Luke sin aura y tenacidad propia | luke-tenacity-contract, street-kit-system, validate-data |
| Liderazgo y Red de Vibranium | damage-support-contract: tiempos, radio, retiro, stun, escalado, preview y comparativa estacionaria de 60 s |
| Orden sostenida, Enlace Pym y Enlace mental | cadence-support-contract: ciclos, reparto, deteccion, niveles, retiro, stun, preview negativo, fichas y comparativa estacionaria de 90 s |
| Cobertura, Geometria elastica y Sello | range-support-contract: radio, geometria interna, deteccion, ciclos, retiro, stun, niveles, colocacion, dibujo, signature y comparativa estacionaria de 32 s |
| Orden de prioridad | priority-support-contract: marcas de kit/objeto, condicion por impacto/victima, vuelo, secundarios, retiro, stun, niveles, DoT, ejecucion, ingresos, UI y comparativa estacionaria de 20 s |
| Acumulacion de auras | support-stacking-contract: suma por atributo, 126 equipos a tres niveles, orden, objetos, deteccion, geometria/preview y seis comparativas de 60 s contra baseline multiplicativo |
| Evolucion de soportes | support-evolution-contract: 35 pruebas de nueve soportes, nivel 50, preview, pulsos, objetos, persistencia, radar, codex y estimador |
| Economia nativa | hero-income-contract: 25 pruebas de Domino, Shang-Chi, niveles, secundarios, DoT, proyectiles perdidos, control, retorno y objetos |
| Reactor ARC y carcaj | arc-quiver-contract: 24 pruebas de calor, carga, niveles, alineacion, sigilo, municion preparada, cambios sin reset, vuelo, objetos y comparativas de 60 s |
| Sabotaje y escaneo | sabotage-scan-contract: 41 pruebas de acciones enemigas, inmunidad, jefes, niveles, alcance, sigilo, barrera/vida, DoT, objetos, retiro, lectura y comparativas |
| Rafaga y supresion | ballistic-identity-contract: niveles, ciclo, municiones, vuelo, rampa limitada, cambio de blanco, cruz, sigilo, stun, retiro y comparativa de 60 disparos |
| Recon y salva | recon-salvo-contract: 24 pruebas de niveles, revelado/expiracion, resistencias, fijacion aliada, modos, zona fija, demora, limite, retiro, stun, telegrafo y objeto |
| Mira y adaptacion | target-focus-contract: 37 pruebas de niveles, jefes, limites, reinicios, cruz, categorias tecnologicas, armadura, vuelo, objetos y 60 s de ataques |
| Baliza y doble baston | beacon-baton-contract: 24 pruebas de niveles, impacto, radio, limite, resistencias, pool, carcaj, reinicios y 60 s de descarga limitada |
| Caza y trucos | hunt-tricks-contract: 22 pruebas de niveles, blanco marcado, transferencia unica, resistencias, limites, reinicios, alternancia y vuelo |
| Dispositivos | field-devices-contract: 29 pruebas de niveles, reserva de dano, limites, duracion/recarga, minas, resistencias, retiro/stun, baja sin hooks y 60 s |

Los nombres corresponden a archivos `.test.js`. Las pruebas focalizadas
son necesarias: pasar el recorrido comun no demuestra que cada condicion
anunciada en una ficha este implementada.

## Trabajo restante

- Concordancia textual individual pendiente en el cierre de fase 1: condiciones
  de elite, revelado frente a deteccion propia y estados principales frente a area.
- Fase 2 implementada: Luke, nueve soportes, acumulacion aditiva, evolucion y
  economia heredada. El 15% por disparo de Domino sigue intacto; la contabilidad
  probada no reemplaza el balance de ingreso por partida de fase 10.
- Fase 3 implementada en ocho lotes: dieciseis tiradores revisados. Dispositivos de Rocket/Peni limitados y dependientes del dueno.
- Fases 4-7: las demas propuestas de firma en la matriz. Las entidades nuevas
  que aun no tienen lote implementado no existen solo por mencionarlas aqui.
- Fase 8: todos los cruces de evolucion/signature sobre los kits nuevos.
- Fase 9: lectura compacta de condiciones e indicadores.
- Fase 10: equipos de seis, presupuesto equivalente, mapas y jefes con movimiento,
  control acumulado, retiro, persistencia y rendimiento. Los smokes no reemplazan
  jugar ni las comparativas de balance.
