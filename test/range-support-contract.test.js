import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero, buildHeroTargetIntent } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { getEffectiveSupportAura, getSupportAuraDisplayState, SANCTUARY_PULSE } from '../src/systems/SupportAuraSystem.js';
import { getScaledSupportAura } from '../src/utils/HeroLevel.js';
import { getEvolutionForHero } from '../src/systems/EvolutionSystem.js';
import { buildSignatureAttackContext, resolveSignatureAfterAttack } from '../src/systems/ItemSignatureSystem.js';
import { TacticalActionSystem } from '../src/systems/TacticalActionSystem.js';
import { InputManager, buildHeroCoverageState, getPlacementRangeStats, measurePathCoverage } from '../src/core/InputManager.js';
import { HeroUpgradeController } from '../src/ui/HeroUpgradeController.js';
import { HeroDetailsPanel } from '../src/ui/HeroDetailsPanel.js';
import { buildHeroCombatIdentity } from '../src/ui/HeroTacticsState.js';
import { TERRAIN } from '../src/utils/TerrainRules.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

function setup(id = 'mister_fantastic', pattern = 'circle', level = 1) {
    const game = {
        heroes: [], enemies: [], projectiles: [], heroDatabase: heroes, random: { next: () => 0.99 },
        resourceManager: { lives: 15, credits: 0, addCredits(n) { this.credits += n; } },
        progression: {
            getHeroBonuses: () => null,
            getHeroEvolution: (id) => {
                const h = game.heroes.find((entry) => entry.id === id);
                return h ? getEvolutionForHero(h.config, {}, { level: h.level, equippedItemIds: h.items.map((item) => item.id) }) : null;
            }
        }
    };
    const support = new Hero({ ...heroes[id], level }, 0, 0, game);
    const ally = new Hero({ id: 'ally', damage: 100, fireRate: 1, range: 200, rangePattern: pattern, critChance: 0.01 }, 0, 0, game);
    game.heroes = [support, ally];
    const spawn = (x, y = 0, extra = {}) => {
        const enemy = new Enemy({ id: 'target', hp: 1e9, speed: 1, reward: 100, category: 'Urbano', ...extra }, [{ x, y }, { x: 3000, y }], game);
        game.enemies.push(enemy);
        return enemy;
    };
    const tick = (dt) => support.update(dt, game.enemies, game.projectiles);
    const targets = () => ally.abilitySystem.getTargetsInRange(game.enemies, ally.getEffectiveStats().range);
    return { game, support, ally, tick, spawn, targets };
}

test('Sue: alcance amplio y deteccion continuos, locales y sin bonus ofensivos', () => {
    const f = setup('invisible_woman');
    f.ally.x = 245;
    const target = f.spawn(400, 0, { stealth: true });
    for (const dt of [0, 4, 4, 12]) {
        f.tick(dt);
        const stats = f.ally.getEffectiveStats();
        close(stats.range, 216);
        close(stats.damage, 100);
        close(stats.fireRate, 1);
        assert.equal(f.ally.getBestTarget([target], stats), target);
        assert.equal(target.stealth, true);
    }
    f.ally.x = 245.01;
    close(f.ally.getEffectiveStats().range, 200);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    f.ally.x = 0;
    f.support.applyStun(1);
    close(f.ally.getEffectiveStats().range, 200);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    f.tick(1);
    close(f.ally.getEffectiveStats().range, 216);
});

for (const pattern of ['circle', 'ring', 'cross', 'x']) {
    test(`Reed ${pattern}: extiende borde exterior sin deteccion, dano o cadencia`, () => {
        const f = setup('mister_fantastic', pattern);
        const stats = f.ally.getEffectiveStats();
        close(stats.range, 230);
        close(stats.rangeGeometryScale, 1 / 1.15);
        const coordinate = pattern === 'x' ? stats.range / Math.SQRT2 * 0.99 : stats.range * 0.99;
        const target = f.spawn(coordinate, pattern === 'x' ? coordinate : 0);
        assert.equal(f.ally.getBestTarget([target], stats), target);
        assert.equal(buildHeroTargetIntent(f.ally, [target]).inRange, true);
        close(stats.damage, 100);
        close(stats.fireRate, 1);
        target.stealth = true;
        assert.equal(f.ally.getBestTarget([target], stats), null);
        target.stealth = false;
        target.x = stats.range + 0.01;
        assert.equal(f.ally.getBestTarget([target], stats), null);
    });
}

