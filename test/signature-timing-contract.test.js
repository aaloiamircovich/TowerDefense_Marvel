import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { GameLoop } from '../src/core/GameLoop.js';
import { getEvolutionForHero } from '../src/systems/EvolutionSystem.js';
import { buildSignatureAttackContext, resolveSignatureAfterAttack, getSignatureConfig } from '../src/systems/ItemSignatureSystem.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));
const cases = [
    ['rogue', 'protocolo_danger_room', 3.2, 0.12, 0.18, 0],
    ['wolverine', 'protocolo_danger_room', 3, 0.2, 0, 8],
    ['peni_parker', 'nucleo_adaptativo', 3.2, 0.28, 0, 0],
    ['vision', 'nucleo_adaptativo', 3.2, 0.24, 0, 0],
    ['winter_soldier', 'nucleo_adaptativo', 3.2, 0.26, 0, 0]
];
const closeTo = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

function setup(id, itemId, level = 50) {
    let hero;
    const game = {
        heroes: [], enemies: [], resourceManager: { lives: 20 }, random: { next: () => 0.99 },
        progression: {
            getHeroBonuses: () => null,
            getHeroEvolution: () => getEvolutionForHero(hero, {}, { level: hero?.level ?? level, equippedItemIds: (hero?.items || []).map((item) => item.id) })
        }
    };
    hero = new Hero({ ...heroes[id], level }, 0, 0, game);
    hero.items = [items[itemId]];
    game.heroes = [hero];
    const target = new Enemy({ id: 'dummy', hp: 1000000, speed: 1 }, [{ x: 50, y: 0 }, { x: 1000, y: 0 }]);
    const advance = (count = 10, victim = target) => {
        for (let index = 0; index < count; index++) {
            const context = buildSignatureAttackContext(hero, victim, hero.getEffectiveStats());
            resolveSignatureAfterAttack(hero, victim, context.stats, {}, [], context);
        }
    };
    return { hero, target, game, advance, state: () => hero.signatureState[itemId] };
}

for (const [id, itemId, duration, fireRate, damage, crit] of cases) {
    test(`${id}: buff temporal exige evolucion, objeto y diez ataques`, () => {
        const f = setup(id, itemId, 49);
        f.advance(20);
        assert.equal(f.state().timedBuff, undefined);
        f.hero.level = 50;
        assert.ok(getSignatureConfig(f.hero));
        f.advance(9);
        assert.equal(f.state().timedBuff, undefined);
        f.advance(1);
        assert.equal(f.state().timedBuff.remaining, duration);
        f.hero.items = [];
        assert.equal(getSignatureConfig(f.hero), null);
    });

    test(`${id}: stats y proyectil reciben el buff una sola vez`, () => {
        const f = setup(id, itemId);
        const base = f.hero.getEffectiveStats();
        f.advance();
        const stats = f.hero.getEffectiveStats();
        closeTo(stats.damage, base.damage * (1 + damage));
        closeTo(stats.fireRate, base.fireRate * (1 + fireRate));
        closeTo(stats.critChance, base.critChance + crit);
        const context = buildSignatureAttackContext(f.hero, f.target, stats);
        closeTo(context.stats.damage, stats.damage);
        closeTo(context.stats.critChance, stats.critChance);
        const shots = [];
        f.hero.shoot(f.target, stats, shots);
        closeTo(shots[0].damage, stats.damage);
    });

    test(`${id}: dura segundos de simulacion, no ataques ni consultas`, () => {
        for (const dt of [0.1, duration]) {
            const f = setup(id, itemId);
            const base = f.hero.getEffectiveStats();
            f.advance();
            f.advance(3);
            for (let i = 0; i < 10; i++) f.hero.getEffectiveStats();
            closeTo(f.state().timedBuff.remaining, duration);
            for (let elapsed = 0; elapsed < duration - 1e-8; elapsed += dt) f.hero.update(Math.min(dt, duration - elapsed), [], []);
            closeTo(f.state().timedBuff.remaining, 0);
            const expired = f.hero.getEffectiveStats();
            for (const key of ['damage', 'fireRate', 'critChance']) closeTo(expired[key], base[key]);
        }
    });
}

