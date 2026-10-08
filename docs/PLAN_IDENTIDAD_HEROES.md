# Identidad y habilidades de los 105 heroes

Fecha: 2026-09-13. Base revisada: commit 553ad63.
Estado: FASE 1 EN CIERRE, diecisiete lotes. FASE 2 IMPLEMENTADA, ocho lotes. FASE 3 IMPLEMENTADA, ocho lotes. FASE 4 EN CURSO, cuatro lotes.
Fases 5 a 10 pendientes. La cobertura comun no certifica el balance individual.
Los hallazgos de auditoria describen el baseline; ver avances abajo para las
correcciones ya realizadas. No equivale a completar el rediseño de los 105 kits.

Esta es una pasada nueva, independiente del cierre de interfaz. El objetivo
no es subir el poder de todos: es que elegir, ubicar y combinar cada heroe
cambie alguna decision real del jugador. Las propuestas requieren validacion
antes de fijar porcentajes, tiempos o requisitos nuevos.

## Alcance y evidencia

### Fase 4, lote 4: Ant-Man y Shang-Chi (2026-10-07)

- Ant-Man prepara tres cargas con ataques diminutos. El siguiente ataque
  gigante consume las tres para el impacto extra existente (50% poder por
  escala de habilidad, 20% penetracion). Recarga minima 4s desde despliegue
  o descarga. Maximo cinco detectables en cobertura a 68px del blanco;
  retroceso 32px, jefes 15px, via applyStatus para respetar inmunidades y
  voladores. Gigante no genera cargas. Splash ordinario gigante conservado.
- Shang-Chi prepara tres ataques y descarga el siguiente cuando cumple 4s
  de recarga desde despliegue/uso. Orbita: 4 rebotes, distancia 110px.
  Rafaga: area 82px y penetracion 50%. Guardia: slow primario 45%/1.5s
  resistible, sin transmitirlo por rebote. Los demas disparos conservan sus
  perfiles. No se agregan auras, curas, ingresos ni cambios de stats base.
- Cambiar forma/patron conserva carga y recarga: permite elegir finalizador,
  pero no genera ataques ni recarga instantanea. Las consultas no consumen
  preparacion; Shang-Chi consume al disparar aunque luego pierda el blanco.
  Sin cambios de sprites, mapas, evoluciones o signatures existentes.
- pym-ring-combo-contract.test.js agrega 31 pruebas, incluyendo niveles
  1/49/50/51/99/100, cada modo, limites de victimas, sigilo sin deteccion,
  inmunidades, retroceso sobre ruta y cambios de modo sin reiniciar recarga.

Validacion: npm run check aprobado, 1.740 tests; economia, campania,
accesibilidad y release sin errores. Smoke desktop 1366x768 y mobile 390x844
sin overflow, desvio de ruta 0px; benchmark p95 0.314ms en esta maquina.

Siguiente lote: Moon Knight e Iron Fist. El balance de equipos completos
permanece pendiente de fase 10; los contratos no certifican cien oleadas.

### Fase 4, lote 3: Gamora y Elektra (2026-10-07)

- Gamora conserva ejecucion inclusiva al 25% del objetivo primario no jefe,
  ignorando defensas. Ahora exige cobertura y deteccion efectivas tambien en
  el kit; no cambia la prioridad primaria elegida por el jugador.
  Cuando no ejecuta, el combo elige hasta dos vecinos a 74px dentro de su
  alcance, primero por menor porcentaje de HP y luego por avance. Conserva
  dano 48% escalado y penetracion 25%; no ejecuta secundarios. El medidor de
  habilidad cuenta remates reales, sin duplicar bajas ni recompensas.
- Elektra prepara Sai Letal durante cuatro segundos desde despliegue o uso.
  El siguiente ataque a un blanco ya sangrante con HP <=50% recibe x1.75 de
  dano y consume preparacion. No exige mantener presa, no garantiza critico,
  no ejecuta ni ignora armadura/barrera de jefes. Consultas, ataques ordinarios
  y cambios de blanco no reinician ni aceleran la recarga. El sangrado aplicado
  por ese mismo proyectil no prepara retroactivamente el remate.
- Conservados sangrado nativo, criticos, Combo Guardian y Apertura Perfecta.
  Sin cambios de sprites, mapas, rarezas, stats base ni evoluciones.
- assassin-finishers-contract.test.js agrega 23 pruebas, incluyendo niveles
  1/49/50/51/99/100, eleccion secundaria, umbrales, recarga, consumo, sigilo,
  cobertura, estado expirado y defensas de jefe. Continuan los contratos de
  ejecucion, recompensas unicas y signatures de fases anteriores.

Validacion: npm run check, 1.709 tests aprobados; economia, campania,
accesibilidad y release sin errores. Smoke desktop 1366x768 y mobile 390x844
sin overflow, desvio de ruta 0px; benchmark p95 0.350ms en esta maquina.

Siguiente lote: Ant-Man y Shang-Chi. El balance de equipos completos sigue
pendiente de fase 10; los contratos no certifican cien oleadas de campania.

### Fase 4, lote 2: Wolverine y X-23 (2026-10-07)

- Wolverine gana 7 de frenesi en el primer ataque y 14 al repetir presa antes
  de 3s. Cambiar o retomar la caza tras esa pausa conserva la mitad del medidor
  antes de sumar 7. Bajas +18, techo 100. Mantiene +18% dano y +20% cadencia
  al maximo; se elimina la aceleracion adicional por cantidad de enemigos.
  Tras 3s sin atacar decae 12/s. Mover, retirar o aturdir vacia la carga.
- Conserva salto por 55, alcance especial 3x, recarga 7s y regreso 0.8s.
  El salto autonomo no cuenta como recolocacion; un movimiento manual durante
  el salto cancela el retorno antiguo. Stun devuelve al puesto sin congelar
  al heroe en la posicion temporal. No mueve al enemigo ni cura la base.
- X-23 prepara tres ataques contra la misma presa. Su siguiente ataque contra
  esa presa sangrante es critico garantizado de al menos x3, no multiplicado
  otra vez por el critico normal; respeta un multiplicador de objeto superior.
  Consume preparacion incluso si luego el proyectil pierde su blanco. No es
  ejecucion ni dano porcentual; armadura y resistencias siguen vigentes.
  Cambio, movimiento, stun, muerte, perdida de cobertura/sigilo o pausa de
  2.5s reinician cortes. Sin sangrado espera a tres, sin acumular mas.
- Se conservan sangrado nativo, Berserker y Corte Multiple con Danger Room.
  Sin cambios de sprites, mapas, rarezas ni estadisticas base/evoluciones.
- claw-pursuit-contract.test.js agrega 30 pruebas; niveles 1/49/50/51/99/100,
  jefes, criticos, perdida de preparacion, temporalidad, retorno y signatures.

Validacion: npm run check aprobado, 1.686 tests; economia, campania,
accesibilidad y release sin errores. Smoke desktop 1366x768 y mobile 390x844
sin overflow, desvio de ruta 0px; benchmark p95 0.324ms en esta maquina.

Siguiente lote: Gamora y Elektra. Sigue pendiente la simulacion de equipos
completos de fase 10; estos contratos no certifican el balance de campania.

### Fase 4, lote 1: Hulk y She-Hulk (2026-10-07)

- Hulk deja de recibir furia por perder vidas. Carga 8 por ataque y 6/s por
  enemigo detectable dentro de su alcance real, contando hasta tres. Limite
  100; conserva +0.4% dano por punto, pero se elimina la cadencia por furia.
  Conserva salto por 50, alcance especial 2.25x, radio 72, dano 120% escalado,
  stun 0.65s y recarga base 8s. La explosion incidental conserva su contrato.
- She-Hulk prepara Objecion con tres ataques y espera cuatro segundos desde
  despliegue o activacion. El siguiente ataque la descarga; estar lista no
  dispara solo. Dano adicional 55% escalado, principal y hasta tres vecinos
  detectables a 58px, marca 14%/2.4s. Retroceso 38px (18px jefes) ahora pasa
  por applyStatus para respetar inmunidades y voladores. Solo el principal
  recibe stun 0.7s resistible; no cancela habilidades de boss ni provoca.
  Se elimina control aleatorio por ataque. No cambia la prioridad del jugador.
- Se conserva el enfoque del objeto signature de She-Hulk y el escalado
  existente por nivel/evolucion. No cambian sprites, mapas, dinero ni vidas.
- Contratos nuevos en gamma-pressure-contract.test.js: 19 pruebas, incluyendo
  niveles 1/49/50/51/99/100, recarga, limite de objetivos, sigilo, inmunidades,
  presion por tiempo y ausencia de beneficios por perder vidas.

Validacion: npm run check aprobado, 1.656 tests; simulaciones de economia y
campania, accesibilidad y release sin errores. Smoke desktop 1366x768 y mobile
390x844 sin overflow, desvio de ruta 0px. Benchmark p95 0.305ms en esta maquina.

Pendiente: resto de fase 4, proximo lote Wolverine y X-23. Las pruebas de
contrato no certifican el equilibrio de equipos en cien oleadas; fase 10.

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

Fase 1 EN CIERRE; fase 2 IMPLEMENTADA; fase 3 EN CURSO; fases 4 a 10 PENDIENTES.
Fase 2 cumple sus contratos funcionales; no cierra la revision textual de fase 1,
los cruces de objetos de fase 8 ni el balance integral de fase 10.
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
Continuar fase 1 con el inventario de efectos restantes y las excepciones de
objetivos secundarios. No mezclar esas correcciones con aumentar estadisticas
de todo el roster. La progresion, rarezas, sprites y mapas no cambian en este lote.

## Fase 1: primer lote, 2026-09-13

Implementado:

- Contrato damageBasis: flat = dano/segundo; attackDamage = fraccion del dano
  efectivo del heroe/segundo; maxHealth = fraccion de salud maxima/segundo.
  El valor se captura al aplicar el estado; un buff posterior no altera el
  estado existente. Solo una nueva aplicacion puede sustituirlo.
- Compatibilidad: burn/bleed sin unidad siguen planos; poison/curse sin unidad
  siguen usando salud maxima. No convertir los objetos heredados en porcentajes.
  El minimo de 1 por tick se conserva en estados heredados; los explicitos
  admiten dano fraccionario y cero. Valores negativos/no finitos se rechazan.
- Sentry: quemadura de 30% del dano efectivo/s. X-23: sangrado de 25%/s.
  Drax y Tigra: sangrado de 20%/s. Conservan probabilidad, duracion, dano base,
  rareza, alcance y cadencia. Las descripciones ahora indican el efecto real.
- Quemadura/sangrado no acumulan: se conserva el DPS mas fuerte y su fuente;
  repetir refresca la duracion maxima restante sin sumarla. Veneno conserva
  su bolsa compartida de hasta 12 stacks y atribucion a la fuente mas fuerte.
  No se afirma que sea todavia un sistema individual de stacks por atacante.
- Las bajas por estado pasan la victima al heroe; Hero transmite esa victima
  a los kits. Una aplicacion debil no se apropia del dano ni de la baja fuerte.
- Campo temporal y portal de Strange respetan anillo, sigilo y alcance
  efectivo. El portal no dispara sobre un muerto sin alternativas validas.
  Tormenta de Thor cuenta solo objetivos que puede detectar.
- Indicadores de Extremis e Iron Spider usan sus umbrales reales de 2 ataques
  o redes; las versiones base conservan 3.

Comparacion de DPS del estado activo, sin objetos, auras ni evolucion por objeto:

| Heroe | Nivel 1 | Nivel 30 | Nivel 50 | Nivel 100 |
| --- | ---: | ---: | ---: | ---: |
| Sentry | 21.9 | 117.9 | 267.6 | 657 |
| X-23 | 11.25 | 60.5 | 122.75 | 270 |
| Drax | 9 | 48.4 | 92.4 | 189 |
| Tigra | 6.2 | 33.4 | 63.6 | 130.2 |

Antes, todos daban 2 de dano durante el primer segundo por el minimo de tick.
La tabla NO es DPS total de combate ni incluye la probabilidad de aplicacion;
no garantiza vencer un jefe. Se usa el escalado real de HeroLevel por rareza.
Los ticks siguen siendo de 0.5 s (burn) y 0.4 s (bleed), con la resistencia de
estado existente acortando duracion. No se cobra un tick parcial al expirar.
Un jefe de 100.000 o 1.000.000 HP recibe el mismo dano de estos cuatro estados.

