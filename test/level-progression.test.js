import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_MAX_WAVES, getFixedDifficultyKey, getLevelUnlockRequirement, isLevelUnlockedByStars } from '../src/utils/LevelProgression.js';

test('Los mapas se desbloquean cada 50 estrellas en campana de 100 oleadas', () => {
    assert.equal(CAMPAIGN_MAX_WAVES, 100);
    assert.equal(getLevelUnlockRequirement(0), 0);
    assert.equal(getLevelUnlockRequirement(1), 50);
    assert.equal(getLevelUnlockRequirement(2), 100);
    assert.equal(isLevelUnlockedByStars(0, 0), true);
    assert.equal(isLevelUnlockedByStars(1, 49), false);
    assert.equal(isLevelUnlockedByStars(1, 50), true);
    assert.equal(isLevelUnlockedByStars(2, 99), false);
    assert.equal(isLevelUnlockedByStars(2, 100), true);
});

test('La dificultad de mapa es fija segun su configuracion', () => {
    assert.equal(getFixedDifficultyKey({ difficulty: 'Facil' }), 'easy');
    assert.equal(getFixedDifficultyKey({ difficulty: 'Normal' }), 'normal');
    assert.equal(getFixedDifficultyKey({ difficulty: 'Dificil' }), 'hard');
    assert.equal(getFixedDifficultyKey({ difficulty: 'Extrema' }), 'hard');
});
