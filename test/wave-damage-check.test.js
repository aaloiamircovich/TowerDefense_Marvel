import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWaveDamageCheck } from '../src/systems/WaveDamageCheck.js';

test('buildWaveDamageCheck ignora auras puras como dano directo', () => {
    const check = buildWaveDamageCheck({
        waveSeconds: 20,
        waveModel: { total: 4, effectiveHp: 1600, totalHp: 1600 },
        heroes: [
            { id: 'capitan_america', name: 'Capitan America', damage: 1, fireRate: 0, range: 255, special: { supportAura: { type: 'damage', power: 0.12, range: 255 } } },
            { id: 'iron_man', name: 'Iron Man', damage: 58, fireRate: 1.4, range: 180 }
        ]
    });

    assert.equal(check.requiredDamage, 1600);
    assert.ok(check.expectedDamage > 0);
    assert.deepEqual(check.contributors.map((entry) => entry.name), ['Iron Man']);
});

test('buildWaveDamageCheck trata phaser como amenaza invisible sin detector', () => {
    const striker = { id: 'hulk', name: 'Hulk', damage: 100, fireRate: 1, range: 170 };
    const detector = { id: 'black_widow', name: 'Black Widow', damage: 30, fireRate: 2, range: 150, canSeeStealth: true };
    const waveModel = {
        total: 3,
        roles: ['phaser'],
        effectiveHp: 1200,
        totalHp: 1200
    };

    const blocked = buildWaveDamageCheck({ heroes: [striker], waveModel, waveSeconds: 20 });
    const covered = buildWaveDamageCheck({ heroes: [striker, detector], waveModel, waveSeconds: 20 });

    assert.equal(blocked.expectedDamage, 0);
    assert.equal(blocked.contributors.length, 0);
    assert.deepEqual(blocked.warnings.map((entry) => entry.id), ['detection']);
    assert.match(blocked.detail, /DPS sin deteccion reducido/);
    assert.ok(covered.expectedDamage > 0);
    assert.equal(covered.warnings.length, 0);
    assert.deepEqual(covered.contributors.map((entry) => entry.name), ['Black Widow']);
});
