import { getScaledSupportAura } from '../utils/HeroLevel.js';

export const VIBRANIUM_NETWORK = Object.freeze({ attacks: 6, duration: 3, cooldown: 9, powerMultiplier: 1.5 });
export const PYM_LINK = Object.freeze({ rest: 6, duration: 3, powerMultiplier: 2 });
export const MENTAL_LINK = Object.freeze({ budgetMultiplier: 10 / 3, perAllyMultiplier: 2 });

export function resetSupportAura(hero) {
    if (hero) {
        hero.supportNetworkState = null;
        hero.supportPulseState = null;
    }
}

function auraConfig(hero) {
    const config = hero.config || hero;
    return config.special?.supportAura || config.supportAura;
}

function isCadenceSupport(hero, id) {
    return (hero.id || hero.config?.id) === id && auraConfig(hero)?.type === 'fireRate';
}

function pulseState(hero) {
    let state = hero.supportPulseState;
    if (!state || !hero.game?.heroes?.includes(hero) || state.x !== hero.x || state.y !== hero.y) {
        state = { x: hero.x, y: hero.y, elapsed: 0 };
        hero.supportPulseState = state;
    }
    return state;
}

function scaledAura(hero, level = hero.level || hero.config?.level || 1) {
    return getScaledSupportAura(auraConfig(hero), level, hero.config?.rarity || hero.rarity);
}

export function getMentalLinks(hero, level = hero.level || hero.config?.level || 1) {
    if (!isCadenceSupport(hero, 'profesor_x') || hero.stunTimer > 0 || !hero.game?.heroes?.includes(hero)) return [];
    const radius = scaledAura(hero, level).range;
    // Count deployed attackers, not their effective stats: aura evaluation must not recurse.
    return hero.game.heroes.filter((ally) => ally !== hero && !auraConfig(ally)?.type && !(ally.stunTimer > 0)
        && Math.hypot(hero.x - ally.x, hero.y - ally.y) <= radius);
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

export function getEffectiveSupportAura(hero, { level = hero.level || hero.config?.level || 1, recipient = null } = {}) {
    const aura = scaledAura(hero, level);
    if (recipient && isCadenceSupport(hero, 'profesor_x') && !getMentalLinks(hero, level).includes(recipient)) return null;
    if (aura) aura.power *= getSupportAuraPowerMultiplier(hero, level);
    return aura;
}

export function getSupportAuraPowerMultiplier(hero, level = hero.level || hero.config?.level || 1) {
    if (isCadenceSupport(hero, 'wasp')) {
        if (!hero.game?.heroes?.includes(hero)) return PYM_LINK.powerMultiplier;
        return !(hero.stunTimer > 0) && pulseState(hero).elapsed >= PYM_LINK.rest ? PYM_LINK.powerMultiplier : 0;
    }
    if (isCadenceSupport(hero, 'profesor_x')) {
        if (!hero.game?.heroes?.includes(hero)) return MENTAL_LINK.perAllyMultiplier;
        const count = getMentalLinks(hero, level).length;
        return count ? Math.min(MENTAL_LINK.perAllyMultiplier, MENTAL_LINK.budgetMultiplier / count) : 0;
    }
    return hasNetwork(hero) && networkState(hero).remaining > 0 && !(hero.stunTimer > 0)
        ? VIBRANIUM_NETWORK.powerMultiplier : 1;
}

export function updateSupportAura(hero, dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    if (isCadenceSupport(hero, 'wasp')) {
        const state = pulseState(hero);
        const cycle = PYM_LINK.rest + PYM_LINK.duration;
        const elapsed = state.elapsed + dt;
        const pulses = Math.floor((elapsed + PYM_LINK.duration) / cycle)
            - Math.floor((state.elapsed + PYM_LINK.duration) / cycle);
        state.elapsed = elapsed % cycle;
        if (pulses > 0 && !(hero.stunTimer > 0) && hero.combatStats) {
            const radius = scaledAura(hero).range;
            const hasRecipient = hero.game?.heroes?.some((ally) => ally !== hero && !auraConfig(ally)?.type
                && !(ally.stunTimer > 0) && Math.hypot(hero.x - ally.x, hero.y - ally.y) <= radius);
            if (hasRecipient) hero.combatStats.abilityActivations += pulses;
        }
        return;
    }
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
    if (isCadenceSupport(hero, 'nick_fury')) {
        const power = Math.round(getEffectiveSupportAura(hero).power * 100);
        return { label: hero.stunTimer > 0 ? 'Orden suspendida' : `Orden sostenida +${power}%`, progress: null, ready: !(hero.stunTimer > 0) };
    }
    if (isCadenceSupport(hero, 'wasp')) {
        const state = pulseState(hero);
        if (hero.stunTimer > 0) return { label: 'Enlace suspendido', progress: 0, ready: false };
        const active = state.elapsed >= PYM_LINK.rest;
        const remaining = (active ? PYM_LINK.rest + PYM_LINK.duration : PYM_LINK.rest) - state.elapsed;
        const power = Math.round(getEffectiveSupportAura(hero).power * 100);
        return active
            ? { label: `Pym +${power}% (${remaining.toFixed(1)} s)`, progress: remaining / PYM_LINK.duration, ready: true }
            : { label: `Pym: ${remaining.toFixed(1)} s`, progress: state.elapsed / PYM_LINK.rest, ready: false };
    }
    if (isCadenceSupport(hero, 'profesor_x')) {
        const count = getMentalLinks(hero).length;
        const power = Math.round(getEffectiveSupportAura(hero).power * 100);
        return { label: hero.stunTimer > 0 ? 'Enlace suspendido' : `Enlaces ${count}: +${power}% c/u`, progress: null, ready: count > 0 };
    }
    if (!hasNetwork(hero)) return null;
    const state = networkState(hero);
    const power = Math.round(getEffectiveSupportAura(hero).power * 100);
    if (hero.stunTimer > 0) return { label: 'Red suspendida', progress: 0, ready: false };
    if (state.remaining > 0) return { label: `Sobrecarga +${power}% (${state.remaining.toFixed(1)} s)`, progress: state.remaining / VIBRANIUM_NETWORK.duration, ready: true };
    if (state.cooldown > 0) return { label: `Red: ${state.cooldown.toFixed(1)} s`, progress: 1 - state.cooldown / VIBRANIUM_NETWORK.cooldown, ready: false };
    return { label: `Red ${state.charge}/${VIBRANIUM_NETWORK.attacks}`, progress: state.charge / VIBRANIUM_NETWORK.attacks, ready: false };
}
