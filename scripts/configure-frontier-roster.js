import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const heroesFile = path.join(root, 'data', 'heroes.json');
const itemsFile = path.join(root, 'data', 'items.json');
const heroes = JSON.parse(fs.readFileSync(heroesFile, 'utf8'));
const items = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const heroContracts = {
    war_machine: contract('War Machine', 'Tecnológico', 'Rare', 360, 48, 175, 1.1, false, 'ARTILLERIA PESADA', 'Misiles de hombro: disparos con area moderada y penetracion parcial contra blindaje.', 'splash antiarmadura para grupos densos', ['Avengers', 'Tecnologia'], 'artillery', [5, 3, 2, 3], { projectileProfile: { splashRadius: 54, splashFactor: 0.34, armorPenetration: 0.18 }, visualStyle: 'explosive', projectileColor: '#9bd1ff' }),
    nick_fury: contract('Nick Fury', 'Urbano', 'Rare', 210, 20, 180, 1.8, true, 'DIRECTOR S.H.I.E.L.D.', 'Marca objetivos prioritarios y mejora la lectura contra sigilo desde larga distancia.', 'deteccion, marca y soporte tactico', ['Callejero', 'Tecnologia'], 'support', [2, 3, 5, 5], { attackEffects: [{ type: 'mark', duration: 2.4, power: 0.14, chance: 0.45 }], statModifiers: { rangePct: 0.08, detectStealth: true }, visualStyle: 'energy', projectileColor: '#88aaff' }),
    wasp: contract('Wasp', 'Tecnológico', 'Rare', 230, 18, 135, 2.5, true, 'PICADURA WASP', 'Alta cadencia, criticos rapidos y microdescargas que frenan corredores.', 'cadencia, critico y anti runners', ['Avengers', 'Tecnologia'], 'support', [3, 4, 3, 5], { statModifiers: { fireRatePct: 0.1, critChance: 4, detectStealth: true }, attackEffects: [{ type: 'slow', duration: 1.1, power: 0.24, chance: 0.25 }], visualStyle: 'energy', projectileColor: '#ffd447' }),
    nova: contract('Nova', 'Cósmico', 'Legendary', 520, 58, 205, 1.0, false, 'PULSO NOVA', 'Proyectiles cosmicos atraviesan parte de la linea y encadenan energia residual.', 'linea cosmica y rebotes', ['Guardianes', 'Tecnologia'], 'artillery', [5, 3, 2, 3], { projectileProfile: { chainCount: 1, chainRange: 120, chainFactor: 0.55, armorPenetration: 0.16 }, statModifiers: { rangePct: 0.06 }, visualStyle: 'energy', projectileColor: '#ffdf6f' }),
    quake: contract('Quake', 'Tecnológico', 'Rare', 290, 32, 165, 1.45, true, 'ONDA SISMICA', 'Vibraciones aplican ruptura y ralentizan tanques sin sacarlos del camino.', 'ruptura y control estable', ['Callejero', 'Tecnologia'], 'support', [3, 5, 4, 4], { attackEffects: [{ type: 'armorBreak', duration: 3.2, power: 0.16, chance: 0.35 }, { type: 'slow', duration: 1.0, power: 0.18, chance: 0.35 }], visualStyle: 'sonic', projectileColor: '#76e4f7' }),
    medusa: contract('Medusa', 'Místico', 'Rare', 280, 30, 145, 1.6, false, 'CABELLO PRENSIL', 'Atrapa grupos cercanos con control sostenido y rebotes cortos.', 'control de grupos cortos', ['Mistico'], 'support', [3, 5, 3, 2], { projectileProfile: { chainCount: 1, chainRange: 85, chainFactor: 0.5 }, attackEffects: [{ type: 'slow', duration: 1.7, power: 0.38, chance: 0.42 }], visualStyle: 'whip', projectileColor: '#ff5d8f' }),
    namor: contract('Namor', 'Mutante', 'Legendary', 470, 62, 115, 0.95, false, 'TRIDENTE ATLANTE', 'Puede defender desde agua, rompe armadura y golpea elites de frente.', 'vanguardia acuatica anti elite', ['Avengers'], 'vanguard', [5, 3, 3, 2], { statModifiers: { allowWater: true, damagePct: 0.05 }, projectileProfile: { armorPenetration: 0.24 }, visualStyle: 'water', projectileColor: '#40c9ff' }),
    iron_fist: contract('Iron Fist', 'Místico', 'Rare', 240, 38, 105, 1.55, false, 'CHI DE KUN-LUN', 'Golpes de chi alternan dano concentrado con aturdimiento breve.', 'duelista con control puntual', ['Defenders', 'Callejero'], 'vanguard', [4, 4, 3, 2], { statModifiers: { critChance: 5 }, attackEffects: [{ type: 'stun', duration: 0.28, power: 1, chance: 0.18 }], visualStyle: 'mystic', projectileColor: '#f7d04a' }),
    punisher: contract('Punisher', 'Urbano', 'Rare', 260, 34, 190, 1.55, false, 'FUEGO SUPRESOR', 'Rafagas largas con municion perforante y splash minimo contra grupos.', 'DPS sostenido y perforacion', ['Callejero'], 'artillery', [5, 2, 1, 3], { projectileProfile: { armorPenetration: 0.2, splashRadius: 34, splashFactor: 0.2 }, visualStyle: 'ballistic', projectileColor: '#d9d9d9' }),
    elektra: contract('Elektra', 'Urbano', 'Rare', 235, 36, 115, 1.9, false, 'SAI LETAL', 'Prioriza objetivos debiles con critico alto y sangrado tactico.', 'remate y criticos', ['Defenders', 'Callejero'], 'vanguard', [5, 2, 2, 3], { statModifiers: { critChance: 8 }, attackEffects: [{ type: 'bleed', duration: 2.5, power: 0.22, chance: 0.38 }], visualStyle: 'blade', projectileColor: '#ff3b5f' }),
    jessica_jones: contract('Jessica Jones', 'Urbano', 'Common', 185, 42, 95, 1.05, false, 'GOLPE PRIVADO', 'Baja cadencia, mucho impacto y chance de aturdir al primer enemigo en fuga.', 'tanque urbano economico', ['Defenders', 'Callejero'], 'vanguard', [4, 3, 3, 2], { attackEffects: [{ type: 'stun', duration: 0.35, power: 1, chance: 0.22 }], statModifiers: { damagePct: 0.04 }, visualStyle: 'impact', projectileColor: '#b47cff' }),
    cloak: contract('Cloak', 'Místico', 'Rare', 300, 22, 170, 1.35, true, 'MANTO OSCURO', 'Revela sigilo y ralentiza enemigos marcados por sombras.', 'deteccion mistica y control', ['Defenders', 'Mistico'], 'support', [2, 5, 4, 5], { statModifiers: { detectStealth: true, rangePct: 0.08 }, attackEffects: [{ type: 'slow', duration: 2.2, power: 0.42, chance: 0.42 }], visualStyle: 'mystic', projectileColor: '#5d4bff' }),
    dagger: contract('Dagger', 'Místico', 'Rare', 285, 33, 175, 1.65, true, 'DAGAS DE LUZ', 'Lanza luz que marca y salta a un segundo objetivo cercano.', 'marca y rebote luminoso', ['Defenders', 'Mistico'], 'artillery', [4, 3, 4, 5], { projectileProfile: { chainCount: 1, chainRange: 95, chainFactor: 0.55 }, attackEffects: [{ type: 'mark', duration: 2.0, power: 0.12, chance: 0.36 }], statModifiers: { detectStealth: true }, visualStyle: 'energy', projectileColor: '#fff2a8' }),
    magik: contract('Magik', 'Místico', 'Legendary', 540, 54, 150, 1.05, false, 'ESPADA ALMA', 'Cortes mistico-mutantes rompen armadura y generan rebote dimensional.', 'ruptura y dano mistico', ['X-Men', 'Mistico'], 'vanguard', [5, 4, 3, 3], { projectileProfile: { armorPenetration: 0.28, chainCount: 1, chainRange: 80, chainFactor: 0.45 }, attackEffects: [{ type: 'armorBreak', duration: 3.5, power: 0.2, chance: 0.3 }], visualStyle: 'mystic', projectileColor: '#ff9cff' }),
    iceman: contract('Iceman', 'Mutante', 'Rare', 310, 28, 165, 1.55, false, 'CERO ABSOLUTO', 'Ralentiza de forma consistente y cubre curvas con splash helado.', 'slow de area y control', ['X-Men'], 'support', [3, 5, 4, 2], { projectileProfile: { splashRadius: 44, splashFactor: 0.28 }, attackEffects: [{ type: 'slow', duration: 1.9, power: 0.45, chance: 0.55 }], visualStyle: 'ice', projectileColor: '#a7f3ff' })
};

