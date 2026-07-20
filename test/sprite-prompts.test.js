import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildEnemySpritePrompts,
    buildHeroSpritePrompts,
    flattenEnemies,
    formatPromptPack
} from '../scripts/lib/sprite-prompts.js';

test('buildHeroSpritePrompts creates idle and attack prompts for a 96x96 TD sprite', () => {
    const prompts = buildHeroSpritePrompts({
        id: 'iron_man',
        name: 'Iron Man',
        category: 'Tecnologico',
        ability: 'ARC BLAST',
        abilityDesc: 'Fires a repulsor beam.',
        niche: 'line damage'
    });

    assert.match(prompts.idle, /96x96 pixel art/);
    assert.match(prompts.idle, /transparent background/);
    assert.match(prompts.idle, /Iron Man/);
    assert.match(prompts.attack, /9 frame/);
    assert.match(prompts.attack, /no UI/);
});

test('buildEnemySpritePrompts includes enemy identity and faction cues', () => {
    const prompts = buildEnemySpritePrompts({
        id: 'hydra_soldier',
        name: 'Soldado de Hydra',
        category: 'Urbano',
        faction: 'Hydra',
        archetype: 'shield'
    });

    assert.match(prompts.walk, /Soldado de Hydra/);
    assert.match(prompts.walk, /Hydra/);
    assert.match(prompts.hit, /96x96/);
});

test('prompt builders allow a safe custom sprite size', () => {
    const prompts = buildHeroSpritePrompts({ id: 'thor', name: 'Thor' }, { size: 128 });
    assert.match(prompts.idle, /128x128/);
    assert.throws(() => buildHeroSpritePrompts({ id: 'thor', name: 'Thor' }, { size: 256 }), /between 32 and 128/);
});

test('flattenEnemies returns enemies from grouped data', () => {
    const enemies = flattenEnemies({
        normal: { a: { id: 'a' } },
        bosses: { b: { id: 'b' } }
    });

    assert.deepEqual(enemies.map((enemy) => enemy.id), ['a', 'b']);
});

test('formatPromptPack renders markdown sections', () => {
    const markdown = formatPromptPack('iron_man - Iron Man', { idle: 'idle prompt' });
    assert.match(markdown, /## iron_man - Iron Man/);
    assert.match(markdown, /### idle/);
});
