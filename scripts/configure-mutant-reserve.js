import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(file, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const contracts = {
    wolverine: { cost: 420, ability: 'FRENESI REGENERATIVO', abilityDesc: 'Acumula frenesí, acelera sus ataques cuando está rodeado, salta al objetivo prioritario y recupera una vida con límite temporal.', niche: 'asalto cercano, salto y recuperacion', metrics: [5, 2, 3, 4] },
    jean_grey: { cost: 600, ability: 'FUERZA PHOENIX', abilityDesc: 'Usa telequinesis para retroceder grupos y carga un medidor Phoenix que libera una onda de poder controlada.', niche: 'telequinesis, control y estallido Phoenix', metrics: [5, 5, 4, 4] },
    cyclops: { cost: 260, ability: 'VISOR OPTICO', abilityDesc: 'Orienta rayos en línea y alterna un haz penetrante con rebotes ópticos de alta cadencia.', niche: 'lineas perforantes y rebotes configurables', metrics: [5, 3, 2, 4] },
    storm: { cost: 300, ability: 'DIOSA DEL CLIMA', abilityDesc: 'Crea zonas de ventisca que ralentizan o tormentas eléctricas que encadenan daño sobre la ruta.', niche: 'zonas climaticas y control elemental', metrics: [4, 5, 4, 2] },
    domino: { cost: 220, ability: 'SUERTE IMPOSIBLE', abilityDesc: 'Cada quinto ataque es un crítico controlado y su suerte sembrada puede desviar una fuga hacia atrás.', niche: 'criticos previsibles, economia y desvio', metrics: [4, 3, 4, 5] },
    scarlet_witch: { cost: 650, ability: 'REALIDAD ENLAZADA', abilityDesc: 'Conecta maldiciones entre enemigos y altera temporalmente la velocidad de toda una sección de la oleada.', niche: 'maldiciones enlazadas y tiempo', metrics: [5, 5, 4, 4] },
    ant_man: { cost: 190, ability: 'ESCALA PYM', abilityDesc: 'Alterna manualmente forma diminuta de alta cadencia y forma gigante con impacto y retroceso de área.', niche: 'cambio de escala y respuesta flexible', metrics: [4, 4, 4, 4] },
    winter_soldier: { cost: 270, ability: 'ARSENAL DEL SOLDADO', abilityDesc: 'Selecciona munición perforante, eléctrica o explosiva para responder a armadura, control o grupos.', niche: 'municion tactica y ruptura de armadura', metrics: [5, 4, 2, 4] }
};

for (const [id, contract] of Object.entries(contracts)) {
    const hero = heroes[id]; const root = `assets/images/heroes/${id}`;
    Object.assign(hero, {
        cost: contract.cost, ability: contract.ability, abilityDesc: contract.abilityDesc, niche: contract.niche,
        teamMetrics: { damage: contract.metrics[0], control: contract.metrics[1], support: contract.metrics[2], detection: contract.metrics[3] },
        sprite: `${root}/portrait.png`,
        visual: {
            portrait: `${root}/portrait.png`, size: 96, anchor: { x: 0.5, y: 0.5 }, defaultDirection: 'south',
            idle: Object.fromEntries(directions.map((direction) => [direction, `${root}/sprites/${direction}.png`])),
            attack: { fps: 14, loop: false, frames: Array.from({ length: 9 }, (_, index) => `${root}/shoot/${index}.png`) }
        }
    });
}

fs.writeFileSync(file, `${JSON.stringify(heroes, null, 2)}\n`, 'utf8');
console.log('Reserva mutante configurada: 8 heroes completos');
