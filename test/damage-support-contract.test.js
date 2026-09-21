import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { TacticalActionSystem } from '../src/systems/TacticalActionSystem.js';
import { getEffectiveSupportAura, getSupportAuraDisplayState, VIBRANIUM_NETWORK } from '../src/systems/SupportAuraSystem.js';
import { getScaledSupportAura } from '../src/utils/HeroLevel.js';
import { getEvolutionForHero } from '../src/systems/EvolutionSystem.js';
import { HeroUpgradeController } from '../src/ui/HeroUpgradeController.js';
import { HeroDetailsPanel } from '../src/ui/HeroDetailsPanel.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

function setup(id = 'black_panther', level = 1) {
    const game = {
        heroes: [], enemies: [], projectiles: [], random: { next: () => 0.99 },
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
    const ally = new Hero({ id: 'ally', damage: 100, fireRate: 1, range: 120, critChance: 0.01 }, 50, 0, game);
    game.heroes = [support, ally];
    const target = new Enemy({ id: 'target', hp: 1e9, speed: 1, category: 'Urbano', reward: 100 }, [{ x: 80, y: 0 }, { x: 3000, y: 0 }], game);
    game.enemies = [target];
    const attack = (count = 1, source = ally) => {
        const shots = [];
        for (let i = 0; i < count; i++) source.shoot(target, source.getEffectiveStats(), shots);
        return shots;
    };
    const tick = (dt) => support.update(dt, game.enemies, game.projectiles);
    return { game, support, ally, target, attack, tick };
}

test('Captain America conserva dano constante y cobertura mayor, sin cargar una red', () => {
    const f = setup('capitan_america');
    f.ally.x = 200;
    close(f.ally.getEffectiveStats().damage, 110);
    f.attack(30);
    f.tick(20);
    close(f.ally.getEffectiveStats().damage, 110);
    assert.equal(getSupportAuraDisplayState(f.support), null);
    assert.equal(f.support.combatStats.shots, 0);
    assert.equal(f.support.combatStats.abilityActivations, 0);
    f.ally.x = 256;
    close(f.ally.getEffectiveStats().damage, 100);
});

test('Panther prepara 9 s y seis ataques; el sexto aun usa aura base', () => {
    const f = setup();
    close(f.ally.getEffectiveStats().damage, 120);
    f.attack(20);
    assert.equal(f.support.supportNetworkState.charge, 0);
    f.tick(9);
    f.attack(5);
    assert.equal(f.support.supportNetworkState.charge, 5);
    close(f.ally.getEffectiveStats().damage, 120);
    close(f.attack()[0].damage, 120);
    close(f.attack()[0].damage, 130);
    assert.equal(f.support.combatStats.abilityActivations, 1);
    assert.equal(f.support.combatStats.shots, 0);
});

test('sobrecarga no refresca por spam, dura 3 s y bloquea carga hasta 9 s', () => {
    const f = setup();
    f.tick(9);
    f.attack(6);
    f.attack(100);
    assert.equal(f.support.supportNetworkState.remaining, 3);
    assert.equal(f.support.supportNetworkState.charge, 0);
    f.tick(3);
    close(f.ally.getEffectiveStats().damage, 120);
    f.attack(6);
    assert.equal(f.support.supportNetworkState.charge, 0);
    f.tick(6);
    f.attack(6);
    close(f.ally.getEffectiveStats().damage, 130);
    assert.equal(f.support.combatStats.abilityActivations, 2);
});

test('solo ataques de aliados desplegados dentro del radio circular generan cargas', () => {
    const f = setup();
    f.tick(9);
    f.ally.x = 136;
    f.attack(6);
    assert.equal(f.support.supportNetworkState.charge, 0);
    f.ally.x = 135;
    f.attack();
    assert.equal(f.support.supportNetworkState.charge, 1);
    f.game.heroes = [f.support];
    f.attack(6);
    assert.equal(f.support.supportNetworkState.charge, 1);
    f.game.heroes.push(f.ally);
    f.ally.stunTimer = 2;
    f.attack();
    assert.equal(f.support.supportNetworkState.charge, 1);
});

test('segundo blaster de Star-Lord y sus impactos no cuentan como ataques nuevos', () => {
    const f = setup();
    const star = new Hero(heroes.star_lord, 50, 0, f.game);
    f.game.heroes.push(star);
    const other = new Enemy({ id: 'other', hp: 1e9, speed: 1 }, [{ x: 85, y: 0 }, { x: 3000, y: 0 }], f.game);
    f.game.enemies.push(other);
    f.tick(9);
    const shots = f.attack(1, star);
    assert.equal(shots.length, 2);
    assert.equal(f.support.supportNetworkState.charge, 1);
    for (const shot of shots) {
        shot.x = shot.target.x;
        shot.y = shot.target.y;
        shot.update(0);
    }
    assert.equal(f.support.supportNetworkState.charge, 1);
});

test('aturdir Panther suspende aura/carga pero no congela la duracion activa', () => {
    const f = setup();
    f.tick(9);
    f.attack(6);
    f.support.applyStun(2);
    close(f.ally.getEffectiveStats().damage, 100);
    f.attack(6);
    assert.equal(f.support.supportNetworkState.charge, 0);
    f.tick(2);
    close(f.ally.getEffectiveStats().damage, 130);
    close(f.support.supportNetworkState.remaining, 1);
    f.tick(1);
    close(f.ally.getEffectiveStats().damage, 120);
});

test('mover Panther cancela sobrecarga y requiere 9 s de preparacion nueva', () => {
    const f = setup();
    f.tick(9);
    f.attack(6);
    f.support.x = 1;
    close(f.ally.getEffectiveStats().damage, 120);
    assert.equal(f.support.supportNetworkState.remaining, 0);
    assert.equal(f.support.supportNetworkState.cooldown, 9);
    f.attack(6);
    assert.equal(f.support.supportNetworkState.charge, 0);
});

test('retirar y recolocar no conserva cargas, ni siquiera reutilizando la instancia', () => {
    const f = setup();
    f.tick(9);
    f.attack(6);
    assert.equal(new TacticalActionSystem(f.game).sell(f.support).ok, true);
    close(f.ally.getEffectiveStats().damage, 100);
    f.game.heroes.push(f.support);
    close(f.ally.getEffectiveStats().damage, 120);
    assert.equal(f.support.supportNetworkState.cooldown, 9);
    assert.equal(f.support.supportNetworkState.remaining, 0);
    assert.equal(f.support.level, 1);
});

for (const level of [1, 49, 50, 100]) {
    test(`Panther nivel ${level}: potencia base y sobrecarga escalan juntas sin ampliar mas el radio`, () => {
        const f = setup('black_panther', level);
        const base = getScaledSupportAura(heroes.black_panther.special.supportAura, level, heroes.black_panther.rarity);
        f.tick(9);
        f.attack(6);
        const active = getEffectiveSupportAura(f.support);
        close(active.power, base.power * 1.5);
        close(active.range, base.range);
        assert.equal(f.support.config.special.supportAura.power, 0.2);
    });
}

test('soportes puros tampoco disparan por llamadas directas ni con Mjolnir evolucionado', () => {
    for (const id of ['capitan_america', 'black_panther']) {
        const f = setup(id, 100);
        f.support.items = [items.mjolnir];
        f.tick(30);
        assert.equal(f.attack(30, f.support).length, 0);
        assert.equal(f.support.combatStats.shots, 0);
        assert.equal(f.support.combatStats.damageDealt, 0);
        assert.equal(f.target.hp, f.target.maxHp);
        assert.equal(f.game.resourceManager.lives, 15);
        assert.equal(f.game.resourceManager.credits, 0);
    }
});

test('Captain America y Panther combinan sus auras existentes sin multiplicar recursivamente la carga', () => {
    const f = setup();
    const captain = new Hero(heroes.capitan_america, 0, 0, f.game);
    f.game.heroes.push(captain);
    close(f.ally.getEffectiveStats().damage, 132);
    f.tick(9);
    f.attack(6);
    close(f.ally.getEffectiveStats().damage, 143);
    assert.equal(f.support.combatStats.abilityActivations, 1);
    assert.equal(captain.combatStats.abilityActivations, 0);
});

test('consultar stats/indicador o dt cero no avanza los temporizadores', () => {
    const f = setup();
    f.tick(9);
    f.attack(6);
    const before = { ...f.support.supportNetworkState };
    for (let i = 0; i < 30; i++) {
        f.ally.getEffectiveStats();
        const display = f.support.abilitySystem.getDisplayState();
        assert.match(display.label, /Sobrecarga \+30%/);
        f.tick(0);
    }
    assert.deepEqual(f.support.supportNetworkState, before);
    assert.equal(VIBRANIUM_NETWORK.duration / VIBRANIUM_NETWORK.cooldown, 1 / 3);
});

test('comparativa de 60 s: Captain cubre posiciones separadas; Panther gana solo en su radio', () => {
    const run = (id, x) => {
        const f = setup(id);
        f.ally.x = x;
        f.target.x = x + 30;
        for (let n = 0; n < 1200; n++) {
            f.tick(0.05);
            f.ally.update(0.05, f.game.enemies, f.game.projectiles);
            for (const shot of f.game.projectiles) {
                shot.x = shot.target.x;
                shot.y = shot.target.y;
                shot.update(0);
            }
            f.game.projectiles = [];
        }
        return { damage: f.ally.combatStats.damageDealt, shots: f.ally.combatStats.shots, bursts: f.support.combatStats.abilityActivations };
    };
    const captainNear = run('capitan_america', 50);
    const captainWide = run('capitan_america', 200);
    const pantherNear = run('black_panther', 50);
    const pantherWide = run('black_panther', 200);
    assert.equal(captainNear.damage, captainWide.damage);
    assert.ok(pantherNear.damage > captainNear.damage);
    assert.ok(pantherWide.damage < captainWide.damage);
    assert.ok(pantherNear.bursts > 0 && pantherNear.bursts <= 6);
    assert.equal(pantherWide.bursts, 0);
    assert.ok(pantherNear.damage / pantherNear.shots > 120);
    assert.ok(pantherNear.damage / pantherNear.shots < 125, 'no equivale a un +30% permanente');
});

test('Domino conserva su 15% por ataque durante la carga y la sobrecarga', () => {
    const f = setup();
    const domino = new Hero(heroes.domino, 50, 0, f.game);
    f.game.heroes.push(domino);
    f.tick(9);
    f.attack(12, domino);
    assert.equal(f.game.resourceManager.credits, 12 * 15);
    assert.equal(domino.combatStats.goldGenerated, 12 * 15);
    assert.equal(f.support.combatStats.abilityActivations, 1);
    assert.equal(f.support.combatStats.damageDealt, 0);
});

test('preview de mejora usa potencia actual del aura sin consumir cargas o tiempo', () => {
    const f = setup();
    f.game.heroDatabase = heroes;
    const ui = new HeroUpgradeController({ game: f.game });
    const normal = ui.getHeroLevelPreviewRows(f.support).find((row) => row.label === 'Aura').value;
    f.tick(9);
    f.attack(6);
    const before = { ...f.support.supportNetworkState };
    const boosted = ui.getHeroLevelPreviewRows(f.support).find((row) => row.label === 'Aura').value;
    close(boosted, normal * 1.5);
    assert.deepEqual(f.support.supportNetworkState, before);
    f.tick(3);
    close(ui.getHeroLevelPreviewRows(f.support).find((row) => row.label === 'Aura').value, normal);
});

test('ficha desplegada muestra aura activa y contador, sin cambiar estado al renderizar', () => {
    const f = setup();
    const oldDocument = globalThis.document;
    globalThis.document = { getElementById: () => null };
    const ui = {
        game: f.game,
        panelContent: { innerHTML: '', querySelectorAll: () => [], querySelector: () => null },
        inventoryPanel: {}, getHeroLevel: () => 1, getHeroUpgradeCost: () => 180,
        getHeroLevelPreviewLabel: () => '', getHeroLevelPreviewRows: () => [],
        getTerrainText: () => 'Pasto', getMissionCredits: () => 0,
        getHeroDisplaySprite: () => null, renderSprite: () => '',
        bindHeroDetailTabs() {}, renderPanel() {}
    };
    try {
        const panel = new HeroDetailsPanel(ui);
        panel.render(f.support);
        assert.match(ui.panelContent.innerHTML, /Da\u00f1o \+20%/);
        f.tick(9);
        f.attack(6);
        const before = { ...f.support.supportNetworkState };
        panel.render(f.support);
        assert.match(ui.panelContent.innerHTML, /Da\u00f1o \+30%/);
        assert.match(ui.panelContent.innerHTML, /Sobrecarga \+30%/);
        assert.deepEqual(f.support.supportNetworkState, before);
    } finally {
        globalThis.document = oldDocument;
    }
});
