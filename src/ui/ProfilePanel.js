import { APP_VERSION, FAN_PROJECT_NOTICE } from '../config/AppConfig.js';
import { MASTERY_CHALLENGES } from '../systems/MasteryCodexSystem.js';
import { ACHIEVEMENT_CATALOG } from '../systems/ProgressionManager.js';
import { CAMPAIGN_MAX_WAVES, getLevelUnlockRequirement, isLevelUnlockedByStars } from '../utils/LevelProgression.js';

export class ProfilePanel {
    constructor(ui) {
        this.ui = ui;
        this.activeView = 'summary';
        this.title = 'Perfil';
    }

    render(title = 'Perfil', view = this.activeView) {
        this.title = title;
        this.activeView = ['summary', 'contracts', 'codex', 'history'].includes(view) ? view : 'summary';
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
        const contractEmblems = progression.getContractEmblemSnapshot();
        const synergyChallenges = progression.getSynergyChallengeSnapshot(team);
        const statistics = progression.state.statistics;
        const totalStars = this.getTotalStars(game, progression);
        const starTarget = Math.max(1, game.levelsData.length * (game.waveManager?.maxWaves || CAMPAIGN_MAX_WAVES));
        const completion = Math.min(100, Math.round((totalStars / starTarget) * 100));
        const nextUnlock = this.buildNextUnlockStatus(game.levelsData, totalStars);
        const masteryEntries = game.unlockedHeroes.map((hero) => {
            const completed = progression.getHeroMastery(hero.id).completed;
            return { hero, completed, total: MASTERY_CHALLENGES.length };
        });
        const masteryRows = masteryEntries.map((entry) => this.renderMasteryRow(entry)).join('');
        const masteryPreview = [...masteryEntries]
            .sort((a, b) => b.completed.length - a.completed.length || a.hero.name.localeCompare(b.hero.name))
            .slice(0, 6)
            .map((entry) => this.renderMasteryPreview(entry))
            .join('');
        const masteryCompleted = masteryEntries.reduce((total, entry) => total + entry.completed.length, 0);
        const masteryTotal = masteryEntries.length * MASTERY_CHALLENGES.length;
        const codexTotals = Object.values(codex).reduce((total, value) => ({
            found: total.found + Number(value.found || 0),
            total: total.total + Number(value.total || 0)
        }), { found: 0, total: 0 });
        const codexSummary = Object.entries(codex)
            .map(([key, value]) => `<span><b>${value.found}/${value.total}</b>${({ heroes: 'Heroes', enemies: 'Enemigos', items: 'Objetos', factions: 'Facciones', mechanics: 'Mecanicas' })[key]}</span>`)
            .join('');
        const tabs = [
            { id: 'summary', label: 'Resumen', icon: 'fa-chart-pie', badge: `${completion}%`, badgeLabel: `${completion}% completado` },
            { id: 'contracts', label: 'Contratos', icon: 'fa-file-signature', badge: `${weekly.completed}/${weekly.total}`, badgeLabel: `${weekly.completed} de ${weekly.total} contratos` },
            { id: 'codex', label: 'Códice', icon: 'fa-book-open', badge: `${codexTotals.found}/${codexTotals.total}`, badgeLabel: `${codexTotals.found} de ${codexTotals.total} entradas` },
            { id: 'history', label: 'Historial', icon: 'fa-clock-rotate-left', badge: statistics.waves, badgeLabel: `${statistics.waves} oleadas` }
        ];
        const sections = {
            summary: `
                <section class="profile-summary-grid">
                    <article class="profile-meta-section profile-summary-panel">
                        <h3>Maestria heroica <span>${masteryCompleted}/${masteryTotal || 0}</span></h3>
                        <div class="profile-mini-masteries">
                            ${masteryPreview || '<p>Recluta un heroe para iniciar desafios.</p>'}
                        </div>
                        <button class="btn-primary ghost profile-open-tab" data-profile-view="codex" type="button" aria-label="Ver detalle completo del codice" title="Ver detalle completo" data-tooltip="Ver detalle completo del codice"><i class="fas fa-book-open"></i> Ver detalle completo</button>
                    </article>
                    <article class="profile-meta-section profile-summary-panel">
                        <h3>Codice descubierto</h3>
                        <div class="codex-summary profile-codex-strip">${codexSummary}</div>
                        <button class="btn-primary ghost profile-open-tab" data-profile-view="codex" type="button" aria-label="Abrir codice descubierto" title="Abrir codice" data-tooltip="Abrir codice descubierto"><i class="fas fa-layer-group"></i> Abrir codice</button>
                    </article>
                </section>
            `,
            contracts: `
                <section class="profile-meta-section">
                    <h3>Contratos semanales <span>${weekly.completed}/${weekly.total} · racha ${weekly.streak}</span></h3>
                    <div class="weekly-streak-strip">
                        <span><b>${weekly.streak}</b>Actual</span>
                        <span><b>${weekly.bestStreak}</b>Mejor racha</span>
                        <span><b>${weekly.perfectWeeks}</b>Semanas perfectas</span>
                    </div>
                    <div class="weekly-contract-list">${weekly.contracts.map((contract) => this.renderContract(contract)).join('')}</div>
                </section>
                <section class="profile-meta-section">
                    <h3>Emblemas de contrato <span>${contractEmblems.unlocked}/${contractEmblems.total}</span></h3>
                    <div class="contract-emblem-list">${contractEmblems.emblems.map((emblem) => this.renderContractEmblem(emblem)).join('')}</div>
                </section>
                <section class="profile-meta-section"><h3>Retos de agrupacion <span>${synergyChallenges.completed}/${synergyChallenges.total}</span></h3><div class="weekly-contract-list synergy-challenge-list">${synergyChallenges.challenges.slice(0, 8).map((challenge) => this.renderSynergyChallenge(challenge)).join('')}</div></section>
            `,
            codex: `
                <section class="profile-meta-section"><h3>Codice descubierto</h3><div class="codex-summary">${codexSummary}</div></section>
                <section class="profile-meta-section"><h3>Maestria heroica</h3>${masteryRows || '<p>Recluta un heroe para iniciar desafios.</p>'}</section>
                <section class="profile-meta-section"><h3>Logros</h3><div class="achievement-list">${Object.entries(ACHIEVEMENT_CATALOG).map(([id, achievement]) => this.renderAchievement(id, achievement, progression.state.achievements.includes(id))).join('')}</div></section>
            `,
            history: `
                <section class="profile-meta-section"><h3>Historial</h3><div class="codex-summary"><span><b>${statistics.missions}</b>Misiones</span><span><b>${statistics.victories}</b>Victorias</span><span><b>${statistics.waves}</b>Oleadas</span><span><b>${statistics.enemiesDefeated}</b>Enemigos</span><span><b>${statistics.damageDealt}</b>Dano</span></div></section>
                <section class="profile-meta-section"><h3>Codigos compartibles</h3><div class="build-code-panel"><div><button class="btn-primary ghost" id="copy-build-code" type="button" aria-label="Copiar codigo de build" title="Copiar codigo de build" data-tooltip="Copiar build al portapapeles"><i class="fas fa-share-nodes"></i> Copiar build</button><button class="btn-primary ghost" id="copy-replay-code" type="button" aria-label="Copiar codigo de replay" title="Copiar codigo de replay" data-tooltip="Copiar replay al portapapeles"><i class="fas fa-film"></i> Copiar replay</button></div><textarea id="build-code-output" readonly rows="2" aria-label="Codigo compartible"></textarea></div></section>
            `
        };

        panelContent.innerHTML = `
            <section class="profile-command-header">
                <div>
                    <span class="briefing-kicker">ARCHIVO DE MANDO</span>
                    <h2>${title}</h2>
                    <p>Progreso global, contratos, códice y rendimiento operativo de la campaña.</p>
                    <div class="profile-next-unlock" style="--profile-next-progress:${nextUnlock.progress}%">
                        <span><i class="fas fa-route"></i> ${nextUnlock.complete ? 'Ruta completa' : 'Proxima operacion'}</span>
                        <strong>${nextUnlock.name}</strong>
                        <small>${nextUnlock.detail}</small>
                        <em aria-hidden="true"></em>
                    </div>
                </div>
                <div class="profile-command-meter" aria-label="Completitud ${completion}%">
                    <b>${completion}%</b>
                    <span>completado</span>
                </div>
            </section>
            <div class="profile-grid">
                <div class="detail-card profile-stat-card"><h3>Progreso</h3><p><span>Mejores oleadas</span><strong>${bestWaves}</strong></p><p><span>Estrellas</span><strong>${totalStars}</strong></p><p><span>Desafios</span><strong>${challenges}/${game.levelsData.length * 2}</strong></p></div>
                <div class="detail-card profile-stat-card"><h3>Plantilla</h3><p><span>Heroes</span><strong>${game.unlockedHeroes.length}</strong></p><p><span>Equipo activo</span><strong>${game.activeTeam.length}/6</strong></p></div>
                <div class="detail-card profile-stat-card"><h3>Composicion</h3><p><span>Sinergias</span><strong>${activeSynergies}</strong></p><p><span>Familias</span><strong>${team.distinctTags || 0}</strong></p><p><span>Despliegue</span><strong>Libre</strong></p></div>
                <div class="detail-card profile-stat-card"><h3>Economia</h3><p><span>Creditos</span><strong>$${progression.getCredits()}</strong></p></div>
                <div class="detail-card"><h3>Zona Marvel</h3><p><span>Mapa</span><strong>${game.currentLevel?.theme?.label || game.currentLevel?.name || 'Mapa'}</strong></p><p><span>Ambiente</span><strong>${game.currentLevel?.theme?.brief || 'Defensa tactica'}</strong></p></div>
                <div class="detail-card"><h3>Rendimiento</h3><p><span>Frame p95</span><strong>${(performance.p95Ms || 0).toFixed(1)} ms</strong></p><p><span>Memoria pico</span><strong>${(performance.peakMemoryMb || 0).toFixed(1)} MB</strong></p><p><span>Pico de entidades</span><strong>${performance.peakEntities || 0}</strong></p><p><span>Proyectiles reciclados</span><strong>${pool.reused || 0}</strong></p></div>
            </div>
            <nav class="profile-tabs" role="tablist" aria-label="Secciones de perfil">
                ${tabs.map((tab) => `<button id="profile-tab-${tab.id}" class="profile-tab ${this.activeView === tab.id ? 'active' : ''}" data-profile-view="${tab.id}" role="tab" aria-selected="${this.activeView === tab.id}" aria-controls="profile-tab-panel" tabindex="${this.activeView === tab.id ? '0' : '-1'}" aria-label="${tab.label}: ${tab.badgeLabel}" title="${tab.label}: ${tab.badgeLabel}" data-tooltip="${tab.label}: ${tab.badgeLabel}" type="button"><i class="fas ${tab.icon}"></i><span>${tab.label}</span><b class="profile-tab-badge">${tab.badge}</b></button>`).join('')}
            </nav>
            <div id="profile-tab-panel" class="profile-tab-panel profile-view-${this.activeView}" role="tabpanel" aria-labelledby="profile-tab-${this.activeView}">
                ${sections[this.activeView]}
            </div>
            <div class="release-notice"><strong>Super Hero TD v${APP_VERSION}</strong><span>${FAN_PROJECT_NOTICE}</span></div>
        `;
        this.bindListeners();
    }

