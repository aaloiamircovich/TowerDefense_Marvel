import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const heroesFile = path.join(root, 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(heroesFile, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

export const RIVALS_HERO_IDS = [
    'black_cat',
    'elsa_bloodstone',
    'gambit',
    'hela',
    'human_torch',
    'the_hood',
    'psylocke',
    'squirrel_girl',
    'venom',
    'angela',
    'devil_dinosaur',
    'emma_frost',
    'magneto',
    'peni_parker',
    'adam_warlock',
    'deadpool',
    'invisible_woman',
    'jeff_the_land_shark',
    'jubilee',
    'loki',
    'luna_snow',
    'mantis',
    'mister_fantastic',
    'rocket_raccoon'
];

const rivalsHeroes = {
    black_cat: contract('Black Cat', 'Urbano', 'Rare', 245, 31, 135, 2.05, true, 'GOLPE DE SUERTE', 'Tres disparos sin critico cargan Mala Suerte. Con preparacion de 3s, el siguiente es critico garantizado; cualquier critico reinicia la carga. Conserva marca breve y deteccion, sin generar dinero.', 'critico, sigilo y control ligero', ['Callejero', 'Espias', 'Rivales'], 'support', [4, 3, 3, 5], {
        statModifiers: { critChance: 8, detectStealth: true },
        attackEffects: [{ type: 'mark', duration: 1.8, power: 0.12, chance: 0.36 }],
        visualStyle: 'blade',
        projectileColor: '#f8fafc'
    }),
    elsa_bloodstone: contract('Elsa Bloodstone', 'Mistico', 'Rare', 330, 44, 170, 1.3, true, 'BLOODSTONE', 'Tres ataques consecutivos a la misma presa jefe o amenaza4+ preparan municion Bloodstone. Con recarga de4s, el siguiente inflige20% extra y aplica2 capas de veneno: 0.54% de salud maxima/s durante4s. Cambiar presa o pasar2.5s sin atacar reinicia la caceria. Conserva ruptura y penetracion; sin bonus contra soldados.', 'cazadora anti elite con deteccion', ['Oscuros', 'Callejero', 'Rivales'], 'artillery', [5, 3, 2, 5], {
        projectileProfile: { armorPenetration: 0.22 },
        attackEffects: [{ type: 'armorBreak', duration: 3.0, power: 0.16, chance: 0.34 }],
        statModifiers: { detectStealth: true },
        visualStyle: 'ballistic',
        projectileColor: '#ff3b5f'
    }),
    gambit: contract('Gambit', 'Mutante', 'Rare', 335, 37, 165, 1.55, false, 'CARGA CINETICA', 'Tres cartas consecutivas sobre la misma presa cargan una detonacion. Con recarga de4s, la siguiente causa65% de poder adicional a hasta4 detectados a60px y dentro de su alcance. Conserva2 rebotes pero elimina la propagacion duplicada. Cambiar presa o pasar2.5s sin atacar pierde la carga.', 'rebote mutante para oleadas medias', ['Mutantes', 'X-Men', 'Rivales'], 'artillery', [4, 4, 2, 3], {
        projectileProfile: { chainCount: 2, chainRange: 95, chainFactor: 0.45 },
        statModifiers: { critChance: 4 },
        visualStyle: 'energy',
        projectileColor: '#d86cff'
    }),
    hela: contract('Hela', 'Mistico', 'Legendary', 620, 70, 180, 0.85, false, 'ESPINAS DE HEL', 'Perfora armadura y rebota. 42% de sangrar durante3.2s:24% de poder/s. 48% de maldecir:0.42% de salud maxima/s durante4.5s. Cada6s, una baja propia de un maldito en alcance prepara necroespinas: tras0.6s causan70% de poder a hasta3 detectados a65px. No generan otras espinas.', 'artilleria mistica anti jefe', ['Mistico', 'Oscuros', 'Rivales'], 'artillery', [5, 3, 2, 2], {
        projectileProfile: { armorPenetration: 0.32, chainCount: 1, chainRange: 90, chainFactor: 0.5 },
        attackEffects: [{ type: 'bleed', duration: 3.2, power: 0.24, damageBasis: 'attackDamage', chance: 0.42 }, { type: 'curse', duration: 4.5, power: 0.0042, chance: 0.48 }],
        visualStyle: 'mystic',
        projectileColor: '#69e58c'
    }),
    human_torch: contract('Human Torch', 'Cosmico', 'Rare', 360, 36, 175, 1.65, false, 'NOVA FLAME', 'Cada 7s al atacar crea una zona fija de 55px durante 3s. La ignicion final causa 90% del poder capturado a hasta 4 detectados en alcance que hayan permanecido al menos 2s seguidos dentro. Conserva splash y quemadura: 34% de aplicar 37.5% de dano efectivo/s durante 2.5s.', 'area aerea y quemadura', ['Cosmico', 'Rivales'], 'artillery', [4, 4, 2, 2], {
        projectileProfile: { splashRadius: 48, splashFactor: 0.32 },
        attackEffects: [{ type: 'burn', duration: 2.5, power: 0.375, damageBasis: 'attackDamage', chance: 0.34 }],
        statModifiers: { rangePct: 0.04 },
        visualStyle: 'fire',
        projectileColor: '#ff7b3d'
    }),
    the_hood: contract('The Hood', 'Mistico', 'Rare', 310, 40, 155, 1.35, true, 'PACTO DEMONICO', 'Tras 3s prepara un disparo con maldicion de 0.38% de salud maxima/s por 3.6s y marca16% por 2.4s. El pacto reduce25% sus siguientes disparos; despues de 1.5s puede cobrar contra esa presa aun maldita con80% extra. Cobrar, perder presa o vencer4s inicia recarga4s. Conserva deteccion propia.', 'marca oscura y deteccion', ['Oscuros', 'Callejero', 'Rivales'], 'support', [4, 3, 3, 5], {
        attackEffects: [],
        statModifiers: { detectStealth: true },
        visualStyle: 'mystic',
        projectileColor: '#b865ff'
    }),
    psylocke: contract('Psylocke', 'Mutante', 'Legendary', 455, 48, 135, 1.55, true, 'KATANA PSIQUICA', 'Atacar a una presa marcada inicia concentracion. Tras 1.5s manteniendo esa presa, y con recarga5s lista, el siguiente corte garantiza critico de al menos2.75x y ruptura28% por2s al impacto. Cambiar presa, perder marca o alcance, o no atacar durante3s reinicia. Conserva penetracion22% y deteccion.', 'duelista mutante anti sigilo', ['Mutantes', 'X-Men', 'Marciales', 'Rivales'], 'vanguard', [5, 4, 2, 5], {
        projectileProfile: { armorPenetration: 0.22 },
        attackEffects: [],
        statModifiers: { detectStealth: true, critChance: 5 },
        visualStyle: 'blade',
        projectileColor: '#ff8cff'
    }),
    squirrel_girl: contract('Squirrel Girl', 'Urbano', 'Rare', 255, 24, 150, 2.15, false, 'EMBOSCADA IMPROBABLE', 'Cada 6s, al atacar, hostiga al terrestre detectable mas avanzado en su alcance: 4 golpes de 30% de poder cada 0.75s. El primero ralentiza 28% durante 1.4s. Una sola entidad logica, sin cupo de equipo ni efectos extra; salir del alcance, mover o aturdir cancela.', 'cadencia alta y control economico', ['Callejero', 'Rivales'], 'support', [3, 4, 4, 2], {
        attackEffects: [],
        statModifiers: { fireRatePct: 0.08 },
        visualStyle: 'impact',
        projectileColor: '#f59e0b'
    }),
    venom: contract('Venom', 'Mutante', 'Legendary', 500, 58, 120, 1.18, false, 'SIMBIONTE DEPREDADOR', 'Conserva slow y veneno acumulable. Cada6s al atacar puede consumir3 capas propias de veneno de la presa para devorar: 1.5x poder +1% salud maxima, limitado a4x poder y, contra jefes,2% de salud maxima tras multiplicadores. Liquida el veneno ya transcurrido y conserva las capas aliadas. No ejecuta ni cura.', 'vanguardia anti blindaje', ['Oscuros', 'Callejero', 'Rivales'], 'vanguard', [5, 4, 2, 2], {
        projectileProfile: { armorPenetration: 0.2, splashRadius: 36, splashFactor: 0.25 },
        attackEffects: [{ type: 'slow', duration: 1.5, power: 0.34, chance: 0.34 }],
        statModifiers: { damagePct: 0.06 },
        visualStyle: 'web',
        projectileColor: '#111827'
    }),
    angela: contract('Angela', 'Cosmico', 'Legendary', 540, 62, 150, 1.05, false, 'HOJAS DE HEVEN', 'Tres ataques al mismo jefe o amenaza 4+ sin enemigos vivos a 90 px preparan un cuarto ataque con +90% de dano. Una escolta, cambio, movimiento, stun, perdida de cobertura o pausa de 2.5 s reinicia. Conserva penetracion 26%, un rebote y +6 puntos criticos propios.', 'duelista cosmica anti jefe', ['Cosmico', 'Marciales', 'Rivales'], 'vanguard', [5, 3, 2, 2], {
        projectileProfile: { armorPenetration: 0.26, chainCount: 1, chainRange: 80, chainFactor: 0.48 },
        statModifiers: { critChance: 6 },
        visualStyle: 'blade',
        projectileColor: '#ffd166'
    }),
    devil_dinosaur: contract('Devil Dinosaur', 'Mutante', 'Legendary', 575, 68, 105, 0.92, false, 'ESTAMPIDA ROJA', 'Dos ataques a un grupo de 3 terrestres detectables en cobertura y a 58 px preparan una mordida x1.65; agrega golpe de 35% de poder a hasta 4 vecinos y stun 0.3 s a los cinco. Recarga 6 s, no desplaza. Conserva splash basico; mover, stun, retiro o pausa 2.5 s reinician carga.', 'tanque de impacto y area', ['Rivales'], 'vanguard', [5, 4, 3, 1], {
        projectileProfile: { splashRadius: 58, splashFactor: 0.35 },
        attackEffects: [],
        statModifiers: { damagePct: 0.05 },
        visualStyle: 'impact',
        projectileColor: '#ef4444'
    }),
    emma_frost: contract('Emma Frost', 'Mutante', 'Legendary', 470, 34, 180, 1.45, true, 'DIAMANTE PSIQUICO', 'Forma psiquica: cada 3s prepara marca 17% por 2.8s y slow 28% por 1.6s al impacto. Diamante: resiste 60% del aturdimiento pero no aplica esos controles. Conserva deteccion y +4 puntos de critica propia; no potencia aliados.', 'soporte mutante de control', ['Mutantes', 'X-Men', 'Rivales'], 'support', [3, 5, 5, 5], {
        attackEffects: [],
        statModifiers: { detectStealth: true, critChance: 4, rangePct: 0.05 },
        visualStyle: 'ice',
        projectileColor: '#e0f2fe'
    }),
    magneto: contract('Magneto', 'Mutante', 'Legendary', 590, 55, 205, 0.95, false, 'CAMPO MAGNETICO', 'Aplasta blindajes con area magnetica y penetracion superior desde posiciones elevadas.', 'artilleria anti blindaje', ['Mutantes', 'X-Men', 'Rivales'], 'artillery', [5, 4, 3, 2], {
        projectileProfile: { splashRadius: 52, splashFactor: 0.34, armorPenetration: 0.34 },
        attackEffects: [{ type: 'armorBreak', duration: 3.4, power: 0.22, chance: 0.36 }],
        visualStyle: 'mystic',
        projectileColor: '#d946ef'
    }),
    peni_parker: contract('Peni Parker', 'Tecnologico', 'Rare', 345, 29, 165, 1.9, true, 'SP//DR LINK', 'Tras 8 s prepara una mina en la posicion de un enemigo detectado dentro de alcance. Arma en 1 s y caduca en 5 s; un enemigo a 26 px activa red de 35% por 2 s a hasta cinco detectados en 65 px y dentro de cobertura. Sin dano. Mover, stun o retirar cancela.', 'tecnologia anti corredores', ['Tecnologia', 'Callejero', 'Rivales'], 'support', [3, 5, 4, 5], {
        attackEffects: [{ type: 'web', duration: 2.0, power: 0.18, chance: 0.45 }],
        statModifiers: { detectStealth: true, fireRatePct: 0.06 },
        visualStyle: 'web',
        projectileColor: '#40c9ff'
    }),
    adam_warlock: contract('Adam Warlock', 'Cosmico', 'Legendary', 610, 52, 205, 1.0, false, 'CAPULLO CUANTICO', 'Energia cosmica encadena objetivos y potencia el sosten de equipos largos.', 'soporte cosmico de alcance', ['Cosmico', 'Rivales'], 'support', [4, 4, 5, 3], {
        projectileProfile: { chainCount: 2, chainRange: 125, chainFactor: 0.48 },
        statModifiers: { rangePct: 0.08, damagePct: 0.04 },
        visualStyle: 'energy',
        projectileColor: '#facc15'
    }),
    deadpool: contract('Deadpool', 'Urbano', 'Legendary', 390, 34, 155, 2.05, false, 'MERCENARIO REGENERATIVO', 'Ciclo: 3 disparos de pistola, 2 cortes de katana con +50% de dano y alcance limitado a 90 px, luego 1.2 s de recarga sin atacar. Despliegue y movimiento reinician con recarga. Conserva sangrado 38% por 2.4 s al 20% de poder/s, +6 puntos criticos y +6% cadencia; no cura la base.', 'DPS urbano con sangrado', ['Callejero', 'Espias', 'Rivales'], 'vanguard', [5, 3, 3, 3], {
        attackEffects: [{ type: 'bleed', duration: 2.4, power: 0.2, damageBasis: 'attackDamage', chance: 0.38 }],
        statModifiers: { critChance: 6, fireRatePct: 0.06 },
        visualStyle: 'ballistic',
        projectileColor: '#ef4444'
    }),
    invisible_woman: contract('Invisible Woman', 'Tecnologico', 'Legendary', 660, 1, 245, 1, true, 'CAMPO DE COBERTURA', 'No ataca. Campo de cobertura: +8% de alcance base y deteccion continua a aliados dentro de 245 px. La deteccion pertenece al aliado, no revela globalmente enemigos. Potencia y radio mejoran con su nivel; aturdirla suspende ambos efectos.', 'aura amplia de alcance y deteccion', ['Tecnologia', 'Rivales'], 'support', [1, 4, 5, 5], {
        supportAura: { type: 'range', power: 0.08, range: 245, label: 'Campo invisible', detectStealth: true },
        visualStyle: 'energy',
        projectileColor: '#a7f3ff'
    }),
    jeff_the_land_shark: contract('Jeff The Land Shark', 'Mutante', 'Rare', 260, 26, 135, 1.75, true, 'MAREA AMABLE', 'Cada 6s un ataque terrestre deja una corriente de 90x44px durante 2.5s: ralentiza 45% a terrestres dentro. Salir, moverlo o aturdirlo corta el efecto. No desplaza, elimina enemigos ni cura la base.', 'soporte anfibio de control', ['Rivales'], 'support', [2, 5, 5, 5], {
        attackEffects: [],
        statModifiers: { allowWater: true, detectStealth: true },
        visualStyle: 'water',
        projectileColor: '#67e8f9'
    }),
    jubilee: contract('Jubilee', 'Mutante', 'Rare', 300, 30, 170, 1.75, false, 'FUEGOS PLASMOIDES', 'Explosiones luminosas encadenan dano leve y ralentizan grupos cerca de curvas.', 'control mutante de area', ['Mutantes', 'X-Men', 'Rivales'], 'support', [3, 5, 4, 3], {
        projectileProfile: { splashRadius: 42, splashFactor: 0.28 },
        attackEffects: [{ type: 'slow', duration: 1.3, power: 0.3, chance: 0.34 }],
        visualStyle: 'energy',
        projectileColor: '#f472b6'
    }),
    loki: contract('Loki', 'Mistico', 'Legendary', 560, 42, 190, 1.25, true, 'ILUSION REAL', 'Ilusiones marcan amenazas y ralentizan la vanguardia enemiga sin romper la ruta.', 'control mistico y deteccion', ['Mistico', 'Oscuros', 'Cosmico', 'Rivales'], 'support', [4, 5, 5, 5], {
        attackEffects: [{ type: 'slow', duration: 2.4, power: 0.42, chance: 0.45 }, { type: 'mark', duration: 2.2, power: 0.13, chance: 0.34 }],
        statModifiers: { detectStealth: true, cooldown: 0.04 },
        visualStyle: 'mystic',
        projectileColor: '#7ee081'
    }),
    luna_snow: contract('Luna Snow', 'Cosmico', 'Rare', 340, 31, 180, 1.55, true, 'HIELO POP', 'Como maximo cada 1.5s, un ataque emite un pulso a hasta 4 detectados a 50px: alterna slow 25% y 50% por 0.9s. Conserva splash y deteccion; no acumula escarcha ni congela.', 'slow a distancia y deteccion', ['Cosmico', 'Rivales'], 'support', [3, 5, 4, 5], {
        projectileProfile: { splashRadius: 38, splashFactor: 0.25 },
        attackEffects: [],
        statModifiers: { detectStealth: true },
        visualStyle: 'ice',
        projectileColor: '#93c5fd'
    }),
    mantis: contract('Mantis', 'Cosmico', 'Rare', 305, 24, 175, 1.65, true, 'EMPATIA PSIQUICA', 'Cada 6s prepara sueno de 2s al impacto sobre un enemigo. El dano directo lo despierta; Mantis evita disparar a dormidos. La victima conserva 4s de recuperacion tras la duracion del sueno. Conserva marca tactica y no cura.', 'soporte guardian de control', ['Guardianes', 'Rivales'], 'support', [2, 5, 5, 5], {
        attackEffects: [{ type: 'mark', duration: 2.0, power: 0.1, chance: 0.3 }],
        statModifiers: { detectStealth: true, rangePct: 0.05 },
        visualStyle: 'mystic',
        projectileColor: '#86efac'
    }),
    mister_fantastic: contract('Mister Fantastic', 'Tecnologico', 'Legendary', 620, 1, 145, 1, false, 'GEOMETRIA ELASTICA', 'No ataca. Geometria elastica: +15% de alcance base a aliados dentro de 145 px, sin deteccion. Su bonus extiende solo el borde exterior: no agranda el punto ciego del anillo ni el ancho de los carriles de cruz/X. Potencia y radio mejoran con su nivel; aturdirlo suspende el aura.', 'aura corta de alcance concentrado', ['Tecnologia', 'Rivales'], 'support', [1, 4, 5, 3], {
        supportAura: { type: 'range', power: 0.15, range: 145, label: 'Calculo elastico' },
        visualStyle: 'impact',
        projectileColor: '#5be7ff'
    }),
    rocket_raccoon: contract('Rocket Raccoon', 'Tecnologico', 'Rare', 335, 36, 185, 1.65, true, 'ARSENAL GUARDIAN', 'Despliega una torreta durante 5 s tras 6 s de recarga. Mientras esta activa reserva 20% del dano de sus disparos para fuego directo cada 0.5 s, sin efectos de objetos ni recargas en cadena. Conserva splash y 14% de penetracion. Mover, stun o retirar cancela y pierde la reserva.', 'artilleria tecnologica versatil', ['Guardianes', 'Tecnologia', 'Rivales'], 'artillery', [4, 4, 3, 5], {
        projectileProfile: { splashRadius: 44, splashFactor: 0.3, armorPenetration: 0.14 },
        statModifiers: { detectStealth: true, fireRatePct: 0.05 },
        visualStyle: 'explosive',
        projectileColor: '#f97316'
    })
};

const rivalsTagIds = [
    ...RIVALS_HERO_IDS,
    'black_panther', 'black_widow', 'blade', 'cyclops', 'daredevil', 'hawkeye', 'iron_fist',
    'iron_man', 'magik', 'moon_knight', 'scarlet_witch', 'spiderman', 'star_lord', 'storm',
    'punisher', 'winter_soldier', 'wolverine', 'hulk', 'capitan_america', 'doctor_strange',
    'groot', 'namor', 'thor', 'cloak', 'dagger', 'jean_grey'
];

for (const [id, hero] of Object.entries(rivalsHeroes)) heroes[id] = { id, ...hero, ...visual(id) };

for (const hero of Object.values(heroes)) {
    hero.tags = (hero.tags || []).map(normalizeTag);
}

for (const id of rivalsTagIds) {
    if (!heroes[id]) continue;
    heroes[id].tags = unique([...(heroes[id].tags || []), 'Rivales']);
}

fs.writeFileSync(heroesFile, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log(`Roster Rivales configurado: ${RIVALS_HERO_IDS.length} heroes nuevos y agrupacion Rivales`);

function contract(name, category, rarity, cost, damage, range, fireRate, canSeeStealth, ability, abilityDesc, niche, tags, formationRole, metrics, special) {
    return {
        name,
        category: normalizeCategory(category),
        rarity,
        cost,
        damage,
        range,
        fireRate,
        canSeeStealth,
        ability,
        abilityDesc,
        niche,
        allowedTerrains: special?.statModifiers?.allowWater ? [0, 1, 3] : [1, 3],
        tags: tags.map(normalizeTag),
        formationRole,
        teamMetrics: { damage: metrics[0], control: metrics[1], support: metrics[2], detection: metrics[3] },
        special
    };
}

function visual(id) {
    const base = `assets/images/heroes/${id}`;
    return {
        sprite: `${base}/portrait.png`,
        visual: {
            portrait: `${base}/portrait.png`,
            size: 96,
            anchor: { x: 0.5, y: 0.5 },
            defaultDirection: 'south',
            idle: Object.fromEntries(directions.map((direction) => [direction, `${base}/sprites/${direction}.png`])),
            attack: { fps: 14, loop: false, frames: Array.from({ length: 9 }, (_, index) => `${base}/shoot/${index}.png`) }
        }
    };
}

function normalizeCategory(category) {
    const aliases = {
        Tecnologico: 'Tecnológico',
        Mistico: 'Místico',
        Cosmico: 'Cósmico'
    };
    return aliases[category] || category;
}

function normalizeTag(tag) {
    const aliases = {
        Tecnologia: 'Tecnología',
        Mistico: 'Místico',
        Cosmico: 'Cósmico',
        Espias: 'Espías',
        Atlanticos: 'Atlánticos'
    };
    return aliases[tag] || tag;
}

function unique(values) {
    return [...new Set(values)];
}
