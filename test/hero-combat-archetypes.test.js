import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));

function getHeroCombatCoverage(hero) {
    const special = hero.special || {};
    const effects = special.attackEffects || [];
    const stats = special.statModifiers || {};
    const profile = special.projectileProfile || {};
    const text = `${hero.abilityDesc || ''} ${hero.niche || ''} ${JSON.stringify(special)}`.toLowerCase();

    return {
        slow: effects.some((effect) => effect.type === 'slow') || text.includes('ralent'),
        stunFreeze: effects.some((effect) => ['stun', 'freeze'].includes(effect.type)) || /aturd|parali|congela|inmovil/.test(text),
        burn: effects.some((effect) => effect.type === 'burn') || /quema|fuego|ardiend/.test(text),
        poison: effects.some((effect) => effect.type === 'poison') || /veneno|toxina/.test(text),
        curse: effects.some((effect) => effect.type === 'curse') || text.includes('maldici'),
        armorBreak: effects.some((effect) => effect.type === 'armorBreak') || Boolean(stats.armorBreakChance || profile.armorPenetration) || text.includes('armadura'),
        superCritical: Boolean(stats.critChance || stats.critDamage) || /critico|crítico/.test(text),
        detection: Boolean(hero.canSeeStealth || stats.detectStealth) || /detecci|sigilo/.test(text),
        heal: effects.some((effect) => effect.type === 'heal') || /cura|restaura|recupera/.test(text),
        buffAura: Boolean(special.aura || stats.auraDamagePct) || /aura|aliados cercanos|potenci/.test(text)
    };
}

function heroesWith(type) {
    return Object.values(heroes)
        .filter((hero) => getHeroCombatCoverage(hero)[type])
        .map((hero) => hero.name);
}

test('roster reparte cada tipo de ataque clave entre multiples heroes', () => {
    const minimums = {
        slow: 2,
        stunFreeze: 2,
        burn: 2,
        poison: 2,
        curse: 2,
        armorBreak: 2,
        superCritical: 2
    };

    for (const [type, minimum] of Object.entries(minimums)) {
        assert.ok(heroesWith(type).length >= minimum, `${type} necesita al menos ${minimum} heroes`);
    }
});

test('roster tiene por lo menos cinco heroes de utilidad y soporte de campo', () => {
    const utilityHeroes = new Set([
        ...heroesWith('detection'),
        ...heroesWith('heal'),
        ...heroesWith('buffAura')
    ]);

    assert.ok(utilityHeroes.size >= 5);
    assert.ok(heroesWith('heal').length >= 5);
});
