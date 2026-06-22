import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIONS, collectVisualSources } from '../src/rendering/SpriteAnimator.js';

const root = process.cwd();
const heroes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'heroes.json'), 'utf8'));
const atlasSource = fs.readFileSync(path.join(root, 'data', 'sprite-atlas.js'), 'utf8');
const atlas = JSON.parse(atlasSource.replace(/^window\.__MARVEL_TD_ATLAS__\s*=\s*/, '').replace(/;\s*$/, ''));

for (const heroId of ['capitan_america', 'thor', 'doctor_strange', 'hulk', 'black_widow', 'hawkeye', 'black_panther', 'vision', 'falcon', 'captain_marvel', 'star_lord', 'groot', 'gamora', 'silver_surfer']) {
    test(`${heroId} tiene contrato visual completo y exportado al atlas`, () => {
        const hero = heroes[heroId];
        assert.ok(hero.visual);
        assert.equal(hero.sprite, hero.visual.portrait);
        assert.deepEqual(Object.keys(hero.visual.idle).sort(), [...DIRECTIONS].sort());
        assert.equal(hero.visual.attack.frames.length, 9);

        for (const source of collectVisualSources(hero.visual)) {
            const file = path.join(root, source);
            assert.ok(fs.existsSync(file), `Falta ${source}`);
            assert.ok(atlas.frames[source], `El atlas no contiene ${source}`);
            const png = fs.readFileSync(file);
            assert.equal(png.toString('ascii', 1, 4), 'PNG');
            const expectedSize = source.endsWith('/portrait.png') ? 56 : 124;
            assert.equal(png.readUInt32BE(16), expectedSize);
            assert.equal(png.readUInt32BE(20), expectedSize);
        }
    });
}