test('cadencia de Overclock produce mas disparos reales antes de expirar', () => {
    const boosted = setup('peni_parker', 'nucleo_adaptativo');
    const control = setup('peni_parker', 'nucleo_adaptativo');
    boosted.advance();
    const dt = 1 / 240;
    for (let step = 0; step < 480; step++) {
        boosted.hero.update(dt, [boosted.target], []);
        control.hero.update(dt, [control.target], []);
    }
    assert.ok(boosted.hero.combatStats.shots > control.hero.combatStats.shots);
    closeTo(boosted.state().timedBuff.remaining, 1.2);
});

for (const [id, power] of [['vision', 0.25], ['winter_soldier', 0.22]]) {
    test(`${id}: penetracion temporal llega al proyectil con techo de 85%`, () => {
        const f = setup(id, 'nucleo_adaptativo');
        const before = f.hero.getProjectileProfile().armorPenetration;
        f.advance();
        const shots = [];
        f.hero.shoot(f.target, f.hero.getEffectiveStats(), shots);
        closeTo(shots[0].armorPenetration, Math.min(0.85, before + power));
        f.hero.update(3.2, [], []);
        closeTo(f.hero.getProjectileProfile().armorPenetration, before);
    });
}

test('stun no congela el buff, ni lo convierte en ataques durante la espera', () => {
    const f = setup('rogue', 'protocolo_danger_room');
    f.advance();
    f.hero.applyStun(5);
    f.hero.update(3.2, [f.target], []);
    closeTo(f.state().timedBuff.remaining, 0);
    assert.equal(f.hero.combatStats.shots, 0);
});

test('reloj del juego pausa los buffs y aplica velocidades x1, x2 y x4', () => {
    const original = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = () => {};
    try {
        for (const speed of [1, 2, 4]) {
            const f = setup('peni_parker', 'nucleo_adaptativo');
            f.advance();
            const loop = {
                lastTime: 0, isRunning: true, isManuallyPaused: true, isGameOver: false,
                gameSpeed: speed, enemies: [], projectiles: [], vfx: { effects: [] },
                performanceMonitor: { record: () => null }, render() {},
                update: (dt) => f.hero.update(dt, [], [])
            };
            for (let timestamp = 100; timestamp <= 500; timestamp += 100) GameLoop.prototype.loop.call(loop, timestamp);
            closeTo(f.state().timedBuff.remaining, 3.2);
            loop.isManuallyPaused = false;
            for (let timestamp = 600; timestamp <= 1000; timestamp += 100) GameLoop.prototype.loop.call(loop, timestamp);
            closeTo(f.state().timedBuff.remaining, 3.2 - 0.5 * speed);
            loop.isGameOver = true;
            GameLoop.prototype.loop.call(loop, 1100);
            closeTo(f.state().timedBuff.remaining, 3.2 - 0.5 * speed);
        }
    } finally {
        if (original === undefined) delete globalThis.requestAnimationFrame;
        else globalThis.requestAnimationFrame = original;
    }
});

test('reequipar no recupera tiempo gastado ni el decimo ataque acumula multiplicadores', () => {
    const f = setup('rogue', 'protocolo_danger_room');
    const base = f.hero.getEffectiveStats();
    f.advance();
    f.hero.update(1, [], []);
    f.advance();
    closeTo(f.state().timedBuff.remaining, 3.2);
    closeTo(f.hero.getEffectiveStats().damage, base.damage * 1.18);
    f.hero.items = [];
    f.hero.update(4, [], []);
    f.hero.items = [items.protocolo_danger_room];
    closeTo(f.hero.getEffectiveStats().damage, base.damage);
});

for (const [id, itemId, cap, duration] of [['white_tiger', 'talisman_tigre', 8, 3], ['tigra', 'talisman_tigre', 8, 3], ['she_hulk', 'nucleo_gamma', 10, 4]]) {
    test(`${id}: enfoque respeta techo, cambio de presa y caduca al dejar de atacar`, () => {
        const f = setup(id, itemId);
        f.advance(20);
        assert.equal(f.state().focusStacks, cap);
        f.hero.update(duration / 2, [], []);
        assert.equal(f.state().focusStacks, cap);
        f.advance(1);
        closeTo(f.state().focusTimer, duration);
        const other = new Enemy({ id: 'other', hp: 100000 }, [{ x: 60, y: 0 }, { x: 1000, y: 0 }]);
        f.advance(1, other);
        assert.equal(f.state().focusStacks, 1);
        f.hero.update(duration, [], []);
        assert.equal(f.state().focusStacks, 0);
        f.advance(1, other);
        assert.equal(f.state().focusStacks, 1);
    });
}
