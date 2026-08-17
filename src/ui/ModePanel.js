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
            <div class="draft-choice">
                <span class="briefing-kicker">DRAFT HEROICO</span>
                <h2>Elige un refuerzo</h2>
                <div>${heroes.map((hero) => `<button data-draft="${escapeHtml(hero.id)}">${this.ui.renderSprite(this.ui.getHeroDisplaySprite(hero), hero.name)}<strong>${escapeHtml(hero.name)}</strong><small>${escapeHtml(hero.niche || hero.ability)}</small></button>`).join('')}</div>
            </div>
        `;
        this.ui.panelContent.querySelectorAll('[data-draft]').forEach((button) => button.addEventListener('click', () => onChoose(button.dataset.draft)));
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
}
