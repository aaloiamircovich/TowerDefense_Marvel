# Matriz individual de identidad

Fecha: 2026-09-13. Roster: 105 heroes, data/heroes.json en 553ad63.
PROPUESTAS, NO IMPLEMENTADAS. Complementa PLAN_IDENTIDAD_HEROES.md.

La columna actual resume mecanismos, no repite literalmente el texto de la
habilidad. No incluye todos los multiplicadores de objetos/evoluciones.
Las rarezas se conservan. Cada fila propone una firma y una debilidad;
los valores finales se fijan despues de las pruebas de fase 1.

## Fase 2: soportes, economia y excepcion de Luke

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `capitan_america` | Capitan America (Epic) | Aura de dano amplia. | Liderazgo estable: dano uniforme para formaciones separadas; menor pico que Panther, sin atacar. |
| `black_panther` | Black Panther (Epic) | Aura de dano corta; kit cinetico atacante inactivo. | Red de vibranium: potenciar una agrupacion compacta; sobrecarga breve por acciones aliadas con techo, sin dano propio. |
| `nick_fury` | Nick Fury (Rare) | Aura amplia de cadencia. | Orden sostenida: cadencia fiable sobre muchas posiciones; menos potencia que el enlace corto, sin atacar. |
| `wasp` | Wasp (Common) | Aura corta de cadencia alta. | Enlace Pym: pulso potente para vecinos inmediatos; ventana de descanso y radio corto, sin atacar. |
| `invisible_woman` | Invisible Woman (Legendary) | Aura amplia de alcance y deteccion. | Campo de cobertura: ampliar y revelar en una zona amplia; no aumentar dano ni cadencia, sin atacar. |
| `mister_fantastic` | Mister Fantastic (Legendary) | Aura corta de alcance fuerte. | Geometria calculada: extender solo la dimension externa de los patrones; conservar hueco central del anillo, radio corto, sin atacar. |
| `wong` | Wong (Common) | Aura de alcance menor y deteccion. | Sello de vigilancia: alcance modesto y pulsos de deteccion para vecinos; no deteccion continua global, sin atacar. |
| `maria_hill` | Maria Hill (Common) | Aura de dano menor y deteccion. | Orden de prioridad: buff de dano condicionado al objetivo marcado; cobertura limitada frente al liderazgo continuo, sin atacar. |
| `profesor_x` | Profesor X (Mythic) | Aura amplia de cadencia y deteccion. | Enlace mental: repartir un presupuesto de cadencia entre aliados enlazados; mas cobertura divide potencia, sin atacar. |
| `domino` | Domino (Epic) | Poco dano y ceil(15% recompensa) por ataque. | Conservar su firma economica; contador de dinero generado y seleccion tactica. Ningun rebote, DoT o clon cobra otro 15%. |
| `luke_cage` | Luke Cage (Common) | Ataca, rompe armadura y da buffs de alcance/cadencia. | Guardia de Harlem: retirar buffs aliados y convertirlos en tenacidad propia frente a stun; rompe tanques de cerca, sin curar. |

