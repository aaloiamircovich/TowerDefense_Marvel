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

test('Migracion conserva un solo objeto equipado antiguo', () => {
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

test('ProgressionManager recupera guardados corruptos sin bloquear el arranque', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, '{perfil-roto');
    const manager = new ProgressionManager(storage);
    manager.initialize(createGame(), data);

    assert.equal(manager.recoveredFromCorruptSave, true);
    assert.equal(manager.state.version, SAVE_VERSION);
    assert.deepEqual(manager.state.unlockedHeroIds, []);
    assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).version, SAVE_VERSION);
});

test('ProgressionManager reinicia todo el progreso persistido', () => {
    const storage = new MemoryStorage();
    const game = createGame();
    const manager = new ProgressionManager(storage);
    manager.initialize(game, data);
    manager.startProfile('iron_man');
    manager.addOwnedItem('reactor_arc');
    manager.state.mapProgress.level_1 = { bestWave: 8, stars: 3, difficulty: 'hard', challenges: [], missionObjectives: [] };
    manager.updateSetting('locale', 'en');

    assert.equal(manager.resetAllProgress(), true);

    const saved = JSON.parse(storage.getItem(SAVE_KEY));
    assert.deepEqual(manager.state.unlockedHeroIds, []);
    assert.deepEqual(manager.state.activeTeamIds, []);
    assert.deepEqual(manager.state.ownedItemIds, []);
    assert.deepEqual(manager.state.mapProgress, {});
    assert.equal(manager.state.settings.locale, 'es');
    assert.deepEqual(game.activeTeam, []);
    assert.equal(saved.version, SAVE_VERSION);
    assert.deepEqual(saved.unlockedHeroIds, []);
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

test('Equipar un segundo objeto reemplaza el anterior aunque sea otra ranura', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    manager.addOwnedItem('reactor_arc');
    manager.addOwnedItem('lentes_edith');
    manager.equipItem('iron_man', 'reactor_arc');
    manager.equipItem('iron_man', 'lentes_edith');

    assert.deepEqual(manager.state.equippedItems.iron_man, { artifact: 'lentes_edith' });
    assert.deepEqual(manager.state.ownedItemIds, ['reactor_arc']);
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

test('Forja y reciclaje de objetos quedan retirados', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    manager.addOwnedItem('reactor_arc');
    manager.addOwnedItem('reactor_arc');

    assert.equal(manager.getOwnedQuantity('reactor_arc'), 2);
    assert.equal(manager.salvageItem('reactor_arc').ok, false);
    manager.state.forgeMaterials = 500;
    assert.equal(manager.upgradeItem('reactor_arc').ok, false);
    manager.sanitize();
    assert.equal(manager.state.forgeMaterials, 0);
    assert.deepEqual(manager.state.itemLevels, {});
});

test('Loadout restaura un solo objeto de forma atomica', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    ['reactor_arc', 'chaleco_tactico', 'lentes_edith', 'municion_repulsora'].forEach((id) => manager.addOwnedItem(id));
    manager.equipItem('iron_man', 'reactor_arc');
    manager.saveLoadout('iron_man');
    manager.equipItem('iron_man', 'municion_repulsora');

    assert.equal(manager.applyLoadout('iron_man').ok, true);
    assert.deepEqual(manager.state.equippedItems.iron_man, { weapon: 'reactor_arc' });
});

test('Progreso de mapa guarda estrellas y desafios', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    manager.initialize(game, data);
    game.progression = manager;
    manager.recordWave(game, 10);

    const progress = manager.getMapProgress('level_1');
    assert.equal(progress.bestWave, 10);
    assert.equal(progress.stars, 10);
    assert.deepEqual(progress.challenges.sort(), ['cazajefes', 'sin_danos']);
});

test('Cada oleada nueva superada cuenta como una estrella', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    manager.initialize(game, data);
    game.progression = manager;

    for (let wave = 1; wave <= 50; wave++) manager.recordWave(game, wave);
    manager.recordWave(game, 25);

    const progress = manager.getMapProgress('level_1');
    assert.equal(progress.bestWave, 50);
    assert.equal(progress.stars, 50);
    assert.equal(game.stars, 50);
});

test('Objetivos de misión entregan una recompensa una sola vez', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);

    assert.equal(manager.completeMissionObjective('level_1', 'ny_first_contact', 200), true);
    assert.equal(manager.completeMissionObjective('level_1', 'ny_first_contact', 200), false);
    assert.equal(manager.state.metaCredits, 1400);
    assert.deepEqual(manager.getMapProgress('level_1').missionObjectives, ['ny_first_contact']);
});

