import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WaveManager } from '../src/systems/WaveManager.js';

const enemies = JSON.parse(fs.readFileSync(new URL('../data/enemies.json', import.meta.url), 'utf8'));

test('WaveManager prepara una primera oleada valida', () => {
    const manager = new WaveManager(createGame(), enemies);
    assert.equal(manager.currentWave, 1);
    assert.equal(manager.preparedQueue.length, 7);
    assert.equal(manager.waveModifier.id, 'opening-1');
    assert.equal(manager.waveModifier.label, 'Reconocimiento Hydra');
    assert.ok(manager.getUniqueEnemies().every((enemy) => enemy.previewCount > 0));
});

test('apertura dirigida no fuerza sigilo sin deteccion disponible', () => {
    const manager = new WaveManager(createGame('new-york', [{ id: 'iron_man', teamMetrics: { detection: 1 }, canSeeStealth: false }]), enemies);
    manager.currentWave = 5;
    manager.prepareNextWave();
    const ids = new Set(manager.preparedQueue.map((entry) => entry.config.id));

    assert.equal(manager.waveModifier.id, 'opening-5');
    assert.equal(ids.has('hand_ninja'), false);
    assert.ok(ids.has('hydra_soldier'));
    assert.equal(manager.getWaveSummary().counter, 'Mejora un héroe antes del élite');
});

test('WaveManager prepara un jefe cada diez oleadas', () => {
    const manager = new WaveManager(createGame(), enemies);
    manager.currentWave = 10;
    manager.prepareNextWave();

    assert.equal(manager.preparedQueue.length, 1);
    assert.equal(manager.preparedQueue[0].config.isBoss, true);
    assert.equal(manager.preparedQueue[0].config.id, 'loki');
});

test('WaveManager usa la faccion correspondiente al mapa', () => {
    const game = createGame('avengers');
    const manager = new WaveManager(game, enemies);
    const ids = new Set(manager.preparedQueue.map((entry) => entry.config.id));

    assert.equal(manager.faction.label, 'Legión de Ultrón');
    assert.deepEqual(ids, new Set(['doombot', 'ultron_drone']));
});

test('Knowhere incorpora Kree, Chitauri y Orden Negra por progresión', () => {
    const manager = new WaveManager(createGame('knowhere'), enemies);
    manager.currentWave = 25;
    manager.prepareNextWave();
    const pool = new Set(manager.getEnemyPoolForWave().map((enemy) => enemy.id));

    assert.equal(manager.faction.label, 'Kree / Chitauri / Orden Negra');
    assert.ok(pool.has('kree_commander'));
    assert.ok(pool.has('chitauri_phaser'));
    assert.ok(pool.has('black_order_magus'));
});

test('WaveManager aplica modificadores sin depender solo de salud', () => {
    const manager = new WaveManager(createGame(), enemies);
    manager.currentWave = 8;
    manager.prepareNextWave();

    assert.equal(manager.waveModifier.id, 'rush');
    assert.ok(manager.preparedQueue.every((entry) => entry.config.speed > enemies.normal[entry.config.id].speed));
});

test('WaveManager prepara barreras globales en la oleada protegida', () => {
    const manager = new WaveManager(createGame(), enemies);
    manager.currentWave = 9;
    manager.prepareNextWave();

    assert.equal(manager.waveModifier.id, 'shielded');
    assert.ok(manager.preparedQueue.every((entry) => entry.config.barrierRatio >= 0.16));
});

test('WaveManager resume cantidad, botin y counter de la cola preparada', () => {
    const manager = new WaveManager(createGame(), enemies);
    const summary = manager.getWaveSummary();

    assert.equal(summary.total, manager.preparedQueue.length);
    assert.ok(summary.reward > 110);
    assert.ok(summary.fastest > 0);
    assert.ok(summary.maxThreat >= 1);
    assert.equal(typeof summary.counter, 'string');
    assert.equal(summary.pressureScore, 14);
    assert.equal(summary.threatTier.id, 'guarded');
    assert.equal(summary.readiness.id, 'empty');
});

