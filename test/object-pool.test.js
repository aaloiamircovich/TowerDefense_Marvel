import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectPool } from '../src/utils/ObjectPool.js';
import { Projectile } from '../src/entities/Projectile.js';
import { CombatVfx } from '../src/rendering/CombatVfx.js';
import { PerformanceMonitor } from '../src/systems/PerformanceMonitor.js';

test('ObjectPool reutiliza objetos liberados', () => {
    const pool = new ObjectPool(() => ({ value: 0 }), (item) => { item.value = 0; }, 2);
    const first = pool.acquire((item) => { item.value = 7; });
    pool.release(first);
    const second = pool.acquire((item) => { item.value = 9; });

    assert.equal(second, first);
    assert.equal(second.value, 9);
    assert.equal(pool.getStats().created, 1);
    assert.equal(pool.getStats().reused, 1);
});

test('Projectile puede reiniciarse sin conservar referencias anteriores', () => {
    const firstTarget = { x: 10, y: 0, isAlive: true };
    const secondTarget = { x: 20, y: 0, isAlive: true };
    const projectile = new Projectile(0, 0, firstTarget, { damage: 12, effects: [{ type: 'slow' }] });
    projectile.deactivate();
    projectile.reset(3, 4, secondTarget, { damage: 25 });

    assert.equal(projectile.target, secondTarget);
    assert.equal(projectile.damage, 25);
    assert.deepEqual(projectile.effects, []);
    assert.equal(projectile.isActive, true);
});

test('CombatVfx devuelve efectos vencidos a su pool', () => {
    const vfx = new CombatVfx();
    vfx.addBurst(10, 10, { duration: 0.1 });
    vfx.update(0.2);
    vfx.addRing(20, 20, { duration: 1 });

    assert.equal(vfx.effects.length, 1);
    assert.equal(vfx.pool.getStats().created, 1);
    assert.equal(vfx.pool.getStats().reused, 1);
});

test('PerformanceMonitor calcula promedio, p95 y pico de entidades', () => {
    const monitor = new PerformanceMonitor(10, 1);
    [10, 12, 14, 16, 18].forEach((frame, index) => monitor.record(frame, index * 30));
    const snapshot = monitor.snapshot();

    assert.equal(snapshot.averageMs, 14);
    assert.equal(snapshot.p95Ms, 18);
    assert.equal(snapshot.peakEntities, 120);
});

test('PerformanceMonitor vigila el presupuesto de memoria de 128 MB', () => {
    const monitor = new PerformanceMonitor(4, 1);
    monitor.record(16, 20, 96 * 1048576);
    assert.equal(monitor.lastSnapshot.memoryBudgetOk, true);
    monitor.record(16, 20, 140 * 1048576);
    assert.equal(monitor.lastSnapshot.memoryBudgetOk, false);
    assert.equal(monitor.lastSnapshot.peakMemoryMb, 140);
});
