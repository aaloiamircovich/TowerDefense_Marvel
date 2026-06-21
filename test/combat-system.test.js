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

function createTarget(category, takeDamage) {
    return {
        category,
        isAlive: true,
        armor: 0,
        takeDamage,
        applyDebuff: () => {}
    };
}
