import test from 'node:test';
import assert from 'node:assert/strict';
import { MANHATTAN_MANUAL_ROWS } from '../src/rendering/ManhattanManualMap.js';
import { buildPixelTerrainMap, getManhattanTileId, isPixelMapLevel, TERRAIN } from '../src/rendering/PixelMapRenderer.js';

test('buildPixelTerrainMap crea una grilla Manhattan de 32 px', () => {
    const level = { theme: { id: 'new-york' }, rendering: { style: 'pixelart', tileSize: 32 } };
    const canvas = { width: 800, height: 600 };
    const map = buildPixelTerrainMap(level, canvas, 32);

    assert.equal(isPixelMapLevel(level), true);
    assert.equal(map.length, 19);
    assert.equal(map[0].length, 25);
    assert.equal(map[4][1], TERRAIN.street);
    assert.equal(map[14][18], TERRAIN.water);
});

test('getManhattanTileId numera de izquierda a derecha por filas', () => {
    assert.equal(getManhattanTileId(0, 0), 1);
    assert.equal(getManhattanTileId(24, 0), 25);
    assert.equal(getManhattanTileId(0, 1), 26);
    assert.equal(getManhattanTileId(24, 18), 475);
});

test('Manhattan manual conserva 25 por 19 cuadros', () => {
    assert.equal(MANHATTAN_MANUAL_ROWS.length, 19);
    assert.equal(MANHATTAN_MANUAL_ROWS.every((row) => row.length === 25), true);
    assert.equal(MANHATTAN_MANUAL_ROWS[0][0], 'water');
    assert.equal(MANHATTAN_MANUAL_ROWS[3][6], 'road-corner-down-right');
    assert.equal(MANHATTAN_MANUAL_ROWS[9][14], 'road-horizontal');
    assert.equal(MANHATTAN_MANUAL_ROWS[9][24], 'road-horizontal');
    assert.equal(MANHATTAN_MANUAL_ROWS[18][24], 'mountain');
});

test('Manhattan manual separa edificios bloqueados de montana colocable', () => {
    const level = { theme: { id: 'new-york' }, rendering: { style: 'pixelart', source: 'manual-grid', tileSize: 32 } };
    const canvas = { width: 800, height: 600 };
    const map = buildPixelTerrainMap(level, canvas, 32);

    assert.equal(map[0][0], TERRAIN.water);
    assert.equal(map[0][15], TERRAIN.blocked);
    assert.equal(map[14][12], TERRAIN.mountain);
    assert.notEqual(map[0][15], map[14][12]);
});