## Fase 3: tiradores y tecnologia

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `iron_man` | Iron Man (Legendary) | Laser cada 3 ataques; Extremis cada 2. | Carga ARC visible y alineacion rentable; calor limita descargas seguidas, no detector/area universal. |
| `black_widow` | Black Widow (Common) | Ruptura, veneno y descarga cada 4 ataques. | Sabotaje a soportes: inhibicion breve de su funcion especial; recortar procs redundantes y limitar efecto en jefes. |
| `hawkeye` | Hawkeye (Common) | Cruz; tres tipos de flecha seleccionables. | Conservar carcaj: seleccion para oleada y un disparo preparado; cambio de municion no reinicia gratis la recarga. |
| `falcon` | Falcon (Common) | Redwing a distancia, modo reconocimiento/asalto. | Reconocimiento que revela de verdad para aliados o ataque ligero; dron unico y cobertura temporal, sin slots extra. |
| `winter_soldier` | Winter Soldier (Rare) | Modos perforante, electrico y explosivo. | Cargador de rafagas: especializar una rafaga y pagar recarga; distinguir de flecha individual de Hawkeye. |
| `war_machine` | War Machine (Rare) | Cruz, splash, penetracion y burn. | Salva de misiles sobre zona fijada; fuerte contra densidad y flojo ante corredores que abandonan la zona. |
| `punisher` | Punisher (Common) | Cruz, penetracion y splash pequeno. | Supresion al sostener el mismo blanco; perder preparacion al retarget, no area generalista. |
| `shuri` | Shuri (Common) | Marca y deteccion propia. | Escaneo de barrera: marcar un escudo para romperlo coordinadamente; menos utilidad contra enemigos sin defensa. |
| `rocket_raccoon` | Rocket Raccoon (Common) | Proyectil con splash, penetracion y deteccion; no torreta propia. | Una torreta temporal dependiente de su dueno; reparte presupuesto de dano y desaparece al retirarlo. |
| `cable` | Cable (Epic) | Cruz, penetracion, ruptura y deteccion. | Disparo precargado: gran impacto tras apuntar al mismo elite; poco valor contra enjambres rapidos. |
| `kate_bishop` | Kate Bishop (Common) | Cruz, marca y deteccion propia. | Flecha baliza: revelar temporalmente una zona para el equipo; menos dano y municion compleja que Hawkeye. |
| `mockingbird` | Mockingbird (Common) | Stun y marca por probabilidad. | Doble baston: alternar golpe preparatorio y descarga garantizada; requiere permanecer sobre el objetivo. |
| `yelena_belova` | Yelena Belova (Common) | Veneno y marca probabilisticos. | Contrato de caza: concentra ataques sobre el marcado, transfiere marca tras baja; no inhibe soportes como Widow. |
| `nebula` | Nebula (Rare) | Ruptura y deteccion, sin filtro tecnologico. | Adaptacion cibernetica: gana penetracion al insistir en el mismo blanco; bonificacion tecnologica explicita y limitada. |
| `peni_parker` | Peni Parker (Rare) | Redes por impacto y deteccion; sin mina propia. | Una mina de red preparada en el camino dentro de cobertura; enfriamiento tras activarse y limpieza al retirarla. |
| `howard_the_duck` | Howard the Duck (Common) | Burn casi nulo y slow independientes. | Bolsa de trucos sin repeticion inmediata: alternar dos utilidades legibles; azar acotado, sin picos de economia. |

