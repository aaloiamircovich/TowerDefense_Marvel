# Matriz individual de identidad

Fecha: 2026-09-13. Roster: 105 heroes, data/heroes.json en 553ad63.
La columna de propuestas sigue pendiente salvo avances marcados en Actual.
Complementa PLAN_IDENTIDAD_HEROES.md y COBERTURA_CONTRATOS_HEROES.md.

La columna actual resume mecanismos, no repite literalmente el texto de la
habilidad. No incluye todos los multiplicadores de objetos/evoluciones.
Las rarezas se conservan. Cada fila propone una firma y una debilidad;
los valores finales se fijan despues de las pruebas de fase 1.

## Fase 2: soportes, economia y excepcion de Luke

Regla comun F2/lote 6: auras incondicionales del mismo atributo suman su
potencia activa, no se multiplican entre si. Maria conserva su capa por
victima marcada; Reed excluye su aporte de la geometria interna. Esta regla
cierra la politica de acumulacion pendiente en las filas anteriores, no las
comparativas de rutas/equipos ni la evolucion del buff.

Regla comun F2/lote 7: los nueve soportes multiplican su potencia de aura por
1.25 al nivel 50, sin bonus evolutivo de radio/ciclos ni ataques propios.
Incluye presupuesto y tope de X, pulso de Wasp, red de Panther y condicion de
Maria. Resuelve la evolucion del buff pendiente en estas filas; los cruces
especificos con objetos y comparativas de rutas siguen pendientes.

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `capitan_america` | Capitan America (Epic) | F2/lote 2: aura amplia constante, conservada y probada contra cobertura corta de Panther; no ataca ni con Mjolnir. | Liderazgo estable verificado; falta comparar equipos y politica global de acumulacion. |
| `black_panther` | Black Panther (Epic) | F2/lote 2: Red de Vibranium, seis ataques principales aliados elevan potencia de aura x1.5 por 3 s; preparacion/recarga 9 s, sin dano propio. | Sobrecarga para formacion compacta implementada; medir equipos y evolucion del buff, sin reactivar kit atacante. |
| `nick_fury` | Nick Fury (Rare) | F2/lote 3: Orden sostenida, +8% base a 265 px; estable, suspendida por stun, sin ataque ni deteccion aliada. | Cobertura constante verificada frente al pulso corto; falta comparar equipos completos y acumulacion global. |
| `wasp` | Wasp (Common) | F2/lote 3: Enlace Pym, 6 s de preparacion/descanso y 3 s con +36% base a 125 px; mover o recolocar reinicia. | Pulso corto implementado, reloj avanza bajo stun; comparativa estacionaria no certifica control ni economia en rutas. |
| `invisible_woman` | Invisible Woman (Legendary) | F2/lote 4: +8% base a 245 px y deteccion continua para aliados; no revela globalmente ni ataca. | Campo de cobertura conservado y probado; falta comparar equipos y rutas. |
| `mister_fantastic` | Mister Fantastic (Legendary) | F2/lote 4: +15% base a 145 px, solo extension exterior; su bonus no agranda hueco del anillo ni carriles cruz/X. | Geometria elastica implementada en seleccion, habilidades, signatures y dibujo; no deteccion ni ataques propios. |
| `wong` | Wong (Common) | F2/lote 4: +4.5% base de alcance a 205 px constante; 4 s de espera y 4 s de deteccion, sin atacar. | Sello de vigilancia implementado; stun no congela reloj, mover/recolocar rearma. Medir perdida de continuidad en rutas. |
| `maria_hill` | Maria Hill (Common) | F2/lote 5: deteccion a 225 px y +9% base de dano directo contra marcas activas; condicion por victima al impactar, sin atacar ni marcar. | Orden de prioridad implementada; requiere atacante/soporte desplegados, en radio y sin stun. No aumenta DoT ni ejecuciones; faltan comparativas de equipos/rutas. |
| `profesor_x` | Profesor X (Mythic) | F2/lote 3: reparte 50 puntos base de cadencia entre atacantes a 245 px, tope +30% por aliado; deteccion solo enlazada, sin ataque. | Presupuesto y dilucion implementados; soportes/aturdidos excluidos. Escala con nivel; falta balance de formaciones en rutas. |
| `domino` | Domino (Epic) | F2/lote 8: ceil(15% recompensa final) por disparo principal; sin duplicacion en secundarios, DoT o retorno, a todos los niveles. | Contabilidad con control y objetos probada; sin tope oculto. Falta medir ingreso por ruta y oportunidad de plaza; clones futuros deberan respetar el contrato. |
| `luke_cage` | Luke Cage (Common) | F2/lote 1: atacante con ruptura; sin buff aliado. Tenacidad propia reduce stun recibido 50%, sin inmunidad ni curacion. | Guardia de Harlem implementada en su contrato inicial; comparar aporte en equipos y encuentros con stun. |

