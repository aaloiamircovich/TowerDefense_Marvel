import { Enemy } from '../src/entities/Enemy.js';
import { Projectile } from '../src/entities/Projectile.js';
import { CombatVfx } from '../src/rendering/CombatVfx.js';
import { ObjectPool } from '../src/utils/ObjectPool.js';

const TARGET_FRAME_MS = 1000 / 60;
const path = [
    { x: 0, y: 100 }, { x: 800, y: 100 }, { x: 800, y: 500 }, { x: 0, y: 500 }
];
const game = { resourceManager: null, enemies: [], random: { next: () => 0.5 } };
const enemies = Array.from({ length: 150 }, (_, index) => new Enemy({
    id: `benchmark-${index}`,
    name: 'Unidad de prueba',
    hp: 1_000_000,
    speed: 18 + index % 12,
    reward: 0,
    archetype: 'soldier'
}, path, game));
game.enemies = enemies;

const projectilePool = new ObjectPool(() => new Projectile(0, 0, null), (projectile) => projectile.deactivate(), 512);
const projectiles = Array.from({ length: 300 }, (_, index) => projectilePool.acquire((projectile) => projectile.reset(
    400,
    300,
    enemies[index % enemies.length],
    { damage: 1, projectileSpeed: 20, color: '#40c9ff' }
)));
const vfx = new CombatVfx();
for (let index = 0; index < 120; index++) vfx.addRing(index * 7 % 800, index * 11 % 600, { duration: 20 });

const samples = [];
for (let tick = 0; tick < 600; tick++) {
    const start = performance.now();
    enemies.forEach((enemy) => enemy.update(1 / 60));
    projectiles.forEach((projectile) => projectile.update(1 / 60));
    vfx.update(1 / 60);
    samples.push(performance.now() - start);
}

projectiles.forEach((projectile) => projectilePool.release(projectile));
for (let index = 0; index < 300; index++) projectilePool.acquire((projectile) => projectile.reset(0, 0, enemies[0], {}));

samples.sort((a, b) => a - b);
const average = samples.reduce((total, value) => total + value, 0) / samples.length;
const p95 = samples[Math.floor(samples.length * 0.95)];
const poolStats = projectilePool.getStats();

console.log('Benchmark 150 enemigos / 300 proyectiles / 120 VFX');
console.log(`Tick promedio: ${average.toFixed(3)} ms`);
console.log(`Tick p95: ${p95.toFixed(3)} ms (objetivo < ${TARGET_FRAME_MS.toFixed(2)} ms)`);
console.log(`Pool de proyectiles: ${poolStats.created} creados, ${poolStats.reused} reutilizados`);

if (p95 > TARGET_FRAME_MS) {
    console.error('ERROR: el benchmark no sostiene el presupuesto de 60 FPS.');
    process.exitCode = 1;
}
