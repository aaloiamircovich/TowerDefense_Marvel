import test from 'node:test';
import assert from 'node:assert/strict';
import { RadarPanel } from '../src/ui/RadarPanel.js';

test('RadarPanel centraliza secciones tacticas y delega acciones interactivas', () => {
    const previousDocument = globalThis.document;
    const sources = createRadarSources();
    globalThis.document = {
        getElementById(id) {
            return sources[id] || null;
        }
    };

    const deployButton = createButtonStub({ prepAction: 'deploy', heroId: 'iron_man' });
    const upgradeButton = createButtonStub({ prepAction: 'upgrade', heroId: 'spider_man' });
    const branchButton = createButtonStub({ branch: 'ambush' });
    const waveReportAction = createButtonStub({});
    const panelContent = createPanelContentStub({
        '[data-prep-action]': [deployButton, upgradeButton],
        '[data-branch]': [branchButton],
        '#wave-report-action': waveReportAction
    });

    const calls = [];
    const ui = {
        panelContent,
        lastWaveReport: { wave: 7 },
        game: {
            activeTeam: [{ id: 'iron_man', name: 'Iron Man' }],
            heroes: [{ id: 'captain_america', level: 12 }],
            resourceManager: { credits: 900 },
            currentLevel: { theme: { label: 'Base de los Vengadores' } },
            waveManager: {
                currentWave: 7,
                chooseBranch(branch) {
                    calls.push(`branch:${branch}`);
                    return true;
                }
            },
            inputManager: {
                setPlacementMode(hero) {
                    calls.push(`place:${hero.id}`);
                }
            },
            audio: {
                play(sound) {
                    calls.push(`audio:${sound}`);
                }
            },
            modeSystem: {
                extract() {
                    calls.push('extract');
                },
                repair() {
                    calls.push('repair');
                }
            }
        },
        closePanel() {
            calls.push('close');
        },
        showToast(message, type) {
            calls.push(`toast:${type}:${message}`);
        },
        quickUpgradeHeroById(heroId) {
            calls.push(`upgrade:${heroId}`);
            return true;
        },
        renderHeroRoster(team) {
            calls.push(`roster:${team.length}`);
        },
        calculateLevelCost(level, amount) {
            calls.push(`cost:${level}:${amount}`);
            return 320;
        }
    };

    const panel = new RadarPanel(ui, {
        buildWaveReportState: (report) => ({ wave: report.wave }),
        buildWaveReportActionState: () => ({ heroId: 'captain_america' })
    });

    try {
        panel.render('Radar tactico');

        assert.match(panelContent.innerHTML, /Base de los Vengadores/);
        assert.match(panelContent.innerHTML, /Informe listo/);
        assert.match(panelContent.innerHTML, /Selecciona una carta/);
        assert.match(panelContent.innerHTML, /radar-priority-strip/);
        assert.match(panelContent.innerHTML, /Activos/);
        assert.match(panelContent.innerHTML, /4\/7/);
        assert.match(panelContent.innerHTML, /Prioridad/);
        assert.match(panelContent.innerHTML, /Inteligencia de oleada/);
        assert.match(panelContent.innerHTML, /radar-section-state/);
        assert.match(panelContent.innerHTML, /Activo/);
        assert.match(panelContent.innerHTML, /Sin lectura/);
        assert.doesNotMatch(panelContent.innerHTML, /panel derecho/);

        deployButton.listeners.click();
        upgradeButton.listeners.click();
        branchButton.listeners.click();
        waveReportAction.listeners.click();

        assert.ok(calls.includes('close'));
        assert.ok(calls.includes('place:iron_man'));
        assert.ok(calls.includes('upgrade:spider_man'));
        assert.ok(calls.includes('branch:ambush'));
        assert.ok(calls.includes('roster:1'));
        assert.ok(calls.includes('upgrade:captain_america'));
    } finally {
        globalThis.document = previousDocument;
    }
});

function createRadarSources() {
    return {
        'wave-intel': createSource('<div id="wave-intel-content">Informe listo</div>'),
        'mission-status': createSource('', false),
        'mode-status': createSource('<button id="extract-mode">Extraer</button><button id="repair-mode">Reparar</button>'),
        'spawn-queue': createSource('<button data-branch="ambush">Emboscada</button>'),
        'boss-hud': createSource('', true),
        'wave-report': createSource('<button id="wave-report-action">Mejorar</button>'),
        'enemy-info-panel': createSource('<div id="enemy-info-content" class="hidden">Selecciona enemigo</div>', false, false)
    };
}

function createSource(innerHTML, hidden = false, hasVisibleEnemyInfo = true) {
    return {
        innerHTML,
        classList: {
            contains(className) {
                return className === 'hidden' && hidden;
            }
        },
        querySelector(selector) {
            if (selector === '#enemy-info-content:not(.hidden)') return hasVisibleEnemyInfo ? {} : null;
            return null;
        }
    };
}

function createPanelContentStub(elementsBySelector) {
    return {
        innerHTML: '',
        querySelectorAll(selector) {
            return elementsBySelector[selector] || [];
        },
        querySelector(selector) {
            return elementsBySelector[selector] || null;
        }
    };
}

function createButtonStub(dataset) {
    return {
        dataset,
        listeners: {},
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        }
    };
}
