import fs from 'node:fs';

const HEROES_PATH = new URL('../data/heroes.json', import.meta.url);
const heroes = JSON.parse(fs.readFileSync(HEROES_PATH, 'utf8'));

const TARGET_DPS_BY_RARITY = {
    Common: 38,
    Rare: 50,
    Epic: 62,
    Legendary: 76,
    Mythic: 92,
    Secret: 112
};

const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--check');
const checkMode = process.argv.includes('--check');
const rows = [];

for (const hero of Object.values(heroes)) {
    if (hero.special?.supportAura?.type) continue;

    const targetDps = (TARGET_DPS_BY_RARITY[hero.rarity] || TARGET_DPS_BY_RARITY.Rare) * getUtilityFactor(hero);
    const critMultiplier = 1 + Number(hero.critChance ?? 5) / 100;
    const fireRate = Math.max(0.1, Number(hero.fireRate || 1));
    const currentDamage = Number(hero.damage || 0);
    const nextDamage = Math.max(1, Math.round(targetDps / (fireRate * critMultiplier)));
    const currentDps = currentDamage * fireRate * critMultiplier;
    const nextDps = nextDamage * fireRate * critMultiplier;

    rows.push({
        id: hero.id,
        rarity: hero.rarity,
        currentDamage,
        nextDamage,
        currentDps,
        nextDps,
        targetDps
    });

    hero.damage = nextDamage;
}

if (!dryRun) {
    fs.writeFileSync(HEROES_PATH, `${JSON.stringify(heroes, null, 2)}\n`);
}

const changed = rows.filter((row) => row.currentDamage !== row.nextDamage).length;
console.log(`Balance de heroes ${dryRun ? 'simulado' : 'aplicado'}: ${changed}/${rows.length} atacantes ajustados.`);

const medians = [];
for (const rarity of Object.keys(TARGET_DPS_BY_RARITY)) {
    const group = rows.filter((row) => row.rarity === rarity);
    if (!group.length) continue;
    const values = group.map((row) => Math.round(row.nextDps)).sort((a, b) => a - b);
    medians.push({ rarity, value: median(values) });
    console.log(`${rarity}: ${group.length} heroes | DPS ${values[0]}-${values.at(-1)} | mediana ${median(values)}`);
}

if (checkMode) {
    const brokenMedians = medians.filter((entry, index) => index > 0 && entry.value < medians[index - 1].value);
    if (changed > 0) {
        console.error('ERROR: hay heroes fuera del presupuesto de DPS por rareza. Ejecuta npm run balance:heroes para recalibrar.');
        process.exitCode = 1;
    }
    if (brokenMedians.length) {
        console.error(`ERROR: la mediana de DPS por rareza no es creciente en: ${brokenMedians.map((entry) => entry.rarity).join(', ')}`);
        process.exitCode = 1;
    }
}

function getUtilityFactor(hero) {
    if (hero.special?.economyOnHit) return 0.16;

    let factor = 1;
    if (hero.canSeeStealth || hero.special?.statModifiers?.detectStealth) factor -= 0.06;
    if (hero.range >= 260) factor -= 0.11;
    else if (hero.range >= 220) factor -= 0.07;
    else if (hero.range >= 190) factor -= 0.04;
    if (hero.range <= 90) factor += 0.12;
    else if (hero.range <= 110) factor += 0.06;
    if (hero.rangePattern) factor -= 0.05;

    const effects = hero.special?.attackEffects || [];
    factor -= Math.min(0.18, effects.length * 0.045);

    const projectile = hero.special?.projectileProfile || {};
    if (projectile.chainCount) factor -= Math.min(0.1, projectile.chainCount * 0.04);
    if (projectile.propagationCount) factor -= Math.min(0.1, projectile.propagationCount * 0.04);
    if (projectile.splashRadius) factor -= 0.06;
    if (projectile.armorPenetration) factor -= Math.min(0.08, projectile.armorPenetration * 0.18);

    const stats = hero.special?.statModifiers || {};
    factor -= Math.min(
        0.1,
        Number(stats.damagePct || 0) * 0.5
        + Number(stats.fireRatePct || 0) * 0.5
        + Number(stats.rangePct || 0) * 0.35
        + Number(stats.critChance || 0) / 200
    );

    return Math.max(0.58, Math.min(1.18, factor));
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}
