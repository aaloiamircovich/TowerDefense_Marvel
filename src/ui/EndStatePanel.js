import { getLevelUnlockRequirement, isLevelUnlockedByStars } from '../utils/LevelProgression.js';

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
        const summary = this.ui.game.progression?.state.lastMissionSummary;
        const lives = summary?.lives ?? this.ui.game.resourceManager?.lives ?? 0;
        const levelName = this.ui.game.currentLevel?.name || 'Mapa actual';
        const title = modeSnapshot ? `${modeSnapshot.name}: finalizada` : 'Base destruida';
        const subtitle = modeSnapshot
            ? `${formatNumber(modeSnapshot.score)} puntos | oleada ${formatNumber(wave)}`
            : `Llegaste hasta la oleada ${formatNumber(wave)}. Ajusta el equipo y vuelve a intentarlo.`;

        this.ui.panelContent.innerHTML = `
            <section class="end-state end-state-defeat">
                <div class="end-state-banner">
                    <div class="end-state-emblem"><i class="fas fa-triangle-exclamation"></i></div>
                    <div class="end-state-copy">
                        <span class="briefing-kicker">OPERACION FALLIDA</span>
                        <h2>${escapeHtml(title)}</h2>
                        <p>${escapeHtml(subtitle)}</p>
                    </div>
                </div>
                ${this.renderRunReadout([
                    { label: 'Mapa', value: levelName, icon: 'fa-map' },
                    { label: 'Oleada', value: formatNumber(wave), icon: 'fa-signal' },
                    { label: modeSnapshot ? 'Puntos' : 'Estrellas', value: formatNumber(modeSnapshot?.score ?? this.ui.game.stars), icon: modeSnapshot ? 'fa-chart-line' : 'fa-star' },
                    { label: 'Vidas', value: formatNumber(lives), icon: 'fa-heart' }
                ])}
                ${this.renderPersistenceRules('defeat', modeSnapshot)}
                ${modeSnapshot ? '' : this.renderProgressCarryover('defeat')}
                ${this.renderMissionSummary(summary)}
                ${this.renderOutcomeCoach('defeat', { wave, summary, modeSnapshot })}
                <div class="end-state-actions end-state-actions--compact">
                    <button class="btn-primary" id="retry-run" type="button" aria-label="Reintentar desde oleada 1" title="Reintentar desde oleada 1" data-tooltip="Reintentar desde oleada 1"><i class="fas fa-rotate-right"></i> Reintentar</button>
                </div>
            </section>
        `;

        const retryButton = document.getElementById('retry-run');
        retryButton?.addEventListener('click', () => {
            if (modeSnapshot) this.ui.game.modeSystem.start(modeSnapshot.id);
            else this.ui.game.retryCampaignFromFirstWave?.();
            this.ui.renderHeroRoster(this.ui.game.activeTeam, (hero) => this.ui.game.inputManager.setPlacementMode(hero));
            this.ui.closePanel();
            this.ui.game.start();
        });
        retryButton?.focus?.();
    }

    showVictory() {
        const modeSnapshot = this.ui.game.modeSystem?.getSnapshot();
        if (modeSnapshot) {
            this.ui.showModeResult(`${modeSnapshot.name}: completado`, modeSnapshot);
            return;
        }

        this.ui.showPanelOverlay(false);
        const summary = this.ui.game.progression?.state.lastMissionSummary;
        const levelName = this.ui.game.currentLevel?.name || 'Mapa actual';
        this.ui.panelContent.innerHTML = `
            <section class="end-state end-state-victory">
                <div class="end-state-banner">
                    <div class="end-state-emblem"><i class="fas fa-trophy"></i></div>
                    <div class="end-state-copy">
                        <span class="briefing-kicker">OPERACION COMPLETADA</span>
                        <h2>Victoria</h2>
                        <p>Completaste el mapa con ${formatNumber(this.ui.game.stars)} estrellas.</p>
                    </div>
                </div>
                ${this.renderRunReadout([
                    { label: 'Mapa', value: levelName, icon: 'fa-map' },
                    { label: 'Estrellas', value: formatNumber(this.ui.game.stars), icon: 'fa-star' },
                    { label: 'Vidas', value: formatNumber(summary?.lives ?? this.ui.game.resourceManager?.lives ?? 0), icon: 'fa-heart' },
                    { label: 'Mejor unidad', value: summary?.bestHero || 'Equipo', icon: 'fa-shield-halved' }
                ])}
                ${this.renderPersistenceRules('victory')}
                ${this.renderProgressCarryover('victory')}
                ${this.renderMissionSummary(summary)}
                ${this.renderOutcomeCoach('victory', { summary })}
                <div class="end-state-actions end-state-actions--compact">
                    <button class="btn-primary" id="victory-close" type="button" aria-label="Volver al mapa" title="Volver al mapa" data-tooltip="Volver al mapa"><i class="fas fa-map"></i> Volver al mapa</button>
                </div>
            </section>
        `;

        const victoryButton = document.getElementById('victory-close');
        victoryButton?.addEventListener('click', () => {
            document.getElementById('close-panel-btn')?.classList.remove('hidden');
            this.ui.closePanel();
        });
        victoryButton?.focus?.();
    }

    renderRunReadout(items = []) {
        const visibleItems = items.filter((item) => item && item.value !== undefined && item.value !== null && item.value !== '');
        if (!visibleItems.length) return '';
        return `
            <div class="end-state-readout">
                ${visibleItems.map((item) => `
                    <span>
                        <i class="fas ${escapeHtml(item.icon || 'fa-circle-info')}"></i>
                        <small>${escapeHtml(item.label)}</small>
                        <b>${escapeHtml(item.value)}</b>
                    </span>
                `).join('')}
            </div>
        `;
    }

    renderPersistenceRules(type = 'defeat', modeSnapshot = null) {
        const isMode = Boolean(modeSnapshot);
        const isVictory = type === 'victory';
        const kept = isMode
            ? 'Coleccion, ajustes y records permanentes.'
            : 'Creditos, estrellas, niveles, equipo y objetos.';
        const reset = isMode
            ? 'La run especial vuelve a empezar desde cero.'
            : isVictory
                ? 'Solo cambia la operacion que elijas jugar.'
                : 'La operacion vuelve a oleada 1.';
        return `
            <div class="end-state-persistence persistence-${isVictory ? 'victory' : isMode ? 'mode' : 'defeat'}" aria-label="Reglas de progreso al terminar">
                <span class="keep">
                    <i class="fas fa-lock"></i>
                    <strong>Se conserva</strong>
                    <small>${escapeHtml(kept)}</small>
                </span>
                <span class="reset">
                    <i class="fas fa-rotate-right"></i>
                    <strong>Reinicia</strong>
                    <small>${escapeHtml(reset)}</small>
                </span>
            </div>
        `;
    }

    renderProgressCarryover(type = 'defeat') {
        const stars = this.getTotalStars();
        const credits = this.getCredits();
        const nextMap = this.getNextMapStatus(stars);
        const actionHint = type === 'victory' ? 'Puedes seguir con el siguiente mapa.' : 'Reintentar vuelve a oleada 1.';
        const rows = [
            { icon: 'fa-star', label: 'Estrellas guardadas', value: formatNumber(stars), hint: nextMap.detail },
            { icon: 'fa-coins', label: 'Creditos disponibles', value: credits, hint: 'Se conservan entre intentos.' },
            { icon: 'fa-user-shield', label: 'Equipo', value: 'Niveles y objetos guardados', hint: actionHint }
        ];
        return `
            <div class="end-state-carryover">
                <strong>${escapeHtml(nextMap.title)}</strong>
                <div>
                    ${rows.map((row) => `
                        <span>
                            <i class="fas ${row.icon}"></i>
                            <small>${escapeHtml(row.label)}</small>
                            <b>${escapeHtml(row.value)}</b>
                            <em>${escapeHtml(row.hint)}</em>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getTotalStars() {
        const progressionStars = this.ui.game.progression?.getTotalStars?.();
        return Number.isFinite(progressionStars) ? progressionStars : (Number(this.ui.game.stars) || 0);
    }

    getCredits() {
        const progressionCredits = this.ui.game.progression?.getCredits?.();
        const credits = Number.isFinite(progressionCredits)
            ? progressionCredits
            : this.ui.game.resourceManager?.credits;
        return credits === Number.POSITIVE_INFINITY ? '∞' : `$${formatNumber(credits)}`;
    }

    getNextMapStatus(totalStars = 0) {
        const levels = this.ui.game.levelsData || [];
        const nextLockedIndex = levels.findIndex((_level, index) => !isLevelUnlockedByStars(index, totalStars));
        if (nextLockedIndex < 0) {
            return {
                title: 'Progreso conservado',
                detail: levels.length ? 'Todas las operaciones desbloqueadas.' : 'Campaña lista.'
            };
        }
        const requirement = getLevelUnlockRequirement(nextLockedIndex);
        const remaining = Math.max(0, requirement - totalStars);
        return {
            title: `Siguiente mapa: ${levels[nextLockedIndex]?.name || 'Operacion clasificada'}`,
            detail: `${formatNumber(remaining)} estrellas restantes (${formatNumber(totalStars)}/${formatNumber(requirement)}).`
        };
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
                <div class="mission-summary-grid">
                    ${rows.map((row) => `
                        <span class="mission-summary-card">
                            <i class="fas ${row.icon}"></i>
                            <small>${row.label}</small>
                            <b>${row.value}</b>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderOutcomeCoach(type, context = {}) {
        const isVictory = type === 'victory';
        const summary = context.summary;
        const cards = isVictory
            ? [
                { icon: 'fa-star', label: 'Objetivo', value: 'Buscar mas estrellas' },
                { icon: 'fa-list-check', label: 'Desafios', value: 'Completar misiones pendientes' },
                { icon: 'fa-box-open', label: 'Progreso', value: 'Invertir creditos en arsenal' }
            ]
            : [
                { icon: 'fa-signal', label: 'Corte', value: `Oleada ${formatNumber(context.wave || 1)}` },
                { icon: 'fa-arrow-up-right-dots', label: 'Prioridad', value: summary?.bestHero ? `Mejorar ${summary.bestHero}` : 'Reforzar el equipo' },
                { icon: 'fa-satellite-dish', label: 'Lectura', value: context.modeSnapshot ? 'Revisar modo especial' : 'Abrir radar antes de salir' }
            ];
        return `
            <div class="end-state-coach ${isVictory ? 'victory' : 'defeat'}">
                <strong>${isVictory ? 'Siguiente objetivo' : 'Plan de recuperacion'}</strong>
                <div>
                    ${cards.map((card) => `
                        <span>
                            <i class="fas ${card.icon}"></i>
                            <small>${escapeHtml(card.label)}</small>
                            <b>${escapeHtml(card.value)}</b>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showFatalError(error) {
        this.ui.game?.pause?.();
        this.ui.showPanelOverlay(false);
        this.ui.panelContent.innerHTML = `
            <section class="end-state error-state" role="alert">
                <div class="end-state-banner">
                    <div class="end-state-emblem"><i class="fas fa-triangle-exclamation"></i></div>
                    <div class="end-state-copy">
                        <span class="briefing-kicker">ERROR DE INICIO</span>
                        <h2>No se pudo iniciar la misión</h2>
                        <p id="fatal-error-copy"></p>
                    </div>
                </div>
                <div class="end-state-actions end-state-actions--compact">
                    <button class="btn-primary" id="reload-game" type="button" aria-label="Reintentar carga" title="Reintentar carga" data-tooltip="Reintentar carga"><i class="fas fa-rotate-right"></i> Reintentar carga</button>
                </div>
            </section>
        `;
        document.getElementById('fatal-error-copy').textContent = error?.message || 'Revisa los datos del juego e inténtalo nuevamente.';
        const reloadButton = document.getElementById('reload-game');
        reloadButton?.addEventListener('click', () => window.location.reload());
        reloadButton?.focus?.();
    }
}
