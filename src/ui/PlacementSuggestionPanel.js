function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function normalizeClassToken(value = '', fallback = 'solid') {
    const token = String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return token || fallback;
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
        const qualityClass = normalizeClassToken(state.qualityId);
        button.className = `suggested-placement-action ${qualityClass}`;
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
