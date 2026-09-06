import test from 'node:test';
import assert from 'node:assert/strict';
import { ThreatHudPanel } from '../src/ui/ThreatHudPanel.js';
import { buildBossHudState, buildSpawnQueueState } from '../src/systems/UIManager.js';

function createElementStub() {
    return {
        innerHTML: '',
        className: '',
        attributes: {},
        classList: {
            values: new Set(),
            add(value) { this.values.add(value); },
            contains(value) { return this.values.has(value); }
        },
        setAttribute(name, value) {
            this.attributes[name] = value;
        }
    };
}

test('ThreatHudPanel renderiza boss activo y oculta cuando no hay amenaza', () => {
    const previousDocument = globalThis.document;
    const bossHud = createElementStub();
    globalThis.document = { getElementById: (id) => id === 'boss-hud' ? bossHud : null };
    const panel = new ThreatHudPanel({ buildBossHudState, buildSpawnQueueState });

    try {
        const state = panel.updateBoss([{ name: 'Loki', isBoss: true, isAlive: true, hp: 240, maxHp: 1000, currentPhase: 'Ilusiones', threat: 5 }], true);
        assert.equal(state.name, 'Loki');
        assert.match(bossHud.className, /boss-hud critical/);
        assert.match(bossHud.innerHTML, /Jefe activo/);
        assert.match(bossHud.innerHTML, /Ilusiones/);
        assert.equal(bossHud.attributes['aria-label'], 'Loki. Ilusiones. Salud 24 por ciento.');

        assert.equal(panel.updateBoss([], true), null);
        assert.equal(bossHud.classList.contains('hidden'), true);
        assert.equal(bossHud.innerHTML, '');
    } finally {
        globalThis.document = previousDocument;
    }
});

test('ThreatHudPanel renderiza cola de refuerzos con ETA y peligro', () => {
    const previousDocument = globalThis.document;
    const spawnQueue = createElementStub();
    globalThis.document = { getElementById: (id) => id === 'spawn-queue' ? spawnQueue : null };
    const panel = new ThreatHudPanel({ buildBossHudState, buildSpawnQueueState });

    try {
        const state = panel.updateSpawnQueue([
            { config: { name: 'Centinela', threat: 5 }, delay: 1.6 },
            { config: { name: 'Hydra', threat: 2 }, delay: 0.8 }
        ], 0.4, true);

        assert.equal(state.name, 'Centinela');
        assert.equal(state.eta, 1.2);
        assert.match(spawnQueue.className, /spawn-queue critical/);
        assert.match(spawnQueue.innerHTML, /Centinela/);
        assert.match(spawnQueue.innerHTML, /1\.2s \| 2 pendientes/);
        assert.equal(spawnQueue.attributes['aria-label'], 'Proximo refuerzo Centinela en 1.2 segundos. Quedan 2.');
    } finally {
        globalThis.document = previousDocument;
    }
});
