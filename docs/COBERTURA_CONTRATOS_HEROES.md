# Cobertura de contratos de heroes

Actualizado: 2026-09-22. Roster: 105. No es una certificacion de balance.

## Cobertura comun ejecutable

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

Los nombres corresponden a archivos `.test.js`. Las pruebas focalizadas
son necesarias: pasar el recorrido comun no demuestra que cada condicion
anunciada en una ficha este implementada.

## Trabajo restante

- Concordancia textual individual pendiente en el cierre de fase 1: condiciones
  de elite, revelado frente a deteccion propia y estados principales frente a area.
- Fase 2 implementada: Luke, nueve soportes, acumulacion aditiva, evolucion y
  economia heredada. El 15% por disparo de Domino sigue intacto; la contabilidad
  probada no reemplaza el balance de ingreso por partida de fase 10.
- Fase 3: catorce tiradores revisados; pendientes Rocket y Peni Parker.
- Fases 3-7: las demas propuestas de firma en la matriz; minas, clones y torretas no existen
  por mencionarlas en un documento. Deben implementarse y probarse en su lote.
- Fase 8: todos los cruces de evolucion/signature sobre los kits nuevos.
- Fase 9: lectura compacta de condiciones e indicadores.
- Fase 10: equipos de seis, presupuesto equivalente, mapas y jefes con movimiento,
  control acumulado, retiro, persistencia y rendimiento. Los smokes no reemplazan
  jugar ni las comparativas de balance.