## Fase 3: tiradores y tecnologia

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `iron_man` | Iron Man (Legendary) | F3/lote 1: carga de 3 disparos (2 Extremis), reactor de 2 s, carga saturada conservada durante calor y laser solo en siguiente ataque. | Alineacion y limite termico probados; detecta segun stats. Comparar Extremis/equipos/rutas en fases 8/10. |
| `black_widow` | Black Widow (Common) | F3/lote 2: cuarta descarga hasta 4 blancos, inhibe apoyos hasta 2 s + 3 s inmunidad posterior. Sin marca/stun nativos, conserva veneno y ruptura contra apoyos. | Jefes inmunes a inhibicion; no detiene movimiento. Medir perdida de CC y aporte anti-soporte en rutas. |
| `hawkeye` | Hawkeye (Common) | F3/lote 1: tres municiones, cuarto disparo +35% dano y refuerzo exclusivo: area 85 px, slow 60% o penetracion 80%. | Preparacion conserva timer/carga al cambiar municion; sin efecto retroactivo sobre proyectiles. Comparar control y coste de plaza en rutas. |
| `falcon` | Falcon (Common) | F3/lote 4: Redwing recon revela al identificado 2 s con resistencias, ademas de marca y aura de deteccion existentes. Asalto no revela. | Caducar restaura sigilo nativo; otros ocultos no cambian. Conserva tiempos y dano; falta medir aporte de revelado en rutas. |
| `winter_soldier` | Winter Soldier (Rare) | F3/lote 3: ciclo 85/85/160% dano; remate refuerza perforacion, explosion o stun electrico. Conserva Overclock y municiones. | Coste en dos disparos ligeros, no recarga temporal extra. Cambiar modo no reinicia ciclo. Falta contraste de control y rutas. |
| `war_machine` | War Machine (Rare) | F3/lote 4: sexto disparo fija zona 65 px; tras 0.9 s golpea hasta cinco detectados al 60% de poder por escala de habilidad. Conserva disparo y quemadura anteriores. | Una zona, no sigue blanco; mover/stun/retiro cancelan. Sin efectos o ingresos extra; corredores pueden salir antes. |
| `punisher` | Punisher (Common) | F3/lote 3: +8% dano por disparo previo al mismo blanco, maximo +32%; cruz y splash pequeno conservados. | Pierde rampa al cambiar blanco, mover, stun, perder deteccion/alcance o 2 s sin ataque. No control de movimiento; pendiente presupuesto/rutas. |
| `shuri` | Shuri (Common) | F3/lote 2: escaneo 3 s, +35% dano directo aliado solo contra barrera; no marca general, DoT ni bonus a vida. Conserva deteccion. | Primer impacto prepara siguientes; romper escudo borra estado. Ventaja contra barreras y desventaja sin ellas probadas; faltan rutas/equipos. |
| `rocket_raccoon` | Rocket Raccoon (Common) | F3/lote 8: torreta 5 s/recarga 6 s; mientras activa reserva 20% del disparo para pulsos a 0.5 s, sin objetos/firmas. | Una por dueno, reserva acotada, cobertura propia; mover/stun/retiro cancela. Reparte dano, no agrega DPS gratis. |
| `cable` | Cable (Epic) | F3/lote 5: 3 s apuntando al mismo jefe/amenaza 4+ preparan siguiente disparo al 190% de dano, sin cambiar cadencia. | Reinicia al perder objetivo, cobertura, mover/stun/retiro; cruz y objeto conservados. Pendiente balance en rutas. |
| `kate_bishop` | Kate Bishop (Common) | F3/lote 6: cuarta flecha revela hasta seis en 80 px durante 3 s al impactar. Conserva marca, deteccion y carcaj independiente. | Sin dano extra, no balizas por rebotes; si el blanco muere antes pierde flecha. Pendiente rutas/equipos. |
| `mockingbird` | Mockingbird (Common) | F3/lote 6: segundo golpe al mismo blanco al 140%, stun 0.35 s con recarga electrica 2 s. Sustituye stun aleatorio, conserva marca y Localizador. | Reinicios por cambio blanco, movimiento, stun, cobertura/retiro o 2.5 s sin ataque; recarga no se reinicia al perder combo. |
| `yelena_belova` | Yelena Belova (Common) | F3/lote 7: +20% al insistir sobre marcado; al abatir al seguido transfiere marca a uno cercano detectable dentro de alcance. | Sin revelar, dano incidental ni cambio de prioridad. Pierde seguimiento por interrupciones; veneno/marca base intactos. |
| `nebula` | Nebula (Rare) | F3/lote 5: +10 puntos de penetracion por disparo previo, maximo 50; +10 contra Tecnologicos tras el primero. | Pierde adaptacion al cambiar blanco, mover/stun/retiro, perder alcance o 2.5 s sin ataque. Techo con objetos 85%; no dano extra sin armadura. |
| `peni_parker` | Peni Parker (Rare) | F3/lote 8: mina fija, arma 1 s, caduca 5 s, trigger 26 px, area 65 px para cinco; web 35%/2 s, recarga 8 s. | Una por dueno, sin dano ni activacion de objetos; cobertura y deteccion efectivas, limpiar al mover/stun/retiro. |
| `howard_the_duck` | Howard the Duck (Common) | F3/lote 7: cada tercer disparo garantiza burn o slow alternadamente; el otro efecto sigue probabilistico. | Potencias originales, sin garantias de objetos ni cambio en vuelo. Pendiente aporte de control/DoT por ruta. |

