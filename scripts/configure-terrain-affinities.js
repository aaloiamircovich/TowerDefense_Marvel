import fs from 'node:fs';
import path from 'node:path';

const heroesFile = path.join(process.cwd(), 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(heroesFile, 'utf8'));

const TERRAIN = {
    water: 0,
    grass: 1,
    mountain: 3
};

const profiles = {
    grass: [TERRAIN.grass],
    high: [TERRAIN.mountain],
    ground: [TERRAIN.grass, TERRAIN.mountain],
    flyer: [TERRAIN.water, TERRAIN.grass, TERRAIN.mountain],
    aquatic: [TERRAIN.water],
    amphibious: [TERRAIN.water, TERRAIN.grass]
};

const terrainProfiles = {
    iron_man: 'flyer',
    thor: 'flyer',
    captain_marvel: 'flyer',
    silver_surfer: 'flyer',
    falcon: 'flyer',
    vision: 'flyer',
    storm: 'flyer',
    nova: 'flyer',
    wasp: 'flyer',
    doctor_strange: 'flyer',
    scarlet_witch: 'flyer',
    jean_grey: 'flyer',
    cloak: 'flyer',
    dagger: 'flyer',
    black_bolt: 'flyer',
    crystal: 'flyer',

    namor: 'aquatic',
    namora: 'aquatic',
    triton: 'aquatic',

    hawkeye: 'high',
    punisher: 'high',
    cyclops: 'high',
    war_machine: 'high',
    nick_fury: 'high',

    spiderman: 'ground',
    hulk: 'ground',
    black_panther: 'ground',
    wolverine: 'ground',
    gamora: 'ground',
    winter_soldier: 'ground',
    shang_chi: 'ground',
    she_hulk: 'ground',
    blade: 'ground',
    ghost_rider: 'ground',
    luke_cage: 'ground',
    domino: 'ground',
    quake: 'ground',
    medusa: 'ground',
    iron_fist: 'ground',
    elektra: 'ground',
    jessica_jones: 'ground',
    magik: 'ground',
    iceman: 'ground',
    okoye: 'ground',

    capitan_america: 'grass',
    black_widow: 'grass',
    ant_man: 'grass',
    star_lord: 'grass',
    groot: 'grass',
    daredevil: 'grass',
    moon_knight: 'grass',
    shuri: 'grass'
};

for (const hero of Object.values(heroes)) {
    const profile = terrainProfiles[hero.id] || 'ground';
    hero.allowedTerrains = [...profiles[profile]];
    hero.terrainRole = profile;
}

fs.writeFileSync(heroesFile, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log(`Afinidades de terreno configuradas: ${Object.keys(heroes).length} heroes`);
