# Identidad y habilidades de los 105 heroes

Fecha: 2026-09-13. Base revisada: commit 553ad63.
Estado: AUDITORIA Y PROPUESTA. Ninguna mecanica o estadistica modificada.

Esta es una pasada nueva, independiente del cierre de interfaz. El objetivo
no es subir el poder de todos: es que elegir, ubicar y combinar cada heroe
cambie alguna decision real del jugador. Las propuestas requieren validacion
antes de fijar porcentajes, tiempos o requisitos nuevos.

## Alcance y evidencia

Revisados los 105 registros de data/heroes.json, los cuatro KitSystem,
HeroAbilitySystem, Hero, CombatSystem, estados de Enemy, HeroLevel y
EvolutionSystem. Se cruzaron los textos con las rutas de ejecucion genericas
y especificas; no se simularon todavia todas las combinaciones de seis heroes.
La matriz anexa cubre cada ID exactamente una vez.

- Rarezas: 30 Common, 26 Rare, 24 Epic, 16 Legendary, 8 Mythic y 1 Secret.
- 9 heroes tienen supportAura y no disparan; 54 registros permiten detectar
  sigilo mediante canSeeStealth o statModifiers.detectStealth. Esto NO cuenta
  pulsos, objetos ni auras aliadas: no equivale a 54 detectores de equipo.
- 10 heroes ofrecen selector de modo real: Hawkeye, Ant-Man, Star-Lord,
  Vision, Falcon, Winter Soldier, Shang-Chi, Cyclops, Storm y Silver Surfer.
- 67 heroes devuelven null en getDisplayState sin objetos/evoluciones. Eso
  NO significa que no tengan habilidad: muchos usan efectos genericos, pero
  no hay medidor o estado propio que comunique una mecanica distintiva.
- Las evoluciones cubren los 105 heroes. Muchas son aumentos de estadisticas;
  no todas incluyen un cambio de comportamiento. No volver a crearlas desde cero.

Pruebas actuales: 34 tests focalizados de combate, habilidades, arquetipos,
niveles y evoluciones aprobados. Se hicieron probes de ejecucion adicionales
para las discrepancias indicadas abajo. Que esos tests pasen no demuestra
que el balance de los 105 kits sea satisfactorio.

## Hallazgos prioritarios

### P1. Unidades y escalado de dano persistente

Enemy.updateDebuffs interpreta burn y bleed como dano plano por segundo;
poison y curse usan salud maxima. takeDamage impone minimo 1 por impacto.
Sentry tiene burn.power=0.006 y X-23 bleed.power=0.005: contra 100.000 HP,
un segundo de estado sin resistencias hizo solo 2 de dano en ambos probes.
Human Torch con burn.power=12 hizo 12. Howard, Valkyrie, Drax y Tigra tambien
tienen burn/bleed menores a 0.01; no se deben tratar como porcentajes sin
revisar la intencion. Otros sangrados de 0.2 tambien caen en el minimo.

Accion: definir damageBasis explicito (plano, poder del heroe o salud del
enemigo), frecuencia, acumulacion y reglas de jefe. Migrar numeros con tests;
NO convertir todos los valores actuales a porcentaje, seria un aumento enorme.
Referencia: src/entities/Enemy.js, applyStatus/updateDebuffs/takeDamage;
src/entities/Hero.js, getProjectileEffects; data/heroes.json.

### P1. Seleccion inconsistente en habilidades y estados

Hero.getBestTarget respeta sigilo y patron geometrico. En cambio,
HeroAbilitySystem.getTargetsInRange solo comprueba distancia y vida.
Probe: Strange rechaza un enemigo a 10 px con su ataque normal de anillo,
pero el helper de su campo temporal lo acepta. Otros kits emplean sus propios
radios o rayos. Un salto o explosion puede ser una excepcion intencional;
actualmente la regla no esta declarada de manera uniforme.

Accion: contratos separados para fijar objetivo, alcance de habilidad y
victimas secundarias. Declarar que puede alcanzar sigilo, voladores, punto
ciego y fuera del alcance base; mostrar excepciones, no borrar todas ellas.
Referencia: Hero.getBestTarget; HeroAbilitySystem.getTargetsInRange;
AvengerKitSystem, CosmicKitSystem, MutantKitSystem; utils/RangePattern.js.

### P1. Soportes y economia tienen excepciones heredadas

