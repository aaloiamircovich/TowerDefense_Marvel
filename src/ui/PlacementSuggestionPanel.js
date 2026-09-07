function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export class PlacementSuggestionPanel {
    constructor(ui) {
        this.ui = ui;
    }

    update(state = null) {
        const button = document.getElementById('suggested-placement-action');
        if (!button) return;
        const idleLabel = 'Usar celda sugerida';
        if (!state) {
            button.classList.add('hidden');
            button.innerHTML = '';
            button.onclick = null;
            button.setAttribute('aria-label', idleLabel);
            button.title = idleLabel;
            button.dataset.tooltip = idleLabel;
            this.ui.renderOnboardingCoach();
            return;
        }

        const suggestionLabel = `${state.label}. ${state.detail}`;
        button.className = `suggested-placement-action ${state.qualityId || 'solid'}`;
        button.setAttribute('aria-label', suggestionLabel);
        button.title = suggestionLabel;
        button.dataset.tooltip = suggestionLabel;
        button.innerHTML = `
            <i class="fas fa-location-crosshairs"></i>
            <span><strong>${escapeHtml(state.label)}</strong><small>${escapeHtml(state.detail)}</small></span>
            <b>${escapeHtml(state.actionLabel || 'Usar')}</b>
        `;
        button.onclick = () => this.ui.game.inputManager?.confirmSuggestedPlacement?.();
        this.ui.renderOnboardingCoach();
    }
}
