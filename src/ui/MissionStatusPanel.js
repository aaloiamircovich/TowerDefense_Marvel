import { escapeHtml } from './HtmlSanitizer.js';

export class MissionStatusPanel {
    update(snapshot) {
        const container = document.getElementById('mission-status');
        if (!container || !snapshot) return;
        const specialStatus = snapshot.blackout > 0
            ? `<b>Corte: ${escapeHtml(snapshot.blackout)}s</b>`
            : '';
        container.innerHTML = `
            <div class="mission-heading"><strong>${escapeHtml(snapshot.operation)}</strong><span>${escapeHtml(snapshot.mechanicLabel)}</span></div>
            <p>${escapeHtml(snapshot.message)}</p>
            ${specialStatus}
            <div class="mission-objectives-mini">
                ${(snapshot.objectives || []).map((objective) => `<span class="${objective.complete ? 'done' : ''}">${objective.complete ? '✓' : `${escapeHtml(objective.value)}/${escapeHtml(objective.target)}`} ${escapeHtml(objective.label)}</span>`).join('')}
            </div>
        `;
    }
}
