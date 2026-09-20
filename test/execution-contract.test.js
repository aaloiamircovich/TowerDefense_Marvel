import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { GameLoop } from '../src/core/GameLoop.js';
import { getEvolutionForHero } from '../src/systems/EvolutionSystem.js';
import { buildSignatureAttackContext, resolveSignatureAfterAttack } from '../src/systems/ItemSignatureSystem.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));

function setup(id, level = 100) {
    let hero;
    const game = {
        heroes: [], enemies: [], random: { next: () => 0.99 },
        resourceManager: { lives: 15, credits: 0, addCredits(value) { this.credits += value; } },
        progression: {
            getHeroBonuses: () => null,
            getHeroEvolution: () => getEvolutionForHero(hero, {}, { level: hero?.level ?? level, equippedItemIds: (hero?.items || []).map((item) => item.id) })
        }
    };
    hero = new Hero({ ...heroes[id], level }, 0, 0, game);
    hero.items = id === 'sentry' ? [items.el_vacio] : [];
    game.heroes = [hero];
    const spawn = (options = {}) => {
        const target = new Enemy({ id: 'dummy', hp: 100000, speed: 1, category: hero.category, reward: 100, ...options }, [{ x: 40, y: 0 }, { x: 2000, y: 0 }]);
        game.enemies.push(target);
        return target;
    };
    const trigger = (target, attacks = id === 'sentry' ? 24 : 1) => {
        for (let i = 0; i < attacks; i++) {
            const stats = hero.getEffectiveStats();
            if (id === 'gamora') hero.abilitySystem.cosmicKit.activateGamoraCombo(target, stats);
            else {
                const ctx = buildSignatureAttackContext(hero, target, stats);
                resolveSignatureAfterAttack(hero, target, ctx.stats, {}, [], ctx);
            }
        }
    };
    return { hero, game, spawn, trigger };
}

for (const id of ['gamora', 'sentry']) {
    for (const defense of ['none', 'armor', 'barrier', 'resistance', 'type', 'combined']) {
        test(`${id}: ejecucion contra ${defense} registra solo HP restantes y una baja`, () => {
            const f = setup(id);
            const combined = defense === 'combined';
            const target = f.spawn({
                armor: defense === 'armor' || combined ? 85 : 0,
                barrierRatio: defense === 'barrier' || combined ? 0.5 : 0,
                category: defense === 'type' || combined ? 'Místico' : f.hero.category,
                resistances: defense === 'resistance' || combined ? { [f.hero.category]: 0.8 } : {}
            });
            target.hp = 25000;
            target.applyStatus({ type: 'mark', power: 0.3, duration: 5 }, f.hero);
            const barrier = target.behavior.barrier;
            f.trigger(target);
            assert.equal(target.hp, 0);
            assert.equal(target.isAlive, false);
            assert.equal(f.hero.combatStats.damageDealt, 25000);
            assert.equal(f.hero.combatStats.kills, 1);
            assert.equal(target.killCredited, true);
            assert.equal(target.behavior.barrier, barrier, 'bypass no contabiliza barrera como dano');
            f.trigger(target);
            CombatSystem.applyImpact({ damage: 999999, attackerType: f.hero.category }, target, f.hero, f.game.resourceManager);
            assert.equal(f.hero.combatStats.damageDealt, 25000);
            assert.equal(f.hero.combatStats.kills, 1);
            assert.equal(f.hero.combatStats.abilityActivations, 1);
            assert.equal(f.game.resourceManager.credits, 0, 'la recompensa sigue a cargo de GameLoop');
            assert.equal(f.game.resourceManager.lives, 15);
        });
    }

    for (const flag of ['isBoss', 'isFinalBoss', 'isMiniBoss']) {
        test(`${id}: ${flag} nunca recibe ejecucion proporcional a su HP`, () => {
            const f = setup(id);
            const target = f.spawn({ [flag]: true, armor: 85, resistances: { [f.hero.category]: 0.8 } });
            target.hp = 20000;
            const damage = f.hero.getEffectiveStats().damage;
            f.trigger(target);
            const expected = id === 'gamora' ? 0 : damage * 3 * 0.2 * (1 - 0.85 * 0.35);
            assert.ok(Math.abs(target.hp - (20000 - expected)) < 1e-6);
            assert.equal(target.isAlive, true);
            assert.equal(f.hero.combatStats.kills, 0);
        });
    }
}

