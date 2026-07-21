import fs from 'node:fs';
import path from 'node:path';
import { isOrthogonalPath } from '../src/utils/PathUtils.js';
import { DIRECTIONS, collectVisualSources } from '../src/rendering/SpriteAnimator.js';
import { buildBootstrapSource, readProjectData } from './lib/project-data.js';
import { EVOLUTION_CATALOG } from '../src/systems/EvolutionSystem.js';
import { SYNERGY_DEFINITIONS } from '../src/systems/TeamSynergySystem.js';
import { TERRAIN } from '../src/utils/TerrainRules.js';

const root = process.cwd();
const strictAssets = process.argv.includes('--strict-assets');
const errors = [];
const warnings = [];
const data = readProjectData(root);
const VALID_RARITIES = new Set(['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret']);

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
    const allowedHeroKeys = new Set(['id', 'name', 'category', 'rarity', 'cost', 'damage', 'range', 'fireRate', 'canSeeStealth', 'ability', 'abilityDesc', 'niche', 'sprite', 'visual', 'allowedTerrains', 'tags', 'formationRole', 'teamMetrics', 'terrainRole', 'special', 'evolutionId']);
    const allowedSpecialKeys = new Set(['statModifiers', 'attackEffects', 'projectileProfile', 'visualStyle', 'projectileColor']);
    const allowedSpecialStatKeys = new Set(['allowWater', 'cooldown', 'critChance', 'damagePct', 'detectStealth', 'fireRatePct', 'rangePct']);
    const allowedAttackEffectKeys = new Set(['chance', 'duration', 'power', 'type']);
    const allowedAttackEffectTypes = new Set(['armorBreak', 'bleed', 'burn', 'mark', 'slow', 'stun', 'web']);
    const allowedProjectileProfileKeys = new Set(['armorPenetration', 'chainCount', 'chainFactor', 'chainRange', 'splashFactor', 'splashRadius']);
    const allowedVisualStyles = new Set(['ballistic', 'blade', 'elemental', 'energy', 'explosive', 'fire', 'ice', 'impact', 'mystic', 'sonic', 'water', 'web', 'whip']);
    const validTags = new Set(['Avengers', 'Defenders', 'Guardianes', 'X-Men', 'Mutantes', 'Místico', 'Callejero', 'Wakanda', 'Tecnología', 'Cósmico', 'Espías', 'Oscuros', 'Marciales', 'Inhumanos', 'Atlánticos', 'Rivales']);
    const validRoles = new Set(['vanguard', 'support', 'artillery']);
    const enforcedTags = new Set(Object.keys(SYNERGY_DEFINITIONS));
    const validPlacementTerrains = new Set([TERRAIN.water, TERRAIN.grass, TERRAIN.mountain]);
    const validTerrainRoles = new Set(['grass', 'ground', 'high', 'flyer', 'aquatic', 'amphibious']);
    const heroesWithEvolution = Object.entries(heroes).filter(([, hero]) => hero.evolutionId);

    if (heroesWithEvolution.length > 0 && heroesWithEvolution.length !== Object.keys(heroes).length) {
        errors.push(`heroes.evolutionId debe activarse para todo el roster o para nadie (${heroesWithEvolution.length}/${Object.keys(heroes).length})`);
    }

    for (const [key, hero] of Object.entries(heroes)) {
        validateAllowedKeys(`heroes.${key}`, hero, allowedHeroKeys);
        requireText(hero.name, `heroes.${key}.name`);
        requireText(hero.category, `heroes.${key}.category`);
        requireText(hero.ability, `heroes.${key}.ability`);
        requireText(hero.abilityDesc, `heroes.${key}.abilityDesc`);
        requireText(hero.niche, `heroes.${key}.niche`);
        requirePositive(hero.cost, `heroes.${key}.cost`);
        requirePositive(hero.damage, `heroes.${key}.damage`);
        requirePositive(hero.range, `heroes.${key}.range`);
        requirePositive(hero.fireRate, `heroes.${key}.fireRate`);
        if (typeof hero.canSeeStealth !== 'boolean') errors.push(`heroes.${key}.canSeeStealth debe ser booleano`);
        if (!VALID_RARITIES.has(hero.rarity || 'Common')) {
            errors.push(`heroes.${key}.rarity debe ser Common, Rare, Epic, Legendary, Mythic o Secret`);
        }

        if (!Array.isArray(hero.allowedTerrains) || hero.allowedTerrains.length === 0) {
            errors.push(`heroes.${key}.allowedTerrains debe ser un array no vacio`);
        } else if (hero.allowedTerrains.some((terrain) => !validPlacementTerrains.has(terrain))) {
            errors.push(`heroes.${key}.allowedTerrains solo puede usar agua, pasto o montana`);
        }
        if (!validTerrainRoles.has(hero.terrainRole)) errors.push(`heroes.${key}.terrainRole no es valido`);

        validateAsset(hero.sprite, `heroes.${key}.sprite`);
        if (!hero.visual) errors.push(`heroes.${key}.visual es obligatorio`);
        else validateHeroVisual(key, hero.visual);
        if (!Array.isArray(hero.tags) || hero.tags.length < 1 || hero.tags.length > 2 || hero.tags.some((tag) => !enforcedTags.has(tag))) {
            errors.push(`heroes.${key}.tags contiene etiquetas no válidas`);
        }
        if (!validRoles.has(hero.formationRole)) errors.push(`heroes.${key}.formationRole no es válido`);
        for (const metric of ['damage', 'control', 'support', 'detection']) {
            const value = hero.teamMetrics?.[metric];
            if (!Number.isInteger(value) || value < 1 || value > 5) errors.push(`heroes.${key}.teamMetrics.${metric} debe estar entre 1 y 5`);
        }
        if (hero.special) validateHeroSpecial(key, hero.special, {
            allowedSpecialKeys,
            allowedSpecialStatKeys,
            allowedAttackEffectKeys,
            allowedAttackEffectTypes,
            allowedProjectileProfileKeys,
            allowedVisualStyles
        });

        if (hero.evolutionId) {
            if (!EVOLUTION_CATALOG[hero.evolutionId]) errors.push(`heroes.${key}.evolutionId referencia '${hero.evolutionId}', que no existe`);
            else if (EVOLUTION_CATALOG[hero.evolutionId].baseHeroId !== key) errors.push(`heroes.${key}.evolutionId no pertenece a este heroe`);
            if (knownIds.has(hero.evolutionId)) errors.push(`heroes.${key}.evolutionId no debe apuntar a un heroe base`);
        }
    }
}

