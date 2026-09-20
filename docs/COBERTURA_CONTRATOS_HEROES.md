# Cobertura de contratos de heroes

Actualizado: 2026-09-20. Roster: 105. No es una certificacion de balance.

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

Los nombres corresponden a archivos `.test.js`. Las pruebas focalizadas
son necesarias: pasar el recorrido comun no demuestra que cada condicion
anunciada en una ficha este implementada.

## Trabajo restante

- Concordancia textual individual pendiente en el cierre de fase 1: condiciones
  de elite, revelado frente a deteccion propia y estados principales frente a area.
- Fase 2 iniciada con Luke; aun faltan diferencias reales de los nueve soportes,
  acumulacion de auras y economia. No se cambio el 15% por ataque de Domino.
- Fases 3-7: propuestas de firma en la matriz; minas, clones y torretas no existen
  por mencionarlas en un documento. Deben implementarse y probarse en su lote.
- Fase 8: todos los cruces de evolucion/signature sobre los kits nuevos.
- Fase 9: lectura compacta de condiciones e indicadores.
- Fase 10: equipos de seis, presupuesto equivalente, mapas y jefes con movimiento,
  control acumulado, retiro, persistencia y rendimiento. Los smokes no reemplazan
  jugar ni las comparativas de balance.