## Fase 4: combate cercano y combos

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `hulk` | Hulk (Mythic) | F4/lote 1: furia 8/ataque y 6/s por enemigo cercano detectable (maximo 3); no vidas perdidas ni cadencia por furia. Conserva salto 2.25x y area/stun incidental. | Implementado: descarga por 50 de furia y recarga base 8s; validar balance de equipos en fase 10. |
| `wolverine` | Wolverine (Epic) | F4/lote 2: 7/14 de frenesi por ataque inicial/repetido, mitad al cambiar o retomar tras 3s, decae 12/s tras pausa. Sin cadencia por multitudes. Salto 3x/regreso 0.8s y Berserker preservados. | Implementado: persecucion sostenida, techo 100, movimiento/stun vacian; retorno respeta recolocacion manual. Balance de equipos pendiente. |
| `gamora` | Gamora (Common) | F1/lote 16: combo secundario y ejecucion garantizada de comunes al 25% o menos, ignorando defensas; excluye todos los jefes. | Ejecucion precisa de debilitados; medir aporte real contra comunes protegidos sin ejecutar bosses. |
| `ant_man` | Ant-Man (Common) | Diminuto rapido o gigante con splash/retroceso. | Ventanas Pym: diminuto prepara y gigante consume carga; no cambiar forma para eludir cooldown ni mover fuera de ruta. |
| `shang_chi` | Shang-Chi (Epic) | F2/lote 8: tres modos de anillos, sin monedas ocultas en Guardia; conserva perfiles y cadencia. | Combo de anillos con finalizadores distintos pendiente de fase 4; no aura aliada atacante. |
| `moon_knight` | Moon Knight (Epic) | Ciclo automatico alcance/dano/cadencia y retorno. | Ciclo lunar previsible que cambia prioridades, no selector manual prometido; debilidad distinta en cada fase. |
| `she_hulk` | She-Hulk (Rare) | F4/lote 1: Objecion preparada en tres ataques, recarga minima 4s; hasta cuatro detectables, marca y retroceso resistible, stun solo principal. Conserva enfoque signature. | Implementado sin taunt ficticio: respeta prioridad elegida; interrumpe movimiento, no acciones de boss. Balance de equipos pendiente. |
| `iron_fist` | Iron Fist (Epic) | Critico propio y stun probabilistico. | Carga de chi para un golpe concentrado; descanso entre golpes y sin area masiva. |
| `jessica_jones` | Jessica Jones (Common) | Golpe lento y chance de stun. | Ultima linea: impacto extra al enemigo mas avanzado; condicion explicita de progreso por ruta, no de coordenada de base. |
| `elektra` | Elektra (Rare) | F1/lote 2: sangrado 22% dano efectivo/s y critico propio. | Remate a un objetivo ya sangrante; consume preparacion, sin cadena de ejecuciones de bosses. |
| `okoye` | Okoye (Common) | Critico propio y ruptura. | Estocadas sucesivas de guardia: ruptura fiable tras varios golpes; exige sostener la primera linea. |
| `mbaku` | M'Baku (Common) | Ruptura probabilistica. | Desafio al tanque: derribar una porcion de barrera con golpe lento; inferior contra unidades blandas. |
| `red_guardian` | Red Guardian (Common) | Un rebote y stun sin filtro elite. | Escudo de intercepcion: segundo impacto frena al avanzado; pocos blancos y stun con condicion visible. |
| `korg` | Korg (Common) | Splash corto y slow. | Pisoton de proximidad al entrar varios enemigos; poco alcance y enfriamiento, no detector ni penetracion universal. |
| `echo` | Echo (Common) | Marca y critico propio, no copia. | Aprendizaje de la presa: mejora su siguiente combo tras repetir patron; no copiar cualquier habilidad aliada ni buffs de equipo. |
| `valkyrie` | Valkyrie (Rare) | F1/lote 2: sangrado 20% dano efectivo/s y critico propio. | Carga preparada desde terreno alto con retorno; bonificacion de terreno real y sin invadir colocaciones bloqueadas. |
| `rogue` | Rogue (Epic) | F1/lote 13: buff signature de dano/cadencia dura 3.2 s reales; no roba rasgos del enemigo. | Robar temporalmente un rasgo permitido al blanco para potenciarse; lista acotada, nunca robar pasivas de boss. |
| `beast` | Beast (Epic) | F1/lote 15: analisis signature con bonus temporal de 2.2 s resistibles; sin pulso generico extra. Conserva rebote/slow. | Combo acrobatico entre dos enemigos distintos; pierde eficiencia contra blanco aislado, sin mover unidades aliadas. |
| `x_23` | X-23 (Epic) | F4/lote 2: tres ataques preparan critico minimo x3 contra misma presa sangrante; se consume, pierde por cambio/stun/movimiento o pausa 2.5s. Conserva sangrado y Corte Multiple signature. | Implementado: remate de objetivo unico, sin ejecucion de boss ni doble multiplicacion critica. Balance de equipos pendiente. |
| `drax` | Drax (Rare) | F1/lote 1: sangrado 20% dano efectivo/s. | Duelo literal: dano sostenido creciente sobre el mismo elite, con techo y reinicio al cambiar; malo contra oleadas dispersas. |
| `lady_sif` | Lady Sif (Rare) | Ruptura y critico propio incondicional. | Desafio asgardiano: critico condicionado al blindaje roto de un elite; sin buff externo ni ejecucion instantanea. |
| `white_tiger` | White Tiger (Rare) | F1/lote 13: enfoque signature hasta ocho stacks de 3.5%, caduca tras 3 s sin atacar; conserva marca y critico. | Amuleto: consume su marca para un salto de remate; enfriamiento, no duplicar marcas indefinidamente. |
| `tigra` | Tigra (Rare) | F1/lotes 1/13: bleed 20% poder/s; enfoque signature ocho stacks de 3.5% caduca en 3 s sin atacar. | Garras contra enemigos controlados; bono condicionado a slow/web, sin generar por si sola todo el combo. |
| `angela` | Angela (Epic) | Penetracion, rebote y critico. | Caza de elite aislado: secuencia precisa y finalizador; pierde su ventaja cuando el blanco tiene escolta. |
| `deadpool` | Deadpool (Epic) | F1/lotes 2 y 7: sangrado 20% poder/s; con arsenal y evolucion, ciclo pistolas/katana/explosivos cada 3 ataques desde la primera activacion. | Ciclo pistolas/katanas con fase de recarga previsible; caos visual contenido y ninguna curacion a base. |
| `devil_dinosaur` | Devil Dinosaur (Rare) | Splash y stun probabilistico. | Pisada cargada y mordida al centro del grupo; exige acumulacion de enemigos y tiene recuperacion larga. |

