import { SET_BONUSES } from '../systems/ItemEffectSystem.js';

export function buildShopItemInsight(item = {}, summary = null) {
    const effects = item.effects || {};
    const reasons = [];
    const add = (condition, label) => {
        if (condition && !reasons.includes(label)) reasons.push(label);
    };

    add(effects.detectStealth && (summary?.stealthCount > 0 || (summary?.roles || []).includes('stealth')), 'cubre sigilo');
    add((effects.armorPenetration || effects.armorBreakChance || effects.armorDamagePct) && (summary?.armoredCount > 0 || summary?.barrierCount > 0 || (summary?.roles || []).some((role) => ['tank', 'shield'].includes(role))), 'rompe blindaje');
    add((effects.slowChance || effects.stunChance) && ((summary?.roles || []).includes('runner') || Number(summary?.fastest || 0) >= 90), 'frena corredores');
    add((effects.damagePct || effects.fireRatePct || effects.critChance || effects.critDamageBonus || effects.consecutiveDamagePct || effects.bossDamagePct) && (summary?.hasBoss || Number(summary?.pressureScore || 0) >= 16), 'sube DPS');
    add((effects.chainCount || effects.splashRadius) && Number(summary?.total || 0) >= 8, 'limpia grupos');
    add(effects.rangePct && ((summary?.roles || []).includes('flying') || Number(summary?.fastest || 0) >= 90), 'mejora cobertura');
    add(effects.allowWater || effects.allowGrass || effects.allowMountain, 'abre posiciones');
    add(effects.onHitCredit || effects.onHitCreditPct, 'economia por impacto');
    add(effects.burnChance || effects.poisonChance || effects.curseChance || effects.statusDamagePct, 'escala con estados');
    add(effects.lowLifeDamagePct || effects.lowLifeFireRatePct, 'seguro de base');

    const familyName = SET_BONUSES[item.set]?.name || item.set || 'sin familia';
    if (reasons.length < 3 && item.set) reasons.push(`familia ${familyName}`);
    const tone = reasons.some((reason) => ['cubre sigilo', 'rompe blindaje', 'frena corredores', 'sube DPS'].includes(reason))
        ? 'counter'
        : item.tier >= 3 ? 'power' : 'utility';
    return {
        tone,
        label: reasons[0] || 'mejora versatil',
        reasons: reasons.slice(0, 3),
        familyName,
        setName: familyName
    };
}

export function buildShopSetProgress(item = {}, ownedItemIds = [], equippedItems = {}, itemDatabase = {}) {
    return null;
}