Luke Cage ataca y StreetKitSystem.applyStatModifiers concede +8% de cadencia
y +6% de alcance a aliados a 135 px (probe confirmado). No usa supportAura:
esa bonificacion tampoco recorre su escalado ni su comprobacion de stun.
Black Panther conserva un kit atacante y efectos de stun en datos, aunque
Hero.update sale antes de ejecutarlos por ser soporte. No reactivar ese kit.
El roster ya tiene tres soportes de cada atributo, no dos: las incorporaciones
posteriores agregaron Maria Hill, Wong y Profesor X a las parejas originales.

Domino genera ceil(recompensa * 0.15) en Hero.shoot, una vez por ataque, no
por enemigo secundario. Respetar ese contrato solicitado, incluida la
diferencia entre disparar e impactar. Shang-Chi, modo guardia, tiene ademas
una generacion heredada de 2 monedas cada cuatro ataques.

Accion: retirar de Luke el buff aliado y conservarlo como atacante, salvo que
se decida convertirlo en soporte puro. Mantener las seis opciones originales
y diferenciar los tres soportes nuevos sin eliminarlos ni crear nuevas auras
ofensivas en atacantes. Preservar el 15% de Domino; evaluar economia contra
enemigos controlados y objetos, sin imponer un tope oculto por enemigo.
Referencia: Hero.update/applySupportAuras/generateEconomyOnHit;
StreetKitSystem.applyStatModifiers/onAttack; data/heroes.json.

### P2. El texto no siempre describe una condicion real

Ejemplos: Crystal dice alternar elementos pero solo tiene splash y slow;
Rocket menciona torretas pero usa un proyectil; Echo no copia patrones;
Nightcrawler tiene rebotes/slow/mark, no un salto propio; Emma suma critico
propio, no al frente; Red Guardian aplica su chance de stun sin condicion
elite; Nebula no limita su ruptura a tecnologicos; X-23 no configura un
multiplicador supercritico propio. No confundir nombre tematico con funcion.

Accion: implementar la firma propuesta o corregir la promesa; verificar con
un test positivo y otro negativo cada condicion anunciada.

### P2. Efectos secundarios y evoluciones requieren contrato

CombatSystem aplica efectos al blanco principal y a propagacion, pero splash
y chain aplican solo dano. Por ejemplo, tener splash helado no significa que
todos los alcanzados queden ralentizados. Los estados se fusionan por tipo:
el veneno acumula hasta 12 y puede mezclar potencia de una fuente con autoria
de otra. Hay que especificar credito, duracion, refresco y contagio.

HeroAbilitySystem.getDisplayState usa carga ARC de 3 incluso cuando Extremis
dispara cada 2 ataques. Las auras escalan por HeroLevel, mientras que la
evolucion generica modifica stats del heroe: no necesariamente mejora el buff
que reciben los aliados. Revisar ambos caminos antes de sumar mas efectos.

## Reglas de diseno

1. Una firma principal por heroe, como maximo una interaccion secundaria.
   Tener varios efectos no es sinonimo de tener identidad.
2. Ningun heroe cura la base. Los soportes que potencian aliados no atacan.
3. Mantener nivel maximo 100, evolucion normal en 50 y excepciones existentes
   en 100. El objeto signature enriquece, no bloquea la evolucion por nivel.
4. No alterar rarezas en esta pasada. La rareza compra presupuesto de poder
   y alcance tactico, no inmunidad a debilidades ni todas las funciones juntas.
5. Alcance y cadencia base no crecen por cada nivel ofensivo. Modos, objetos,
   auras y evoluciones son excepciones explicitas, acotadas y visibles.
6. Conservar circulo como mayoria. Cruz, X y anillo solo donde el mapa y la
   identidad lo justifican; no asignar una geometria nueva a todos.
7. Mantener despliegue, retiro y movimiento libres, seis plazas, un objeto
   por heroe y nivel persistente. Ni clones ni invocaciones crean plazas extra.
8. No tocar sprites ni mapas. Primeras versiones con proyectiles, indicadores
   y efectos existentes; arte nuevo queda separado y a cargo del usuario.
9. No otorgar buffs permanentes por matar enemigos sin un techo declarado.
   No reintroducir curacion, arbol de habilidades, barricadas ni evacuacion.
10. No nerfear en bloque a los 54 detectores. Primero separar deteccion propia,
    revelado para aliados y dano incidental; luego redistribuir con evidencia.

## Diez fases de implementacion

