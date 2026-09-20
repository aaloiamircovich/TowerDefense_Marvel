# Identidad y habilidades de los 105 heroes

Fecha: 2026-09-13. Base revisada: commit 553ad63.
Estado: FASE 1 EN CIERRE, diecisiete lotes. FASE 2 INICIADA, primer lote (Luke).
Fases 3 a 10 pendientes. La cobertura comun no certifica el balance individual.
Los hallazgos de auditoria describen el baseline; ver avances abajo para las
correcciones ya realizadas. No equivale a completar el rediseño de los 105 kits.

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

Fase 1 EN CIERRE; fase 2 INICIADA; fases 3 a 10 PENDIENTES.
El orden figura en la matriz anexa. El primer lote de fase 2 es independiente
de la revision restante de textos individuales; ninguna de ambas se declara
completada por este avance.
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