test('Reed conserva hueco del anillo: ataque, habilidad y cobertura usan la misma frontera', () => {
    const f = setup('mister_fantastic', 'ring');
    const blocked = f.spawn(75.99);
    const valid = f.spawn(76.01);
    const stats = f.ally.getEffectiveStats();
    assert.equal(f.ally.getBestTarget([blocked], stats), null);
    assert.equal(f.ally.getBestTarget([valid], stats), valid);
    assert.deepEqual(f.targets(), [valid]);
    const path = [{ x: 78, y: 0 }, { x: 86, y: 0 }];
    assert.equal(measurePathCoverage(f.ally, stats.range, path, 'ring').coveredLength, 0);
    const state = buildHeroCoverageState(f.ally, path);
    close(state.coveredLength, 8);
    close(state.geometryScale, stats.rangeGeometryScale);
});

for (const pattern of ['cross', 'x']) {
    test(`Reed no ensancha carriles ${pattern}, incluso con el minimo de 18 px`, () => {
        const f = setup('mister_fantastic', pattern);
        for (const range of [100, 200]) {
            f.ally.range = range;
            const width = Math.max(18, range * 0.16);
            const valid = f.spawn(60, pattern === 'x' ? 60 - width + 0.01 : width - 0.01);
            const blocked = f.spawn(60, pattern === 'x' ? 60 - width - 0.01 : width + 0.01);
            const stats = f.ally.getEffectiveStats();
            assert.equal(f.ally.getBestTarget([valid], stats), valid);
            assert.equal(f.ally.getBestTarget([blocked], stats), null);
            assert.ok(f.targets().includes(valid));
            assert.ok(!f.targets().includes(blocked));
        }
    });
}

test('Reed con Sue y objeto: solo excluye su propio multiplicador de la geometria interna', () => {
    const f = setup('mister_fantastic', 'ring');
    f.ally.items = [{ id: 'range-test', effects: { rangePct: 0.2 } }];
    const sue = new Hero(heroes.invisible_woman, 0, 0, f.game);
    f.game.heroes.push(sue);
    const stats = f.ally.getEffectiveStats();
    close(stats.range, 200 * 1.2 * 1.08 * 1.15);
    close(stats.range * stats.rangeGeometryScale, 200 * 1.2 * 1.08);
    f.game.heroes.reverse();
    close(f.ally.getEffectiveStats().range, stats.range);
    close(f.ally.getEffectiveStats().rangeGeometryScale, stats.rangeGeometryScale);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
});

test('salva signature de Punisher respeta el ancho del carril al recibir el aura de Reed', () => {
    const f = setup();
    const hero = new Hero({ ...heroes.punisher, level: 50 }, 0, 0, f.game);
    hero.items = [items.armadura_war_machine];
    f.game.heroes = [f.support, hero];
    const stats = hero.getEffectiveStats();
    const lane = Math.max(18, stats.range * stats.rangeGeometryScale * 0.16);
    const blocked = f.spawn(80, lane + 0.1);
    const valid = f.spawn(stats.range * 0.98, 0);
    const shots = [];
    for (let i = 0; i < 10; i++) {
        const context = buildSignatureAttackContext(hero, valid, hero.getEffectiveStats());
        resolveSignatureAfterAttack(hero, valid, context.stats, {}, shots, context);
    }
    assert.ok(shots.length > 0);
    assert.ok(shots.every((shot) => shot.target === valid));
    assert.ok(!shots.some((shot) => shot.target === blocked));
});

test('Wong alterna 4 s sin deteccion y 4 s con deteccion sin apagar el alcance', () => {
    const f = setup('wong');
    const target = f.spawn(100, 0, { stealth: true });
    for (const [dt, detection] of [[0, false], [3.5, false], [0.5, true], [3.5, true], [0.5, false], [4, true]]) {
        f.tick(dt);
        const stats = f.ally.getEffectiveStats();
        close(stats.range, 209);
        assert.equal(stats.canSeeStealth, detection);
        assert.equal(f.ally.getBestTarget([target], stats), detection ? target : null);
        assert.equal(target.stealth, true);
    }
    assert.equal(f.support.combatStats.abilityActivations, 2);
    assert.equal(SANCTUARY_PULSE.rest + SANCTUARY_PULSE.duration, 8);
});

test('Wong: radio inclusivo, salir pierde deteccion; detector propio no depende del pulso', () => {
    const f = setup('wong');
    f.tick(4);
    f.ally.x = 205;
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
    f.ally.x = 205.01;
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    close(f.ally.getEffectiveStats().range, 200);
    f.ally.config.canSeeStealth = true;
    f.tick(4);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
});

