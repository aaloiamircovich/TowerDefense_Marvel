import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const heroFile = path.join(root, 'data', 'heroes.json');
const enemyFile = path.join(root, 'data', 'enemies.json');
const heroes = JSON.parse(fs.readFileSync(heroFile, 'utf8'));
const enemies = JSON.parse(fs.readFileSync(enemyFile, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const contracts = {
    captain_marvel: { cost: 650, ability: 'ENERGÍA BINARIA', abilityDesc: 'Carga energía al atacar y derrotar enemigos. Al superar 60 vuela a una posición avanzada, atraviesa la línea enemiga y regresa a su puesto.', niche: 'artillería móvil y ruptura de líneas', metrics: [5, 2, 2, 3] },
    star_lord: { cost: 220, ability: 'BLÁSTERS ELEMENTALES', abilityDesc: 'Dispara a dos blancos y alterna plasma perforante, munición criogénica o cargas incendiarias.', niche: 'doble objetivo y respuesta elemental', metrics: [4, 4, 3, 2] },
    groot: { cost: 300, ability: 'MURO DE RAÍCES', abilityDesc: 'Levanta una barrera temporal sobre la ruta que ralentiza grupos sin desplazarlos. Con otro Guardián recupera una vida cada veinte segundos.', niche: 'control de paso y recuperación de Guardianes', metrics: [2, 5, 5, 1] },
    gamora: { cost: 360, ability: 'ASESINA DE ÉLITE', abilityDesc: 'Encadena ataques cercanos y ejecuta enemigos no jefes por debajo del 25% de salud.', niche: 'ejecución, cadenas cuerpo a cuerpo y élites', metrics: [5, 2, 1, 4] },
    silver_surfer: { cost: 760, ability: 'PODER CÓSMICO', abilityDesc: 'Traza rayos que atraviesan enemigos y configura su poder para daño, control o resonancia de equipo.', niche: 'trayectorias globales y potencia configurable', metrics: [5, 4, 3, 5] }
};

for (const [id, contract] of Object.entries(contracts)) {
    const hero = heroes[id];
    const assetRoot = `assets/images/heroes/${id}`;
    Object.assign(hero, {
        cost: contract.cost,
        ability: contract.ability,
        abilityDesc: contract.abilityDesc,
        niche: contract.niche,
        teamMetrics: { damage: contract.metrics[0], control: contract.metrics[1], support: contract.metrics[2], detection: contract.metrics[3] },
        sprite: `${assetRoot}/portrait.png`,
        visual: {
            portrait: `${assetRoot}/portrait.png`, size: 96, anchor: { x: 0.5, y: 0.5 }, defaultDirection: 'south',
            idle: Object.fromEntries(directions.map((direction) => [direction, `${assetRoot}/sprites/${direction}.png`])),
            attack: { fps: 14, loop: false, frames: Array.from({ length: 9 }, (_, index) => `${assetRoot}/shoot/${index}.png`) }
        }
    });
}

Object.assign(enemies.normal, {
    kree_commander: { id: 'kree_commander', name: 'Comandante Kree', category: 'Cósmico', hp: 260, speed: 44, reward: 34, armor: 0.32, stealth: false, faction: 'Imperio Kree', archetype: 'commander', behaviorCooldown: 5, commandPower: 0.22, threat: 4 },
    kree_sentry: { id: 'kree_sentry', name: 'Centinela Kree', category: 'Cósmico', hp: 230, speed: 48, reward: 26, armor: 0.28, stealth: false, faction: 'Imperio Kree', archetype: 'shield', barrierRatio: 0.24, threat: 4 },
    chitauri_phaser: { id: 'chitauri_phaser', name: 'Faseador Chitauri', category: 'Cósmico', hp: 145, speed: 72, reward: 28, armor: 0.08, stealth: false, faction: 'Chitauri', archetype: 'phaser', behaviorCooldown: 6, threat: 4 },
    chitauri_skimmer: { id: 'chitauri_skimmer', name: 'Deslizador Chitauri', category: 'Cósmico', hp: 165, speed: 78, reward: 24, armor: 0.12, stealth: false, flying: true, faction: 'Chitauri', archetype: 'flying', threat: 3 },
    black_order_hunter: { id: 'black_order_hunter', name: 'Cazador de la Orden', category: 'Cósmico', hp: 210, speed: 86, reward: 36, armor: 0.18, stealth: true, faction: 'Orden Negra', archetype: 'runner', threat: 4 },
    black_order_magus: { id: 'black_order_magus', name: 'Magus de la Orden', category: 'Místico', hp: 280, speed: 42, reward: 42, armor: 0.2, stealth: false, faction: 'Orden Negra', archetype: 'summoner', summonId: 'outrider', summonLimit: 3, behaviorCooldown: 6, threat: 5 }
});
enemies.normal.chitauri_warrior.faction = 'Chitauri';

fs.writeFileSync(heroFile, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
fs.writeFileSync(enemyFile, `${JSON.stringify(enemies, null, 2)}\n`, 'utf8');
console.log('Expansión cósmica configurada: 5 héroes y 6 enemigos');
