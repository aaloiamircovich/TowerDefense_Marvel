export function getSpecialCooldownReduction(hero) {
    return clampReduction(hero?.config?.special?.statModifiers?.cooldown, 0.5);
}

export function applyCooldownReductions(hero, base, levelReduction = 0) {
    const progression = hero?.game?.progression?.getHeroBonuses?.(hero.id);
    const synergy = hero?.game?.teamSynergy?.getAbilityModifiers?.(hero);
    return base
        * (1 - clampReduction(levelReduction, 0.5))
        * (1 - clampReduction(progression?.cooldown, 0.75))
        * (1 - clampReduction(synergy?.cooldown, 0.75))
        * (1 - getSpecialCooldownReduction(hero));
}

function clampReduction(value, max) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(max, numeric));
}
