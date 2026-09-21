import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { TacticalActionSystem } from '../src/systems/TacticalActionSystem.js';
import { getEffectiveSupportAura, getMentalLinks, getSupportAuraDisplayState, PYM_LINK, MENTAL_LINK } from '../src/systems/SupportAuraSystem.js';
import { getScaledSupportAura } from '../src/utils/HeroLevel.js';
import { HeroUpgradeController } from '../src/ui/HeroUpgradeController.js';
import { HeroDetailsPanel } from '../src/ui/HeroDetailsPanel.js';
import { buildHeroCombatIdentity } from '../src/ui/HeroTacticsState.js';
import { getEvolutionForHero } from '../src/systems/EvolutionSystem.js';
import { collectSupportMultipliers } from '../scripts/simulate-campaign-balance.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

function setup(id = 'wasp', level = 1) {
    const game = {
        heroes: [], enemies: [], projectiles: [], heroDatabase: heroes, random: { next: () => 0.99 },
        resourceManager: { lives: 15, credits: 0, addCredits(n) { this.credits += n; } },
        progression: {
            getHeroBonuses: () => null,
            getHeroEvolution: (heroId) => {
                const hero = game.heroes.find((entry) => entry.id === heroId);
                return hero ? getEvolutionForHero(hero.config, {}, { level: hero.level, equippedItemIds: hero.items.map((item) => item.id) }) : null;
            }
        }
    };
    const support = new Hero({ ...heroes[id], level }, 0, 0, game);
    game.heroes.push(support);
    const addAlly = (x = 50, config = {}) => {
        const ally = new Hero({ id: `ally-${game.heroes.length}`, damage: 100, fireRate: 1, range: 120, critChance: 0.01, ...config }, x, 0, game);
        game.heroes.push(ally);
        return ally;
    };
    const ally = addAlly();
    const target = new Enemy({ id: 'target', hp: 1e9, speed: 1, reward: 100, category: 'Urbano' }, [{ x: 80, y: 0 }, { x: 3000, y: 0 }], game);
    game.enemies = [target];
    const tick = (dt) => support.update(dt, game.enemies, game.projectiles);
    return { game, support, ally, target, addAlly, tick };
}

test('Fury: aura constante, radio inclusivo, sin deteccion ni bonus de dano/alcance', () => {
    const f = setup('nick_fury');
    f.ally.x = 265;
    for (const dt of [0, 6, 3, 9, 30]) {
        f.tick(dt);
        const stats = f.ally.getEffectiveStats();
        close(stats.fireRate, 1.08);
        close(stats.damage, 100);
        close(stats.range, 120);
        assert.equal(Boolean(stats.canSeeStealth), false);
    }
    f.ally.x = 265.01;
    close(f.ally.getEffectiveStats().fireRate, 1);
    f.ally.x = 50;
    f.support.applyStun(1);
    close(f.ally.getEffectiveStats().fireRate, 1);
    assert.match(getSupportAuraDisplayState(f.support).label, /suspendida/);
    f.tick(1);
    close(f.ally.getEffectiveStats().fireRate, 1.08);
});

test('Wasp: 6 s de espera, 3 s al doble de potencia y 6 s sin aura entre pulsos', () => {
    const f = setup();
    close(f.ally.getEffectiveStats().fireRate, 1);
    f.tick(5.5);
    close(f.ally.getEffectiveStats().fireRate, 1);
    f.tick(0.5);
    close(f.ally.getEffectiveStats().fireRate, 1.36);
    assert.match(getSupportAuraDisplayState(f.support).label, /Pym \+36%/);
    f.tick(2.5);
    close(f.ally.getEffectiveStats().fireRate, 1.36);
    f.tick(0.5);
    close(f.ally.getEffectiveStats().fireRate, 1);
    f.tick(6);
    close(f.ally.getEffectiveStats().fireRate, 1.36);
    assert.equal(f.support.combatStats.abilityActivations, 2);
});

test('Wasp: bonus solo dentro de 125 px, sin dano, alcance ni deteccion aliada', () => {
    const f = setup();
    f.tick(6);
    f.ally.x = 125;
    const stats = f.ally.getEffectiveStats();
    close(stats.fireRate, 1.36);
    close(stats.damage, 100);
    close(stats.range, 120);
    assert.equal(Boolean(stats.canSeeStealth), false);
    f.ally.x = 125.01;
    close(f.ally.getEffectiveStats().fireRate, 1);
});