    getTotalStars(game, progression) {
        const progressionStars = progression?.getTotalStars?.();
        return Number.isFinite(progressionStars) ? progressionStars : (Number(game?.stars) || 0);
    }

    buildNextUnlockStatus(levels = [], totalStars = 0) {
        const stars = Math.max(0, Math.floor(Number(totalStars) || 0));
        const nextIndex = levels.findIndex((_level, index) => !isLevelUnlockedByStars(index, stars));
        if (nextIndex < 0) {
            return {
                complete: true,
                name: 'Campaña desbloqueada',
                detail: levels.length ? `${levels.length} operaciones disponibles` : 'Sin operaciones cargadas',
                progress: 100
            };
        }
        const required = getLevelUnlockRequirement(nextIndex);
        const current = Math.min(required, stars);
        return {
            complete: false,
            name: levels[nextIndex]?.name || 'Operacion clasificada',
            detail: `${Math.max(0, required - current)} estrellas para desbloquear`,
            progress: required > 0 ? Math.round((current / required) * 100) : 100
        };
    }

    renderMasteryRow(entry) {
        const challengeLabels = MASTERY_CHALLENGES
            .map((challenge) => `${entry.completed.includes(challenge.id) ? 'OK' : '--'} ${challenge.name}`)
            .join(' | ');
        return `<div class="mastery-row"><span>${entry.hero.name}</span><strong>${entry.completed.length}/${entry.total}</strong><small>${challengeLabels}</small></div>`;
    }

