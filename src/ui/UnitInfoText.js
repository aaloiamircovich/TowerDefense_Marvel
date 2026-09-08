import { getAllowedTerrainLabels } from '../utils/TerrainRules.js';
import { getEnemyRoleLabel } from './EnemyIntelState.js';

export function getTerrainText(terrains) {
    return getAllowedTerrainLabels(terrains);
}

export function getEnemyRoleText(archetype, isBoss = false) {
    return getEnemyRoleLabel(archetype, isBoss);
}

export function getResistanceText(unit = {}) {
    const labels = Object.entries(unit.resistances || {})
        .filter(([, value]) => value > 0)
        .map(([type, value]) => `${type} ${Math.round(value * 100)}%`);
    if (unit.statusResistance > 0) labels.push(`Estados ${Math.round(unit.statusResistance * 100)}%`);
    if (unit.stealth) labels.push('Detección requerida');
    return labels.join(', ') || 'Ninguna';
}
