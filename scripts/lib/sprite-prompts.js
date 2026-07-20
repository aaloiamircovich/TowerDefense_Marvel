function buildPromptStyle(size = 96) {
    return [
        `${size}x${size} pixel art game sprite`,
        'transparent background',
        'top-down tower defense unit',
        'three-quarter RPG camera like a handheld monster-defense game',
        'clean readable silhouette',
        'limited palette with crisp outlines',
        'centered full body',
        'no text',
        'no UI',
        'no watermark'
    ].join(', ');
}

function validateSpriteSize(size) {
    if (!Number.isInteger(size) || size < 32 || size > 128) {
        throw new Error('Sprite prompt size must be an integer between 32 and 128');
    }
}

const animationFrameCount = 9;

const sizeNote = 'Keep the character inside the canvas with transparent pixels around the body.';

const atlasNote = 'The game atlas is safest up to 128x128, and 96x96 is the recommended quality target.';

export function flattenEnemies(enemiesData) {
    return Object.values(enemiesData || {}).flatMap((group) => Object.values(group || {}));
}

export function getEntityById(collection, id) {
    if (!id) return null;
    if (Array.isArray(collection)) return collection.find((item) => item.id === id);
    return collection?.[id] || Object.values(collection || {}).find((item) => item?.id === id) || null;
}

export function buildHeroSpritePrompts(hero, options = {}) {
    if (!hero?.id || !hero?.name) throw new Error('Hero prompt needs id and name');
    const size = options.size ?? 96;
    validateSpriteSize(size);
    const style = buildPromptStyle(size);

    const powerCue = [hero.category, hero.niche, hero.ability, hero.abilityDesc]
        .filter(Boolean)
        .join('; ');

    return {
        idle: [
            `${style}.`,
            `Subject: Marvel hero ${hero.name}.`,
            `Pose: idle stance facing south, ready to defend a city street.`,
            `Design cues: ${powerCue}.`,
            `Single frame only. ${sizeNote} ${atlasNote}`
        ].join(' '),
        attack: [
            `${animationFrameCount} frame shooting or attack animation, each frame is a separate ${size}x${size} pixel art sprite, transparent background.`,
            `Subject: Marvel hero ${hero.name}, same design and proportions in every frame.`,
            `Game use: tower defense attack animation, south-facing three-quarter RPG camera, centered pivot, no camera movement.`,
            `Action cues: ${powerCue}.`,
            `Make frames read clearly at small size, with anticipation, impact, and recovery. ${atlasNote} No text, no UI, no watermark.`
        ].join(' ')
    };
}

export function buildEnemySpritePrompts(enemy, options = {}) {
    if (!enemy?.id || !enemy?.name) throw new Error('Enemy prompt needs id and name');
    const size = options.size ?? 96;
    validateSpriteSize(size);
    const style = buildPromptStyle(size);

    const cue = [enemy.category, enemy.faction, enemy.archetype]
        .filter(Boolean)
        .join('; ');

    return {
        walk: [
            `${style}.`,
            `Subject: Marvel enemy ${enemy.name}.`,
            `Pose: walking or marching south-east along a tower defense path.`,
            `Design cues: ${cue}.`,
            `Single frame or short walk cycle. ${sizeNote} ${atlasNote}`
        ].join(' '),
        hit: [
            `Four to eight frame hit or damage reaction animation, each frame is a separate ${size}x${size} pixel art sprite, transparent background.`,
            `Subject: Marvel enemy ${enemy.name}, same design and proportions in every frame.`,
            `Design cues: ${cue}.`,
            'Small readable impact flash, no text, no UI, no watermark.'
        ].join(' ')
    };
}

export function formatPromptPack(label, prompts) {
    const lines = [`## ${label}`];
    for (const [name, prompt] of Object.entries(prompts)) {
        lines.push('', `### ${name}`, prompt);
    }
    return lines.join('\n');
}
