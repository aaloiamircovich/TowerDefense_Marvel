import { getRarityClass, normalizeRarity } from '../utils/Rarity.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatNumber(value = 0) {
    return Math.round(Number(value) || 0).toLocaleString('es-AR');
}

const DRAFT_METRIC_LABELS = {
    damage: { label: 'Daño', icon: 'fa-bolt' },
    control: { label: 'Control', icon: 'fa-hand' },
    support: { label: 'Soporte', icon: 'fa-shield-halved' },
    detection: { label: 'Radar', icon: 'fa-satellite-dish' }
};

export function buildModeStatusView(snapshot = null) {
    if (!snapshot) return null;
    const detail = snapshot.streakDetail || snapshot.detail || '';
    return {
        detail,
        html: `<div><strong>${escapeHtml(snapshot.name)}</strong><span>${escapeHtml(detail)}</span></div><b>${Math.round(snapshot.score || 0)} pts</b>${snapshot.canExtract ? '<button id="extract-mode" class="btn-mode-action">Extraer</button>' : ''}${snapshot.canRepair ? '<button id="repair-mode" class="btn-mode-action">Reparar +2 | $120</button>' : ''}`
    };
}

export class ModePanel {
    constructor(ui) {
        this.ui = ui;
    }

    updateStatus(snapshot) {
        const container = document.getElementById('mode-status');
        if (!container) return null;
        const view = buildModeStatusView(snapshot);
        if (!view) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return null;
        }

        container.classList.remove('hidden');
        container.innerHTML = view.html;
        document.getElementById('extract-mode')?.addEventListener('click', () => this.ui.game.modeSystem.extract());
        document.getElementById('repair-mode')?.addEventListener('click', () => this.ui.game.modeSystem.repair());
        return view;
    }

    showDraftChoice(heroes, onChoose) {
        this.ui.showPanelOverlay(false);
        this.ui.panelContent.innerHTML = `
            <section class="draft-choice draft-choice-upgraded">
                <div class="draft-choice-header">
                    <span class="briefing-kicker">DRAFT HEROICO</span>
                    <h2>Elige un refuerzo</h2>
                    <p>Sumá una pieza al escuadrón: priorizá cobertura, rareza o el counter que te falte.</p>
                </div>
                <div class="draft-choice-grid">
                    ${heroes.map((hero, index) => this.renderDraftCard(hero, index)).join('')}
                </div>
            </section>
        `;
        this.ui.panelContent.querySelectorAll('[data-draft]').forEach((button) => button.addEventListener('click', () => onChoose(button.dataset.draft)));
    }

    renderDraftCard(hero, index = 0) {
        const rarity = normalizeRarity(hero.rarity);
        const rarityClass = getRarityClass(rarity);
        const metrics = this.getDraftMetrics(hero);
        return `
            <button class="draft-card ${rarityClass}" data-draft="${escapeHtml(hero.id)}" data-rarity="${rarity}" aria-label="Elegir ${escapeHtml(hero.name)} como refuerzo ${index + 1}">
                <div class="draft-card-top">
                    <span class="draft-index">0${index + 1}</span>
                    <b class="rarity-badge ${rarityClass}">${rarity}</b>
                </div>
                <div class="draft-sprite-frame">
                    ${this.ui.renderSprite(this.ui.getHeroDisplaySprite(hero), hero.name)}
                </div>
                <div class="draft-card-copy">
                    <strong>${escapeHtml(hero.name)}</strong>
                    <small>${escapeHtml(hero.category || 'Héroe')} | ${escapeHtml(hero.niche || hero.ability || 'defensa equilibrada')}</small>
                </div>
                <div class="draft-stat-strip">
                    ${metrics.map((metric) => `
                        <span>
                            <i class="fas ${metric.icon}"></i>
                            <b>${metric.value}</b>
                            <small>${metric.label}</small>
                        </span>
                    `).join('')}
                </div>
                <span class="draft-pick-cue">Reclutar</span>
            </button>
        `;
    }

    getDraftMetrics(hero) {
        const metrics = hero.teamMetrics || {};
        const ranked = Object.entries(DRAFT_METRIC_LABELS)
            .map(([key, meta]) => ({ ...meta, value: Math.round(Number(metrics[key]) || 0) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 2);

        if (ranked.some((metric) => metric.value > 0)) return ranked;

        return [
            { ...DRAFT_METRIC_LABELS.damage, value: Math.max(1, Math.round((Number(hero.damage) || 0) / 10)) },
            { ...DRAFT_METRIC_LABELS.control, value: Math.max(1, Math.round((Number(hero.range) || 0) / 50)) }
        ];
    }

    showResult(title, snapshot) {
        this.ui.showPanelOverlay(false);
        const detail = snapshot.streakDetail || snapshot.detail || 'Operacion finalizada';
        this.ui.panelContent.innerHTML = `
            <div class="end-state end-state-mode">
                <div class="end-state-banner">
                    <div class="end-state-emblem"><i class="fas fa-flag-checkered"></i></div>
                    <div class="end-state-copy">
                        <span class="briefing-kicker">MODO ESPECIAL</span>
                        <h2>${escapeHtml(title)}</h2>
                        <p>${escapeHtml(detail)}</p>
                    </div>
                </div>
                <div class="end-state-readout">
                    <span><i class="fas fa-chart-line"></i><small>Puntos</small><b>${formatNumber(snapshot.score)}</b></span>
                    <span><i class="fas fa-signal"></i><small>Oleada</small><b>${formatNumber(snapshot.wave || 1)}</b></span>
                    <span><i class="fas fa-trophy"></i><small>Record</small><b>${formatNumber(snapshot.best)}</b></span>
                </div>
                ${this.ui.renderMissionSummary(this.ui.game.progression?.state.lastMissionSummary)}
                ${this.renderModeResultCoach(snapshot)}
                <div class="end-state-actions end-state-actions--compact">
                    <button class="btn-primary" id="mode-result-map">Volver a modos</button>
                </div>
            </div>
        `;
        document.getElementById('mode-result-map')?.addEventListener('click', () => {
            document.getElementById('close-panel-btn')?.classList.remove('hidden');
            this.ui.renderMap('Mapa y modos');
        });
    }

    renderModeResultCoach(snapshot = {}) {
        const score = Math.round(Number(snapshot.score) || 0);
        const best = Math.round(Number(snapshot.best) || 0);
        const remaining = Math.max(0, best - score);
        const wave = Math.max(1, Math.round(Number(snapshot.wave) || 1));
        const cards = [
            { icon: 'fa-trophy', label: 'Record', value: remaining ? `${formatNumber(remaining)} pts faltantes` : 'Marca superada' },
            { icon: 'fa-signal', label: 'Siguiente', value: `Preparar oleada ${formatNumber(wave + 1)}` },
            { icon: 'fa-map', label: 'Salida', value: 'Volver a modos' }
        ];
        return `
            <div class="end-state-coach mode">
                <strong>Lectura de modo</strong>
                <div>
                    ${cards.map((card) => `
                        <span>
                            <i class="fas ${card.icon}"></i>
                            <small>${escapeHtml(card.label)}</small>
                            <b>${escapeHtml(card.value)}</b>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
}
