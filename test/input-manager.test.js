import test from 'node:test';
import assert from 'node:assert/strict';
import { measurePathCoverage } from '../src/core/InputManager.js';

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

function roundPoint(point) {
    return { x: Math.round(point.x), y: Math.round(point.y) };
}
