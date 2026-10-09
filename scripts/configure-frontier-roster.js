import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const heroesFile = path.join(root, 'data', 'heroes.json');
const itemsFile = path.join(root, 'data', 'items.json');
const heroes = JSON.parse(fs.readFileSync(heroesFile, 'utf8'));
const items = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const heroContracts = {
    war_machine: contract('War Machine', 'Tecnológico', 'Rare', 360, 48, 175, 1.1, false, 'ARTILLERIA PESADA', 'Cada 6 disparos fija una salva: tras 0.9 s inflige 60% de poder por escala de habilidad a hasta 5 enemigos detectados en 65 px. La zona no sigue al blanco; mover o aturdir cancela. Conserva area, penetracion y 18% de quemar al principal 2.4 s al 14% de dano efectivo/s.', 'splash antiarmadura para grupos densos', ['Avengers', 'Tecnologia'], 'artillery', [5, 3, 2, 3], { projectileProfile: { splashRadius: 54, splashFactor: 0.34, armorPenetration: 0.18 }, attackEffects: [{ type: 'burn', duration: 2.4, power: 0.14, damageBasis: 'attackDamage', chance: 0.18 }], visualStyle: 'explosive', projectileColor: '#9bd1ff' }),
    nick_fury: contract('Nick Fury', 'Urbano', 'Rare', 385, 1, 265, 1, true, 'ORDEN DE FUEGO', 'No ataca. Orden sostenida: +8% de cadencia base a aliados dentro de 265 px, sin ciclos ni cargas. La potencia y el radio mejoran con su nivel. El aura se suspende al quedar aturdido; no concede deteccion aliada.', 'aura amplia de cadencia tactica', ['Callejero', 'Tecnologia'], 'support', [1, 3, 5, 5], { supportAura: { type: 'fireRate', power: 0.08, range: 265, label: 'Coordinacion S.H.I.E.L.D.' }, visualStyle: 'energy', projectileColor: '#88aaff' }),
    wasp: contract('Wasp', 'Tecnológico', 'Common', 310, 1, 125, 1, true, 'ENLACE PYM', 'No ataca. Enlace Pym: prepara 6 s y concede +36% de cadencia base durante 3 s a aliados dentro de 125 px; repite el ciclo con 6 s sin bonus. Potencia y radio mejoran con su nivel. Aturdirla suspende el bonus, no el reloj. Moverla o recolocarla reinicia la preparacion.', 'pulso corto de cadencia con descanso', ['Avengers', 'Tecnologia'], 'support', [1, 4, 5, 5], { supportAura: { type: 'fireRate', power: 0.18, range: 125, label: 'Impulso Pym' }, visualStyle: 'energy', projectileColor: '#ffd447' }),
    nova: contract('Nova', 'Cósmico', 'Legendary', 520, 58, 205, 1.0, false, 'PULSO NOVA', 'Proyectiles cosmicos atraviesan parte de la linea y encadenan energia residual.', 'linea cosmica y rebotes', ['Guardianes', 'Tecnologia'], 'artillery', [5, 3, 2, 3], { projectileProfile: { chainCount: 1, chainRange: 120, chainFactor: 0.55, armorPenetration: 0.16 }, statModifiers: { rangePct: 0.06 }, visualStyle: 'energy', projectileColor: '#ffdf6f' }),
    quake: contract('Quake', 'Tecnológico', 'Rare', 290, 32, 165, 1.45, true, 'ONDA SISMICA', 'Cada 4s golpea una linea de hasta 5 terrestres con 45% poder, ruptura 16% por 2s y slow 30% por 1.2s. Sin desplazar ni afectar voladores.', 'ruptura y control estable', ['Callejero', 'Tecnologia'], 'support', [3, 5, 4, 4], { attackEffects: [], visualStyle: 'sonic', projectileColor: '#76e4f7' }),
    medusa: contract('Medusa', 'Místico', 'Rare', 280, 30, 145, 1.6, false, 'CABELLO PRENSIL', 'Cada 5s enlaza hasta 3 cercanos durante 2s y reparte 60% de slow. Separarse del ancla o salir del alcance rompe el agarre.', 'control de grupos cortos', ['Mistico'], 'support', [3, 5, 3, 2], { projectileProfile: { chainCount: 1, chainRange: 85, chainFactor: 0.5 }, attackEffects: [], visualStyle: 'whip', projectileColor: '#ff5d8f' }),
    namor: contract('Namor', 'Mutante', 'Legendary', 470, 62, 115, 0.95, false, 'TRIDENTE ATLANTE', 'Agua o pasto. En agua +20% dano y tres ataques preparan marea contra hasta 3 vecinos cada 6s; moverlo o 3s sin atacar pierde carga.', 'vanguardia acuatica anti elite', ['Avengers'], 'vanguard', [5, 3, 3, 2], { statModifiers: { allowWater: true, damagePct: 0.05 }, projectileProfile: { armorPenetration: 0.24 }, visualStyle: 'water', projectileColor: '#40c9ff' }),
    iron_fist: contract('Iron Fist', 'Místico', 'Rare', 240, 38, 105, 1.55, false, 'CHI DE KUN-LUN', 'Carga chi durante 5s desde despliegue o uso. Su siguiente ataque inflige 90% de dano extra y aturde al blanco principal 0.45s, sujeto a resistencias e inmunidades. Consume la carga al disparar; sin stun aleatorio ni area propia. Conserva +5 puntos de probabilidad critica.', 'duelista con control puntual', ['Defenders', 'Callejero'], 'vanguard', [4, 4, 3, 2], { statModifiers: { critChance: 5 }, attackEffects: [], visualStyle: 'mystic', projectileColor: '#f7d04a' }),
    punisher: contract('Punisher', 'Urbano', 'Rare', 260, 34, 190, 1.55, false, 'FUEGO SUPRESOR', 'Fuego sostenido: cada disparo al mismo enemigo prepara +8% de dano para el siguiente, hasta +32%. Se pierde al cambiar blanco, moverlo, aturdirlo o dejar de disparar 2 s. Conserva perforacion y splash minimo.', 'DPS sostenido y perforacion', ['Callejero'], 'artillery', [5, 2, 1, 3], { projectileProfile: { armorPenetration: 0.2, splashRadius: 34, splashFactor: 0.2 }, visualStyle: 'ballistic', projectileColor: '#d9d9d9' }),
    elektra: contract('Elektra', 'Urbano', 'Rare', 235, 36, 115, 1.9, false, 'SAI LETAL', '38% de aplicar sangrado durante 2.5 s: 22% de su dano efectivo por segundo, sin acumularse. +8 puntos de probabilidad critica. Cada 4s prepara Sai Letal: el siguiente ataque contra un enemigo ya sangrante al 50% de vida o menos inflige 75% de dano extra y consume la carga. Recarga desde despliegue; no ejecuta ni garantiza critico.', 'remate y criticos', ['Defenders', 'Callejero'], 'vanguard', [5, 2, 2, 3], { statModifiers: { critChance: 8 }, attackEffects: [{ type: 'bleed', duration: 2.5, power: 0.22, damageBasis: 'attackDamage', chance: 0.38 }], visualStyle: 'blade', projectileColor: '#ff3b5f' }),
    jessica_jones: contract('Jessica Jones', 'Urbano', 'Common', 185, 42, 95, 1.05, false, 'GOLPE PRIVADO', 'Ultima linea: contra el enemigo detectable mas avanzado de su cobertura, si recorrio al menos 75% de su propia ruta, prepara un golpe con 45% de dano extra y stun de 0.5s resistible. Recarga minima 3s desde despliegue o uso. Sin stun aleatorio ni cambio automatico de prioridad.', 'tanque urbano economico', ['Defenders', 'Callejero'], 'vanguard', [4, 3, 3, 2], { attackEffects: [], statModifiers: { damagePct: 0.04 }, visualStyle: 'impact', projectileColor: '#b47cff' }),
    cloak: contract('Cloak', 'Místico', 'Rare', 300, 22, 170, 1.35, true, 'MANTO OSCURO', 'Cada 6s al atacar abre un manto fijo de 65px durante 3s: revela y ralentiza 42% a hasta 6 enemigos que entren. Salir del manto termina solo sus efectos; respeta resistencias y no renueva por reentrada. No teletransporta enemigos ni comparte vision global.', 'deteccion mistica y control', ['Defenders', 'Mistico'], 'support', [2, 5, 4, 5], { statModifiers: { detectStealth: true, rangePct: 0.08 }, attackEffects: [], visualStyle: 'mystic', projectileColor: '#5d4bff' }),
    dagger: contract('Dagger', 'Místico', 'Rare', 285, 33, 175, 1.65, true, 'DAGAS DE LUZ', 'Al disparar deja una marca propia de 12% durante 3s. Cada 4s, disparar a una presa con esa marca la consume y descarga 65% de poder sobre ella y hasta 2 marcados propios consecutivos a 95px, dentro de su alcance. Conserva rebote basico y marcas aliadas; no cura.', 'marca y rebote luminoso', ['Defenders', 'Mistico'], 'artillery', [4, 3, 4, 5], { projectileProfile: { chainCount: 1, chainRange: 95, chainFactor: 0.55 }, attackEffects: [], statModifiers: { detectStealth: true }, visualStyle: 'energy', projectileColor: '#fff2a8' }),
    magik: contract('Magik', 'Místico', 'Legendary', 540, 54, 150, 1.05, false, 'ESPADA ALMA', 'Cada 6s prepara un corte contra un enemigo ya maldito: 50% de dano extra y ruptura20% durante 3.5s al impacto. Tras 0.4s, el retorno causa 60% de poder con penetracion55% si la presa sigue maldita y en alcance. Conserva maldicion y rebote basico; mover, aturdir o retirar cancela el retorno.', 'ruptura y dano mistico', ['X-Men', 'Mistico'], 'vanguard', [5, 4, 3, 3], { projectileProfile: { armorPenetration: 0.28, chainCount: 1, chainRange: 80, chainFactor: 0.45 }, attackEffects: [], visualStyle: 'mystic', projectileColor: '#ff9cff' }),
    iceman: contract('Iceman', 'Mutante', 'Rare', 310, 28, 165, 1.55, false, 'CERO ABSOLUTO', 'Escarcha cada 1s sobre hasta 4 cercanos: slow30%, congela0.6s tras3 exposiciones. Recuperacion4s por victima y escarcha caduca en3s.', 'slow de area y control', ['X-Men'], 'support', [3, 5, 4, 2], { projectileProfile: { splashRadius: 44, splashFactor: 0.28 }, attackEffects: [], visualStyle: 'ice', projectileColor: '#a7f3ff' })
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
