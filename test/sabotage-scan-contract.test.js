import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Hero } from '../src/entities/Hero.js';
import { Enemy, buildEnemyStatusPips } from '../src/entities/Enemy.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { getEvolutionForHero } from '../src/systems/EvolutionSystem.js';
import { TacticalActionSystem } from '../src/systems/TacticalActionSystem.js';
import { buildHeroCombatIdentity, evaluateHeroWaveFit, heroControlsCrowd } from '../src/ui/HeroTacticsState.js';
import { heroMatchesTacticId } from '../src/ui/TeamTacticFilters.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
const sabotage = { type: 'sabotage', duration: 2, power: 1 };
const scan = { type: 'barrierScan', duration: 3, power: 0.35 };

function setup(id = 'black_widow', level = 1) {
    let hero;
    const game = {
        heroes: [], enemies: [], projectiles: [], summons: [], random: { next: () => 0.99 },
        resourceManager: { credits: 0, lives: 15, addCredits(n) { this.credits += n; } },
        enemyDatabase: { normal: { drone: { id: 'drone', hp: 100 } } },
        spawnEnemy(config, source) { this.summons.push({ config, source }); },
        progression: {
            getHeroBonuses: () => null,
            getHeroEvolution: () => hero ? getEvolutionForHero(hero.config, {}, {
                level: hero.level, equippedItemIds: hero.items.map((item) => item.id)
            }) : null
        }
    };
    hero = new Hero({ ...heroes[id], level }, 0, 0, game);
    game.heroes = [hero];
    const spawn = (options = {}, x = 60, y = 0) => {
        const enemy = new Enemy({ id: 'target', category: hero.category, hp: 10000, speed: 10,
            reward: 100, ...options }, [{ x, y }, { x: 10000, y }], game);
        game.enemies.push(enemy);
        return enemy;
    };
    const shoot = (target) => {
        const shots = [];
        hero.shoot(target, hero.getEffectiveStats(), shots);
        return shots;
    };
    const hit = (target, damage = 100, extra = {}, attacker = hero) => CombatSystem.applyImpact(
        { damage, attackerType: hero.category, ...extra }, target, attacker, game.resourceManager);
    return { game, hero, spawn, shoot, hit };
}

for (const archetype of ['support', 'summoner', 'commander']) {
    test(`sabotaje suspende ${archetype}, conserva movimiento y reanuda su accion`, () => {
        const f = setup();
        const target = f.spawn({ archetype, behaviorCooldown: 1, summonId: 'drone', summonLimit: 2 });
        const ally = f.spawn({}, 80); ally.hp = 5000;
        target.behavior.actionTimer = 0;
        assert.equal(target.applyStatus(sabotage, f.hero), true);
        target.update(1);
        assert.equal(target.x, 70);
        assert.equal(ally.hp, 5000);
        assert.equal(ally.debuffs.length, 0);
        assert.equal(f.game.summons.length, 0);
        target.update(1);
        if (archetype === 'support') assert.ok(ally.hp > 5000);
        if (archetype === 'summoner') assert.equal(f.game.summons.length, 1);
        if (archetype === 'commander') assert.ok(ally.debuffs.some((s) => s.type === 'haste'));
        assert.equal(f.game.resourceManager.lives, 15);
    });
}

test('comandante por afijo tambien se inhibe sin borrar buffs previos', () => {
    const f = setup();
    const target = f.spawn({ affix: { id: 'commander' } });
    const ally = f.spawn();
    target.behavior.commandAllies();
    assert.equal(target.applyStatus(sabotage, f.hero), true);
    assert.ok(ally.debuffs.some((s) => s.type === 'haste'));
});

test('faseador con afijo comandante pierde ordenes, no su cambio de fase', () => {
    const f = setup();
    const target = f.spawn({ archetype: 'phaser', affix: { id: 'commander' } });
    const ally = f.spawn();
    target.behavior.actionTimer = 0.5;
    target.applyStatus(sabotage, f.hero);
    target.update(0.6);
    assert.equal(target.stealth, true);
    assert.ok(target.behavior.sabotageRemaining > 0);
    assert.equal(ally.debuffs.some((s) => s.type === 'haste'), false);
});

test('recarga fraccionaria conserva el tiempo pendiente tras sabotaje', () => {
    const f = setup();
    const target = f.spawn({ archetype: 'support' });
    target.behavior.actionTimer = 4;
    target.applyStatus(sabotage);
    target.update(2.5);
    close(target.behavior.actionTimer, 3.5);
});

