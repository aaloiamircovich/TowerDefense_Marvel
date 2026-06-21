import test from 'node:test';
import assert from 'node:assert/strict';
import { isOrthogonalPath, normalizePath, removeDuplicatePoints } from '../src/utils/PathUtils.js';

test('normalizePath crea entrada y salida fuera del mapa', () => {
    const result = normalizePath([
        { x: 0, y: 120 },
        { x: 300, y: 120 },
        { x: 300, y: 500 },
        { x: 800, y: 500 }
    ], 800, 600);

    assert.deepEqual(result[0], { x: -40, y: 120 });
    assert.deepEqual(result.at(-1), { x: 840, y: 500 });
    assert.equal(isOrthogonalPath(result), true);
});

test('normalizePath convierte segmentos diagonales en segmentos ortogonales', () => {
    const result = normalizePath([
        { x: 0, y: 100 },
        { x: 300, y: 300 },
        { x: 800, y: 500 }
    ], 800, 600);

    assert.equal(isOrthogonalPath(result), true);
    assert.ok(result.length > 5);
});

test('normalizePath respeta entradas y salidas verticales', () => {
    const result = normalizePath([
        { x: 400, y: 0 },
        { x: 400, y: 200 },
        { x: 700, y: 600 }
    ], 800, 600);

    assert.deepEqual(result[0], { x: 400, y: -40 });
    assert.deepEqual(result.at(-1), { x: 700, y: 640 });
    assert.equal(isOrthogonalPath(result), true);
});

test('removeDuplicatePoints elimina puntos consecutivos repetidos', () => {
    assert.deepEqual(removeDuplicatePoints([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 40, y: 0 }
    ]), [
        { x: 0, y: 0 },
        { x: 40, y: 0 }
    ]);
});
