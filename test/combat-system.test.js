import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatSystem } from '../src/systems/CombatSystem.js';

test('CombatSystem aplica ventaja de tipo', () => {
    let received = 0;
    const target = createTarget('Urbano', (damage) => {
        received = damage;
        return { damage, killed: false };
    });

    CombatSystem.applyImpact({
        attackerType: 'Tecnológico',
        damage: 20,
        effects: []
    }, target, null, null);

    assert.equal(received, 30);
});

test('Contrato Stark genera un credito por impacto', () => {
    let credits = 0;
    const attacker = { items: [{ id: 'contrato_stark' }], killCount: 0 };
    const target = createTarget('Urbano', (damage) => ({ damage, killed: false }));

    CombatSystem.applyImpact({ attackerType: 'Urbano', damage: 10, effects: [] }, target, attacker, {
        addCredits: (amount) => { credits += amount; }
    });

    assert.equal(credits, 1);
});

test('Protocolo Extremis cura despues de quince bajas', () => {
    let lives = 0;
    const attacker = {
        items: [{ id: 'protocolo_extremis' }],
        killCount: 14
    };
    const target = createTarget('Urbano', (damage) => ({ damage, killed: true }));

    CombatSystem.applyImpact({ attackerType: 'Urbano', damage: 10, effects: [] }, target, attacker, {
        addLife: (amount) => { lives += amount; }
    });

    assert.equal(lives, 1);
    assert.equal(attacker.killCount, 0);
});

test('CombatSystem aplica dano de area solo dentro del radio', () => {
    const primary = createPositionedTarget(0, 0);
    const near = createPositionedTarget(20, 0);
    const far = createPositionedTarget(80, 0);
    const attacker = createAttacker([primary, near, far]);

    const result = CombatSystem.applyImpact({
        attackerType: 'Urbano',
        damage: 20,
        effects: [],
        splashRadius: 35,
        splashFactor: 0.5
    }, primary, attacker, null);

    assert.equal(primary.hp, 80);
    assert.equal(near.hp, 90);
    assert.equal(far.hp, 100);
    assert.equal(result.hits, 2);
});

test('CombatSystem encadena objetivos cercanos con dano decreciente', () => {
    const targets = [
        createPositionedTarget(0, 0),
        createPositionedTarget(20, 0),
        createPositionedTarget(40, 0)
    ];
    const attacker = createAttacker(targets);

    const result = CombatSystem.applyImpact({
        attackerType: 'Urbano',
        damage: 20,
        effects: [],
        chainCount: 2,
        chainRange: 25,
        chainFactor: 0.5
    }, targets[0], attacker, null);

    assert.deepEqual(targets.map((target) => target.hp), [80, 90, 95]);
    assert.equal(result.hits, 3);
    assert.equal(attacker.damageDealt, 35);
});

test('CombatSystem usa la fuente aleatoria sembrada para efectos', () => {
    let applied = 0;
    const target = createTarget('Urbano', (damage) => ({ damage, killed: false }));
    target.applyStatus = () => { applied++; };
    const attacker = {
        items: [],
        game: { random: { next: () => 0.8 }, enemies: [] }
    };

    CombatSystem.applyImpact({
        attackerType: 'Urbano',
        damage: 10,
        effects: [{ type: 'stun', duration: 1, power: 1, chance: 0.5 }]
    }, target, attacker, null);

    assert.equal(applied, 0);
});

function createTarget(category, takeDamage) {
    return {
        category,
        isAlive: true,
        armor: 0,
        takeDamage,
        applyDebuff: () => {}
    };
}

function createPositionedTarget(x, y) {
    return {
        x,
        y,
        hp: 100,
        category: 'Urbano',
        isAlive: true,
        armor: 0,
        debuffs: [],
        takeDamage(amount) {
            const damage = Math.min(this.hp, amount);
            this.hp -= damage;
            this.isAlive = this.hp > 0;
            return { damage, killed: !this.isAlive };
        },
        applyStatus: () => {}
    };
}

function createAttacker(enemies) {
    return {
        items: [],
        damageDealt: 0,
        game: { enemies, random: { next: () => 0 } },
        recordDamage(amount) {
            this.damageDealt += amount;
        }
    };
}
