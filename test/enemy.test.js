import test from 'node:test';
import assert from 'node:assert/strict';
import { Enemy } from '../src/entities/Enemy.js';

test('Enemy permanece fijado a un tramo horizontal', () => {
    const enemy = new Enemy({ id: 'test', hp: 10, speed: 50 }, [
        { x: 0, y: 100 },
        { x: 200, y: 100 }
    ]);

    enemy.y = 105;
    enemy.update(0.5);
    assert.equal(enemy.y, 100);
});

test('Enemy permanece fijado a un tramo vertical', () => {
    const enemy = new Enemy({ id: 'test', hp: 10, speed: 50 }, [
        { x: 120, y: 0 },
        { x: 120, y: 200 }
    ]);

    enemy.x = 126;
    enemy.update(0.5);
    assert.equal(enemy.x, 120);
});

test('Enemy aplica armadura porcentual', () => {
    const enemy = new Enemy({ id: 'test', hp: 100, speed: 50, armor: 0.5 }, [{ x: 0, y: 0 }]);
    enemy.takeDamage(20);
    assert.equal(enemy.hp, 90);
});

test('Enemy retrocede por los segmentos sin salir del camino', () => {
    const enemy = new Enemy({ id: 'test', hp: 100, speed: 100 }, [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 }
    ]);

    enemy.moveForward(150);
    enemy.moveBackward(80);

    assert.equal(enemy.pathIndex, 0);
    assert.equal(enemy.x, 70);
    assert.equal(enemy.y, 0);
    assert.equal(enemy.distanceTravelled, 70);
});

test('Enemy atribuye una baja por quemadura a su fuente', () => {
    const enemy = new Enemy({ id: 'test', hp: 5, speed: 50 }, [{ x: 0, y: 0 }]);
    const stats = { damage: 0, kills: 0 };
    const source = {
        recordDamage: (amount) => { stats.damage += amount; },
        recordKill: () => { stats.kills++; },
        game: { resourceManager: null }
    };

    enemy.applyStatus({ type: 'burn', duration: 1, power: 10 }, source);
    enemy.updateDebuffs(0.5);

    assert.equal(enemy.isAlive, false);
    assert.equal(stats.damage, 5);
    assert.equal(stats.kills, 1);
});

test('Enemy combina marca, ruptura y penetracion de armadura', () => {
    const enemy = new Enemy({ id: 'test', hp: 100, speed: 50, armor: 0.5 }, [{ x: 0, y: 0 }]);
    enemy.applyStatus({ type: 'armorBreak', duration: 2, power: 0.2 });
    enemy.applyStatus({ type: 'mark', duration: 2, power: 0.25 });

    const result = enemy.takeDamage(20 * enemy.getDamageTakenMultiplier(), { armorPenetration: 0.5 });
    assert.equal(result.damage, 21.25);
});
