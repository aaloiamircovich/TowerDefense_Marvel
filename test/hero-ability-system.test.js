import test from 'node:test';
import assert from 'node:assert/strict';
import { Enemy } from '../src/entities/Enemy.js';
import { Hero } from '../src/entities/Hero.js';
import { HeroAbilitySystem } from '../src/systems/HeroAbilitySystem.js';

test('Sobrecarga ARC encuentra solo enemigos alineados', () => {
    const origin = { x: 0, y: 0 };
    const target = { x: 100, y: 0 };
    const aligned = { x: 70, y: 10, isAlive: true };
    const outside = { x: 70, y: 35, isAlive: true };
    const behind = { x: -10, y: 0, isAlive: true };

    const result = HeroAbilitySystem.getLineTargets(origin, target, [aligned, outside, behind], 120, 20);
    assert.deepEqual(result, [aligned]);
});

test('Spider-Man inmoviliza al acumular tres redes', () => {
    const enemy = createEnemy(100, 0);
    const web = { type: 'web', duration: 2.6, power: 0.2 };
    let binds = 0;
    const source = { recordAbility: () => { binds++; } };

    enemy.applyStatus(web, source);
    enemy.applyStatus(web, source);
    enemy.updateDebuffs(0.1);
    assert.equal(enemy.speed, 60);

    enemy.applyStatus(web, source);
    enemy.updateDebuffs(0.1);
    assert.equal(enemy.speed, 0);
    assert.equal(enemy.debuffs.find((status) => status.type === 'web').stacks, 0);
    assert.equal(binds, 1);
});

test('Capitan America mejora dano y cadencia de aliados cercanos', () => {
    const game = createGame();
    const captain = { id: 'capitan_america', x: 0, y: 0 };
    const ally = new Hero(createHeroConfig('iron_man'), 100, 0, game);
    game.heroes = [captain, ally];

    const stats = ally.getEffectiveStats();
    assert.equal(stats.damage, 11);
    assert.equal(stats.fireRate, 1.15);
});

test('Iron Man activa Sobrecarga ARC cada tres ataques', () => {
    const game = createGame();
    const target = createEnemy(100, 0);
    game.enemies = [target];
    const hero = new Hero(createHeroConfig('iron_man'), 0, 0, game);
    game.heroes = [hero];
    const config = { damage: 10, attacker: hero, attackerType: 'Tecnológico', effects: [] };

    hero.abilitySystem.onAttack(target, hero.getEffectiveStats(), config, []);
    hero.abilitySystem.onAttack(target, hero.getEffectiveStats(), config, []);
    hero.abilitySystem.onAttack(target, hero.getEffectiveStats(), config, []);

    assert.equal(target.hp, 86.5);
    assert.equal(hero.combatStats.abilityActivations, 1);
});

test('Thor activa Tormenta Divina con varios objetivos', () => {
    const game = createGame();
    const targets = [createEnemy(50, 0), createEnemy(90, 0)];
    game.enemies = targets;
    const hero = new Hero(createHeroConfig('thor'), 0, 0, game);
    game.heroes = [hero];

    hero.abilitySystem.update(0.1, targets, hero.getEffectiveStats(), []);

    assert.ok(targets.every((target) => target.hp < 100));
    assert.ok(hero.abilitySystem.cooldownRemaining > 10);
    assert.equal(hero.combatStats.abilityActivations, 1);
});

test('Doctor Strange duplica cada segundo proyectil', () => {
    const game = createGame();
    const targets = [createEnemy(50, 0), createEnemy(80, 0)];
    game.enemies = targets;
    const hero = new Hero(createHeroConfig('doctor_strange'), 0, 0, game);
    game.heroes = [hero];
    const projectiles = [];
    const config = { damage: 10, attacker: hero, attackerType: 'Místico', effects: [], radius: 5 };

    hero.abilitySystem.onAttack(targets[0], hero.getEffectiveStats(), config, projectiles);
    hero.abilitySystem.onAttack(targets[0], hero.getEffectiveStats(), config, projectiles);

    assert.equal(projectiles.length, 1);
    assert.equal(projectiles[0].target, targets[1]);
    assert.equal(projectiles[0].damage, 6.5);
    assert.equal(hero.combatStats.abilityActivations, 1);
});

function createHeroConfig(id) {
    return {
        id,
        name: id,
        damage: 10,
        range: 200,
        fireRate: 1,
        category: id === 'iron_man' ? 'Tecnológico' : 'Místico',
        allowedTerrains: [1]
    };
}

function createEnemy(x, y) {
    const enemy = new Enemy({ id: 'target', hp: 100, speed: 100, category: 'Urbano' }, [
        { x, y },
        { x: x + 300, y }
    ]);
    enemy.x = x;
    enemy.y = y;
    return enemy;
}

function createGame() {
    return {
        heroes: [],
        enemies: [],
        projectiles: [],
        resourceManager: { lives: 20 },
        random: { next: () => 0.5 },
        vfx: { addBeam: () => {}, addBurst: () => {}, addLightning: () => {}, addRing: () => {} },
        audio: { play: () => {} },
        showHeroRanges: false
    };
}
