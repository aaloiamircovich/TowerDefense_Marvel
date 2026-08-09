import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    canPlaceOnTerrain,
    getAllowedTerrainLabels,
    getPlacementTerrain,
    getPlacementTerrainLabel,
    isBlockedPlacementTerrain,
    TERRAIN
} from '../src/utils/TerrainRules.js';
import { buildPixelTerrainMap } from '../src/rendering/PixelMapRenderer.js';

const levels = JSON.parse(fs.readFileSync(new URL('../data/levels.json', import.meta.url), 'utf8'));

test('reglas de terreno distinguen agua, pasto, montana y bloqueados', () => {
    assert.equal(getPlacementTerrain(TERRAIN.sidewalk), TERRAIN.grass);
    assert.equal(getPlacementTerrain(TERRAIN.forest), TERRAIN.grass);
    assert.equal(getPlacementTerrainLabel(TERRAIN.water), 'Agua');
    assert.equal(getAllowedTerrainLabels([TERRAIN.water, TERRAIN.mountain]), 'Agua, Montaña');
    assert.equal(isBlockedPlacementTerrain(TERRAIN.path), true);
    assert.equal(isBlockedPlacementTerrain(TERRAIN.blocked), true);
});

test('canPlaceOnTerrain aplica afinidad del heroe sin permitir edificios ni camino', () => {
    const aquatic = { allowedTerrains: [TERRAIN.water] };
    const highGround = { allowedTerrains: [TERRAIN.mountain] };
    const ground = { allowedTerrains: [TERRAIN.grass] };

    assert.equal(canPlaceOnTerrain(aquatic, TERRAIN.water), true);
    assert.equal(canPlaceOnTerrain(aquatic, TERRAIN.grass), false);
    assert.equal(canPlaceOnTerrain(highGround, TERRAIN.mountain), true);
    assert.equal(canPlaceOnTerrain(highGround, TERRAIN.blocked), false);
    assert.equal(canPlaceOnTerrain(ground, TERRAIN.forest), true);
    assert.equal(canPlaceOnTerrain(ground, TERRAIN.path), false);
});

test('Base Avengers bloquea calle gris y permite pasto central', () => {
    const level = levels.find((entry) => entry.id === 'level_1');
    const map = buildPixelTerrainMap(level, { width: 800, height: 608 }, 32);
    const ground = { allowedTerrains: [TERRAIN.grass] };

    assert.equal(canPlaceOnTerrain(ground, map[5][6]), false);
    assert.equal(canPlaceOnTerrain(ground, map[4][9]), false);
    assert.equal(canPlaceOnTerrain(ground, map[5][9]), true);
    assert.equal(canPlaceOnTerrain(ground, map[12][9]), true);
    assert.equal(canPlaceOnTerrain(ground, map[16][3]), true);
});
