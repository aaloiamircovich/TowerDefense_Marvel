import { escapeHtml, normalizeClassToken } from './HtmlSanitizer.js';

function setHudResourceElement(element, value = 0, formatHudResource) {
    if (!element) return;
    const exact = value === Number.POSITIVE_INFINITY ? 'Infinity' : `${Math.floor(Math.max(0, Number(value) || 0))}`;
    element.textContent = formatHudResource(value);
    if (!element.dataset) element.dataset = {};
    element.dataset.value = exact;
    element.title = exact === 'Infinity' ? 'Recursos infinitos' : exact;
}

export class TopHudPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildWaveLaunchState = builders.buildWaveLaunchState || (() => null);
        this.buildBossCountdownState = builders.buildBossCountdownState || (() => null);
        this.formatHudResource = builders.formatHudResource || ((value = 0) => `${Math.floor(Math.max(0, Number(value) || 0))}`);
    }

    updateSpeedButton(button = document.getElementById('btn-speed')) {
        if (!button) return null;
        const speed = Number(this.ui.game?.gameSpeed || 1);
        const label = `Cambiar velocidad de juego. Velocidad actual x${speed}`;
        button.innerHTML = `x${speed} <i class="fas fa-rocket"></i>`;
        button.setAttribute('aria-label', label);
        button.title = `Velocidad actual x${speed}`;
        button.dataset.tooltip = `Velocidad actual x${speed}`;
        return { speed, label };
    }

    updateAutoWaveButton(button = document.getElementById('btn-auto')) {
        if (!button) return null;
        const enabled = Boolean(this.ui.game?.waveManager?.autoWave);
        const label = enabled ? 'Auto oleada activado' : 'Auto oleada desactivado';
        const tooltip = enabled ? 'Desactivar inicio automatico' : 'Activar inicio automatico de oleadas';
        button.classList.toggle('active', enabled);
        button.classList.toggle('muted', !enabled);
        button.setAttribute('aria-pressed', String(enabled));
        button.setAttribute('aria-label', label);
        button.title = tooltip;
        button.dataset.tooltip = tooltip;
        return { enabled, label, tooltip };
    }

    setManualPause(paused, announce = true) {
        this.ui.game.isManuallyPaused = Boolean(paused);
        if (this.ui.game.isManuallyPaused) this.ui.game.pause();
        else this.ui.game.start();

        const button = document.getElementById('btn-pause');
        if (button) {
            button.innerHTML = this.ui.game.isManuallyPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
            button.classList.toggle('active', this.ui.game.isManuallyPaused);
            const tooltip = this.ui.game.isManuallyPaused ? 'Reanudar partida' : 'Entrar en pausa táctica';
            button.setAttribute('aria-pressed', String(this.ui.game.isManuallyPaused));
            button.setAttribute('aria-label', this.ui.game.isManuallyPaused ? 'Reanudar' : 'Pausar');
            button.title = tooltip;
            button.dataset.tooltip = tooltip;
        }

        document.body.classList.toggle('tactical-paused', this.ui.game.isManuallyPaused);
        if (announce) {
            this.ui.showToast(
                this.ui.game.isManuallyPaused ? 'Pausa táctica: inspecciona y reorganiza' : 'Partida reanudada',
                'info'
            );
        }
        return this.ui.game.isManuallyPaused;
    }

    setNextWaveEnabled(enabled, summary = null) {
        const button = document.getElementById('next-wave-btn');
        if (!button) return null;
        if (summary) this.ui.nextWaveSummary = summary;
        const state = this.buildWaveLaunchState(enabled, summary || this.ui.nextWaveSummary);
        const tierClass = normalizeClassToken(state.tier, 'low');
        button.disabled = !enabled;
        button.className = `btn-primary next-wave-cta threat-${tierClass}`;
        button.dataset.threatTier = tierClass;
        button.dataset.tooltip = state.tooltip;
        button.title = state.tooltip;
        button.setAttribute('aria-label', state.ariaLabel);

        const primary = document.createElement('strong');
        const secondary = document.createElement('small');
        primary.textContent = state.primary;
        secondary.textContent = state.secondary;
        button.replaceChildren(primary, secondary);
        this.ui.renderOnboardingCoach();
        return state;
    }

    updateFpsDisplay(text, { warning = false, title = '' } = {}) {
        if (!this.ui.fpsEl) return null;
        const visible = this.ui.shouldShowFps();
        this.ui.fpsEl.classList?.toggle('hidden', !visible);
        this.ui.fpsEl.classList?.toggle('performance-warning', visible && warning);
        if (!visible) {
            this.ui.fpsEl.removeAttribute?.('title');
            return { visible };
        }
        this.ui.fpsEl.textContent = text;
        if (title) this.ui.fpsEl.title = title;
        else this.ui.fpsEl.removeAttribute?.('title');
        return { visible, text, warning, title };
    }

    updateUI(lives, credits, wave, fps, stars) {
        if (this.ui.livesEl) this.ui.livesEl.textContent = lives;
        if (this.ui.creditsEl) setHudResourceElement(this.ui.creditsEl, credits, this.formatHudResource);
        if (this.ui.waveEl) this.ui.waveEl.textContent = wave;
        const bossState = this.updateBossCountdown(wave);
        const fpsState = this.updateFpsDisplay(`${Math.round(fps || 0)} FPS`);
        if (this.ui.starsEl && stars !== undefined) setHudResourceElement(this.ui.starsEl, stars, this.formatHudResource);
        return { bossState, fpsState };
    }

    updateBossCountdown(wave = 1) {
        if (!this.ui.bossCountdownEl) return null;
        const state = this.buildBossCountdownState(wave, this.ui.game.waveManager?.maxWaves);
        const toneClass = normalizeClassToken(state.tone, 'normal');
        this.ui.bossCountdownEl.className = `status-item boss-countdown boss-countdown-${toneClass}`;
        this.ui.bossCountdownEl.setAttribute('aria-label', state.ariaLabel);
        this.ui.bossCountdownEl.innerHTML = `<i class="fas fa-skull"></i><span>${escapeHtml(state.label)}</span><b>${escapeHtml(state.detail)}</b>`;
        return state;
    }
}
