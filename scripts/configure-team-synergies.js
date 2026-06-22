import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(file, 'utf8'));

const tagGroups = {
    Avengers: ['iron_man', 'capitan_america', 'thor', 'hulk', 'black_widow', 'hawkeye', 'black_panther', 'captain_marvel', 'scarlet_witch', 'vision', 'falcon', 'ant_man'],
    Defenders: ['daredevil', 'luke_cage', 'iron_fist', 'jessica_jones'],
    Guardianes: ['star_lord', 'groot', 'gamora'],
    'X-Men': ['wolverine', 'jean_grey', 'cyclops', 'storm', 'domino'],
    'Místico': ['doctor_strange', 'scarlet_witch', 'moon_knight', 'blade', 'ghost_rider'],
    Callejero: ['spiderman', 'black_widow', 'hawkeye', 'daredevil', 'moon_knight', 'blade', 'luke_cage', 'shang_chi', 'she_hulk', 'winter_soldier'],
    Wakanda: ['black_panther'],
    'Tecnología': ['iron_man', 'spiderman', 'ant_man', 'vision', 'falcon', 'winter_soldier']
};

const roleGroups = {
    vanguard: ['capitan_america', 'hulk', 'black_panther', 'wolverine', 'gamora', 'shang_chi', 'she_hulk', 'blade', 'luke_cage', 'ghost_rider'],
    support: ['spiderman', 'black_widow', 'doctor_strange', 'groot', 'scarlet_witch', 'ant_man', 'falcon', 'storm', 'jean_grey', 'domino', 'daredevil'],
    artillery: ['iron_man', 'thor', 'hawkeye', 'captain_marvel', 'star_lord', 'vision', 'winter_soldier', 'cyclops', 'silver_surfer', 'moon_knight']
};

const metrics = {
    iron_man: [4, 2, 2, 3], spiderman: [3, 5, 2, 5], capitan_america: [3, 3, 5, 2],
    thor: [5, 4, 1, 1], hulk: [5, 4, 1, 1], black_widow: [3, 4, 3, 5],
    hawkeye: [4, 4, 1, 4], black_panther: [4, 3, 4, 4], doctor_strange: [4, 5, 4, 3],
    vision: [5, 2, 2, 5], falcon: [3, 3, 5, 5],
    captain_marvel: [5, 2, 2, 3], star_lord: [4, 4, 3, 2], groot: [2, 5, 5, 1],
    gamora: [5, 2, 1, 4], silver_surfer: [5, 4, 3, 5],
    daredevil: [3, 3, 4, 5], moon_knight: [4, 4, 2, 4], blade: [5, 2, 3, 4],
    ghost_rider: [5, 4, 1, 4], luke_cage: [3, 4, 5, 1], shang_chi: [5, 4, 3, 1],
    she_hulk: [5, 4, 2, 1]
};

for (const hero of Object.values(heroes)) {
    hero.tags = Object.entries(tagGroups)
        .filter(([, ids]) => ids.includes(hero.id))
        .map(([tag]) => tag);
    hero.formationRole = Object.entries(roleGroups).find(([, ids]) => ids.includes(hero.id))?.[0] || 'artillery';
    const [damage, control, support, detection] = metrics[hero.id] || [3, 2, 2, hero.canSeeStealth ? 4 : 1];
    hero.teamMetrics = { damage, control, support, detection };
}

fs.writeFileSync(file, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log(`Etiquetas y roles configurados: ${Object.keys(heroes).length} héroes`);
