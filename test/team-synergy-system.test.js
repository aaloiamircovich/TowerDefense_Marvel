import test from 'node:test';
import assert from 'node:assert/strict';
import {
    SYNERGY_DEFINITIONS,
    TeamSynergySystem,
    analyzeTeam,
    getHeroTeamEffects,
    getSynergyMenuModel
} from '../src/systems/TeamSynergySystem.js';
import { HERO_RARITIES } from '../src/utils/Rarity.js';

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

test('tres Mutantes activan buff de estadisticas legendario', () => {
    const team = [
        hero('wolverine', ['Mutantes']),
        hero('storm', ['Mutantes']),
        hero('iceman', ['Mutantes'])
    ];
    const snapshot = analyzeTeam(team);
    const mutants = snapshot.families.find((family) => family.tag === 'Mutantes');
    const effects = getHeroTeamEffects(team[0], team);

    assert.equal(mutants.definition.rarity, 'Legendary');
    assert.equal(mutants.activeTier.count, 3);
    assert.equal(effects.critChance, 4);
    assert.equal(effects.rangePct, 0.035);
});

test('un equipo mixto sin requisitos completos no obtiene bonus gratuito', () => {
    const team = [
        hero('spiderman', ['Callejero', 'Tecnología']),
        hero('doctor_strange', ['Místico']),
        hero('groot', ['Guardianes']),
        hero('wolverine', ['Mutantes'])
    ];
    const snapshot = analyzeTeam(team);
    const effects = getHeroTeamEffects(team[0], team);

    assert.equal(snapshot.versatile, false);
    assert.deepEqual(effects, {});
});

test('formaciones de rol quedan retiradas del sistema de sinergias', () => {
    const game = { activeTeam: [], heroes: [], selectedUnit: null, isManuallyPaused: false };
    const system = new TeamSynergySystem(game);
    const first = deployed('hulk', 'vanguard', 0, 0);
    const second = deployed('black_panther', 'vanguard', 90, 0);
    game.heroes = [first, second];

    assert.deepEqual(system.getFormationEffects(first), {});
    assert.equal(system.getFormationStatus(first), null);
});

test('metricas de equipo resumen cobertura y coste', () => {
    const team = [hero('hawkeye', ['Avengers', 'Callejero'], 180, 220), hero('falcon', ['Avengers', 'Tecnología'], 210, 150)];
    const snapshot = analyzeTeam(team);

    assert.equal(snapshot.cost, 390);
    assert.equal(snapshot.metrics.coverage, 84);
    assert.ok(snapshot.metrics.damage > 0);
    assert.equal(snapshot.formationCounts, undefined);
});

test('menu de agrupaciones expone catalogo amplio con progreso', () => {
    const team = [
        hero('black_panther', ['Wakanda', 'Marciales']),
        hero('shuri', ['Wakanda', 'Tecnología']),
        hero('okoye', ['Wakanda', 'Marciales'])
    ];
    const snapshot = analyzeTeam(team);
    const model = getSynergyMenuModel(snapshot, team, new Set(team.map((entry) => entry.id)));
    const wakanda = model.find((group) => group.tag === 'Wakanda');

    assert.ok(Object.keys(SYNERGY_DEFINITIONS).length >= 20);
    assert.equal(wakanda.state, 'active');
    assert.equal(wakanda.progressLabel, '3/3');
    assert.equal(wakanda.rarity, 'Legendary');
    assert.equal(wakanda.rarityClass, 'rarity-legendary');
    assert.match(wakanda.effectLabel, /dano|poder|critico/);
    assert.deepEqual(wakanda.memberNames, ['black_panther', 'shuri', 'okoye'].map((id) => team.find((entry) => entry.id === id).name || id));
    assert.deepEqual(wakanda.missingNames, []);
});

test('agrupaciones tienen rareza valida y requisitos variables', () => {
    const rarities = new Set(HERO_RARITIES);
    const allTiers = Object.values(SYNERGY_DEFINITIONS).flatMap((definition) => definition.tiers);
    const tierCounts = new Set(allTiers.map((tier) => tier.count));

    for (const definition of Object.values(SYNERGY_DEFINITIONS)) {
        assert.ok(rarities.has(definition.rarity), `${definition.label} tiene rareza invalida`);
        assert.ok(definition.tiers.every((tier) => tier.count >= 2 && tier.count <= 6));
    }

    assert.ok(tierCounts.has(2), 'debe haber agrupaciones de duo');
    assert.ok(tierCounts.has(4), 'debe haber agrupaciones de cuatro');
    assert.ok(tierCounts.has(5), 'debe haber agrupaciones de cinco');
    assert.ok(tierCounts.has(6), 'debe haber agrupaciones de equipo completo');
    assert.equal(SYNERGY_DEFINITIONS.Rivales.rarity, 'Secret');
});

test('rareza de agrupacion escala por requisito, beneficio y miembros esperados', () => {
    assert.equal(SYNERGY_DEFINITIONS.Bestias.rarity, 'Common');
    assert.equal(SYNERGY_DEFINITIONS['Arácnidos'].rarity, 'Rare');
    assert.equal(SYNERGY_DEFINITIONS['Fantásticos'].rarity, 'Epic');
    assert.equal(SYNERGY_DEFINITIONS['Nexo Caótico'].rarity, 'Mythic');
    assert.equal(SYNERGY_DEFINITIONS.Rivales.rarity, 'Secret');
    assert.ok(SYNERGY_DEFINITIONS.Rivales.tiers.at(-1).effects.damagePct > SYNERGY_DEFINITIONS.Bestias.tiers.at(-1).effects.damagePct);
});

test('Rivales recompensa antiheroes de rareza alta', () => {
    const team = [
        hero('hela', ['Rivales', 'Asgardianos']),
        hero('the_hood', ['Rivales', 'Oscuros']),
        hero('venom', ['Rivales', 'Arácnidos']),
        hero('magneto', ['Rivales', 'Mutantes']),
        hero('deadpool', ['Rivales', 'Mercenarios'])
    ];
    const snapshot = analyzeTeam(team);
    const rivals = snapshot.families.find((family) => family.tag === 'Rivales');
    const effects = getHeroTeamEffects(team[0], team);

    assert.equal(rivals.activeTier.count, 5);
    assert.ok(Math.abs(effects.damagePct - 0.11) < 0.0001);
    assert.ok(Math.abs(effects.rangePct - 0.06) < 0.0001);
    assert.ok(Math.abs(effects.abilityPower - 0.07) < 0.0001);
    assert.equal(effects.detectStealth, true);
});

function hero(id, tags, cost = 200, range = 150) {
    return {
        id,
        name: id,
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