test('Wong: stun no congela ventana, mover/recolocar rearma sin perder nivel', () => {
    const f = setup('wong', 'circle', 50);
    f.tick(4);
    f.support.applyStun(2);
    close(f.ally.getEffectiveStats().range, 200);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    f.tick(2);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
    f.tick(2);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    f.tick(4);
    f.support.x = 1;
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    f.tick(4);
    new TacticalActionSystem(f.game).sell(f.support);
    close(f.ally.getEffectiveStats().range, 200);
    f.game.heroes.push(f.support);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    assert.equal(f.support.level, 50);
});

test('Wong: lecturas no avanzan reloj y particionar tiempo conserva fase', () => {
    const a = setup('wong');
    const b = setup('wong');
    a.tick(20);
    for (let n = 0; n < 80; n++) b.tick(0.25);
    assert.deepEqual(a.support.supportPulseState, b.support.supportPulseState);
    const before = { ...a.support.supportPulseState };
    for (let n = 0; n < 20; n++) {
        getEffectiveSupportAura(a.support);
        getSupportAuraDisplayState(a.support);
        a.ally.getEffectiveStats();
        a.tick(0);
    }
    assert.deepEqual(a.support.supportPulseState, before);
});

for (const id of ['invisible_woman', 'mister_fantastic', 'wong']) {
    for (const level of [1, 49, 50, 100]) {
        test(`${id} nivel ${level}: potencia y radio escalan sin extender auras vecinas`, () => {
            const f = setup(id, 'ring', level);
            const expected = getScaledSupportAura(heroes[id].special.supportAura, level, heroes[id].rarity);
            const stats = f.ally.getEffectiveStats();
            close(stats.range, 200 * (1 + expected.power));
            close(getEffectiveSupportAura(f.support).range, expected.range);
            close(stats.range * (stats.rangeGeometryScale || 1), id === 'mister_fantastic' ? 200 : stats.range);
            const other = new Hero(heroes.mister_fantastic, 0, 0, f.game);
            f.game.heroes.push(other);
            close(getEffectiveSupportAura(f.support).range, expected.range);
        });
    }
}

test('los tres siguen sin atacar, curar ni generar dinero con evolucion y objeto ofensivo', () => {
    for (const id of ['invisible_woman', 'mister_fantastic', 'wong']) {
        const f = setup(id, 'circle', 100);
        f.support.items = [items.mjolnir];
        const target = f.spawn(100);
        for (let i = 0; i < 30; i++) {
            f.tick(1);
            f.support.shoot(target, f.support.getEffectiveStats(), f.game.projectiles);
        }
        assert.equal(f.game.projectiles.length, 0);
        assert.equal(f.support.combatStats.damageDealt, 0);
        assert.equal(f.support.combatStats.shots, 0);
        assert.equal(target.hp, target.maxHp);
        assert.equal(f.game.resourceManager.lives, 15);
        assert.equal(f.game.resourceManager.credits, 0);
    }
});

test('Sue mantiene deteccion durante descanso de Wong, sin convertirla en revelado global', () => {
    const f = setup('wong');
    const sue = new Hero(heroes.invisible_woman, 0, 0, f.game);
    f.game.heroes.push(sue);
    const hidden = f.spawn(100, 0, { stealth: true });
    close(f.ally.getEffectiveStats().range, 200 * 1.045 * 1.08);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
    sue.applyStun(20);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    f.tick(4);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
    assert.equal(hidden.stealth, true);
});

test('previsualizacion de colocacion calcula las auras en destino y no mueve la instancia', () => {
    const f = setup('mister_fantastic', 'ring');
    for (const moving of [null, f.ally]) {
        const near = getPlacementRangeStats(f.ally.config, f.game, moving, { x: 100, y: 0 });
        const far = getPlacementRangeStats(f.ally.config, f.game, moving, { x: 400, y: 0 });
        close(near.range, 230);
        close(near.range * near.rangeGeometryScale, 200);
        close(far.range, 200);
        assert.equal(f.ally.x, 0);
        assert.equal(f.ally.y, 0);
    }
});

test('dibujo usa el hueco y ancho reales; cruces se recortan al radio maximo', () => {
    for (const pattern of ['ring', 'cross', 'x']) {
        const f = setup('mister_fantastic', pattern);
        const calls = [];
        const ctx = Object.fromEntries(['save', 'restore', 'beginPath', 'arc', 'moveTo', 'fill', 'stroke', 'strokeRect', 'fillRect', 'setLineDash', 'translate', 'rotate', 'clip'].map((name) => [name, (...args) => calls.push([name, ...args])]));
        const stats = f.ally.getEffectiveStats();
        InputManager.prototype.drawRangePattern.call({}, ctx, 0, 0, stats.range, pattern, '#fff', true, stats.rangeGeometryScale);
        if (pattern === 'ring') close(calls.filter(([name]) => name === 'arc')[1][3], 76);
        else {
            assert.equal(calls.filter(([name]) => name === 'clip').length, 1);
            close(calls.find(([name]) => name === 'strokeRect')[3], pattern === 'x' ? 64 / Math.SQRT2 : 64);
        }
    }
});