Validacion focalizada: 37 pruebas aprobadas (habilidades, contratos DoT y datos).
Incluye niveles 1/30/50/100, distintas salud maxima, snapshot, refresco, fuentes,
unidades invalidas, fracciones, limite de veneno, sigilo y punto ciego.
Validacion completa: npm run check aprobado, 734 tests, simulaciones de economia
y campana, auditoria de datos/accesibilidad/lanzamiento y smoke de navegador
desktop 1366x768 y mobile 390x844 sin overflow. Benchmark: tick p95 0.096 ms
con 150 enemigos, 300 proyectiles y 120 VFX; no es una medicion de FPS en movil.

Pendiente para cerrar fase 1: migrar otros DoT y objetos con evidencia, declarar
alcance/sigilo de splash, rebotes, rayos y propagacion en los cuatro kits;
probar contagio, autoria y acumulaciones en equipos mixtos. Los futuros kits
de duelo, remate y energia solar de la matriz siguen siendo propuestas.

## Fase 1: segundo lote, 2026-09-13

Corregidos Howard, Valkyrie, Elektra y Deadpool: sus quemaduras/sangrados usan
damageBasis=attackDamage. Se conservan probabilidades, duraciones y stats base;
los textos ya no prometen una prioridad, bono de terreno o doble cadencia
inexistentes. Howard mantiene tiradas separadas de quemadura y slow.
Se actualizaron tambien las definiciones generadoras de Elektra y Deadpool,
sin ejecutar la reconstruccion del roster que cambiaria datos ajenos al lote.

| Heroe | Poder DoT por segundo | Nivel 1 | Nivel 30 | Nivel 50 | Nivel 100 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Howard | 12% dano efectivo | 2.4 | 12.84 | 23.04 | 43.2 |
| Valkyrie | 20% dano efectivo | 8.4 | 45.2 | 86.2 | 176.4 |
| Elektra | 22% dano efectivo | 5.06 | 27.06 | 51.92 | 106.26 |
| Deadpool | 20% dano efectivo | 5.2 | 28 | 56.8 | 124.8 |

Antes, los cuatro hacian 2 de dano en el primer segundo por el minimo de tick.
Las cifras nuevas son DPS del estado activo, no dano total ni DPS esperado
incluyendo probabilidad; sin objetos, buffs ni transformaciones por objeto.
No se cambio la progresion ni se completaron sus futuras firmas individuales.

Corregido el limite de probabilidad en CombatSystem: random debe ser menor
que chance; chance=0 no puede activar un efecto con random=0.
Explosion y rebote mantienen solo dano secundario; propagacion transmite
estados con tiradas independientes, centrada en el impacto y sin recursion.
El contrato detallado y sus excepciones estan en CONTRATO_IMPACTOS_SECUNDARIOS.md.

Validacion focalizada: 39 pruebas aprobadas. Cuatro casos nuevos de escalado
1/30/50/100 y nueve pruebas de impactos secundarios, sigilo/voladores incidentales,
limites/radios, autoria, monedas, bajas, estados y probabilidad cero.
Validacion completa: npm run check aprobado con 747 tests y simulaciones;
benchmark p95 0.108 ms; smoke desktop/mobile sin overflow ni desvio de ruta.

Pendiente de fase 1: Hela, los DoT planos mayores y los objetos termicos; reglas
de rayos y ataques de los cuatro kits; acumulaciones mixtas y resistencias de
jefes. Los ocho heroes corregidos hasta aqui no equivalen a ocho kits rediseñados.

## Fase 1: tercer lote, 2026-09-13; cierre 2026-09-14

Migrados los tres objetos termicos del catalogo. Nuevo campo numerico
burnAttackDamagePct, convertido en efecto burn con damageBasis=attackDamage.
La agregacion sigue limitada a un objeto; no se amplia el sistema de slots.

| Objeto | Rareza | Probabilidad | Duracion | Dano efectivo del heroe/s |
| --- | --- | ---: | ---: | ---: |
| Emisor termico | Common | 18% | 3 s | 12% |
| Protocolo Extremis | Legendary | 25% | 4 s | 18% |
| Formula Phoenix | Mythic | 45% | 5 s | 30% |

Antes, los tres hacian 2 de dano en el primer segundo por el minimo de tick.
Con 100 de dano efectivo del heroe, el estado activo ahora hace 12, 18 o 30
por segundo, independientemente de la salud maxima del enemigo. Esto no es
el DPS total ni incluye probabilidad/tiempo sin estado. Sin cambios de precio,
rareza, duracion, probabilidad, efectos secundarios o sprites.

- El dano se captura al aplicar; incluye una sola vez los buffs efectivos
  (tambien el +18% de Extremis con 10 vidas o menos). No incluye el critico
  del impacto ni multiplica nuevamente por el bono contra enemigos quemados.
- Fuego del heroe y del objeto no se suman: queda el estado mas fuerte segun
  el contrato del lote 1. Phoenix no propaga fuego con su splash de dano;
  permanece el contrato de impactos secundarios del lote 2.
- Los objetos ya equipados se resuelven por ID contra el catalogo actual al
  cargar, probado con un guardado que usaba los valores anteriores. No hay
  que recomprarlos. burnPower legacy sigue siendo dano plano; el validador
  rechaza mezclar ambas unidades o coeficientes nuevos fuera de [0, 1].
- El inventario distingue poder/s de dano plano/s, compara el porcentaje
  al cambiar objeto e incluye estos objetos en el filtro de dano. Las fichas
  y el generador de objetos describen el efecto real.
- Los soportes puros no disparan por equipar un objeto termico. Sin curacion
  de base, sin aplicar mas de un objeto, sin cambios en monedas de Domino.

Validacion: npm run check aprobado, 759 tests; escalado en niveles 1/50/100
y enemigos de 100.000/1.000.000 HP, buff de baja vida, quemaduras simultaneas,
probabilidad/poder cero, compatibilidad, guardado y comparacion de inventario.
Benchmark p95 0.092 ms. Smoke ampliado con los tres objetos en desktop/mobile
y capturas temporales del inventario para revision visual.

Siguiente: Hela y los DoT planos de mayor valor (incluidos los kits); despues
cerrar excepciones de rayos, acumulaciones mixtas y resistencias de jefes.
Venenos y maldiciones porcentuales conservan sus valores en este lote.

## Fase 1: cuarto lote, 2026-09-14; cierre 2026-09-15

Migrados Hela, Blade, Ghost Rider y Star-Lord a unidades explicitas para sus
sangrados/quemaduras. Sin cambios de rareza, dano base, cadencia, rango base,
sprites, monedas, penitencia, retroceso o evolucion.

| Heroe | Efecto | Poder/s | Duracion | Probabilidad |
| --- | --- | ---: | ---: | ---: |
| Hela | Sangrado | 24% dano efectivo | 3.2 s | 42% |
| Blade | Sangrado normal | 21% dano efectivo | 3.6 s | 100% |
| Blade | Sangrado contra jefe o amenaza 4+ | 30% dano efectivo | 5 s | 100% |
| Ghost Rider | Quemadura | 13.5% dano efectivo | 4 s | 100% |
| Star-Lord | Quemadura, modo incendiario | 23% dano efectivo | 3 s | 100% |

La maldicion de Hela y el veneno de Blade conservan sus porcentajes de salud
maxima. No confundirlos con el sangrado del mismo impacto: son estados distintos.
Hela sigue teniendo 48% de aplicar curse de 0.42% salud maxima/s durante 4.5 s;
Blade conserva poison de 0.38% salud maxima/s durante 3.8 s, chance 42%.

Ghost Rider tenia fuego duplicado: el kit aplicaba 9 DPS durante 4 s y los
datos repetian 9 DPS con chance 40% durante 4.2 s. Se retira la segunda entrada;
ahora existe una sola quemadura garantizada de 4 s. Se elimina tambien esa
prolongacion aleatoria de 0.2 s, sin sumar el fuego del objeto al del kit.

Comparacion de DPS del estado activo, sin objetos ni buffs externos; Blade
en variante elite. Los niveles usan HeroLevel y su rareza real:

| Heroe | DPS previo | Nivel 1 nuevo | Nivel 30 | Nivel 50 | Nivel 100 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Hela | minimo por tick | 16.56 | 89.04 | 191.52 | 447.12 |
| Blade (elite) | 10 plano | 10.04 | 54.11 | 109.51 | 241.06 |
| Ghost Rider | 9 plano | 9.18 | 49.41 | 106.25 | 247.86 |
| Star-Lord | 7 plano | 6.9 | 37.03 | 70.84 | 144.9 |

En el probe previo de un segundo, Hela hacia 2 y Blade elite 8 (dos ticks de
0.4 s); las quemaduras hacian 9/7. La tabla es DPS del estado activo, no dano
total ni dano esperado por segundo incluyendo fallos o periodos sin estado.

Star-Lord: el segundo blaster elige un blanco distinto con el helper de alcance
efectivo, patron geometrico y deteccion, en vez de ignorar sigilo y usar rango
base. Es otro disparo dirigido, no un rebote incidental. Mantiene su factor
de dano de proyectil y transmite la municion preparada, sin duplicar sobre un
jefe aislado. Cambiar modo no convierte los estados/proyectiles existentes.

El filtro Persistente reconoce los tres kits (Blade, Ghost Rider, Star-Lord)
por ID, no solo buscando palabras en descripciones o efectos en JSON. Se
conserva Ghost Rider en el filtro al quitar su entrada redundante en datos.
El estimador heuristico de presupuesto conserva la utilidad de su quemadura
de kit: quitar la entrada duplicada no significa perder el efecto. El check
de rarezas vuelve a exigir cero cambios de dano base, sin relajar tolerancias.

Validacion focalizada: 22 pruebas de kits/DoT; diez casos nuevos de escalado,
elite, estados independientes, no duplicacion, cambio de modo, sigilo y rango.
Se agrega una regresion de clasificacion independiente de las descripciones.
Validacion completa: npm run check aprobado con 770 tests, simulaciones de
economia/campana y check de rarezas. Benchmark p95 0.141 ms; smoke desktop
1366x768 y mobile 390x844 sin overflow ni desvio de ruta. Comparados los 105
registros contra HEAD: rareza, dano base, rango, cadencia y coste sin cambios.

Pendiente de fase 1: quemaduras planas de Captain Marvel, War Machine y Human
Torch; excepciones de rayos/otras habilidades; resistencias y acumulaciones
mixtas. Los rediseños distintivos de fases 2 a 10 siguen pendientes.

## Fase 1: quinto lote, 2026-09-15

Captain Marvel, War Machine y Human Torch dejan de usar quemadura plana.
Ahora capturan el dano efectivo al aplicar el estado (damageBasis attackDamage),
sin cambiarlo retroactivamente ni acumularlo con otras quemaduras. Se conservan
probabilidades, duraciones y perfiles de explosion, ademas de rarezas, dano
base, rango, cadencia, costes, sprites y evoluciones.

| Heroe | Poder/s | Duracion | Probabilidad | DPS previo | DPS nivel 1 | Nivel 30 | Nivel 50 | Nivel 100 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Captain Marvel | 9.5% | 3.6 s | 34% | 8 | 8.075 | 43.51 | 93.385 | 218.025 |
| War Machine | 14% | 2.4 s | 18% | 5 | 4.9 | 26.32 | 50.26 | 102.9 |
| Human Torch | 37.5% | 2.5 s | 34% | 12 | 12 | 64.5 | 130.875 | 288 |

DPS del estado activo, sin objetos ni buffs externos; Captain Marvel sin
energia. No representa el DPS total ni la probabilidad de mantener el estado.
La energia binaria aumenta el dano capturado exactamente una vez. Ganar o
gastar energia despues no modifica una quemadura ya aplicada.

El dano de area de War Machine y Human Torch no transmite quemadura a los
vecinos: solo el impacto principal puede quemar. Las descripciones lo aclaran.
Una quemadura de objeto compite por DPS con la nativa; no se suman. Formula
Phoenix gana frente a Captain Marvel/War Machine, mientras que Human Torch
conserva su quemadura mas fuerte. Sin curacion de base.

Pruebas focalizadas: 29 aprobadas, 13 nuevas. Cubren niveles 1/30/50/100,
salud enemiga 100.000/1.000.000, energia 0/60/100, limites de probabilidad,
explosion sin transmision, objetos y declaracion de unidades en el catalogo.
Comparados los 105 heroes contra el commit anterior: cero cambios de rareza,
dano base, alcance, cadencia o coste.

Validacion completa: npm run check aprobado, 783 tests, simulaciones de economia
y campana, check de rarezas, accesibilidad y lanzamiento sin errores. Benchmark
p95 0.097 ms; smoke desktop 1366x768 y mobile 390x844 sin overflow ni desvio
de ruta. Bootstrap regenerado desde el catalogo actualizado.

