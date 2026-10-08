import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const heroFile = path.join(root, 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(heroFile, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const contracts = {
    daredevil: { cost: 150, ability: 'RADAR DE HELL\'S KITCHEN', abilityDesc: 'Revela ocultos a 190px durante 2s cada 8s. Conserva deteccion propia y contraataque cada cuatro ataques; no da vision global.', niche: 'revelado local y respuesta veloz', metrics: [3, 3, 4, 5] },
    moon_knight: { cost: 250, ability: 'CICLO DE KHONSHU', abilityDesc: 'Ciclo automatico de 10s por fase. Creciente: +22% alcance y -10% dano, un rebote. Llena: +30% dano y -15% cadencia, penetracion 35%. Menguante: +16% cadencia y -10% dano, area 44px y slow 46%/2.2s al blanco principal. Conserva la prioridad elegida; muestra tiempo restante y fase siguiente.', niche: 'artilleria adaptable por ciclos', metrics: [4, 4, 2, 4] },
    blade: { cost: 330, ability: 'CAZADOR DAYWALKER', abilityDesc: 'Cada impacto sangra: 21% de su dano efectivo por segundo durante 3.6 s; contra jefes o amenaza 4+, 30% durante 5 s. No acumula sangrados. Conserva toxina acumulable.', niche: 'caza de elites, sangrado y desgaste', metrics: [5, 2, 3, 4] },
    ghost_rider: { cost: 520, ability: 'ESPIRITU DE VENGANZA', abilityDesc: 'Cada impacto quema durante 4 s: 13.5% de su dano efectivo por segundo, sin acumularse. Sus cadenas arrastran por la ruta y Penitencia castiga la vida perdida de jefes.', niche: 'control pesado y castigo de jefes', metrics: [5, 4, 1, 4] },
    luke_cage: { cost: 210, ability: 'DEFENSOR INQUEBRANTABLE', abilityDesc: 'Los aturdimientos que recibe duran 50% menos. Ataca y tiene 70% de reducir la armadura del objetivo durante 3.5 s antes de resistencias. No potencia aliados.', niche: 'tenacidad propia y ruptura de blindaje', metrics: [3, 4, 5, 1] },
    shang_chi: { cost: 410, ability: 'LEYENDA DE LOS DIEZ ANILLOS', abilityDesc: 'Tres ataques preparan un finalizador para el siguiente disparo: Orbita suma un rebote (4) y alcance de cadena 110px; Rafaga amplifica area a 82px y penetracion a 50%; Guardia ralentiza al blanco principal 45% durante 1.5s. Recarga minima 4s desde despliegue o uso. Cambiar patron conserva combo y recarga, sin crear ataques ni monedas.', niche: 'patrones manuales de combo y control', metrics: [5, 4, 3, 1] },
    she_hulk: { cost: 350, ability: 'OBJECION DEFINITIVA', abilityDesc: 'Prepara Objecion en 3 ataques: golpe adicional de 55% de dano a hasta 4 enemigos, marca 14% durante 2.4s y retroceso por la ruta (38px; jefes 18px). Aturde al objetivo principal 0.7s, sujeto a resistencias. Recarga minima de 4s desde despliegue; no provoca ni cancela habilidades de jefes.', niche: 'golpe preparado, control y retroceso', metrics: [5, 4, 2, 1] }
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

heroes.luke_cage.special = { ...heroes.luke_cage.special, stunResistance: 0.5 };

fs.writeFileSync(heroFile, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log('Expansion urbana configurada: 7 heroes completos');
