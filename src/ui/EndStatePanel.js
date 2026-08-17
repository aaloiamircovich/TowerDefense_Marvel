function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatNumber(value = 0) {
    return Math.round(Number(value) || 0).toLocaleString('es-AR');
}

export class EndStatePanel {
    constructor(ui) {
        this.ui = ui;
    }

    showGameOver() {
        this.ui.showPanelOverlay(false);
        const modeSnapshot = this.ui.game.modeSystem?.getSnapshot();
        const wave = this.ui.game.waveManager?.currentWave || 1;
        const title = modeSnapshot ? `${modeSnapshot.name}: finalizada` : 'Base destruida';
        const subtitle = modeSnapshot
            ? `${formatNumber(modeSnapshot.score)} puntos | oleada ${formatNumber(wave)}`
            : `Llegaste hasta la oleada ${formatNumber(wave)}. Ajusta el equipo y vuelve a intentarlo.`;

        this.ui.panelContent.innerHTML = `
            <section class="end-state end-state-defeat">
                <div class="end-state-emblem"><i class="fas fa-triangle-exclamation"></i></div>
                <span class="briefing-kicker">OPERACION FALLIDA</span>
                <h2>${escapeHtml(title)}</h2>
                <p>${escapeHtml(subtitle)}</p>
                ${this.renderMissionSummary(this.ui.game.progression?.state.lastMissionSummary)}
                <div class="end-state-actions">
                    <button class="btn-primary" id="retry-run"><i class="fas fa-rotate-right"></i> Reintentar</button>
                </div>
            </section>
        `;

        document.getElementById('retry-run')?.addEventListener('click', () => {
            if (modeSnapshot) this.ui.game.modeSystem.start(modeSnapshot.id);
            else this.ui.game.retryCampaignFromFirstWave?.();
            this.ui.renderHeroRoster(this.ui.game.activeTeam, (hero) => this.ui.game.inputManager.setPlacementMode(hero));
            this.ui.closePanel();
            this.ui.game.start();
        });
    }

    showVictory() {
        const modeSnapshot = this.ui.game.modeSystem?.getSnapshot();
        if (modeSnapshot) {
            this.ui.showModeResult(`${modeSnapshot.name}: completado`, modeSnapshot);
            return;
        }

        this.ui.showPanelOverlay(false);
        this.ui.panelContent.innerHTML = `
            <section class="end-state end-state-victory">
                <div class="end-state-emblem"><i class="fas fa-trophy"></i></div>
                <span class="briefing-kicker">OPERACION COMPLETADA</span>
                <h2>Victoria</h2>
                <p>Completaste el mapa con ${formatNumber(this.ui.game.stars)} estrellas.</p>
                ${this.renderMissionSummary(this.ui.game.progression?.state.lastMissionSummary)}
                <div class="end-state-actions">
                    <button class="btn-primary" id="victory-close"><i class="fas fa-map"></i> Volver al mapa</button>
                </div>
            </section>
        `;

        document.getElementById('victory-close')?.addEventListener('click', () => {
            document.getElementById('close-panel-btn')?.classList.remove('hidden');
            this.ui.closePanel();
        });
    }

    renderMissionSummary(summary) {
        if (!summary) return '';
        const totals = summary.totals || {};
        const rows = [
            { label: 'Daño', value: formatNumber(totals.damage), icon: 'fa-bolt' },
            { label: 'Bajas', value: formatNumber(totals.kills), icon: 'fa-skull' },
            { label: 'Habilidades', value: formatNumber(totals.abilities), icon: 'fa-star' },
            { label: 'Créditos', value: `$${formatNumber(totals.credits)}`, icon: 'fa-coins' }
        ];

        return `
            <div class="mission-summary mission-summary-upgraded">
                <div class="mission-summary-title">
                    <strong>Informe de mision</strong>
                    <small>Destacado: ${escapeHtml(summary.bestHero || 'Equipo')} | ${formatNumber(summary.lives)} vidas restantes</small>
                </div>
                ${rows.map((row) => `
                    <span>
                        <i class="fas ${row.icon}"></i>
                        <small>${row.label}</small>
                        <b>${row.value}</b>
                    </span>
                `).join('')}
            </div>
        `;
    }

    showFatalError(error) {
        this.ui.game?.pause?.();
        this.ui.showPanelOverlay(false);
        this.ui.panelContent.innerHTML = `
            <section class="end-state error-state" role="alert">
                <div class="end-state-emblem"><i class="fas fa-triangle-exclamation"></i></div>
                <span class="briefing-kicker">ERROR DE INICIO</span>
                <h2>No se pudo iniciar la misión</h2>
                <p id="fatal-error-copy"></p>
                <div class="end-state-actions">
                    <button class="btn-primary" id="reload-game"><i class="fas fa-rotate-right"></i> Reintentar carga</button>
                </div>
            </section>
        `;
        document.getElementById('fatal-error-copy').textContent = error?.message || 'Revisa los datos del juego e inténtalo nuevamente.';
        document.getElementById('reload-game')?.addEventListener('click', () => window.location.reload());
    }
}