Pendiente de fase 1: auditar DoT de ItemSignatureSystem y evoluciones (incluido
el sangrado de X-23 y el helper burn), excepciones de rayos/otras habilidades,
resistencias y acumulaciones mixtas. La comprobacion de unidades del catalogo
no garantiza que todos los efectos generados por kits/signatures esten migrados.
Los redisenos distintivos de fases 2 a 10 siguen pendientes.

## Fase 1: sexto lote, 2026-09-15

Revisadas cuatro quemaduras de firmas en ItemSignatureSystem: Human Torch,
Jubilee, Jean Grey y Crystal. El probe previo con evolucion real a nivel 50
confirmo 2 de dano en un segundo para las tres primeras (poder plano 0.018,
0.012 y 0.022, atrapado en el minimo por tick). Crystal no aplicaba fuego en
su primera firma: elementIndex undefined seleccionaba variants[NaN].

| Heroe | Objeto requerido | Activacion | Quemadura | Duracion |
| --- | --- | --- | --- | --- |
| Human Torch | Traje de Moleculas Inestables | Cada 7 ataques | 45% poder/s en area | 4 s |
| Jubilee | Protocolo Danger Room | Cada 10 ataques | 20% poder/s en area | 3 s |
| Jean Grey | Formula Phoenix | Cada 8 ataques | 36% poder/s en area | 5 s |
| Crystal | Cristal Terrigeno | Cada 7 ataques alterna fuego, hielo y rayos | Fuego 20% poder/s en area | 4 s |

Todos requieren evolucion por nivel (50) y el objeto equipado. No basta
poseerlo, ni colocarlo en un segundo slot invalido. Sin objeto se conserva
la evolucion normal. Crystal empieza con fuego y repite el ciclo de tres
elementos; su fuego vuelve cada 21 ataques. No se modifican hielo/rayos.

La escala usa dano efectivo, no salud maxima ni dano del proyectil critico.
Nova Flame supera ligeramente el fuego nativo (45% vs 37.5%); Dark Phoenix
supera el fuego generico del objeto (36% vs 30%). No suman dos quemaduras.
Jubilee y Crystal usan 20% por su menor especializacion en fuego. Son ajustes
iniciales de presupuesto; no equivalen a validar todas las composiciones.
Se conservan intervalos, radios, factores de impacto, duraciones, costes,
stats del objeto, requisitos, sprites y estadisticas base de los 105 heroes.

Los pulsos signature ya transmitian sus estados al area, a diferencia del
splash ordinario. Se documenta y prueba esa excepcion sin activarla globalmente.
Las descripciones de los cuatro objetos incluyen efecto e intervalo, sin
agregar elementos nuevos a las tarjetas ni ampliar la interfaz.

Regresiones nuevas: 15, mas las tres pruebas previas de signatures. Incluyen
evolucion real 49/50/75/100, salud enemiga 100.000/1.000.000, area limitada,
captura de buffs, mezcla con fuego nativo/objeto, ciclo completo de Crystal
y activacion exacta desde Hero.shoot. Se mantiene la prueba del soporte puro
Captain America con Mjolnir: no dispara ni cura la base.

Validacion completa: npm run check aprobado con 798 tests, simulaciones de
economia/campana y check de rarezas. Benchmark p95 0.097 ms; accesibilidad y
lanzamiento sin errores, smoke desktop 1366x768 y mobile 390x844 sin overflow
ni desvio de ruta. Comparacion estructural: catalogo de 105 heroes intacto,
82 objetos sin cambios salvo las cuatro descripciones. Bootstrap regenerado.

Pendiente: sangrado de la firma de X-23, otros contadores rotativos (Deadpool
y Kate Bishop usan la misma inicializacion sospechosa), contratos de rayos,
resistencias y acumulaciones mixtas. La fase 1 sigue abierta.

## Fase 1: septimo lote, 2026-09-16

Corregidos Corte Multiple de X-23 y los ciclos de Arsenal sin Fondo (Deadpool)
y Flechas Truco (Kate Bishop). Antes del cambio, cinco regresiones nuevas
fallaban: sangrado plano sin escalado, incapaz de superar el sangrado nativo,
Deadpool arrancando con proyectiles genericos y Kate omitiendo su explosion.

- X-23 con Protocolo Danger Room: cada 10 ataques lanza hasta tres cortes a
  blancos distintos. Cada uno conserva 70% del dano efectivo de impacto y
  aplica sangrado garantizado de 30% del dano efectivo/s durante 4 segundos,
  frente al 25% nativo. No se suman ambos: se conserva el DPS mas fuerte.
  Antes, 0.014 plano caia en el minimo de dano por tick. No se convierte a
  porcentaje de vida enemiga. Ante un jefe aislado solo hay un corte especial.
- Deadpool con Arsenal sin Fondo: cada 3 ataques activa pistolas (72% dano,
  hasta 2 blancos), katana (118%, un blanco) o explosivos (92%, hasta 2 blancos,
  radio 48). Se conservan todos esos factores; se inicializa el contador para
  empezar con pistolas en vez de un disparo generico al 50%.
- Kate Bishop con Carcaj: cada 4 ataques activa explosion (90% dano, radio 48),
  ralentizacion (72% dano, slow 48% por 1.8 s) o rotura de armadura (82% dano,
  armorBreak 20% por 3 s). Se inicializa el contador: ya no empieza con un pulso
  generico al 75% sin explosion. Cada ciclo vuelve correctamente al inicio.

Todos requieren evolucion de nivel 50 y el objeto en el unico slot. Se
actualizan las tres descripciones, sin modificar rarezas, costes, stats de
objetos, atributos base, sprites, mapas ni requisitos de evolucion.

Once regresiones nuevas; 29 pruebas focalizadas incluyendo lotes previos.
Cubren nivel 49 bloqueado, evolucion/objeto, niveles 50/75/100, enemigos de
100.000/1.000.000 HP, limite de blancos, jefe aislado, sigilo, alcance, mezcla
de sangrados, captura de buffs y una sola baja por DoT sin curacion de base.
Las pruebas de X-23 usan los proyectiles reales y su ruta de impacto. Los
contadores de Deadpool se comprueban independientes entre instancias.

Validacion completa: npm run check aprobado, 809 tests, simulaciones de
economia/campana y check de rarezas. Benchmark p95 0.126 ms; accesibilidad y
lanzamiento sin errores. Smoke desktop 1366x768 y mobile 390x844 sin overflow
ni desvio de ruta. Catalogo de heroes intacto; 82 objetos sin cambios salvo
las tres descripciones. Bootstrap regenerado.

Pendiente de fase 1: contratos de rayos y seleccion secundaria en otras
habilidades, resistencias y acumulaciones mixtas. El sangrado y los ciclos
de este lote dejan de estar pendientes; fases 2 a 10 siguen sin completar.

## Fase 1: octavo lote, 2026-09-19

Confirmado primero el despliegue pendiente abc4db7: codigo y datos publicos
de Railway coinciden con el commit de X-23/Deadpool/Kate Bishop.

Captain Marvel elegia objetivos de su pasada solo por distancia, ignorando
sigilo. Ahora usa el helper de seleccion con deteccion efectiva, conservando
su alcance especial 2.2x. Sin blanco detectable no consume energia ni cooldown;
con deteccion puede apuntar a ocultos. Las victimas incidentales en la linea
siguen recibiendo dano aunque sean invisibles, sin que eso las revele.

Su rayo visual terminaba en el destino del vuelo (objetivo, 34 px arriba),
mientras el dano seguia una recta mas larga. Ahora el endpoint visual se
calcula con la misma direccion y longitud del dano. El vuelo conserva su
destino, 1.25 segundos y regreso al origen; coste 60, cooldown, dano,
penetracion y ancho de impacto quedan sin cambios.

La ruta compartida strikeLine de objetos usaba targets.at(-1) como extremo
visual: dependia del orden de enemigos, no del alcance real. Se corrige a
endpoint geometrico para los siete consumidores: Quake, Nebula, Ms. Marvel,
Squirrel Girl, Yondu, Silver Surfer y Ant-Man. Es una correccion compartida
de representacion, no un rediseño de siete kits. No cambian intervalos,
longitudes, dano ni estados aplicados por esos rayos.

Doce pruebas nuevas; nueve fallaban antes del arreglo. Las 23 focalizadas
incluyen deteccion, consumo de energia, vuelo/regreso, cooldown, alcance
especial, dano incidental, todos los consumidores de strikeLine, enemigos
detras/fuera de ancho/fuera de longitud y ejes vertical/horizontal/diagonal.
La geometria mantiene limites inclusivos y el tratamiento de origen coincidente.

Validacion completa: npm run check aprobado con 821 tests, simulaciones de
economia/campana y check de rarezas. Benchmark p95 0.098 ms; accesibilidad y
lanzamiento sin errores, smoke desktop 1366x768 y mobile 390x844 sin overflow
ni desvio de ruta. Catalogos, stats, sprites y mapas no modificados.

Pendiente de fase 1: otras selecciones autonomas y excepciones de kits,
resistencias y acumulaciones mixtas. Fases 2 a 10 siguen pendientes.

## Fase 1: noveno lote, 2026-09-19

Corregido el tiempo de DoT descartado al expirar. Las resistencias de Thanos
reducen la quemadura de War Machine de 2.4 a 0.48 segundos; el tick ocurre
cada 0.5, por lo que una aplicacion aislada antes no causaba dano. Ahora
liquida el tiempo restante proporcionalmente: nivel 1, 4.9 DPS * 0.48 s =
2.352 de dano. El jefe conserva exactamente su resistencia.

El motor comparte la aplicacion de ticks completos y finales, incluida
barrera, ignorar armadura, registro de dano y autoria de una sola baja.
Solo estados con damageBasis explicito reciben el tick parcial al expirar.
Los legacy sin unidad (incluidos venenos/maldiciones aun no migrados)
conservan su minimo y ticks completos; no se les aumenta dano silenciosamente.
Mientras dura el estado no se altera la frecuencia de sus ticks. Refrescarlo
no anticipa el pago del residuo ni suma dos fuentes de quemadura/sangrado.

Se mantienen inmunidades y resistencia de duracion con piso de 20%, sin
aplicar otro descuento al DPS. Los catalogos de heroes, enemigos, objetos y
evoluciones no cambian; tampoco sprites, mapas, monedas ni curacion de base.

18 pruebas nuevas, 14 reproducian el problema antes del cambio. Las 64
focalizadas incluyen los cuatro tipos de DoT explicito, pasos de simulacion
desde 1/60 s a 3 s, expiracion/refresh, cero dano, barrera, una sola baja,
resistencias reales de Loki/Ultron Prime/Thanos con War Machine y X-23,
inmunidades de Thanos y limite compartido de doce venenos.

Validacion completa: npm run check aprobado, 839 tests, simulaciones de
economia/campana y check de rarezas. Benchmark p95 0.088 ms; accesibilidad y
lanzamiento sin errores, smoke desktop 1366x768 y mobile 390x844 sin overflow
ni desvio de ruta. Sin cambios de datos ni regeneracion de bootstrap necesaria.

Pendiente confirmado: la bolsa actual de veneno multiplica el DPS mas fuerte
por todos los stacks. Un probe con fuentes de 10 y 1 DPS inflige 20 en un
segundo, no 11; ademas conserva autoria y duracion compartidas. Su migracion
a contribuciones independientes requiere decidir reemplazo al llegar al cap
y probar efectos sobre jefes; no se implementa en este lote. Otras selecciones
autonomas de kits siguen pendientes. La fase 1 no esta terminada.

## Fase 1: decimo lote, 2026-09-20

Veneno migra de una bolsa que multiplicaba el mayor DPS por todos los stacks
a un maximo compartido de doce contribuciones independientes. Cada aplicacion
captura su DPS, fuente, duracion resistida y reloj; 10 + 1 DPS ahora suman 11,
no 20. Aplicaciones de la misma fuente tambien expiran por separado. Los
ticks se resuelven en orden temporal entre venenos para conservar la autoria
de la baja incluso con frames largos. No cambia el orden entre otros estados.

Al llegar a doce, un veneno mas potente reemplaza al mas debil (en empate,
al de menor duracion restante), pagando antes su tiempo pendiente a su autor.
Un golpe igual o menor solo puede refrescar una contribucion equivalente de
su propia fuente, sin reiniciar el reloj. Otra fuente no prolonga ni se apropia
de esos stacks. Una baja durante el reemplazo detiene nuevas aplicaciones.

Esta migracion incluye el veneno legacy sin damageBasis: sigue usando porcentaje
de vida maxima, pero ahora admite dano fraccionario y liquida el tiempo final,
igual que el explicito. Se elimina el minimo de un punto por tick para veneno;
evita inflar doce aportes pequenos y permite que venenos cortos danen a jefes.
Burn, bleed y curse sin unidad conservan su contrato anterior. No se modifican
potencias, chances, duraciones base ni resistencias de los catalogos.

