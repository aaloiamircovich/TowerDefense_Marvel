import test from 'node:test';
import assert from 'node:assert/strict';
import { getFixedDifficultyKey, getLevelUnlockRequirement, isLevelUnlockedByStars } from '../src/utils/LevelProgression.js';

test('Los mapas se desbloquean cada 25 estrellas desde la Base Avengers', () => {
    assert.equal(getLevelUnlockRequirement(0), 0);
    assert.equal(getLevelUnlockRequirement(1), 25);
    assert.equal(getLevelUnlockRequirement(2), 50);
    assert.equal(isLevelUnlockedByStars(0, 0), true);
    assert.equal(isLevelUnlockedByStars(1, 24), false);
    assert.equal(isLevelUnlockedByStars(1, 25), true);
    assert.equal(isLevelUnlockedByStars(2, 49), false);
    assert.equal(isLevelUnlockedByStars(2, 50), true);
});

test('La dificultad de mapa es fija segun su configuracion', () => {
    assert.equal(getFixedDifficultyKey({ difficulty: 'Facil' }), 'easy');
    assert.equal(getFixedDifficultyKey({ difficulty: 'Normal' }), 'normal');
    assert.equal(getFixedDifficultyKey({ difficulty: 'Dificil' }), 'hard');
    assert.equal(getFixedDifficultyKey({ difficulty: 'Extrema' }), 'hard');
});
