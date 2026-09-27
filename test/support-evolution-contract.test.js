import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { getEffectiveSupportAura, getEvolvedSupportAura, getMentalLinks } from '../src/systems/SupportAuraSystem.js';
import { getScaledSupportAura } from '../src/utils/HeroLevel.js';
import { getEvolutionForHero, EVOLUTION_CATALOG } from '../src/systems/EvolutionSystem.js';
import { HeroUpgradeController } from '../src/ui/HeroUpgradeController.js';
import { TeamBuilderPanel } from '../src/ui/TeamBuilderPanel.js';
import { buildWaveDamageCheck } from '../src/systems/WaveDamageCheck.js';
import { ProgressionManager } from '../src/systems/ProgressionManager.js';
import { collectSupportMultipliers } from '../scripts/simulate-campaign-balance.js';

const data = Object.fromEntries(['heroes', 'enemies', 'items', 'levels'].map((name) => [name,
    JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'))]));
const ids = Object.values(data.heroes).filter((h) => h.special?.supportAura?.type).map((h) => h.id);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

function setup(id, level = 49) {
    const game = { heroes: [], enemies: [], projectiles: [], heroDatabase: data.heroes,
        random: { next: () => 0.99 }, resourceManager: { lives: 20, credits: 0, addCredits(n) { this.credits += n; } },
        progression: { getHeroBonuses: () => null } };
    const support = new Hero({ ...data.heroes[id], level }, 0, 0, game);
    const ally = new Hero({ id: 'ally', damage: 100, fireRate: 1, range: 200 }, 50, 0, game);
    game.heroes = [support, ally];
    game.progression.getHeroEvolution = (heroId) => {
        const h = game.heroes.find((entry) => entry.id === heroId);
        return h ? getEvolutionForHero(h.config, {}, { level: h.level, equippedItemIds: h.items.map((item) => item.id) }) : null;
    };
    return { game, support, ally };
}

test('solo los nueve soportes puros tienen mejora de aura por evolucion', () => {
    assert.equal(ids.length, 9);
    for (const hero of Object.values(data.heroes)) {
        const evolution = EVOLUTION_CATALOG[hero.evolutionId];
        assert.equal(evolution.supportAuraPower, ids.includes(hero.id) ? 0.25 : 0);
        if (ids.includes(hero.id)) assert.equal(evolution.requiredLevel, 50);
    }
});

for (const id of ids) {
    test(`${id}: fronteras 49/50/51 y 99/100, potencia x1.25 sin evolucionar radio`, () => {
        const hero = data.heroes[id];
        for (const level of [1, 49, 50, 51, 99, 100]) {
            const base = getScaledSupportAura(hero.special.supportAura, level, hero.rarity);
            const evolved = getEvolvedSupportAura(hero, level);
            close(evolved.power, base.power * (level >= 50 ? 1.25 : 1));
            close(evolved.range, base.range);
            assert.equal(evolved.detectStealth, base.detectStealth);
        }
    });

    test(`${id}: preview de 49 a 50 coincide con buff real y no muestra dano inutil`, () => {
        const f = setup(id);
        f.support.update(6, [], []);
        const current = getEffectiveSupportAura(f.support);
        const before = JSON.stringify({ level: f.support.level, pulse: f.support.supportPulseState, network: f.support.supportNetworkState });
        const preview = new HeroUpgradeController({ game: f.game });
        const rows = preview.getHeroLevelPreviewRows(f.support);
        const label = id === 'wasp' ? 'Pulso' : id === 'maria_hill' ? 'Marcados' : 'Aura';
        const row = rows.find((entry) => entry.label === label);
        assert.ok(row?.value > 0);
        assert.ok(!rows.some((entry) => entry.label === 'Dano'));
        assert.equal(JSON.stringify({ level: f.support.level, pulse: f.support.supportPulseState, network: f.support.supportNetworkState }), before);
        f.support.level = 50;
        const next = getEffectiveSupportAura(f.support);
        close(row.value, (next.power - current.power) * 100);
        close(rows.find((entry) => entry.label === 'Radio').value, next.range - current.range);
        assert.deepEqual(preview.getHeroLevelPreviewRows({ ...data.heroes[id], level: 100 }), []);
    });

    test(`${id}: equipado, evolucionado y a nivel 100 no ataca ni cobra; el aura no hereda stats ofensivas`, () => {
        const f = setup(id, 100);
        const target = new Enemy({ id: 'target', hp: 1e6, speed: 1, reward: 100 }, [{ x: 80, y: 0 }, { x: 1000, y: 0 }], f.game);
        f.game.enemies = [target];
        const base = getEvolvedSupportAura(f.support);
        f.support.items = [data.items.mjolnir];
        for (let n = 0; n < 40; n++) {
            f.support.update(1, f.game.enemies, f.game.projectiles);
            f.support.shoot(target, f.support.getEffectiveStats(), f.game.projectiles);
        }
        close(getEvolvedSupportAura(f.support).power, base.power);
        close(getEvolvedSupportAura(f.support).range, base.range);
        assert.equal(f.game.projectiles.length, 0);
        assert.equal(target.debuffs.length, 0);
        assert.equal(f.support.combatStats.damageDealt, 0);
        assert.equal(f.game.resourceManager.lives, 20);
        assert.equal(f.game.resourceManager.credits, 0);
    });
}

test('Profesor X aumenta presupuesto y tope, sin cambiar numero de enlaces por evolucion', () => {
    const f = setup('profesor_x', 50);
    const base = getScaledSupportAura(f.support.config.special.supportAura, 50, 'Mythic');
    close(getEffectiveSupportAura(f.support).power, base.power * 1.25 * 2);
    for (let n = 0; n < 4; n++) f.game.heroes.push(new Hero({ id: `other_${n}`, damage: 10 }, 40, 0, f.game));
    assert.equal(getMentalLinks(f.support).length, 5);
    close(getEffectiveSupportAura(f.support).power * 5, base.power * 1.25 * 10 / 3);
});

test('cruzar 50 no reinicia pulso Pym, sello Wong ni red Panther', () => {
    for (const id of ['wasp', 'wong', 'black_panther']) {
        const f = setup(id);
        f.support.update(9, [], []);
        const before = JSON.stringify([f.support.supportPulseState, f.support.supportNetworkState]);
        f.support.level = 50;
        for (let n = 0; n < 10; n++) getEffectiveSupportAura(f.support);
        assert.equal(JSON.stringify([f.support.supportPulseState, f.support.supportNetworkState]), before);
    }
});

test('previsualizar varios niveles incluye un unico salto, tambien desde inventario sin partida', () => {
    const f = setup('capitan_america', 45);
    const preview = new HeroUpgradeController({ game: f.game });
    for (const hero of [f.support, { ...data.heroes.capitan_america, level: 45 }]) {
        const delta = preview.getHeroLevelPreviewRows(hero, 10).find((row) => row.label === 'Aura').value;
        close(delta, (getEvolvedSupportAura(hero, 55).power - getEvolvedSupportAura(hero, 45).power) * 100);
    }
});

test('radar no cuenta dano falso de soportes evolucionados y usa potencia efectiva', () => {
    const f = setup('capitan_america', 100);
    f.support.damage = 1000;
    const check = buildWaveDamageCheck({ heroes: [f.support], waveModel: { total: 1, effectiveHp: 100 } });
    assert.equal(check.dps, 0);
    assert.deepEqual(check.contributors, []);
    assert.equal(check.supports[0].label, '+21% dano');
    assert.match(f.support.abilitySystem.getDisplayState().label, /21%/);
    const hill = setup('maria_hill', 100);
    assert.match(buildWaveDamageCheck({ heroes: [hill.support] }).supports[0].label, /contra marcados/);
});

test('diccionario anuncia potencia del aura y no mejoras ofensivas como beneficio de soporte', () => {
    const panel = new TeamBuilderPanel({ game: { heroDatabase: { capitan_america: data.heroes.capitan_america }, itemDatabase: data.items }, renderSprite: () => '' });
    panel.getCollectionSprite = () => null;
    const html = panel.renderEvolutionCodex();
    assert.match(html, /Potencia del aura \+25%/);
    assert.match(html, /Radio y ciclos sin cambio/);
    assert.doesNotMatch(html, /Daño \+|Cadencia \+|Alcance \+/);
});

test('campana incorpora evolucion de aura sin sumar stats ofensivas de la transformacion', () => {
    const f = setup('capitan_america', 50);
    const estimate = collectSupportMultipliers([['capitan_america', 50], ['hawkeye', 50]]);
    close(estimate.damage, getEvolvedSupportAura(f.support).power);
    close(f.ally.getEffectiveStats().damage, 100 * (1 + estimate.damage));
});

test('retirar del equipo y recargar guardado conserva nivel y potencia evolucionada', () => {
    const values = new Map();
    const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
    const game = { heroes: [], resourceManager: { lives: 20, maxLives: 20 }, currentLevel: { id: 'level_1' }, audio: { setEnabled() {} } };
    const manager = new ProgressionManager(storage);
    manager.initialize(game, data);
    manager.startProfile('capitan_america');
    manager.setHeroLevel('capitan_america', 50);
    const before = getEffectiveSupportAura(game.activeTeam[0]).power;
    manager.setActiveTeam([]);
    const reopened = new ProgressionManager(storage);
    reopened.initialize(game, data);
    reopened.setActiveTeam(['capitan_america']);
    assert.equal(reopened.getHeroLevel('capitan_america'), 50);
    close(getEffectiveSupportAura(game.activeTeam[0]).power, before);
    assert.equal(reopened.getHeroEvolution('capitan_america').supportAuraPower, 0.25);
});