test('Gamora respeta umbral inclusivo 25% y combo incidental por encima', () => {
    const f = setup('gamora', 1);
    const primary = f.spawn();
    primary.hp = 25001;
    const neighbor = f.spawn();
    f.trigger(primary);
    assert.equal(primary.hp, 25001);
    assert.ok(neighbor.hp < neighbor.maxHp);
    const before = neighbor.hp;
    primary.hp = 25000;
    f.trigger(primary);
    assert.equal(primary.isAlive, false);
    assert.equal(neighbor.hp, before, 'ejecucion no dispara tambien el combo');
});

test('The Void se activa cada 24 ataques, no antes, incluso contra vida completa', () => {
    const f = setup('sentry');
    const primary = f.spawn({ armor: 85 });
    f.trigger(primary, 23);
    assert.equal(primary.hp, primary.maxHp);
    f.trigger(primary, 1);
    assert.equal(primary.isAlive, false);
    const next = f.spawn();
    f.trigger(next, 23);
    assert.equal(next.hp, next.maxHp);
    f.trigger(next, 1);
    assert.equal(next.isAlive, false);
    assert.equal(f.hero.combatStats.kills, 2);
});

test('The Void requiere nivel 100 y EL VACIO en el unico slot activo', () => {
    const f = setup('sentry', 99);
    const target = f.spawn();
    f.trigger(target);
    assert.equal(target.hp, target.maxHp);
    f.hero.level = 100;
    f.hero.items = [];
    f.trigger(target);
    assert.equal(target.hp, target.maxHp);
    f.hero.items = [{ id: 'unrelated', effects: {} }, items.el_vacio];
    f.trigger(target);
    assert.equal(target.hp, target.maxHp);
    f.hero.items = [items.el_vacio];
    f.trigger(target);
    assert.equal(target.isAlive, false);
});

test('The Void contra boss mantiene dano ordinario absorbible por barrera', () => {
    const f = setup('sentry');
    const target = f.spawn({ isBoss: true, barrierRatio: 0.5 });
    const before = target.behavior.barrier;
    const damage = f.hero.getEffectiveStats().damage * 3;
    f.trigger(target);
    assert.equal(target.hp, target.maxHp);
    assert.ok(Math.abs(target.behavior.barrier - (before - damage)) < 1e-6);
});

test('Gamora no duplica baja ni dano con el proyectil ordinario ya en vuelo', () => {
    const f = setup('gamora');
    const target = f.spawn({ barrierRatio: 0.5 });
    target.hp = 25000;
    const projectiles = [];
    f.hero.shoot(target, f.hero.getEffectiveStats(), projectiles);
    assert.equal(target.isAlive, false);
    for (const shot of projectiles) shot.update(10);
    assert.equal(f.hero.combatStats.kills, 1);
    assert.equal(f.hero.combatStats.damageDealt, 25000);
});

for (const id of ['gamora', 'sentry']) {
    test(`${id}: GameLoop entrega recompensa de ejecucion una sola vez`, () => {
        const f = setup(id);
        const target = f.spawn({ barrierRatio: 0.5 });
        target.hp = 25000;
        f.trigger(target);
        const loop = Object.assign(Object.create(GameLoop.prototype), {
            enemies: [target], heroes: [], projectiles: [],
            resourceManager: f.game.resourceManager, vfx: { update() {} }
        });
        loop.update(0);
        assert.equal(loop.resourceManager.credits, 100);
        assert.equal(target.rewarded, true);
        assert.equal(loop.enemies.length, 0);
        loop.enemies.push(target);
        loop.update(0);
        assert.equal(loop.resourceManager.credits, 100);
    });
}

test('ejecucion central rechaza flags de jefe runtime y entradas invalidas', () => {
    const f = setup('gamora');
    for (const flag of ['isBoss', 'isFinalBoss', 'isMiniBoss']) {
        const target = f.spawn();
        target[flag] = true;
        assert.deepEqual(CombatSystem.executeNonBoss(target, f.hero), { damage: 0, killed: false });
        assert.equal(target.hp, target.maxHp);
    }
    for (const target of [null, { isAlive: false, hp: 1 }, { isAlive: true, hp: Infinity }, { isAlive: true, hp: 0 }]) {
        assert.deepEqual(CombatSystem.executeNonBoss(target, f.hero), { damage: 0, killed: false });
    }
    assert.equal(f.hero.combatStats.kills, 0);
});

test('The Void puede matar boss con dano suficiente sin inflar el registro', () => {
    const f = setup('sentry');
    const target = f.spawn({ isBoss: true });
    target.hp = 10;
    f.trigger(target);
    assert.equal(target.isAlive, false);
    assert.equal(f.hero.combatStats.damageDealt, 10);
    assert.equal(f.hero.combatStats.kills, 1);
});
