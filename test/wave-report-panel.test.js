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
            remaining: 260,
            reason: 'Aprovecha <MVP>'
        })
    });

    try {
        const state = panel.render({ wave: 3 });
        assert.equal(state.label, 'Oleada asegurada');
        assert.equal(container.attributes.role, 'status');
        assert.equal(container.attributes['aria-live'], 'polite');
        assert.equal(container.attributes['aria-label'], 'Oleada asegurada. Sin fugas');
        assert.match(container.innerHTML, /Informe oleada 3/);
        assert.match(container.innerHTML, /wave-report-scoreline/);
        assert.match(container.innerHTML, /<details class="wave-report-details">/);
        assert.match(container.innerHTML, /Ver desglose/);
        assert.match(container.innerHTML, /2 lecturas/);
        assert.match(container.innerHTML, /wave-reward-strip/);
        assert.match(container.innerHTML, /wave-report-advice/);
        assert.match(container.innerHTML, /metric-safe/);
        assert.match(container.innerHTML, /\+\$320/);
        assert.match(container.innerHTML, /Objetivos/);
        assert.match(container.innerHTML, /Extras/);
        assert.match(container.innerHTML, /MVP/);
        assert.match(container.innerHTML, /Mejorar Iron Man/);
        assert.match(container.innerHTML, /id="wave-report-action" class="btn-mode-action" type="button" aria-label="Mejorar Iron Man por 240 creditos\. Aprovecha &lt;MVP&gt;" title="Mejorar Iron Man por 240 creditos\. Aprovecha &lt;MVP&gt;" data-tooltip="Mejorar Iron Man por 240 creditos\. Aprovecha &lt;MVP&gt;"/);
        assert.match(container.innerHTML, /Saldo tras mejora: \$260/);
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

test('WaveReportPanel desglosa ahorro cuando no alcanza para mejorar', () => {
    const panel = new WaveReportPanel({});
    const html = panel.renderAction({
        type: 'saving',
        label: 'Faltan $160',
        missing: 160,
        available: 80,
        cost: 240,
        reason: 'Guarda creditos'
    });

    assert.match(html, /Faltan \$160/);
    assert.match(html, /Disponible \$80 \/ coste \$240/);
});


test('WaveReportPanel abre desglose cuando hubo fugas o aporte tactico', () => {
    const panel = new WaveReportPanel({});
    const leakHtml = panel.renderDetailDrawer({
        ...buildReportState(),
        leaks: 2,
        leakIntel: {
            label: 'Fugas detectadas',
            items: [{ tone: 'boss', name: 'Ultron', detail: 'Cruzo la salida' }],
            overflow: 0
        }
    });
    const tacticalHtml = panel.renderDetailDrawer({
        ...buildReportState(),
        tacticalContribution: {
            active: true,
            score: 80,
            metrics: [{ id: 'control', icon: 'fa-hand-paper', value: 5, suffix: 's', label: 'Control' }],
            heroes: [{ name: 'Storm', detail: '5s control' }]
        }
    });

    assert.match(leakHtml, /<details class="wave-report-details" open>/);
    assert.match(leakHtml, /Ver fugas y recompensas/);
    assert.match(tacticalHtml, /<details class="wave-report-details" open>/);
    assert.match(tacticalHtml, /Ver aporte tactico/);
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
