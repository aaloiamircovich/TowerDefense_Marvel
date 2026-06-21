import { APP_VERSION, FAN_PROJECT_NOTICE } from '../config/AppConfig.js';

export class ProfilePanel {
    constructor(ui) {
        this.ui = ui;
    }

    render(title = 'Perfil') {
        const { game, panelContent } = this.ui;
        const progression = game.progression;
        const maps = Object.values(progression.state.mapProgress);
        const bestWaves = maps.reduce((total, map) => total + (map.bestWave || 0), 0);
        const challenges = maps.reduce((total, map) => total + (map.challenges?.length || 0), 0);
        const performance = game.performanceMonitor?.lastSnapshot || {};
        const pool = game.projectilePool?.getStats?.() || {};
        panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="profile-grid">
                <div class="detail-card"><h3>Progreso</h3><p><span>Mejores oleadas</span><strong>${bestWaves}</strong></p><p><span>Estrellas</span><strong>${game.stars}/${game.levelsData.length * 3}</strong></p><p><span>Desafíos</span><strong>${challenges}/${game.levelsData.length * 2}</strong></p></div>
                <div class="detail-card"><h3>Plantilla</h3><p><span>Héroes</span><strong>${game.unlockedHeroes.length}</strong></p><p><span>Equipo activo</span><strong>${game.activeTeam.length}/6</strong></p></div>
                <div class="detail-card"><h3>Economía</h3><p><span>Fondos S.H.I.E.L.D.</span><strong>${progression.state.metaCredits} F</strong></p><p><span>Créditos de misión</span><strong>$${Math.floor(game.resourceManager.credits)}</strong></p></div>
                <div class="detail-card"><h3>Zona Marvel</h3><p><span>Mapa</span><strong>${game.currentLevel?.theme?.label || game.currentLevel?.name || 'Mapa'}</strong></p><p><span>Ambiente</span><strong>${game.currentLevel?.theme?.brief || 'Defensa táctica'}</strong></p></div>
                <div class="detail-card"><h3>Rendimiento</h3><p><span>Frame p95</span><strong>${(performance.p95Ms || 0).toFixed(1)} ms</strong></p><p><span>Pico de entidades</span><strong>${performance.peakEntities || 0}</strong></p><p><span>Proyectiles reciclados</span><strong>${pool.reused || 0}</strong></p></div>
            </div>
            <div class="release-notice"><strong>Super Hero TD v${APP_VERSION}</strong><span>${FAN_PROJECT_NOTICE}</span></div>
        `;
    }
}
