import test from 'node:test';
import assert from 'node:assert/strict';
import { MissionStatusPanel } from '../src/ui/MissionStatusPanel.js';

test('MissionStatusPanel renderiza objetivos y escapa texto dinamico', () => {
    const previousDocument = globalThis.document;
    const container = { innerHTML: '' };
    globalThis.document = { getElementById: (id) => id === 'mission-status' ? container : null };
    const panel = new MissionStatusPanel();

    try {
        panel.update({
            operation: 'Operación <Alpha>',
            mechanicLabel: 'Corte táctico',
            message: 'Controla <rutas> y aguanta.',
            blackout: 3,
            objectives: [
                { label: 'Oleadas <seguras>', value: 2, target: 5, complete: false },
                { label: 'Base intacta', value: 1, target: 1, complete: true }
            ]
        });

        assert.match(container.innerHTML, /Operación &lt;Alpha&gt;/);
        assert.match(container.innerHTML, /Controla &lt;rutas&gt; y aguanta\./);
        assert.match(container.innerHTML, /Corte: 3s/);
        assert.match(container.innerHTML, /2\/5 Oleadas &lt;seguras&gt;/);
        assert.match(container.innerHTML, /class="done">✓ Base intacta/);
    } finally {
        globalThis.document = previousDocument;
    }
});
