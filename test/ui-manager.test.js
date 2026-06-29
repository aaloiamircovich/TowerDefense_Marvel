import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWaveLaunchState } from '../src/systems/UIManager.js';

test('buildWaveLaunchState muestra riesgo critico en el CTA', () => {
    const state = buildWaveLaunchState(true, {
        pressureScore: 29,
        threatTier: { id: 'critical', label: 'Amenaza critica', advice: 'Invierte antes de iniciar.' }
    });

    assert.equal(state.tier, 'critical');
    assert.equal(state.primary, 'INICIAR CON RIESGO');
    assert.equal(state.secondary, 'Amenaza critica · 29');
    assert.match(state.ariaLabel, /Puntaje 29/);
    assert.equal(state.tooltip, 'Invierte antes de iniciar.');
});

test('buildWaveLaunchState diferencia amenaza alta de una oleada normal', () => {
    const high = buildWaveLaunchState(true, {
        pressureScore: 20,
        threatTier: { id: 'high', label: 'Amenaza alta', advice: 'Refuerza dano o control.' }
    });
    const low = buildWaveLaunchState(true, null);

    assert.equal(high.primary, 'INICIAR ALERTA');
    assert.equal(low.primary, 'INICIAR OLEADA');
    assert.equal(low.secondary, 'Amenaza baja · 0');
});

test('buildWaveLaunchState bloquea lectura cuando la oleada esta activa', () => {
    const state = buildWaveLaunchState(false, {
        pressureScore: 99,
        threatTier: { id: 'critical', label: 'Amenaza critica', advice: 'No importa durante oleada.' }
    });

    assert.equal(state.tier, 'active');
    assert.equal(state.primary, 'OLEADA EN CURSO');
    assert.equal(state.secondary, 'Defensa activa');
});