## Fase 4: combate cercano y combos

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `hulk` | Hulk (Mythic) | Furia, salto de area y stun; carga por perder vidas. | Aplastamiento cargado por presion cercana; no premiar perder vidas como via principal. Descarga fuerte y pausa larga. |
| `wolverine` | Wolverine (Epic) | Frenesi, cadencia y salto al avanzado. | Perseguir una presa alimenta frenesi; pierde parte al cambiar objetivo, retorno seguro, sin curacion de base. |
| `gamora` | Gamora (Common) | Combo secundario y ejecucion de no jefes bajo 25%. | Ejecucion precisa de debilitados; definir barreras y tipo de dano para que el umbral sea fiable, sin ejecutar bosses. |
| `ant_man` | Ant-Man (Common) | Diminuto rapido o gigante con splash/retroceso. | Ventanas Pym: diminuto prepara y gigante consume carga; no cambiar forma para eludir cooldown ni mover fuera de ruta. |
| `shang_chi` | Shang-Chi (Epic) | Tres modos de anillos; moneda heredada en guardia. | Combo de anillos con finalizadores distintos; sustituir moneda por preparacion de combo, no aura aliada atacante. |
| `moon_knight` | Moon Knight (Epic) | Ciclo automatico alcance/dano/cadencia y retorno. | Ciclo lunar previsible que cambia prioridades, no selector manual prometido; debilidad distinta en cada fase. |
| `she_hulk` | She-Hulk (Rare) | Marcas, retroceso e impacto cada 3 ataques. | Objecion al elite delantero: golpe preparado que interrumpe una accion; resistencia de jefe y sin taunt ficticio. |
| `iron_fist` | Iron Fist (Epic) | Critico propio y stun probabilistico. | Carga de chi para un golpe concentrado; descanso entre golpes y sin area masiva. |
| `jessica_jones` | Jessica Jones (Common) | Golpe lento y chance de stun. | Ultima linea: impacto extra al enemigo mas avanzado; condicion explicita de progreso por ruta, no de coordenada de base. |
| `elektra` | Elektra (Rare) | Critico propio y bleed plano pequeno. | Remate a un objetivo ya sangrante; consume preparacion, sin cadena de ejecuciones de bosses. |
| `okoye` | Okoye (Common) | Critico propio y ruptura. | Estocadas sucesivas de guardia: ruptura fiable tras varios golpes; exige sostener la primera linea. |
| `mbaku` | M'Baku (Common) | Ruptura probabilistica. | Desafio al tanque: derribar una porcion de barrera con golpe lento; inferior contra unidades blandas. |
| `red_guardian` | Red Guardian (Common) | Un rebote y stun sin filtro elite. | Escudo de intercepcion: segundo impacto frena al avanzado; pocos blancos y stun con condicion visible. |
| `korg` | Korg (Common) | Splash corto y slow. | Pisoton de proximidad al entrar varios enemigos; poco alcance y enfriamiento, no detector ni penetracion universal. |
| `echo` | Echo (Common) | Marca y critico propio, no copia. | Aprendizaje de la presa: mejora su siguiente combo tras repetir patron; no copiar cualquier habilidad aliada ni buffs de equipo. |
| `valkyrie` | Valkyrie (Rare) | Sangrado casi nulo y critico propio. | Carga preparada desde terreno alto con retorno; bonificacion de terreno real y sin invadir colocaciones bloqueadas. |
| `rogue` | Rogue (Epic) | Slow y marca; sin absorcion real. | Robar temporalmente un rasgo permitido al blanco para potenciarse; lista acotada, nunca robar pasivas de boss. |
| `beast` | Beast (Epic) | Un rebote y slow. | Combo acrobatico entre dos enemigos distintos; pierde eficiencia contra blanco aislado, sin mover unidades aliadas. |
| `x_23` | X-23 (Epic) | Bleed casi nulo y probabilidad critica; no supercritico propio. | Caza quirurgica: remate supercritico tras acumular cortes; capacidad limitada y distinta del frenesi de Wolverine. |
| `drax` | Drax (Rare) | Sangrado casi nulo. | Duelo literal: dano sostenido creciente sobre el mismo elite, con techo y reinicio al cambiar; malo contra oleadas dispersas. |
| `lady_sif` | Lady Sif (Rare) | Ruptura y critico propio incondicional. | Desafio asgardiano: critico condicionado al blindaje roto de un elite; sin buff externo ni ejecucion instantanea. |
| `white_tiger` | White Tiger (Rare) | Marca y critico propio incondicional. | Amuleto: consume su marca para un salto de remate; enfriamiento, no duplicar marcas indefinidamente. |
| `tigra` | Tigra (Rare) | Sangrado casi nulo y critico. | Garras contra enemigos controlados; bono condicionado a slow/web, sin generar por si sola todo el combo. |
| `angela` | Angela (Epic) | Penetracion, rebote y critico. | Caza de elite aislado: secuencia precisa y finalizador; pierde su ventaja cuando el blanco tiene escolta. |
| `deadpool` | Deadpool (Epic) | Bleed plano bajo, critico y cadencia estatica. | Ciclo pistolas/katanas con fase de recarga previsible; caos visual contenido y ninguna curacion a base. |
| `devil_dinosaur` | Devil Dinosaur (Rare) | Splash y stun probabilistico. | Pisada cargada y mordida al centro del grupo; exige acumulacion de enemigos y tiene recuperacion larga. |