const itemContracts = {
    armadura_war_machine: item('ARMADURA WAR MACHINE', 'Splash pequeno y penetracion para artilleria pesada.', 2100, 3, 'armor', 'stark', { splashRadius: 38, splashFactor: 0.24, armorPenetration: 0.12 }),
    localizador_fury: item('LOCALIZADOR FURY', 'Detecta sigilo y marca mejor objetivos peligrosos.', 1150, 2, 'artifact', 'shield', { detectStealth: true, rangePct: 0.08 }),
    alas_wasp: item('ALAS WASP', '+18% cadencia y +4% critico.', 1250, 2, 'armor', 'pym', { fireRatePct: 0.18, critChance: 4 }),
    casco_nova: item('CASCO NOVA', 'Un rebote adicional con dano cosmico estable.', 2300, 3, 'artifact', 'stark', { chainCount: 1, chainRange: 105, chainFactor: 0.52 }),
    guante_quake: item('GUANTE QUAKE', 'Ralentiza y rompe armadura por vibracion.', 1500, 3, 'weapon', 'shield', { slowChance: 0.28, slowPower: 0.22, armorBreakChance: 0.28, armorBreakPower: 0.14 }),
    tridente_atlante: item('TRIDENTE ATLANTE', 'Permite agua y aumenta penetracion.', 1700, 3, 'weapon', 'vibranium', { allowWater: true, armorPenetration: 0.22 }),
    sello_kun_lun: item('SELLO KUN-LUN', '+10% dano y chance de stun breve.', 1450, 3, 'artifact', 'mystic', { damagePct: 0.1, slowChance: 0.18, slowPower: 0.25 }),
    prisma_luz_oscura: item('PRISMA LUZ OSCURA', 'Detecta sigilo, aumenta alcance y suma rebote corto.', 2600, 4, 'artifact', 'mystic', { detectStealth: true, rangePct: 0.12, chainCount: 1, chainRange: 80, chainFactor: 0.45 })
};

for (const [id, hero] of Object.entries(heroContracts)) heroes[id] = { id, ...hero, ...visual(id) };
for (const [id, itemData] of Object.entries(itemContracts)) items[id] = { id, ...itemData, icon: `assets/images/items/${id}.png` };

fs.writeFileSync(heroesFile, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
fs.writeFileSync(itemsFile, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
console.log(`Roster frontera configurado: ${Object.keys(heroContracts).length} heroes y ${Object.keys(itemContracts).length} objetos`);

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

function item(name, desc, price, tier, slot, set, effects) {
    return { name, desc, price, tier, slot, set, effects };
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
        Mistico: 'Místico'
    };
    return aliases[tag] || tag;
}
