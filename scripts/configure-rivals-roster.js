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
    black_cat: contract('Black Cat', 'Urbano', 'Rare', 245, 31, 135, 2.05, true, 'GOLPE DE SUERTE', 'Roba tempo de los corredores: criticos altos, marca breve y deteccion callejera.', 'critico, sigilo y control ligero', ['Callejero', 'Espias', 'Rivales'], 'support', [4, 3, 3, 5], {
        statModifiers: { critChance: 8, detectStealth: true },
        attackEffects: [{ type: 'mark', duration: 1.8, power: 0.12, chance: 0.36 }],
        visualStyle: 'blade',
        projectileColor: '#f8fafc'
    }),
    elsa_bloodstone: contract('Elsa Bloodstone', 'Mistico', 'Rare', 330, 44, 170, 1.3, true, 'BLOODSTONE', 'Dispara municion anti monstruos con ruptura de armadura y dano sostenido contra elites.', 'cazadora anti elite con deteccion', ['Oscuros', 'Callejero', 'Rivales'], 'artillery', [5, 3, 2, 5], {
        projectileProfile: { armorPenetration: 0.22 },
        attackEffects: [{ type: 'armorBreak', duration: 3.0, power: 0.16, chance: 0.34 }],
        statModifiers: { detectStealth: true },
        visualStyle: 'ballistic',
        projectileColor: '#ff3b5f'
    }),
    gambit: contract('Gambit', 'Mutante', 'Rare', 335, 37, 165, 1.55, false, 'CARGA CINETICA', 'Cartas cargadas encadenan entre enemigos cercanos y castigan grupos compactos.', 'rebote mutante para oleadas medias', ['Mutantes', 'X-Men', 'Rivales'], 'artillery', [4, 4, 2, 3], {
        projectileProfile: { chainCount: 2, chainRange: 95, chainFactor: 0.45 },
        statModifiers: { critChance: 4 },
        visualStyle: 'energy',
        projectileColor: '#d86cff'
    }),
    hela: contract('Hela', 'Mistico', 'Legendary', 620, 70, 180, 0.85, false, 'ESPINAS DE HEL', 'Lanzas necroticas perforan armadura y aplican sangrado persistente a jefes y tanques.', 'artilleria mistica anti jefe', ['Mistico', 'Oscuros', 'Rivales'], 'artillery', [5, 3, 2, 2], {
        projectileProfile: { armorPenetration: 0.32, chainCount: 1, chainRange: 90, chainFactor: 0.5 },
        attackEffects: [{ type: 'bleed', duration: 3.2, power: 0.24, chance: 0.42 }],
        visualStyle: 'mystic',
        projectileColor: '#69e58c'
    }),
    human_torch: contract('Human Torch', 'Cosmico', 'Rare', 360, 36, 175, 1.65, false, 'NOVA FLAME', 'Flamas de area queman grupos y sostienen dano en curvas largas.', 'area aerea y quemadura', ['Cosmico', 'Rivales'], 'artillery', [4, 4, 2, 2], {
        projectileProfile: { splashRadius: 48, splashFactor: 0.32 },
        attackEffects: [{ type: 'burn', duration: 2.5, power: 12, chance: 0.34 }],
        statModifiers: { rangePct: 0.04 },
        visualStyle: 'fire',
        projectileColor: '#ff7b3d'
    }),
    the_hood: contract('The Hood', 'Mistico', 'Rare', 310, 40, 155, 1.35, true, 'PACTO DEMONICO', 'Balas malditas revelan infiltrados, marcan soportes y aumentan el dano recibido.', 'marca oscura y deteccion', ['Oscuros', 'Callejero', 'Rivales'], 'support', [4, 3, 3, 5], {
        attackEffects: [{ type: 'mark', duration: 2.4, power: 0.16, chance: 0.4 }],
        statModifiers: { detectStealth: true },
        visualStyle: 'mystic',
        projectileColor: '#b865ff'
    }),
    psylocke: contract('Psylocke', 'Mutante', 'Legendary', 455, 48, 135, 1.55, true, 'KATANA PSIQUICA', 'Cortes psiquicos rompen defensa, revelan sigilo y rematan amenazas avanzadas.', 'duelista mutante anti sigilo', ['Mutantes', 'X-Men', 'Marciales', 'Rivales'], 'vanguard', [5, 4, 2, 5], {
        projectileProfile: { armorPenetration: 0.22 },
        attackEffects: [{ type: 'armorBreak', duration: 2.6, power: 0.18, chance: 0.38 }],
        statModifiers: { detectStealth: true, critChance: 5 },
        visualStyle: 'blade',
        projectileColor: '#ff8cff'
    }),
    squirrel_girl: contract('Squirrel Girl', 'Urbano', 'Rare', 255, 24, 150, 2.15, false, 'EMBOSCADA IMPROBABLE', 'Invoca una rafaga de golpes rapidos que ralentiza corredores y limpia rezagados.', 'cadencia alta y control economico', ['Callejero', 'Rivales'], 'support', [3, 4, 4, 2], {
        attackEffects: [{ type: 'slow', duration: 1.4, power: 0.28, chance: 0.36 }],
        statModifiers: { fireRatePct: 0.08 },
        visualStyle: 'impact',
        projectileColor: '#f59e0b'
    }),
    venom: contract('Venom', 'Mutante', 'Legendary', 500, 58, 120, 1.18, false, 'SIMBIONTE DEPREDADOR', 'Golpes de masa simbionte atraviesan armadura y ralentizan objetivos marcados.', 'vanguardia anti blindaje', ['Oscuros', 'Callejero', 'Rivales'], 'vanguard', [5, 4, 2, 2], {
        projectileProfile: { armorPenetration: 0.2, splashRadius: 36, splashFactor: 0.25 },
        attackEffects: [{ type: 'slow', duration: 1.5, power: 0.34, chance: 0.34 }],
        statModifiers: { damagePct: 0.06 },
        visualStyle: 'web',
        projectileColor: '#111827'
    }),
    angela: contract('Angela', 'Cosmico', 'Legendary', 540, 62, 150, 1.05, false, 'HOJAS DE HEVEN', 'Lanzas celestiales perforan lineas y castigan jefes con criticos consistentes.', 'duelista cosmica anti jefe', ['Cosmico', 'Marciales', 'Rivales'], 'vanguard', [5, 3, 2, 2], {
        projectileProfile: { armorPenetration: 0.26, chainCount: 1, chainRange: 80, chainFactor: 0.48 },
        statModifiers: { critChance: 6 },
        visualStyle: 'blade',
        projectileColor: '#ffd166'
    }),
    devil_dinosaur: contract('Devil Dinosaur', 'Mutante', 'Legendary', 575, 68, 105, 0.92, false, 'ESTAMPIDA ROJA', 'Impactos enormes aturden brevemente y salpican grupos sin moverlos fuera del camino.', 'tanque de impacto y area', ['Rivales'], 'vanguard', [5, 4, 3, 1], {
        projectileProfile: { splashRadius: 58, splashFactor: 0.35 },
        attackEffects: [{ type: 'stun', duration: 0.24, power: 1, chance: 0.18 }],
        statModifiers: { damagePct: 0.05 },
        visualStyle: 'impact',
        projectileColor: '#ef4444'
    }),
    emma_frost: contract('Emma Frost', 'Mutante', 'Legendary', 470, 34, 180, 1.45, true, 'DIAMANTE PSIQUICO', 'Control mental que marca elites, revela sigilo y aumenta el critico del frente.', 'soporte mutante de control', ['Mutantes', 'X-Men', 'Rivales'], 'support', [3, 5, 5, 5], {
        attackEffects: [{ type: 'mark', duration: 2.8, power: 0.17, chance: 0.42 }, { type: 'slow', duration: 1.6, power: 0.28, chance: 0.28 }],
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
    peni_parker: contract('Peni Parker', 'Tecnologico', 'Rare', 345, 29, 165, 1.9, true, 'SP//DR LINK', 'Dron aracnido con red electrica: detecta sigilo y frena oleadas rapidas.', 'tecnologia anti corredores', ['Tecnologia', 'Callejero', 'Rivales'], 'support', [3, 5, 4, 5], {
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
    deadpool: contract('Deadpool', 'Urbano', 'Legendary', 390, 34, 155, 2.05, false, 'MERCENARIO REGENERATIVO', 'Doble cadencia, sangrado y criticos caoticos para sostener oleadas densas.', 'DPS urbano con sangrado', ['Callejero', 'Espias', 'Rivales'], 'vanguard', [5, 3, 3, 3], {
        attackEffects: [{ type: 'bleed', duration: 2.4, power: 0.2, chance: 0.38 }],
        statModifiers: { critChance: 6, fireRatePct: 0.06 },
        visualStyle: 'ballistic',
        projectileColor: '#ef4444'
    }),
    invisible_woman: contract('Invisible Woman', 'Tecnologico', 'Legendary', 430, 28, 185, 1.55, true, 'CAMPO INVISIBLE', 'Campos de fuerza revelan infiltrados, marcan elites y amplian cobertura segura.', 'soporte defensivo de rango', ['Tecnologia', 'Rivales'], 'support', [3, 4, 5, 5], {
        attackEffects: [{ type: 'mark', duration: 2.6, power: 0.14, chance: 0.38 }],
        statModifiers: { detectStealth: true, rangePct: 0.1 },
        visualStyle: 'energy',
        projectileColor: '#a7f3ff'
    }),
    jeff_the_land_shark: contract('Jeff The Land Shark', 'Mutante', 'Rare', 260, 26, 135, 1.75, true, 'MAREA AMABLE', 'Control anfibio que opera en agua, detecta sigilo y ralentiza fugas.', 'soporte anfibio de control', ['Rivales'], 'support', [2, 5, 5, 5], {
        attackEffects: [{ type: 'slow', duration: 2.0, power: 0.42, chance: 0.48 }],
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
    luna_snow: contract('Luna Snow', 'Cosmico', 'Rare', 340, 31, 180, 1.55, true, 'HIELO POP', 'Proyectiles de hielo ralentizan corredores y estabilizan el tramo final.', 'slow a distancia y deteccion', ['Cosmico', 'Rivales'], 'support', [3, 5, 4, 5], {
        projectileProfile: { splashRadius: 38, splashFactor: 0.25 },
        attackEffects: [{ type: 'slow', duration: 2.2, power: 0.46, chance: 0.52 }],
        statModifiers: { detectStealth: true },
        visualStyle: 'ice',
        projectileColor: '#93c5fd'
    }),
    mantis: contract('Mantis', 'Cosmico', 'Rare', 305, 24, 175, 1.65, true, 'EMPATIA PSIQUICA', 'Calma grupos peligrosos con ralentizacion y marca tactica desde gran distancia.', 'soporte guardian de control', ['Guardianes', 'Rivales'], 'support', [2, 5, 5, 5], {
        attackEffects: [{ type: 'slow', duration: 2.6, power: 0.44, chance: 0.5 }, { type: 'mark', duration: 2.0, power: 0.1, chance: 0.3 }],
        statModifiers: { detectStealth: true, rangePct: 0.05 },
        visualStyle: 'mystic',
        projectileColor: '#86efac'
    }),
    mister_fantastic: contract('Mister Fantastic', 'Tecnologico', 'Legendary', 415, 35, 175, 1.45, false, 'ELASTICIDAD TACTICA', 'Golpes elasticos alcanzan curvas, rebotan una vez y rompen formaciones densas.', 'alcance flexible y rebote', ['Tecnologia', 'Rivales'], 'support', [4, 4, 5, 3], {
        projectileProfile: { chainCount: 1, chainRange: 100, chainFactor: 0.55 },
        statModifiers: { rangePct: 0.12 },
        visualStyle: 'impact',
        projectileColor: '#5be7ff'
    }),
    rocket_raccoon: contract('Rocket Raccoon', 'Tecnologico', 'Rare', 335, 36, 185, 1.65, true, 'ARSENAL GUARDIAN', 'Torretas portatiles con splash pequeno, deteccion y cadencia estable.', 'artilleria tecnologica versatil', ['Guardianes', 'Tecnologia', 'Rivales'], 'artillery', [4, 4, 3, 5], {
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
