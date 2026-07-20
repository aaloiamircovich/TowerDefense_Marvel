import { GAME_MODES } from '../systems/GameModeSystem.js';
import { getFixedDifficultyKey, getLevelUnlockRequirement, isLevelUnlockedByStars } from '../utils/LevelProgression.js';

export class CampaignPanel {
    constructor(ui) {
        this.ui = ui;
    }

    render(title = 'Mapa') {
        const { game, panelContent } = this.ui;
        panelContent.innerHTML = `
            <h2>${title}</h2>
            <section class="mode-section">
                <div class="section-heading"><strong>Modos de juego</strong><span>Progreso y rankings separados de campaña</span></div>
                <div class="mode-list">${Object.values(GAME_MODES).map((mode) => this.renderModeCard(mode)).join('')}</div>
            </section>
            <div class="map-list">
                ${game.levelsData.map((level, index) => this.renderMapCard(level, index)).join('')}
            </div>
        `;

        panelContent.querySelectorAll('.btn-start-mode').forEach((button) => button.addEventListener('click', () => {
            const mode = GAME_MODES[button.dataset.mode];
            if (!game.modeSystem.start(mode.id)) return;
            this.ui.renderHeroRoster(game.activeTeam, (hero) => game.inputManager.setPlacementMode(hero));
            this.renderModeBriefing(mode);
        }));

        panelContent.querySelectorAll('.btn-load-map').forEach((button) => {
            button.addEventListener('click', () => {
                const level = game.levelsData[Number(button.dataset.index)];
                if (!this.isLevelUnlocked(Number(button.dataset.index))) {
                    game.uiManager?.showToast(`Necesitas ${getLevelUnlockRequirement(Number(button.dataset.index))} estrellas para desbloquear este mapa.`, 'warning');
                    return;
                }
                game.loadLevel(level);
                this.ui.renderHeroRoster(game.activeTeam, (hero) => game.inputManager.setPlacementMode(hero));
                this.renderBriefing(level);
            });
        });
    }

    renderModeCard(mode) {
        const record = this.ui.game.progression.getModeRecord(mode.id);
        return `<article class="mode-card">
            <i class="fas ${mode.icon}"></i>
            <div><strong>${mode.name}</strong><span>${mode.description}</span><small>Récord ${record.bestScore} · oleada ${record.bestWave}</small></div>
            <button class="btn-start-mode btn-primary ghost" data-mode="${mode.id}">Jugar</button>
        </article>`;
    }

    renderModeBriefing(mode) {
        const snapshot = this.ui.game.modeSystem.getSnapshot();
        this.ui.panelContent.innerHTML = `<section class="mission-briefing mode-briefing">
            <div class="briefing-hero">
                <div>
                    <span class="briefing-kicker">OPERACIÓN ESPECIAL</span>
                    <h2>${mode.name}</h2>
                    <p class="briefing-copy">${mode.description}</p>
                </div>
                <div class="briefing-sigil" aria-hidden="true"><i class="fas ${mode.icon}"></i></div>
            </div>
            <div class="briefing-signal">
                <span><i class="fas fa-trophy"></i><small>Récord</small><b>${snapshot.best}</b></span>
                <span><i class="fas fa-wave-square"></i><small>Oleada</small><b>${snapshot.wave || 0}</b></span>
                <span><i class="fas fa-star"></i><small>Puntos</small><b>${snapshot.score || 0}</b></span>
            </div>
            <div class="briefing-mechanic"><b>Reglas independientes</b><span>La puntuación, oleada y resultado se guardan fuera de la campaña.</span></div>
            <div class="briefing-objectives"><div><span>Objetivo</span><small>${snapshot.detail}</small><b>Récord ${snapshot.best}</b></div></div>
            <button class="btn-primary" id="deploy-mode">DESPLEGAR EQUIPO</button>
        </section>`;
        document.getElementById('deploy-mode')?.addEventListener('click', () => this.ui.closePanel());
    }

