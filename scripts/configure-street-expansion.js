import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const heroFile = path.join(root, 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(heroFile, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const contracts = {
    daredevil: { cost: 150, ability: 'RADAR DE HELL\'S KITCHEN', abilityDesc: 'Emite pulsos que revelan sigilo para todo el equipo y responde cada cuatro ataques con un contraataque preciso.', niche: 'deteccion global y respuesta veloz', metrics: [3, 3, 4, 5] },
    moon_knight: { cost: 250, ability: 'CICLO DE KHONSHU', abilityDesc: 'Alterna luna creciente para alcance, luna llena para dano y menguante para cadencia y control.', niche: 'artilleria adaptable por ciclos', metrics: [4, 4, 2, 4] },
    blade: { cost: 330, ability: 'CAZADOR DAYWALKER', abilityDesc: 'Aplica sangrado reforzado a elites y convierte cada seis bajas en una vida, con un limite temporal.', niche: 'caza de elites, sangrado y recuperacion', metrics: [5, 2, 3, 4] },
    ghost_rider: { cost: 520, ability: 'ESPIRITU DE VENGANZA', abilityDesc: 'Sus cadenas arrastran enemigos por la ruta y la Mirada de Penitencia castiga la vida perdida de los jefes.', niche: 'control pesado y castigo de jefes', metrics: [5, 4, 1, 4] },
    luke_cage: { cost: 210, ability: 'DEFENSOR INQUEBRANTABLE', abilityDesc: 'Protege aliados cercanos y devuelve a la ruta a enemigos que superan el ultimo tramo de la defensa.', niche: 'intercepcion de fugas y proteccion local', metrics: [3, 4, 5, 1] },
    shang_chi: { cost: 410, ability: 'LEYENDA DE LOS DIEZ ANILLOS', abilityDesc: 'Configura sus anillos en orbita encadenada, rafaga de impacto o guardia de alta cadencia.', niche: 'patrones manuales de combo y control', metrics: [5, 4, 3, 1] },
    she_hulk: { cost: 350, ability: 'OBJECION DEFINITIVA', abilityDesc: 'Provoca a grupos marcandolos y encadena impactos que retroceden por el trazado sin abandonar la ruta.', niche: 'impacto de area, provocacion y retroceso', metrics: [5, 4, 2, 1] }
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

fs.writeFileSync(heroFile, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log('Expansion urbana configurada: 7 heroes completos');
