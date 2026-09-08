export function shouldShowFps(game) {
    return game?.progression?.state?.settings?.showFps === true;
}

export function buildPerformanceTitle(snapshot = {}, poolStats = {}) {
    const averageMs = Number(snapshot.averageMs) || 0;
    const p95Ms = Number(snapshot.p95Ms) || 0;
    const peakEntities = Math.round(Number(snapshot.peakEntities) || 0);
    const reused = Math.round(Number(poolStats.reused) || 0);
    return `Frame promedio ${averageMs.toFixed(2)} ms · p95 ${p95Ms.toFixed(2)} ms · pico ${peakEntities} entidades · ${reused} proyectiles reutilizados`;
}

export function buildLevelThemeState(levelConfig = {}) {
    return {
        label: levelConfig.theme?.label || levelConfig.name || 'Mapa',
        accent: levelConfig.theme?.accent || '#40c9ff',
        audioTheme: levelConfig.theme?.id || 'new-york'
    };
}

export class PerformanceThemeController {
    constructor(ui) {
        this.ui = ui;
    }

    shouldShowFps() {
        return shouldShowFps(this.ui.game);
    }

    updatePerformance(snapshot = {}, poolStats = {}) {
        const fps = Math.round(Number(snapshot.fps) || 0);
        const p95Ms = Number(snapshot.p95Ms) || 0;
        return this.ui.updateFpsDisplay(`${fps} FPS`, {
            warning: p95Ms > 16.67,
            title: buildPerformanceTitle(snapshot, poolStats)
        });
    }

    updateLevelTheme(levelConfig = {}) {
        const state = buildLevelThemeState(levelConfig);
        if (this.ui.levelNameEl) this.ui.levelNameEl.textContent = state.label;
        globalThis.document?.documentElement?.style?.setProperty?.('--level-accent', state.accent);
        if (this.ui.operationTitleEl) this.ui.operationTitleEl.textContent = state.label;
        this.ui.game?.audio?.setTheme?.(state.audioTheme);
        return state;
    }
}