    renderMasteryPreview(entry) {
        const progress = entry.total ? Math.round((entry.completed.length / entry.total) * 100) : 0;
        return `
            <span class="profile-mastery-chip" style="--mastery-progress:${progress}%">
                <b>${entry.hero.name}</b>
                <small>${entry.completed.length}/${entry.total} desafios</small>
                <i aria-hidden="true"></i>
            </span>
        `;
    }

    renderContract(contract) {
        return `
            <article class="${contract.completed ? 'completed' : ''}">
                <div><strong>${contract.title}</strong><small>${contract.group} | +$${contract.reward}</small></div>
                <p>${contract.goal}</p>
                <b>${contract.completed ? 'Cobrado' : 'Pendiente'}</b>
            </article>
        `;
    }

    renderSynergyChallenge(challenge) {
        return `
            <article class="${challenge.completed ? 'completed' : ''} ${challenge.active ? 'active' : ''}">
                <div><strong>${challenge.title}</strong><small>${challenge.type === 'family' ? 'Agrupacion' : 'Pareja'} | +$${challenge.reward}</small></div>
                <p>${challenge.goal}</p>
                <b>${challenge.completed ? 'Cobrado' : challenge.active ? 'Activo' : 'Pendiente'}</b>
            </article>
        `;
    }