    renderMapCard(level, index) {
        const progress = this.ui.game.progression.getMapProgress(level.id);
        const themeClass = this.getThemeClass(level);
        const requirement = getLevelUnlockRequirement(index);
        const unlocked = this.isLevelUnlocked(index);
        const fixedDifficulty = getFixedDifficultyKey(level);
        return `<article class="map-card ${themeClass} ${this.ui.game.currentLevel?.id === level.id ? 'active' : ''} ${unlocked ? '' : 'locked'}">
            <strong>${level.name}</strong>
            <span>Mejor oleada ${progress.bestWave} · ${progress.stars || 0} estrellas</span>
            <small>${level.description}</small>
            <em>${level.theme?.brief || ''}</em>
            <div class="map-mechanic"><b>${level.mission?.mechanic?.label || 'Defensa táctica'}</b><span>${level.mission?.mechanic?.description || ''}</span></div>
            <div class="map-unlock-row">
                <span class="map-difficulty ${fixedDifficulty}">Dificultad fija: ${level.difficulty}</span>
                <span class="${unlocked ? 'map-unlocked' : 'map-locked'}">${unlocked ? 'Desbloqueado' : `Requiere ${requirement} estrellas`}</span>
            </div>
            <div class="challenge-row"><span class="${progress.challenges.includes('sin_danos') ? 'done' : ''}">Sin daños</span><span class="${progress.challenges.includes('cazajefes') ? 'done' : ''}">Cazajefes</span>${(level.mission?.objectives || []).map((objective) => `<span class="${progress.missionObjectives.includes(objective.id) ? 'done' : ''}">${objective.label} · ${objective.reward} F</span>`).join('')}</div>
            <button class="btn-load-map btn-primary ghost" data-index="${index}" ${unlocked ? '' : 'disabled'}>${unlocked ? 'Jugar' : 'Bloqueado'}</button>
        </article>`;
    }

    renderBriefing(level) {
        const mission = level.mission || {};
        const themeClass = this.getThemeClass(level);
        const progress = this.ui.game.progression.getMapProgress(level.id);
        const signal = this.buildBriefingSignal(level, mission, progress);
        this.ui.panelContent.innerHTML = `
            <section class="mission-briefing ${themeClass}">
                <div class="briefing-hero">
                    <div>
                        <span class="briefing-kicker">${mission.operation || 'Operación táctica'}</span>
                        <h2>${level.name}</h2>
                        <p class="briefing-copy">${mission.briefing || level.description}</p>
                    </div>
                    <div class="briefing-sigil" aria-hidden="true">${this.getThemeMark(level)}</div>
                </div>
                <div class="briefing-signal">
                    ${signal.map((item) => `<span><i class="fas ${item.icon}"></i><small>${item.label}</small><b>${item.value}</b></span>`).join('')}
                </div>
                <div class="briefing-grid">
                    <blockquote><strong>${mission.speaker || 'S.H.I.E.L.D.'}</strong><span>${mission.dialogue || level.theme?.brief || ''}</span></blockquote>
                    <div class="briefing-mechanic"><b>${mission.mechanic?.label || 'Defensa táctica'}</b><span>${mission.mechanic?.description || ''}</span></div>
                </div>
                <div class="briefing-objectives">
                    ${(mission.objectives || []).map((objective) => `<div><span>${objective.label}</span><small>${objective.description}</small><b>+${objective.reward} F</b></div>`).join('')}
                </div>
                <button class="btn-primary" id="deploy-mission">DESPLEGAR EQUIPO</button>
            </section>
        `;
        document.getElementById('deploy-mission')?.addEventListener('click', () => this.ui.closePanel());
    }

    getThemeClass(level) {
        return `map-theme-${(level.theme?.id || 'default').replace(/[^a-z0-9]+/g, '-')}`;
    }

    getThemeMark(level) {
        const marks = {
            'new-york': 'NY',
            avengers: 'A',
            wakanda: 'W',
            sanctum: 'III',
            'x-mansion': 'X',
            knowhere: 'K',
            latveria: 'LV',
            asgard: 'A',
            'dark-dimension': 'VOID',
            'savage-land': 'SL',
            'the-raft': 'R'
        };
        return marks[level.theme?.id] || 'TD';
    }

    buildBriefingSignal(level, mission, progress) {
        return [
            { icon: 'fa-location-dot', label: 'Zona', value: level.theme?.label || level.name },
            { icon: 'fa-shield-halved', label: 'Sistema', value: mission.mechanic?.label || 'Defensa' },
            { icon: 'fa-star', label: 'Estrellas', value: progress.stars || 0 },
            { icon: 'fa-flag-checkered', label: 'Mejor', value: `Oleada ${progress.bestWave || 0}` }
        ];
    }

    isLevelUnlocked(index) {
        return isLevelUnlockedByStars(index, this.ui.game.stars || this.ui.game.progression?.getTotalStars?.() || 0);
    }
}
