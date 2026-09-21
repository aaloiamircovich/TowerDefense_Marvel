import { getScaledSupportAura } from '../utils/HeroLevel.js';

export const VIBRANIUM_NETWORK = Object.freeze({ attacks: 6, duration: 3, cooldown: 9, powerMultiplier: 1.5 });

export function resetSupportAura(hero) {
    if (hero) hero.supportNetworkState = null;
}

function hasNetwork(hero) {
    return hero?.id === 'black_panther' && hero.config?.special?.supportAura?.type === 'damage';
}

function networkState(hero) {
    const deployed = Boolean(hero.game?.heroes?.includes(hero));
    let state = hero.supportNetworkState;
    // Moving or redeploying must not carry an active burst to a different formation.
    if (!state || !deployed || state.x !== hero.x || state.y !== hero.y) {
        state = { x: hero.x, y: hero.y, charge: 0, remaining: 0, cooldown: VIBRANIUM_NETWORK.cooldown };
        hero.supportNetworkState = state;
    }
    return state;
}

export function getEffectiveSupportAura(hero) {
    const aura = getScaledSupportAura(hero.config?.special?.supportAura, hero.level || hero.config?.level || 1, hero.config?.rarity || hero.rarity);
    if (aura) aura.power *= getSupportAuraPowerMultiplier(hero);
    return aura;
}

export function getSupportAuraPowerMultiplier(hero) {
    return hasNetwork(hero) && networkState(hero).remaining > 0 && !(hero.stunTimer > 0)
        ? VIBRANIUM_NETWORK.powerMultiplier : 1;
}

export function updateSupportAura(hero, dt) {
    if (!hasNetwork(hero)) return;
    const state = networkState(hero);
    state.remaining = Math.max(0, state.remaining - dt);
    state.cooldown = Math.max(0, state.cooldown - dt);
}

export function recordSupportAttack(attacker) {
    const allies = attacker.game?.heroes || [];
    if (!allies.includes(attacker) || attacker.isSupportAuraOnly?.() || attacker.stunTimer > 0) return;
    for (const source of allies) {
        if (source === attacker || !hasNetwork(source) || source.stunTimer > 0) continue;
        const state = networkState(source);
        if (state.cooldown > 0) continue;
        const aura = getEffectiveSupportAura(source);
        if (Math.hypot(source.x - attacker.x, source.y - attacker.y) > aura.range) continue;
        state.charge++;
        if (state.charge < VIBRANIUM_NETWORK.attacks) continue;
        state.charge = 0;
        state.remaining = VIBRANIUM_NETWORK.duration;
        state.cooldown = VIBRANIUM_NETWORK.cooldown;
        source.recordAbility?.();
    }
}

export function getSupportAuraDisplayState(hero) {
    if (!hasNetwork(hero)) return null;
    const state = networkState(hero);
    const power = Math.round(getEffectiveSupportAura(hero).power * 100);
    if (hero.stunTimer > 0) return { label: 'Red suspendida', progress: 0, ready: false };
    if (state.remaining > 0) return { label: `Sobrecarga +${power}% (${state.remaining.toFixed(1)} s)`, progress: state.remaining / VIBRANIUM_NETWORK.duration, ready: true };
    if (state.cooldown > 0) return { label: `Red: ${state.cooldown.toFixed(1)} s`, progress: 1 - state.cooldown / VIBRANIUM_NETWORK.cooldown, ready: false };
    return { label: `Red ${state.charge}/${VIBRANIUM_NETWORK.attacks}`, progress: state.charge / VIBRANIUM_NETWORK.attacks, ready: false };
}