test('WaveManager eleva la lectura de amenaza cuando hay barreras y sigilo', () => {
    const manager = new WaveManager(createGame(), enemies);
    manager.currentWave = 9;
    manager.prepareNextWave();
    const summary = manager.getWaveSummary();

    assert.equal(manager.waveModifier.id, 'shielded');
    assert.equal(summary.barrierCount, manager.preparedQueue.length);
    assert.ok(summary.stealthCount > 0);
    assert.equal(summary.threatTier.id, 'critical');
});

test('WaveManager evalua preparacion con heroes desplegados y creditos', () => {
    const game = createGame('new-york', [], [
        deployedHero({ id: 'iron_man', damage: 58, fireRate: 1.4, range: 180, level: 2 }),
        deployedHero({ id: 'spiderman', damage: 34, fireRate: 1.8, range: 160, canSeeStealth: true })
    ]);
    game.resourceManager.credits = 360;
    const manager = new WaveManager(game, enemies);
    const summary = manager.getWaveSummary();

    assert.ok(summary.readiness.score > summary.pressureScore);
    assert.equal(summary.readiness.id, 'ready');
    assert.ok(summary.readiness.margin > 0);
});

test('WaveManager refresca el radar tactico al cambiar heroes desplegados', () => {
    const rendered = [];
    const game = createGame();
    game.uiManager = {
        renderWavePreview: (...args) => rendered.push(args.at(-1)),
        setNextWaveEnabled: (_enabled, summary) => rendered.push(summary)
    };
    const manager = new WaveManager(game, enemies);
    assert.equal(manager.getWaveSummary().readiness.id, 'empty');

    game.heroes.push(deployedHero({ id: 'iron_man', damage: 58, fireRate: 1.4, range: 180, level: 2 }));
    game.resourceManager.credits = 240;
    const refreshed = manager.refreshWaveIntel();

    assert.notEqual(refreshed.readiness.id, 'empty');
    assert.equal(rendered.at(-1).readiness.id, refreshed.readiness.id);
});

test('WaveManager limpia presion de combate al cerrar oleada', () => {
    const pressureCalls = [];
    const game = createGame();
    game.uiManager = {
        renderWavePreview: () => {},
        setNextWaveEnabled: () => {},
        showToast: () => {},
        updateCombatPressure: (...args) => pressureCalls.push(args)
    };
    const manager = new WaveManager(game, enemies);
    manager.isWaveActive = true;
    manager.finishWave();

    assert.deepEqual(pressureCalls[0], [[], game.path, false]);
});

test('WaveManager emite informe tactico con deltas de la oleada', () => {
    const reports = [];
    const cleared = [];
    const game = createGame('new-york', [], [
        deployedHero({ id: 'iron_man', name: 'Iron Man', damage: 58, fireRate: 1.4, range: 180, level: 2 })
    ]);
    game.resourceManager.credits = 300;
    game.resourceManager.lives = 20;
    game.uiManager = {
        renderWavePreview: () => {},
        setNextWaveEnabled: () => {},
        clearWaveReport: () => cleared.push(true),
        renderWaveReport: (report) => reports.push(report),
        updateCombatPressure: () => {},
        showToast: () => {}
    };
    const manager = new WaveManager(game, enemies);

    manager.startNextWave();
    game.heroes[0].combatStats.damageDealt += 640;
    game.heroes[0].combatStats.kills += 5;
    game.resourceManager.lives = 18;
    manager.enemiesQueue = [];
    manager.finishWave();

    assert.equal(cleared.length, 1);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].wave, 1);
    assert.equal(reports[0].leaks, 2);
    assert.equal(reports[0].kills, 5);
    assert.equal(reports[0].bestHero, 'Iron Man');
    assert.equal(reports[0].bestHeroId, 'iron_man');
    assert.ok(reports[0].credits >= 134);
});

