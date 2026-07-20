import test from 'node:test';
import assert from 'node:assert/strict';
import { buildModeStatusView } from '../src/ui/ModePanel.js';

test('buildModeStatusView oculta el panel sin modo activo', () => {
    assert.equal(buildModeStatusView(null), null);
});

test('buildModeStatusView prioriza detalle de racha y acciones disponibles', () => {
    const view = buildModeStatusView({
        name: 'Supervivencia',
        detail: 'Extraccion disponible',
        streakDetail: 'Racha limpia x3',
        score: 1240,
        canExtract: true,
        canRepair: true
    });

    assert.equal(view.detail, 'Racha limpia x3');
    assert.match(view.html, /1240 pts/);
    assert.match(view.html, /id="extract-mode"/);
    assert.match(view.html, /id="repair-mode"/);
});

test('buildModeStatusView escapa texto dinamico de modo', () => {
    const view = buildModeStatusView({
        name: '<script>',
        detail: '<b>detalle</b>',
        score: 10
    });

    assert.match(view.html, /&lt;script&gt;/);
    assert.match(view.html, /&lt;b&gt;detalle&lt;\/b&gt;/);
});
