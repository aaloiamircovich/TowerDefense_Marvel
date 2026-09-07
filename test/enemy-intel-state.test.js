import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEnemyIntel, buildEnemyTraitPreview, getEnemyRoleLabel } from '../src/ui/EnemyIntelState.js';

test('EnemyIntelState resume boss final con peligro critico y counter fatal', () => {
    const intel = buildEnemyIntel({
        name: 'Thanos',
        isBoss: true,
        isFinalBoss: true,
        threat: 5,
        armor: 0.4
    });

    assert.equal(intel.danger, 'critical');
    assert.equal(intel.roleLabel, 'Jefe');
    assert.equal(intel.counter, 'DPS sostenido');
    assert.match(intel.counterDetail, /jefe final llega a la base pierdes/);
    assert.deepEqual(intel.traits.slice(0, 2), ['Jefe final', 'Jefe']);
});

test('EnemyIntelState prioriza counters tacticos para sigilo soporte y blindaje', () => {
    assert.equal(buildEnemyIntel({ archetype: 'stealth', stealth: true }).counterId, 'detection');
    assert.equal(buildEnemyIntel({ archetype: 'support', healPower: 0.08 }).counterId, 'focus');
    assert.equal(buildEnemyIntel({ archetype: 'tank', armor: 0.5 }).counterId, 'piercing');
});

test('EnemyIntelState compacta rasgos sin duplicar etiquetas', () => {
    const preview = buildEnemyTraitPreview(['Jefe', 'Barrera', 'Jefe', 'Blindaje'], 2);

    assert.deepEqual(preview.visible, ['Jefe', 'Barrera']);
    assert.equal(preview.overflow, 1);
    assert.equal(preview.title, 'Jefe, Barrera, Blindaje');
});

test('EnemyIntelState resuelve rol fallback de enemigos y bosses', () => {
    assert.equal(getEnemyRoleLabel('runner'), 'Corredor');
    assert.equal(getEnemyRoleLabel('mystery', true), 'Jefe');
    assert.equal(getEnemyRoleLabel('mystery', false), 'Soldado');
});
