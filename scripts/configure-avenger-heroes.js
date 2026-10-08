import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'data', 'heroes.json');
const heroes = JSON.parse(fs.readFileSync(file, 'utf8'));
const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

const contracts = {
    hulk: {
        cost: 400,
        ability: 'FURIA GAMMA',
        abilityDesc: 'Gana 8 de furia por ataque y 6 por segundo por enemigo detectable en su alcance, hasta 3 enemigos. La furia aumenta el dano, no la cadencia. Con 50 ejecuta un salto de area a 2.25x alcance, aturde 0.65s y recarga 8s. Perder vidas no da furia.',
        niche: 'tanque cercano, aguante y control de grupos'
    },
    black_widow: {
        cost: 190,
        ability: 'SABOTAJE WIDOW',
        abilityDesc: 'Cada cuarto disparo descarga 55% de poder por escala de habilidad sobre el blanco y hasta 3 cercanos visibles en alcance. Inhibe curas, invocaciones y ordenes hasta 2 s, con 3 s de inmunidad posterior; no inhibe jefes ni frena movimiento. Conserva ruptura de armadura contra apoyos y veneno, sin marca ni stun propios.',
        niche: 'anti-soporte, detección y control eléctrico'
    },
    hawkeye: {
        cost: 180,
        ability: 'CARCAJ TÁCTICO',
        abilityDesc: 'Elige flechas explosivas, criogenicas o perforantes. Cada cuarto disparo causa +35% dano y refuerza la municion: explosion de 85 px, slow del 60% o penetracion del 80%. Cambiar de flecha conserva carga y recarga; no da disparos gratis.',
        niche: 'artillería adaptable de muy largo alcance'
    },
    black_panther: {
        cost: 320,
        ability: 'CARGA DE VIBRANIUM',
        abilityDesc: 'No ataca. Aura corta de dano alto. Tras preparar la red 9 s, seis ataques principales de aliados dentro del radio aumentan su bonus de aura un 50% durante 3 s. Recarga de 9 s desde la activacion. Moverlo o recolocarlo reinicia la red; aturdido no potencia ni carga.',
        niche: 'aura corta con sobrecarga por ataques aliados'
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
        abilityDesc: 'Redwing identifica una amenaza cada 2.4 s en reconocimiento: marca y revela durante 2 s para todos los aliados, sujeto a resistencias. Comparte deteccion a 165 px sin stun. Asalto golpea mas fuerte cada 1.65 s, sin revelar ni compartir deteccion. El dron opera fuera del alcance normal.',
        niche: 'reconocimiento cercano, marcado y apoyo aéreo'
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