test('Ajustes accesibles conservan tipos y límites válidos', () => {
    const previousDocument = globalThis.document;
    const classes = new Set();
    globalThis.document = {
        body: {
            classList: {
                toggle(name, enabled) {
                    if (enabled) classes.add(name);
                    else classes.delete(name);
                }
            },
            dataset: {}
        }
    };
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    try {
        manager.initialize(game, data);
        manager.updateSetting('highContrast', true);
        manager.updateSetting('combatText', false);
        manager.updateSetting('uiScale', 'large');
        manager.updateSetting('musicVolume', 4);
        manager.updateSetting('simplifiedUi', true);
        manager.updateSetting('tutorialHints', false);
        manager.updateSetting('pixelArtCrisp', true);
        manager.updateSetting('reducedVfx', true);

        assert.equal(manager.state.settings.highContrast, true);
        assert.equal(manager.state.settings.combatText, false);
        assert.equal(game.showCombatText, false);
        assert.equal(manager.state.settings.uiScale, 'large');
        assert.equal(manager.state.settings.musicVolume, 1);
        assert.equal(manager.state.settings.simplifiedUi, true);
        assert.equal(manager.state.settings.tutorialHints, false);
        assert.equal(manager.state.settings.pixelArtCrisp, true);
        assert.equal(manager.state.settings.reducedVfx, true);
        assert.equal(game.pixelArtCrisp, true);
        assert.equal(game.reducedVfx, true);
        assert.ok(classes.has('simple-ui'));
        assert.ok(classes.has('pixel-art-crisp'));
        assert.ok(classes.has('reduced-vfx'));
    } finally {
        globalThis.document = previousDocument;
    }
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

test('evoluciones quedan desactivadas hasta que el roster completo tenga sprites', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    manager.initialize(game, data);
    manager.startProfile('iron_man');

    assert.equal(manager.setHeroEvolution('iron_man', 'iron_man_extremis'), false);
    assert.equal(manager.getHeroEvolution('iron_man'), null);
    assert.deepEqual(game.activeTeam.map((hero) => hero.id), ['iron_man']);
});

test('saneado elimina evoluciones antiguas guardadas si el heroe no las declara', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({
        version: SAVE_VERSION,
        unlockedHeroIds: ['thor'],
        activeTeamIds: ['thor'],
        selectedEvolutions: { thor: 'rune_king_thor' }
    }));
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);

    assert.deepEqual(manager.state.selectedEvolutions, {});
});

test('maestria recompensa desafios una sola vez y el codice persiste hallazgos', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    manager.startProfile('iron_man');
    const hero = { id: 'iron_man', combatStats: { damageDealt: 5100, abilityActivations: 6, kills: 30 } };

    assert.equal(manager.evaluateHeroMastery(hero).length, 3);
    assert.equal(manager.evaluateHeroMastery(hero).length, 0);
    assert.equal(manager.state.metaCredits, 1500);
    assert.equal(manager.discoverCodex('enemies', 'hydra_soldier'), true);
    assert.equal(manager.state.codexDiscovered.enemies.includes('hydra_soldier'), true);
    assert.equal(manager.getCodexSnapshot().enemies.total, 49);
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

test('resumen de mision desbloquea logros tacticos y sinergia activa', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    manager.initialize(game, data);
    manager.startProfile('iron_man');
    manager.unlockHero('capitan_america');
    manager.unlockHero('thor');
    game.activeTeam = [data.heroes.iron_man, data.heroes.capitan_america, data.heroes.thor];
    game.heroes = [
        {
            id: 'iron_man',
            name: 'Iron Man',
            combatStats: {
                damageDealt: 8200,
                kills: 31,
                shots: 60,
                crits: 8,
                goldGenerated: 90,
                abilityActivations: 6,
                controlSeconds: 32,
                armorBreaks: 4,
                marks: 5,
                detectionReveals: 3,
                livesSaved: 5,
                tacticalScore: 2700
            }
        }
    ];
    game.waveManager = { currentWave: 11, faction: { label: 'Hydra / A.I.M.' } };

    manager.recordMissionSummary(game, 'victory');

    assert.ok(manager.state.achievements.includes('tactico_superior'));
    assert.ok(manager.state.achievements.includes('protector'));
    assert.ok(manager.state.achievements.includes('controlador'));
    assert.ok(manager.state.achievements.includes('arsenal_vivo'));
    assert.ok(manager.state.achievements.includes('sinergia_activa'));
    assert.equal(manager.state.lastMissionSummary.tactical.controlSeconds, 32);
});