El indicador visual sigue siendo un solo estado con contador de stacks, y los
objetos que cuentan estados distintos no cuentan cada acumulacion como otro
estado. No hay curacion de base, ni cambios de sprites, mapas o datos.

14 regresiones nuevas; 51 pruebas focalizadas. Incluyen dano y autoria por
fuente, expiracion, limite, reemplazo, refresh, dano fraccionario, captura de
buffs, una sola baja y los efectos reales de Black Widow, Blade, Elsa Bloodstone,
Venom y Yelena contra Ultron Prime y Thanos, con distintos pasos de simulacion.

Validacion completa: npm run check aprobado, 853 tests, simulaciones existentes
de economia/campana y check de rarezas. Benchmark ampliado a 150 enemigos con
12 venenos cada uno, 300 proyectiles y 120 VFX: promedio 0.161 ms, p95 0.321 ms
(limite 16.67 ms). Accesibilidad y lanzamiento sin errores; smoke desktop
1366x768 y mobile 390x844 sin overflow ni desvio de ruta. Las simulaciones de
campana son estimaciones, no demuestran por si solas balance integral de DoT.

La acumulacion mixta de veneno deja de estar pendiente. Quedan otras selecciones
autonomas y excepciones de kits en fase 1; fases 2 a 10 siguen pendientes.

## Fase 1: undecimo lote, 2026-09-20

Cuatro fijaciones autonomas pasan por getTargetsInRange, que exige vida,
deteccion efectiva y patron geometrico. Mantienen prioridad por avance y
alcances especiales: salto gamma de Hulk 2.25x, Wolverine 3x, zona climatica
de Storm 1x y Penitencia de Ghost Rider 1.3x (solo jefes).

Fallos reales corregidos: Hulk sin deteccion podia anclar su area a un oculto;
Storm podia centrar clima en ocultos y dentro del punto ciego de su anillo.
Wolverine y Ghost Rider conservan deteccion innata: sus pruebas sin deteccion
validan el contrato del helper, no implican que antes carecieran de ella.
La deteccion aliada efectiva de Falcon permite fijar ocultos correctamente.

Sin candidato valido no se gastan recursos ni inicia cooldown. Se conservan
costes de furia/frenesi, dano, escalado, cooldowns, regreso de Wolverine,
condicion de jefe y formula de Penitencia. No cambia el dano incidental:
Hulk mantiene radio 72 con stun; la zona existente de Storm permanece fija y
puede afectar ocultos, voladores y punto ciego sin revelarlos. El anillo limita
su centro, no recorta la zona ya creada. Sin cambios de catalogos ni bootstrap,
sprites, mapas, curacion, rarezas, economia o habilidades de soporte.

23 regresiones nuevas, 11 fallaban antes del arreglo. Las 59 focalizadas
cubren ocultos, muertos, prioridad por avance, limites inclusivos de rango,
punto ciego, voladores, cooldown, deteccion aliada, efectos incidentales,
regreso del salto, objetivos no-jefes y limite/formula de Penitencia.

Validacion completa: npm run check aprobado con 876 tests; simulaciones de
economia/campana y check de rarezas sin ajustes. Benchmark p95 0.388 ms con
150 enemigos y doce venenos por enemigo; accesibilidad y lanzamiento sin
errores. Smoke desktop 1366x768 y mobile 390x844 aprobado sin overflow ni
desvio de ruta. Estas comprobaciones no prueban balance integral de los kits.

Pendiente de fase 1: revisar contratos de pulsos autonomos (Phoenix/Hex),
reconocimiento de Redwing y zonas de raices, y las excepciones de objetos
que aun no tengan cobertura especifica. No equivale al rediseno de estos
cuatro heroes: sus nuevas firmas siguen en las fases correspondientes.

## Fase 1: duodecimo lote, 2026-09-20

Groot usa seleccion compartida para centrar raices sobre un enemigo vivo y
detectable dentro de 1.35x su alcance. Antes podia activarlas sobre un oculto
sin deteccion. No cambia la zona posterior: radio 48, 3.2 s, slow 68%/0.4 s,
cooldown 10 s, centro fijo y efecto incidental sin desplazar ni revelar.

Corregida la deteccion compartida de Falcon que seguia activa durante stun.
Recon la concede solo mientras esta desplegado, activo y a 165 px del aliado;
asalto no la concede. Se preserva la deteccion innata y otras fuentes activas.
La marca de Redwing no elimina sigilo: se corrige esa promesa en la descripcion
del catalogo y su script generador, sin cambiar sus factores, intervalos,
prioridades o alcances de modo. Bootstrap regenerado con el texto nuevo.

Declaradas y probadas dos excepciones existentes, sin alterar sus kits:
Phoenix y Hex son pulsos centrados en el heroe, no ataques que fijan blanco.
Conservan radio circular incidental, incluidos ocultos/voladores y puntos que
el patron normal no cubriria, sin revelar. Phoenix respeta carga, evolucion,
cooldown y retroceso reducido para jefes; no empuja voladores. Hex conserva
slow y resistencia de duracion. Sin enemigos vivos en radio no se consumen.

16 pruebas nuevas, tres reproducian los fallos antes de corregirlos; 60
focalizadas aprobadas. Cubren limites, sigilo, zona estacionaria, modos de
Redwing, presencia/stun, deteccion ajena, pulsos vacios, carga insuficiente,
formula de Phoenix normal/evolucion y resistencia de Hex. El caso de dos
Falcon es una prueba de robustez de la busqueda de auras, no habilita duplicados.

Validacion completa: npm run check aprobado con 892 tests, simulaciones de
economia/campana y check de rarezas sin ajustes; benchmark p95 0.319 ms.
Accesibilidad y lanzamiento sin errores; smoke desktop 1366x768 y mobile
390x844 sin overflow ni desvio de ruta. El unico cambio de catalogo es el
texto descriptivo y de nicho de Falcon, tambien actualizado en su generador.

No se cambian sprites, mapas, rarezas, economia, stats base ni curacion de base.
Quedan por revisar excepciones de objetos sin contrato especifico y cierre
de la matriz de fase 1. El rediseno de identidades sigue en fases 2 a 10.

## Fase 1: decimotercer lote, 2026-09-20

La revision de objetos encontro tres fallos conectados: los buffs de 3/3.2 s
se descontaban por ataque, su cadencia solo llegaba al contexto del disparo
(no al temporizador que decide disparar) y su penetracion nunca se incorporaba
al proyectil. Corregidos en la ruta compartida, sin cambiar valores de datos.

Hero.update avanza los temporizadores con dt antes de la salida por stun;
Hero.getEffectiveStats aplica los bonos una sola vez, y el perfil del proyectil
recibe la penetracion temporal con el techo existente de 85%. Se elimina la
segunda aplicacion en el contexto del ataque. Los cinco consumidores son
Rogue, Wolverine, Peni Parker, Vision y Winter Soldier. Conservan activacion
cada diez ataques, requisitos de evolucion/objeto, porcentajes y duraciones.
El ataque activador no recibe el bono retroactivamente. Refrescarlo repone
tiempo, no duplica potencia. Sin el objeto equipado no se aplica el buff.

El mismo reloj corrige la caducidad del enfoque de White Tiger, Tigra y
She-Hulk: antes solo descontaba una unidad justo despues de refrescarse al
atacar, y nunca expiraba esperando. Mantienen sus techos y cambio de presa;
ahora caducan realmente tras 3/3/4 s sin ataques. Se prueban los ocho usuarios
del reloj compartido; no son ocho redisenos individuales de personajes.

24 regresiones nuevas, 18 reproducian fallos antes del cambio. Cobertura:
niveles 49/50, requisito de objeto, stats/proyectil sin multiplicacion doble,
disparos reales mas frecuentes, duracion con pasos distintos, pausa y x1/x2/x4
mediante GameLoop.loop, stun, perdida/recuperacion de objeto, refresco, techo
de penetracion y enfoque por presa. Los datos base, mapas y sprites no cambian;
no se necesita regenerar bootstrap. Sin curacion, monedas ni ataques de soportes.

Validacion completa: npm run check aprobado con 916 tests, simulaciones de
economia/campana y check de rarezas sin ajustes. Benchmark p95 0.297 ms;
accesibilidad y lanzamiento sin errores. Smoke desktop 1366x768 y mobile
390x844 sin overflow ni desvio de ruta. Las simulaciones estimadas no incluyen
todos los ciclos de buffs y no sustituyen las pruebas de disparos reales.

Pendiente de fase 1: fijaciones secundarias/fallback de objetos, marcas y
excepciones de ejecucion antes del cierre de la matriz. No se afirma balance
integral por pasar las pruebas: cadencia y penetracion antes inactivas ahora
aportan poder real y requieren comparativas de equipos en la fase 10.

## Fase 1: decimocuarto lote, 2026-09-20

Publicado y verificado en Railway el lote anterior c55582f antes de continuar.
El selector secundario de strikeMulti filtraba correctamente, pero si quedaba
vacio recuperaba al blanco original sin validar alcance, geometria o sigilo.
Ahora omite la salva y el anuncio si no hay destinatarios validos. Cubre los
siete consumidores de esa ruta: Punisher, War Machine, Nightcrawler, X-23,
Gamora, Deadpool y Falcon con Redwing MK II. No se retocan sus stats ni kits.

Corregido el mismo retorno incondicional en el disparo critico de Domino.
Conserva preferencia por otro blanco valido y repeticion del original cuando
es valido y esta aislado. Sin blanco omite el proyectil, no el bono monetario
del critico signature. El 15% base por ataque y el 12% adicional del objeto
en critico mantienen sus rutas y no se duplican por disparo extra.

No se cambia el conteo de ataques ni se reserva una activacion no ejecutada.
Se mantienen prioridades, limite y unicidad de blancos, requisitos de objeto
y evolucion. El caso real de Gamora cubre matar al unico enemigo con su
ejecucion ordinaria antes del proc: ya no cuenta una segunda habilidad vacia.

19 regresiones nuevas, 11 fallaban antes del arreglo; 57 focalizadas aprobadas.
Cubren todos los consumidores, alcance, cruz de Punisher, sigilo de X-23,
prioridad de jefe, monedas de Domino y ejecucion previa de Gamora. Sin cambios
de datos, bootstrap, sprites, mapas, rarezas o valores de economia.

Validacion completa: npm run check aprobado con 935 tests, simulaciones de
economia/campana y check de rarezas; benchmark p95 0.287 ms. Accesibilidad y
lanzamiento sin errores. Smoke desktop 1366x768 y mobile 390x844 sin overflow
ni desvio de ruta.

Pendiente de fase 1: marcas signature y excepciones de ejecucion, junto al
cierre de cobertura de la matriz. Este lote no declara la fase terminada.

## Fase 1: decimoquinto lote, 2026-09-20

Corregidos bonus personales de marcas que dependian solo de un UID guardado,
sin comprobar caducidad ni estado del blanco. Beast y Elsa ahora exigen mark
activo, enemigo vivo y ventana personal vigente. La duracion resistida se
calcula con Enemy.getStatusDuration, extraido de la formula existente sin
cambiar sus valores ni su piso de 20%. Una marca ajena no extiende esa ventana.

Elsa prepara Bloodstone con cuatro ataques consecutivos a la misma presa.
Cambiar de objetivo o caducar la ventaja reinicia preparacion: volver al
enemigo anterior no recupera inmediatamente el bonus. El cuarto aplica marca
y el quinto puede aprovechar +32%. Continuar refresca la ventana de 5 s antes
de resistencias, sin multiplicar bonos. El mark compartido del blanco anterior
no se borra al cambiar; solamente se pierde el bonus personal. No marca muertos.

Beast conserva seleccion por jefe/amenaza/vida y analisis inicial y cada diez
ataques. Su bonus de 18% queda limitado a 2.2 s resistibles. Se elimina el pulso
generico del 75% que su configuracion de analisis recibia por el caso por defecto.
El Localizador ya no borra sigilo permanentemente al marcar: Mockingbird puede
detectar gracias al objeto, pero no revela globalmente para aliados sin detector.
Nick Fury y Maria Hill conservan aura pura; no se activan ataques para sus firmas.

15 regresiones nuevas; ocho fallos reproducidos antes de editar el motor.
Incluyen niveles 49/50, primer slot, caducidad, cambio de presa, refresh, marcas
mezcladas, duracion resistida, muerte antes de proc, pulso accidental, sigilo,
prioridad y soportes sin disparos. Sin modificaciones de datos ni bootstrap.

