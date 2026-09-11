import { escapeHtml } from './HtmlSanitizer.js';

export class MissionStatusPanel {
    update(snapshot) {
        const container = globalThis.document?.getElementById?.('mission-status');
        if (!container || !snapshot) return;
        const blackout = Math.max(0, Math.ceil(Number(snapshot.blackout) || 0));
        const objectives = Array.isArray(snapshot.objectives) ? snapshot.objectives.filter(Boolean) : [];
        const specialStatus = blackout > 0
            ? `<b>Corte: ${escapeHtml(blackout)}s</b>`
            : '';
        container.innerHTML = `
            <div class="mission-heading"><strong>${escapeHtml(snapshot.operation || 'Operacion tactica')}</strong><span>${escapeHtml(snapshot.mechanicLabel || 'Mision')}</span></div>
            <p>${escapeHtml(snapshot.message || '')}</p>
            ${specialStatus}
            <div class="mission-objectives-mini">
                ${objectives.map((objective) => `<span class="${objective.complete ? 'done' : ''}">${objective.complete ? '✓' : `${escapeHtml(objective.value ?? 0)}/${escapeHtml(objective.target ?? 0)}`} ${escapeHtml(objective.label || 'Objetivo')}</span>`).join('')}
            </div>
        `;
    }
}