    renderContractEmblem(emblem) {
        return `
            <article class="contract-emblem-card ${emblem.unlocked ? 'unlocked' : ''}">
                <i class="fas ${emblem.icon}" aria-hidden="true"></i>
                <div>
                    <strong>${emblem.label}</strong>
                    <p>${emblem.description}</p>
                </div>
                <b>${emblem.unlocked ? 'Desbloqueado' : `${emblem.progress}/${emblem.required}`}</b>
            </article>
        `;
    }

    renderAchievement(id, achievement, unlocked) {
        return `<span class="${unlocked ? 'unlocked' : ''}" title="${achievement.description}" data-achievement="${id}">${unlocked ? 'OK' : '--'} ${achievement.label}</span>`;
    }

    switchProfileView(view = 'summary', focusTab = false) {
        const nextView = ['summary', 'contracts', 'codex', 'history'].includes(view) ? view : 'summary';
        this.render(this.title, nextView);
        if (!focusTab) return;
        this.ui.panelContent.querySelector?.(`.profile-tab[data-profile-view="${nextView}"]`)?.focus?.();
    }

    bindProfileTabs() {
        const tabs = [...this.ui.panelContent.querySelectorAll('.profile-tab')];
        tabs.forEach((button, index) => {
            button.addEventListener('click', () => this.switchProfileView(button.dataset.profileView || 'summary'));
            button.addEventListener('keydown', (event) => {
                const keyOffset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
                const isEdgeKey = event.key === 'Home' || event.key === 'End';
                if (!keyOffset && !isEdgeKey) return;
                event.preventDefault();
                const nextIndex = event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                        ? tabs.length - 1
                        : (index + keyOffset + tabs.length) % tabs.length;
                this.switchProfileView(tabs[nextIndex]?.dataset.profileView || 'summary', true);
            });
        });
    }

    bindListeners() {
        this.bindProfileTabs();
        this.ui.panelContent.querySelectorAll('.profile-open-tab').forEach((button) => {
            button.addEventListener('click', () => this.switchProfileView(button.dataset.profileView || 'summary'));
        });
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
