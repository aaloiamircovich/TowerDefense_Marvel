import { clampPercent, escapeHtml, normalizeClassToken } from './HtmlSanitizer.js';

function formatCompactCount(value = 0) {
    const amount = Math.max(0, Math.floor(Number(value) || 0));
    if (amount >= 1000) return `${Math.round(amount / 100) / 10}k`.replace('.0k', 'k');
    return `${amount}`;
}

export class ThreatHudPanel {
    constructor(builders = {}) {
        this.buildBossHudState = builders.buildBossHudState || (() => null);
        this.buildSpawnQueueState = builders.buildSpawnQueueState || (() => null);
    }

    updateBoss(enemies = [], waveActive = false) {
        const container = document.getElementById('boss-hud');
        if (!container) return null;
        const state = this.buildBossHudState(enemies, waveActive);
        if (!state) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return null;
        }

        const hpPct = clampPercent(state.hpPct);
        container.className = `boss-hud ${state.critical ? 'critical' : ''} ${state.isFinalBoss ? 'final-boss' : ''}`;
        container.setAttribute('aria-label', `${state.name}. ${state.phase}. Salud ${state.hpPct} por ciento.`);
        container.innerHTML = `
            <div class="boss-hud-heading">
                <span>${state.isFinalBoss ? 'Jefe final' : 'Jefe activo'}</span>
                <strong>${escapeHtml(state.name)}</strong>
            </div>
            <div class="boss-hud-meter" aria-hidden="true"><i style="width:${hpPct}%"></i></div>
            <div class="boss-hud-meta">
                <span>${escapeHtml(state.phase)}</span>
                <b>${escapeHtml(hpPct)}%</b>
            </div>
        `;
        return state;
    }

    updateSpawnQueue(queue = [], spawnTimer = 0, waveActive = false) {
        const container = document.getElementById('spawn-queue');
        if (!container) return null;
        const state = this.buildSpawnQueueState(queue, spawnTimer, waveActive);
        if (!state) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return null;
        }

        const dangerClass = normalizeClassToken(state.danger, 'normal');
        const remainingLabel = formatCompactCount(state.remaining);
        container.className = `spawn-queue ${dangerClass}`;
        container.setAttribute('aria-label', `Proximo refuerzo ${state.name} en ${state.eta} segundos. Quedan ${state.remaining}.`);
        container.innerHTML = `
            <span>Refuerzos</span>
            <strong>${escapeHtml(state.name)}</strong>
            <b>${escapeHtml(state.eta)}s | ${remainingLabel} pendientes</b>
        `;
        return state;
    }
}
