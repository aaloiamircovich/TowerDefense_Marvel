import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildLevelThemeState,
    buildPerformanceTitle,
    PerformanceThemeController,
    shouldShowFps
} from '../src/ui/PerformanceThemeController.js';

test('shouldShowFps lee el ajuste persistente de rendimiento', () => {
    assert.equal(shouldShowFps({ progression: { state: { settings: { showFps: true } } } }), true);
    assert.equal(shouldShowFps({ progression: { state: { settings: { showFps: false } } } }), false);
    assert.equal(shouldShowFps({}), false);
});

test('buildPerformanceTitle formatea telemetria de frame y pools', () => {
    assert.equal(
        buildPerformanceTitle({ averageMs: 12.345, p95Ms: 18.9, peakEntities: 44.2 }, { reused: 9.8 }),
        'Frame promedio 12.35 ms · p95 18.90 ms · pico 44 entidades · 10 proyectiles reutilizados'
    );
});

test('PerformanceThemeController actualiza FPS con alerta de p95', () => {
    const calls = [];
    const controller = new PerformanceThemeController({
        updateFpsDisplay: (...args) => calls.push(args)
    });

    controller.updatePerformance({ fps: 58.6, averageMs: 12.1, p95Ms: 20, peakEntities: 30 }, { reused: 4 });

    assert.equal(calls[0][0], '59 FPS');
    assert.equal(calls[0][1].warning, true);
    assert.match(calls[0][1].title, /p95 20\.00 ms/);
});

test('PerformanceThemeController aplica tema visual y musical del mapa', () => {
    const previousDocument = globalThis.document;
    const styleCalls = [];
    const audioCalls = [];
    globalThis.document = {
        documentElement: {
            style: {
                setProperty: (...args) => styleCalls.push(args)
            }
        }
    };
    const ui = {
        levelNameEl: { textContent: '' },
        operationTitleEl: { textContent: '' },
        game: { audio: { setTheme: (theme) => audioCalls.push(theme) } }
    };

    try {
        const state = new PerformanceThemeController(ui).updateLevelTheme({
            name: 'Base de los Vengadores',
            theme: { label: 'Avengers HQ', accent: '#fca311', id: 'avengers' }
        });

        assert.deepEqual(state, buildLevelThemeState({
            name: 'Base de los Vengadores',
            theme: { label: 'Avengers HQ', accent: '#fca311', id: 'avengers' }
        }));
        assert.equal(ui.levelNameEl.textContent, 'Avengers HQ');
        assert.equal(ui.operationTitleEl.textContent, 'Avengers HQ');
        assert.deepEqual(styleCalls, [['--level-accent', '#fca311']]);
        assert.deepEqual(audioCalls, ['avengers']);
    } finally {
        globalThis.document = previousDocument;
    }
});
