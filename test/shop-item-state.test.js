import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShopItemInsight, buildShopSetProgress } from '../src/ui/ShopItemState.js';

test('ShopItemState conecta efectos de objeto con counters de oleada', () => {
    const insight = buildShopItemInsight({
        id: 'edith_lens',
        tier: 2,
        set: 'stark',
        effects: {
            detectStealth: true,
            armorPenetration: 0.25,
            damagePct: 0.12
        }
    }, {
        stealthCount: 2,
        armoredCount: 1,
        barrierCount: 0,
        hasBoss: true,
        roles: ['stealth', 'tank'],
        pressureScore: 18
    });

    assert.equal(insight.tone, 'counter');
    assert.equal(insight.label, 'cubre sigilo');
    assert.deepEqual(insight.reasons, ['cubre sigilo', 'rompe blindaje', 'sube DPS']);
    assert.ok(insight.setName.length > 0);
});

test('ShopItemState distingue poder utilidad y economia de objetos', () => {
    const power = buildShopItemInsight({ tier: 4, effects: {} }, null);
    const utility = buildShopItemInsight({ tier: 1, effects: { onHitCreditPct: 0.15 } }, null);
    const setFallback = buildShopItemInsight({ tier: 1, set: 'unknown_set', effects: {} }, null);

    assert.equal(power.tone, 'power');
    assert.equal(power.label, 'mejora versatil');
    assert.equal(utility.tone, 'utility');
    assert.equal(utility.label, 'economia por impacto');
    assert.deepEqual(setFallback.reasons, ['set unknown_set']);
});

test('ShopItemState mantiene progreso de set desactivado con objeto unico', () => {
    assert.equal(buildShopSetProgress(
        { id: 'shield_badge', set: 'shield' },
        ['shield_badge'],
        { iron_man: 'shield_badge' },
        { shield_badge: { id: 'shield_badge' } }
    ), null);
});
