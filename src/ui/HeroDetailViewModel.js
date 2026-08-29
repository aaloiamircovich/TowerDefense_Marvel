export const HERO_DETAIL_TABS = [
    { id: 'summary', label: 'Resumen', icon: 'fa-id-card' },
    { id: 'upgrade', label: 'Mejora', icon: 'fa-arrow-up' },
    { id: 'equipment', label: 'Objeto', icon: 'fa-shield-alt' },
    { id: 'combat', label: 'Combate', icon: 'fa-chart-line' }
];

export function formatHeroDetailMetric(value = 0) {
    const amount = Math.max(0, Number(value) || 0);
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
    return `${Math.round(amount)}`;
}

export function normalizeHeroDetailView(detailView = 'summary') {
    return HERO_DETAIL_TABS.some((tab) => tab.id === detailView) ? detailView : 'summary';
}

export function buildHeroDetailViewModel({
    detailView = 'summary',
    level = 1,
    maxLevel = 100,
    damage = 0,
    fireRate = 0,
    critChance = 0,
    range = 0,
    baseDamage = 0,
    baseFireRate = 0,
    baseCritChance = 0,
    baseRange = 0,
    combat = {},
    equippedItem = null,
    isAuraOnly = false,
    scaledAura = null,
    supportAuraLabel = 'Aura',
    upgradeCost = 0,
    formatStatDelta = () => ''
} = {}) {
    const activeDetailView = normalizeHeroDetailView(detailView);
    const normalizedFireRate = Number(fireRate || 0).toFixed(1);
    const isMaxLevel = Number(level) >= Number(maxLevel);
    const summaryBadge = isAuraOnly && scaledAura?.type
        ? `${supportAuraLabel} +${Math.round(Number(scaledAura.power || 0) * 100)}%`
        : `DPS ${formatHeroDetailMetric(Number(damage || 0) * Number(normalizedFireRate || 0))}`;
    const upgradeBadge = isMaxLevel ? 'MAX' : `$${upgradeCost}`;
    const equipmentBadge = equippedItem ? 'Equipado' : 'Libre';
    const combatBadge = `${formatHeroDetailMetric(combat.kills || 0)} bajas`;

    return {
        activeDetailView,
        summaryBadge,
        upgradeBadge,
        equipmentBadge,
        combatBadge,
        compactStats: [
            ['Daño', `${Math.round(Number(damage) || 0)}${formatStatDelta(Math.round(Number(damage) || 0), baseDamage)}`],
            ['Recarga', `${normalizedFireRate}/s${formatStatDelta(Number(normalizedFireRate), baseFireRate, '', 1)}`],
            ['Crítico', `${Math.round(Number(critChance) || 0)}%${formatStatDelta(Math.round(Number(critChance) || 0), baseCritChance, '%')}`],
            ['Alcance', `${Math.round(Number(range) || 0)}${formatStatDelta(Math.round(Number(range) || 0), baseRange)}`]
        ],
        detailTabs: HERO_DETAIL_TABS.map((tab) => ({
            ...tab,
            badge: {
                summary: summaryBadge,
                upgrade: upgradeBadge,
                equipment: equipmentBadge,
                combat: combatBadge
            }[tab.id]
        }))
    };
}
