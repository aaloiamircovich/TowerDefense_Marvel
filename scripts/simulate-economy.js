import fs from 'node:fs';
import { aggregateItemEffects } from '../src/systems/ItemEffectSystem.js';
import { analyzeTeam, getHeroTeamEffects } from '../src/systems/TeamSynergySystem.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));

const utility = {
    iron_man: 1.25, spiderman: 1.3, capitan_america: 1.35, thor: 1.55, doctor_strange: 1.5,
    groot: 1.35, scarlet_witch: 1.3, storm: 1.25,
    hulk: 2.25, black_widow: 1.2, hawkeye: 1.35, black_panther: 1.55, vision: 1.6, falcon: 1.55,
    captain_marvel: 1.45, star_lord: 1.4, groot: 1.9, gamora: 1.4, silver_surfer: 1.75
};

const ranking = Object.values(heroes).map((hero) => {
    const critMultiplier = 1 + (hero.critChance || 5) / 100;
    const dps = hero.damage * hero.fireRate * critMultiplier;
    const tacticalPower = dps * (1 + hero.range / 650) * (utility[hero.id] || 1);
    return { id: hero.id, name: hero.name, cost: hero.cost, power: tacticalPower, efficiency: tacticalPower / hero.cost };
}).sort((a, b) => b.efficiency - a.efficiency);

const tierPrices = Object.values(items).reduce((groups, item) => {
    groups[item.tier] ||= [];
    groups[item.tier].push(item.price);
    return groups;
}, {});

let missionCredits = 650;
const missionProjection = [];
for (let wave = 1; wave <= 10; wave++) {
    const enemyCount = 7 + Math.floor(wave * 0.55);
    missionCredits += enemyCount * (10 + wave * 0.4) + 110 + wave * 24;
    missionProjection.push(Math.round(missionCredits));
}

console.log('Simulacion de economia Marvel TD');
console.log(`Eficiencia mediana: ${median(ranking.map((hero) => hero.efficiency)).toFixed(3)}`);
console.log(`Top eficiencia: ${ranking.slice(0, 3).map((hero) => hero.name).join(', ')}`);
console.log(`Menor eficiencia: ${ranking.slice(-3).map((hero) => hero.name).join(', ')}`);
console.log(`Creditos proyectados tras oleadas 1/5/10: ${missionProjection[0]} / ${missionProjection[4]} / ${missionProjection[9]}`);
console.log(`Precios medianos por tier: ${Object.entries(tierPrices).map(([tier, prices]) => `T${tier}=$${median(prices)}`).join(' | ')}`);

const slots = {
    weapon: Object.values(items).filter((item) => item.slot === 'weapon'),
    armor: Object.values(items).filter((item) => item.slot === 'armor'),
    artifact: Object.values(items).filter((item) => item.slot === 'artifact')
};
const builds = slots.weapon.flatMap((weapon) => slots.armor.flatMap((armor) => slots.artifact.map((artifact) => {
    const effects = aggregateItemEffects([weapon, armor, artifact]);
    const power = (1 + (effects.damagePct || 0))
        * (1 + (effects.fireRatePct || 0))
        * (1 + (effects.rangePct || 0) * 0.4)
        * (1 + (effects.critChance || 0) / 100)
        + (effects.armorPenetration || 0) * 0.2;
    return { ids: [weapon.id, armor.id, artifact.id], power };
})));
builds.sort((a, b) => b.power - a.power);
console.log(`Builds de tres ranuras simuladas: ${builds.length}`);
console.log(`Mayor multiplicador estimado: ${builds[0].power.toFixed(2)} (${builds[0].ids.join(' + ')})`);

const phase12Ids = ['hulk', 'black_widow', 'hawkeye', 'black_panther', 'vision', 'falcon'];
const phase12 = ranking.filter((hero) => phase12Ids.includes(hero.id));
const phase12Efficiencies = phase12.map((hero) => hero.efficiency);
console.log(`Refuerzos Avengers: ${phase12.map((hero) => `${hero.name} ${hero.efficiency.toFixed(3)}`).join(' | ')}`);
const phase14Ids = ['captain_marvel', 'star_lord', 'groot', 'gamora', 'silver_surfer'];
const phase14 = ranking.filter((hero) => phase14Ids.includes(hero.id));
const phase14Efficiencies = phase14.map((hero) => hero.efficiency);
console.log(`Expansión cósmica: ${phase14.map((hero) => `${hero.name} ${hero.efficiency.toFixed(3)}`).join(' | ')}`);

const readyHeroes = Object.values(heroes).filter((hero) => hero.visual);
const teamCombinations = combinations(readyHeroes, 6).map((team) => {
    const snapshot = analyzeTeam(team);
    const multiplier = team.reduce((sum, hero) => {
        const effects = getHeroTeamEffects(hero, team);
        return sum + (1 + (effects.damagePct || 0))
            * (1 + (effects.fireRatePct || 0))
            * (1 + (effects.rangePct || 0) * 0.4)
            * (1 + (effects.critChance || 0) / 100);
    }, 0) / team.length;
    return { ids: team.map((hero) => hero.id), multiplier, versatile: snapshot.versatile };
}).sort((a, b) => b.multiplier - a.multiplier);
const bestTeam = teamCombinations[0];
const competitiveTeams = teamCombinations.filter((team) => team.multiplier >= bestTeam.multiplier * 0.94);
const competitiveMixed = competitiveTeams.filter((team) => team.versatile);
console.log(`Equipos de seis simulados: ${teamCombinations.length} · techo x${bestTeam.multiplier.toFixed(2)} · competitivos ${competitiveTeams.length} (${competitiveMixed.length} mixtos)`);

if (missionProjection[0] < 800 || missionProjection[4] < 1800) {
    console.error('ERROR: la economia de mision no permite una segunda decision temprana.');
    process.exitCode = 1;
}
if (builds[0].power > 2.25) {
    console.error('ERROR: una combinacion de objetos supera el presupuesto de poder 2.25.');
    process.exitCode = 1;
}
if (Math.min(...phase12Efficiencies) < 0.2 || Math.max(...phase12Efficiencies) > 0.42) {
    console.error('ERROR: un refuerzo Avengers queda fuera del rango de eficiencia 0.20-0.42.');
    process.exitCode = 1;
}
if (Math.min(...phase14Efficiencies) < 0.2 || Math.max(...phase14Efficiencies) > 0.42) {
    console.error('ERROR: un héroe cósmico queda fuera del rango de eficiencia 0.20-0.42.');
    process.exitCode = 1;
}
if (bestTeam.multiplier > 1.3 || competitiveTeams.length < 8 || competitiveMixed.length < 3) {
    console.error('ERROR: las sinergias reducen demasiado la variedad competitiva.');
    process.exitCode = 1;
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function combinations(values, size, start = 0, selected = [], result = []) {
    if (selected.length === size) {
        result.push([...selected]);
        return result;
    }
    for (let index = start; index <= values.length - (size - selected.length); index++) {
        selected.push(values[index]);
        combinations(values, size, index + 1, selected, result);
        selected.pop();
    }
    return result;
}
