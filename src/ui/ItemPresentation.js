import { SET_BONUSES } from '../systems/ItemEffectSystem.js';

export function getItemFamilyName(item = {}) {
    return SET_BONUSES[item.set]?.name || item.set || 'Sin familia';
}