## Fase 5: control, deteccion y terreno

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `spiderman` | Spider-Man (Epic) | Redes acumuladas, inmovilizacion y deteccion propia. | Tejido progresivo sobre un blanco; umbral visible y ventana de resistencia tras inmovilizar, sin stun perpetuo. |
| `miles_morales` | Miles Morales (Epic) | Redes y stun probabilisticos. | Cargar bioelectricidad en blancos enredados y descargar en grupo; menos control constante que Peter. |
| `groot` | Groot (Common) | Zona de raices periodica y slows por impacto. | Raices estacionarias en curva: control de zona persistente, sin bloquear ruta; enemigo que sale recupera velocidad. |
| `daredevil` | Daredevil (Epic) | Pulso global de deteccion y contraataque cada 4. | Lectura anticipada: ventanas claras de revelado; dano modesto, sin volver permanente la vision de todo el equipo. |
| `quake` | Quake (Common) | Slow y ruptura por probabilidad. | Onda sismica sobre terrestres de una linea; no afectar a voladores, ni desplazar fuera del camino. |
| `medusa` | Medusa (Common) | Rebote corto y slow solo por efecto de impacto. | Sujecion de pocos blancos conectados; repartir el control entre ellos, mala contra grupos enormes. |
| `iceman` | Iceman (Legendary) | Splash con slow aplicado al blanco principal. | Escarcha acumulada que congela tras exposicion; reglas explicitas de area y resistencia posterior, distinto de Storm. |
| `storm` | Storm (Legendary) | Anillo, clima seleccionable, zona y rayos. | Elegir zona de ventisca o tormenta con cooldown compartido; preservar punto ciego salvo excepcion anunciada. |
| `crystal` | Crystal (Common) | Splash y slow; no alternancia elemental. | Ciclo corto de elementos con proximo efecto visible; cada fase hace una cosa, no todos los efectos por disparo. |
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
| `blade` | Blade (Epic) | Bleed mayor en elites, veneno y medidor por bajas. | Cazador de elites: sangrado escalado por poder y remate preparado; sustituir activacion vacia del contador, sin sanar base. |
| `ghost_rider` | Ghost Rider (Legendary) | Burn, cadena con retroceso y penitencia. | Penitencia segun dano sufrido por el blanco, con techo especifico para bosses; no acumular retroceso infinito. |
| `scarlet_witch` | Scarlet Witch (Secret) | Marcas enlazadas, curse, propagacion y slow de zona. | Red de maldiciones que madura y detona de forma limitada; conservar rango de preparacion y debilidad ante aislamiento. |
| `cloak` | Cloak (Rare) | Deteccion propia y slow; no revelado global. | Ventana oscura que revela dentro de una zona pequena; sin teleportar enemigos fuera de ruta. |
| `dagger` | Dagger (Rare) | Marca y rebote; rebote no hereda marca hoy. | Dagas que consumen marcas para limpiar blancos consecutivos; sin curacion y sin depender obligatoriamente de Cloak. |
| `magik` | Magik (Epic) | Penetracion, rebote, ruptura y curse. | Corte dimensional contra enemigos malditos con retorno; reducir redundancia de efectos, no copiar portal de Strange. |
| `black_cat` | Black Cat (Rare) | Critico alto y marca. | Mala suerte acumulada que garantiza un critico propio; no generacion de dinero que suplante a Domino. |
| `elsa_bloodstone` | Elsa Bloodstone (Rare) | Penetracion, ruptura y poison. | Marca de caceria contra elite con veneno propio reforzado; lista de blancos explicita, no multiplicador a todos. |
| `gambit` | Gambit (Epic) | Rebote y propagacion de dano simultaneos. | Cartas depositan carga y la ultima detona un grupo limitado; evitar que rebote y propagacion cobren doble sin presupuesto. |
| `hela` | Hela (Legendary) | Penetracion, rebote, bleed y curse. | Necroespinas sobre bajas marcadas; limite de espinas por ventana, sin crecimiento ilimitado en oleadas largas. |
| `human_torch` | Human Torch (Epic) | Splash y burn plano. | Calor acumulado en zona con ignicion final; dano por poder declarado, eficacia baja contra corredores que salen pronto. |
| `the_hood` | The Hood (Rare) | Marca, curse y deteccion propia. | Pacto: alternar preparacion de maldicion y cobro de dano; ventana de vulnerabilidad tactica, no buff permanente gratuito. |
| `psylocke` | Psylocke (Epic) | Penetracion, ruptura y critico. | Corte psiquico preciso contra objetivo marcado; requiere preparar el remate, sin area amplia. |
| `venom` | Venom (Epic) | Splash, penetracion, slow y poison porcentual. | Biomasa: infeccion propia que gana valor al insistir y consume stacks para devorar; techo de jefe, distinto de X-23. |
| `jubilee` | Jubilee (Rare) | Splash y slow; no cadena pese al texto. | Destello preparado que interrumpe una habilidad enemiga; control breve sin copiar congelacion ni dano cosmico. |
| `loki` | Loki (Legendary) | Slow, marca, curse y propagacion; no clones. | Una ilusion con dano reducido que replica un hechizo permitido; cooldown compartido y cero recursion de procs/economia. |

