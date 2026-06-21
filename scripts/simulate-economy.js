import fs from 'node:fs';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));

const utility = {
    iron_man: 1.25, spiderman: 1.3, capitan_america: 1.35, thor: 1.55, doctor_strange: 1.5,
    groot: 1.35, scarlet_witch: 1.3, storm: 1.25, black_widow: 1.2, hawkeye: 1.2
};

const ranking = Object.values(heroes).map((hero) => {
    const critMultiplier = 1 + (hero.critChance || 5) / 100;
    const dps = hero.damage * hero.fireRate * critMultiplier;
    const tacticalPower = dps * (1 + hero.range / 650) * (utility[hero.id] || 1);
    return { name: hero.name, cost: hero.cost, power: tacticalPower, efficiency: tacticalPower / hero.cost };
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

if (missionProjection[0] < 800 || missionProjection[4] < 1800) {
    console.error('ERROR: la economia de mision no permite una segunda decision temprana.');
    process.exitCode = 1;
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
