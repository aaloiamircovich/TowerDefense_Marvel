import fs from 'node:fs';
import path from 'node:path';
import { isOrthogonalPath } from '../src/utils/PathUtils.js';
import { buildBootstrapSource, readProjectData } from './lib/project-data.js';

const root = process.cwd();
const strictAssets = process.argv.includes('--strict-assets');
const errors = [];
const warnings = [];
const data = readProjectData(root);

validateHeroes(data.heroes);
validateEnemies(data.enemies);
validateItems(data.items);
validateLevels(data.levels);
validateWaves(data.waves, data.enemies);
validateBootstrap(data);

for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const error of errors) console.error(`ERROR: ${error}`);

console.log(`Validacion terminada: ${errors.length} errores, ${warnings.length} advertencias.`);
if (errors.length > 0) process.exitCode = 1;

function validateHeroes(heroes) {
    validateRecordIds('heroes', heroes);
    const knownIds = new Set(Object.keys(heroes));

    for (const [key, hero] of Object.entries(heroes)) {
        requireText(hero.name, `heroes.${key}.name`);
        requirePositive(hero.cost, `heroes.${key}.cost`);
        requirePositive(hero.damage, `heroes.${key}.damage`);
        requirePositive(hero.range, `heroes.${key}.range`);
        requirePositive(hero.fireRate, `heroes.${key}.fireRate`);

        if (!Array.isArray(hero.allowedTerrains) || hero.allowedTerrains.length === 0) {
            errors.push(`heroes.${key}.allowedTerrains debe ser un array no vacio`);
        }

        validateAsset(hero.sprite, `heroes.${key}.sprite`);

        if (hero.evolutionId && !knownIds.has(hero.evolutionId)) {
            warnings.push(`heroes.${key}.evolutionId referencia '${hero.evolutionId}', que aun no existe`);
        }
    }
}

function validateEnemies(enemies) {
    for (const group of ['normal', 'bosses']) {
        if (!enemies[group] || typeof enemies[group] !== 'object') {
            errors.push(`enemies.${group} no existe`);
            continue;
        }

        validateRecordIds(`enemies.${group}`, enemies[group]);
        for (const [key, enemy] of Object.entries(enemies[group])) {
            requireText(enemy.name, `enemies.${group}.${key}.name`);
            requirePositive(enemy.hp, `enemies.${group}.${key}.hp`);
            requirePositive(enemy.speed, `enemies.${group}.${key}.speed`);
            if (enemy.reward !== 0) requirePositive(enemy.reward, `enemies.${group}.${key}.reward`);
            if (enemy.sprite) validateAsset(enemy.sprite, `enemies.${group}.${key}.sprite`);
        }
    }
}

function validateItems(items) {
    validateRecordIds('items', items);
    for (const [key, item] of Object.entries(items)) {
        requireText(item.name, `items.${key}.name`);
        requirePositive(item.price, `items.${key}.price`);
        requirePositive(item.tier, `items.${key}.tier`);
        if (item.icon) validateAsset(item.icon, `items.${key}.icon`);
    }
}

function validateLevels(levels) {
    if (!Array.isArray(levels) || levels.length === 0) {
        errors.push('levels debe ser un array no vacio');
        return;
    }

    validateUniqueIds('levels', levels);
    for (const level of levels) {
        requireText(level.name, `levels.${level.id}.name`);
        if (!isOrthogonalPath(level.path)) errors.push(`levels.${level.id}.path contiene segmentos diagonales o puntos invalidos`);
        if (!level.theme?.id) errors.push(`levels.${level.id}.theme.id es obligatorio`);
    }
}

function validateWaves(waves, enemies) {
    if (!Array.isArray(waves)) {
        errors.push('waves debe ser un array');
        return;
    }

    const enemyIds = new Set([...Object.keys(enemies.normal || {}), ...Object.keys(enemies.bosses || {})]);
    const numbers = new Set();

    for (const wave of waves) {
        if (numbers.has(wave.waveNumber)) errors.push(`waves repite waveNumber ${wave.waveNumber}`);
        numbers.add(wave.waveNumber);

        if (!Array.isArray(wave.groups) || wave.groups.length === 0) {
            errors.push(`waves.${wave.waveNumber}.groups debe ser un array no vacio`);
            continue;
        }

        for (const group of wave.groups) {
            if (!enemyIds.has(group.type)) errors.push(`waves.${wave.waveNumber} referencia enemigo inexistente '${group.type}'`);
            requirePositive(group.count, `waves.${wave.waveNumber}.${group.type}.count`);
            requirePositive(group.interval, `waves.${wave.waveNumber}.${group.type}.interval`);
        }
    }
}

function validateBootstrap(projectData) {
    const file = path.join(root, 'data', 'bootstrapData.js');
    const expected = buildBootstrapSource(projectData);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (current !== expected) errors.push('data/bootstrapData.js esta desactualizado; ejecuta npm run build:data');
}

function validateRecordIds(label, record) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
        errors.push(`${label} debe ser un objeto`);
        return;
    }

    for (const [key, value] of Object.entries(record)) {
        if (value.id !== key) errors.push(`${label}.${key}.id debe ser '${key}'`);
    }
}

function validateUniqueIds(label, values) {
    const seen = new Set();
    for (const value of values) {
        if (!value.id) errors.push(`${label} contiene un elemento sin id`);
        else if (seen.has(value.id)) errors.push(`${label} repite id '${value.id}'`);
        seen.add(value.id);
    }
}

function validateAsset(assetPath, label) {
    if (!assetPath || !fs.existsSync(path.resolve(root, assetPath))) {
        const message = `${label} no existe: ${assetPath || '(vacio)'}`;
        if (strictAssets) errors.push(message);
        else warnings.push(message);
    }
}

function requireText(value, label) {
    if (typeof value !== 'string' || value.trim() === '') errors.push(`${label} debe ser texto no vacio`);
}

function requirePositive(value, label) {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${label} debe ser un numero positivo`);
}
