import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const heroesFile = path.join(root, 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(heroesFile, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const allegianceHeroes = {
    shuri: contract('Shuri', 'Tecnologico', 'Legendary', 420, 38, 190, 1.45, true, 'GUANTELETES VIBRANIUM', 'Dispara rafagas de vibranium que marcan objetivos y amplifican el dano tactico.', 'soporte Wakanda con marca y tecnologia', ['Wakanda', 'Tecnologia'], 'support', [4, 3, 5, 5], {
        attackEffects: [{ type: 'mark', duration: 2.6, power: 0.15, chance: 0.42 }],
        statModifiers: { rangePct: 0.06, detectStealth: true },
        visualStyle: 'energy',
        projectileColor: '#9c7cff'
    }),
    okoye: contract('Okoye', 'Urbano', 'Rare', 260, 40, 110, 1.55, false, 'LANZA DORA MILAJE', 'Controla la primera linea con critico alto y ruptura breve de armadura.', 'vanguardia Wakanda anti elite', ['Wakanda', 'Marciales'], 'vanguard', [4, 4, 4, 2], {
        attackEffects: [{ type: 'armorBreak', duration: 2.4, power: 0.14, chance: 0.32 }],
        statModifiers: { critChance: 5 },
        visualStyle: 'blade',
        projectileColor: '#f6c453'
    }),
    black_bolt: contract('Black Bolt', 'Cosmico', 'Legendary', 560, 66, 170, 0.9, false, 'SUSURRO DE ATTILAN', 'Ondas sonicas atraviesan blindaje y golpean grupos compactos.', 'artilleria inhumana de area', ['Inhumanos', 'Cosmico'], 'artillery', [5, 5, 2, 2], {
        projectileProfile: { splashRadius: 58, splashFactor: 0.36, armorPenetration: 0.2 },
        attackEffects: [{ type: 'slow', duration: 1.1, power: 0.2, chance: 0.28 }],
        visualStyle: 'sonic',
        projectileColor: '#38bdf8'
    }),
    crystal: contract('Crystal', 'Cosmico', 'Rare', 330, 32, 175, 1.35, false, 'ELEMENTOS DE ATTILAN', 'Alterna control elemental con area moderada para sostener curvas.', 'control inhumano de area', ['Inhumanos', 'Cosmico'], 'support', [3, 5, 4, 2], {
        projectileProfile: { splashRadius: 46, splashFactor: 0.28 },
        attackEffects: [{ type: 'slow', duration: 1.7, power: 0.36, chance: 0.45 }],
        statModifiers: { rangePct: 0.04 },
        visualStyle: 'elemental',
        projectileColor: '#f97316'
    }),
    namora: contract('Namora', 'Atlantico', 'Rare', 300, 44, 125, 1.35, false, 'HOJA ATLANTE', 'Puede operar en agua y castiga enemigos blindados cerca de la salida.', 'duelista anfibia anti blindaje', ['Atlanticos', 'Marciales'], 'vanguard', [4, 3, 3, 2], {
        projectileProfile: { armorPenetration: 0.22 },
        attackEffects: [{ type: 'armorBreak', duration: 2.8, power: 0.16, chance: 0.3 }],
        statModifiers: { allowWater: true, damagePct: 0.04 },
        visualStyle: 'water',
        projectileColor: '#22d3ee'
    }),
    triton: contract('Triton', 'Atlantico', 'Rare', 280, 30, 160, 1.45, true, 'RASTREADOR ABISAL', 'Detecta sigilo desde agua y ralentiza corredores con presion submarina.', 'soporte anfibio de deteccion', ['Atlanticos', 'Inhumanos', 'Cosmico'], 'support', [3, 5, 4, 5], {
        attackEffects: [{ type: 'slow', duration: 2.0, power: 0.4, chance: 0.45 }],
        statModifiers: { allowWater: true, detectStealth: true, rangePct: 0.06 },
        visualStyle: 'water',
        projectileColor: '#67e8f9'
    })
};

const allegianceTags = {
    Avengers: ['iron_man', 'capitan_america', 'thor', 'hulk', 'black_widow', 'hawkeye', 'black_panther', 'captain_marvel', 'ant_man', 'scarlet_witch', 'vision', 'falcon', 'war_machine', 'wasp', 'namor'],
    Mutantes: ['wolverine', 'jean_grey', 'cyclops', 'storm', 'domino', 'scarlet_witch', 'magik', 'iceman', 'namor'],
    Defenders: ['daredevil', 'luke_cage', 'iron_fist', 'elektra', 'jessica_jones', 'cloak', 'dagger'],
    Guardianes: ['star_lord', 'groot', 'gamora', 'nova'],
    Mistico: ['doctor_strange', 'scarlet_witch', 'moon_knight', 'blade', 'ghost_rider', 'medusa', 'cloak', 'dagger', 'magik'],
    Callejero: ['spiderman', 'black_widow', 'hawkeye', 'daredevil', 'winter_soldier', 'shang_chi', 'moon_knight', 'she_hulk', 'blade', 'luke_cage', 'nick_fury', 'quake', 'iron_fist', 'punisher', 'elektra', 'jessica_jones'],
    Wakanda: ['black_panther', 'shuri', 'okoye'],
    Tecnologia: ['iron_man', 'spiderman', 'ant_man', 'vision', 'falcon', 'winter_soldier', 'war_machine', 'nick_fury', 'wasp', 'nova', 'quake', 'shuri'],
    Cosmico: ['thor', 'captain_marvel', 'star_lord', 'groot', 'gamora', 'silver_surfer', 'nova', 'black_bolt', 'crystal', 'triton'],
    Espias: ['black_widow', 'hawkeye', 'nick_fury', 'winter_soldier', 'punisher', 'elektra'],
    Oscuros: ['doctor_strange', 'scarlet_witch', 'moon_knight', 'blade', 'ghost_rider', 'cloak', 'dagger', 'magik'],
    Marciales: ['black_panther', 'gamora', 'daredevil', 'shang_chi', 'iron_fist', 'elektra', 'okoye', 'namora'],
    Inhumanos: ['medusa', 'black_bolt', 'crystal', 'triton'],
    Atlanticos: ['namor', 'namora', 'triton']
};

for (const [id, hero] of Object.entries(allegianceHeroes)) heroes[id] = { id, ...hero, ...visual(id) };

for (const hero of Object.values(heroes)) {
    hero.tags = (hero.tags || []).map(normalizeTag);
}

for (const [tag, ids] of Object.entries(allegianceTags)) {
    const normalizedTag = normalizeTag(tag);
    for (const id of ids) {
        if (!heroes[id]) continue;
        heroes[id].tags = unique([...(heroes[id].tags || []), normalizedTag]);
    }
}

fs.writeFileSync(heroesFile, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log(`Agrupaciones configuradas: ${Object.keys(allegianceTags).length} grupos y ${Object.keys(allegianceHeroes).length} heroes nuevos`);

function contract(name, category, rarity, cost, damage, range, fireRate, canSeeStealth, ability, abilityDesc, niche, tags, formationRole, metrics, special) {
    return {
        name, category, rarity, cost, damage, range, fireRate, canSeeStealth, ability, abilityDesc, niche,
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
