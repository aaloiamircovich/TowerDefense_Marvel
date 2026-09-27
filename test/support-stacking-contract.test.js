import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero } from '../src/entities/Hero.js';
import { getEffectiveSupportAura, applySupportAurasToStats } from '../src/systems/SupportAuraSystem.js';
import { getPlacementRangeStats } from '../src/core/InputManager.js';
import { collectSupportMultipliers } from '../scripts/simulate-campaign-balance.js';
import { SUPPORT_STACKING_SCENARIOS, simulateSupportStacking } from '../scripts/compare-support-stacking.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const supportIds = Object.values(heroes).filter((h) => h.special?.supportAura?.type).map((h) => h.id);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

function setup(ids, level = 1, pattern = 'circle') {
    const game = { heroes: [], enemies: [], projectiles: [], random: { next: () => 0.99 }, resourceManager: { lives: 20 } };
    const supports = ids.map((id) => new Hero({ ...heroes[id], level }, 0, 0, game));
    const attackers = Array.from({ length: 6 - ids.length }, (_, i) => new Hero({ id: `ally_${i}`, damage: 100, fireRate: 1, range: 200, rangePattern: pattern }, 50, 0, game));
    game.heroes = [...supports, ...attackers];
    return { game, supports, attackers, ally: attackers[0] };
}

function combinations(values, count, prefix = []) {
    if (!count) return [prefix];
    return values.flatMap((value, i) => combinations(values.slice(i + 1), count - 1, [...prefix, value]));
}

for (const level of [1, 50, 100]) {
    test(`nivel ${level}: 126 equipos de cinco soportes y un atacante suman sin depender del orden`, () => {
        const teams = combinations(supportIds, 5);
        assert.equal(teams.length, 126);
        for (const ids of teams) {
            const f = setup(ids, level);
            for (const h of f.supports) h.update(6, [], []);
            const expected = { damage: 0, fireRate: 0, range: 0, outer: 0 };
            for (const h of f.supports) {
                const aura = getEffectiveSupportAura(h, { recipient: f.ally });
                if (!aura.targetCondition) expected[aura.type] += aura.power;
                if (aura.outerRangeOnly) expected.outer += aura.power;
            }
            const stats = f.ally.getEffectiveStats();
            close(stats.damage, 100 * (1 + expected.damage));
            close(stats.fireRate, 1 + expected.fireRate);
            close(stats.range, 200 * (1 + expected.range));
            close(stats.range * (stats.rangeGeometryScale || 1), 200 * (1 + expected.range - expected.outer));
            f.game.heroes.reverse();
            const reversed = f.ally.getEffectiveStats();
            for (const key of ['damage', 'fireRate', 'range']) close(reversed[key], stats[key]);
            assert.equal(f.game.heroes.length, 6);
        }
    });
}

test('cada soporte solitario conserva su potencia previa para cinco atacantes', () => {
    for (const id of supportIds) {
        const f = setup([id], 100);
        f.supports[0].update(6, [], []);
        const aura = getEffectiveSupportAura(f.supports[0], { recipient: f.ally });
        const stats = f.ally.getEffectiveStats();
        for (const [key, base] of [['damage', 100], ['fireRate', 1], ['range', 200]]) {
            close(stats[key], base * (1 + (aura.type === key && !aura.targetCondition ? aura.power : 0)));
        }
    }
});

test('objetos siguen en su capa: (1+objeto)*(1+suma de auras), sin cambiar critico', () => {
    const f = setup(['capitan_america', 'black_panther', 'nick_fury', 'wasp', 'mister_fantastic']);
    f.supports.forEach((h) => h.update(6, [], []));
    f.ally.items = [{ effects: { damagePct: 0.2, fireRatePct: 0.1, rangePct: 0.25, critChance: 5 } }];
    const stats = f.ally.getEffectiveStats();
    close(stats.damage, 100 * 1.2 * 1.3);
    close(stats.fireRate, 1.1 * 1.44);
    close(stats.range, 200 * 1.25 * 1.15);
    close(stats.range * stats.rangeGeometryScale, 250);
    close(stats.critChance, f.ally.critChance + 5);
});

