export const ITEM_SLOTS = ['weapon', 'armor', 'artifact'];

export const SLOT_LABELS = {
    weapon: 'Arma',
    armor: 'Armadura',
    artifact: 'Artefacto'
};

export const SET_BONUSES = {
    stark: { name: 'Stark', description: '2 piezas: +10% cadencia.', effects: { fireRatePct: 0.1 } },
    vibranium: { name: 'Vibranium', description: '2 piezas: +10% daño.', effects: { damagePct: 0.1 } },
    pym: { name: 'Pym', description: '2 piezas: +12% alcance.', effects: { rangePct: 0.12 } },
    mystic: { name: 'Místico', description: '2 piezas: +5% crítico.', effects: { critChance: 5 } },
    symbiote: { name: 'Simbionte', description: '2 piezas: daño acumulativo adicional.', effects: { consecutiveDamagePct: 0.012 } },
    shield: { name: 'S.H.I.E.L.D.', description: '2 piezas: +6% daño y alcance.', effects: { damagePct: 0.06, rangePct: 0.06 } }
};

const NON_SCALING = new Set(['killHealEvery', 'chainCount']);
const MAXIMUM_EFFECTS = new Set(['chainRange', 'chainFactor', 'splashRadius', 'splashFactor']);

export function getForgeMultiplier(level = 1) {
    return 1 + Math.max(0, Math.min(2, Number(level) - 1)) * 0.2;
}

export function aggregateItemEffects(items = []) {
    const total = {};
    items.filter(Boolean).forEach((item) => mergeEffects(total, item.effects || {}, getForgeMultiplier(item.forgeLevel)));
    getActiveSets(items).forEach((set) => mergeEffects(total, set.effects, 1));
    return total;
}

export function getActiveSets(items = []) {
    const counts = items.reduce((result, item) => {
        if (item?.set) result[item.set] = (result[item.set] || 0) + 1;
        return result;
    }, {});
    return Object.entries(counts)
        .filter(([, count]) => count >= 2)
        .map(([id]) => ({ id, ...SET_BONUSES[id] }))
        .filter((set) => set.name);
}

function mergeEffects(target, effects, multiplier) {
    Object.entries(effects).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
            target[key] = Boolean(target[key] || value);
            return;
        }
        if (!Number.isFinite(value)) return;
        const scaled = NON_SCALING.has(key) ? value : value * multiplier;
        if (key === 'killHealEvery') target[key] = Math.min(target[key] || Infinity, scaled);
        else if (MAXIMUM_EFFECTS.has(key)) target[key] = Math.max(target[key] || 0, scaled);
        else target[key] = (target[key] || 0) + scaled;
    });
}
