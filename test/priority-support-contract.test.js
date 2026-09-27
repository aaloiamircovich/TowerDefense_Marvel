import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Hero } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { TacticalActionSystem } from '../src/systems/TacticalActionSystem.js';
import { getEffectiveSupportAura, getPriorityOrderDamageMultiplier, getSupportAuraDisplayState } from '../src/systems/SupportAuraSystem.js';
import { getScaledSupportAura } from '../src/utils/HeroLevel.js';
import { getEvolutionForHero } from '../src/systems/EvolutionSystem.js';
import { buildSignatureAttackContext, resolveSignatureAfterAttack } from '../src/systems/ItemSignatureSystem.js';
import { HeroUpgradeController } from '../src/ui/HeroUpgradeController.js';
import { HeroDetailsPanel } from '../src/ui/HeroDetailsPanel.js';
import { buildHeroCombatIdentity } from '../src/ui/HeroTacticsState.js';
import { collectSupportMultipliers } from '../scripts/simulate-campaign-balance.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
const items = JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);

function setup(level = 1) {
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
    const support = new Hero({ ...heroes.maria_hill, level }, 0, 0, game);
    const ally = new Hero({ id: 'ally', damage: 100, fireRate: 1, range: 300, critChance: 0.01 }, 50, 0, game);
    game.heroes = [support, ally];
    const spawn = (x = 80) => {
        const enemy = new Enemy({ id: 'target', hp: 100000, speed: 1, reward: 100 }, [{ x, y: 0 }, { x: 3000, y: 0 }], game);
        game.enemies.push(enemy);
        return enemy;
    };
    const target = spawn();
    const mark = (enemy = target, power = 0.2, source = ally) => enemy.applyStatus({ type: 'mark', duration: 10, power }, source);
    const hit = (enemy = target, extra = {}) => CombatSystem.applyImpact({ damage: ally.getEffectiveStats().damage, ...extra }, enemy, ally, game.resourceManager);
    const shoot = (source = ally) => {
        const shots = [];
        source.shoot(target, source.getEffectiveStats(), shots);
        return shots;
    };
    return { game, support, ally, spawn, target, mark, hit, shoot };
}

test('Hill detecta sin marcar ni aumentar el dano general del aliado', () => {
    const f = setup();
    close(f.ally.getEffectiveStats().damage, 100);
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, true);
    close(f.hit().damage, 100);
    assert.equal(f.target.debuffs.length, 0);
    f.ally.x = 226;
    assert.equal(f.ally.getEffectiveStats().canSeeStealth, false);
    close(f.ally.getEffectiveStats().damage, 100);
});

test('marca activa combina su vulnerabilidad con +9% sin inflar stats ni DoT', () => {
    const f = setup();
    f.mark();
    close(f.hit().damage, 100 * 1.2 * 1.09);
    close(f.ally.getEffectiveStats().damage, 100);
    close(f.ally.combatStats.damageDealt, 130.8);
    assert.equal(f.support.combatStats.damageDealt, 0);
    assert.equal(f.target.debuffs.length, 1);
});

for (const status of ['slow', 'stun', 'armorBreak', 'curse', 'mark-expired']) {
    test(`${status} no sustituye una marca activa`, () => {
        const f = setup();
        f.target.debuffs.push({ type: status === 'mark-expired' ? 'mark' : status, duration: status === 'mark-expired' ? 0 : 5, power: 0.2 });
        close(getPriorityOrderDamageMultiplier(f.ally, f.target), 1);
    });
}

test('el primer impacto que marca no recibe su propio bonus; el siguiente si', () => {
    const f = setup();
    const effects = [{ type: 'mark', duration: 5, power: 0.2 }];
    close(f.hit(f.target, { effects }).damage, 100);
    close(f.hit().damage, 130.8);
    f.target.updateDebuffs(5);
    close(f.hit().damage, 100);
});

test('radio inclusivo sobre el aliado; el enemigo puede estar fuera del aura', () => {
    const f = setup();
    f.mark();
    f.target.x = 450;
    f.ally.x = 225;
    close(f.hit().damage, 130.8);
    f.ally.x = 225.01;
    close(f.hit().damage, 120);
});

for (const absent of ['support-stun', 'ally-stun', 'support-removed', 'ally-removed', 'support-moved']) {
    test(`${absent}: impacto en vuelo no conserva la orden anterior`, () => {
        const f = setup();
        f.mark();
        const [shot] = f.shoot();
        if (absent === 'support-stun') f.support.applyStun(2);
        if (absent === 'ally-stun') f.ally.applyStun(2);
        if (absent === 'support-removed') f.game.heroes = [f.ally];
        if (absent === 'ally-removed') f.game.heroes = [f.support];
        if (absent === 'support-moved') f.support.x = 1000;
        shot.x = f.target.x;
        shot.y = f.target.y;
        shot.update(0);
        close(f.target.maxHp - f.target.hp, 120);
    });
}

