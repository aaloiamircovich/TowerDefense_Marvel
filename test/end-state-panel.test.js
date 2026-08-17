import test from 'node:test';
import assert from 'node:assert/strict';
import { EndStatePanel } from '../src/ui/EndStatePanel.js';

test('EndStatePanel renderiza derrota y reintenta sin resetear progreso externo', () => {
    const previousDocument = globalThis.document;
    const retryButton = createButtonStub();
    globalThis.document = {
        getElementById(id) {
            return id === 'retry-run' ? retryButton : null;
        }
    };

    const calls = [];
    const ui = createUiStub(calls);
    ui.game.waveManager.currentWave = 25;

    try {
        new EndStatePanel(ui).showGameOver();

        assert.match(ui.panelContent.innerHTML, /OPERACION FALLIDA/);
        assert.match(ui.panelContent.innerHTML, /Base destruida/);
        assert.match(ui.panelContent.innerHTML, /end-state-readout/);
        assert.match(ui.panelContent.innerHTML, /Mapa actual/);
        assert.match(ui.panelContent.innerHTML, /Informe de mision/);
        assert.match(ui.panelContent.innerHTML, /mission-summary-grid/);
        assert.match(ui.panelContent.innerHTML, /Black Widow/);
        assert.match(ui.panelContent.innerHTML, /Plan de recuperacion/);
        assert.match(ui.panelContent.innerHTML, /Mejorar Black Widow/);

        retryButton.listeners.click();

        assert.ok(calls.includes('retry-campaign'));
        assert.ok(calls.includes('roster:1'));
        assert.ok(calls.includes('close'));
        assert.ok(calls.includes('start'));
    } finally {
        globalThis.document = previousDocument;
    }
});

test('EndStatePanel renderiza victoria y error fatal con acciones principales', () => {
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    const victoryButton = createButtonStub();
    const reloadButton = createButtonStub();
    const closeButton = createCloseButtonStub();
    const errorCopy = createNodeStub();
    const calls = [];
    globalThis.document = {
        getElementById(id) {
            return {
                'victory-close': victoryButton,
                'reload-game': reloadButton,
                'close-panel-btn': closeButton,
                'fatal-error-copy': errorCopy
            }[id] || null;
        }
    };
    globalThis.window = {
        location: {
            reload() {
                calls.push('reload');
            }
        }
    };

    const ui = createUiStub(calls);
    ui.game.stars = 47;
    const panel = new EndStatePanel(ui);

    try {
        panel.showVictory();

        assert.match(ui.panelContent.innerHTML, /OPERACION COMPLETADA/);
        assert.match(ui.panelContent.innerHTML, /47 estrellas/);
        assert.match(ui.panelContent.innerHTML, /Mejor unidad/);
        assert.match(ui.panelContent.innerHTML, /Siguiente objetivo/);
        assert.match(ui.panelContent.innerHTML, /Buscar mas estrellas/);

        victoryButton.listeners.click();
        assert.equal(closeButton.removedClass, 'hidden');
        assert.ok(calls.includes('close'));

        panel.showFatalError(new Error('Datos corruptos'));

        assert.match(ui.panelContent.innerHTML, /ERROR DE INICIO/);
        assert.equal(errorCopy.textContent, 'Datos corruptos');

        reloadButton.listeners.click();
        assert.ok(calls.includes('reload'));
    } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
    }
});

function createUiStub(calls) {
    return {
        panelContent: { innerHTML: '' },
        game: {
            activeTeam: [{ id: 'black_widow' }],
            stars: 0,
            progression: {
                state: {
                    lastMissionSummary: {
                        totals: { damage: 12345, kills: 67, abilities: 8, credits: 910 },
                        bestHero: 'Black Widow',
                        lives: 18
                    }
                }
            },
            waveManager: { currentWave: 1 },
            modeSystem: { getSnapshot: () => null },
            inputManager: {
                setPlacementMode(hero) {
                    calls.push(`place:${hero.id}`);
                }
            },
            retryCampaignFromFirstWave() {
                calls.push('retry-campaign');
            },
            start() {
                calls.push('start');
            },
            pause() {
                calls.push('pause');
            }
        },
        showPanelOverlay(value) {
            calls.push(`overlay:${value}`);
        },
        renderHeroRoster(team) {
            calls.push(`roster:${team.length}`);
        },
        closePanel() {
            calls.push('close');
        },
        showModeResult(title) {
            calls.push(`mode-result:${title}`);
        }
    };
}

function createButtonStub() {
    return {
        listeners: {},
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        }
    };
}

function createNodeStub() {
    return { textContent: '' };
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
