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
        buildState: (_report, previousReport) => ({
            ...buildReportState(),
            comparison: previousReport
                ? {
                    active: true,
                    label: `vs oleada ${previousReport.wave}`,
                    tone: 'up',
                    metrics: [{ id: 'kills', label: 'Bajas', value: '+4 KO', tone: 'up' }]
                }
                : { active: false, label: '', tone: 'same', metrics: [] }
        }),
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
        assert.equal(container.attributes['aria-label'], 'Oleada asegurada. Base intacta');
        assert.match(container.innerHTML, /Informe oleada 3/);
        assert.match(container.innerHTML, /wave-report-scoreline/);
        assert.match(container.innerHTML, /wave-report-quickline/);
        assert.match(container.innerHTML, /Resumen rapido de oleada/);
        assert.match(container.innerHTML, /Base[\s\S]*Intacta/);
        assert.match(container.innerHTML, /Combate[\s\S]*12 KO \| 1800 dano/);
        assert.match(container.innerHTML, /Recompensa[\s\S]*\+\$320/);
        assert.match(container.innerHTML, /Siguiente[\s\S]*Mejorar Iron Man \$240/);
        assert.doesNotMatch(container.innerHTML, /wave-report-grid/);
        assert.match(container.innerHTML, /<details class="wave-report-details">/);
        assert.match(container.innerHTML, /Ver desglose/);
        assert.match(container.innerHTML, /2 lecturas/);
        assert.match(container.innerHTML, /wave-reward-strip/);
        assert.match(container.innerHTML, /wave-report-advice/);
        assert.match(container.innerHTML, /\+\$320/);
        assert.match(container.innerHTML, /Progreso/);
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
        assert.equal(ui.previousWaveReport.wave, 3);
    } finally {
        globalThis.document = previousDocument;
    }
});

test('WaveReportPanel conserva base de comparacion entre oleadas', () => {
    const previousDocument = globalThis.document;
    const container = createElementStub();
    globalThis.document = {
        getElementById(id) {
            if (id === 'wave-report') return container;
            return null;
        }
    };

    const seenPrevious = [];
    const ui = {
        game: { heroes: [], resourceManager: { credits: 0 } },
        calculateLevelCost: () => 120,
        renderOnboardingCoach() {},
        lastWaveReport: null
    };
    const panel = new WaveReportPanel(ui, {
        buildState: (report, previousReport) => {
            seenPrevious.push(previousReport?.wave || 0);
            return {
                ...buildReportState(),
                wave: report.wave,
                comparison: previousReport
                    ? {
                        active: true,
                        label: `vs oleada ${previousReport.wave}`,
                        tone: 'up',
                        metrics: [{ id: 'kills', label: 'Bajas', value: '+2 KO', tone: 'up' }]
                    }
                    : { active: false, label: '', tone: 'same', metrics: [] }
            };
        },
        buildAction: () => null
    });

    try {
        const first = { wave: 4 };
        const second = { wave: 5 };
        panel.render(first);
        panel.clear();
        panel.render(second);
        panel.render(second);

        assert.deepEqual(seenPrevious, [0, 4, 4]);
        assert.match(container.innerHTML, /wave-report-comparison/);
        assert.match(container.innerHTML, /vs oleada 4/);
        assert.match(container.innerHTML, /Ver progreso/);
    } finally {
        globalThis.document = previousDocument;
    }
});

test('WaveReportPanel resume dano a base recompensa y accion en lectura rapida', () => {
    const panel = new WaveReportPanel({});
    const html = panel.renderQuickline(
        { leaks: 2, credits: 75 },
        { type: 'saving', label: 'Faltan <160>' }
    );

    assert.match(html, /wave-report-quickline/);
    assert.match(html, /quickline-danger/);
    assert.match(html, /-2 vida/);
    assert.match(html, /quickline-combat/);
    assert.match(html, /0 KO \| 0 dano/);
    assert.match(html, /quickline-reward/);
    assert.match(html, /\+\$75/);
    assert.match(html, /quickline-saving/);
    assert.match(html, /Faltan &lt;160&gt;/);
});

test('WaveReportPanel compacta numeros grandes del late game', () => {
    const panel = new WaveReportPanel({});
    const quickline = panel.renderQuickline(
        { leaks: 0, kills: 12500, damage: 2450000, credits: 1850000 },
        { type: 'stable', label: 'Preparar jefe final' }
    );
    const rewards = panel.renderRewardBreakdown({
        credits: 1850000,
        bounty: 1420000,
        metaReward: 12500
    });

    assert.match(quickline, /12\.5k KO \| 2\.5M dano/);
    assert.match(quickline, /\+\$1\.9M/);
    assert.match(rewards, /\+\$1\.9M/);
    assert.match(rewards, /\+\$1\.4M/);
    assert.match(rewards, /\+\$12\.5k/);
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
    assert.match(html, /wave-report-saving-meter/);
    assert.match(html, /Ahorro para mejora 33%/);
    assert.match(html, /style="width:33%"/);

    const cappedHtml = panel.renderAction({
        type: 'saving',
        label: 'Listo',
        missing: 0,
        available: 500,
        cost: 240,
        reason: 'Ya alcanza'
    });
    assert.match(cappedHtml, /Ahorro para mejora 100%/);
    assert.match(cappedHtml, /style="width:100%"/);
});


test('WaveReportPanel mantiene compacto el desglose salvo dano serio a base', () => {
    const panel = new WaveReportPanel({});
    const minorLeakHtml = panel.renderDetailDrawer({
        ...buildReportState(),
        leaks: 2,
        leakIntel: {
            label: 'Lectura de base',
            items: [{ tone: 'boss', name: 'Ultron', detail: 'Llego a la base' }],
            overflow: 0
        }
    });
    const seriousLeakHtml = panel.renderDetailDrawer({
        ...buildReportState(),
        leaks: 3,
        leakIntel: {
            label: 'Lectura de base',
            items: [{ tone: 'boss', name: 'Ultron', detail: 'Llego a la base' }],
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

    assert.match(minorLeakHtml, /<details class="wave-report-details">/);
    assert.match(minorLeakHtml, /Ver base y recompensas/);
    assert.match(seriousLeakHtml, /<details class="wave-report-details" open>/);
    assert.match(seriousLeakHtml, /Ver base y recompensas/);
    assert.match(tacticalHtml, /<details class="wave-report-details">/);
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
        advice: 'Base intacta',
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
        leakIntel: { label: 'Base intacta', items: [], overflow: 0 },
        tacticalContribution: { active: false, score: 0, metrics: [], heroes: [] },
        comparison: { active: false, label: '', tone: 'same', metrics: [] }
    };
}
