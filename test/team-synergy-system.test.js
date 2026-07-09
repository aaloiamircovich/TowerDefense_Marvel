import test from 'node:test';
import assert from 'node:assert/strict';
import {
    SYNERGY_DEFINITIONS,
    TeamSynergySystem,
    analyzeTeam,
    getHeroTeamEffects,
    getSynergyMenuModel
} from '../src/systems/TeamSynergySystem.js';

test('cinco Avengers activan solo el escalon superior', () => {
    const team = [
        hero('iron_man', ['Avengers', 'Tecnología']),
        hero('capitan_america', ['Avengers']),
        hero('thor', ['Avengers']),
        hero('hulk', ['Avengers']),
        hero('black_widow', ['Avengers'])
    ];
    const snapshot = analyzeTeam(team);
    const avengers = snapshot.families.find((family) => family.tag === 'Avengers');
    const effects = getHeroTeamEffects(team[2], team);

    assert.equal(avengers.activeTier.count, 5);
    assert.equal(avengers.activeTier.effects.damagePct, 0.07);
    assert.ok(Math.abs(effects.damagePct - 0.11) < 0.0001);
    assert.equal(effects.fireRatePct, 0.03);
});

test('Steve y Tony activan una pareja extensible', () => {
    const team = [hero('iron_man', ['Avengers', 'Tecnología']), hero('capitan_america', ['Avengers'])];
    const snapshot = analyzeTeam(team);
    const effects = getHeroTeamEffects(team[0], team);

    assert.equal(snapshot.pairs.find((pair) => pair.id === 'ciencia_y_escudo').active, true);
    assert.equal(effects.damagePct, 0.03);
    assert.equal(effects.abilityPower, 0.04);
});

test('tres Mutantes activan buff de estadisticas', () => {
    const team = [
        hero('wolverine', ['Mutantes']),
        hero('storm', ['Mutantes']),
        hero('iceman', ['Mutantes'])
    ];
    const snapshot = analyzeTeam(team);
    const mutants = snapshot.families.find((family) => family.tag === 'Mutantes');
    const effects = getHeroTeamEffects(team[0], team);

    assert.equal(mutants.activeTier.count, 3);
    assert.equal(effects.critChance, 4);
    assert.equal(effects.rangePct, 0.04);
});

test('un equipo mixto obtiene versatilidad sin exigir una familia', () => {
    const team = [
        hero('spiderman', ['Callejero', 'Tecnología']),
        hero('doctor_strange', ['Místico']),
        hero('groot', ['Guardianes']),
        hero('wolverine', ['Mutantes'])
    ];
    const snapshot = analyzeTeam(team);
    const effects = getHeroTeamEffects(team[0], team);

    assert.equal(snapshot.versatile, true);
    assert.equal(effects.damagePct, 0.025);
    assert.equal(effects.rangePct, 0.025);
});

test('formacion de vanguardia depende de distancia real', () => {
    const game = { activeTeam: [], heroes: [], selectedUnit: null, isManuallyPaused: false };
    const system = new TeamSynergySystem(game);
    const first = deployed('hulk', 'vanguard', 0, 0);
    const second = deployed('black_panther', 'vanguard', 90, 0);
    game.heroes = [first, second];

    assert.deepEqual(system.getFormationEffects(first), { damagePct: 0.06, critChance: 2 });
    second.x = 140;
    assert.deepEqual(system.getFormationEffects(first), {});
});

test('metricas de equipo resumen cobertura y coste', () => {
    const team = [hero('hawkeye', ['Avengers', 'Callejero'], 180, 220), hero('falcon', ['Avengers', 'Tecnología'], 210, 150)];
    const snapshot = analyzeTeam(team);

    assert.equal(snapshot.cost, 390);
    assert.equal(snapshot.metrics.coverage, 84);
    assert.ok(snapshot.metrics.damage > 0);
    assert.equal(snapshot.formationCounts.artillery, 2);
});

test('menu de agrupaciones expone entre diez y quince grupos con progreso', () => {
    const team = [
        hero('black_panther', ['Wakanda', 'Marciales']),
        hero('shuri', ['Wakanda', 'Tecnología']),
        hero('okoye', ['Wakanda', 'Marciales'])
    ];
    const snapshot = analyzeTeam(team);
    const model = getSynergyMenuModel(snapshot, team, new Set(team.map((entry) => entry.id)));
    const wakanda = model.find((group) => group.tag === 'Wakanda');

    assert.ok(Object.keys(SYNERGY_DEFINITIONS).length >= 10);
    assert.ok(Object.keys(SYNERGY_DEFINITIONS).length <= 15);
    assert.equal(wakanda.state, 'active');
    assert.equal(wakanda.progressLabel, '3/3');
    assert.match(wakanda.effectLabel, /dano|poder|critico/);
});

function hero(id, tags, cost = 200, range = 150) {
    return {
        id,
        tags,
        cost,
        range,
        formationRole: 'artillery',
        teamMetrics: { damage: 3, control: 3, support: 3, detection: 3 }
    };
}

function deployed(id, formationRole, x, y) {
    return { id, formationRole, x, y };
}
