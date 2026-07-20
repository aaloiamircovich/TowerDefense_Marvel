import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIONS, collectVisualSources } from '../src/rendering/SpriteAnimator.js';

const root = process.cwd();
const heroes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes.json'), 'utf8'));

for (const heroId of ['nightcrawler', 'ms_marvel']) {
    test(`${heroId} queda registrado como heroe jugable con sprites completos`, () => {
        const hero = heroes[heroId];
        assert.ok(hero, `Falta ${heroId}`);
        assert.equal(hero.id, heroId);
        assert.equal(hero.sprite, hero.visual.portrait);
        assert.deepEqual(Object.keys(hero.visual.idle).sort(), [...DIRECTIONS].sort());
        assert.equal(hero.visual.attack.frames.length, 9);

        for (const source of collectVisualSources(hero.visual)) {
            assert.ok(fs.existsSync(path.join(root, source)), `Falta ${source}`);
        }
    });
}

test('Nightcrawler y Ms. Marvel no pisan identidades existentes', () => {
    assert.equal(heroes.nightcrawler.name, 'Nightcrawler');
    assert.equal(heroes.ms_marvel.name, 'Ms. Marvel');
    assert.notEqual(heroes.ms_marvel.id, 'captain_marvel');
    assert.ok(heroes.nightcrawler.tags.includes('Mutantes'));
    assert.ok(heroes.ms_marvel.tags.includes('Cósmico'));
});
