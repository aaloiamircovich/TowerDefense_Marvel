import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(file, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const contracts = {
    wolverine: { cost: 420, ability: 'FRENESI REGENERATIVO', abilityDesc: 'Gana 7 de frenesi al atacar y 14 al repetir blanco antes de 3s; cambiar de presa conserva la mitad. Las bajas dan 18. Maximo 100: +18% dano y +20% cadencia, sin bonus por multitudes. Tras 3s sin atacar pierde 12/s; moverlo o aturdirlo lo vacia. Conserva salto por 55, alcance 3x y regreso a su puesto.', niche: 'asalto cercano, salto y presión continua', metrics: [5, 2, 3, 4] },
    jean_grey: { cost: 600, ability: 'FUERZA PHOENIX', abilityDesc: 'Usa telequinesis para retroceder grupos y carga un medidor Phoenix que libera una onda de poder controlada.', niche: 'telequinesis, control y estallido Phoenix', metrics: [5, 5, 4, 4] },
    cyclops: { cost: 260, ability: 'VISOR OPTICO', abilityDesc: 'Orienta rayos en línea y alterna un haz penetrante con rebotes ópticos de alta cadencia.', niche: 'lineas perforantes y rebotes configurables', metrics: [5, 3, 2, 4] },
    storm: { cost: 300, ability: 'DIOSA DEL CLIMA', abilityDesc: 'Crea zonas de ventisca que ralentizan o tormentas eléctricas que encadenan daño sobre la ruta.', niche: 'zonas climaticas y control elemental', metrics: [4, 5, 4, 2] },
    domino: { cost: 220, ability: 'SUERTE IMPOSIBLE', abilityDesc: 'Cada ataque genera créditos según la recompensa del enemigo y cada quinto disparo refuerza su crítico controlado.', niche: 'criticos previsibles y economia', metrics: [4, 3, 4, 5] },
    scarlet_witch: { cost: 650, ability: 'REALIDAD ENLAZADA', abilityDesc: 'Conecta maldiciones entre enemigos y altera temporalmente la velocidad de toda una sección de la oleada.', niche: 'maldiciones enlazadas y tiempo', metrics: [5, 5, 4, 4] },
    ant_man: { cost: 190, ability: 'ESCALA PYM', abilityDesc: 'Tres ataques diminutos preparan carga Pym. El siguiente ataque gigante consume la carga: impacto adicional de 50% de poder escalado a hasta 5 detectables en cobertura y a 68px del blanco; retrocede 32px (jefes 15px), respetando inmunidades. Recarga minima 4s desde despliegue o impacto, compartida entre formas. Conserva splash gigante ordinario.', niche: 'cambio de escala y respuesta flexible', metrics: [4, 4, 4, 4] },
    winter_soldier: { cost: 270, ability: 'ARSENAL DEL SOLDADO', abilityDesc: 'Rafaga de tres disparos: dos al 85% y un remate al 160% de dano. El remate potencia la municion: 85% perforacion, stun de 0.6 s o explosion de 90 px. Cambiar municion conserva el ciclo.', niche: 'municion tactica y ruptura de armadura', metrics: [5, 4, 2, 4] }
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
