import test from 'node:test';
import assert from 'node:assert/strict';
import {
    HERO_MAX_LEVEL,
    calculateHeroLevelCost,
    getHeroEvolutionStage,
    getHeroDamageAtLevel,
    getHeroLevelDamageMultiplier,
    getHeroLevelUpgradeSteps,
    getScaledSupportAura,
    normalizeHeroLevel
} from '../src/utils/HeroLevel.js';

test('nivel de heroe queda limitado entre 1 y 100', () => {
    assert.equal(HERO_MAX_LEVEL, 100);
    assert.equal(normalizeHeroLevel(-5), 1);
    assert.equal(normalizeHeroLevel(150), 100);
    assert.equal(getHeroLevelUpgradeSteps(99, 10), 1);
    assert.equal(getHeroLevelUpgradeSteps(100, 1), 0);
    assert.equal(calculateHeroLevelCost(100, 1), Infinity);
});

test('el dano escala por nivel sin superar el cap', () => {
    assert.equal(getHeroDamageAtLevel(10, 1), 10);
    assert.equal(getHeroDamageAtLevel(10, 101), getHeroDamageAtLevel(10, 100));
    assert.equal(getHeroEvolutionStage(15), 0);
    assert.equal(getHeroEvolutionStage(16), 1);
    assert.equal(getHeroEvolutionStage(36), 2);
    assert.equal(getHeroEvolutionStage(100), 3);
    assert.ok(getHeroLevelDamageMultiplier(100, 'Secret') > getHeroLevelDamageMultiplier(100, 'Common'));
});

test('auras de soporte escalan su poder por nivel sin cambiar su radio', () => {
    const aura = { type: 'damage', power: 0.1, range: 255 };
    const levelOne = getScaledSupportAura(aura, 1);
    const commonHundred = getScaledSupportAura(aura, 100, 'Common');
    const legendaryHundred = getScaledSupportAura(aura, 100, 'Legendary');

    assert.equal(levelOne.power, 0.1);
    assert.equal(commonHundred.range, 255);
    assert.ok(commonHundred.power > levelOne.power);
    assert.ok(legendaryHundred.power > commonHundred.power);
    assert.equal(Number(commonHundred.power.toFixed(3)), 0.145);
    assert.equal(Number(legendaryHundred.power.toFixed(3)), 0.175);
});
