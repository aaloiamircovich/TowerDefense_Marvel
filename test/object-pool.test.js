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

test('CombatVfx anima texto flotante de dano', () => {
    const vfx = new CombatVfx();
    const calls = [];
    const ctx = {
        save: () => calls.push('save'),
        restore: () => calls.push('restore'),
        strokeText: (text, x, y) => calls.push(['strokeText', text, x, y]),
        fillText: (text, x, y) => calls.push(['fillText', text, x, y]),
        set globalAlpha(value) { calls.push(['alpha', value]); },
        set strokeStyle(value) { calls.push(['strokeStyle', value]); },
        set fillStyle(value) { calls.push(['fillStyle', value]); },
        set shadowColor(value) { calls.push(['shadowColor', value]); },
        set shadowBlur(value) { calls.push(['shadowBlur', value]); },
        set font(value) { calls.push(['font', value]); },
        set textAlign(value) { calls.push(['textAlign', value]); },
        set textBaseline(value) { calls.push(['textBaseline', value]); },
        set lineWidth(value) { calls.push(['lineWidth', value]); }
    };

    vfx.addFloatingText(50, 80, 'CRIT 42', { color: '#ff6b6b', size: 18 });
    vfx.update(0.18);
    vfx.render(ctx);

    assert.equal(vfx.effects[0].type, 'floatingText');
    assert.ok(calls.some((call) => Array.isArray(call) && call[0] === 'fillText' && call[1] === 'CRIT 42'));
});

test('CombatVfx reducido baja intensidad y omite rayos pesados', () => {
    const vfx = new CombatVfx();
    vfx.setReduced(true);

    const lightning = vfx.addLightning(40, 80);
    const ring = vfx.addRing(20, 20, { radius: 100, duration: 0.8 });
    const beam = vfx.addBeam({ x: 0, y: 0 }, { x: 100, y: 0 }, { width: 10, duration: 0.4 });

    assert.equal(lightning, null);
    assert.equal(vfx.effects.length, 2);
    assert.equal(ring.radius, 72);
    assert.equal(ring.duration, 0.32);
    assert.equal(beam.width, 6.2);
    assert.equal(beam.duration, 0.16);
    assert.equal(vfx.effects.every((effect) => effect.reduced), true);
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
