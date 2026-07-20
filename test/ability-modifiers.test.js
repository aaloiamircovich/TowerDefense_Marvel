import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCooldownReductions, getSpecialCooldownReduction } from '../src/utils/AbilityModifiers.js';

test('applyCooldownReductions combina nivel, progreso, sinergia y especial', () => {
    const hero = {
        id: 'loki',
        config: { special: { statModifiers: { cooldown: 0.25 } } },
        game: {
            progression: { getHeroBonuses: () => ({ cooldown: 0.1 }) },
            teamSynergy: { getAbilityModifiers: () => ({ cooldown: 0.2 }) }
        }
    };

    assert.equal(applyCooldownReductions(hero, 10, 0.1), 4.86);
});

test('getSpecialCooldownReduction ignora valores invalidos y limita reducciones extremas', () => {
    assert.equal(getSpecialCooldownReduction({ config: { special: { statModifiers: { cooldown: 'nope' } } } }), 0);
    assert.equal(getSpecialCooldownReduction({ config: { special: { statModifiers: { cooldown: 2 } } } }), 0.5);
});
