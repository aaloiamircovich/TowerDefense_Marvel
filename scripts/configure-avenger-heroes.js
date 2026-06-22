import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(file, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const contracts = {
    hulk: {
        cost: 400,
        ability: 'FURIA GAMMA',
        abilityDesc: 'Acumula furia al atacar y cuando la defensa pierde vidas. Con 50 de furia salta sobre un grupo, inflige daño en área y aturde sin sacar enemigos de su ruta.',
        niche: 'tanque cercano, respuesta a fugas y control de grupos'
    },
    black_widow: {
        cost: 190,
        ability: 'SABOTAJE WIDOW',
        abilityDesc: 'Prioriza apoyos e invocadores con ruptura de armadura. Cada cuarto ataque libera una descarga que encadena y paraliza varios objetivos.',
        niche: 'anti-soporte, detección y control eléctrico'
    },
    hawkeye: {
        cost: 180,
        ability: 'CARCAJ TÁCTICO',
        abilityDesc: 'Cambia manualmente entre flechas explosivas de área, criogénicas de control y perforantes contra armadura.',
        niche: 'artillería adaptable de muy largo alcance'
    },
    black_panther: {
        cost: 320,
        ability: 'CARGA DE VIBRANIUM',
        abilityDesc: 'Acumula energía cinética al insistir sobre un blanco y contraataca al primero que entra en su guardia. Al máximo libera un pulso y fortalece aliados cercanos.',
        niche: 'duelista cercano, contraataque y aura de equipo'
    },
    vision: {
        cost: 520,
        ability: 'CONTROL DE DENSIDAD',
        abilityDesc: 'Alterna entre fase intangible de alcance y cadencia, y masa densa de gran daño. Cada tercer ataque proyecta un rayo que atraviesa la línea enemiga.',
        niche: 'daño lineal configurable y cobertura de terrenos'
    },
    falcon: {
        cost: 210,
        ability: 'REDWING',
        abilityDesc: 'Ordena a Redwing explorar para revelar y marcar amenazas o atacar con mayor frecuencia. El dron opera fuera del alcance normal de Falcon.',
        niche: 'reconocimiento global, marcado y apoyo aéreo'
    }
};

for (const [id, contract] of Object.entries(contracts)) {
    const hero = heroes[id];
    if (!hero) throw new Error(`No existe el héroe ${id}`);
    const root = `assets/images/heroes/${id}`;
    hero.ability = contract.ability;
    hero.cost = contract.cost;
    hero.abilityDesc = contract.abilityDesc;
    hero.niche = contract.niche;
    hero.sprite = `${root}/portrait.png`;
    hero.visual = {
        portrait: `${root}/portrait.png`,
        size: 96,
        anchor: { x: 0.5, y: 0.5 },
        defaultDirection: 'south',
        idle: Object.fromEntries(directions.map((direction) => [direction, `${root}/sprites/${direction}.png`])),
        attack: {
            fps: 14,
            loop: false,
            frames: Array.from({ length: 9 }, (_, index) => `${root}/shoot/${index}.png`)
        }
    };
}

fs.writeFileSync(file, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log(`Contratos Avengers configurados: ${Object.keys(contracts).length}`);