## Fase 5: control, deteccion y terreno

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `spiderman` | Spider-Man (Epic) | Redes acumuladas, inmovilizacion y deteccion propia. | Tejido progresivo sobre un blanco; umbral visible y ventana de resistencia tras inmovilizar, sin stun perpetuo. |
| `miles_morales` | Miles Morales (Epic) | Redes y stun probabilisticos. | Cargar bioelectricidad en blancos enredados y descargar en grupo; menos control constante que Peter. |
| `groot` | Groot (Common) | F1/lote 12: raices fijan detectable a 1.35x; zona estacionaria de radio 48 con slow incidental, sin mover enemigos. | Raices estacionarias en curva: control de zona persistente, sin bloquear ruta; enemigo que sale recupera velocidad. |
| `daredevil` | Daredevil (Epic) | Pulso global de deteccion y contraataque cada 4. | Lectura anticipada: ventanas claras de revelado; dano modesto, sin volver permanente la vision de todo el equipo. |
| `quake` | Quake (Common) | Slow y ruptura por probabilidad. | Onda sismica sobre terrestres de una linea; no afectar a voladores, ni desplazar fuera del camino. |
| `medusa` | Medusa (Common) | Rebote corto y slow solo por efecto de impacto. | Sujecion de pocos blancos conectados; repartir el control entre ellos, mala contra grupos enormes. |
| `iceman` | Iceman (Legendary) | Splash con slow aplicado al blanco principal. | Escarcha acumulada que congela tras exposicion; reglas explicitas de area y resistencia posterior, distinto de Storm. |
| `storm` | Storm (Legendary) | F1/lote 11: zona se centra en detectable dentro del anillo; el clima ya creado afecta vecinos incidentalmente sin revelar. | Elegir zona de ventisca o tormenta con cooldown compartido; preservar punto ciego salvo excepcion anunciada. |
| `crystal` | Crystal (Common) | F1/lote 6: con cristal y evolucion alterna fuego 20% poder/s, hielo y rayos cada 7 ataques, desde la primera activacion. | Ciclo corto de elementos con proximo efecto visible; cada fase hace una cosa, no todos los efectos por disparo. |
| `namor` | Namor (Legendary) | Permiso de agua y penetracion. | Marea de asalto condicionada a estar sobre agua; tierra viable pero menos potente, sin mapa de agua obligatorio. |
| `namora` | Namora (Common) | Agua, penetracion y ruptura. | Emboscada costera de primer impacto; preparacion entre presas, distinta del dano sostenido de Namor. |
| `triton` | Triton (Common) | Agua, deteccion propia y slow. | Exploracion abisal: revela al equipo desde posicion acuatica; dano bajo y cobertura localizada. |
| `jeff_the_land_shark` | Jeff The Land Shark (Rare) | Agua, deteccion y slow. | Corriente que reduce la velocidad de un tramo corto; sin curar ni tragar/eliminar bosses. |
| `luna_snow` | Luna Snow (Rare) | Splash pequeno, slow y deteccion. | Ritmo de hielo: pulsos de slow coordinados, utiles ante oleadas rapidas; no congelacion permanente de Iceman. |
| `mantis` | Mantis (Rare) | Slow y marca. | Sueno de un blanco que se rompe con dano directo; gran control al reservarlo, no otra aura de ataque. |
| `emma_frost` | Emma Frost (Legendary) | Marca, slow y critico propio. | Concentracion psiquica o diamante resistente al control; debuffs enemigos, no buff aliado mientras ataca. |
| `nightcrawler` | Nightcrawler (Epic) | Rebotes, slow y marca; sin teletransporte de kit. | Salto BAMF entre pocos blancos con retorno al origen; enfriamiento y sin ocupar calle permanentemente. |
| `cosmo` | Cosmo (Rare) | Propagacion de marca y deteccion. | Red psiquica de marcas con limite de enlaces; amplifica ventana de equipo sin ser stun global. |
| `heimdall` | Heimdall (Rare) | Cruz, deteccion propia y marca. | Vigilancia de una salida: revelado anticipado en brazos de la cruz; cobertura geometrica, no vision universal. |
| `squirrel_girl` | Squirrel Girl (Common) | Slow y aumento estatico de cadencia; sin invocacion. | Rafaga de hostigadores temporales contra rezagados; una entidad logica, presupuesto acotado y sin plazas extra. |

