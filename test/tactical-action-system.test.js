import test from 'node:test';
import assert from 'node:assert/strict';
import { TacticalActionSystem } from '../src/systems/TacticalActionSystem.js';

test('venta tactica devuelve 70% y retira una sola vez', () => {
    const hero = { config: { cost: 250 }, deployedCost: 250 };
    const game = createGame(hero);
    const tactical = new TacticalActionSystem(game);

    assert.deepEqual(tactical.sell(hero), { ok: true, refund: 175 });
    assert.equal(game.resourceManager.credits, 175);
    assert.equal(game.heroes.length, 0);
    assert.equal(tactical.sell(hero).ok, false);
    assert.equal(game.resourceManager.credits, 175);
});

test('venta queda bloqueada durante una oleada activa', () => {
    const hero = { config: { cost: 200 } };
    const game = createGame(hero);
    game.waveManager.isWaveActive = true;
    const result = new TacticalActionSystem(game).sell(hero);

    assert.equal(result.ok, false);
    assert.match(result.reason, /entre oleadas/);
    assert.equal(game.heroes.length, 1);
});

test('reposicion permite un movimiento por numero de oleada', () => {
    const hero = { config: { cost: 200 }, lastRepositionWave: -1 };
    const game = createGame(hero);
    const tactical = new TacticalActionSystem(game);

    assert.equal(tactical.markRepositioned(hero).ok, true);
    assert.equal(tactical.canReposition(hero).ok, false);
    game.waveManager.currentWave = 2;
    assert.equal(tactical.canReposition(hero).ok, true);
});

test('reposicion se bloquea al terminar la partida', () => {
    const hero = { config: { cost: 200 }, lastRepositionWave: -1 };
    const game = createGame(hero);
    game.isGameOver = true;
    assert.equal(new TacticalActionSystem(game).canReposition(hero).ok, false);
});

function createGame(hero) {
    return {
        heroes: [hero],
        selectedUnit: hero,
        isGameOver: false,
        waveManager: { currentWave: 1, isWaveActive: false },
        resourceManager: { credits: 0, addCredits(amount) { this.credits += amount; } }
    };
}
