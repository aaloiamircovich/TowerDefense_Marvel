import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHeroDetailViewModel, formatHeroDetailMetric, formatStatDelta, normalizeHeroDetailView } from '../src/ui/HeroDetailViewModel.js';

test('buildHeroDetailViewModel arma badges y estadisticas compactas', () => {
    const model = buildHeroDetailViewModel({
        detailView: 'equipment',
        level: 12,
        maxLevel: 100,
        damage: 42,
        fireRate: 1.25,
        critChance: 8,
        range: 155,
        baseDamage: 40,
        baseFireRate: 1,
        baseCritChance: 5,
        baseRange: 150,
        combat: { kills: 1250 },
        equippedItem: { id: 'arc_reactor' },
        upgradeCost: 320
    });

    assert.equal(model.activeDetailView, 'equipment');
    assert.deepEqual(model.compactStats, [
        ['Daño', '42', { text: '+2', negative: false }],
        ['Cadencia', '1.3/s', { text: '+0.3/s', negative: false }],
        ['Crítico', '8%', { text: '+3%', negative: false }],
        ['Alcance', '155', { text: '+5', negative: false }]
    ]);
    assert.deepEqual(model.detailTabs.map((tab) => [tab.id, tab.badge]), [
        ['summary', 'DPS 53'],
        ['upgrade', '$320'],
        ['equipment', 'Equipado'],
        ['combat', '1.3k bajas']
    ]);
});

test('buildHeroDetailViewModel prioriza aura de soporte y nivel maximo', () => {
    const model = buildHeroDetailViewModel({
        detailView: 'missing',
        level: 100,
        maxLevel: 100,
        isAuraOnly: true,
        scaledAura: { type: 'damage', power: 0.184 },
        supportAuraLabel: 'Daño',
        combat: { kills: 0 }
    });

    assert.equal(model.activeDetailView, 'summary');
    assert.equal(model.summaryBadge, 'Daño +18%');
    assert.equal(model.upgradeBadge, 'MAX');
    assert.equal(model.equipmentBadge, 'Libre');
});

test('helpers de detalle normalizan vista metricas y deltas', () => {
    assert.equal(normalizeHeroDetailView('combat'), 'combat');
    assert.equal(normalizeHeroDetailView('legacy'), 'summary');
    assert.equal(formatHeroDetailMetric(999), '999');
    assert.equal(formatHeroDetailMetric(12500), '13k');
    assert.equal(formatHeroDetailMetric(1250000), '1.3M');
    assert.deepEqual(formatStatDelta(42, 40), { text: '+2', negative: false });
    assert.deepEqual(formatStatDelta(0.8, 1, '/s', 1), { text: '-0.2/s', negative: true });
    assert.equal(formatStatDelta(10, 10), null);
    assert.equal(formatStatDelta(NaN, 10), null);
});
