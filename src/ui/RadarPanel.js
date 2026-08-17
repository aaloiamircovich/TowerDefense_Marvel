function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export class RadarPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildWaveReportState = builders.buildWaveReportState;
        this.buildWaveReportActionState = builders.buildWaveReportActionState;
    }

    render(title = 'Radar tactico') {
        const wave = this.ui.game.waveManager?.currentWave || 1;
        const map = this.ui.game.currentLevel?.theme?.label || this.ui.game.currentLevel?.name || 'Mapa';
        const sections = [
            this.renderSection('wave-intel', 'Inteligencia de oleada', 'fa-satellite-dish', 'La siguiente oleada aun no tiene lectura.'),
            this.renderSection('mission-status', 'Estado de mision', 'fa-flag', 'Sin objetivos especiales activos.'),
            this.renderSection('mode-status', 'Modo especial', 'fa-layer-group', 'Modo campaña estándar.'),
            this.renderSection('spawn-queue', 'Refuerzos en cola', 'fa-person-running', 'No hay refuerzos pendientes.'),
            this.renderSection('boss-hud', 'Jefe activo', 'fa-skull-crossbones', 'No hay jefe activo.'),
            this.renderSection('wave-report', 'Informe de oleada', 'fa-chart-line', 'Completa una oleada para generar informe.'),
            this.renderSection('enemy-info-panel', 'Archivo enemigo', 'fa-skull', 'Selecciona una carta de enemigo en el panel derecho para inspeccionarlo.')
        ].join('');

        this.ui.panelContent.innerHTML = `
            <section class="radar-panel">
                <div class="radar-hero">
                    <div>
                        <span class="briefing-kicker">CONSOLA DE RADAR</span>
                        <h2>${escapeHtml(title)}</h2>
                        <p>Lecturas tacticas, ayudas, reportes y sistemas que antes ocupaban el panel derecho.</p>
                    </div>
                    <div class="radar-readout">
                        <span><small>Mapa</small><b>${escapeHtml(map)}</b></span>
                        <span><small>Oleada</small><b>${wave}</b></span>
                    </div>
                </div>
                <div class="radar-grid">
                    ${sections}
                </div>
            </section>
        `;
        this.bindActions();
    }

    renderSection(sourceId, title, icon, emptyMessage) {
        const source = document.getElementById(sourceId);
        const hidden = source?.classList.contains('hidden');
        const content = source?.innerHTML?.trim();
        const isEmptyEnemyPanel = sourceId === 'enemy-info-panel'
            && !source?.querySelector('#enemy-info-content:not(.hidden)');
        const hasContent = Boolean(content) && !hidden && !isEmptyEnemyPanel;

        return `
            <article class="radar-section radar-section-${sourceId}">
                <header>
                    <i class="fas ${icon}"></i>
                    <strong>${escapeHtml(title)}</strong>
                </header>
                <div class="radar-section-body">
                    ${hasContent ? content : `<p class="radar-empty">${escapeHtml(emptyMessage)}</p>`}
                </div>
            </article>
        `;
    }

    bindActions() {
        this.ui.panelContent.querySelectorAll('[data-prep-action]').forEach((button) => button.addEventListener('click', () => {
            const heroId = button.dataset.heroId;
            if (button.dataset.prepAction === 'deploy') {
                const hero = this.ui.game.activeTeam?.find((candidate) => candidate.id === heroId);
                if (!hero) return;
                this.ui.closePanel();
                this.ui.game.inputManager?.setPlacementMode(hero);
                this.ui.showToast(`${hero.name}: elige una posicion`, 'info');
                this.ui.game.audio?.play('ui');
            }
            if (button.dataset.prepAction === 'upgrade' && this.ui.quickUpgradeHeroById(heroId)) {
                this.render('Radar tactico');
            }
        }));
        this.ui.panelContent.querySelectorAll('[data-branch]').forEach((button) => button.addEventListener('click', () => {
            const changed = this.ui.game.waveManager?.chooseBranch(button.dataset.branch);
            if (changed) {
                this.ui.renderHeroRoster(this.ui.game.activeTeam, (hero) => this.ui.game.inputManager.setPlacementMode(hero));
                this.render('Radar tactico');
            }
            this.ui.game.audio?.play('ui');
        }));
        this.ui.panelContent.querySelector('#wave-report-action')?.addEventListener('click', () => {
            const report = this.ui.lastWaveReport;
            if (!report || !this.buildWaveReportState || !this.buildWaveReportActionState) return;
            const action = this.buildWaveReportActionState(
                this.buildWaveReportState(report),
                this.ui.game.heroes || [],
                this.ui.game.resourceManager?.credits || 0,
                (level, amount) => this.ui.calculateLevelCost(level, amount)
            );
            if (action?.heroId && this.ui.quickUpgradeHeroById(action.heroId)) this.render('Radar tactico');
        });
        this.ui.panelContent.querySelector('#extract-mode')?.addEventListener('click', () => this.ui.game.modeSystem.extract());
        this.ui.panelContent.querySelector('#repair-mode')?.addEventListener('click', () => this.ui.game.modeSystem.repair());
    }
}
