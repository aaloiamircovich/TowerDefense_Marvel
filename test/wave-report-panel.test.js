import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveReportPanel } from '../src/ui/WaveReportPanel.js';

test('WaveReportPanel renderiza informe y delega mejora recomendada', () => {
    const previousDocument = globalThis.document;
    const container = createElementStub();
    const actionButton = createElementStub();
    globalThis.document = {
        getElementById(id) {
            if (id === 'wave-report') return container;
            if (id === 'wave-report-action' && container.innerHTML.includes('wave-report-action')) return actionButton;
            return null;
        }
    };

    let upgrades = 0;
    let onboardingRenders = 0;
    const ui = {
        game: {
            heroes: [{ id: 'iron_man', level: 2 }],
            resourceManager: { credits: 500 }
        },
        calculateLevelCost: () => 240,
        quickUpgradeHeroById(heroId) {
            upgrades += heroId === 'iron_man' ? 1 : 0;
            return true;
        },
        renderOnboardingCoach() {
            onboardingRenders++;
        },
        lastWaveReport: null
    };
    const panel = new WaveReportPanel(ui, {
        buildState: () => buildReportState(),
        buildAction: () => ({
            type: 'upgrade',
            heroId: 'iron_man',
            label: 'Mejorar Iron Man',
            cost: 240,
            reason: 'Aprovecha <MVP>'
        })
    });

    try {
        const state = panel.render({ wave: 3 });
        assert.equal(state.label, 'Oleada asegurada');
        assert.match(container.innerHTML, /Informe oleada 3/);
        assert.match(container.innerHTML, /wave-report-scoreline/);
        assert.match(container.innerHTML, /wave-reward-strip/);
        assert.match(container.innerHTML, /wave-report-advice/);
        assert.match(container.innerHTML, /metric-safe/);
        assert.match(container.innerHTML, /\+\$320/);
        assert.match(container.innerHTML, /Objetivos/);
        assert.match(container.innerHTML, /Extras/);
        assert.match(container.innerHTML, /MVP/);
        assert.match(container.innerHTML, /Mejorar Iron Man/);
        assert.match(container.innerHTML, /Aprovecha &lt;MVP&gt;/);

        actionButton.listeners.click();
        assert.equal(upgrades, 1);
        assert.equal(onboardingRenders, 2);

        panel.clear();
        assert.equal(container.innerHTML, '');
        assert.equal(ui.lastWaveReport, null);
    } finally {
        globalThis.document = previousDocument;
    }
});

function createElementStub() {
    return {
        innerHTML: '',
        className: '',
        attributes: {},
        listeners: {},
        classList: {
            add() {},
            remove() {}
        },
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        }
    };
}

function buildReportState() {
    return {
        wave: 3,
        tone: 'clean',
        label: 'Oleada asegurada',
        advice: 'Sin fugas',
        leaks: 0,
        kills: 12,
        damage: 1800,
        credits: 320,
        bounty: 260,
        cleanBonus: 36,
        metaReward: 14,
        bestHero: 'Iron Man',
        bestHeroKills: 7,
        bestHeroDamage: 1200,
        grade: { tone: 'strong', detail: 'Buen control', medal: 'A', score: 90, label: 'Control superior' },
        lesson: { tone: 'economy', label: 'Economia estable', detail: 'Ahorra' },
        leakIntel: { label: 'Sin fugas', items: [], overflow: 0 },
        tacticalContribution: { active: false, score: 0, metrics: [], heroes: [] }
    };
}
