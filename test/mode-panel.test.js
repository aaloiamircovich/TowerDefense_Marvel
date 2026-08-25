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
    assert.match(view.html, /id="extract-mode" class="btn-mode-action" type="button" aria-label="Extraer recompensa del modo" title="Extraer recompensa del modo" data-tooltip="Extraer recompensa del modo"/);
    assert.match(view.html, /id="repair-mode" class="btn-mode-action" type="button" aria-label="Reparar convoy por 120 creditos" title="Reparar convoy por 120 creditos" data-tooltip="Reparar convoy por 120 creditos"/);
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

test('ModePanel renderiza draft heroico con rareza, sprite y metricas', () => {
    const draftButton = createButtonStub();
    draftButton.dataset = { draft: 'storm' };
    const calls = [];
    const choices = [];
    const ui = {
        panelContent: {
            innerHTML: '',
            querySelectorAll(selector) {
                calls.push(`query:${selector}`);
                return [draftButton];
            },
            querySelector(selector) {
                calls.push(`query-one:${selector}`);
                return selector === '[data-draft]' ? draftButton : null;
            }
        },
        showPanelOverlay(value) {
            calls.push(`overlay:${value}`);
        },
        renderSprite(src, name) {
            return `<img src="${src}" alt="${name}">`;
        },
        getHeroDisplaySprite(hero) {
            return `${hero.id}.png`;
        }
    };

    new ModePanel(ui).showDraftChoice([{
        id: 'storm',
        name: 'Storm',
        rarity: 'Epic',
        category: 'Mutante',
        niche: 'zonas climaticas',
        teamMetrics: { damage: 3, control: 5, support: 1, detection: 0 }
    }], (heroId) => choices.push(heroId));

    assert.match(ui.panelContent.innerHTML, /draft-choice-grid/);
    assert.match(ui.panelContent.innerHTML, /draft-card rarity-epic/);
    assert.match(ui.panelContent.innerHTML, /type="button" data-draft="storm" data-rarity="Epic" aria-label="Elegir Storm como refuerzo 1\. Rareza Epic\. Control 5, Daño 3" title="Elegir Storm como refuerzo 1\. Rareza Epic\. Control 5, Daño 3" data-tooltip="Elegir Storm como refuerzo 1\. Rareza Epic\. Control 5, Daño 3"/);
    assert.match(ui.panelContent.innerHTML, /rarity-badge rarity-epic/);
    assert.match(ui.panelContent.innerHTML, /draft-stat-strip/);
    assert.match(ui.panelContent.innerHTML, /Reclutar/);
    assert.ok(calls.includes('overlay:false'));
    assert.ok(calls.includes('query:[data-draft]'));
    assert.ok(calls.includes('query-one:[data-draft]'));
    assert.equal(draftButton.focused, true);

    draftButton.listeners.click();
    assert.deepEqual(choices, ['storm']);
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
        assert.match(ui.panelContent.innerHTML, /Lectura de modo/);
        assert.match(ui.panelContent.innerHTML, /760 pts faltantes/);
        assert.match(ui.panelContent.innerHTML, /Preparar oleada 10/);
        assert.match(ui.panelContent.innerHTML, /id="mode-result-map" type="button" aria-label="Volver a modos" title="Volver a modos" data-tooltip="Volver a modos"/);
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
        focused: false,
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        },
        focus() {
            this.focused = true;
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
