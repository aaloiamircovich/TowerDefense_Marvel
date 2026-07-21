import { APP_VERSION, FAN_PROJECT_NOTICE } from '../config/AppConfig.js';
import { MASTERY_CHALLENGES } from '../systems/MasteryCodexSystem.js';
import { ACHIEVEMENT_CATALOG } from '../systems/ProgressionManager.js';

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
        const team = game.teamSynergy?.getSnapshot?.() || { families: [], pairs: [] };
        const activeSynergies = team.families.filter((family) => family.activeTier).length
            + team.pairs.filter((pair) => pair.active).length;
        const codex = progression.getCodexSnapshot();
        const weekly = progression.getWeeklyContractSnapshot();
        const synergyChallenges = progression.getSynergyChallengeSnapshot(team);
        const statistics = progression.state.statistics;
        const starTarget = Math.max(1, game.levelsData.length * (game.waveManager?.maxWaves || 50));
        const completion = Math.min(100, Math.round((game.stars / starTarget) * 100));
        const masteryRows = game.unlockedHeroes.map((hero) => {
            const completed = progression.getHeroMastery(hero.id).completed;
            const challengeLabels = MASTERY_CHALLENGES
                .map((challenge) => `${completed.includes(challenge.id) ? 'OK' : '--'} ${challenge.name}`)
                .join(' | ');
            return `<div class="mastery-row"><span>${hero.name}</span><strong>${completed.length}/${MASTERY_CHALLENGES.length}</strong><small>${challengeLabels}</small></div>`;
        }).join('');

        panelContent.innerHTML = `
            <section class="profile-command-header">
                <div>
                    <span class="briefing-kicker">ARCHIVO S.H.I.E.L.D.</span>
                    <h2>${title}</h2>
                    <p>Progreso global, contratos, códice y rendimiento operativo de la campaña.</p>
                </div>
                <div class="profile-command-meter" aria-label="Completitud ${completion}%">
                    <b>${completion}%</b>
                    <span>completado</span>
                </div>
            </section>
            <div class="profile-grid">
                <div class="detail-card profile-stat-card"><h3>Progreso</h3><p><span>Mejores oleadas</span><strong>${bestWaves}</strong></p><p><span>Estrellas</span><strong>${game.stars}</strong></p><p><span>Desafios</span><strong>${challenges}/${game.levelsData.length * 2}</strong></p></div>
                <div class="detail-card profile-stat-card"><h3>Plantilla</h3><p><span>Heroes</span><strong>${game.unlockedHeroes.length}</strong></p><p><span>Equipo activo</span><strong>${game.activeTeam.length}/6</strong></p></div>
                <div class="detail-card profile-stat-card"><h3>Composicion</h3><p><span>Sinergias</span><strong>${activeSynergies}</strong></p><p><span>Familias</span><strong>${team.distinctTags || 0}</strong></p><p><span>Despliegue</span><strong>Libre</strong></p></div>
                <div class="detail-card profile-stat-card"><h3>Economia</h3><p><span>Fondos S.H.I.E.L.D.</span><strong>${progression.state.metaCredits} F</strong></p><p><span>Creditos de mision</span><strong>$${Math.floor(game.resourceManager.credits)}</strong></p></div>
                <div class="detail-card"><h3>Zona Marvel</h3><p><span>Mapa</span><strong>${game.currentLevel?.theme?.label || game.currentLevel?.name || 'Mapa'}</strong></p><p><span>Ambiente</span><strong>${game.currentLevel?.theme?.brief || 'Defensa tactica'}</strong></p></div>
                <div class="detail-card"><h3>Rendimiento</h3><p><span>Frame p95</span><strong>${(performance.p95Ms || 0).toFixed(1)} ms</strong></p><p><span>Memoria pico</span><strong>${(performance.peakMemoryMb || 0).toFixed(1)} MB</strong></p><p><span>Pico de entidades</span><strong>${performance.peakEntities || 0}</strong></p><p><span>Proyectiles reciclados</span><strong>${pool.reused || 0}</strong></p></div>
            </div>
            <section class="profile-meta-section"><h3>Maestria heroica</h3>${masteryRows || '<p>Recluta un heroe para iniciar desafios.</p>'}</section>
            <section class="profile-meta-section"><h3>Contratos semanales <span>${weekly.completed}/${weekly.total}</span></h3><div class="weekly-contract-list">${weekly.contracts.map((contract) => this.renderContract(contract)).join('')}</div></section>
            <section class="profile-meta-section"><h3>Retos de agrupacion <span>${synergyChallenges.completed}/${synergyChallenges.total}</span></h3><div class="weekly-contract-list synergy-challenge-list">${synergyChallenges.challenges.slice(0, 8).map((challenge) => this.renderSynergyChallenge(challenge)).join('')}</div></section>
            <section class="profile-meta-section"><h3>Codice descubierto</h3><div class="codex-summary">${Object.entries(codex).map(([key, value]) => `<span><b>${value.found}/${value.total}</b>${({ heroes: 'Heroes', enemies: 'Enemigos', items: 'Objetos', factions: 'Facciones', mechanics: 'Mecanicas' })[key]}</span>`).join('')}</div></section>
            <section class="profile-meta-section"><h3>Historial</h3><div class="codex-summary"><span><b>${statistics.missions}</b>Misiones</span><span><b>${statistics.victories}</b>Victorias</span><span><b>${statistics.waves}</b>Oleadas</span><span><b>${statistics.enemiesDefeated}</b>Enemigos</span><span><b>${statistics.damageDealt}</b>Dano</span></div></section>
            <section class="profile-meta-section"><h3>Codigos compartibles</h3><div class="build-code-panel"><div><button class="btn-primary ghost" id="copy-build-code"><i class="fas fa-share-nodes"></i> Copiar build</button><button class="btn-primary ghost" id="copy-replay-code"><i class="fas fa-film"></i> Copiar replay</button></div><textarea id="build-code-output" readonly rows="2" aria-label="Codigo compartible"></textarea></div></section>
            <section class="profile-meta-section"><h3>Logros</h3><div class="achievement-list">${Object.entries(ACHIEVEMENT_CATALOG).map(([id, achievement]) => this.renderAchievement(id, achievement, progression.state.achievements.includes(id))).join('')}</div></section>
            <div class="release-notice"><strong>Super Hero TD v${APP_VERSION}</strong><span>${FAN_PROJECT_NOTICE}</span></div>
        `;
        this.bindListeners();
    }

    renderContract(contract) {
        return `
            <article class="${contract.completed ? 'completed' : ''}">
                <div><strong>${contract.title}</strong><small>${contract.group} | +${contract.reward} F</small></div>
                <p>${contract.goal}</p>
                <b>${contract.completed ? 'Cobrado' : 'Pendiente'}</b>
            </article>
        `;
    }

    renderSynergyChallenge(challenge) {
        return `
            <article class="${challenge.completed ? 'completed' : ''} ${challenge.active ? 'active' : ''}">
                <div><strong>${challenge.title}</strong><small>${challenge.type === 'family' ? 'Agrupacion' : 'Pareja'} | +${challenge.reward} F</small></div>
                <p>${challenge.goal}</p>
                <b>${challenge.completed ? 'Cobrado' : challenge.active ? 'Activo' : 'Pendiente'}</b>
            </article>
        `;
    }

    renderAchievement(id, achievement, unlocked) {
        return `<span class="${unlocked ? 'unlocked' : ''}" title="${achievement.description}" data-achievement="${id}">${unlocked ? 'OK' : '--'} ${achievement.label}</span>`;
    }

    bindListeners() {
        const button = this.ui.panelContent.querySelector('#copy-build-code');
        const replayButton = this.ui.panelContent.querySelector('#copy-replay-code');
        const output = this.ui.panelContent.querySelector('#build-code-output');
        button?.addEventListener('click', async () => {
            const code = this.ui.game.progression.exportBuildCode();
            await this.writeCode(output, code, 'Build copiada al portapapeles', 'Codigo de build generado');
        });
        replayButton?.addEventListener('click', async () => {
            const code = this.ui.game.replaySystem.exportReplayCode({
                buildCode: this.ui.game.progression.exportBuildCode(),
                summary: this.ui.game.progression.state.lastMissionSummary
            });
            await this.writeCode(output, code, 'Replay copiado al portapapeles', 'Codigo de replay generado');
        });
    }

    async writeCode(output, code, copiedMessage, fallbackMessage) {
        output.value = code;
        output.select();
        try {
            if (!globalThis.navigator?.clipboard) throw new Error('Clipboard no disponible');
            await globalThis.navigator.clipboard.writeText(code);
            this.ui.showToast(copiedMessage, 'success');
        } catch {
            this.ui.showToast(fallbackMessage, 'info');
        }
    }
}
