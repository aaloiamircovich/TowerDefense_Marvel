import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const heroesFile = path.join(root, 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(heroesFile, 'utf8'));

export const HERO_SYNERGY_TAGS = {
    iron_man: ['Avengers', 'Tecnología'],
    spiderman: ['Callejero', 'Arácnidos'],
    capitan_america: ['Avengers', 'Operaciones'],
    thor: ['Avengers', 'Asgardianos'],
    hulk: ['Avengers', 'Mutantes'],
    black_widow: ['Avengers', 'Espías'],
    hawkeye: ['Avengers', 'Espías'],
    black_panther: ['Wakanda', 'Marciales'],
    doctor_strange: ['Místico', 'Nexo Caótico'],
    captain_marvel: ['Avengers', 'Cósmico'],
    wolverine: ['X-Men', 'Mutantes'],
    daredevil: ['Defenders', 'Callejero'],
    ant_man: ['Avengers', 'Tecnología'],
    star_lord: ['Guardianes', 'Cósmico'],
    groot: ['Guardianes', 'Cósmico'],
    gamora: ['Guardianes', 'Marciales'],
    scarlet_witch: ['Místico', 'Nexo Caótico'],
    vision: ['Avengers', 'Tecnología'],
    falcon: ['Avengers', 'Tecnología'],
    winter_soldier: ['Espías', 'Operaciones'],
    shang_chi: ['Marciales', 'Callejero'],
    moon_knight: ['Callejero', 'Oscuros'],
    she_hulk: ['Avengers', 'Mutantes'],
    jean_grey: ['X-Men', 'Nexo Caótico'],
    cyclops: ['X-Men', 'Operaciones'],
    storm: ['X-Men', 'Mutantes'],
    silver_surfer: ['Cósmico', 'Nexo Caótico'],
    blade: ['Oscuros', 'Callejero'],
    ghost_rider: ['Oscuros', 'Místico'],
    luke_cage: ['Defenders', 'Callejero'],
    domino: ['X-Men', 'Espías'],
    war_machine: ['Avengers', 'Tecnología'],
    nick_fury: ['Espías', 'Operaciones'],
    wasp: ['Avengers', 'Tecnología'],
    nova: ['Guardianes', 'Cósmico'],
    quake: ['Espías', 'Tecnología'],
    medusa: ['Inhumanos', 'Místico'],
    namor: ['Atlánticos', 'Mutantes'],
    iron_fist: ['Defenders', 'Marciales'],
    punisher: ['Callejero', 'Operaciones'],
    elektra: ['Defenders', 'Marciales'],
    jessica_jones: ['Defenders', 'Callejero'],
    cloak: ['Defenders', 'Místico'],
    dagger: ['Defenders', 'Místico'],
    magik: ['X-Men', 'Místico'],
    iceman: ['X-Men', 'Mutantes'],
    shuri: ['Wakanda', 'Tecnología'],
    okoye: ['Wakanda', 'Marciales'],
    black_bolt: ['Inhumanos', 'Cósmico'],
    crystal: ['Inhumanos', 'Cósmico'],
    namora: ['Atlánticos', 'Marciales'],
    triton: ['Atlánticos', 'Inhumanos'],
    black_cat: ['Callejero', 'Arácnidos'],
    elsa_bloodstone: ['Oscuros', 'Operaciones'],
    gambit: ['X-Men', 'Mercenarios'],
    hela: ['Asgardianos', 'Rivales'],
    human_torch: ['Fantásticos', 'Cósmico'],
    the_hood: ['Oscuros', 'Rivales'],
    psylocke: ['X-Men', 'Marciales'],
    squirrel_girl: ['Callejero', 'Bestias'],
    venom: ['Arácnidos', 'Rivales'],
    angela: ['Asgardianos', 'Marciales'],
    devil_dinosaur: ['Mutantes', 'Bestias'],
    emma_frost: ['X-Men', 'Nexo Caótico'],
    magneto: ['Mutantes', 'Rivales'],
    peni_parker: ['Arácnidos', 'Tecnología'],
    adam_warlock: ['Cósmico', 'Nexo Caótico'],
    deadpool: ['Mercenarios', 'Rivales'],
    invisible_woman: ['Fantásticos', 'Tecnología'],
    jeff_the_land_shark: ['Atlánticos', 'Bestias'],
    jubilee: ['X-Men', 'Mutantes'],
    loki: ['Asgardianos', 'Rivales'],
    luna_snow: ['Cósmico', 'Místico'],
    mantis: ['Guardianes', 'Cósmico'],
    mister_fantastic: ['Fantásticos', 'Tecnología'],
    rocket_raccoon: ['Guardianes', 'Tecnología'],
    nightcrawler: ['X-Men', 'Mutantes'],
    ms_marvel: ['Avengers', 'Cósmico']
};

const missing = [];
const tooMany = [];

for (const [id, hero] of Object.entries(heroes)) {
    const tags = HERO_SYNERGY_TAGS[id];
    if (!tags) {
        missing.push(id);
        hero.tags = [];
        continue;
    }
    if (tags.length > 2) tooMany.push(id);
    hero.tags = [...new Set(tags)].slice(0, 2);
}

if (missing.length > 0) {
    throw new Error(`Faltan tags de agrupacion para: ${missing.join(', ')}`);
}
if (tooMany.length > 0) {
    throw new Error(`Heroes con mas de dos agrupaciones: ${tooMany.join(', ')}`);
}

fs.writeFileSync(heroesFile, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log(`Taxonomia de agrupaciones aplicada: ${Object.keys(heroes).length} heroes, maximo 2 grupos cada uno`);