test('marca llegada o vencida durante el vuelo se decide al impactar', () => {
    for (const active of [true, false]) {
        const f = setup();
        if (!active) f.mark();
        const [shot] = f.shoot();
        if (active) f.mark();
        else f.target.updateDebuffs(10);
        shot.x = f.target.x;
        shot.y = f.target.y;
        shot.update(0);
        close(f.target.maxHp - f.target.hp, active ? 130.8 : 100);
    }
});

for (const mode of ['splash', 'chain', 'propagation']) {
    test(`${mode} evalua marca individual, no hereda el bonus del blanco principal`, () => {
        const f = setup();
        const plain = f.spawn(85);
        const marked = f.spawn(90);
        f.mark();
        f.mark(marked);
        const profile = mode === 'splash' ? { splashRadius: 50, splashFactor: 0.5 }
            : mode === 'chain' ? { chainCount: 2, chainRange: 50, chainFactor: 0.5 }
                : { propagationCount: 2, propagationRadius: 50, propagationFactor: 0.5, effects: [{ type: 'mark', duration: 5, power: 0.2 }] };
        assert.equal(f.hit(f.target, profile).hits, 3);
        close(plain.maxHp - plain.hp, 50);
        close(marked.maxHp - marked.hp, 130.8 * (mode === 'chain' ? 0.25 : 0.5));
        if (mode === 'propagation') assert.ok(plain.debuffs.some((e) => e.type === 'mark'));
    });
}

test('un secundario marcado recibe orden aunque el principal no tenga marca', () => {
    const f = setup();
    const other = f.spawn(90);
    f.mark(other);
    close(f.hit(f.target, { splashRadius: 50, splashFactor: 0.5 }).damage, 100);
    close(other.maxHp - other.hp, 65.4);
});

for (const level of [1, 49, 50, 100]) {
    test(`nivel ${level}: bonus condicional y radio escalan, sin duplicarse por evolucion`, () => {
        const f = setup(level);
        const base = getScaledSupportAura(heroes.maria_hill.special.supportAura, level, heroes.maria_hill.rarity);
        const effective = getEffectiveSupportAura(f.support);
        const evolution = level >= 50 ? 1.25 : 1;
        close(effective.power, base.power * 2 * evolution);
        close(effective.range, base.range);
        assert.equal(effective.targetCondition, 'mark');
        f.mark();
        close(f.hit().damage, 120 * (1 + base.power * 2 * evolution));
        close(f.ally.getEffectiveStats().damage, 100);
    });
}

test('Hill con objeto ofensivo y evolucion sigue sin disparar, marcar, curar ni generar dinero', () => {
    const f = setup(100);
    f.support.items = [items.mjolnir];
    assert.equal(f.shoot(f.support).length, 0);
    for (let i = 0; i < 100; i++) f.support.update(0.5, f.game.enemies, f.game.projectiles);
    assert.equal(f.game.projectiles.length, 0);
    assert.equal(f.target.debuffs.length, 0);
    assert.equal(f.support.combatStats.damageDealt, 0);
    assert.equal(f.support.combatStats.shots, 0);
    assert.equal(f.game.resourceManager.lives, 15);
    assert.equal(f.game.resourceManager.credits, 0);
});

test('orden no potencia a otro soporte ni se aplica a ataques sin autor desplegado', () => {
    const f = setup();
    f.mark();
    close(getPriorityOrderDamageMultiplier(f.support, f.target), 1);
    close(getPriorityOrderDamageMultiplier(null, f.target), 1);
    close(getPriorityOrderDamageMultiplier(f.ally, null), 1);
});

test('DoT de objeto captura el mismo dano con y sin orden; sus ticks no la cobran', () => {
    const f = setup();
    f.ally.items = [items.emisor_termico];
    f.mark();
    const effect = f.ally.getProjectileEffects().find((entry) => entry.type === 'burn');
    const expected = f.ally.getEffectiveStats().damage * items.emisor_termico.effects.burnAttackDamagePct;
    f.target.applyStatus(effect, f.ally);
    f.target.updateDebuffs(1);
    close(f.target.maxHp - f.target.hp, expected);
    f.game.heroes = [f.ally];
    f.target.updateDebuffs(1);
    close(f.target.maxHp - f.target.hp, expected * 2);
});

test('ejecucion acredita salud restante una vez, nunca +9% ni doble baja', () => {
    const f = setup();
    f.mark();
    f.target.hp = 100;
    close(CombatSystem.executeNonBoss(f.target, f.ally, f.game.resourceManager).damage, 100);
    close(CombatSystem.executeNonBoss(f.target, f.ally, f.game.resourceManager).damage, 0);
    assert.equal(f.ally.combatStats.kills, 1);
    close(f.ally.combatStats.damageDealt, 100);
});

test('Capitan y Panther mantienen su bonus, orden solo se multiplica una vez al impactar', () => {
    const f = setup();
    f.game.heroes.push(new Hero(heroes.capitan_america, 0, 0, f.game), new Hero(heroes.black_panther, 0, 0, f.game));
    close(f.ally.getEffectiveStats().damage, 130);
    close(f.hit().damage, 130);
    f.mark();
    close(f.hit().damage, 130 * 1.2 * 1.09);
});

