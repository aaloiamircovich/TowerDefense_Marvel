import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ProgressionManager, SAVE_KEY, SAVE_VERSION } from '../src/systems/ProgressionManager.js';

const data = {
    heroes: JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8')),
    enemies: JSON.parse(fs.readFileSync(new URL('../data/enemies.json', import.meta.url), 'utf8')),
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

test('Migracion convierte el objeto equipado antiguo a su ranura', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({
        version: 4,
        heroes: ['iron_man'],
        team: ['iron_man'],
        equippedItems: { iron_man: 'lentes_edith' }
    }));
    const manager = new ProgressionManager(storage);
    manager.initialize(createGame(), data);

    assert.deepEqual(manager.state.equippedItems.iron_man, { artifact: 'lentes_edith' });
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
    assert.deepEqual(reopened.state.equippedItems.spiderman, { weapon: 'reactor_arc' });
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

test('Equipar objetos en ranuras distintas conserva ambos', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    manager.addOwnedItem('reactor_arc');
    manager.addOwnedItem('lentes_edith');
    manager.equipItem('iron_man', 'reactor_arc');
    manager.equipItem('iron_man', 'lentes_edith');

    assert.deepEqual(manager.state.equippedItems.iron_man, { weapon: 'reactor_arc', artifact: 'lentes_edith' });
    assert.deepEqual(manager.state.ownedItemIds, []);
});

test('Reemplazar un objeto devuelve la ranura anterior al inventario', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    manager.addOwnedItem('reactor_arc');
    manager.addOwnedItem('municion_repulsora');
    manager.equipItem('iron_man', 'reactor_arc');
    manager.equipItem('iron_man', 'municion_repulsora');

    assert.deepEqual(manager.state.equippedItems.iron_man, { weapon: 'municion_repulsora' });
    assert.deepEqual(manager.state.ownedItemIds, ['reactor_arc']);
});

test('Forja recicla duplicados y mejora objetos hasta nivel tres', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    manager.addOwnedItem('reactor_arc');
    manager.addOwnedItem('reactor_arc');

    assert.equal(manager.getOwnedQuantity('reactor_arc'), 2);
    assert.equal(manager.salvageItem('reactor_arc').materials, 40);
    manager.state.forgeMaterials = 500;
    assert.equal(manager.upgradeItem('reactor_arc').level, 2);
    assert.equal(manager.upgradeItem('reactor_arc').level, 3);
    assert.equal(manager.upgradeItem('reactor_arc').ok, false);
});

test('Loadout restaura tres ranuras de forma atomica', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    ['reactor_arc', 'chaleco_tactico', 'lentes_edith', 'municion_repulsora'].forEach((id) => manager.addOwnedItem(id));
    manager.equipItem('iron_man', 'reactor_arc');
    manager.equipItem('iron_man', 'chaleco_tactico');
    manager.equipItem('iron_man', 'lentes_edith');
    manager.saveLoadout('iron_man');
    manager.equipItem('iron_man', 'municion_repulsora');

    assert.equal(manager.applyLoadout('iron_man').ok, true);
    assert.deepEqual(manager.state.equippedItems.iron_man, {
        weapon: 'reactor_arc', armor: 'chaleco_tactico', artifact: 'lentes_edith'
    });
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

test('Ajustes accesibles conservan tipos y límites válidos', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.updateSetting('highContrast', true);
    manager.updateSetting('uiScale', 'large');
    manager.updateSetting('musicVolume', 4);

    assert.equal(manager.state.settings.highContrast, true);
    assert.equal(manager.state.settings.uiScale, 'large');
    assert.equal(manager.state.settings.musicVolume, 1);
});

test('rankings de modos se guardan separados de campaña', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.recordModeScore('daily', 900, 8, 'defeat', 'daily:2026-06-23');
    manager.recordModeScore('survival', 1400, 12, 'extracted', 'survival:level_1');

    assert.equal(manager.getModeRecord('daily').bestScore, 900);
    assert.equal(manager.getModeRecord('survival').bestWave, 12);
    assert.equal(manager.getMapProgress('level_1').bestWave, 0);
});

test('evoluciones se activan y revierten sin reemplazar al heroe base', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    manager.initialize(game, data);
    manager.startProfile('iron_man');

    assert.equal(manager.setHeroEvolution('iron_man', 'iron_man_extremis'), true);
    assert.equal(manager.getHeroEvolution('iron_man').name, 'Iron Man Extremis');
    assert.deepEqual(game.activeTeam.map((hero) => hero.id), ['iron_man']);
    assert.equal(manager.setHeroEvolution('iron_man', null), true);
    assert.equal(manager.getHeroEvolution('iron_man'), null);
});

test('maestria recompensa desafios una sola vez y el codice persiste hallazgos', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    const hero = { id: 'iron_man', combatStats: { damageDealt: 5100, abilityActivations: 6, kills: 30 } };

    assert.equal(manager.evaluateHeroMastery(hero).length, 3);
    assert.equal(manager.evaluateHeroMastery(hero).length, 0);
    assert.equal(manager.state.metaCredits, 1500);
    assert.equal(manager.discoverCodex('enemies', Object.keys(data.enemies)[0]), true);
    assert.equal(manager.state.codexDiscovered.heroes.includes('iron_man'), true);
});

test('resumen de mision acumula estadisticas y logros una sola vez', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    manager.initialize(game, data);
    manager.startProfile('iron_man');
    game.heroes = [{ id: 'iron_man', name: 'Iron Man', combatStats: { damageDealt: 8200, kills: 31, shots: 60, crits: 8, goldGenerated: 90, abilityActivations: 6 } }];
    game.waveManager = { currentWave: 10 };
    game.modeSystem = { modeId: 'campaign' };

    const summary = manager.recordMissionSummary(game, 'victory');
    manager.recordMissionSummary(game, 'victory');

    assert.equal(summary.bestHero, 'Iron Man');
    assert.equal(manager.state.statistics.missions, 1);
    assert.equal(manager.state.statistics.enemiesDefeated, 31);
    assert.ok(manager.state.achievements.includes('primera_defensa'));
    assert.ok(manager.state.achievements.includes('intocable'));
    assert.ok(manager.state.achievements.includes('cazajefes'));
});

test('exportar e importar conserva progreso y rechaza formatos ajenos', () => {
    const first = new ProgressionManager(new MemoryStorage());
    first.initialize(createGame(), data);
    first.startProfile('spiderman');
    first.updateKeyBinding('pause', 'q');
    first.updateSetting('locale', 'en');
    const exported = first.exportSave();

    const second = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    second.initialize(game, data);
    assert.equal(second.importSave(exported).ok, true);
    assert.equal(second.state.settings.keyBindings.pause, 'q');
    assert.equal(second.state.settings.locale, 'en');
    assert.deepEqual(game.activeTeam.map((hero) => hero.id), ['spiderman']);
    assert.equal(second.importSave('{"untrusted":true}').ok, false);
    assert.deepEqual(game.activeTeam.map((hero) => hero.id), ['spiderman']);
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
