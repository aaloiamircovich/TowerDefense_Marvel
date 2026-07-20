export const STARS_PER_LEVEL_UNLOCK = 25;

export function getLevelUnlockRequirement(index = 0) {
    return Math.max(0, Number(index) || 0) * STARS_PER_LEVEL_UNLOCK;
}

export function isLevelUnlockedByStars(index = 0, stars = 0) {
    return Math.max(0, Number(stars) || 0) >= getLevelUnlockRequirement(index);
}

export function getFixedDifficultyKey(level = {}) {
    const difficulty = String(level.difficulty || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (difficulty.includes('facil')) return 'easy';
    if (difficulty.includes('normal') || difficulty.includes('media')) return 'normal';
    return 'hard';
}