## Fase 7: energia y alcance especial

| ID | Heroe (rareza) | Actual | Firma propuesta y limite |
| --- | --- | --- | --- |
| `thor` | Thor (Mythic) | Cadena y tormenta cada 11 s. | Conductividad entre enemigos cercanos: descarga madura al conectar suficientes; menos eficaz contra un blanco aislado. |
| `doctor_strange` | Doctor Strange (Legendary) | Anillo, duplicado cada 2 ataques y campo temporal. | Portal con destino y radio declarados; duplicacion limitada y punto ciego coherente, no ignorar reglas por accidente. |
| `captain_marvel` | Captain Marvel (Legendary) | Energia binaria, vuelo temporal y rayo lineal. | Pasada binaria preparada que vuelve a su casilla; pobre giro contra grupos fuera de linea y enfriamiento real. |
| `vision` | Vision (Legendary) | Dos densidades y rayo cada 3 ataques. | Elegir penetracion concentrada o cobertura en fase; incompatibilidad temporal de modos, sin reunir ambas ventajas. |
| `star_lord` | Star-Lord (Rare) | Segundo blaster y tres municiones. | Dos blancos distintos con elementos complementarios; pierde parte de su dano ante boss aislado. |
| `jean_grey` | Jean Grey (Mythic) | Carga Phoenix, telequinesis y retroceso. | Carga psiquica que culmina en ola Phoenix; presupuesto separado de control/dano y resistencia a empujes del boss. |
| `cyclops` | Cyclops (Epic) | X, modos opticos y rayo extra. | Haz sostenido que premia alineacion precisa; perder carga al cambiar de linea y no rellenar toda la X con AoE. |
| `silver_surfer` | Silver Surfer (Mythic) | X de largo alcance, tres modos y rayo periodico. | Trayectoria cosmica: cruza filas largas, mediocre junto a su origen o fuera de diagonales; excepciones de rango visibles. |
| `nova` | Nova (Legendary) | Un rebote y penetracion; sin pulso cargado. | Carga Nova para un pulso de energia que se agota; ventana potente seguida de recarga, distinta de cadena permanente de Thor. |
| `black_bolt` | Black Bolt (Legendary) | Splash, penetracion y slow. | Silencio preparatorio y grito lineal: golpe enorme poco frecuente; cambiar objetivo pierde carga, no aura atacante. |
| `magneto` | Magneto (Mythic) | Splash, penetracion y ruptura. | Fragmentos al romper barreras alimentan una descarga magnetica; fuerte contra blindados, limitado contra blancos sin armadura. |
| `adam_warlock` | Adam Warlock (Mythic) | Rebotes y modificadores propios; sin capullo de kit. | Capullo que carga fuera de accion y emerge con una descarga; sin resucitar heroes ni curar corazones. |
| `ms_marvel` | Ms. Marvel (Rare) | Un rebote y penetracion. | Cadena fotonica que prepara un impacto final en el ultimo blanco; validar identidad del roster antes de cambiar nombre o arte. |
| `sentry` | Sentry (Mythic) | Splash amplio y burn casi nulo. | Energia solar acumulada con descarga y agotamiento; The Void solo segun evolucion existente, no modo libre temprano. |
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
