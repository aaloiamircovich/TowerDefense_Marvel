function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

const RADAR_SECTION_DEFINITIONS = [
    {
        id: 'wave-intel',
        title: 'Inteligencia de oleada',
        icon: 'fa-satellite-dish',
        empty: 'La siguiente oleada aun no tiene lectura.',
        priority: 2
    },
    {
        id: 'mission-status',
        title: 'Estado de mision',
        icon: 'fa-flag',
        empty: 'Sin objetivos especiales activos.',
        priority: 6
    },
    {
        id: 'mode-status',
        title: 'Modo especial',
        icon: 'fa-layer-group',
        empty: 'Modo campana estandar.',
        priority: 5
    },
    {
        id: 'spawn-queue',
        title: 'Refuerzos en cola',
        icon: 'fa-person-running',
        empty: 'No hay refuerzos pendientes.',
        priority: 4
    },
    {
        id: 'boss-hud',
        title: 'Jefe activo',
        icon: 'fa-skull-crossbones',
        empty: 'No hay jefe activo.',
        priority: 1
    },
    {
        id: 'wave-report',
        title: 'Informe de oleada',
        icon: 'fa-chart-line',
        empty: 'Completa una oleada para generar informe.',
        priority: 3
    },
    {
        id: 'enemy-info-panel',
        title: 'Archivo enemigo',
        icon: 'fa-skull',
        empty: 'Selecciona una carta de enemigo para inspeccionarlo.',
        priority: 7
    }
];

export class RadarPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildWaveReportState = builders.buildWaveReportState;
        this.buildWaveReportActionState = builders.buildWaveReportActionState;
    }

    render(title = 'Radar tactico') {
        const wave = this.ui.game.waveManager?.currentWave || 1;
        const map = this.ui.game.currentLevel?.theme?.label || this.ui.game.currentLevel?.name || 'Mapa';
        const sectionModels = RADAR_SECTION_DEFINITIONS.map((definition) => this.buildSectionModel(definition));
        const activeSections = sectionModels.filter((section) => section.hasContent);
        const dormantSections = sectionModels.filter((section) => !section.hasContent);
        const priorityTitle = [...activeSections]
            .sort((a, b) => a.priority - b.priority)
            .at(0)?.title || 'Patrulla';
        const sections = [...activeSections]
            .sort((a, b) => a.priority - b.priority)
            .map((section) => this.renderSection(section))
            .join('');

        this.ui.panelContent.innerHTML = `
            <section class="radar-panel">
                <div class="radar-hero radar-hero-upgraded">
                    <div class="radar-hero-copy">
                        <span class="briefing-kicker">CONSOLA DE RADAR</span>
                        <h2>${escapeHtml(title)}</h2>
                        <p>Prioridades de combate, reportes de oleada y alertas activas del mapa.</p>
                    </div>
                    <div class="radar-readout">
                        <span><small>Mapa</small><b>${escapeHtml(map)}</b></span>
                        <span><small>Oleada</small><b>${wave}</b></span>
                        <span><small>Activos</small><b>${activeSections.length}/${sectionModels.length}</b></span>
                    </div>
                </div>
                <div class="radar-priority-strip">
                    <span><small>Prioridad</small><b>${escapeHtml(priorityTitle)}</b></span>
                    <span><small>Canales</small><b>${activeSections.length ? 'Lectura activa' : 'Sin alertas'}</b></span>
                </div>
                <div class="radar-grid">
                    ${sections}
                    ${this.renderDormantChannels(dormantSections)}
                </div>
            </section>
        `;
        this.bindActions();
    }

    buildSectionModel(definition) {
        const source = document.getElementById(definition.id);
        const hidden = source?.classList.contains('hidden');
        const content = source?.innerHTML?.trim();
        const isEmptyEnemyPanel = definition.id === 'enemy-info-panel'
            && !source?.querySelector('#enemy-info-content:not(.hidden)');
        const hasContent = Boolean(content) && !hidden && !isEmptyEnemyPanel;

        return {
            ...definition,
            content: hasContent ? content : '',
            hasContent,
            stateClass: hasContent ? 'active' : 'empty',
            stateLabel: hasContent ? 'Activo' : 'Sin lectura'
        };
    }

    renderSection(section) {
        return `
            <article class="radar-section radar-section-${escapeHtml(section.id)} ${section.stateClass}">
                <header>
                    <span>
                        <i class="fas ${escapeHtml(section.icon)}"></i>
                        <strong>${escapeHtml(section.title)}</strong>
                    </span>
                    <b class="radar-section-state">${escapeHtml(section.stateLabel)}</b>
                </header>
                <div class="radar-section-body">
                    ${section.hasContent ? section.content : `<p class="radar-empty">${escapeHtml(section.empty)}</p>`}
                </div>
            </article>
        `;
    }

    renderDormantChannels(sections) {
        if (!sections.length) return '';
        return `
            <article class="radar-section radar-section-dormant empty">
                <header>
                    <span>
                        <i class="fas fa-broadcast-tower"></i>
                        <strong>Canales en espera</strong>
                    </span>
                    <b class="radar-section-state">Sin lectura · ${sections.length}</b>
                </header>
                <div class="radar-dormant-grid">
                    ${sections
                        .sort((a, b) => a.priority - b.priority)
                        .map((section) => `
                            <span>
                                <b><i class="fas ${escapeHtml(section.icon)}"></i>${escapeHtml(section.title)}</b>
                                <small>${escapeHtml(section.empty)}</small>
                            </span>
                        `).join('')}
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
