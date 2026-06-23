import { APP_VERSION, FAN_PROJECT_NOTICE } from '../config/AppConfig.js';
import { MASTERY_CHALLENGES } from '../systems/MasteryCodexSystem.js';

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
        const team = game.teamSynergy?.getSnapshot?.() || { families: [], pairs: [], versatile: false };
        const activeSynergies = team.families.filter((family) => family.activeTier).length + team.pairs.filter((pair) => pair.active).length + Number(team.versatile);
        const codex = progression.getCodexSnapshot();
        const masteryRows = game.unlockedHeroes.map((hero) => {
            const completed = progression.getHeroMastery(hero.id).completed;
            return `<div class="mastery-row"><span>${hero.name}</span><strong>${completed.length}/${MASTERY_CHALLENGES.length}</strong><small>${MASTERY_CHALLENGES.map((challenge) => `${completed.includes(challenge.id) ? '✓' : '○'} ${challenge.name}`).join(' · ')}</small></div>`;
        }).join('');
        const statistics = progression.state.statistics;
        const achievementLabels = { primera_defensa: 'Primera defensa', intocable: 'Intocable', cazajefes: 'Cazajefes', maestro: 'Maestro heroico', coleccionista: 'Coleccionista' };
        panelContent.innerHTML = `
            <h2>${title}</h2>
            <div class="profile-grid">
                <div class="detail-card"><h3>Progreso</h3><p><span>Mejores oleadas</span><strong>${bestWaves}</strong></p><p><span>Estrellas</span><strong>${game.stars}/${game.levelsData.length * 3}</strong></p><p><span>Desafíos</span><strong>${challenges}/${game.levelsData.length * 2}</strong></p></div>
                <div class="detail-card"><h3>Plantilla</h3><p><span>Héroes</span><strong>${game.unlockedHeroes.length}</strong></p><p><span>Equipo activo</span><strong>${game.activeTeam.length}/6</strong></p></div>
                <div class="detail-card"><h3>Composición</h3><p><span>Sinergias</span><strong>${activeSynergies}</strong></p><p><span>Familias</span><strong>${team.distinctTags || 0}</strong></p><p><span>Coste conjunto</span><strong>$${team.cost || 0}</strong></p></div>
                <div class="detail-card"><h3>Economía</h3><p><span>Fondos S.H.I.E.L.D.</span><strong>${progression.state.metaCredits} F</strong></p><p><span>Créditos de misión</span><strong>$${Math.floor(game.resourceManager.credits)}</strong></p></div>
                <div class="detail-card"><h3>Zona Marvel</h3><p><span>Mapa</span><strong>${game.currentLevel?.theme?.label || game.currentLevel?.name || 'Mapa'}</strong></p><p><span>Ambiente</span><strong>${game.currentLevel?.theme?.brief || 'Defensa táctica'}</strong></p></div>
                <div class="detail-card"><h3>Rendimiento</h3><p><span>Frame p95</span><strong>${(performance.p95Ms || 0).toFixed(1)} ms</strong></p><p><span>Memoria pico</span><strong>${(performance.peakMemoryMb || 0).toFixed(1)} MB</strong></p><p><span>Pico de entidades</span><strong>${performance.peakEntities || 0}</strong></p><p><span>Proyectiles reciclados</span><strong>${pool.reused || 0}</strong></p></div>
            </div>
            <section class="profile-meta-section"><h3>Maestria heroica</h3>${masteryRows || '<p>Recluta un heroe para iniciar desafios.</p>'}</section>
            <section class="profile-meta-section"><h3>Codice descubierto</h3><div class="codex-summary">${Object.entries(codex).map(([key, value]) => `<span><b>${value.found}/${value.total}</b>${({ heroes: 'Heroes', enemies: 'Enemigos', items: 'Objetos', factions: 'Facciones', mechanics: 'Mecanicas' })[key]}</span>`).join('')}</div></section>
            <section class="profile-meta-section"><h3>Historial</h3><div class="codex-summary"><span><b>${statistics.missions}</b>Misiones</span><span><b>${statistics.victories}</b>Victorias</span><span><b>${statistics.waves}</b>Oleadas</span><span><b>${statistics.enemiesDefeated}</b>Enemigos</span><span><b>${statistics.damageDealt}</b>Dano</span></div></section>
            <section class="profile-meta-section"><h3>Logros</h3><div class="achievement-list">${Object.entries(achievementLabels).map(([id, label]) => `<span class="${progression.state.achievements.includes(id) ? 'unlocked' : ''}">${progression.state.achievements.includes(id) ? '✓' : '○'} ${label}</span>`).join('')}</div></section>
            <div class="release-notice"><strong>Super Hero TD v${APP_VERSION}</strong><span>${FAN_PROJECT_NOTICE}</span></div>
        `;
    }
}
