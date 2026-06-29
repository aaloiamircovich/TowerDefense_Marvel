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

test('Enemy corrige desplazamientos externos al punto mas cercano de la ruta', () => {
    const enemy = new Enemy({ id: 'test', hp: 100, speed: 0 }, [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 }
    ]);

    enemy.moveForward(120);
    enemy.x = 220;
    enemy.y = 80;
    enemy.update(0);

    assert.equal(enemy.pathIndex, 1);
    assert.equal(enemy.x, 100);
    assert.equal(enemy.y, 80);
    assert.equal(enemy.distanceTravelled, 180);
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

test('Enemy consume la barrera antes de perder salud', () => {
    const enemy = new Enemy({ id: 'shield', hp: 100, speed: 50, barrierRatio: 0.2 }, [{ x: 0, y: 0 }]);

    enemy.takeDamage(10);
    assert.equal(enemy.hp, 100);
    assert.equal(enemy.behavior.barrier, 10);

    enemy.takeDamage(20);
    assert.equal(enemy.hp, 90);
    assert.equal(enemy.behavior.barrier, 0);
});

test('Enemy aplica resistencias por categoria de atacante', () => {
    const enemy = new Enemy({
        id: 'resistant', hp: 100, speed: 50, resistances: { Tecnológico: 0.25 }
    }, [{ x: 0, y: 0 }]);

    enemy.takeDamage(20, { attackerType: 'Tecnológico' });
    assert.equal(enemy.hp, 85);
});

test('Soporte cura aliados cercanos sin superar su salud maxima', () => {
    const game = createEnemyGame();
    const support = new Enemy({
        id: 'support', hp: 100, speed: 1, archetype: 'support', healPower: 0.1, behaviorCooldown: 0.1
    }, game.path, game);
    const ally = new Enemy({ id: 'ally', hp: 100, speed: 1 }, game.path, game);
    ally.hp = 50;
    game.enemies = [support, ally];

    support.update(0.2);
    assert.equal(ally.hp, 60);
});

test('Invocador crea refuerzos sobre su misma ruta', () => {
    const game = createEnemyGame();
    let summon = null;
    game.enemyDatabase = { normal: { drone: { id: 'drone', hp: 20, speed: 20 } } };
    game.spawnEnemy = (config, source) => { summon = { config, source }; };
    const summoner = new Enemy({
        id: 'summoner', hp: 100, speed: 1, archetype: 'summoner', summonId: 'drone', summonLimit: 1, behaviorCooldown: 0.1
    }, game.path, game);

    summoner.update(0.2);
    assert.equal(summon.config.id, 'drone');
    assert.equal(summon.source, summoner);
});

test('Comandante Kree acelera aliados cercanos', () => {
    const game = createEnemyGame();
    const commander = new Enemy({ id: 'commander', hp: 100, speed: 1, archetype: 'commander', behaviorCooldown: 0.1, commandPower: 0.25 }, game.path, game);
    const ally = new Enemy({ id: 'ally', hp: 100, speed: 40 }, game.path, game);
    game.enemies = [commander, ally];

    commander.update(0.2);
    ally.updateDebuffs(0.1);
    assert.ok(ally.debuffs.some((effect) => effect.type === 'haste'));
    assert.equal(ally.speed, 50);
});

test('Faseador Chitauri entra en sigilo sin salir de la ruta', () => {
    const game = createEnemyGame();
    const phaser = new Enemy({ id: 'phaser', hp: 100, speed: 40, archetype: 'phaser', behaviorCooldown: 0.1 }, game.path, game);
    phaser.x = 40;
    phaser.distanceTravelled = 40;

    phaser.update(0.2);
    assert.equal(phaser.stealth, true);
    assert.equal(phaser.y, 0);
    assert.ok(phaser.x > 40);
});

test('Jefe anuncia y activa una fase por umbral de salud', () => {
    const game = createEnemyGame();
    const boss = new Enemy({
        id: 'boss', hp: 100, speed: 1, isBoss: true, archetype: 'boss',
        phases: [{ threshold: 0.8, name: 'Fase de prueba', telegraph: 0.2, barrier: 0.2 }]
    }, game.path, game);
    boss.takeDamage(30);

    boss.update(0.1);
    assert.equal(boss.telegraph.label, 'Fase de prueba');
    boss.update(0.2);
    assert.equal(boss.currentPhase, 'Fase de prueba');
    assert.equal(boss.behavior.barrier, 20);
});

test('Refuerzo aparece detras del invocador y permanece sobre un giro', () => {
    const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
    const source = new Enemy({ id: 'source', hp: 100, speed: 1 }, path);
    const reinforcement = new Enemy({ id: 'reinforcement', hp: 20, speed: 1 }, path);
    source.moveForward(150);

    reinforcement.copyPathPosition(source, 30);
    assert.equal(reinforcement.pathIndex, 1);
    assert.equal(reinforcement.x, 100);
    assert.equal(reinforcement.y, 20);
    assert.equal(reinforcement.distanceTravelled, 120);
});

function createEnemyGame() {
    return {
        path: [{ x: 0, y: 0 }, { x: 500, y: 0 }],
        enemies: [],
        vfx: { addRing: () => {}, addBurst: () => {} },
        audio: { play: () => {} },
        uiManager: { showToast: () => {} }
    };
}
