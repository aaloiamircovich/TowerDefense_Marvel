import test from 'node:test';
import assert from 'node:assert/strict';
import { GameLoop } from '../src/core/GameLoop.js';

function createLoopHarness() {
    const leaks = [];
    const toasts = [];
    const loop = Object.create(GameLoop.prototype);
    loop.isGameOver = false;
    loop.gameOverCalls = 0;
    loop.resourceManager = {
        lives: 7,
        removeLife(amount) {
            this.lives = Math.max(0, this.lives - amount);
            loop.gameOver();
        }
    };
    loop.waveManager = {
        recordLeak(enemy, payload) {
            leaks.push({ enemy, payload });
        }
    };
    loop.missionSystem = { handleLeak: () => true };
    loop.modeSystem = { handleLeak: () => true };
    loop.uiManager = { showToast: (...args) => toasts.push(args) };
    loop.gameOver = function gameOver() {
        this.isGameOver = true;
        this.gameOverCalls++;
    };
    return { loop, leaks, toasts };
}

test('GameLoop derrota inmediatamente si un boss cruza la meta', () => {
    const { loop, leaks, toasts } = createLoopHarness();
    const boss = { id: 'loki', name: 'Loki', isBoss: true, processed: false };

    const result = loop.handleEnemyReachedEnd(boss);

    assert.equal(result.isBoss, true);
    assert.equal(result.absorbed, false);
    assert.equal(result.lifeLoss, 7);
    assert.equal(loop.resourceManager.lives, 0);
    assert.equal(loop.isGameOver, true);
    assert.equal(loop.gameOverCalls, 1);
    assert.equal(boss.processed, true);
    assert.equal(leaks.length, 1);
    assert.deepEqual(leaks[0].payload, { lifeLoss: 7, absorbed: false });
    assert.match(toasts[0][0], /Loki cruzo la linea/);
});

test('GameLoop conserva absorcion de fugas para enemigos comunes', () => {
    const { loop, leaks } = createLoopHarness();
    const enemy = { id: 'hydra', name: 'Soldado de Hydra', processed: false };

    const result = loop.handleEnemyReachedEnd(enemy);

    assert.equal(result.isBoss, false);
    assert.equal(result.absorbed, true);
    assert.equal(result.lifeLoss, 0);
    assert.equal(loop.resourceManager.lives, 7);
    assert.equal(loop.isGameOver, false);
    assert.equal(enemy.processed, true);
    assert.deepEqual(leaks[0].payload, { lifeLoss: 0, absorbed: true });
});

test('GameLoop reintenta campania desde oleada uno sin resetear heroes ni recursos', () => {
    const loop = Object.create(GameLoop.prototype);
    const hero = { id: 'spiderman', level: 4 };
    const calls = [];
    loop.isGameOver = true;
    loop.isManuallyPaused = true;
    loop.selectedUnit = hero;
    loop.heroes = [hero];
    loop.enemies = [{ id: 'hydra' }];
    loop.projectiles = [{ id: 'web' }];
    loop.stars = 12;
    loop.fps = 60;
    loop.path = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
    loop.currentLevel = { id: 'level_1' };
    loop.resourceManager = { lives: 0, maxLives: 20, credits: 889 };
    loop.clearProjectiles = () => {
        loop.projectiles.length = 0;
        calls.push('clearProjectiles');
    };
    loop.vfx = { clear: () => calls.push('clearVfx') };
    loop.missionSystem = { loadLevel: (level) => calls.push(['mission', level.id]) };
    loop.waveManager = {
        currentWave: 8,
        enemiesQueue: [{ id: 'queued' }],
        spawnTimer: 4,
        isWaveActive: true,
        selectedBranch: 'rush',
        waveStartSnapshot: { wave: 8 },
        waveLeakEvents: [{ id: 'leak' }],
        prepareNextWave: () => calls.push('prepare')
    };
    loop.uiManager = {
        updateCombatPressure: () => calls.push('pressure'),
        updateSpawnQueue: () => calls.push('spawnQueue'),
        updateBossHud: () => calls.push('bossHud'),
        setNextWaveEnabled: (enabled) => calls.push(['nextWave', enabled]),
        updateUI: (...args) => calls.push(['ui', ...args])
    };

    loop.retryCampaignFromFirstWave();

    assert.equal(loop.isGameOver, false);
    assert.equal(loop.isManuallyPaused, false);
    assert.equal(loop.selectedUnit, null);
    assert.deepEqual(loop.heroes, [hero]);
    assert.equal(hero.level, 4);
    assert.deepEqual(loop.enemies, []);
    assert.deepEqual(loop.projectiles, []);
    assert.equal(loop.resourceManager.lives, 20);
    assert.equal(loop.resourceManager.credits, 889);
    assert.equal(loop.stars, 12);
    assert.equal(loop.waveManager.currentWave, 1);
    assert.deepEqual(loop.waveManager.enemiesQueue, []);
    assert.equal(loop.waveManager.isWaveActive, false);
    assert.equal(loop.waveManager.selectedBranch, null);
    assert.deepEqual(loop.waveManager.waveLeakEvents, []);
    assert.ok(calls.includes('prepare'));
    assert.deepEqual(calls.at(-1), ['ui', 20, 889, 1, 60, 12]);
});