Validacion completa: npm run check aprobado con 950 tests; simulaciones de
economia/campana y check de rarezas sin ajustes. Benchmark p95 0.474 ms;
accesibilidad y lanzamiento sin errores. Smoke desktop 1366x768 y mobile
390x844 sin overflow ni desvio de ruta.

Probe pendiente de ejecuciones (sin cambiar esas mecanicas en este lote):
enemigo con 10.000 HP maximos y 2.000 actuales, categoria neutral. Gamora mata
normal/blindado pero la barrera absorbe su remate; Sentry/The Void deja 594.2975
HP con armadura 85 y 2.000 HP con barrera inicial 5.000. Ambos conservan la
exclusion de ejecucion de jefes. Hace falta fijar y probar si sus remates deben
ser ejecuciones garantizadas o dano sujeto a defensas, sin inflar dano a bosses.
Quedan esas excepciones y el cierre de cobertura antes de terminar fase 1.

## Fase 1: decimosexto lote, 2026-09-20

Fijado contrato de ejecucion para Gamora y The Void: ya no se intenta matar
con HP+1 sujeto a defensas. CombatSystem.executeNonBoss elimina la vida
restante de un enemigo comun vivo, sin multiplicadores de tipo/mark ni
reducciones de armadura/resistencia ni absorcion de barrera. El registro
cuenta solo esos HP, no la barrera intacta del cadaver ni dano infinito.
Comparte autoria, textos y VFX con el dano ordinario. GameLoop conserva el
pago normal de recompensa una vez; no se agregan procs monetarios ni curacion.

Gamora mantiene umbral inclusivo de 25%, disponible sin evolucion ni objeto,
y conserva combo incidental hasta dos vecinos cuando no ejecuta. No anuncia
habilidades sobre muertos. The Void mantiene un proc cada 24 ataques y exige
nivel 100 de Sentry y EL VACIO en el primer slot. Ejecuta comunes incluso con
vida completa; contra jefes conserva dano efectivo x3 con 65% penetracion,
sujeto a tipos, armadura, resistencia, marcas y barrera como antes.

La exclusion central cubre isBoss, isFinalBoss e isMiniBoss, tanto runtime
como config. Se corrigio la omision de isFinalBoss aislado en Gamora y la de
isMiniBoss aislado en ambos; no se cambia la generacion de oleadas. Un boss
puede morir por dano suficiente de The Void, nunca por ejecucion de sus HP.

27 regresiones nuevas. En los primeros 23 casos, 17 fallaban antes del cambio;
se agregaron cuatro de recompensa GameLoop, flags runtime/entradas invalidas
y muerte ordinaria de boss. Incluyen umbral, ciclo, nivel/objeto, defensas
combinadas, mark, autoria, dano real y proyectil en vuelo despues del remate.
Sin cambios de datos, bootstrap, sprites, mapas ni valores de economia.

Validacion completa: npm run check aprobado con 977 tests, simulaciones de
economia/campana y check de rarezas. Benchmark p95 0.429 ms; accesibilidad y
lanzamiento sin errores. Smoke desktop 1366x768 y mobile 390x844 sin overflow
ni desvio de ruta.

Pendiente de fase 1: cierre cruzado de cobertura con la matriz de 105 heroes.
El bypass de barreras fortalece estos remates frente a comunes protegidos;
queda identificado para comparativas de equipos de fase 10. Las regresiones
no equivalen a demostrar balance global ni a completar el rediseño del roster.

## Fase 1: decimoseptimo lote, cobertura transversal

211 pruebas nuevas en hero-roster-contract: dos por cada uno de los 105 IDs
y una que cruza la matriz documental con catalogos. Sin duplicados, omisiones
ni signatures apuntando a IDs inexistentes. Estadisticas, medidores, unidades
DoT y seleccion primaria se verifican en niveles 1/49/50/51/99/100 y todos los
modos disponibles; respeta evolucion al requisito de catalogo sin objeto.

Cada heroe se ejecuta a nivel 1 y 100 durante 40 segundos de simulacion contra
tres blancos estacionarios, con impactos inmediatos y probabilidades forzadas
a favor de efectos. Los 96 atacantes disparan y danan; los nueve soportes no
disparan, danan ni aplican estados ofensivos. Sin curacion de base ni NaN.
No mide movimiento, tiempos de viaje, DPS comparable ni balance de campana.
La documentacion de cobertura separa estas pruebas de los contratos especificos.

Corregidas ocho fichas: Crystal declara requisito de evolucion/objeto para
alternancia; Rocket no anuncia torretas; Echo no anuncia copia; Nightcrawler
no anuncia salto ni nube; Emma distingue critico/deteccion propios de aura;
Red Guardian no exige elite; Nebula no exige categoria tecnologica; Gamora
explicita umbral inclusivo y defensas ignoradas. X-23 ya estaba corregida.
Nueve pruebas adicionales verifican mecanismos y sincronizacion con los
generadores existentes y bootstrap. No se ejecutaron generadores de roster
que podrian restaurar rarezas o stats historicos; solo build:data.

La cobertura comun de los 105 esta cerrada. Queda revisar la concordancia
de otras fichas individuales (por ejemplo condiciones de elite, deteccion
propia frente a revelado, y control principal frente a area). Por eso no se
declara toda la fase 1 terminada ni se confunde con el rediseno de cada kit.

## Fase 2: primer lote, Luke Cage

Luke deja de conceder a aliados +6% alcance/+8% cadencia a 135 px desde
StreetKitSystem. Sigue siendo atacante cercano y conserva ruptura de armadura
(70%, poder 0.28, 3.5 s antes de resistencias), dano, cadencia, rareza y rango.
Nueva tenacidad propia: special.stunResistance=0.5 reduce a la mitad el stun
recibido, sin afectar aliados ni convertirse en aura. Fija en todos los niveles;
no escala dano/rango/cadencia por esta pasiva ni concede inmunidad total.

Hero.applyStun conserva maximo del tiempo pendiente y duracion entrante
resistida, sin sumar ni acortar un stun mayor. El validador acepta solo numeros
entre 0 y 0.8; runtime acota al mismo techo. Los demas heroes no cambian.
La ficha y el indicador muestran tenacidad; se retira Guardia urbana lista,
que anunciaba una activacion inexistente. Se preserva ausencia de interceptar
fugas. El generador urbano y bootstrap reproducen el atributo y su texto.

Seis tests nuevos cubren vecinos/copia, niveles 1/50/100, espera y recuperacion,
ruptura despues del stun, reaplicacion, indicadores y fase real de boss.
Los primeros cinco fallaban antes de implementar. Se actualizo la prueba
heredada que exigia el buff retirado y se agrego una regresion de schema.
Pendiente de fase 2: nueve soportes, acumulacion de auras, evolucion de buffs,
Domino y economia heredada de Shang-Chi. No se afirma que Luke y los soportes
ya esten equilibrados: retirar su buff afecta equipos que lo aprovechaban.

Validacion conjunta de estos dos lotes: npm run check aprobado con 1.204 tests;
economia, rarezas y escenarios estimados de campana aprobados. Benchmark p95
0.425 ms. Accesibilidad y lanzamiento sin errores. Smoke desktop 1366x768 y
mobile 390x844 sin overflow ni desvio de ruta. Sin sprites o mapas modificados.

## Fase 2: segundo lote, soportes de dano

Capitan America conserva liderazgo constante: aura base 10% a 255 px, sin
cargas. Black Panther conserva 20% a 135 px e incorpora Red de Vibranium:
preparacion de 9 s al desplegar; despues seis ataques principales aliados
dentro del radio activan sobrecarga de 3 s. Multiplica la potencia del aura
por 1.5 (20% pasa a 30%), no el dano total aliado por 1.5. Recarga 9 s desde
la activacion; durante ella no se acumulan ataques ni se extiende la ventana.
El sexto disparo usa el bonus anterior, el siguiente puede aprovechar el nuevo.

Misma curva previa de nivel para potencia y radio: nivel 100 Epic da 16.5%
estable al Capitan y Panther 33% base / 49.5% activo. La sobrecarga no amplia
radio, no altera cadencia, no cura y no agrega proyectiles. La evolucion y
los objetos no suman otro multiplicador al buff en este lote. Mjolnir no
reactiva ataques del Capitan; Hero.shoot ahora tambien protege a soportes
puros cuando se llama directamente, ademas del retorno existente en update.

SupportAuraSystem comparte calculo efectivo, reloj, carga y lectura del estado.
Solo Hero.shoot notifica ataques principales terminados; ni impactos, rebotes,
segundo blaster, pulsos, estados ni procs signature generan cargas adicionales.
El aliado debe estar desplegado, dentro del radio y no aturdido. La deteccion
o el tipo del blanco no cambia esta regla. Domino mantiene 15% por ataque.

Aturdir al soporte suspende aura y entrada de cargas, pero el reloj de la
sobrecarga sigue avanzando: no puede congelarla para conservarla. La carga
parcial ya obtenida no se borra por stun. Mover al soporte borra carga y
sobrecarga y exige preparar otros 9 s; retirar limpia estado y recolocar
tampoco recupera la ventana anterior. La colocacion sigue siendo gratuita.
El aura base sigue disponible durante preparacion/recarga, salvo aturdimiento.

La ficha muestra potencia actual y estado compacto; preview de subida refleja
el multiplicador activo sin consumir tiempo ni carga. Indicador existente en
el campo representa preparacion/carga/sobrecarga, sin nuevas tarjetas o sprites.
Se actualizan descripciones, generador Avengers y bootstrap; no se ejecutan
generadores antiguos que restaurarian stats o roles obsoletos.

19 pruebas nuevas: limites de tiempo/radio, fuente principal, stun, movimiento,
retiro, niveles 1/49/50/100, soporte puro con objeto/evolucion, combinacion con
Capitan, dinero de Domino, lectura y preview sin efectos laterales. Comparativa
de 60 s con ataques/impactos reales y blancos estacionarios: Panther supera
al Capitan cerca, pero pierde en formacion separada; su promedio queda por
debajo de un 30% permanente. No es una simulacion de ruta ni de equipos de seis.

Pendiente de fase 2: siete soportes restantes (cadencia, alcance y Maria Hill),
contrato global de acumulacion de auras, evolucion del buff y economia heredada.
El producto de auras distintas se conserva; no se afirma balance final por
pasar estos escenarios. Fase 1 aun tiene revision textual individual pendiente.

Validacion: npm run check aprobado; suite final tras agregar la prueba de
render con 1.223 tests aprobados. Economia, rarezas y escenarios estimados de
campana sin fallos. Benchmark p95 0.378 ms. Accesibilidad y lanzamiento sin
errores. Smoke desktop 1366x768 y mobile 390x844 sin overflow ni desvio de ruta.

## Fase 2: tercer lote, soportes de cadencia

Nick Fury conserva +8% base a 265 px, estable y sin cargas. No concede a sus
aliados su deteccion propia. Wasp pasa de +18% continuo a Enlace Pym: 6 s
de preparacion/descanso, 3 s de pulso al doble de la potencia nominal (+36%
base) a 125 px. Promedio temporal teorico +12%, no +36% permanente. Ambos
conservan rareza, nivel, radio y curva de escalado existentes; nivel 100:
Fury +12.4% a 284.875 px; Wasp +52.2% durante pulso a 132.5 px.

El reloj de Wasp avanza aun aturdida; el bonus se suspende, no se aplaza ni
se acumula. Mover o retirar/recolocar reinicia 6 s sin bonus; no cuesta dinero
ni pierde niveles. El reloj puede avanzar sin enemigos o aliados, pero solo
cuenta una activacion si al comenzar el pulso hay un atacante aliado no
aturdido dentro del radio. Leer stats, indicador o dt cero no avanza reloj.

Profesor X conserva 245 px y deteccion, pero ahora reparte un presupuesto:
50 puntos porcentuales base de cadencia, tope +30% por atacante. Uno recibe
30%, dos 25% cada uno, tres 16.667%, cuatro 12.5%, cinco 10%. Solo cuentan
atacantes desplegados, no aturdidos y dentro del radio circular propio;
ni soportes, ni banco, ni aliados fuera. No requiere estar disparando, para
que perder momentaneamente un blanco no haga oscilar el enlace. No usa
getEffectiveStats para contar enlaces ni amplia su radio por otras auras.

Presupuesto y tope escalan con la curva Mythic existente: a nivel 100 son
92.5 puntos y tope +55.5% por aliado, no un multiplicador nuevo de evolucion.
Deteccion pertenece solo a atacantes enlazados; no borra stealth del enemigo.
Mover, retirar o aturdir al soporte actualiza inmediatamente los enlaces.
Aturdir un atacante libera su parte hasta que se recupere. Ninguno de los
tres dispara, cura o genera dinero, ni con objetos o evolucion.