test('contratos semanales se completan una vez y pagan fondos', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(createGame(), data);
    const now = new Date('2026-07-13T12:00:00Z');
    const factionContract = manager.getWeeklyContractSnapshot(now).contracts.find((contract) => contract.id.includes(':faction_'));
    const before = manager.state.metaCredits;
    const summary = {
        result: 'victory',
        lives: 20,
        enemyFaction: factionContract.group,
        totals: { kills: 35 },
        tactical: { controlSeconds: 25 },
        synergies: { activeFamilies: 1 }
    };

    const first = manager.evaluateWeeklyContracts(summary, now);
    const second = manager.evaluateWeeklyContracts(summary, now);

    assert.equal(first.length, 4);
    assert.equal(second.length, 0);
    assert.equal(manager.getWeeklyContractSnapshot(now).completed, 4);
    assert.equal(manager.state.metaCredits, before + first.reduce((sum, contract) => sum + contract.reward, 0));
});

test('retos de agrupacion detectan equipo activo y pagan una sola vez', () => {
    const manager = new ProgressionManager(new MemoryStorage());
    const game = createGame();
    manager.initialize(game, data);
    manager.startProfile('iron_man');
    manager.unlockHero('capitan_america');
    manager.unlockHero('thor');
    game.activeTeam = [data.heroes.iron_man, data.heroes.capitan_america, data.heroes.thor];

    const snapshot = manager.getSynergyChallengeSnapshot();
    assert.ok(snapshot.challenges.some((challenge) => challenge.id === 'family:Avengers' && challenge.active));
    assert.ok(snapshot.challenges.some((challenge) => challenge.id === 'pair:ciencia_y_escudo' && challenge.active));

    const before = manager.state.metaCredits;
    const summary = {
        result: 'victory',
        totals: { kills: 30 },
        synergies: { activeFamilyTags: ['Avengers'], activePairIds: ['ciencia_y_escudo'] }
    };
    const first = manager.evaluateSynergyChallenges(summary);
    const second = manager.evaluateSynergyChallenges(summary);

    assert.equal(first.length, 2);
    assert.equal(second.length, 0);
    assert.equal(manager.state.synergyChallenges.includes('family:Avengers'), true);
    assert.equal(manager.state.synergyChallenges.includes('pair:ciencia_y_escudo'), true);
    assert.equal(manager.state.metaCredits, before + first.reduce((sum, challenge) => sum + challenge.reward, 0));
});

test('codigo de build exporta e importa equipo, objetos y evoluciones validas', () => {
    const first = new ProgressionManager(new MemoryStorage());
    first.initialize(createGame(), data);
    first.startProfile('spiderman');
    first.addOwnedItem('reactor_arc');
    first.equipItem('spiderman', 'reactor_arc');
    const code = first.exportBuildCode();

    const secondGame = createGame();
    const second = new ProgressionManager(new MemoryStorage());
    second.initialize(secondGame, data);
    second.startProfile('spiderman');
    second.addOwnedItem('reactor_arc');

    assert.equal(second.importBuildCode(code).ok, true);
    assert.deepEqual(second.state.activeTeamIds, ['spiderman']);
    assert.deepEqual(second.state.equippedItems.spiderman, { weapon: 'reactor_arc' });
    assert.deepEqual(second.state.ownedItemIds, []);
    assert.deepEqual(secondGame.activeTeam.map((hero) => hero.id), ['spiderman']);
    assert.equal(second.importBuildCode('no-es-build').ok, false);
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

test('quitar un heroe del equipo tambien lo retira del campo', () => {
    const game = createGame();
    const manager = new ProgressionManager(new MemoryStorage());
    manager.initialize(game, data);
    manager.state.unlockedHeroIds = ['iron_man', 'spiderman', 'thor'];
    manager.setActiveTeam(['iron_man', 'spiderman']);

    const removedHero = { id: 'iron_man', name: 'Iron Man' };
    const keptHero = { id: 'spiderman', name: 'Spider-Man' };
    const removedProjectile = { attacker: removedHero, isActive: true, deactivate() { this.isActive = false; } };
    const keptProjectile = { attacker: keptHero, isActive: true, deactivate() { this.isActive = false; } };
    game.heroes = [removedHero, keptHero];
    game.selectedUnit = removedHero;
    game.projectiles = [removedProjectile, keptProjectile];
    game.inputManager = {
        placingHero: data.heroes.iron_man,
        movingHero: removedHero,
        cleared: false,
        clearPlacement() {
            this.cleared = true;
            this.placingHero = null;
            this.movingHero = null;
        }
    };
    game.waveManager = { refreshed: 0, refreshWaveIntel() { this.refreshed++; } };

    manager.setActiveTeam(['spiderman', 'thor']);

    assert.deepEqual(game.activeTeam.map((hero) => hero.id), ['spiderman', 'thor']);
    assert.deepEqual(game.heroes.map((hero) => hero.id), ['spiderman']);
    assert.equal(game.selectedUnit, null);
    assert.equal(removedProjectile.isActive, false);
    assert.equal(keptProjectile.isActive, true);
    assert.equal(game.inputManager.cleared, true);
    assert.equal(game.waveManager.refreshed, 1);
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