## Fase 6: estados, marcas y magia

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `blade` | Blade (Epic) | F1/lote 4: sangrado 21% poder/s, 30% en elites; veneno y medidor por bajas. | Cazador de elites: sangrado escalado por poder y remate preparado; sustituir activacion vacia del contador, sin sanar base. |
| `ghost_rider` | Ghost Rider (Legendary) | F1/lotes 4/11: quemadura unica 13.5% poder/s; Penitencia fija jefe detectable a 1.3x rango. Conserva deteccion innata y cadena. | Penitencia segun dano sufrido por el blanco, con techo especifico para bosses; no acumular retroceso infinito. |
| `scarlet_witch` | Scarlet Witch (Secret) | F1/lote 12: Hex conserva pulso circular incidental 1.25x, slow resistible; marcas, curse y propagacion sin cambios. | Red de maldiciones que madura y detona de forma limitada; conservar rango de preparacion y debilidad ante aislamiento. |
| `cloak` | Cloak (Rare) | Deteccion propia y slow; no revelado global. | Ventana oscura que revela dentro de una zona pequena; sin teleportar enemigos fuera de ruta. |
| `dagger` | Dagger (Rare) | Marca y rebote; rebote no hereda marca hoy. | Dagas que consumen marcas para limpiar blancos consecutivos; sin curacion y sin depender obligatoriamente de Cloak. |
| `magik` | Magik (Epic) | Penetracion, rebote, ruptura y curse. | Corte dimensional contra enemigos malditos con retorno; reducir redundancia de efectos, no copiar portal de Strange. |
| `black_cat` | Black Cat (Rare) | Critico alto y marca. | Mala suerte acumulada que garantiza un critico propio; no generacion de dinero que suplante a Domino. |
| `elsa_bloodstone` | Elsa Bloodstone (Rare) | F1/lote 15: Bloodstone requiere cuatro ataques a la misma presa; bonus personal caduca y se pierde al cambiar. | Marca de caceria contra elite con veneno propio reforzado; lista de blancos explicita, no multiplicador a todos. |
| `gambit` | Gambit (Epic) | Rebote y propagacion de dano simultaneos. | Cartas depositan carga y la ultima detona un grupo limitado; evitar que rebote y propagacion cobren doble sin presupuesto. |
| `hela` | Hela (Legendary) | F1/lote 4: sangrado 24% poder/s; conserva curse, penetracion y rebote. | Necroespinas sobre bajas marcadas; limite de espinas por ventana, sin crecimiento ilimitado en oleadas largas. |
| `human_torch` | Human Torch (Epic) | F1/lotes 5-6: quemadura normal 37.5% poder/s al principal; con traje y evolucion, Nova Flame en area 45% poder/s cada 7 ataques. | Calor acumulado en zona con ignicion final; dano por poder declarado, eficacia baja contra corredores que salen pronto. |
| `the_hood` | The Hood (Rare) | Marca, curse y deteccion propia. | Pacto: alternar preparacion de maldicion y cobro de dano; ventana de vulnerabilidad tactica, no buff permanente gratuito. |
| `psylocke` | Psylocke (Epic) | Penetracion, ruptura y critico. | Corte psiquico preciso contra objetivo marcado; requiere preparar el remate, sin area amplia. |
| `venom` | Venom (Epic) | Splash, penetracion, slow y poison porcentual. | Biomasa: infeccion propia que gana valor al insistir y consume stacks para devorar; techo de jefe, distinto de X-23. |
| `jubilee` | Jubilee (Rare) | F1/lote 6: con Danger Room y evolucion, pulso de fuego en area 20% poder/s cada 10 ataques; conserva splash/slow nativos. | Destello preparado que interrumpe una habilidad enemiga; control breve sin copiar congelacion ni dano cosmico. |
| `loki` | Loki (Legendary) | Slow, marca, curse y propagacion; no clones. | Una ilusion con dano reducido que replica un hechizo permitido; cooldown compartido y cero recursion de procs/economia. |