Fichas desplegadas muestran bonus actual, pulso/espera y numero de enlaces.
Inventario muestra el pico posible (Pym o un enlace concentrado), explicado
en la habilidad. Preview de Wasp muestra mejora del siguiente Pulso aun en
descanso; Profesor X recalcula enlaces con el radio del nivel siguiente.
Si incorpora otro aliado y baja la potencia individual, muestra delta negativo
con el formato rojo existente. No modifica nivel ni reloj para previsualizar.

32 regresiones nuevas cubren los contratos, niveles 1/49/50/100, seis plazas,
stun, movimiento, retiro, efectos de objetos, UI y recompensa de Domino.
Comparativa real de Hero.update de 90 s con blancos estacionarios e impactos
inmediatos: Wasp obtiene mas disparos cerca que Fury, pero menos fuera de su
radio; Profesor X concentra mas beneficio individual con menos enlaces.
No es prueba de rutas, enemigos moviles, control acumulado o equipos optimos.

El estimador de campana ahora contempla el reparto mental y el promedio
temporal de Pym, aun suponiendo cobertura completa. Con presupuesto inicial
45, el caso W100 dio margen 1.029, inferior al minimo 1.03. Se eligieron 50
puntos para conservar viabilidad del equipo de cinco atacantes: margen 1.045;
W75 queda en 1.168. No se rebajaron los umbrales ni la salud de los bosses.
No se cambia el producto runtime de auras distintas: politica global sigue
pendiente. Tampoco se altera el 15% por ataque principal de Domino.

Datos, bootstrap y contratos del generador de Fury/Wasp sincronizados, sin
ejecutar generadores antiguos sobre el roster. Sin sprites, mapas, UI de
tarjetas nuevas ni cambios a rarezas. Pendientes de fase 2: Invisible Woman,
Mister Fantastic, Wong, Maria Hill, acumulacion global, evolucion del buff y
economia heredada. Fase 1 aun tiene revision textual individual pendiente.

La revision visual detecto que la etiqueta Rol aun usaba potencia nominal;
ahora comparte el calculo efectivo con la ficha, incluido descanso/reparto.
Capturas de los tres soportes a 1366x768 y 390x844 sin desborde horizontal.
Validacion final: npm run check aprobado con 1.255 pruebas; simulaciones,
rareza, accesibilidad, lanzamiento y smoke desktop/mobile sin errores.

## Fase 2: cuarto lote, soportes de alcance

Invisible Woman conserva +8% base de alcance a 245 px y deteccion continua
para aliados dentro del aura. No marca ni revela globalmente enemigos:
la deteccion pertenece al aliado y se pierde al salir o aturdir al soporte.
Mister Fantastic conserva +15% a 145 px sin deteccion. Su Geometria elastica
solo extiende el borde exterior de circulo, anillo, cruz y X. Su multiplicador
ya no agranda el hueco del anillo ni ensancha carriles. Los demas bonos de
alcance mantienen sus reglas anteriores; no se congela toda la geometria.

Wong conserva +4.5% base de alcance continuo a 205 px. Sello de vigilancia:
4 s de preparacion/descanso, 4 s de deteccion para vecinos. No altera stealth
del enemigo ni quita deteccion propia/de otros soportes cuando termina.
Aturdirlo suspende aura y deteccion, pero el reloj sigue avanzando. Mover o
retirar/recolocar reinicia la preparacion, conservando nivel y coste cero.
Comparte el reloj de pulsos existente con Wasp, sin cambiar su ciclo 6/3.
Solo cuenta activaciones cuando hay un atacante aliado no aturdido al iniciar.

Las tres potencias y radios escalan con las curvas existentes, sin cambios
de rareza, costes o multiplicadores de evolucion. Nivel 100: Sue +14% a
270.725 px; Reed +26.25% a 160.225 px; Wong +6.525% a 217.3 px. El periodo
del sello no se acelera. Ninguno ataca, cura o genera dinero. Una aura de
alcance sobre otro soporte no aumenta el radio real de su propia aura.

rangeGeometryScale distingue alcance externo y medidas internas. Lo usan
seleccion primaria, intencion de objetivo, habilidades con patron, seleccion
signature, cobertura de ruta y dibujo. No cambia splash/rebotes incidentales
ni ataques con geometria propia declarada. El dibujo de cruz/X se recorta al
radio circular; la X usa ancho perpendicular equivalente al predicado real.
Doce comprobaciones de pixeles en navegador verifican hueco, carriles y borde.

La previsualizacion de colocacion/recolocacion evalua las auras en la celda
destino sin mover la instancia: salir de Reed no conserva su bonus en el
fantasma ni al validar cobertura. Se preservan bloqueos por terreno, ocupacion
y equipo; mayor alcance no habilita calles/flores. Para colocacion nueva se
parte del rango del config como antes, ahora incluyendo las auras del destino;
no se declara cerrada la simulacion previa de todos los objetos/evoluciones.

Las fichas muestran cobertura, extension exterior o espera/deteccion. Las
etiquetas de respuestas de soportes usan efectos reales, no palabras como
"sin deteccion" o "aturdirlo", que antes anunciaban deteccion/control falsos.
La revision de heuristicas generales del radar sigue pendiente en fase 1.
No se agregan tarjetas, sprites, mapas ni restricciones de movimiento.

35 pruebas nuevas en range-support-contract: geometria y fronteras, niveles
1/49/50/100, combinacion con Sue/objeto, firma de Punisher, stun, movimiento,
retiro, deteccion, colocacion, dibujo y fichas. Comparativa de 32 s con ataque
real e impactos inmediatos sobre blancos estacionarios: Sue detecta siempre,
Wong por ventanas y Reed no detecta. No prueba enemigos moviles ni toda la
campana. Datos/bootstrap y generador Rivals de Sue/Reed sincronizados sin
ejecutar generadores antiguos sobre el roster.

Pendiente de fase 2: Maria Hill, acumulacion global, evolucion del buff y
economia heredada. La mayor cobertura de Reed y menor continuidad de Wong
necesitan comparativas de equipos/rutas en fase 10; no se afirma balance final.

Validacion final: npm run check aprobado con 1.290 pruebas; economia,
rareza, campana estimada, accesibilidad y lanzamiento sin errores. Smoke
1366x768 y 390x844 sin desborde ni desvio de ruta. Fichas de los tres soportes
capturadas en ambos tamanos, mas comprobacion de pixeles de anillo/cruz/X.

## Fase 2: quinto lote, Orden de prioridad de Maria Hill

Maria Hill conserva deteccion para aliados a 225 px y no ataca ni aplica
marcas. Su aura deja de dar dano incondicional: concede +9% base de dano
directo solo contra una marca activa. La potencia nominal 4.5% se multiplica
por dos en el contrato efectivo, con la curva Common existente. Nivel 100:
+13.05% a 238.5 px. No se cambian rareza, coste, salud enemiga ni evoluciones.

La condicion se comprueba por victima al impactar, no al crear el proyectil.
Aliado atacante y Maria deben seguir desplegados, no aturdidos y dentro del
radio entre ambos. El blanco puede estar fuera del aura; se conserva el
alcance del atacante. Retirar, mover o aturdir durante el vuelo puede quitar
el bonus. Recolocar mantiene nivel y coste cero. Otros soportes no reciben
potencia ofensiva ni se habilitan ataques por llevar objetos.

Sirven marcas existentes de heroes u objetos: se probaron Scarlet Witch y
la firma de Bloodstone, sin imponer una pareja concreta. La vulnerabilidad
de la marca sigue siendo independiente y multiplicativa. Un golpe que aplica
marca despues de su dano no recibe retroactivamente el bonus. Splash, rebote
y propagacion consultan cada victima, sin heredar la marca del principal.
No aumenta DoT, ejecuciones, curacion ni ingresos de Domino. La autoria del
dano sigue siendo del atacante; el pasivo no suma activaciones ficticias.

Ficha, rol y previsualizacion de nivel usan Marcados y la potencia efectiva;
el indicador explica que requiere marca o esta suspendida. La ficha se reviso
a 1366x768 y 390x844, sin desborde horizontal. La vista movil sigue usando
scroll vertical. La simplificacion general de metricas ofensivas de soportes
y prioridades de objetivo permanece en fase 9, no se da por resuelta aqui.

36 pruebas nuevas en priority-support-contract: condiciones, fronteras,
proyectiles en vuelo, secundarios, niveles 1/49/50/100, objetos, retiro, stun,
ejecucion, DoT, recompensas, UI y estimador. Comparativa estacionaria de 20 s
con impactos inmediatos: con atacante de dano 100, Hill da 100 sin marca y
130.8 con marca de 20%; Capitan da 110 y 132 respectivamente. Esto comprueba
el contrato, no demuestra el balance de equipos completos ni de rutas.

El estimador de campana omite el bonus condicional de Hill al no modelar
tiempo de marcas. No lo cuenta como dano constante ni se reajustan umbrales.
Datos y bootstrap sincronizados; no se tocan sprites ni mapas.

Validacion: npm run check completo aprobado; despues de agregar tres casos
de integracion/comparativa se repitio npm test, con 1.326 pruebas aprobadas.
Benchmark p95 0.315 ms; smoke desktop/mobile sin desborde horizontal ni
desvio de ruta. Commit 450791f subido a main en GitHub.

Verificacion de publicacion 2026-09-27: el dominio publico de Railway devuelve
HTTP 404, Application not found, incluso en la raiz. El panel autenticado
muestra Trial expired y 0/4 servicios online en determined-art. No se puede
confirmar este despliegue hasta que el propietario reactive la cuenta; no se
contrato un plan ni se modificaron pagos. GitHub actualizado no equivale a
despliegue publicado. Repetir la comparacion de archivos cuando vuelva online.

Los nueve soportes ya tienen contrato individual en esta fase. Sigue pendiente
la politica global de acumulacion, evolucion del buff y economia heredada.
Fase 2 sigue abierta; fase 1 mantiene pendientes textuales y fases 3-10 aun
requieren su trabajo propio. Siguiente lote: acumulacion de auras en equipos.

## Fase 2: sexto lote, acumulacion aditiva de auras

Las auras incondicionales del mismo atributo ahora suman sus potencias en
una sola capa, en lugar de multiplicarse entre si. +10% y +20% de dano dan
+30%, no +32%. Igual regla para cadencia y alcance, usando la potencia activa
del pulso, red o reparto mental. Usar un soporte solo no cambia su beneficio.
No se agregan topes ocultos ni se cambian niveles, costes o rarezas.

Objetos, evolucion, kits propios y agrupaciones conservan sus capas actuales.
Maria mantiene la excepcion documentada: su multiplicador contra una marca
se resuelve por victima al impactar, separado de la suma de dano incondicional.
Su bonificacion no se incorpora al dano base ni al DoT. La deteccion sigue
siendo una union de fuentes; perder una no apaga las otras ni la propia.

Hero y previsualizacion de colocacion comparten applySupportAurasToStats.
En alcance se suma el aporte exterior de Reed, pero la geometria interna
usa solo las otras auras: rango*(1+bonos normales)/(1+todos los bonos).
Asi anillo/cruz/X conservan el contrato de Reed con Sue, Wong y objetos.
Mover o aturdir una fuente, salir del radio o retirarla recalcula el resultado;
ninguna aura aumenta el radio real o potencia de otra. No hay recursion.

20 pruebas nuevas, mas actualizacion de expectativas multiplicativas de los
cuatro lotes anteriores. Incluyen las 126 combinaciones de cinco soportes
y un atacante en niveles 1, 50 y 100, inversion del orden de equipo, un solo
soporte con cinco atacantes, estados, objetos, deteccion, geometria y preview.
La suma continua de dano coincide con el estimador existente de campana.

Comparativa reproducible: node scripts/compare-support-stacking.js.
Motor real, seis plazas, 60 s, soportes nivel 100 y atacantes normalizados a
100 de dano/1 ataque por segundo. Blanco estacionario marcado, cobertura
completa e impactos inmediatos. Sin objetos/evoluciones, ruta ni presupuesto
economico equivalente: no representa el balance final de la campana.

| Equipo | Dano antes | Dano ahora | Diferencia |
| --- | ---: | ---: | ---: |
| Seis atacantes | 43200 | 43200 | 0% |
| Capitan + Panther, cuatro atacantes | 46239 | 44442 | -3.89% |
| Fury + Wasp + X, tres atacantes | 35280 | 33120 | -6.12% |
| Sue + Reed + Wong, tres atacantes | 21600 | 21600 | 0% |
| Cinco soportes de dano/cadencia, un atacante | 21890 | 19412 | -11.32% |
| Capitan + Panther + Hill + Fury + Wasp, un atacante | 16130 | 15321 | -5.01% |

