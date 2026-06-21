import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateItemEffects, getActiveSets, getForgeMultiplier } from '../src/systems/ItemEffectSystem.js';

test('dos piezas Stark activan el bonus de set', () => {
    const items = [
        { set: 'stark', effects: { fireRatePct: 0.25 }, forgeLevel: 1 },
        { set: 'stark', effects: { rangePct: 0.05 }, forgeLevel: 1 }
    ];
    const effects = aggregateItemEffects(items);

    assert.equal(getActiveSets(items)[0].id, 'stark');
    assert.equal(effects.fireRatePct, 0.35);
    assert.equal(effects.rangePct, 0.05);
});

test('forja escala efectos numericos veinte por ciento por nivel', () => {
    const effects = aggregateItemEffects([{ effects: { damagePct: 0.1 }, forgeLevel: 3 }]);
    assert.equal(getForgeMultiplier(3), 1.4);
    assert.ok(Math.abs(effects.damagePct - 0.14) < 1e-9);
});

test('efectos booleanos y perfiles de proyectil se combinan de forma segura', () => {
    const effects = aggregateItemEffects([
        { effects: { detectStealth: true, chainCount: 1, chainRange: 90 }, forgeLevel: 2 },
        { effects: { chainCount: 1, chainRange: 120 }, forgeLevel: 1 }
    ]);
    assert.equal(effects.detectStealth, true);
    assert.equal(effects.chainCount, 2);
    assert.equal(effects.chainRange, 120);
});