test('no refresca sabotaje activo y exige 3 s de inmunidad despues', () => {
    const f = setup();
    const target = f.spawn({ archetype: 'support', statusResistance: 0.5 });
    assert.equal(target.applyStatus(sabotage, f.hero), true);
    close(target.behavior.sabotageRemaining, 1);
    for (let i = 0; i < 39; i++) {
        assert.equal(target.applyStatus(sabotage, f.hero), false);
        target.update(0.1);
    }
    assert.equal(target.applyStatus(sabotage, f.hero), false);
    target.update(0.1);
    assert.equal(target.applyStatus(sabotage, f.hero), true);
});

for (const flags of [{ isBoss: true }, { isFinalBoss: true }, { isMiniBoss: true }, { archetype: 'soldier' }]) {
    test(`sabotaje rechaza ${JSON.stringify(flags)}`, () => {
        const f = setup();
        const target = f.spawn({ archetype: 'support', ...flags });
        assert.equal(target.applyStatus(sabotage, f.hero), false);
        assert.equal(target.behavior.sabotageLockout, 0);
        assert.equal(target.debuffs.length, 0);
    });
}

test('fases de jefe conservan invocacion y telegraph durante fuego de Widow', () => {
    const f = setup();
    const target = f.spawn({ isBoss: true, phases: [{ threshold: 1, name: 'Refuerzos', telegraph: 0.1, summonId: 'drone', summonCount: 2 }] });
    for (let i = 0; i < 4; i++) f.shoot(target);
    target.update(0.1);
    assert.ok(target.telegraph);
    target.update(0.2);
    assert.equal(f.game.summons.length, 2);
    assert.equal(target.currentPhase, 'Refuerzos');
});

for (const level of [1, 49, 50, 51, 99, 100]) {
    test(`Widow nivel ${level}: cuarta descarga, sin marca/stun, maximo cuatro victimas`, () => {
        const f = setup('black_widow', level);
        const target = f.spawn({ archetype: 'support' });
        for (let i = 0; i < 5; i++) f.spawn({ archetype: 'support' }, 65 + i);
        for (let i = 0; i < 3; i++) f.shoot(target);
        assert.equal(target.behavior.sabotageRemaining, 0);
        f.shoot(target);
        const affected = f.game.enemies.filter((e) => e.hp < e.maxHp);
        assert.equal(affected.length, 4);
        assert.ok(affected.every((e) => e.behavior.sabotageRemaining === 2));
        assert.ok(f.game.enemies.every((e) => e.debuffs.every((s) => !['stun', 'mark'].includes(s.type))));
        assert.equal(f.hero.combatStats.abilityActivations, 1);
        assert.equal(f.game.resourceManager.credits, 0);
    });
}

test('Widow prefiere apoyos secundarios, respeta alcance, sigilo y muertos', () => {
    const f = setup();
    f.hero.config.canSeeStealth = false;
    const target = f.spawn();
    const soldier = f.spawn({}, 70);
    const supports = [1, 2, 3].map((n) => f.spawn({ archetype: 'support' }, 70 + n));
    const hidden = f.spawn({ archetype: 'support', stealth: true }, 75);
    const far = f.spawn({ archetype: 'support' }, 170);
    const dead = f.spawn({ archetype: 'support' }, 80); dead.isAlive = false;
    for (let i = 0; i < 4; i++) f.shoot(target);
    assert.ok(supports.every((e) => e.behavior.sabotageRemaining > 0));
    for (const enemy of [soldier, hidden, far, dead]) assert.equal(enemy.hp, enemy.maxHp);
});

test('Widow sin blanco o aturdida no carga; retirar no reinicia inmunidad enemiga', () => {
    const f = setup();
    const target = f.spawn({ archetype: 'support' });
    f.hero.update(2, [], []);
    f.hero.applyStun(2); f.hero.update(1, [target], []);
    assert.equal(f.hero.abilitySystem.avengerKit.attackCount, 0);
    target.applyStatus(sabotage, f.hero);
    new TacticalActionSystem(f.game).sell(f.hero);
    const replacement = new Hero(heroes.black_widow, 0, 0, f.game);
    assert.equal(target.applyStatus(sabotage, replacement), false);
});

test('Shuri aplica escaneo despues del primer impacto, sin marca general', () => {
    const f = setup('shuri');
    const target = f.spawn({ barrierRatio: 1 });
    const [shot] = f.shoot(target);
    f.hit(target, shot.damage, { effects: shot.effects });
    close(target.behavior.barrier, 10000 - shot.damage);
    assert.equal(target.debuffs.find((s) => s.type === 'barrierScan').power, 0.35);
    assert.equal(target.debuffs.some((s) => s.type === 'mark'), false);
    const before = target.behavior.barrier;
    const ally = new Hero({ id: 'ally', damage: 100 }, 0, 0, f.game);
    f.hit(target, 100, {}, ally);
    close(before - target.behavior.barrier, 135);
});

