import test from 'node:test';
import assert from 'node:assert/strict';
import { ModePanel, buildModeStatusView } from '../src/ui/ModePanel.js';

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

test('ModePanel renderiza resultado especial con lectura tactica compacta', () => {
    const previousDocument = globalThis.document;
    const resultButton = createButtonStub();
    const closeButton = createCloseButtonStub();
    const calls = [];
    globalThis.document = {
        getElementById(id) {
            return {
                'mode-result-map': resultButton,
                'close-panel-btn': closeButton
            }[id] || null;
        }
    };

    const ui = {
        panelContent: { innerHTML: '' },
        game: { progression: { state: { lastMissionSummary: { bestHero: 'Storm' } } } },
        showPanelOverlay(value) {
            calls.push(`overlay:${value}`);
        },
        renderMissionSummary(summary) {
            calls.push(`summary:${summary.bestHero}`);
            return '<div class="mission-summary mission-summary-upgraded"><div class="mission-summary-grid"></div></div>';
        },
        renderMap(title) {
            calls.push(`map:${title}`);
        }
    };

    try {
        new ModePanel(ui).showResult('Extraccion completada', {
            score: 1240,
            wave: 9,
            best: 2000,
            detail: 'Operacion cerrada'
        });

        assert.match(ui.panelContent.innerHTML, /MODO ESPECIAL/);
        assert.match(ui.panelContent.innerHTML, /end-state-readout/);
        assert.match(ui.panelContent.innerHTML, /1\.240/);
        assert.ok(calls.includes('summary:Storm'));

        resultButton.listeners.click();
        assert.equal(closeButton.removedClass, 'hidden');
        assert.ok(calls.includes('map:Mapa y modos'));
    } finally {
        globalThis.document = previousDocument;
    }
});

function createButtonStub() {
    return {
        listeners: {},
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        }
    };
}

function createCloseButtonStub() {
    const button = {
        removedClass: null,
        classList: {
            remove(className) {
                button.removedClass = className;
            }
        }
    };
    return button;
}