test('WaveManager anuncia jefes al entrar en ruta', () => {
    const calls = captureThreatCalls();
    const game = createGame();
    game.uiManager = calls.uiManager;
    game.audio = calls.audio;
    game.vfx = calls.vfx;
    game.spawnEnemy = (config) => ({ ...config, x: 24, y: 36 });
    const manager = new WaveManager(game, enemies);
    manager.currentWave = 10;
    manager.prepareNextWave();
    manager.startNextWave();
    manager.update(1);

    const threatToast = calls.toasts.find(([message]) => message.includes('Jefe en ruta'));
    assert.deepEqual(threatToast, ['Jefe en ruta: Loki', 'warning']);
    assert.ok(calls.audioEvents.includes('boss'));
    assert.equal(calls.rings[0][0], 24);
    assert.equal(calls.rings[0][2].radius, 86);
    assert.equal(calls.texts[0][2], 'JEFE');
});

test('WaveManager anuncia elites de amenaza alta', () => {
    const calls = captureThreatCalls();
    const game = createGame();
    game.uiManager = calls.uiManager;
    game.audio = calls.audio;
    game.vfx = calls.vfx;
    game.spawnEnemy = (config) => ({ ...config, x: 14, y: 18 });
    const manager = new WaveManager(game, enemies);
    manager.preparedQueue = [{ config: { id: 'sentinel', name: 'Centinela', hp: 400, speed: 1, reward: 30, threat: 5 }, delay: 0 }];
    manager.startNextWave();
    manager.update(1);

    const threatToast = calls.toasts.find(([message]) => message.includes('Elite en ruta'));
    assert.deepEqual(threatToast, ['Elite en ruta: Centinela', 'warning']);
    assert.ok(calls.audioEvents.includes('warning'));
    assert.equal(calls.rings[0][2].radius, 58);
    assert.equal(calls.texts[0][2], 'ELITE');
});

test('WaveManager no anuncia enemigos comunes', () => {
    const calls = captureThreatCalls();
    const game = createGame();
    game.uiManager = calls.uiManager;
    game.audio = calls.audio;
    game.vfx = calls.vfx;
    game.spawnEnemy = (config) => ({ ...config, x: 14, y: 18 });
    const manager = new WaveManager(game, enemies);
    manager.preparedQueue = [{ config: { id: 'hydra_soldier', name: 'Soldado Hydra', hp: 80, speed: 1, reward: 10, threat: 2 }, delay: 0 }];
    manager.startNextWave();
    manager.update(1);

    assert.equal(calls.toasts.some(([message]) => message.includes('en ruta')), false);
    assert.equal(calls.rings.length, 0);
    assert.equal(calls.texts.length, 0);
});

function createGame(theme = 'new-york', activeTeam = [], deployed = []) {
    const resourceManager = {
        credits: 0,
        lives: 20,
        addCredits(amount) {
            this.credits += amount;
        }
    };
    return {
        uiManager: null,
        heroes: deployed,
        activeTeam,
        enemies: [],
        completedWaves: [],
        stars: 0,
        path: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
        currentLevel: { theme: { id: theme } },
        resourceManager,
        pause: () => {}
    };
}

function captureThreatCalls() {
    const toasts = [];
    const audioEvents = [];
    const rings = [];
    const texts = [];
    return {
        toasts,
        audioEvents,
        rings,
        texts,
        uiManager: {
            renderWavePreview: () => {},
            setNextWaveEnabled: () => {},
            clearWaveReport: () => {},
            showToast: (...args) => toasts.push(args)
        },
        audio: { play: (event) => audioEvents.push(event) },
        vfx: {
            addRing: (...args) => rings.push(args),
            addFloatingText: (...args) => texts.push(args)
        }
    };
}

function deployedHero({ id, name = id, damage, fireRate, range, level = 1, canSeeStealth = false }) {
    return {
        id,
        name,
        damage,
        fireRate,
        range,
        level,
        canSeeStealth,
        items: [],
        combatStats: { damageDealt: 0, kills: 0, shots: 0, crits: 0, goldGenerated: 0, abilityActivations: 0 },
        config: { id, level },
        getEffectiveStats: () => ({ damage, fireRate, range, canSeeStealth })
    };
}
