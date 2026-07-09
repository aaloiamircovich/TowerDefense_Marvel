import test from 'node:test';
import assert from 'node:assert/strict';
import {
    canPlaceOnTerrain,
    getAllowedTerrainLabels,
    getPlacementTerrain,
    getPlacementTerrainLabel,
    isBlockedPlacementTerrain,
    TERRAIN
} from '../src/utils/TerrainRules.js';

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
