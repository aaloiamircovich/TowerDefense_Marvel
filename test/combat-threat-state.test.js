import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildBossHudState,
    buildCombatPressureState,
    buildPressureActionState,
    buildSpawnQueueState
} from '../src/ui/CombatThreatState.js';

const path = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 200, y: 0 }
];

test('CombatThreatState oculta presion cuando no hay oleada activa', () => {
    const state = buildCombatPressureState([], path, false);

    assert.equal(state.id, 'clear');
    assert.equal(state.label, 'Sin oleada');
    assert.equal(state.activeCount, 0);
});

test('CombatThreatState detecta frente cerca de la base', () => {
    const state = buildCombatPressureState([
        { uid: 'runner-1', name: 'Corredor', isAlive: true, distanceTravelled: 188 },
        { uid: 'grunt-1', name: 'Soldado', isAlive: true, distanceTravelled: 120 }
    ], path, true);

    assert.equal(state.id, 'critical');
    assert.equal(state.progress, 94);
    assert.equal(state.leadEnemyName, 'Corredor');
    assert.equal(state.dangerCount, 1);
});

test('CombatThreatState resume boss activo y proximo refuerzo', () => {
    const boss = buildBossHudState([
        { uid: 'loki', name: 'Loki', isAlive: true, isBoss: true, hp: 2400, maxHp: 10000, threat: 5, currentPhase: 'Engaño' },
        { uid: 'grunt', name: 'Chitauri', isAlive: true, hp: 100, maxHp: 100 }
    ], true);
    const next = buildSpawnQueueState([
        { delay: 4.75, config: { name: 'Ultron Prime', isBoss: true, threat: 5, archetype: 'boss' } },
        { delay: 6, config: { name: 'Drone', threat: 2 } }
    ], 1.5, true);

    assert.equal(boss.name, 'Loki');
    assert.equal(boss.hpPct, 24);
    assert.equal(boss.critical, true);
    assert.equal(next.name, 'Ultron Prime');
    assert.equal(next.eta, 3.3);
    assert.equal(next.danger, 'critical');
});

test('CombatThreatState recomienda mejora o ahorro segun creditos', () => {
    const pressure = { id: 'critical' };
    const heroes = [
        { id: 'iron_man', name: 'Iron Man', level: 2, damage: 40, fireRate: 1.5, range: 170 },
        { id: 'hulk', name: 'Hulk', level: 1, damage: 45, fireRate: 0.8, range: 90 }
    ];
    const upgrade = buildPressureActionState(pressure, heroes, 260, (level) => level * 120);
    const saving = buildPressureActionState(pressure, heroes, 80, (level) => level * 120);

    assert.equal(upgrade.type, 'upgrade');
    assert.equal(upgrade.heroId, 'iron_man');
    assert.equal(upgrade.cost, 240);
    assert.equal(saving.type, 'hint');
    assert.match(saving.label, /Faltan/);
    assert.equal(buildPressureActionState({ id: 'holding' }, heroes, 260), null);
});
