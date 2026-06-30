import test from 'node:test';
import assert from 'node:assert/strict';
import { InputManager, measurePathCoverage } from '../src/core/InputManager.js';

test('measurePathCoverage mide el tramo de camino dentro del rango', () => {
    const coverage = measurePathCoverage(
        { x: 150, y: 60 },
        100,
        [{ x: 0, y: 0 }, { x: 300, y: 0 }]
    );

    assert.equal(coverage.intervals.length, 1);
    assert.ok(Math.abs(coverage.coveredLength - 160) < 0.001);
    assert.equal(coverage.quality.id, 'excellent');
    assert.deepEqual(roundPoint(coverage.intervals[0].from), { x: 70, y: 0 });
    assert.deepEqual(roundPoint(coverage.intervals[0].to), { x: 230, y: 0 });
});

test('measurePathCoverage suma cobertura al doblar una esquina', () => {
    const coverage = measurePathCoverage(
        { x: 100, y: 100 },
        80,
        [{ x: 0, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 220 }]
    );

    assert.equal(coverage.intervals.length, 2);
    assert.ok(Math.abs(coverage.coveredLength - 160) < 0.001);
    assert.equal(coverage.quality.id, 'excellent');
});

test('measurePathCoverage informa cobertura minima si no alcanza la ruta', () => {
    const coverage = measurePathCoverage(
        { x: 200, y: 200 },
        50,
        [{ x: 0, y: 0 }, { x: 120, y: 0 }]
    );

    assert.equal(coverage.coveredLength, 0);
    assert.equal(coverage.intervals.length, 0);
    assert.equal(coverage.quality.id, 'minimal');
});

test('InputManager cicla prioridad del heroe seleccionado con atajo configurable', () => {
    const previousWindow = globalThis.window;
    let keydownHandler = null;
    globalThis.window = {
        addEventListener(type, handler) {
            if (type === 'keydown') keydownHandler = handler;
        }
    };

    const hero = {
        id: 'iron_man',
        name: 'Iron Man',
        targetingPriority: 'Primero',
        config: { id: 'iron_man', targetingPriority: 'Primero' },
        getEffectiveStats: () => ({ range: 160 })
    };
    const calls = [];
    const game = {
        selectedUnit: hero,
        heroes: [hero],
        activeTeam: [hero.config],
        progression: { state: { settings: { keyBindings: { targeting: 't' } } } },
        tacticalActions: null
    };
    const ui = {
        showToast: (message, type) => calls.push(['toast', message, type]),
        setSelectionStatus: (message) => calls.push(['status', message]),
        renderHeroRoster: () => calls.push(['roster'])
    };
    const canvas = { addEventListener: () => {} };
    try {
        const input = new InputManager(canvas, game, ui, {});
        let prevented = false;

        keydownHandler({ key: 't', target: { tagName: 'BODY' }, preventDefault: () => { prevented = true; } });

        assert.ok(input);
        assert.equal(prevented, true);
        assert.equal(hero.targetingPriority, 'Último');
        assert.equal(hero.config.targetingPriority, 'Último');
        assert.deepEqual(calls[0], ['toast', 'Iron Man: objetivo Último', 'info']);
        assert.deepEqual(calls.at(-1), ['roster']);
    } finally {
        globalThis.window = previousWindow;
    }
});

function roundPoint(point) {
    return { x: Math.round(point.x), y: Math.round(point.y) };
}
