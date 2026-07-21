export const HERO_MAX_LEVEL = 100;
export const HERO_LEVEL_COST_BASE = 180;
export const HERO_LEVEL_COST_GROWTH = 1.35;
export const HERO_LEVEL_DAMAGE_STEP = 0.28;
export const SUPPORT_AURA_LEVEL_SCALE_CAP = 0.75;
export const SUPPORT_AURA_LEVEL_SCALE_STEP = SUPPORT_AURA_LEVEL_SCALE_CAP / (HERO_MAX_LEVEL - 1);

export function normalizeHeroLevel(level = 1) {
    return Math.max(1, Math.min(HERO_MAX_LEVEL, Math.floor(Number(level) || 1)));
}

export function getHeroLevelUpgradeSteps(currentLevel, amount = 1) {
    const level = normalizeHeroLevel(currentLevel);
    const requested = Math.max(1, Math.floor(Number(amount) || 1));
    return Math.max(0, Math.min(requested, HERO_MAX_LEVEL - level));
}

export function calculateHeroLevelCost(currentLevel, amount = 1) {
    const level = normalizeHeroLevel(currentLevel);
    const steps = getHeroLevelUpgradeSteps(level, amount);
    if (steps <= 0) return Infinity;

    let total = 0;
    for (let index = 0; index < steps; index++) {
        const rawCost = HERO_LEVEL_COST_BASE * Math.pow(HERO_LEVEL_COST_GROWTH, level + index - 1);
        total += Math.ceil(rawCost / 10) * 10;
    }
    return total;
}

export function getHeroDamageAtLevel(baseDamage, level = 1) {
    return Math.floor(Number(baseDamage || 0) * (1 + HERO_LEVEL_DAMAGE_STEP * (normalizeHeroLevel(level) - 1)));
}

export function getSupportAuraLevelScale(level = 1) {
    return 1 + Math.min(SUPPORT_AURA_LEVEL_SCALE_CAP, (normalizeHeroLevel(level) - 1) * SUPPORT_AURA_LEVEL_SCALE_STEP);
}

export function getScaledSupportAura(aura = null, level = 1) {
    if (!aura?.type) return null;
    return {
        ...aura,
        power: Number(aura.power || 0) * getSupportAuraLevelScale(level)
    };
}
