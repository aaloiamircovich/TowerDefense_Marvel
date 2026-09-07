import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildHeroCombatIdentity,
    evaluateHeroWaveFit,
    getHeroDps,
    heroCoversCounter,
    heroDetectsStealth,
    heroPiercesArmor
} from '../src/ui/HeroTacticsState.js';

test('HeroTacticsState detecta counters claves de heroe contra oleada', () => {
    const fit = evaluateHeroWaveFit({
        id: 'iron_man',
        damage: 30,
        fireRate: 1.5,
        range: 165,
        abilityDesc: 'Laser ARC atraviesa armadura.'
    }, {
        armoredCount: 4,
        barrierCount: 1,
        hasBoss: true,
        fastest: 80,
        roles: ['tank'],
        pressureScore: 22
    });

    assert.equal(fit.id, 'prime');
    assert.match(fit.reasons.join(' '), /rompe armadura/);
    assert.match(fit.reasons.join(' '), /DPS de jefe/);
});

test('HeroTacticsState resume identidad de aura economia y perfiles de rango', () => {
    const aura = buildHeroCombatIdentity({
        id: 'capitan_america',
        special: { supportAura: { type: 'damage', power: 0.18, range: 260 } },
        formationRole: 'support'
    });
    const domino = buildHeroCombatIdentity({
        id: 'domino',
        special: { economyOnHit: { rewardPct: 0.15 } }
    });

    assert.equal(aura[0].value, 'Aura');
    assert.equal(aura[1].value, 'Aura daño');
    assert.equal(aura[3].value, 'daño +18%');
    assert.equal(domino[1].value, 'Créditos');
    assert.equal(domino[3].value, 'Créditos 15%');
});

test('HeroTacticsState expone helpers compartidos para cobertura de oleada', () => {
    const detector = { id: 'black_panther', canSeeStealth: true };
    const piercing = { id: 'cyclops', abilityDesc: 'rayo perforante' };
    const damageDealer = { id: 'thor', damage: 24, fireRate: 2 };

    assert.equal(heroDetectsStealth(detector), true);
    assert.equal(heroPiercesArmor(piercing), true);
    assert.equal(heroCoversCounter(damageDealer, 'dps'), true);
    assert.equal(getHeroDps(damageDealer), 48);
});
