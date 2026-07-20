import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EVOLUTION_CATALOG, applyEvolutionStats, getEvolutionForHero } from '../src/systems/EvolutionSystem.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));

test('el catalogo legacy conserva identidades base distintas', () => {
    const baseHeroIds = Object.values(EVOLUTION_CATALOG).map((entry) => entry.baseHeroId);
    assert.equal(new Set(baseHeroIds).size, baseHeroIds.length);
    assert.deepEqual(baseHeroIds.sort(), ['iron_man', 'jean_grey', 'spiderman']);
});

test('ningun heroe declara evolucion jugable hasta completar sprites del roster', () => {
    assert.deepEqual(Object.values(heroes).filter((hero) => hero.evolutionId).map((hero) => hero.id), []);
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
