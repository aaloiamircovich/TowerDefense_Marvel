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
                    <span>Informe oleada ${state.wave}</span>
                    <strong>${state.label}</strong>
                </div>
                <b class="wave-report-grade grade-${state.grade.tone}" title="${escapeHtml(state.grade.detail)}">
                    <em>${state.grade.medal}</em>
                    <small>${state.grade.score}</small>
                </b>
            </div>
            <div class="wave-report-grid">
                <span><b>${state.leaks}</b> fugas</span>
                <span><b>${state.kills}</b> bajas</span>
                <span><b>${state.damage}</b> dano</span>
                <span><b>$${state.credits}</b> creditos</span>
                ${state.cleanBonus > 0 ? `<span><b>+$${state.cleanBonus}</b> perfecta</span>` : ''}
            </div>
            <div class="wave-report-rating grade-${state.grade.tone}" aria-label="${escapeHtml(state.grade.label)}: ${escapeHtml(state.grade.detail)}">
                <strong>${escapeHtml(state.grade.label)}</strong>
                <span>${escapeHtml(state.grade.detail)}</span>
            </div>
            <div class="wave-report-mvp">
                <i class="fas fa-star"></i>
                <span>${state.bestHero}: ${state.bestHeroKills} bajas - ${state.bestHeroDamage} dano</span>
            </div>
            ${this.renderTacticalContribution(state.tacticalContribution)}
            <div class="wave-report-lesson lesson-${state.lesson.tone}" aria-label="${escapeHtml(state.lesson.label)}: ${escapeHtml(state.lesson.detail)}">
                <strong>${escapeHtml(state.lesson.label)}</strong>
                <span>${escapeHtml(state.lesson.detail)}</span>
            </div>
            ${this.renderLeakIntel(state.leakIntel)}
            <p>${state.advice}</p>
            ${this.renderAction(action)}
        `;
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
        return `<div class="wave-report-action report-action-${action.type}">
            <span>${action.reason}</span>
            ${action.type === 'upgrade'
                ? `<button id="wave-report-action" class="btn-mode-action">${action.label} $${action.cost}</button>`
                : `<small>${action.label}</small>`}
        </div>`;
    }
}