test('retirar/recolocar conserva nivel, no cuesta dinero y reactiva orden solo en radio', () => {
    const f = setup(50);
    f.mark();
    const expected = f.hit().damage;
    assert.equal(new TacticalActionSystem(f.game).sell(f.support).ok, true);
    close(f.hit().damage, 120);
    f.game.heroes.push(f.support);
    close(f.hit().damage, expected);
    assert.equal(f.support.level, 50);
    assert.equal(f.game.resourceManager.credits, 0);
});

test('Domino conserva 15% de recompensa por ataque principal, no por impacto potenciado', () => {
    const f = setup();
    f.mark();
    const domino = new Hero(heroes.domino, 50, 0, f.game);
    f.game.heroes.push(domino);
    for (let i = 0; i < 10; i++) {
        for (const shot of f.shoot(domino)) {
            shot.x = f.target.x;
            shot.y = f.target.y;
            shot.update(0);
        }
    }
    assert.equal(f.game.resourceManager.credits, 150);
    assert.equal(domino.combatStats.goldGenerated, 150);
    assert.equal(f.support.combatStats.goldGenerated, 0);
});

test('preview, rol e indicador anuncian Marcados y no avanzan estado', () => {
    const f = setup();
    const before = JSON.stringify(f.support.combatStats);
    const rows = new HeroUpgradeController({ game: f.game }).getHeroLevelPreviewRows(f.support);
    assert.ok(rows.some((row) => row.label === 'Marcados' && row.value > 0));
    assert.ok(rows.some((row) => row.label === 'Radio' && row.value > 0));
    assert.match(buildHeroCombatIdentity(f.support).find((row) => row.label === 'Rol').value, /Marcados \+9%/);
    assert.match(getSupportAuraDisplayState(f.support).label, /requiere marca/);
    assert.equal(JSON.stringify(f.support.combatStats), before);
    f.support.applyStun(2);
    assert.equal(getSupportAuraDisplayState(f.support).label, 'Orden suspendida');
});

test('ficha usa potencia efectiva condicional y muestra la condicion', () => {
    const f = setup();
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
        new HeroDetailsPanel(ui).render(f.support);
        assert.match(ui.panelContent.innerHTML, /Marcados \+9%/);
        assert.match(ui.panelContent.innerHTML, /Orden: requiere marca/);
    } finally { globalThis.document = oldDocument; }
});

test('estimador no trata orden como aumento incondicional de dano', () => {
    assert.deepEqual(collectSupportMultipliers([['maria_hill', 100], ['hawkeye', 50]]), { damage: 0, fireRate: 0 });
});

test('marca del kit de Scarlet Witch habilita orden para otro atacante', () => {
    const f = setup();
    const witch = new Hero(heroes.scarlet_witch, 50, 0, f.game);
    f.game.heroes.push(witch);
    const effect = witch.getProjectileEffects(f.target).find((entry) => entry.type === 'mark');
    assert.ok(effect);
    CombatSystem.applyEffects([effect], f.target, witch);
    close(f.hit().damage, 100 * (1 + effect.power) * 1.09);
});

test('marca signature de Bloodstone habilita orden sin exigir un heroe concreto como atacante', () => {
    const f = setup();
    const elsa = new Hero({ ...heroes.elsa_bloodstone, level: 50 }, 50, 0, f.game);
    elsa.items = [items.fragmento_bloodstone];
    f.game.heroes.push(elsa);
    for (let n = 0; n < 4; n++) {
        const context = buildSignatureAttackContext(elsa, f.target, elsa.getEffectiveStats());
        resolveSignatureAfterAttack(elsa, f.target, context.stats, {}, [], context);
    }
    assert.ok(f.target.debuffs.some((entry) => entry.type === 'mark'));
    close(f.hit().damage, 100 * 1.32 * 1.09);
});

test('comparativa 20 s: Hill depende de marcas, Capitan mantiene dano continuo', () => {
    const run = (id, marked) => {
        const f = setup();
        const support = new Hero(heroes[id], 0, 0, f.game);
        f.game.heroes = [support, f.ally];
        if (marked) f.target.applyStatus({ type: 'mark', duration: 30, power: 0.2 }, f.ally);
        for (let i = 0; i < 200; i++) {
            f.target.updateDebuffs(0.1);
            support.update(0.1, f.game.enemies, f.game.projectiles);
            f.ally.update(0.1, f.game.enemies, f.game.projectiles);
            for (const shot of f.game.projectiles) {
                shot.x = shot.target.x;
                shot.y = shot.target.y;
                shot.update(0);
            }
            f.game.projectiles = [];
        }
        return f.ally.combatStats.damageDealt / f.ally.combatStats.shots;
    };
    close(run('maria_hill', false), 100);
    close(run('maria_hill', true), 130.8);
    close(run('capitan_america', false), 110);
    close(run('capitan_america', true), 132);
});
