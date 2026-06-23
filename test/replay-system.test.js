import test from 'node:test';
import assert from 'node:assert/strict';
import { ReplaySystem } from '../src/systems/ReplaySystem.js';

test('replay conserva semilla y decisiones tacticas', () => {
    const game = { waveManager: { currentWave: 4 } };
    const replay = new ReplaySystem(game);
    replay.reset('daily:2026-06-23', 'level_2', 'daily');
    replay.record('branch', { branchId: 'bounty' });
    const imported = new ReplaySystem(game);
    assert.equal(imported.importReplay(replay.exportReplay()).ok, true);
    assert.equal(imported.replay.seed, 'daily:2026-06-23');
    assert.deepEqual(imported.replay.actions[0], { wave: 4, type: 'branch', payload: { branchId: 'bounty' } });
});

test('replay rechaza estructuras desconocidas', () => {
    assert.equal(new ReplaySystem({}).importReplay('{"seed":"x"}').ok, false);
});
