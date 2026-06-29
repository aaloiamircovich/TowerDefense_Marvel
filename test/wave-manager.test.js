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
});

function createGame(theme = 'new-york', activeTeam = []) {
    return {
        uiManager: null,
        heroes: [],
        activeTeam,
        enemies: [],
        completedWaves: [],
        stars: 0,
        path: [{ x: 0, y: 0 }, { x: 40, y: 0 }],
        currentLevel: { theme: { id: theme } },
        resourceManager: { addCredits: () => {} },
        pause: () => {}
    };
}
