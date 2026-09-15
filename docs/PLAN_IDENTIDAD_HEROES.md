# Identidad y habilidades de los 105 heroes

Fecha: 2026-09-13. Base revisada: commit 553ad63.
Estado: FASE 1 EN CURSO. Cuatro lotes implementados; fases 2 a 10 pendientes.
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

Fase 1 EN CURSO; fases 2 a 10 PENDIENTES. El orden figura en la matriz anexa.
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
