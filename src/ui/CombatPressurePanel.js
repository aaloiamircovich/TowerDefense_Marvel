import { clampPercent, escapeHtml, normalizeClassToken } from './HtmlSanitizer.js';

export class CombatPressurePanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildCombatPressureState = builders.buildCombatPressureState || (() => ({ id: 'clear', signature: 'clear' }));
        this.buildPressureActionState = builders.buildPressureActionState || (() => null);
    }

    render(enemies = [], path = [], waveActive = false) {
        const container = document.getElementById('combat-pressure');
        if (!container) return null;
        const state = this.buildCombatPressureState(enemies, path, waveActive);
        const action = this.buildPressureActionState(
            state,
            this.ui.game.heroes || [],
            this.ui.game.resourceManager?.credits || 0,
            (level, amount) => this.ui.calculateLevelCost(level, amount)
        );
        const signature = `${state.signature}:${action?.signature || 'none'}`;
        if (signature === this.ui.combatPressureSignature) return state;
        this.ui.combatPressureSignature = signature;

        if (!waveActive && state.id === 'clear') {
            container.classList.add('hidden');
            container.innerHTML = '';
            return state;
        }

        const stateClass = normalizeClassToken(state.id, 'clear');
        const progress = clampPercent(state.progress);
        container.className = `combat-pressure pressure-${stateClass}`;
        container.setAttribute('aria-label', `${state.label}. ${state.advice}`);
        const pressureActionLabel = action?.type === 'upgrade'
            ? `${action.label} por ${action.cost} creditos. ${action.reason}`
            : '';
        const pressurePauseLabel = 'Activar pausa tactica por presion de ruta';
        const actionClass = normalizeClassToken(action?.type, 'hint');
        container.innerHTML = `
            <div class="pressure-copy">
                <strong>${escapeHtml(state.label)}</strong>
                <span>${escapeHtml(state.advice)}</span>
            </div>
            <div class="pressure-meter" aria-hidden="true"><i style="width:${progress}%"></i></div>
            <div class="pressure-meta">
                <span>${escapeHtml(state.activeCount)} activos</span>
                <span>${escapeHtml(state.leadEnemyName || 'Ruta')} ${escapeHtml(progress)}%</span>
                ${state.dangerCount ? `<b>${escapeHtml(state.dangerCount)} en base</b>` : ''}
            </div>
            ${action ? `<div class="pressure-action pressure-action-${actionClass}">
                <span>${escapeHtml(action.reason)}</span>
                ${action.type === 'upgrade'
                    ? `<button id="pressure-upgrade" class="btn-mode-action" type="button" aria-label="${escapeHtml(pressureActionLabel)}" title="${escapeHtml(pressureActionLabel)}" data-tooltip="${escapeHtml(pressureActionLabel)}">${escapeHtml(action.label)} $${escapeHtml(action.cost)}</button>`
                    : `<small>${escapeHtml(action.label)}</small>`}
            </div>` : ''}
            ${state.id === 'warning' || state.id === 'critical' ? `<button id="pressure-pause" class="btn-mode-action" type="button" aria-label="${escapeHtml(pressurePauseLabel)}" title="${escapeHtml(pressurePauseLabel)}" data-tooltip="${escapeHtml(pressurePauseLabel)}">Pausa táctica</button>` : ''}
        `;
        document.getElementById('pressure-upgrade')?.addEventListener('click', () => {
            if (this.ui.quickUpgradeHeroById(action.heroId)) {
                this.ui.combatPressureSignature = '';
                this.render(enemies, path, waveActive);
            }
        });
        document.getElementById('pressure-pause')?.addEventListener('click', () => this.ui.setManualPause(true));
        return state;
    }
}