for (const level of [1, 49, 50, 51, 99, 100]) {
    test(`Shuri nivel ${level}: escaneo 35%, no suma copias y solo sobre barrera`, () => {
        const f = setup('shuri', level);
        const target = f.spawn({ barrierRatio: 1 });
        const [effect] = f.hero.getProjectileEffects(target);
        assert.equal(effect.type, 'barrierScan');
        assert.equal(effect.power, 0.35);
        for (let i = 0; i < 3; i++) target.applyStatus(effect, f.hero);
        f.hit(target);
        close(target.behavior.barrier, 9865);
        assert.equal(target.debuffs.filter((s) => s.type === 'barrierScan').length, 1);
        assert.equal(f.spawn().applyStatus(effect, f.hero), false);
    });
}

test('romper escudo borra escaneo; sobrante de vida sin multiplicar', () => {
    const f = setup('shuri');
    const target = f.spawn({ barrierRatio: 0.005 });
    target.applyStatus(scan, f.hero);
    f.hit(target, 100);
    close(target.hp, 10000 - (100 - 50 / 1.35));
    assert.equal(target.behavior.barrier, 0);
    assert.equal(target.debuffs.some((s) => s.type === 'barrierScan'), false);
    const before = target.hp;
    f.hit(target, 100);
    close(before - target.hp, 100);
});

test('DoT no recibe bonus contra barrera y no deja escaneo tras romperla', () => {
    const f = setup('shuri');
    const target = f.spawn({ barrierRatio: 0.005 });
    target.applyStatus(scan);
    target.applyStatus({ type: 'burn', duration: 1, power: 100, damageBasis: 'flat' }, f.hero);
    target.updateDebuffs(1);
    close(target.hp, 9950);
    assert.equal(target.debuffs.some((s) => s.type === 'barrierScan'), false);
});

test('armadura y resistencia se aplican antes del bonus exclusivo de barrera', () => {
    const f = setup('shuri');
    const target = f.spawn({ barrierRatio: 1, armor: 0.5, resistances: { Tecnologico: 0.2 } });
    target.applyStatus(scan);
    f.hit(target, 100);
    close(target.behavior.barrier, 10000 - 100 * 0.5 * 0.8 * 1.35);
});

test('escaneo expira, respeta resistencia de estados y no reaparece al recargar barrera', () => {
    const f = setup('shuri');
    const target = f.spawn({ archetype: 'shield', barrierRatio: 0.005, statusResistance: 0.5 });
    target.applyStatus(scan);
    target.update(1.5);
    assert.equal(target.debuffs.length, 0);
    target.applyStatus(scan);
    f.hit(target, 100);
    target.update(5);
    assert.equal(target.behavior.barrier, 50);
    assert.equal(target.debuffs.length, 0);
});

test('jefes admiten escaneo de barrera, pero no una marca gratuita sobre vida', () => {
    const f = setup('shuri');
    const target = f.spawn({ isBoss: true, barrierRatio: 1 });
    assert.equal(target.applyStatus(scan), true);
    f.hit(target);
    close(target.behavior.barrier, 9865);
    assert.equal(target.hp, target.maxHp);
    assert.equal(target.getDamageTakenMultiplier(), 1);
});

test('barrierScan no satisface la condicion de marca de Maria Hill', async () => {
    const { getPriorityOrderDamageMultiplier } = await import('../src/systems/SupportAuraSystem.js');
    const f = setup('shuri');
    f.game.heroes.push(new Hero(heroes.maria_hill, 0, 0, f.game));
    const target = f.spawn({ barrierRatio: 1 });
    target.applyStatus(scan, f.hero);
    assert.equal(getPriorityOrderDamageMultiplier(f.hero, target), 1);
});

test('objetos y evolucion no convierten supports propios en auras ni curan', () => {
    for (const [id, itemId] of [['black_widow', 'carga_viuda'], ['shuri', 'legado_wakanda']]) {
        const f = setup(id, 50);
        const item = items[itemId];
        assert.ok(item, itemId);
        f.hero.items = [item];
        const target = f.spawn({ archetype: 'support', barrierRatio: 1 });
        for (let i = 0; i < 14; i++) {
            for (const shot of f.shoot(target)) f.hit(shot.target, shot.damage, shot);
        }
        assert.equal(f.hero.isSupportAuraOnly(), false);
        assert.equal(f.hero.combatStats.shots, 14);
        assert.equal(f.game.resourceManager.lives, 15);
        assert.equal(f.game.resourceManager.credits, 0);
    }
});