test('Wasp: stun suspende el pulso pero su reloj avanza y no se acumulan ventanas', () => {
    const f = setup();
    f.tick(6);
    f.support.applyStun(2);
    close(f.ally.getEffectiveStats().fireRate, 1);
    assert.match(getSupportAuraDisplayState(f.support).label, /suspendido/);
    f.tick(2);
    close(f.ally.getEffectiveStats().fireRate, 1.36);
    f.tick(1);
    close(f.ally.getEffectiveStats().fireRate, 1);
    f.support.applyStun(10);
    f.tick(10);
    close(f.ally.getEffectiveStats().fireRate, 1);
});

test('Wasp: mover o retirar no permite repetir pulsos; conserva nivel al retirar', () => {
    const f = setup('wasp', 50);
    f.tick(6);
    f.support.x = 1;
    close(f.ally.getEffectiveStats().fireRate, 1);
    f.tick(6);
    assert.ok(f.ally.getEffectiveStats().fireRate > 1.36);
    assert.equal(new TacticalActionSystem(f.game).sell(f.support).ok, true);
    close(f.ally.getEffectiveStats().fireRate, 1);
    f.game.heroes.push(f.support);
    close(f.ally.getEffectiveStats().fireRate, 1);
    assert.equal(f.support.level, 50);
    f.tick(6);
    assert.ok(f.ally.getEffectiveStats().fireRate > 1.36);
});

test('Wasp: particionar el tiempo o atravesar varios ciclos conserva fase y cuenta', () => {
    const a = setup();
    const b = setup();
    a.tick(24);
    for (let i = 0; i < 96; i++) b.tick(0.25);
    assert.deepEqual(a.support.supportPulseState, b.support.supportPulseState);
    assert.equal(a.support.combatStats.abilityActivations, 3);
    assert.equal(b.support.combatStats.abilityActivations, 3);
    close(a.ally.getEffectiveStats().fireRate, 1.36);
});

test('Profesor X: presupuesto repartido, tope individual y maximo de cinco atacantes', () => {
    const f = setup('profesor_x');
    for (let count = 1; count <= 5; count++) {
        if (count > 1) f.addAlly();
        const power = Math.min(0.30, 0.50 / count);
        const links = getMentalLinks(f.support);
        assert.equal(links.length, count);
        for (const ally of links) close(ally.getEffectiveStats().fireRate, 1 + power);
        assert.ok(links.length * getEffectiveSupportAura(f.support).power <= 0.50 + 1e-8);
    }
    assert.equal(f.game.heroes.length, 6);
});

test('Profesor X: soportes, banco, fuera del radio y aturdidos no consumen enlaces', () => {
    const f = setup('profesor_x');
    const far = f.addAlly(245.01);
    const stunned = f.addAlly();
    stunned.applyStun(3);
    const otherSupport = f.addAlly(50, heroes.wasp);
    const bank = new Hero({ id: 'bank', damage: 100, fireRate: 1 }, 50, 0, f.game);
    close(f.ally.getEffectiveStats().fireRate, 1.30);
    for (const ally of [far, stunned, otherSupport, bank]) {
        assert.equal(getEffectiveSupportAura(f.support, { recipient: ally }), null);
        if (ally !== otherSupport) assert.equal(Boolean(ally.getEffectiveStats().canSeeStealth), false);
    }
    far.x = 245;
    close(f.ally.getEffectiveStats().fireRate, 1.25);
    far.x = 246;
    stunned.stunTimer = 0;
    close(f.ally.getEffectiveStats().fireRate, 1.25);
});

test('Profesor X: la deteccion pertenece al aliado enlazado, no revela globalmente', () => {
    const f = setup('profesor_x');
    f.target.stealth = true;
    assert.equal(f.ally.getBestTarget(f.game.enemies, f.ally.getEffectiveStats()), f.target);
    assert.equal(f.target.stealth, true);
    f.support.applyStun(1);
    close(f.ally.getEffectiveStats().fireRate, 1);
    assert.equal(f.ally.getBestTarget(f.game.enemies, f.ally.getEffectiveStats()), null);
    f.tick(1);
    close(f.ally.getEffectiveStats().fireRate, 1.3);
    f.support.x = 1000;
    assert.equal(f.ally.getBestTarget(f.game.enemies, f.ally.getEffectiveStats()), null);
    assert.equal(f.target.stealth, true);
});

test('Profesor X: cero atacantes da cero bonus; retirar o mover actualiza enlaces', () => {
    const f = setup('profesor_x');
    f.ally.x = 1000;
    close(getEffectiveSupportAura(f.support).power, 0);
    assert.equal(getSupportAuraDisplayState(f.support).ready, false);
    f.ally.x = 50;
    close(getEffectiveSupportAura(f.support).power, 0.3);
    new TacticalActionSystem(f.game).sell(f.support);
    close(f.ally.getEffectiveStats().fireRate, 1);
    f.game.heroes.push(f.support);
    close(f.ally.getEffectiveStats().fireRate, 1.3);
});

