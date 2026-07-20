import fs from 'node:fs';

const heroesPath = new URL('../data/heroes.json', import.meta.url);

const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret'];
const RARITY_BY_HERO = {
    Common: [
        'spiderman', 'black_widow', 'hawkeye', 'falcon', 'luke_cage',
        'jessica_jones', 'squirrel_girl', 'ant_man', 'groot', 'star_lord'
    ],
    Rare: [
        'capitan_america', 'iron_man', 'black_panther', 'gamora', 'winter_soldier',
        'cyclops', 'blade', 'shang_chi', 'she_hulk', 'moon_knight', 'punisher',
        'iron_fist', 'okoye', 'namora', 'medusa', 'crystal', 'daredevil', 'nick_fury'
    ],
    Epic: [
        'hulk', 'war_machine', 'wasp', 'quake', 'cloak', 'dagger', 'iceman',
        'triton', 'black_cat', 'elsa_bloodstone', 'gambit', 'human_torch',
        'the_hood', 'peni_parker', 'jeff_the_land_shark', 'jubilee', 'luna_snow',
        'mantis', 'rocket_raccoon', 'ms_marvel', 'elektra', 'storm'
    ],
    Legendary: [
        'thor', 'doctor_strange', 'captain_marvel', 'vision', 'wolverine',
        'ghost_rider', 'domino', 'nova', 'namor', 'magik', 'shuri', 'black_bolt',
        'venom', 'angela', 'deadpool', 'mister_fantastic', 'invisible_woman'
    ],
    Mythic: [
        'silver_surfer', 'psylocke', 'devil_dinosaur', 'emma_frost',
        'magneto', 'adam_warlock', 'jean_grey'
    ],
    Secret: ['scarlet_witch', 'loki', 'hela', 'nightcrawler']
};

const targetRarity = Object.fromEntries(
    Object.entries(RARITY_BY_HERO).flatMap(([rarity, ids]) => ids.map((id) => [id, rarity]))
);

const write = process.argv.includes('--write');
const heroes = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
const missing = Object.keys(heroes).filter((id) => !targetRarity[id]);
const stale = Object.keys(targetRarity).filter((id) => !heroes[id]);

if (missing.length || stale.length) {
    if (missing.length) console.error(`ERROR: heroes sin rareza auditada: ${missing.join(', ')}`);
    if (stale.length) console.error(`ERROR: rarezas auditadas sin heroe: ${stale.join(', ')}`);
    process.exit(1);
}

const rows = Object.values(heroes)
    .map((hero) => ({
        id: hero.id,
        name: hero.name,
        current: hero.rarity || 'Common',
        target: targetRarity[hero.id],
        score: calculateAuditScore(hero)
    }))
    .sort((a, b) => b.score - a.score || RARITY_ORDER.indexOf(b.target) - RARITY_ORDER.indexOf(a.target));

console.log('Auditoria de rarezas Marvel TD');
for (const rarity of RARITY_ORDER) {
    const group = rows.filter((row) => row.target === rarity);
    const changed = group.filter((row) => row.current !== row.target).length;
    const scoreRange = `${Math.min(...group.map((row) => row.score)).toFixed(1)}-${Math.max(...group.map((row) => row.score)).toFixed(1)}`;
    console.log(`${rarity}: ${group.length} heroes | cambios ${changed} | score ${scoreRange}`);
    console.log(`  ${group.map((row) => `${row.name} ${row.current !== row.target ? `(${row.current}->${row.target})` : ''}`.trim()).join(', ')}`);
}

if (write) {
    for (const [id, rarity] of Object.entries(targetRarity)) heroes[id].rarity = rarity;
    fs.writeFileSync(heroesPath, `${JSON.stringify(heroes, null, 2)}\n`);
    console.log('data/heroes.json actualizado con rarezas auditadas.');
}

function calculateAuditScore(hero) {
    const dps = Number(hero.damage || 0) * Number(hero.fireRate || 1) * (1 + Number(hero.critChance || 5) / 100);
    const metrics = hero.teamMetrics || {};
    const metricScore = ['damage', 'control', 'support', 'detection']
        .reduce((sum, key) => sum + Number(metrics[key] || 1), 0) * 4;
    const terrain = new Set(hero.allowedTerrains || []);
    const terrainScore = terrain.size * 5 + (terrain.has(0) ? 6 : 0) + (terrain.has(3) ? 4 : 0);
    const detectionScore = hero.canSeeStealth ? 14 : 0;
    const roleScore = { support: 10, artillery: 8, vanguard: 6 }[hero.formationRole] || 5;
    const tagScore = (hero.tags || []).length * 3;
    return dps * (1 + Number(hero.range || 100) / 500)
        + metricScore
        + terrainScore
        + detectionScore
        + roleScore
        + tagScore
        + abilityScore(hero)
        + specialScore(hero.special || {});
}

function abilityScore(hero) {
    const text = [hero.ability, hero.abilityDesc, hero.niche].filter(Boolean).join(' ').toLowerCase();
    const signals = [
        'atrav', 'ignora', 'armadura', 'sigilo', 'ralent', 'aturd', 'marca', 'rebote',
        'encadena', 'splash', 'area', 'jefe', 'elite', 'cura', 'crit', 'control',
        'agua', 'vuela', 'invoca', 'cosmic', 'cosmico', 'mald'
    ];
    return signals.reduce((sum, signal) => sum + (text.includes(signal) ? 4 : 0), 0)
        + Math.min(16, text.length / 45);
}

function specialScore(special) {
    let score = 0;
    for (const [key, value] of Object.entries(special.statModifiers || {})) {
        if (typeof value === 'boolean') score += value ? 10 : 0;
        else score += Math.abs(Number(value) || 0) * (key.includes('Pct') ? 65 : 2.2);
    }
    const profile = special.projectileProfile || {};
    if (profile.armorPenetration) score += profile.armorPenetration * 35;
    if (profile.splashRadius) score += Math.min(20, profile.splashRadius / 3.8) + Number(profile.splashFactor || 0) * 12;
    if (profile.chainCount) score += profile.chainCount * 12 + Number(profile.chainRange || 0) / 18 + Number(profile.chainFactor || 0) * 8;
    if (profile.pierce) score += profile.pierce * 8;
    for (const effect of special.attackEffects || []) {
        const chance = effect.chance ?? 1;
        const power = effect.power ?? 1;
        const duration = effect.duration ?? 0;
        const base = { slow: 14, stun: 18, mark: 16, armorBreak: 18, bleed: 14, burn: 14 }[effect.type] || 10;
        score += base * chance * (0.75 + Math.min(1.4, power)) + duration * 1.6;
    }
    return score;
}