test('estados nuevos tienen indicadores compactos distintos', () => {
    const pips = buildEnemyStatusPips([{ ...scan }, { ...sabotage }]).visible;
    assert.deepEqual(new Set(pips.map((p) => p.symbol)), new Set(['B', 'X']));
});

test('un impacto que rompe barrera no deja un escaneo preparado para la proxima', () => {
    const f = setup('shuri');
    const target = f.spawn({ barrierRatio: 0.001 });
    f.hit(target, 100, { effects: [scan] });
    assert.equal(target.debuffs.length, 0);
});

test('retirar Shuri deja solo la ventana restante, sin efecto permanente', () => {
    const f = setup('shuri');
    const target = f.spawn({ barrierRatio: 1 });
    target.applyStatus(scan, f.hero);
    new TacticalActionSystem(f.game).sell(f.hero);
    f.hit(target);
    close(target.behavior.barrier, 9865);
    target.update(3);
    f.hit(target);
    close(target.behavior.barrier, 9765);
});

test('secundarios amplifican solo la barrera de cada victima escaneada', () => {
    const f = setup('shuri');
    const target = f.spawn({ barrierRatio: 1 });
    const scanned = f.spawn({ barrierRatio: 1 }, 70);
    const unscanned = f.spawn({ barrierRatio: 1 }, 75);
    scanned.applyStatus(scan);
    f.hit(target, 100, { splashRadius: 50, splashFactor: 0.5, chainCount: 0 });
    close(target.behavior.barrier, 9900);
    close(scanned.behavior.barrier, 10000 - 67.5);
    close(unscanned.behavior.barrier, 9950);
});

test('comparativa 60 s: sabotaje reduce acciones de soporte sin silenciarlo permanentemente', () => {
    function run(enabled) {
        const f = setup();
        f.hero.config.special = { ...f.hero.config.special, attackEffects: [] };
        const target = f.spawn({ archetype: 'support', hp: 1e9 });
        let heals = 0;
        const originalHeal = target.behavior.healAllies.bind(target.behavior);
        target.behavior.healAllies = () => { heals++; originalHeal(); };
        if (!enabled) target.behavior.applySabotage = () => false;
        for (let frame = 0; frame < 3600; frame++) {
            const shots = [];
            f.hero.update(1 / 60, [target], shots);
            for (const shot of shots) f.hit(target, shot.damage, shot);
            // Stationary target: isolate action timing from travel and coverage.
            target.updateDebuffs(1 / 60);
            target.behavior.update(1 / 60);
        }
        return heals;
    }
    const before = run(false);
    const after = run(true);
    assert.ok(after > 0 && after < before, `${before} -> ${after}`);
    assert.ok(after >= before * 0.5, 'inmunidad deja ventanas de accion');
});

test('comparativa escaneo vs marca anterior: gana contra escudo y pierde contra vida', () => {
    function run(shield, oldMark) {
        const f = setup('shuri');
        const target = f.spawn({ hp: 1e7, barrierRatio: shield ? 1 : 0 });
        const effect = oldMark ? { type: 'mark', duration: 2.6, power: 0.15, chance: 0.42 } : scan;
        // Fixed roll accepts the old mark: conservative comparison against full uptime.
        f.game.random.next = () => 0;
        for (let i = 0; i < 60; i++) {
            f.hit(target, 100, { effects: [effect] });
            target.updateDebuffs(1);
        }
        return f.hero.combatStats.damageDealt;
    }
    assert.ok(run(true, false) > run(true, true));
    assert.ok(run(false, false) < run(false, true));
});

test('lectura tactica distingue sabotaje, freno de corredores y escaneo de barrera', () => {
    assert.equal(heroControlsCrowd(heroes.black_widow), false);
    assert.equal(heroMatchesTacticId(heroes.black_widow, 'antiarmor'), true);
    const runner = evaluateHeroWaveFit(heroes.black_widow, { roles: ['runner'], fastest: 120 });
    assert.equal(runner.reasons.includes('frena corredores'), false);
    assert.ok(evaluateHeroWaveFit(heroes.black_widow, { roles: ['support'] }).reasons.includes('inhibe apoyos no jefes'));
    assert.ok(evaluateHeroWaveFit(heroes.shuri, { barrierCount: 1 }).reasons.includes('debilita barreras'));
    assert.equal(buildHeroCombatIdentity(heroes.shuri).find((r) => r.label === 'Rol').value, 'Barreras');
    assert.equal(buildHeroCombatIdentity(heroes.black_widow).find((r) => r.label === 'Rol').value, 'Sabotaje');
});
