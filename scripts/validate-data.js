import fs from 'node:fs';
import path from 'node:path';
import { isOrthogonalPath } from '../src/utils/PathUtils.js';
import { DIRECTIONS, collectVisualSources } from '../src/rendering/SpriteAnimator.js';
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
validateSpriteAtlas(data.heroes);
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
        if (hero.visual) validateHeroVisual(key, hero.visual);

        if (hero.evolutionId && !knownIds.has(hero.evolutionId)) {
            warnings.push(`heroes.${key}.evolutionId referencia '${hero.evolutionId}', que aun no existe`);
        }
    }
}

function validateHeroVisual(heroId, visual) {
    requirePositive(visual.size, `heroes.${heroId}.visual.size`);
    requirePositive(visual.attack?.fps, `heroes.${heroId}.visual.attack.fps`);

    if (!visual.anchor || !isUnitNumber(visual.anchor.x) || !isUnitNumber(visual.anchor.y)) {
        errors.push(`heroes.${heroId}.visual.anchor debe tener x/y entre 0 y 1`);
    }

    for (const direction of DIRECTIONS) {
        if (!visual.idle?.[direction]) errors.push(`heroes.${heroId}.visual.idle.${direction} es obligatorio`);
    }

    if (!Array.isArray(visual.attack?.frames) || visual.attack.frames.length < 2) {
        errors.push(`heroes.${heroId}.visual.attack.frames necesita al menos 2 frames`);
    }

    for (const source of collectVisualSources(visual)) {
        validateAsset(source, `heroes.${heroId}.visual`);
    }
}

function validateEnemies(enemies) {
    const validArchetypes = new Set(['soldier', 'runner', 'tank', 'shield', 'stealth', 'flying', 'summoner', 'support', 'boss']);
    const phasedBosses = new Set(['loki', 'ultron_prime', 'killmonger', 'magneto', 'thanos_final']);
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
            if (group === 'normal') {
                requireText(enemy.faction, `enemies.${group}.${key}.faction`);
                if (!validArchetypes.has(enemy.archetype)) errors.push(`enemies.${group}.${key}.archetype no es valido`);
                if (!Number.isInteger(enemy.threat) || enemy.threat < 1 || enemy.threat > 5) {
                    errors.push(`enemies.${group}.${key}.threat debe estar entre 1 y 5`);
                }
            }
            if (phasedBosses.has(key)) {
                requireText(enemy.faction, `enemies.${group}.${key}.faction`);
                if (!Array.isArray(enemy.phases) || enemy.phases.length < 2) {
                    errors.push(`enemies.${group}.${key}.phases necesita al menos 2 fases`);
                }
            }
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
        requireText(level.mission?.operation, `levels.${level.id}.mission.operation`);
        requireText(level.mission?.briefing, `levels.${level.id}.mission.briefing`);
        requireText(level.mission?.mechanic?.label, `levels.${level.id}.mission.mechanic.label`);
        if (!Array.isArray(level.mission?.objectives) || level.mission.objectives.length < 2) {
            errors.push(`levels.${level.id}.mission.objectives necesita al menos dos objetivos`);
        } else {
            level.mission.objectives.forEach((objective) => {
                requireText(objective.id, `levels.${level.id}.mission.objectives.id`);
                requireText(objective.metric, `levels.${level.id}.mission.objectives.${objective.id}.metric`);
                requirePositive(objective.target, `levels.${level.id}.mission.objectives.${objective.id}.target`);
                requirePositive(objective.reward, `levels.${level.id}.mission.objectives.${objective.id}.reward`);
            });
        }
        for (const [index, alternatePath] of (level.alternatePaths || []).entries()) {
            if (!isOrthogonalPath(alternatePath)) errors.push(`levels.${level.id}.alternatePaths.${index} no es ortogonal`);
        }
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

function validateSpriteAtlas(heroes) {
    const file = path.join(root, 'data', 'sprite-atlas.js');
    if (!fs.existsSync(file)) {
        errors.push('data/sprite-atlas.js no existe');
        return;
    }
    try {
        const source = fs.readFileSync(file, 'utf8');
        const atlas = JSON.parse(source.replace(/^window\.__MARVEL_TD_ATLAS__\s*=\s*/, '').replace(/;\s*$/, ''));
        validateAsset(atlas.image, 'spriteAtlas.image');
        for (const [heroId, hero] of Object.entries(heroes)) {
            if (!hero.visual) continue;
            for (const visualSource of collectVisualSources(hero.visual)) {
                if (!atlas.frames?.[visualSource]) errors.push(`spriteAtlas no contiene ${heroId}: ${visualSource}`);
            }
        }
    } catch (error) {
        errors.push(`data/sprite-atlas.js no es valido: ${error.message}`);
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

function isUnitNumber(value) {
    return Number.isFinite(value) && value >= 0 && value <= 1;
}
