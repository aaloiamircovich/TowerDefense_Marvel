import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ProgressionManager } from '../src/systems/ProgressionManager.js';
import { ShopSystem } from '../src/systems/ShopSystem.js';

const data = {
    heroes: JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8')),
    items: JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8')),
    levels: JSON.parse(fs.readFileSync(new URL('../data/levels.json', import.meta.url), 'utf8'))
};

test('ShopSystem genera una rotacion diaria estable por tiers', () => {
    const { shop } = createShop();
    const first = shop.getRotation().map((slot) => slot.item.id);
    const second = shop.getRotation().map((slot) => slot.item.id);
    const tiers = shop.getRotation().map((slot) => slot.item.tier);

    assert.deepEqual(first, second);
    assert.equal(new Set(first).size, first.length);
    assert.ok(tiers.includes(1));
    assert.ok(tiers.includes(2));
    assert.ok(tiers.some((tier) => tier >= 3));
});

test('ShopSystem impide comprar dos veces el mismo objeto', () => {
    const { shop, progression } = createShop();
    const item = shop.getRotation()[0].item;
    progression.state.metaCredits = 10000;

    assert.equal(shop.purchaseItem(item.id).ok, true);
    assert.equal(shop.purchaseItem(item.id).ok, false);
    assert.equal(progression.hasItem(item.id), true);
});

test('ShopSystem recluta heroes sin duplicados', () => {
    const { shop, progression } = createShop();
    progression.startProfile('iron_man');
    progression.state.metaCredits = 5000;
    const result = shop.recruitHero();

    assert.equal(result.ok, true);
    assert.notEqual(result.hero.id, 'iron_man');
    assert.equal(new Set(progression.state.unlockedHeroIds).size, progression.state.unlockedHeroIds.length);
});

function createShop() {
    const storage = { value: null, getItem() { return this.value; }, setItem(key, value) { this.value = value; } };
    const game = {
        heroes: [], audio: { setEnabled: () => {} }, itemDatabase: data.items, heroDatabase: data.heroes,
        random: { pick: (values) => values[0] }, resourceManager: { lives: 20, maxLives: 20 }, currentLevel: { id: 'level_1' }
    };
    const progression = new ProgressionManager(storage);
    progression.initialize(game, data);
    const shop = new ShopSystem(game, progression, () => new Date('2026-06-21T12:00:00Z'));
    return { shop, progression };
}