## Fase 7: energia y alcance especial

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `thor` | Thor (Mythic) | Cadena y tormenta cada 11 s. | Conductividad entre enemigos cercanos: descarga madura al conectar suficientes; menos eficaz contra un blanco aislado. |
| `doctor_strange` | Doctor Strange (Legendary) | Anillo, duplicado cada 2 ataques y campo temporal. | Portal con destino y radio declarados; duplicacion limitada y punto ciego coherente, no ignorar reglas por accidente. |
| `captain_marvel` | Captain Marvel (Legendary) | F1/lotes 5 y 8: quemadura 9.5% poder/s; pasada con deteccion efectiva, alcance 2.2x, regreso al origen y rayo de longitud correcta. | Pasada binaria preparada que vuelve a su casilla; pobre giro contra grupos fuera de linea y enfriamiento real. |
| `vision` | Vision (Legendary) | F1/lote 13: Overclock con cadencia y penetracion de proyectil por 3.2 s; conserva densidades y rayo. | Elegir penetracion concentrada o cobertura en fase; incompatibilidad temporal de modos, sin reunir ambas ventajas. |
| `star_lord` | Star-Lord (Rare) | F1/lote 4: incendiaria 23% poder/s, segundo blaster con deteccion y alcance efectivos. | Dos blancos distintos con elementos complementarios; pierde parte de su dano ante boss aislado. |
| `jean_grey` | Jean Grey (Mythic) | F1/lotes 6/12: Dark Phoenix conserva burn 36% poder/s cada 8 ataques; pulso cargado radial 1.2x incidental y retroceso menor para jefes. | Carga psiquica que culmina en ola Phoenix; presupuesto separado de control/dano y resistencia a empujes del boss. |
| `cyclops` | Cyclops (Epic) | X, modos opticos y rayo extra. | Haz sostenido que premia alineacion precisa; perder carga al cambiar de linea y no rellenar toda la X con AoE. |
| `silver_surfer` | Silver Surfer (Mythic) | X de largo alcance, tres modos y rayo periodico. | Trayectoria cosmica: cruza filas largas, mediocre junto a su origen o fuera de diagonales; excepciones de rango visibles. |
| `nova` | Nova (Legendary) | Un rebote y penetracion; sin pulso cargado. | Carga Nova para un pulso de energia que se agota; ventana potente seguida de recarga, distinta de cadena permanente de Thor. |
| `black_bolt` | Black Bolt (Legendary) | Splash, penetracion y slow. | Silencio preparatorio y grito lineal: golpe enorme poco frecuente; cambiar objetivo pierde carga, no aura atacante. |
| `magneto` | Magneto (Mythic) | Splash, penetracion y ruptura. | Fragmentos al romper barreras alimentan una descarga magnetica; fuerte contra blindados, limitado contra blancos sin armadura. |
| `adam_warlock` | Adam Warlock (Mythic) | Rebotes y modificadores propios; sin capullo de kit. | Capullo que carga fuera de accion y emerge con una descarga; sin resucitar heroes ni curar corazones. |
| `ms_marvel` | Ms. Marvel (Rare) | Un rebote y penetracion. | Cadena fotonica que prepara un impacto final en el ultimo blanco; validar identidad del roster antes de cambiar nombre o arte. |
| `sentry` | Sentry (Mythic) | F1/lotes 1 y 16: splash y quemadura 30% dano efectivo/s; The Void nivel 100 con objeto ejecuta comunes cada 24 ataques, bosses reciben x3 sujeto a defensas. | Energia solar acumulada con descarga y agotamiento; The Void solo segun evolucion existente, no modo libre temprano. |
| `beta_ray_bill` | Beta Ray Bill (Legendary) | Tres rebotes y stun. | Stormbreaker regresa al objetivo inicial con un impacto concentrado; menos control de grupo que Thor. |
| `yondu` | Yondu (Common) | Cruz y dos rebotes decrecientes. | Una flecha persistente recorre objetivos distintos y vuelve; limite de recorrido, no generar proyectiles ilimitados. |

## Lectura transversal

- Las fases 3-7 asignan un hogar de implementacion, no una restriccion de lore.
- Fase 8 revisa evoluciones y objetos de TODAS las filas, no solo las rarezas altas.
- Fase 9 muestra activacion real y limites sin llenar tarjetas del equipo.
- Fase 10 compara todas las familias en equipos y presupuesto equivalentes.
- Las propuestas de minas, clones, torretas y hostigadores requieren un limite
  tecnico comun: desaparecen con el dueno, no son heroes equipables y no
  heredan generadores de dinero ni disparan cadenas recursivas de signatures.
