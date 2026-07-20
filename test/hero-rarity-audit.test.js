import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HERO_RARITIES } from '../src/utils/Rarity.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));

test('heroes usan las seis rarezas auditadas', () => {
    const counts = Object.values(heroes).reduce((acc, hero) => {
        acc[hero.rarity] = (acc[hero.rarity] || 0) + 1;
        return acc;
    }, {});

    assert.deepEqual(Object.keys(counts).sort(), [...HERO_RARITIES].sort());
    assert.deepEqual(counts, {
        Common: 10,
        Rare: 18,
        Epic: 22,
        Legendary: 17,
        Mythic: 7,
        Secret: 4
    });
});

test('heroes clave quedan en rarezas coherentes con su poder y habilidad', () => {
    assert.equal(heroes.spiderman.rarity, 'Common');
    assert.equal(heroes.iron_man.rarity, 'Rare');
    assert.equal(heroes.hulk.rarity, 'Epic');
    assert.equal(heroes.thor.rarity, 'Legendary');
    assert.equal(heroes.silver_surfer.rarity, 'Mythic');
    assert.equal(heroes.scarlet_witch.rarity, 'Secret');
    assert.equal(heroes.loki.rarity, 'Secret');
});
