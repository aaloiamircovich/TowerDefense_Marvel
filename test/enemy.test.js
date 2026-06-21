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
