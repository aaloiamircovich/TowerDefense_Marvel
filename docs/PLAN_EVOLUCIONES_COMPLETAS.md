# Plan futuro de evoluciones completas

Estado: plan de produccion, no implementado en gameplay.

Decision de producto: las evoluciones no deben estar visibles hasta que todos los heroes tengan una evolucion planificada, balanceada y con sprites propios. Activar solo una parte del roster hace que el sistema se sienta incompleto y obliga a explicar una excepcion que no suma a la experiencia.

## Regla de activacion futura

- No volver a agregar `evolutionId` en `data/heroes.json` hasta tener el paquete visual completo.
- Cada evolucion necesita, como minimo: portrait, idle de 8 direcciones, ataque de 8 direcciones, mini icono o badge, color VFX y descripcion.
- Cada evolucion debe conservar el ID base del heroe: el jugador evoluciona a Iron Man, no compra otro Iron Man.
- Las evoluciones deben abrir una decision de build, no ser solo "+stats".
- Cuando se implemente, activar todas por lote o por temporadas completas con comunicacion clara.

## Fases sugeridas

1. Fase A - Diseno cerrado
   Definir nombre, fantasia, rol mejorado y riesgo de balance para los 82 heroes actuales.

2. Fase B - Arte base
   Crear retratos y sprites idle/ataque por familia visual: Avengers, Callejeros, Mutantes, Cosmicos, Misticos, Wakanda/Inhumanos/Atlanticos y Rivales.

3. Fase C - Motor
   Reactivar `evolutionId`, botones de evolucion, validacion de saves y modificadores especiales.

4. Fase D - Balance
   Simular coste/eficiencia por rareza y limitar evoluciones de Mythic/Secret para que no borren a las comunes.

5. Fase E - Lanzamiento
   Activar el sistema con tutorial, filtro de equipo, codex y retos especificos por evolucion.

## Catalogo propuesto

