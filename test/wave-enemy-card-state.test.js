import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWaveEnemyCardModel } from '../src/ui/WaveEnemyCardState.js';

test('buildWaveEnemyCardModel resume tarjeta compacta de enemigo', () => {
    const model = buildWaveEnemyCardModel(
        {
            name: 'Científico A.I.M.',
            category: 'Tecnológico',
            previewCount: 3,
            stealth: true,
            visual: { portrait: 'assets/images/enemies/aim_scientist/portrait.png' },
            affix: { label: 'Elite' }
        },
        {
            name: 'Científico A.I.M.',
            roleLabel: 'Soporte',
            counter: 'Foco al soporte',
            counterDetail: 'Eliminalo antes de que cure.',
            danger: 'guarded',
            pips: '!!',
            threat: 3,
            initial: 'C'
        },
        { visible: ['Cura', 'Blindaje'], overflow: 1, title: 'Cura, Blindaje, Aura' }
    );

    assert.equal(model.color, '#40c9ff');
    assert.equal(model.countLabel, 'x3');
    assert.equal(model.roleLine, 'Soporte | !!');
    assert.deepEqual(model.traits, ['Cura', 'Blindaje', '+1']);
    assert.equal(model.metaLine, 'Elite · Sigilo · ◆◆◆');
    assert.match(model.ariaLabel, /Respuesta: Foco al soporte/);
});
