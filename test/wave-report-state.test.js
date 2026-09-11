import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildBaseIntegrityIntel,
    buildTacticalContributionModel,
    buildWaveReportActionState,
    buildWaveReportComparison,
    buildWaveReportGrade,
    buildWaveReportLesson,
    buildWaveReportState
} from '../src/ui/WaveReportState.js';

test('WaveReportState resume oleada limpia con lectura economica', () => {
    const state = buildWaveReportState({
        wave: 8,
        leaks: 0,
        kills: 12,
        damage: 1850,
        credits: 430,
        bestHero: 'Iron Man',
        bestHeroId: 'iron_man',
        bestHeroDamage: 640
    });

    assert.equal(state.wave, 8);
    assert.equal(state.tone, 'clean');
    assert.equal(state.label, 'Oleada asegurada');
    assert.equal(state.grade.medal, 'S');
    assert.equal(state.baseIntegrityIntel.label, 'Base intacta');
    assert.match(state.lesson.detail, /ahorrar|tienda|power spike/);
});

test('WaveReportState compara la oleada contra la anterior', () => {
    const comparison = buildWaveReportComparison(
        { wave: 8, leaks: 0, kills: 12, damage: 1850, credits: 430 },
        { wave: 7, leaks: 2, kills: 9, damage: 1200, credits: 350 }
    );
    const state = buildWaveReportState(
        { wave: 8, leaks: 0, kills: 12, damage: 1850, credits: 430 },
        { wave: 7, leaks: 2, kills: 9, damage: 1200, credits: 350 }
    );

    assert.equal(comparison.active, true);
    assert.equal(comparison.label, 'vs oleada 7');
    assert.equal(comparison.tone, 'up');
    assert.deepEqual(comparison.metrics.map((metric) => metric.id), ['kills', 'damage', 'credits', 'baseDamage']);
    assert.equal(comparison.metrics[0].value, '+3 KO');
    assert.equal(comparison.metrics[1].value, '+650');
    assert.equal(comparison.metrics[2].value, '+$80');
    assert.equal(comparison.metrics[3].value, '-2 vida');
    assert.equal(comparison.metrics[3].tone, 'up');
    assert.equal(state.comparison.label, 'vs oleada 7');
    assert.equal(buildWaveReportComparison({ wave: 8 }, { wave: 8 }).active, false);
});

test('WaveReportState convierte dano a base en alerta y lectura de enemigo', () => {
    const state = buildWaveReportState({
        leaks: 2,
        kills: 5,
        damage: 800,
        credits: 120,
        bestHero: 'Hawkeye',
        bestHeroDamage: 520,
        leakEvents: [
            { name: 'Ninja de La Mano', counter: 'Deteccion', lifeLoss: 1, segmentPct: 98, traits: ['Sigilo'] }
        ]
    });

    assert.equal(state.tone, 'damage');
    assert.equal(state.baseIntegrityIntel.items[0].name, 'Ninja de La Mano');
    assert.match(state.baseIntegrityIntel.items[0].detail, /98% ruta/);
    assert.equal(buildWaveReportLesson({ leaks: 3 }).tone, 'breach');
    assert.equal(buildWaveReportGrade({ leaks: 3 }).tone, 'critical');
});

test('WaveReportState mide aportes tacticos no basados en dano', () => {
    const model = buildTacticalContributionModel({
        score: 18.5,
        mvp: 'Storm',
        controlSeconds: 9.2,
        armorBreaks: 3,
        detectionReveals: 4,
        heroes: [
            { id: 'storm', name: 'Storm', tacticalScore: 12.4, controlSeconds: 9.2 },
            { id: 'hulk', name: 'Hulk', tacticalScore: 0 }
        ]
    });

    assert.equal(model.active, true);
    assert.equal(model.score, 19);
    assert.deepEqual(model.metrics.map((metric) => metric.id), ['control', 'armor', 'detect']);
    assert.equal(model.heroes.length, 1);
    assert.match(model.heroes[0].detail, /9s control/);
});

test('WaveReportState recomienda mejorar o ahorrar para el MVP', () => {
    const heroes = [
        { id: 'iron_man', name: 'Iron Man', level: 3, config: { id: 'iron_man', name: 'Iron Man' } }
    ];
    const upgrade = buildWaveReportActionState(
        { bestHeroId: 'iron_man', bestHero: 'Iron Man', leaks: 0 },
        heroes,
        500,
        (level) => level * 120
    );
    const saving = buildWaveReportActionState(
        { bestHeroId: 'iron_man', bestHero: 'Iron Man', leaks: 1 },
        heroes,
        100,
        (level) => level * 120
    );

    assert.equal(upgrade.type, 'upgrade');
    assert.equal(upgrade.cost, 360);
    assert.equal(saving.type, 'saving');
    assert.equal(saving.missing, 260);
    assert.equal(buildWaveReportActionState({ bestHero: 'Sin MVP' }, heroes, 500), null);
    assert.equal(buildBaseIntegrityIntel([], 0).label, 'Base intacta');
});