for (const pattern of ['circle', 'ring', 'cross', 'x']) {
    test(`${pattern}: tres auras de alcance coinciden en colocacion, movimiento y geometria real`, () => {
        const f = setup(['invisible_woman', 'mister_fantastic', 'wong'], 1, pattern);
        const stats = f.ally.getEffectiveStats();
        close(stats.range, 255);
        close(stats.range * stats.rangeGeometryScale, 225);
        for (const moving of [null, f.ally]) {
            const near = getPlacementRangeStats(f.ally.config, f.game, moving, f.ally);
            close(near.range, stats.range);
            close(near.range * near.rangeGeometryScale, 225);
            const far = getPlacementRangeStats(f.ally.config, f.game, moving, { x: 1000, y: 0 });
            close(far.range, 200);
            close(far.rangeGeometryScale || 1, 1);
        }
        assert.equal(f.ally.x, 50);
    });
}

test('apagar o retirar una fuente conserva las otras sin restos multiplicativos', () => {
    const f = setup(['nick_fury', 'wasp', 'profesor_x']);
    const [fury, wasp, x] = f.supports;
    wasp.update(6, [], []);
    close(f.ally.getEffectiveStats().fireRate, 1 + 0.08 + 0.36 + 0.5 / 3);
    wasp.applyStun(1);
    close(f.ally.getEffectiveStats().fireRate, 1 + 0.08 + 0.5 / 3);
    f.game.heroes = f.game.heroes.filter((h) => h !== fury);
    close(f.ally.getEffectiveStats().fireRate, 1 + 0.5 / 3);
    x.x = 1000;
    close(f.ally.getEffectiveStats().fireRate, 1);
});

test('auras no aumentan el radio ni la potencia de otras auras', () => {
    const f = setup(['capitan_america', 'black_panther', 'nick_fury', 'invisible_woman', 'mister_fantastic'], 100);
    const before = f.supports.map((h) => getEffectiveSupportAura(h));
    for (let i = 0; i < 40; i++) f.game.heroes.forEach((h) => h.getEffectiveStats());
    f.supports.forEach((h, i) => {
        const aura = getEffectiveSupportAura(h);
        close(aura.range, before[i].range);
        close(aura.power, before[i].power);
    });
});

test('deteccion es union logica: quitar una fuente no anula otra ni detector propio', () => {
    const f = setup(['invisible_woman', 'maria_hill', 'wong']);
    const [sue, maria] = f.supports;
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
    sue.applyStun(10);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
    maria.applyStun(10);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    f.ally.config.canSeeStealth = true;
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
});

test('geometria previa se compone; stats parciales de preview no crean NaN', () => {
    const f = setup(['invisible_woman', 'mister_fantastic', 'wong']);
    const stats = applySupportAurasToStats({ range: 200, rangeGeometryScale: 0.5 }, f.ally);
    close(stats.range, 255);
    close(stats.range * stats.rangeGeometryScale, 112.5);
    assert.equal(Object.hasOwn(stats, 'damage'), false);
    assert.equal(Object.hasOwn(stats, 'fireRate'), false);
});

test('estimador de dano continuo coincide con la suma del motor, sin cambiar umbrales', () => {
    const f = setup(['capitan_america', 'black_panther']);
    const estimate = collectSupportMultipliers(f.game.heroes.map((h) => [h.id, h.level]));
    close(1 + estimate.damage, f.ally.getEffectiveStats().damage / 100);
});

for (const scenario of SUPPORT_STACKING_SCENARIOS) {
    test(`comparativa real 60 s: ${scenario.name}`, () => {
        const before = simulateSupportStacking(scenario.supports, { legacy: true });
        const after = simulateSupportStacking(scenario.supports);
        assert.ok(after.damage > 0 && after.damage <= before.damage + 1e-6);
        assert.ok(after.peakRange <= before.peakRange + 1e-6);
        assert.ok(after.peakCadence <= before.peakCadence + 1e-6);
        assert.equal(after.supportShots, 0);
        assert.equal(after.lives, 20);
        assert.equal(after.credits, 0);
        if (!scenario.supports.length) assert.deepEqual(after, before);
        if (scenario.name === 'Tres auras de alcance') close(after.damage, before.damage);
    });
}