Todas PENDIENTES. El orden de los lotes de heroes figura en la matriz anexa.
Las fases 3 a 7 se entregan en lotes de hasta 4 heroes para poder probarlos;
un lote no equivale a completar toda la fase. No prometer diez commits exactos.

| Fase | Trabajo | Condicion de cierre |
| --- | --- | --- |
| 1. Contratos y correcciones | Unidades de DoT, blancos validos, geometria, propagacion, acumulaciones, autor de bajas y medidores. | Reproducciones de los fallos y tests nuevos aprobados; textos y efectos concuerdan. |
| 2. Soportes y economia | Diferenciar los 9 soportes, corregir Luke y preservar Domino. Revisar buffs multiplicativos y monedas heredadas. | Soportes sin proyectiles; aura y escalado correctos; 15% por ataque de Domino sin duplicados. |
| 3. Tiradores y tecnologia | Municion, preparacion, precision, artilleria y herramientas limitadas. | Cada tirador tiene una decision distinta; no son el mismo splash con otro color. |
| 4. Combate cercano | Duelo, ejecucion, combos, furia y respuesta contra elites. | Alcance corto conserva valor y riesgo; saltos no cambian la colocacion permanente. |
| 5. Control y terreno | Redes, hielo, agua, zonas, deteccion y telepatia. | Sin perma-stun ni retroceso infinito; diferencia comprobable entre controlar zona y objetivo. |
| 6. Estados y magia | Fuego, veneno, maldiciones, marcas y detonaciones condicionadas. | DoT escala con unidades claras; cada familia tiene counters y reglas de jefe. |
| 7. Potencia cosmica | Rayos, energia acumulada, descarga y alcance especial. | Heroes caros fuertes en su nicho, sin sustituir daño, control y soporte a la vez. |
| 8. Evoluciones y signatures | Revisar los 105 cruces de nivel/objeto sobre la firma nueva. | Tests 49/50/51 y 99/100, con/sin objeto; no exige sprites nuevos ni dobla sin control los multiplicadores. |
| 9. Lectura en interfaz | Ficha compacta: firma, activacion, objetivos, limites y progreso; detalles bajo submenu. | Muestra lo que hace el motor; nada de counters largos que corten las tarjetas del equipo. |
| 10. Balance integral | Comparar equipos, mapas, jefes, economia, persistencia y rendimiento. | Matriz de escenarios aprobada, pruebas de navegador y Railway verificado. |

## Como medir que mejoran

- Una ficha de contrato por heroe: desencadenante, objetivo, efecto, duracion,
  limite, interaccion con jefes, evolucion, objeto y razon para elegirlo.
- Baseline y candidato: niveles 1, 15, 30, 49, 50, 75 y 100; oleadas 1, 24/25,
  49/50, 74/75 y 99/100; misma semilla, posicion, dinero invertido y equipo.
- Probar solitario para entender el kit y equipos de seis para validar su valor.
  Medir dano efectivo, dano extra permitido por buffs, tiempo de control,
  ventanas de deteccion, bajas, monedas/ataque y segundos para matar al jefe.
- Para cada heroe, al menos un escenario donde gana a un par de rareza similar
  y otro donde pierde. Rareza alta no debe dominar todas las columnas.
- Incluir voladores, sigilo, blindaje, inmunidades, objetivos aislados, grupos,
  enemigos fuera de patron y el caso sin enemigos. Probar pausas y retiro
  durante habilidades, para no duplicar recursos ni dejar efectos permanentes.
- Jefes: medir fraccion del tiempo inmovilizados y retroceso neto. Definir
  resistencias/ventanas tras medir, no aumentar HP para tapar un control roto.
- Economia: conservar presupuesto entre derrotas y probar secuencias de 2-3
  intentos fallidos mas un cuarto intento mejorado; objetivo de diseno, no
  garantia artificial de victoria ni castigo al jugador que gana antes.
- Rendimiento: comparar con baseline y semillas fijas. Limitaciones explicitas
  a entidades temporales y propagacion; no recursion ilimitada de procs.
- Validacion por lote: tests focalizados, benchmark si toca combate compartido,
  npm run check al cerrar fase, commit/push y archivos publicos de Railway.

## Entregables y siguiente paso

Ver MATRIZ_IDENTIDAD_HEROES.md para los 105 diagnosticos/propuestas individuales.
Primera implementacion recomendada: fase 1, empezando por DoT y contratos de
blancos. No mezclar esas correcciones con aumentar estadisticas de todo el roster.
No se cambia la progresion actual hasta medir el baseline y aprobar el lote.