for (const id of ['nick_fury', 'wasp', 'profesor_x']) {
    for (const level of [1, 49, 50, 100]) {
        test(`${id} nivel ${level}: escala el buff sin acelerar el ciclo ni agrandar radio por otras auras`, () => {
            const f = setup(id, level);
            const base = getScaledSupportAura(heroes[id].special.supportAura, level, heroes[id].rarity);
            f.tick(6);
            const multiplier = id === 'nick_fury' ? 1 : 2;
            close(getEffectiveSupportAura(f.support).power, base.power * multiplier);
            close(getEffectiveSupportAura(f.support).range, base.range);
            f.addAlly(0, heroes.invisible_woman);
            close(getEffectiveSupportAura(f.support).range, base.range);
            close(getEffectiveSupportAura(f.support).power, base.power * multiplier);
            f.ally.x = base.range + 0.01;
            close(f.ally.getEffectiveStats().fireRate, 1);
        });
    }
}

test('soportes de cadencia: evolucion y objetos ofensivos no reactivan ataques, curacion o dinero', () => {
    for (const id of ['nick_fury', 'wasp', 'profesor_x']) {
        const f = setup(id, 100);
        f.support.items = [items.mjolnir];
        for (let i = 0; i < 60; i++) {
            f.tick(1);
            f.support.shoot(f.target, f.support.getEffectiveStats(), f.game.projectiles);
        }
        assert.equal(f.game.projectiles.length, 0);
        assert.equal(f.target.hp, f.target.maxHp);
        assert.equal(f.support.combatStats.shots, 0);
        assert.equal(f.support.combatStats.damageDealt, 0);
        assert.equal(f.game.resourceManager.lives, 15);
        assert.equal(f.game.resourceManager.credits, 0);
    }
});

test('combinar los tres no produce recursiones ni bucles de aumento: producto acotado al estado', () => {
    const f = setup('profesor_x', 100);
    const fury = f.addAlly(0, { ...heroes.nick_fury, level: 100 });
    const wasp = f.addAlly(0, { ...heroes.wasp, level: 100 });
    wasp.update(6, f.game.enemies, f.game.projectiles);
    const expected = 1.555 * 1.124 * 1.522;
    for (let i = 0; i < 50; i++) close(f.ally.getEffectiveStats().fireRate, expected);
    assert.equal(getMentalLinks(f.support).length, 1);
    wasp.update(3, f.game.enemies, f.game.projectiles);
    close(f.ally.getEffectiveStats().fireRate, 1.555 * 1.124);
    assert.equal(fury.combatStats.shots, 0);
});

test('consultar stats, indicadores y dt cero no adelanta ni reinicia el pulso', () => {
    const f = setup();
    f.tick(6);
    const before = { ...f.support.supportPulseState };
    for (let i = 0; i < 20; i++) {
        f.ally.getEffectiveStats();
        f.support.abilitySystem.getDisplayState();
        f.tick(0);
    }
    assert.deepEqual(f.support.supportPulseState, before);
    assert.equal(f.support.combatStats.abilityActivations, 1);
});

test('preview: Wasp muestra mejora del pulso incluso en descanso; X anticipa dilucion por radio nuevo', () => {
    const f = setup();
    const ui = new HeroUpgradeController({ game: f.game });
    const resting = ui.getHeroLevelPreviewRows(f.support).find((row) => row.label === 'Pulso');
    assert.ok(resting.value > 0);
    f.tick(6);
    close(ui.getHeroLevelPreviewRows(f.support).find((row) => row.label === 'Pulso').value, resting.value);
    const x = setup('profesor_x');
    x.addAlly(245.1);
    const preview = new HeroUpgradeController({ game: x.game });
    const before = getEffectiveSupportAura(x.support).power;
    const delta = preview.getHeroLevelPreviewRows(x.support).find((row) => row.label === 'Aura').value;
    assert.ok(delta < 0, 'el nuevo radio admite otro aliado y debe mostrar una resta');
    x.support.level++;
    close(delta, (getEffectiveSupportAura(x.support).power - before) * 100);
});

test('inventario y preview muestran el pico posible sin consumir reloj ni enlaces', () => {
    for (const id of ['wasp', 'profesor_x']) {
        const f = setup(id);
        const config = heroes[id];
        const before = f.support.supportPulseState;
        close(getEffectiveSupportAura(config).power, id === 'wasp' ? 0.36 : 0.3);
        const rows = new HeroUpgradeController({ game: f.game }).getHeroLevelPreviewRows(config);
        assert.ok(rows.some((row) => ['Aura', 'Pulso'].includes(row.label) && row.value > 0));
        assert.equal(f.support.supportPulseState, before);
    }
});

