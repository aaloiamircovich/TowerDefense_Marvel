import test from 'node:test';
import assert from 'node:assert/strict';
import { EVOLUTION_CATALOG, applyEvolutionStats, getEvolutionForHero } from '../src/systems/EvolutionSystem.js';

test('las tres evoluciones pertenecen a heroes base distintos', () => {
    assert.deepEqual(Object.values(EVOLUTION_CATALOG).map((entry) => entry.baseHeroId).sort(), ['iron_man', 'jean_grey', 'spiderman']);
});

test('una evolucion seleccionada modifica estadisticas sin mutar identidad', () => {
    const hero = { id: 'spiderman' };
    const evolution = getEvolutionForHero(hero, { spiderman: 'iron_spider' });
    const stats = applyEvolutionStats({ damage: 100, fireRate: 1, range: 200, critChance: 5, canSeeStealth: false }, evolution);
    assert.equal(evolution.id, 'iron_spider');
    assert.ok(Math.abs(stats.range - 232) < 0.0001);
    assert.equal(stats.canSeeStealth, true);
    assert.equal(hero.id, 'spiderman');
});

test('una evolucion no puede aplicarse al heroe equivocado', () => {
    assert.equal(getEvolutionForHero({ id: 'iron_man' }, { iron_man: 'phoenix' }), null);
});