function validateHeroSpecial(heroId, special, schema) {
    validateAllowedKeys(`heroes.${heroId}.special`, special, schema.allowedSpecialKeys);

    if (special.statModifiers) {
        validateAllowedKeys(`heroes.${heroId}.special.statModifiers`, special.statModifiers, schema.allowedSpecialStatKeys);
        for (const [key, value] of Object.entries(special.statModifiers)) {
            const label = `heroes.${heroId}.special.statModifiers.${key}`;
            if (key === 'allowWater' || key === 'detectStealth') {
                if (typeof value !== 'boolean') errors.push(`${label} debe ser booleano`);
            } else {
                requireFiniteNumber(value, label);
                if (['damagePct', 'fireRatePct', 'rangePct', 'cooldown'].includes(key) && (value < 0 || value > 1)) {
                    errors.push(`${label} debe estar entre 0 y 1`);
                }
                if (key === 'critChance' && (value < 0 || value > 100)) errors.push(`${label} debe estar entre 0 y 100`);
            }
        }
    }

    if (special.attackEffects) {
        if (!Array.isArray(special.attackEffects)) errors.push(`heroes.${heroId}.special.attackEffects debe ser un array`);
        else special.attackEffects.forEach((effect, index) => {
            const label = `heroes.${heroId}.special.attackEffects.${index}`;
            validateAllowedKeys(label, effect, schema.allowedAttackEffectKeys);
            if (!schema.allowedAttackEffectTypes.has(effect.type)) errors.push(`${label}.type no es valido`);
            if (!isUnitNumber(effect.chance)) errors.push(`${label}.chance debe estar entre 0 y 1`);
            requireNonNegativeNumber(effect.duration, `${label}.duration`);
            requireNonNegativeNumber(effect.power, `${label}.power`);
        });
    }

    if (special.projectileProfile) {
        validateAllowedKeys(`heroes.${heroId}.special.projectileProfile`, special.projectileProfile, schema.allowedProjectileProfileKeys);
        for (const [key, value] of Object.entries(special.projectileProfile)) {
            const label = `heroes.${heroId}.special.projectileProfile.${key}`;
            if (key === 'chainCount') {
                if (!Number.isInteger(value) || value < 0) errors.push(`${label} debe ser un entero no negativo`);
            } else {
                requireNonNegativeNumber(value, label);
                if (['armorPenetration', 'chainFactor', 'splashFactor'].includes(key) && value > 1) errors.push(`${label} debe estar entre 0 y 1`);
            }
        }
    }

    if (special.visualStyle && !schema.allowedVisualStyles.has(special.visualStyle)) {
        errors.push(`heroes.${heroId}.special.visualStyle no es valido`);
    }
    if (special.projectileColor && !/^#[0-9a-fA-F]{6}$/.test(special.projectileColor)) {
        errors.push(`heroes.${heroId}.special.projectileColor debe ser color hex #RRGGBB`);
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
    const validArchetypes = new Set(['soldier', 'runner', 'tank', 'shield', 'stealth', 'flying', 'summoner', 'support', 'commander', 'phaser', 'boss']);
    const phasedBosses = new Set(['loki', 'ultron_prime', 'killmonger', 'magneto', 'thanos_final']);
    const allowedEnemyKeys = new Set(['id', 'name', 'hp', 'speed', 'reward', 'sprite', 'faction', 'archetype', 'threat', 'armor', 'barrierRatio', 'stealth', 'flying', 'category', 'summonId', 'summonLimit', 'healPower', 'commandPower', 'behaviorCooldown', 'statusResistance', 'statusResistances', 'resistances', 'immuneToSlow', 'immuneToStun', 'immuneToKnockback', 'isBoss', 'isFinalBoss', 'phases', 'visual']);
    for (const group of ['normal', 'bosses']) {
        if (!enemies[group] || typeof enemies[group] !== 'object') {
            errors.push(`enemies.${group} no existe`);
            continue;
        }

        validateRecordIds(`enemies.${group}`, enemies[group]);
        for (const [key, enemy] of Object.entries(enemies[group])) {
            validateAllowedKeys(`enemies.${group}.${key}`, enemy, allowedEnemyKeys);
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
    if (Object.keys(items).length < 30) errors.push('items necesita al menos 30 objetos para la Fase 11');
    const validSlots = new Set(['weapon', 'armor', 'artifact']);
    const allowedItemKeys = new Set(['id', 'name', 'desc', 'price', 'tier', 'rarity', 'slot', 'set', 'effects', 'icon']);
    for (const [key, item] of Object.entries(items)) {
        validateAllowedKeys(`items.${key}`, item, allowedItemKeys);
        requireText(item.name, `items.${key}.name`);
        requirePositive(item.price, `items.${key}.price`);
        requirePositive(item.tier, `items.${key}.tier`);
        if (!VALID_RARITIES.has(item.rarity || 'Common')) {
            errors.push(`items.${key}.rarity debe ser Common, Rare, Epic, Legendary, Mythic o Secret`);
        }
        if (!validSlots.has(item.slot)) errors.push(`items.${key}.slot no es valido`);
        requireText(item.set, `items.${key}.set`);
        if (!item.effects || typeof item.effects !== 'object' || Array.isArray(item.effects)) {
            errors.push(`items.${key}.effects debe ser un objeto`);
        }
        if (item.icon) validateAsset(item.icon, `items.${key}.icon`);
    }
}

function validateLevels(levels) {
    if (!Array.isArray(levels) || levels.length === 0) {
        errors.push('levels debe ser un array no vacio');
        return;
    }

    validateUniqueIds('levels', levels);
    const allowedLevelKeys = new Set(['id', 'name', 'description', 'difficulty', 'path', 'alternatePaths', 'theme', 'mission', 'rendering', 'thumbnail']);
    const allowedRenderingKeys = new Set(['style', 'camera', 'source', 'tileSize', 'targetSpriteSize']);
    const allowedThemeKeys = new Set(['id', 'label', 'accent', 'brief']);
    const allowedMissionKeys = new Set(['operation', 'speaker', 'briefing', 'dialogue', 'mechanic', 'objectives']);
    const allowedMechanicKeys = new Set(['type', 'label', 'description', 'status', 'convoyStart', 'convoyEnd', 'door', 'turret', 'nodes', 'landmarks', 'portals', 'jumpDistance', 'cycle', 'vegetation', 'prisoner']);
    const allowedObjectiveKeys = new Set(['id', 'label', 'description', 'metric', 'target', 'reward']);
    for (const level of levels) {
        validateAllowedKeys(`levels.${level.id}`, level, allowedLevelKeys);
        if (level.rendering) validateAllowedKeys(`levels.${level.id}.rendering`, level.rendering, allowedRenderingKeys);
        if (level.theme) validateAllowedKeys(`levels.${level.id}.theme`, level.theme, allowedThemeKeys);
        if (level.mission) validateAllowedKeys(`levels.${level.id}.mission`, level.mission, allowedMissionKeys);
        if (level.mission?.mechanic) validateAllowedKeys(`levels.${level.id}.mission.mechanic`, level.mission.mechanic, allowedMechanicKeys);
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
                validateAllowedKeys(`levels.${level.id}.mission.objectives.${objective.id}`, objective, allowedObjectiveKeys);
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

function validateAllowedKeys(label, value, allowedKeys) {
    Object.keys(value || {}).forEach((key) => {
        if (!allowedKeys.has(key)) errors.push(`${label}.${key} no esta permitido por el schema`);
    });
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

function requireFiniteNumber(value, label) {
    if (!Number.isFinite(value)) errors.push(`${label} debe ser un numero finito`);
}

function requireNonNegativeNumber(value, label) {
    if (!Number.isFinite(value) || value < 0) errors.push(`${label} debe ser un numero no negativo`);
}

function isUnitNumber(value) {
    return Number.isFinite(value) && value >= 0 && value <= 1;
}