El pico de cadencia con cinco soportes baja de x2.6602 a x2.201. Tres auras
de alcance pasan de 306.63 a 293.55 px sobre base 200; el dano estacionario
no cambia porque el blanco ya estaba dentro del radio. No se reduce salud
enemiga ni se cambian umbrales de las pruebas para compensar la nueva regla.

Railway reactivado por el propietario: antes de este lote se comprobaron
HTTP 200 y coincidencia de SupportAuraSystem.js y heroes.json con Maria Hill.
El bloqueo por prueba vencida registrado en el lote anterior ya no esta activo.

Sigue pendiente en fase 2: evolucion de la potencia del buff y economia
heredada. Fase 1 mantiene pendientes textuales; la evaluacion de rutas,
equipos con presupuesto equivalente y control acumulado pertenece a fase 10.
No se modifican sprites ni mapas. Siguiente lote: evolucion de soportes.

Validacion final del lote: npm run check aprobado, 1.346 pruebas, simulaciones
de economia/rareza/campana y controles de accesibilidad/lanzamiento sin errores.
Benchmark p95 0.407 ms; smoke en 1366x768 y 390x844 sin desborde ni desvio de ruta.

## Fase 2: septimo lote, evolucion de soportes

Los nueve soportes puros reciben x1.25 a la potencia de su aura al nivel 50,
una sola vez y sobre la curva por nivel/rareza. No son 25 puntos porcentuales.
La evolucion no amplifica radio, deteccion, ciclos ni cargas; tampoco habilita
ataques, curacion o efectos ofensivos de objetos. Los atacantes no cambian.

Wasp mantiene cero durante descanso; Panther conserva seis ataques aliados
y su preparacion; Profesor X aumenta tanto presupuesto como tope individual;
Maria sigue exigiendo marca al impacto y no mejora DoT. Reed mantiene intacta
la geometria interna. El bonus se deriva del nivel consultado, incluso al
previsualizar 49->50, subir varios niveles o recargar un heroe retirado.
No cambia el formato de guardado. Los objetos no agregan otro bonus de aura:
las transformaciones especificas siguen pendientes para fase 8.

Diccionario y preview muestran potencia del aura, no dano propio ficticio.
El radar usa la potencia efectiva y excluye soportes del DPS aunque evolucion
u objetos suban sus stats ofensivas heredadas. Quedan pendientes las heuristicas
textuales de deteccion y la simplificacion completa de estadisticas en fase 9.

35 pruebas nuevas: nueve contratos, niveles, pulsos, preview, objetos,
persistencia, radar, diccionario y estimador. npm run check aprobado con 1.381
pruebas; economia, rarezas, campana, accesibilidad y lanzamiento sin errores.
Benchmark p95 0.352 ms; smoke 1366x768 y 390x844 sin overflow ni desvio de ruta.
Los margenes estimados W50/W75/W100 son 1.383/1.289/1.086; W25 conserva tres
intentos fallidos y cuarto preparado vencedor. No cambian salud ni umbrales.
Estas estimaciones no sustituyen partidas ni comparativas con igual presupuesto.

compare-support-stacking incluye ahora evolucion en ambas politicas. La tabla
del lote 6 conserva su valor historico previo a este aumento.
Siguiente lote: economia heredada de Shang-Chi y contrato monetario de Domino.
Fase 2 sigue abierta; no se modificaron sprites ni mapas.

## Fase 2: octavo lote, economia y cierre funcional

Shang-Chi deja de conceder dos monedas cada cuatro ataques en Guardia. Era
un ingreso no anunciado en la ficha y ajeno a su identidad de combate.
Conserva los tres modos y sus stats/perfiles; el combo propio propuesto queda
para fase 4, sin inventar otro bonus ni un aura aliada en este cambio.

Domino mantiene ceil(recompensa final del enemigo * 0.15) por disparo principal,
antes del impacto, a todos los niveles. No se devuelve si el proyectil pierde
su blanco; tampoco se cobra otra vez por impacto, retorno, splash, rebote,
propagacion o DoT. Se preserva el redondeo a moneda entera y no se agrega
tope por enemigo. Contra un blanco controlado, el total es disparos * pago.

Contrato Stark y Moneda de Madripoor conservan su pago adicional por impacto,
separado del 15% nativo. Matriz de Probabilidad evolucionada conserva su 12%
adicional por critico: dos proyectiles siguen siendo un disparo y un proc.
No se cambia ningun precio, recompensa, cadencia ni porcentaje de objetos.

25 pruebas nuevas cubren niveles 1/49/50/100, modos, recompensas invalidas,
secundarios, DoT, proyectil perdido, retorno, stun, falta de blanco y objetos.
La prueba de 60 s con blanco controlado valida contabilidad, no simula una
ruta ni demuestra que el ingreso por partida sea optimo. Farmear con control
y la oportunidad de ocupar una plaza con Domino requieren fase 10.

Con este lote se cumplen los contratos funcionales de fase 2: nueve soportes
distintos sin ataques, Luke sin aura aliada, acumulacion/escalado/evolucion y
economia nativa sin duplicados. Siguen pendientes textos individuales (fase 1),
signatures de soporte (fase 8), lectura compacta (fase 9) y balance (fase 10).
Siguiente fase: tiradores y tecnologia, empezando por Iron Man y Hawkeye.

Validacion del cierre: npm run check aprobado, 1.406 pruebas; simulaciones de
economia/rareza/campana y auditorias de accesibilidad/lanzamiento sin errores.
Benchmark p95 0.323 ms; smoke desktop 1366x768 y mobile 390x844 sin overflow
ni desvio de ruta. Evoluciones del lote 7 verificadas publicamente en Railway.

## Fase 3: primer lote, reactor ARC y carcaj preparado

Iron Man conserva laser lineal de 90% de poder por escala de habilidad,
35% penetracion, extension de 1.2 veces alcance y semiancho de 24 px.
Necesita tres disparos, dos con Extremis. Ahora el reactor enfria 2 s entre
descargas y al desplegar. Durante ese tiempo acumula hasta una carga completa;
al enfriarse espera el siguiente ataque, no dispara automaticamente ni apila
varios laseres pendientes. Calor fijo, sin reduccion por nivel/objeto.
Mover conserva carga/calor; redesplegar inicia de cero. Stun suspende el reloj
como las otras habilidades ofensivas. La linea respeta deteccion de sigilo.
No se cambian dano, cadencia base, rareza ni capacidad de deteccion propia.

Hawkeye conserva tres municiones y patron cruz. Cada cuarto disparo principal
causa +35% dano y refuerza solo la municion seleccionada: radio explosivo
85 en vez de 68 px, slow 60% en vez de 48% (2.4 s), o penetracion 80% en vez
de 65%. Despues vuelve a normal. La preparacion requiere tres disparos reales,
no tiempo ni impactos secundarios. Cambiar municion conserva carga y timer;
los proyectiles en vuelo conservan sus efectos. Retirar pierde la preparacion.
No agrega stun, curacion, monedas ni una nueva habilidad de objeto. El Carcaj
de Flechas Truco conserva su firma exclusiva de Kate, no se atribuye a Hawkeye.

Indicadores de calor/carga y flecha preparada usan el panel de estadisticas
existente; no se agregan counters a tarjetas del equipo. Descripciones en
catalogo, generador de Hawkeye y bootstrap actualizadas. Sprites/mapas intactos.

24 pruebas nuevas: niveles 1/49/50/51/99/100, calor, saturacion, no disparo al
enfriar, alineacion, sigilo, retiro, stun, municion, proyectiles en vuelo,
objetos, secundarios y dos comparativas de 60 s con motor real.
Las comparativas normalizan dano/cadencia, no aplican evolucion ni objetos,
usan blancos estacionarios e impactos inmediatos. ARC mantiene dano respecto
al anterior con 1.5 ataques/s; a 8 ataques/s limita laseres a como maximo 30
en 60 s frente a mas de 100. Hawkeye gana entre 7% y 10% de dano en esa prueba;
explosiva gana a perforante contra grupo sin armadura. No certifica rutas,
presupuesto equivalente, control acumulado ni el balance total de Extremis.

Siguiente lote de fase 3: Black Widow y Shuri, sabotaje y escaneo de barreras.
La fase sigue abierta: dos de dieciseis tiradores revisados.

Validacion: npm run check aprobado, 1.430 pruebas; simulaciones y auditorias
sin errores. Benchmark p95 0.361 ms; smoke 1366x768 y 390x844 sin overflow
ni desvio de ruta. La prueba focalizada de secundarios se volvio a ejecutar
tras reforzar sus aserciones. Los estimadores de campana no modelan estas
habilidades disparo a disparo; para ese contraste se usan las pruebas de 60 s.

## Fase 3: segundo lote, sabotaje Widow y escaneo Shuri

Widow cambia control de movimiento por inhibicion de acciones: cada cuarto
disparo emite una descarga inmediata de 55% de poder por escala de habilidad
al principal y hasta tres secundarios a 125 px de este, visibles y dentro del
alcance de Widow. Prioriza apoyos secundarios, no cambia la prioridad del
ataque principal. Sustituye stun propio y marca general; conserva veneno y
ruptura de armadura contra apoyos no jefes. Ahora el principal tambien recibe
el dano de la descarga, compensando parte de la perdida de control.

Sabotaje dura hasta 2 s, reducido por resistencia de estados. Suspende el
reloj y ejecucion de curas, invocaciones y ordenes, no movimiento, regeneracion
pasiva, barreras ni fases de jefe. Tras finalizar, cada enemigo tiene 3 s de
inmunidad; ni otra fuente ni redesplegar Widow refrescan esa ventana. Un
faseador con afijo comandante conserva su reloj/cambio de fase; solo pierde
ordenes. Jefes, minijefes y finales son inmunes al sabotaje, no al dano.
Los stuns de objetos permanecen como efectos separados, no se eliminan.

Shuri reemplaza marca probabilistica de 15% por escaneo garantizado al impactar
una barrera que sobreviva. Durante 3 s (con resistencias), impactos directos
de cualquier aliado hacen +35% al escudo; incluye secundarios y habilidades,
no DoT. No se acumula con copias y no satisface la marca de Maria Hill.
Se calcula tras armadura/resistencias: barrera absorbe min(B, dano*1.35),
vida recibe max(0, dano-absorbido/1.35). La vida nunca se multiplica por 1.35.
Romper escudo elimina escaneo y no lo restaura una recarga; el primer golpe
que aplica estado aun no recibe bonus. Retirar Shuri deja solo la duracion
restante, sin efecto permanente. Jefes con barrera admiten el escaneo.

Fichas, indicador existente, pips y catalogo/bootstrap reflejan los cambios.
La lectura tactica no recomienda Widow para frenar corredores y reconoce
escaneo contra barreras. No se hizo una reescritura global de heuristicas;
quedan los pendientes textuales generales de fase 1. Sin sprites, mapas,
costes, rarezas, buffs aliados o curacion de base nuevos.

41 pruebas nuevas de niveles 1/49/50/51/99/100, acciones reales, inmunidad,
resistencias, fases, blancos, retiro, objetos, dano de escudo/vida, DoT,
secundarios, indicadores y lecturas tacticas. Dos comparativas controladas:
60 s de disparos reales reducen acciones de soporte sin anularlas; 60 impactos
normalizados muestran escaneo mejor que marca anterior contra barrera y peor
contra vida, incluso concediendo uptime completo a la marca anterior.
No equivalen a campana/rutas ni a comparativa con presupuesto equivalente;
la perdida de stun/mark de Widow requiere seguimiento en fase 10.

La fase 3 sigue abierta: cuatro de dieciseis heroes revisados.
Siguiente lote: Winter Soldier y Punisher, rafagas y supresion sostenida.

Validacion: npm run check aprobado; npm test repetido tras el caso adicional
de faseador/comandante, 1.471 pruebas aprobadas. Benchmark p95 0.641 ms;
smoke desktop 1366x768 y mobile 390x844 sin overflow ni desvio de ruta.

## Fase 3: sexto lote, baliza y doble baston

Kate Bishop prepara una baliza cada cuarto disparo principal. Al impactar
revela hasta seis vivos a 80 px del centro de impacto por 3 s, antes de
resistencias. No agrega dano ni se transmite por rebotes/retornos; el radio
del proyectil se consume una vez y se limpia al reutilizar el pool. Si el
blanco muere antes de llegar, se pierde junto con la flecha. Si muere por el
impacto, puede revelar vecinos. Aliados deben conservar su propio alcance.
Marca probabilistica, deteccion y carcaj de objeto siguen independientes.

