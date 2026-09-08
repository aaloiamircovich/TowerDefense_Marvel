import test from 'node:test';
import assert from 'node:assert/strict';
import { TERRAIN } from '../src/utils/TerrainRules.js';
import { getEnemyRoleText, getResistanceText, getTerrainText } from '../src/ui/UnitInfoText.js';

test('UnitInfoText normaliza terrenos, roles y resistencias visibles', () => {
    assert.equal(getTerrainText([TERRAIN.grass, TERRAIN.mountain]), 'Pasto, Montaña');
    assert.equal(getEnemyRoleText('runner'), 'Corredor');
    assert.equal(getEnemyRoleText('unknown', true), 'Jefe');
    assert.equal(getResistanceText({
        resistances: { energy: 0.25, physical: 0 },
        statusResistance: 0.3,
        stealth: true
    }), 'energy 25%, Estados 30%, Detección requerida');
    assert.equal(getResistanceText({}), 'Ninguna');
});
