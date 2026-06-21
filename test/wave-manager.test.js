import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WaveManager } from '../src/systems/WaveManager.js';

const enemies = JSON.parse(fs.readFileSync(new URL('../data/enemies.json', import.meta.url), 'utf8'));

test('WaveManager prepara una primera oleada valida', () => {
    const manager = new WaveManager(createGame(), enemies);
    assert.equal(manager.currentWave, 1);
    assert.equal(manager.preparedQueue.length, 7);
    assert.ok(manager.getUniqueEnemies().every((enemy) => enemy.previewCount > 0));
});

test('WaveManager prepara un jefe cada diez oleadas', () => {
    const manager = new WaveManager(createGame(), enemies);
    manager.currentWave = 10;
    manager.prepareNextWave();

    assert.equal(manager.preparedQueue.length, 1);
    assert.equal(manager.preparedQueue[0].config.isBoss, true);
});

function createGame() {
    return {
        uiManager: null,
        heroes: [],
        enemies: [],
        completedWaves: [],
        stars: 0,
        path: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
        resourceManager: { addCredits: () => {} },
        pause: () => {}
    };
}