| Heroe | Evolucion futura | Fantasia jugable | Paquete visual |
| --- | --- | --- | --- |
| Iron Man | Model Prime | Mas antiarmadura, beams lineales y cadencia tecnologica. | Armadura blanca/roja, repulsores grandes, beam azul. |
| Spider-Man | Iron Spider | Control con patas mecanicas, redes mas rapidas y deteccion. | Traje rojo/dorado, patas visibles, web VFX metalico. |
| Capitan America | Sentinel of Liberty | Liderazgo defensivo, aura estable y rebotes de escudo. | Traje clasico brillante, escudo con estela azul. |
| Thor | Rune King Thor | Tormentas mas largas, aturdimiento pesado y dano cosmico. | Runas azules, capa clara, rayos runicos. |
| Hulk | Worldbreaker Hulk | Golpes de area, furia extrema y control cercano. | Aura gamma verde, grietas bajo los pies. |
| Black Widow | Red Room Shadow | Sabotaje, criticos y sigilo tactico. | Traje negro/rojo, sombras, municion electrica. |
| Hawkeye | Ronin Marksman | Cambia flechas con mas precision y remates a elites. | Capucha Ronin, katana/flechas, VFX morado. |
| Black Panther | King of Wakanda | Vibranium ofensivo, contraataques y aura de equipo. | Traje real, brillo violeta, pulso vibranium. |
| Doctor Strange | Sorcerer Supreme | Portales dobles, control temporal y deteccion arcana. | Capa viva, mandalas dorados, anillos grandes. |
| Captain Marvel | Binary | Vuelo ofensivo, beams cosmicos y dano de linea. | Aura binaria, cabello luminoso, energia dorada. |
| Wolverine | Weapon X | Frenesi, salto prioritario y cortes criticos. | Casco/arnes Weapon X, garras con estela amarilla. |
| Daredevil | Shadowland Devil | Radar global, golpes rapidos y control urbano. | Traje oscuro, radar rojo, bastones brillantes. |
| Ant-Man | Giant-Man | Alterna mini/gigante con impacto de zona mayor. | Silueta gigante, particulas Pym rojas. |
| Star-Lord | Celestial Outlaw | Municion cosmica, doble disparo y tempo de Guardianes. | Casco luminoso, jets, blasters celestes. |
| Groot | King Groot | Raices mas amplias, proteccion y control de ruta. | Corona de ramas, hojas brillantes, raices grandes. |
| Gamora | Deadliest Woman | Ejecucion de objetivos debiles y duelos contra elites. | Espada extendida, verde intenso, cortes limpios. |
| Scarlet Witch | Nexus Witch | Maldiciones encadenadas, caos y control temporal. | Aura roja/negra, manos brillantes, runas caoticas. |
| Vision | White Vision | Fase mas estable, beam puro y deteccion avanzada. | Cuerpo blanco, gema clara, beam solar. |
| Falcon | Captain America Falcon | Vuelo de apoyo, Redwing mejorado y aura de liderazgo. | Alas blancas/rojas, escudo, dron Redwing. |
| Winter Soldier | White Wolf | Municion tactica, ejecucion de elites y precision. | Brazo vibranium, blanco/negro, disparos frios. |
| Shang-Chi | Master of Ten Rings | Patrones de anillos mas fuertes y control de grupos. | Diez anillos orbitando, golpes dorados. |
| Moon Knight | Fist of Khonshu | Ciclo lunar mejorado, deteccion y castigo a elites. | Blanco plateado, luna grande, sombra azul. |
| She-Hulk | Gamma Attorney | Provocacion, control legal/gamma y golpes de area. | Traje morado/blanco, puños gamma. |
| Jean Grey | Phoenix | Medidor Phoenix, dano explosivo y empuje seguro. | Fuego naranja, alas Phoenix, aura intensa. |
| Cyclops | Optic Commander | Lineas opticas largas, rebotes y precision X-Men. | Visor rojo grande, beam ancho, postura tactica. |
| Storm | Goddess Storm | Clima persistente, rayos y hielo en area. | Cabello blanco brillante, rayos, viento circular. |
| Silver Surfer | Herald Unbound | Pasadas cosmicas, penetracion y cobertura extrema. | Tabla luminosa, energia plateada, estrellas. |
| Blade | Daywalker Prime | Sangrado fuerte, cadencia y caza sobrenatural. | Gabardina roja/negra, espada con runas. |
| Ghost Rider | Spirit of Vengeance | Cadena mas larga, penitencia y fuego de ruta. | Craneo mas brillante, moto/fuego azul. |
| Luke Cage | Unbreakable Power Man | Intercepciones, vidas salvadas y defensa urbana. | Piel brillante, camiseta amarilla, impacto pesado. |
| Domino | Probability Queen | Desvios de fuga, criticos por suerte y control suave. | Aura de dados, balas curvadas, blanco/negro. |
| War Machine | Iron Patriot | Misiles, area y soporte tecnologico. | Armadura patriotica, cohetes, humo controlado. |
| Nick Fury | Director Fury | Ordenes tacticas, deteccion y buffs de equipo. | Abrigo S.H.I.E.L.D., hologramas, dron tactico. |
| Wasp | Quantum Wasp | Picaduras rapidas, vuelo y debuffs de precision. | Alas brillantes, particulas amarillas. |
| Nova | Nova Prime | Rayo cosmico, velocidad y dano sostenido. | Casco Nova Prime, energia azul/dorada. |
| Quake | Destroyer Pulse | Ondas sismicas, ruptura de armadura y control lineal. | Guanteletes vibrando, ondas azules. |
| Medusa | Queen of Attilan | Cabello de control, agarres y apoyo Inhumano. | Cabello rojo extendido, ondas reales. |
| Namor | Imperius Rex | Agua, ruptura de armadura y duelos anfibios. | Tridente, alas de tobillo, salpicaduras. |
| Iron Fist | Immortal Iron Fist | Golpes criticos, chi y burst a corta distancia. | Punio dorado, aura verde, impacto circular. |
| Punisher | War Journal | Prioridad a elites, municion pesada y DPS frontal. | Chaleco calavera, trazadoras blancas. |
| Elektra | Woman Without Fear | Sai rapidos, sangrado y evasion. | Rojo oscuro, cortes gemelos, sombra ninja. |
| Jessica Jones | Alias Defender | Golpes pesados, proteccion y control callejero. | Chaqueta de cuero, impacto violeta sobrio. |
| Cloak | Darkforce Avatar | Ralentiza, oculta aliados y absorbe oleadas. | Capa negra enorme, portales oscuros. |
| Dagger | Lightforce Saint | Luz, marcas y dano a enemigos oscuros. | Dagas luminosas, blanco/dorado. |
| Magik | Darkchylde | Portales, espada alma y control mistico. | Armadura demonica, espada grande, limbo. |
| Iceman | Omega Iceman | Congelacion, caminos de hielo y area persistente. | Cuerpo de hielo cristalino, escarcha. |
| Shuri | Black Panther Shuri | Gadgets vibranium, torretas y soporte tecnologico. | Traje pantera Shuri, guantes sonicos. |
| Okoye | Midnight Angel | Guardia Dora, vanguardia y control con lanza. | Armadura azul/dorada, lanza luminosa. |
| Black Bolt | Silent King | Gritos concentrados, area frontal y control cosmico. | Alas negras, onda de voz azul. |
| Crystal | Elemental Queen | Rotacion elemental, area y soporte Inhumano. | Fuego/agua/tierra/aire orbitando. |
| Namora | Atlantean Vanguard | Agua, velocidad y cortes anfibios. | Armadura atlante, estela marina. |
| Triton | Deep Tide Scout | Defensa acuatica, veneno y deteccion anfibia. | Verde profundo, burbujas, tridente corto. |
| Black Cat | Queenpin Luck | Criticos por suerte, robo de recursos y evasion. | Traje blanco/negro, cartas/dados. |
| Elsa Bloodstone | Bloodstone Huntress | Anti monstruos, disparos pesados y sangrado. | Piedra roja, escopeta, runas. |
| Gambit | Kinetic Ace | Cartas explosivas, cadenas y criticos mutantes. | Cartas rosas, baston, energia cinetica. |
| Hela | Queen of Hel | Invoca filos, dano oscuro y control de jefes. | Corona alta, negro/verde, espadas necro. |
| Human Torch | Nova Flame | Fuego en area, vuelo y quemadura persistente. | Cuerpo en llamas, nova circular. |
| The Hood | Demon Hood | Magia criminal, sigilo y maldiciones cortas. | Capucha roja, humo negro. |
| Psylocke | Psionic Katana | Cortes psi, teletransporte y criticos. | Katana psionica morada, sombra ninja. |
| Squirrel Girl | Unbeatable | Invocaciones, control comico y anti jefe sorpresa. | Cola grande, ardillas pixel, bellotas. |
| Venom | Lethal Protector | Simbionte, area cercana y regeneracion. | Lengua/simbionte negro, zarcillos. |
| Angela | Huntress of Heven | Cadenas, duelo cosmico y ejecucion. | Alas/cintas, dorado rojo, filo cosmico. |
| Devil Dinosaur | Savage King | Pisotones, rugido y control masivo. | Rojo grande, polvo, rugido circular. |
| Emma Frost | Diamond Queen | Forma diamante, control mental y critico. | Cristal blanco, destellos psi. |
| Magneto | Master of Magnetism | Metal, atraccion segura y ruptura de armadura. | Capa roja, campo magnetico violeta. |
| Peni Parker | SP//dr Overdrive | Mecha, misiles y defensa tecnologica. | Robot SP//dr, luces neon, cohetes. |
| Adam Warlock | Magus | Energia cosmica, resurreccion limitada y control. | Dorado oscuro, gema alma, aura magenta. |
| Deadpool | Merc With More Mouth | Caos, municion aleatoria y regeneracion absurda. | Rojo/negro, globos comic opcionales, katanas. |
| Invisible Woman | Forcefield Matriarch | Barreras, proteccion y empuje sin sacar de ruta. | Campos azules, silueta transparente. |
| Jeff The Land Shark | Snack Time Jeff | Mordidas, control divertido y soporte acuatico. | Azul claro, salpicaduras, sonrisa grande. |
| Jubilee | Firework Vampire | Fuegos artificiales, ceguera y burst mutante. | Chispa rosa/amarilla, gafas, energia vampirica. |
| Loki | God of Stories | Ilusiones, desvio de objetivos y magia cosmica. | Verde/dorado, clones, paginas luminosas. |
| Luna Snow | Absolute Zero Idol | Hielo, curacion ligera y control musical. | Hielo azul, notas musicales, microfono. |
| Mantis | Celestial Empath | Sueño, control mental y apoyo Guardian. | Antenas brillantes, aura verde suave. |
| Mister Fantastic | Future Foundation | Elasticidad, cobertura y tecnologia tactica. | Traje blanco/azul, brazos extendidos. |
| Rocket Raccoon | Heavy Ordnance Rocket | Artilleria, torretas y explosivos. | Armadura naranja, cañon grande, humo. |
| Nightcrawler | Hopesword Nightcrawler | Teletransporte, cortes y rescate de fugas. | Humo azul, espada luminosa, bamf VFX. |
| Ms. Marvel | Embiggened Champion | Brazos gigantes, apoyo Avengers y area frontal. | Puños enormes, energia amarilla, bufanda. |

## Bloqueos antes de implementar

- Confirmar si el roster actual queda congelado antes de producir sprites.
- Definir si cada evolucion exige moneda, logro, contrato semanal o maestria.
- Crear una plantilla de prompt/sprite por rareza para mantener consistencia.
- Presupuestar aproximadamente 82 portraits y 82 sets completos de sprites.
- Decidir si algunas evoluciones requieren VFX nuevos o pueden usar recolor.

## Criterio de listo

El sistema puede volver a gameplay cuando:

- 100% del roster tenga `evolutionId`.
- 100% del roster tenga sprites generados y validados.
- Los tests de datos impidan heroes con evolucion incompleta.
- El perfil/codex expliquen como desbloquear y comparar evoluciones.
- El balance confirme que Common/Rare evolucionados siguen siendo utiles sin superar siempre a Mythic/Secret.
