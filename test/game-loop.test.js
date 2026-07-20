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
