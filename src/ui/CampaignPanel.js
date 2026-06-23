import { GAME_MODES } from '../systems/GameModeSystem.js';

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

        panelContent.querySelectorAll('.difficulty-btn').forEach((button) => {
            button.addEventListener('click', () => {
                game.progression.setDifficulty(button.dataset.level, button.dataset.value);
                game.audio?.play('ui');
                this.render(title);
            });
        });
        panelContent.querySelectorAll('.btn-load-map').forEach((button) => {
            button.addEventListener('click', () => {
                const level = game.levelsData[Number(button.dataset.index)];
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
        this.ui.panelContent.innerHTML = `<section class="mission-briefing">
            <span class="briefing-kicker">OPERACIÓN ESPECIAL</span>
            <h2>${mode.name}</h2>
            <p class="briefing-copy">${mode.description}</p>
            <div class="briefing-mechanic"><b>Reglas independientes</b><span>La puntuación, oleada y resultado se guardan fuera de la campaña.</span></div>
            <div class="briefing-objectives"><div><span>Objetivo</span><small>${snapshot.detail}</small><b>Récord ${snapshot.best}</b></div></div>
            <button class="btn-primary" id="deploy-mode">DESPLEGAR EQUIPO</button>
        </section>`;
        document.getElementById('deploy-mode')?.addEventListener('click', () => this.ui.closePanel());
    }

    renderMapCard(level, index) {
        const progress = this.ui.game.progression.getMapProgress(level.id);
        return `<article class="map-card ${this.ui.game.currentLevel?.id === level.id ? 'active' : ''}">
            <strong>${level.name}</strong>
            <span>Mejor oleada ${progress.bestWave} · ${'★'.repeat(progress.stars)}${'☆'.repeat(3 - progress.stars)}</span>
            <small>${level.description}</small>
            <em>${level.theme?.brief || ''}</em>
            <div class="map-mechanic"><b>${level.mission?.mechanic?.label || 'Defensa táctica'}</b><span>${level.mission?.mechanic?.description || ''}</span></div>
            <div class="difficulty-switch" aria-label="Dificultad">
                ${[['easy', 'Fácil'], ['normal', 'Normal'], ['hard', 'Difícil']].map(([value, label]) => `<button class="difficulty-btn ${progress.difficulty === value ? 'active' : ''}" data-level="${level.id}" data-value="${value}" aria-pressed="${progress.difficulty === value}">${label}</button>`).join('')}
            </div>
            <div class="challenge-row"><span class="${progress.challenges.includes('sin_danos') ? 'done' : ''}">Sin daños</span><span class="${progress.challenges.includes('cazajefes') ? 'done' : ''}">Cazajefes</span>${(level.mission?.objectives || []).map((objective) => `<span class="${progress.missionObjectives.includes(objective.id) ? 'done' : ''}">${objective.label} · ${objective.reward} F</span>`).join('')}</div>
            <button class="btn-load-map btn-primary ghost" data-index="${index}">Jugar</button>
        </article>`;
    }

    renderBriefing(level) {
        const mission = level.mission || {};
        this.ui.panelContent.innerHTML = `
            <section class="mission-briefing">
                <span class="briefing-kicker">${mission.operation || 'Operación táctica'}</span>
                <h2>${level.name}</h2>
                <p class="briefing-copy">${mission.briefing || level.description}</p>
                <blockquote><strong>${mission.speaker || 'S.H.I.E.L.D.'}</strong><span>${mission.dialogue || level.theme?.brief || ''}</span></blockquote>
                <div class="briefing-mechanic"><b>${mission.mechanic?.label || 'Defensa táctica'}</b><span>${mission.mechanic?.description || ''}</span></div>
                <div class="briefing-objectives">
                    ${(mission.objectives || []).map((objective) => `<div><span>${objective.label}</span><small>${objective.description}</small><b>+${objective.reward} F</b></div>`).join('')}
                </div>
                <button class="btn-primary" id="deploy-mission">DESPLEGAR EQUIPO</button>
            </section>
        `;
        document.getElementById('deploy-mission')?.addEventListener('click', () => this.ui.closePanel());
    }
}
