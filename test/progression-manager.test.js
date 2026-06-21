import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ProgressionManager, SAVE_KEY, SAVE_VERSION } from '../src/systems/ProgressionManager.js';

const data = {
    heroes: JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8')),
    items: JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8')),
    levels: JSON.parse(fs.readFileSync(new URL('../data/levels.json', import.meta.url), 'utf8'))
};

test('ProgressionManager migra un guardado antiguo', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ credits: 700, heroes: ['iron_man'], team: ['iron_man'], items: ['reactor_arc'] }));
    const manager = new ProgressionManager(storage);
    manager.initialize(createGame(), data);

    assert.equal(manager.state.version, SAVE_VERSION);
    assert.equal(manager.state.metaCredits, 700);
    assert.deepEqual(manager.state.unlockedHeroIds, ['iron_man']);
    assert.deepEqual(manager.state.ownedItemIds, ['reactor_arc']);
});

test('ProgressionManager conserva heroes, fondos y equipo al reabrir', () => {
    const storage = new MemoryStorage();
    const first = new ProgressionManager(storage);
    first.initialize(createGame(), data);
    first.startProfile('spiderman');
    first.addOwnedItem('reactor_arc');
    first.equipItem('spiderman', 'reactor_arc');
    first.addMetaCredits(300);

    const reopenedGame = createGame();
    const reopened = new ProgressionManager(storage);
    reopened.initialize(reopenedGame, data);

    assert.deepEqual(reopenedGame.activeTeam.map((hero) => hero.id), ['spiderman']);
    assert.equal(reopened.state.equippedItems.spiderman, 'reactor_arc');
    assert.equal(reopened.state.metaCredits, 1500);
});

test('Arbol de mejoras exige dependencias y descuenta fondos', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');

    assert.equal(manager.purchaseUpgrade(data.heroes.iron_man, 'assault_2').ok, false);
    assert.equal(manager.purchaseUpgrade(data.heroes.iron_man, 'assault_1').ok, true);
    assert.equal(manager.state.metaCredits, 980);
    assert.equal(manager.getHeroBonuses('iron_man').damage, 0.1);
});

test('Equipar un objeto devuelve el anterior al inventario', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    manager.addOwnedItem('reactor_arc');
    manager.addOwnedItem('lentes_edith');
    manager.equipItem('iron_man', 'reactor_arc');
    manager.equipItem('iron_man', 'lentes_edith');

    assert.equal(manager.state.equippedItems.iron_man, 'lentes_edith');
    assert.deepEqual(manager.state.ownedItemIds, ['reactor_arc']);
});

test('Progreso de mapa guarda estrellas, desafio y dificultad', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    manager.initialize(game, data);
    game.progression = manager;
    manager.setDifficulty('level_1', 'hard');
    manager.recordWave(game, 10);

    const progress = manager.getMapProgress('level_1');
    assert.equal(progress.bestWave, 10);
    assert.equal(progress.stars, 1);
    assert.equal(progress.difficulty, 'hard');
    assert.deepEqual(progress.challenges.sort(), ['cazajefes', 'sin_danos']);
});

test('Objetivos de misión entregan una recompensa una sola vez', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);

    assert.equal(manager.completeMissionObjective('level_1', 'ny_rescue', 200), true);
    assert.equal(manager.completeMissionObjective('level_1', 'ny_rescue', 200), false);
    assert.equal(manager.state.metaCredits, 1400);
    assert.deepEqual(manager.getMapProgress('level_1').missionObjectives, ['ny_rescue']);
});

function createGame() {
    return {
        heroes: [], audio: { setEnabled: () => {} }, resourceManager: { lives: 20, maxLives: 20 },
        currentLevel: { id: 'level_1' }, showHeroRanges: true, showGrid: true
    };
}

class MemoryStorage {
    constructor() { this.values = new Map(); }
    getItem(key) { return this.values.get(key) ?? null; }
    setItem(key, value) { this.values.set(key, String(value)); }
}