test('ficha desplegada: muestra descanso/pulso y reparto real sin crear tarjetas extra', () => {
    const oldDocument = globalThis.document;
    globalThis.document = { getElementById: () => null };
    try {
        for (const id of ['wasp', 'profesor_x']) {
            const f = setup(id);
            const ui = {
                game: f.game, panelContent: { innerHTML: '', querySelectorAll: () => [], querySelector: () => null },
                inventoryPanel: {}, getHeroLevel: () => 1, getHeroUpgradeCost: () => 180,
                getHeroLevelPreviewLabel: () => '', getHeroLevelPreviewRows: () => [],
                getTerrainText: () => 'Pasto', getMissionCredits: () => 0,
                getHeroDisplaySprite: () => null, renderSprite: () => '', bindHeroDetailTabs() {}, renderPanel() {}
            };
            const panel = new HeroDetailsPanel(ui);
            panel.render(f.support);
            assert.match(ui.panelContent.innerHTML, id === 'wasp' ? /Cad\. \+0%/ : /Enlaces 1: \+30% c\/u/);
            if (id === 'wasp') f.tick(6); else f.addAlly();
            panel.render(f.support);
            assert.match(ui.panelContent.innerHTML, id === 'wasp' ? /Pym \+36%/ : /Enlaces 2: \+25% c\/u/);
        }
    } finally {
        globalThis.document = oldDocument;
    }
});

test('estimador de campana contempla descanso de Wasp y division de Profesor X', () => {
    close(collectSupportMultipliers([['wasp', 1], ['hawkeye', 1]]).fireRate, 0.12);
    close(collectSupportMultipliers([['profesor_x', 1], ['hawkeye', 1]]).fireRate, 0.30);
    close(collectSupportMultipliers([['profesor_x', 1], ['wasp', 1]]).fireRate, 0.12);
    assert.equal(PYM_LINK.rest + PYM_LINK.duration, 9);
    close(heroes.profesor_x.special.supportAura.power * MENTAL_LINK.budgetMultiplier, 0.5);
});

test('la etiqueta de rol usa la misma potencia efectiva que la ficha, no la nominal del catalogo', () => {
    const f = setup();
    const role = (hero) => buildHeroCombatIdentity(hero).find((entry) => entry.label === 'Rol').value;
    assert.match(role(f.support), /\+0%/);
    f.tick(6);
    assert.match(role(f.support), /\+36%/);
    const x = setup('profesor_x');
    assert.match(role(x.support), /\+30%/);
    x.addAlly();
    assert.match(role(x.support), /\+25%/);
    assert.match(role(heroes.wasp), /\+36%/);
});

test('comparativa de 90 s: Wasp gana cerca, Fury lejos; mas enlaces diluyen el beneficio individual', () => {
    const run = (id, x, count = 1) => {
        const f = setup(id);
        f.ally.x = x;
        f.target.x = x + 30;
        while (f.game.heroes.length < count + 1) f.addAlly(x);
        for (let n = 0; n < 4500; n++) {
            f.tick(0.02);
            f.ally.update(0.02, f.game.enemies, f.game.projectiles);
            for (const shot of f.game.projectiles) {
                shot.x = shot.target.x;
                shot.y = shot.target.y;
                shot.update(0);
            }
            f.game.projectiles = [];
        }
        return f.ally.combatStats.shots;
    };
    const fury = run('nick_fury', 50);
    const wasp = run('wasp', 50);
    assert.ok(wasp > fury);
    assert.equal(run('nick_fury', 200), fury);
    assert.ok(run('wasp', 200) < fury);
    assert.ok(wasp < 110, 'el pulso no equivale a +36% permanente');
    assert.ok(run('profesor_x', 50, 1) > run('profesor_x', 50, 5));
});

test('Domino conserva exactamente 15% por ataque bajo los tres apoyos de cadencia', () => {
    for (const id of ['nick_fury', 'wasp', 'profesor_x']) {
        const f = setup(id);
        f.game.heroes.splice(1);
        const domino = f.addAlly(50, heroes.domino);
        for (let n = 0; n < 1500; n++) {
            f.tick(0.02);
            domino.update(0.02, f.game.enemies, f.game.projectiles);
            f.game.projectiles = [];
        }
        assert.ok(domino.combatStats.shots > 0);
        assert.equal(f.game.resourceManager.credits, domino.combatStats.shots * 15);
        assert.equal(f.support.combatStats.goldGenerated, 0);
    }
});
