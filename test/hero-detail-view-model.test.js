import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHeroDetailViewModel, formatHeroDetailMetric, normalizeHeroDetailView } from '../src/ui/HeroDetailViewModel.js';

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
        upgradeCost: 320,
        formatStatDelta: (value, base, suffix = '', precision = 0) => {
            if (value === base) return '';
            return ` <${(value - base).toFixed(precision)}${suffix}>`;
        }
    });

    assert.equal(model.activeDetailView, 'equipment');
    assert.deepEqual(model.compactStats, [
        ['Daño', '42 <2>'],
        ['Recarga', '1.3/s <0.3>'],
        ['Crítico', '8% <3%>'],
        ['Alcance', '155 <5>']
    ]);
    assert.deepEqual(model.detailTabs.map((tab) => [tab.id, tab.badge]), [
        ['summary', 'DPS 55'],
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

test('helpers de detalle normalizan vista y metricas grandes', () => {
    assert.equal(normalizeHeroDetailView('combat'), 'combat');
    assert.equal(normalizeHeroDetailView('legacy'), 'summary');
    assert.equal(formatHeroDetailMetric(999), '999');
    assert.equal(formatHeroDetailMetric(12500), '13k');
    assert.equal(formatHeroDetailMetric(1250000), '1.3M');
});
