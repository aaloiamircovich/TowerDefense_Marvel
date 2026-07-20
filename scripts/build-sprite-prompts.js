import fs from 'node:fs';
import path from 'node:path';
import {
    buildEnemySpritePrompts,
    buildHeroSpritePrompts,
    flattenEnemies,
    formatPromptPack,
    getEntityById
} from './lib/sprite-prompts.js';

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8'));
}

function getArg(name) {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : null;
}

function hasFlag(name) {
    return process.argv.includes(name);
}

function usage() {
    return [
        'Usage:',
        '  node scripts/build-sprite-prompts.js --hero iron_man --size 96',
        '  node scripts/build-sprite-prompts.js --enemy hydra_soldier --size 96',
        '  node scripts/build-sprite-prompts.js --all-heroes --out docs/generated-hero-prompts.md',
        '  node scripts/build-sprite-prompts.js --all-enemies --out docs/generated-enemy-prompts.md'
    ].join('\n');
}

const heroes = readJson('data/heroes.json');
const enemies = flattenEnemies(readJson('data/enemies.json'));
const packs = [];

const heroId = getArg('--hero');
const enemyId = getArg('--enemy');
const size = Number.parseInt(getArg('--size') || '96', 10);

if (heroId) {
    const hero = getEntityById(heroes, heroId);
    if (!hero) throw new Error(`No existe el heroe ${heroId}`);
    packs.push(formatPromptPack(`${hero.id} - ${hero.name}`, buildHeroSpritePrompts(hero, { size })));
}

if (enemyId) {
    const enemy = getEntityById(enemies, enemyId);
    if (!enemy) throw new Error(`No existe el enemigo ${enemyId}`);
    packs.push(formatPromptPack(`${enemy.id} - ${enemy.name}`, buildEnemySpritePrompts(enemy, { size })));
}

if (hasFlag('--all-heroes')) {
    for (const hero of Object.values(heroes)) {
        packs.push(formatPromptPack(`${hero.id} - ${hero.name}`, buildHeroSpritePrompts(hero, { size })));
    }
}

if (hasFlag('--all-enemies')) {
    for (const enemy of enemies) {
        packs.push(formatPromptPack(`${enemy.id} - ${enemy.name}`, buildEnemySpritePrompts(enemy, { size })));
    }
}

if (!packs.length) {
    console.log(usage());
    process.exitCode = 1;
} else {
    const output = `${packs.join('\n\n')}\n`;
    const outPath = getArg('--out');
    if (outPath) {
        const absoluteOut = path.resolve(process.cwd(), outPath);
        fs.mkdirSync(path.dirname(absoluteOut), { recursive: true });
        fs.writeFileSync(absoluteOut, output, 'utf8');
        console.log(`Prompts escritos en ${outPath}`);
    } else {
        process.stdout.write(output);
    }
}