Mockingbird alterna preparacion y segundo golpe al 140% de dano al mismo
blanco. Ese segundo ataque puede aplicar stun garantizado de 0.35 s, sujeto
a resistencias, con minimo 2 s entre descargas; empieza con 2 s al desplegar.
Sustituye el stun aleatorio antiguo de 10% por 0.25 s; conserva marca 22%.
Cambiar blanco, mover, stun, perdida de cobertura, retiro o 2.5 s sin disparar
quitan preparacion. Resetear preparacion no reinicia la recarga electrica.
La carga pertenece a disparos principales, no a impactos de firmas/objetos.

24 pruebas nuevas: niveles 1/49/50/51/99/100, impacto diferido, limite, area,
caducidad, resistencias, blanco muerto, pool, carcaj, reinicios y 60 s a
cadencia extrema. Maximo 30 descargas en esa prueba, sin disparos extra.
Sin cambios de sprites, mapas, rarezas o economia. Pendiente comparativa de
coste de plaza, control aliado acumulado y mapas reales en fase 10.

Fase 3: doce de dieciseis revisados. Siguiente lote: Yelena y Howard the Duck;
despues quedan Rocket y Peni Parker, con entidades temporales limitadas.

Validacion: npm run check aprobado con 1.586 pruebas. Benchmark p95 0.341 ms;
smoke desktop 1366x768 y mobile 390x844 sin overflow ni desvio de ruta.
El estimador de rareza reconoce el stun trasladado a TargetFocusSystem;
no recalibra dano base ni pretende modelar el combo completo por ruta.

## Fase 3: septimo lote, contrato de caza y trucos alternados

Yelena gana 20% de dano propio al repetir blanco con marca activa, sea propia
o aliada. El primer disparo sobre un blanco nuevo no tiene bonus. Al abatir
al seguido y marcado transfiere una marca de 6% por 2 s al vivo detectable
mas cercano, dentro de 120 px del caido Y dentro del alcance propio. No
inflige dano incidental, revela sigilo ni fuerza la prioridad seleccionada.
Marca respeta resistencias. Mover, stun, retiro, perdida de cobertura o
2.5 s sin disparar quitan seguimiento; marca expirada quita el bonus.
Conserva veneno y probabilidad de marca, sin ingresos nuevos.

Howard garantiza un efecto nativo cada tercer disparo, alternando quemadura
y ralentizacion, sin repetir el truco garantizado. El otro efecto conserva
su probabilidad ordinaria: pueden coincidir por azar, no hay dos garantias.
Potencia/duracion no cambian: burn 12% dano efectivo/s por 2.5 s, slow 18%
por 1.4 s. Disparos normales mantienen 22% burn y 24% slow. Objetos no ganan
garantia y proyectiles en vuelo no cambian al preparar el siguiente truco.
Solo disparos reales cargan el ciclo; no tiempo, secundarios ni stuns.

22 pruebas nuevas: niveles 1/49/50/51/99/100, primer disparo, marca necesaria,
transferencia unica, alcance/resistencias, reinicios, alternancia, probabilidades
restantes y vuelo. No modifican sprites/mapas, rarezas, costes o stats base.
Pendiente balance comparativo de equipos, ingresos y control en rutas de fase 10.

Fase 3: catorce de dieciseis revisados. Siguiente lote: Rocket y Peni Parker,
con entidades temporales dependientes de su dueno y limites explicitos.

Validacion: npm run check aprobado con 1.608 pruebas. Benchmark p95 0.329 ms;
smoke desktop 1366x768 y mobile 390x844 sin overflow ni desvio de ruta.

## Fase 3: octavo lote, dispositivos de Rocket y Peni

Rocket despliega una torreta por 5 s tras 6 s de recarga, incluida la primera.
Mientras existe, el disparo principal usa 80% de dano; 20% se reserva para
un pulso directo cada 0.5 s contra un blanco segun prioridad del dueno, dentro
de cobertura y deteccion efectivas. No agrega dano bruto gratuito. La reserva
es como maximo dos ataques efectivos de dano; exceso, caducidad o cancelacion
lo pierden. No copia splash, estados, efectos al impactar ni firmas. Conserva
14% penetracion; aporta contadores de dano/bajas, pero una baja de torreta no
activa hooks de habilidad/objeto. Recompensa normal de enemigo sigue en GameLoop.
Sin blanco no gasta reserva, sin disparos principales no genera dano propio.

Peni prepara una mina tras 8 s, en la posicion del blanco detectado dentro de
alcance. Es una posicion fija sobre la ruta ocupada por el enemigo, no un
heroe colocable. Arma en 1 s y caduca a los 5 s. Un enemigo valido a 26 px
activa web 35% por 2 s a hasta cinco vivos detectados a 65 px Y dentro de la
cobertura de Peni. No hace dano. Resistencias y acumulacion normal de web
permanecen; recarga de 8 s comienza al activar/caducar/cancelar, no al colocar.

Un dispositivo por dueno, nunca entradas nuevas en equipo/heroes. Mover,
retirar, salir del equipo o stun elimina dispositivo y reserva y reinicia
recarga. Los relojes usan dt de simulacion. Vistas usan pequenos indicadores
geometricos del dispositivo, no cambios en sprites de personajes/mapas.
Objetos y ataques principales de ambos siguen separados de los dispositivos.

29 pruebas nuevas: niveles 1/49/50/51/99/100, presupuesto, recarga/duracion,
limites, blancos, radio, armamento, resistencias, retiro/stun/equipo, baja sin
hooks y 60 s a cadencia extrema. Comparacion normalizada de Rocket conserva
80%+20% sin defensas; perder splash o reserva puede bajar su dano real. No
certifica equipos/rutas ni perma-control combinado; pendientes fase 10.

Fase 3 implementada: dieciseis de dieciseis revisados, ocho lotes. Siguiente:
fase 4, combate cercano y combos, empezando por Hulk y She-Hulk.

Validacion de cierre: npm run check repetido el 2026-10-07, 1.637 pruebas
aprobadas; benchmark p95 0.347 ms. Smoke 1366x768 y 390x844 sin overflow
ni desvio de ruta. No equivale a certificar el balance completo de campana.
Simulaciones economicas/campana y auditorias de accesibilidad/lanzamiento OK.

## Fase 3: tercer lote, rafaga tactica y fuego sostenido

Winter Soldier dispara un ciclo de tres ataques reales: 85%, 85%, 160% de
dano efectivo. No crea proyectiles extra ni modifica la cadencia base. La
preparacion se paga con dos impactos menores, no con una recarga temporal
adicional. El remate perfora 85% (normales 65%), explota a 90 px (normales
64) o aturde 0.6 s garantizados solo en electrica. Sustituye el stun aleatorio
de 45% por golpe; conserva el modificador electrico existente de cadencia.
Resistencias de jefes siguen aplicando. Cambiar municion no reinicia ciclo
ni timer, no altera proyectiles en vuelo; retirar y redesplegar empieza de cero.

Punisher prepara +8% de dano por disparo principal al mismo enemigo, hasta
+32% desde el quinto. Cambiar blanco, perder alcance/deteccion, muerte del
blanco, moverlo, stun o 2 s sin disparar eliminan la preparacion. Solo disparos
principales cargan; el splash pequeno hereda dano pero no genera cargas.
La cruz, penetracion y splash existentes permanecen. No agrega slow ni stun:
supresion aqui significa fuego sostenido, no control de movimiento.

Los indicadores usan el panel existente, sin nuevas tarjetas. No se cambian
sprites, rarezas, economia ni auras. Descripciones y generadores sincronizados.
Comparativa controlada de 60 disparos sin defensas: Winter +10% de dano medio;
Punisher +30.67% con blanco fijo, 0% cambiando en cada disparo. Es una medicion
de proyectiles, no una simulacion de rutas, resistencias o presupuesto igual.
La perdida de control aleatorio y el DPS sostenido requieren fase 10.

La fase 3 sigue abierta: seis de dieciseis revisados. Siguiente lote: Falcon
y War Machine, reconocimiento y salvas de zona.

Validacion: 30 pruebas nuevas; npm run check aprobado y npm test final con
1.501 aprobadas. Incluye 60 s de ataques contra blanco movil lento y cruces
reales de diez disparos con Nucleo Adaptativo y Armadura War Machine.
Benchmark p95 0.449 ms; smoke 1366x768 y 390x844 sin overflow ni desvio de ruta.

## Fase 3: cuarto lote, identificacion Redwing y salva fijada

Falcon conserva modos, dano, tiempos y deteccion compartida a 165 px. Redwing
en reconocimiento agrega revelado de 2 s al objetivo identificado, ademas
de la marca de 3.2 s. Ahora aliados fuera del aura pueden fijar a ESE enemigo
si esta dentro de su propio alcance. El resto sigue oculto. Revelado respeta
resistencias y no borra el sigilo nativo: al caducar reaparece si la fase o
configuracion aun lo exige. Asalto conserva su contrato de dano, incluso a
ocultos, pero no revela ni comparte deteccion. Cambiar modo no reinicia el
cooldown. Retirar Falcon deja solo la duracion ya aplicada, no revelado eterno.

War Machine fija una zona de 65 px cada sexto disparo principal, sin generar
disparos extra. Tras 0.9 s impacta hasta cinco enemigos vivos y detectados,
ordenados por cercania al centro. Dano por victima: 60% de ataque efectivo al
preparar por escala de habilidad existente; penetracion 18%. La explosion
puede alcanzar fuera de la cruz alrededor del punto fijado, pero no fija un
blanco nuevo fuera de rango. Centro no sigue al enemigo; nuevos enemigos
pueden entrar. Mover, retirar o stun cancelan la zona; solo una pendiente.
Salva no aplica quemadura, control ni ingresos, ni activa firmas recursivas.
Proyectil principal conserva splash/quemadura y la firma de objeto separada.

Telegrafo de zona y pip R usan render existente, sin tocar sprites ni mapas.
24 pruebas nuevas: niveles 1/49/50/51/99/100, expiracion, resistencia, modos,
captura de objetivo aliado, demora, limite, sigilo, retiro, stun, movimiento,
coordenadas del telegrafo y objeto evolucionado. Comparativa controlada: cinco
blancos lentos reciben cinco veces el dano extra de uno; a 100 px/s salen
antes del impacto y reciben cero. No equivale a balance de campana completa.

Fase 3: ocho de dieciseis revisados. Siguiente lote: Cable y Nebula,
concentracion de fuego y adaptacion contra blancos resistentes.

Validacion: npm run check aprobado, 1.525 pruebas; benchmark p95 0.465 ms.
Smoke desktop 1366x768 y mobile 390x844 sin overflow ni desvio de ruta.
Simulaciones y auditorias sin errores; no certifican balance de todos los mapas.

## Fase 3: quinto lote, mira temporal y adaptacion cibernetica

Cable prepara un remate tras 3 s sobre el mismo blanco seleccionado, vivo,
detectado y dentro de su cruz. Solo jefes, minijefes, finales o amenaza >=4.
Sigue disparando mientras apunta; siguiente disparo al 190% del dano efectivo
consume carga. No aumenta cadencia ni acumula varios remates. Cambiar objetivo,
mover, perder cobertura/deteccion, stun o retirar reinician la preparacion.
Conserva penetracion 28%, ruptura y objeto; no cambia prioridades elegidas.

Nebula prepara 10 puntos de penetracion por disparo previo al mismo enemigo,
hasta 50 desde el sexto; tras el primero agrega otros 10 contra categoria
Tecnologico (con/sin tilde). No agrega dano plano ni bonus a blancos sin
armadura. Cambio de blanco, movimiento, stun, perdida de cobertura, retiro
o 2.5 s sin atacar reinician adaptacion. Techo total con objetos 85%; la
ruptura probabilistica y deteccion existentes permanecen. Lineas de objeto
no generan cargas ni heredan esta penetracion adicional.

Ambos usan seguimiento acotado de un blanco, sin listas crecientes ni nuevas
entidades. Dano/penetracion se fijan al disparar: cambiar despues no modifica
proyectiles en vuelo. Indicadores en panel existente, sin sprites/mapas nuevos.
37 pruebas focalizadas: niveles 1/49/50/51/99/100, flags de jefe, cruz,
reinicios, objetos, techo, vuelo y comparativa con/sin armadura. Cable en 60 s
de combate contra blanco fijo dispara 55-58 veces y prepara 17-20 remates,
sin aumentar cadencia. No equivale a balance por ruta/presupuesto; fase 10.

Fase 3: diez de dieciseis revisados. Siguiente lote: Kate Bishop y Mockingbird.

Validacion: npm run check aprobado con 1.562 pruebas. Benchmark p95 0.481 ms;
smoke desktop 1366x768 y mobile 390x844 sin overflow ni desvio de ruta.