test('subida de nivel muestra bonus de alcance y radio; no cambia el periodo de Wong', () => {
    for (const id of ['invisible_woman', 'mister_fantastic', 'wong']) {
        const f = setup(id);
        f.tick(4);
        const before = f.support.supportPulseState && { ...f.support.supportPulseState };
        const rows = new HeroUpgradeController({ game: f.game }).getHeroLevelPreviewRows(f.support);
        assert.ok(rows.some((row) => row.label === 'Aura' && row.value > 0));
        assert.ok(rows.some((row) => row.label === 'Radio' && row.value > 0));
        assert.deepEqual(f.support.supportPulseState, before);
    }
});

test('ficha de Wong distingue espera y deteccion sin ocultar su bonus constante', () => {
    const f = setup('wong');
    const oldDocument = globalThis.document;
    globalThis.document = { getElementById: () => null };
    try {
        const ui = {
            game: f.game, panelContent: { innerHTML: '', querySelectorAll: () => [], querySelector: () => null },
            inventoryPanel: {}, getHeroLevel: () => 1, getHeroUpgradeCost: () => 180,
            getHeroLevelPreviewLabel: () => '', getHeroLevelPreviewRows: () => [],
            getTerrainText: () => 'Pasto', getMissionCredits: () => 0,
            getHeroDisplaySprite: () => null, renderSprite: () => '', bindHeroDetailTabs() {}, renderPanel() {}
        };
        const panel = new HeroDetailsPanel(ui);
        panel.render(f.support);
        assert.match(ui.panelContent.innerHTML, /Sello: 4.0 s/);
        f.tick(4);
        panel.render(f.support);
        assert.match(ui.panelContent.innerHTML, /Deteccion: 4.0 s/);
        assert.match(ui.panelContent.innerHTML, /Rango \+5%/);
    } finally { globalThis.document = oldDocument; }
});

test('etiquetas de soporte describen efectos reales, no negaciones ni stun recibido', () => {
    const responses = (h) => buildHeroCombatIdentity(h).find((entry) => entry.label === 'Respuestas').value;
    assert.equal(responses(setup('mister_fantastic').support), 'Alcance \u00b7 Apoyo');
    const f = setup('wong');
    assert.doesNotMatch(responses(f.support), /Detecci\u00f3n|Control/);
    f.tick(4);
    assert.match(responses(f.support), /Detecci\u00f3n/);
    f.support.applyStun(1);
    assert.equal(responses(f.support), 'Apoyo');
});

test('mas alcance no habilita colocar sobre calle, flores u otras celdas bloqueadas', () => {
    const f = setup();
    f.game.gridSize = 32;
    f.game.terrainMap = [[TERRAIN.path, TERRAIN.blocked]];
    const input = Object.create(InputManager.prototype);
    input.game = f.game;
    input.placingHero = { ...f.ally.config, allowedTerrains: [TERRAIN.grass] };
    for (const x of [0, 1]) assert.equal(input.getPlacementValidation({ x, y: 0 }).valid, false);
});

test('comparativa 32 s: Sue detecta siempre, Wong por ventanas y Reed no detecta', () => {
    const run = (id, stealth, x) => {
        const f = setup(id);
        f.ally.x = x;
        f.spawn(x + 150, 0, { stealth });
        for (let i = 0; i < 320; i++) {
            f.tick(0.1);
            f.ally.update(0.1, f.game.enemies, f.game.projectiles);
            for (const shot of f.game.projectiles) {
                shot.x = shot.target.x;
                shot.y = shot.target.y;
                shot.update(0);
            }
            f.game.projectiles = [];
        }
        return f.ally.combatStats.shots;
    };
    const sue = run('invisible_woman', true, 0);
    const wong = run('wong', true, 0);
    assert.ok(sue > wong && wong > 0);
    assert.equal(run('mister_fantastic', true, 0), 0);
    assert.equal(run('invisible_woman', true, 220), sue);
    assert.equal(run('wong', true, 220), 0);
    assert.ok(run('mister_fantastic', false, 0) > 0);
});
