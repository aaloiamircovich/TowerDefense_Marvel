function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

export class WaveReportPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildState = builders.buildState;
        this.buildAction = builders.buildAction;
    }

    clear() {
        const container = document.getElementById('wave-report');
        this.ui.lastWaveReport = null;
        if (!container) return;
        container.classList.add('hidden');
        container.innerHTML = '';
        this.ui.renderOnboardingCoach();
    }

    render(report) {
        const container = document.getElementById('wave-report');
        if (!container) return null;

        const state = this.buildState(report);
        const action = this.buildAction(
            state,
            this.ui.game.heroes || [],
            this.ui.game.resourceManager?.credits || 0,
            (level, amount) => this.ui.calculateLevelCost(level, amount)
        );
        this.ui.lastWaveReport = report;

        container.className = `wave-report report-${state.tone}`;
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-label', `${state.label}. ${state.advice}`);
        container.innerHTML = this.renderMarkup(state, action);
        document.getElementById('wave-report-action')?.addEventListener('click', () => {
            if (this.ui.quickUpgradeHeroById(action.heroId)) this.render(this.ui.lastWaveReport);
        });
        this.ui.renderOnboardingCoach();
        return state;
    }

    renderMarkup(state, action) {
        return `
            <div class="wave-report-heading">
                <div>
                    <span>Informe oleada ${escapeHtml(state.wave)}</span>
                    <strong>${escapeHtml(state.label)}</strong>
                </div>
                <b class="wave-report-grade grade-${escapeHtml(state.grade.tone)}" title="${escapeHtml(state.grade.detail)}">
                    <em>${escapeHtml(state.grade.medal)}</em>
                    <small>${escapeHtml(state.grade.score)}</small>
                </b>
            </div>
            ${this.renderQuickline(state, action)}
            <div class="wave-report-scoreline">
                <div class="wave-report-rating grade-${escapeHtml(state.grade.tone)}" aria-label="${escapeHtml(state.grade.label)}: ${escapeHtml(state.grade.detail)}">
                    <strong>${escapeHtml(state.grade.label)}</strong>
                    <span>${escapeHtml(state.grade.detail)}</span>
                </div>
                <div class="wave-report-mvp">
                    <i class="fas fa-star"></i>
                    <span>
                        <small>MVP</small>
                        <b>${escapeHtml(state.bestHero)}</b>
                        <em>${escapeHtml(state.bestHeroKills)} bajas | ${escapeHtml(state.bestHeroDamage)} dano</em>
                    </span>
                </div>
            </div>
            <div class="wave-report-grid wave-report-grid--upgraded">
                ${this.renderMetric({ icon: 'fa-route', label: 'Brechas', value: state.leaks, tone: state.leaks > 0 ? 'danger' : 'safe' })}
                ${this.renderMetric({ icon: 'fa-skull', label: 'Bajas', value: state.kills })}
                ${this.renderMetric({ icon: 'fa-bolt', label: 'Dano', value: state.damage })}
                ${this.renderMetric({ icon: 'fa-coins', label: 'Creditos', value: `$${state.credits}` })}
            </div>
            ${this.renderDetailDrawer(state)}
            <p class="wave-report-advice"><i class="fas fa-compass"></i><span>${escapeHtml(state.advice)}</span></p>
            ${this.renderAction(action)}
        `;
    }

    renderQuickline(state, action) {
        const leaks = Number(state.leaks || 0);
        const credits = Math.max(0, Number(state.credits || 0));
        const actionText = action?.type === 'upgrade'
            ? `${action.label} $${action.cost}`
            : action?.label || 'Sin accion urgente';
        const actionIcon = action?.type === 'upgrade'
            ? 'fa-arrow-up'
            : action?.type === 'saving'
                ? 'fa-piggy-bank'
                : 'fa-compass';
        const chips = [
            { icon: 'fa-shield-halved', label: 'Linea', value: leaks > 0 ? `${leaks} brecha${leaks === 1 ? '' : 's'}` : 'Cerrada', tone: leaks > 0 ? 'danger' : 'safe' },
            { icon: 'fa-coins', label: 'Recompensa', value: `+$${credits}`, tone: 'reward' },
            { icon: actionIcon, label: 'Siguiente', value: actionText, tone: action?.type || 'stable' }
        ];
        return `<div class="wave-report-quickline" aria-label="Resumen rapido de oleada">
            ${chips.map((chip) => `<span class="quickline-${escapeHtml(chip.tone)}">
                <i class="fas ${escapeHtml(chip.icon)}"></i>
                <small>${escapeHtml(chip.label)}</small>
                <b>${escapeHtml(chip.value)}</b>
            </span>`).join('')}
        </div>`;
    }
    renderMetric(metric) {
        return `<span class="wave-report-metric metric-${escapeHtml(metric.tone || 'neutral')}">
            <i class="fas ${escapeHtml(metric.icon)}"></i>
            <b>${escapeHtml(metric.value)}</b>
            <small>${escapeHtml(metric.label)}</small>
        </span>`;
    }

    renderDetailDrawer(state) {
        const sections = [
            this.renderRewardBreakdown(state),
            this.renderTacticalContribution(state.tacticalContribution),
            this.renderLesson(state.lesson),
            this.renderLeakIntel(state.leakIntel)
        ].filter(Boolean);
        if (!sections.length) return '';
        const shouldOpen = state.leaks > 0 || state.tacticalContribution?.active;
        const label = state.leaks > 0
            ? 'Ver base y recompensas'
            : state.tacticalContribution?.active
                ? 'Ver aporte tactico'
                : 'Ver desglose';
        return `<details class="wave-report-details"${shouldOpen ? ' open' : ''}>
            <summary>
                <span><i class="fas fa-layer-group"></i>${escapeHtml(label)}</span>
                <b>${sections.length} lecturas</b>
            </summary>
            <div class="wave-report-detail-body">
                ${sections.join('')}
            </div>
        </details>`;
    }

    renderLesson(lesson) {
        if (!lesson) return '';
        return `<div class="wave-report-lesson lesson-${escapeHtml(lesson.tone)}" aria-label="${escapeHtml(lesson.label)}: ${escapeHtml(lesson.detail)}">
            <strong>${escapeHtml(lesson.label)}</strong>
            <span>${escapeHtml(lesson.detail)}</span>
        </div>`;
    }
    renderRewardBreakdown(state) {
        const credits = Math.max(0, Number(state.credits || 0));
        const bounty = Math.max(0, Number(state.bounty || 0));
        const metaReward = Math.max(0, Number(state.metaReward || 0));
        const known = bounty + metaReward;
        const extra = Math.max(0, credits - known);
        const rows = [
            { icon: 'fa-sack-dollar', label: 'Total', value: `+$${credits}`, tone: 'total' },
            bounty > 0 ? { icon: 'fa-skull', label: 'Bajas', value: `+$${bounty}` } : null,
            metaReward > 0 ? { icon: 'fa-medal', label: 'Objetivos', value: `+$${metaReward}` } : null,
            extra > 0 ? { icon: 'fa-dice', label: 'Extras', value: `+$${extra}` } : null
        ].filter(Boolean);
        if (!credits && rows.length <= 1) return '';
        return `<div class="wave-reward-strip" aria-label="Recompensa de oleada">
            ${rows.map((row) => `<span class="${escapeHtml(row.tone || '')}">
                <i class="fas ${escapeHtml(row.icon)}"></i>
                <b>${escapeHtml(row.value)}</b>
                <small>${escapeHtml(row.label)}</small>
            </span>`).join('')}
        </div>`;
    }

    renderTacticalContribution(contribution) {
        if (!contribution?.active) return '';
        return `<div class="wave-tactical-contribution" aria-label="Contribucion tactica de la oleada">
            <strong><i class="fas fa-chart-line"></i> Valor tactico ${contribution.score}</strong>
            <div>
                ${contribution.metrics.map((metric) => `<span class="${escapeHtml(metric.id)}">
                    <i class="fas ${escapeHtml(metric.icon)}"></i>
                    <b>${metric.value}${escapeHtml(metric.suffix)}</b>
                    <small>${escapeHtml(metric.label)}</small>
                </span>`).join('')}
            </div>
            ${contribution.heroes.length ? `<em>${contribution.heroes.map((hero) => `${escapeHtml(hero.name)}: ${escapeHtml(hero.detail)}`).join(' / ')}</em>` : ''}
        </div>`;
    }

    renderLeakIntel(leakIntel) {
        if (!leakIntel?.items?.length) return '';
        return `<div class="wave-leak-intel" aria-label="${escapeHtml(leakIntel.label)}">
            <strong><i class="fas fa-route"></i> ${escapeHtml(leakIntel.label)}</strong>
            ${leakIntel.items.map((item) => `<span class="${escapeHtml(item.tone)}">
                <b>${escapeHtml(item.name)}</b>
                <small>${escapeHtml(item.detail)}</small>
            </span>`).join('')}
            ${leakIntel.overflow > 0 ? `<em>+${leakIntel.overflow} mas</em>` : ''}
        </div>`;
    }

    renderAction(action) {
        if (!action) return '';
        const type = escapeHtml(action.type);
        const economyNote = action.type === 'upgrade' && Number.isFinite(Number(action.remaining))
            ? `<small>Saldo tras mejora: $${escapeHtml(action.remaining)}</small>`
            : action.type === 'saving' && Number.isFinite(Number(action.missing))
                ? `<small>Disponible $${escapeHtml(action.available || 0)} / coste $${escapeHtml(action.cost || 0)}</small>`
                : '';
        const actionLabel = action.type === 'upgrade'
            ? `${action.label} por ${action.cost} creditos. ${action.reason}`
            : action.label;
        return `<div class="wave-report-action report-action-${type}">
            <span>${escapeHtml(action.reason)}</span>
            ${action.type === 'upgrade'
                ? `<button id="wave-report-action" class="btn-mode-action" type="button" aria-label="${escapeHtml(actionLabel)}" title="${escapeHtml(actionLabel)}" data-tooltip="${escapeHtml(actionLabel)}">${escapeHtml(action.label)} $${escapeHtml(action.cost)}</button>`
                : `<small>${escapeHtml(action.label)}</small>`}
            ${economyNote}
        </div>`;
    }
}
