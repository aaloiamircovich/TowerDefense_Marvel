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
    assert.equal(manager.preparedQueue[0].config.id, 'loki');
});

test('WaveManager usa la faccion correspondiente al mapa', () => {
    const game = createGame('avengers');
    const manager = new WaveManager(game, enemies);
    const ids = new Set(manager.preparedQueue.map((entry) => entry.config.id));

    assert.equal(manager.faction.label, 'Legión de Ultrón');
    assert.deepEqual(ids, new Set(['doombot', 'ultron_drone']));
});

test('WaveManager aplica modificadores sin depender solo de salud', () => {
    const manager = new WaveManager(createGame(), enemies);
    manager.currentWave = 2;
    manager.prepareNextWave();

    assert.equal(manager.waveModifier.id, 'rush');
    assert.ok(manager.preparedQueue.every((entry) => entry.config.speed > enemies.normal[entry.config.id].speed));
});

test('WaveManager prepara barreras globales en la oleada protegida', () => {
    const manager = new WaveManager(createGame(), enemies);
    manager.currentWave = 3;
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
});

function createGame(theme = 'new-york') {
    return {
        uiManager: null,
        heroes: [],
        enemies: [],
        completedWaves: [],
        stars: 0,
        path: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
        currentLevel: { theme: { id: theme } },
        resourceManager: { addCredits: () => {} },
        pause: () => {}
    };
}
