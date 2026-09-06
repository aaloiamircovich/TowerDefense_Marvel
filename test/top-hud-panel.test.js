import test from 'node:test';
import assert from 'node:assert/strict';
import { TopHudPanel } from '../src/ui/TopHudPanel.js';
import { buildBossCountdownState, buildWaveLaunchState, formatHudResource } from '../src/systems/UIManager.js';

function createClassListStub() {
    const classes = new Set();
    return {
        classes,
        add(className) { classes.add(className); },
        remove(className) { classes.delete(className); },
        toggle(className, active) {
            if (active) classes.add(className);
            else classes.delete(className);
        },
        contains(className) { return classes.has(className); }
    };
}

function createElementStub() {
    const element = {
        innerHTML: '',
        textContent: '',
        className: '',
        title: '',
        disabled: false,
        dataset: {},
        attributes: {},
        children: [],
        classList: createClassListStub(),
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
        removeAttribute(name) {
            delete this[name];
        },
        replaceChildren(...children) {
            this.children = children;
        }
    };
    return element;
}

function createPanel(uiOverrides = {}) {
    const ui = {
        game: { gameSpeed: 1, waveManager: { maxWaves: 100, autoWave: false } },
        nextWaveSummary: null,
        shouldShowFps: () => true,
        renderOnboardingCoach: () => {},
        showToast: () => {},
        ...uiOverrides
    };
    return new TopHudPanel(ui, {
        buildBossCountdownState,
        buildWaveLaunchState,
        formatHudResource
    });
}

test('TopHudPanel actualiza recursos compactos, FPS y cuenta de boss', () => {
    const livesEl = createElementStub();
    const creditsEl = createElementStub();
    const waveEl = createElementStub();
    const fpsEl = createElementStub();
    const starsEl = createElementStub();
    const bossCountdownEl = createElementStub();
    const panel = createPanel({
        livesEl,
        creditsEl,
        waveEl,
        fpsEl,
        starsEl,
        bossCountdownEl
    });

    const state = panel.updateUI(18, 12500, 96, 59.4, Number.POSITIVE_INFINITY);

    assert.equal(livesEl.textContent, 18);
    assert.equal(creditsEl.textContent, '12.5k');
    assert.equal(creditsEl.dataset.value, '12500');
    assert.equal(creditsEl.title, '12500');
    assert.equal(waveEl.textContent, 96);
    assert.equal(fpsEl.textContent, '59 FPS');
    assert.equal(starsEl.textContent, '∞');
    assert.equal(starsEl.title, 'Recursos infinitos');
    assert.equal(state.bossState.label, 'Final');
    assert.equal(state.bossState.detail, '4 oleadas');
    assert.match(bossCountdownEl.innerHTML, /Final/);
});

test('TopHudPanel renderiza CTA de oleada con estado tactico', () => {
    const previousDocument = globalThis.document;
    const nextWaveButton = createElementStub();
    let coachRenders = 0;
    globalThis.document = {
        getElementById: (id) => id === 'next-wave-btn' ? nextWaveButton : null,
        createElement: (tagName) => ({ tagName, textContent: '' })
    };
    const panel = createPanel({
        renderOnboardingCoach: () => { coachRenders += 1; }
    });

    try {
        const state = panel.setNextWaveEnabled(true, {
            pressureScore: 28,
            bossMilestone: { label: 'Mini boss 1/3', warning: 'Si el boss llega a la base, pierdes la run.' },
            threatTier: { id: 'critical', label: 'Amenaza critica', advice: 'Invierte antes de iniciar.' }
        });

        assert.equal(state.primary, 'ENFRENTAR BOSS');
        assert.equal(nextWaveButton.disabled, false);
        assert.equal(nextWaveButton.className, 'btn-primary next-wave-cta threat-critical');
        assert.equal(nextWaveButton.dataset.threatTier, 'critical');
        assert.equal(nextWaveButton.title, 'Si el boss llega a la base, pierdes la run.');
        assert.equal(nextWaveButton.attributes['aria-label'], 'ENFRENTAR BOSS. Mini boss 1/3 · Amenaza critica. Puntaje 28. Si el boss llega a la base, pierdes la run.');
        assert.deepEqual(nextWaveButton.children.map((child) => child.textContent), ['ENFRENTAR BOSS', 'Mini boss 1/3 · Amenaza critica · 28']);
        assert.equal(coachRenders, 1);
    } finally {
        globalThis.document = previousDocument;
    }
});
