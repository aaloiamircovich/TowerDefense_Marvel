import { CampaignPanel } from '../ui/CampaignPanel.js';
import { ProfilePanel } from '../ui/ProfilePanel.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import { TooltipController } from '../ui/TooltipController.js';
import { PanelDialogController } from '../ui/PanelDialogController.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { TeamBuilderPanel } from '../ui/TeamBuilderPanel.js';
import { ModePanel } from '../ui/ModePanel.js';
import { WaveReportPanel } from '../ui/WaveReportPanel.js';
import { RadarPanel } from '../ui/RadarPanel.js';
import { ShopPanel } from '../ui/ShopPanel.js';
import { StarterPanel } from '../ui/StarterPanel.js';
import { EndStatePanel } from '../ui/EndStatePanel.js';
import { HeroRosterPanel } from '../ui/HeroRosterPanel.js';
import { HeroDetailsPanel } from '../ui/HeroDetailsPanel.js';
import { HeroUpgradeController } from '../ui/HeroUpgradeController.js';
import { WavePreviewPanel } from '../ui/WavePreviewPanel.js';
import { EnemyInfoPanel } from '../ui/EnemyInfoPanel.js';
import { CombatPressurePanel } from '../ui/CombatPressurePanel.js';
import { ThreatHudPanel } from '../ui/ThreatHudPanel.js';
import { MissionStatusPanel } from '../ui/MissionStatusPanel.js';
import { ToastPanel } from '../ui/ToastPanel.js';
import { TopHudPanel } from '../ui/TopHudPanel.js';
import { SET_BONUSES } from './ItemEffectSystem.js';
import { getAllowedTerrainLabels } from '../utils/TerrainRules.js';
import { pickHeroDisplaySprite } from '../utils/HeroVisuals.js';
import { TARGETING_PRIORITIES, buildTargetingControlState, getNextTargetingPriority } from '../utils/TargetingPriority.js';
import { buildBossCountdownState, buildWaveLaunchState, formatHudResource } from '../ui/HudState.js';
import { buildPanelNavigationMarkup } from '../ui/PanelNavigation.js';
import { buildEnemyIntel, buildEnemyTraitPreview, getEnemyRoleLabel } from '../ui/EnemyIntelState.js';
import {
    buildHeroCombatIdentity,
    evaluateHeroWaveFit
} from '../ui/HeroTacticsState.js';
import {
    buildBossMilestoneState,
    buildCounterCoverageModel,
    buildRosterWaveFitView,
    buildStatusLegendModel,
    buildStealthCoverageState,
    buildWaveCounterBrief,
    buildWaveDamageCheckMeter,
    buildWavePrepActionControl,
    buildWavePreparationPlan
} from '../ui/WaveTacticsState.js';
import {
    buildLeakIntel,
    buildTacticalContributionModel,
    buildWaveReportActionState,
    buildWaveReportGrade,
    buildWaveReportLesson,
    buildWaveReportState
} from '../ui/WaveReportState.js';

export { TARGETING_PRIORITIES, buildTargetingControlState, getNextTargetingPriority } from '../utils/TargetingPriority.js';
export { buildBossCountdownState, buildWaveLaunchState, formatHudResource } from '../ui/HudState.js';
export { buildPanelNavigationMarkup } from '../ui/PanelNavigation.js';
export { buildEnemyIntel, buildEnemyTraitPreview } from '../ui/EnemyIntelState.js';
export { buildHeroCombatIdentity, evaluateHeroWaveFit } from '../ui/HeroTacticsState.js';
export {
    buildBossMilestoneState,
    buildCounterCoverageModel,
    buildRosterWaveFitView,
    buildStatusLegendModel,
    buildStealthCoverageState,
    buildWaveCounterBrief,
    buildWaveDamageCheckMeter,
    buildWavePrepActionControl,
    buildWavePreparationPlan,
    TACTICAL_COUNTER_LEGEND
} from '../ui/WaveTacticsState.js';
export {
    buildLeakIntel,
    buildTacticalContributionModel,
    buildWaveReportActionState,
    buildWaveReportGrade,
    buildWaveReportLesson,
    buildWaveReportState
} from '../ui/WaveReportState.js';

const ASSET_VERSION = 'evolution-enemy-sprites-20260812';

function versionAssetSource(source) {
    if (!source?.startsWith?.('assets/images/')) return source;
    return `${source}${source.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;
}

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function buildShopItemInsight(item = {}, summary = null) {
    const effects = item.effects || {};
    const reasons = [];
    const add = (condition, label) => {
        if (condition && !reasons.includes(label)) reasons.push(label);
    };

    add(effects.detectStealth && (summary?.stealthCount > 0 || (summary?.roles || []).includes('stealth')), 'cubre sigilo');
    add((effects.armorPenetration || effects.armorBreakChance || effects.armorDamagePct) && (summary?.armoredCount > 0 || summary?.barrierCount > 0 || (summary?.roles || []).some((role) => ['tank', 'shield'].includes(role))), 'rompe blindaje');
    add((effects.slowChance || effects.stunChance) && ((summary?.roles || []).includes('runner') || Number(summary?.fastest || 0) >= 90), 'frena corredores');
    add((effects.damagePct || effects.fireRatePct || effects.critChance || effects.critDamageBonus || effects.consecutiveDamagePct || effects.bossDamagePct) && (summary?.hasBoss || Number(summary?.pressureScore || 0) >= 16), 'sube DPS');
    add((effects.chainCount || effects.splashRadius) && Number(summary?.total || 0) >= 8, 'limpia grupos');
    add(effects.rangePct && ((summary?.roles || []).includes('flying') || Number(summary?.fastest || 0) >= 90), 'mejora cobertura');
    add(effects.allowWater || effects.allowGrass || effects.allowMountain, 'abre posiciones');
    add(effects.onHitCredit || effects.onHitCreditPct, 'economia por impacto');
    add(effects.burnChance || effects.poisonChance || effects.curseChance || effects.statusDamagePct, 'escala con estados');
    add(effects.lowLifeDamagePct || effects.lowLifeFireRatePct, 'seguro de base');

    const setName = SET_BONUSES[item.set]?.name || item.set || 'sin set';
    if (reasons.length < 3 && item.set) reasons.push(`set ${setName}`);
    const tone = reasons.some((reason) => ['cubre sigilo', 'rompe blindaje', 'frena corredores', 'sube DPS'].includes(reason))
        ? 'counter'
        : item.tier >= 3 ? 'power' : 'utility';
    return {
        tone,
        label: reasons[0] || 'mejora versatil',
        reasons: reasons.slice(0, 3),
        setName
    };
}

export function buildShopSetProgress(item = {}, ownedItemIds = [], equippedItems = {}, itemDatabase = {}) {
    return null;
}

function getPathLength(path = []) {
    if (!Array.isArray(path) || path.length < 2) return 0;
    let total = 0;
    for (let index = 1; index < path.length; index++) {
        total += Math.hypot(path[index].x - path[index - 1].x, path[index].y - path[index - 1].y);
    }
    return total;
}

export function buildCombatPressureState(enemies = [], path = [], waveActive = false) {
    const active = enemies.filter((enemy) => enemy?.isAlive && !enemy.hasReachedEnd);
    if (!waveActive || active.length === 0) {
        return {
            id: 'clear',
            label: waveActive ? 'Ruta despejada' : 'Sin oleada',
            advice: waveActive ? 'Mantén la formación.' : 'Prepara la siguiente oleada.',
            progress: 0,
            activeCount: active.length,
            dangerCount: 0,
            leadEnemyName: '',
            signature: `clear:${waveActive}:${active.length}`
        };
    }

    const pathLength = getPathLength(path);
    const projected = active.map((enemy) => {
        const progress = pathLength > 0 ? Math.max(0, Math.min(1, (enemy.distanceTravelled || 0) / pathLength)) : 0;
        return { enemy, progress };
    }).sort((a, b) => b.progress - a.progress);

    const lead = projected[0];
    const dangerCount = projected.filter(({ progress }) => progress >= 0.78).length;
    const score = lead.progress + dangerCount * 0.08 + Math.min(0.16, active.length * 0.012);

    let state = { id: 'holding', label: 'Controlada', advice: 'Sostén daño y ahorra si puedes.' };
    if (score >= 0.92 || lead.progress >= 0.9) state = { id: 'critical', label: 'Base critica', advice: 'Pausa, mejora o reposiciona ya.' };
    else if (score >= 0.72 || dangerCount > 0) state = { id: 'warning', label: 'Presión alta', advice: 'Refuerza la base o activa control.' };
    else if (score >= 0.48) state = { id: 'watch', label: 'Vigilar ruta', advice: 'El frente avanza; prepara mejora.' };

    const progress = Math.round(lead.progress * 100);
    return {
        ...state,
        progress,
        activeCount: active.length,
        dangerCount,
        leadEnemyName: lead.enemy.name || 'Enemigo',
        signature: `${state.id}:${progress}:${active.length}:${dangerCount}:${lead.enemy.uid || lead.enemy.name || ''}`
    };
}

export function buildBossHudState(enemies = [], waveActive = false) {
    if (!waveActive) return null;
    const boss = (enemies || [])
        .filter((enemy) => enemy?.isAlive && !enemy.hasReachedEnd && enemy.isBoss)
        .sort((a, b) => (b.threat || 0) - (a.threat || 0) || (b.maxHp || 0) - (a.maxHp || 0))[0];
    if (!boss) return null;

    const maxHp = Math.max(1, Number(boss.maxHp || boss.hp || 1));
    const hp = Math.max(0, Math.min(maxHp, Number(boss.hp || 0)));
    const hpPct = Math.round(hp / maxHp * 100);
    const phase = boss.currentPhase || boss.phaseLabel || (boss.phases?.length ? 'Fase activa' : 'Fase inicial');
    return {
        id: boss.uid || boss.id || boss.name || 'boss',
        name: boss.name || boss.config?.name || 'Jefe',
        phase,
        isFinalBoss: Boolean(boss.isFinalBoss || boss.config?.isFinalBoss),
        hp,
        maxHp,
        hpPct,
        threat: Math.max(1, Number(boss.threat || 5)),
        critical: hpPct <= 30
    };
}

export function buildSpawnQueueState(queue = [], spawnTimer = 0, waveActive = false) {
    if (!waveActive || !queue?.length) return null;
    const next = queue[0]?.config || {};
    const delay = Math.max(0, Number(queue[0]?.delay || 0));
    const eta = Math.max(0, delay - Math.max(0, Number(spawnTimer || 0)));
    const threat = Math.max(1, Number(next.threat || 1));
    const danger = next.isBoss || threat >= 5 ? 'critical' : threat >= 4 ? 'high' : threat >= 3 ? 'guarded' : 'low';

    return {
        name: next.name || 'Enemigo',
        eta: Number(eta.toFixed(1)),
        remaining: queue.length,
        threat,
        danger,
        role: next.archetype || (next.isBoss ? 'boss' : 'soldier'),
        isBoss: Boolean(next.isBoss)
    };
}

export function buildPressureActionState(pressureState, heroes = [], credits = 0, levelCost = (level) => level * 120) {
    if (!pressureState || !['watch', 'warning', 'critical'].includes(pressureState.id)) return null;
    const deployed = heroes.filter((hero) => hero?.isAlive !== false);
    if (!deployed.length) {
        return {
            type: 'hint',
            label: 'Sin heroes desplegados',
            reason: 'Coloca defensa antes de que el frente llegue a la base.',
            signature: `hint:none:${pressureState.id}`
        };
    }

    const candidates = deployed.map((hero) => {
        const level = Number(hero.level || hero.config?.level || 1);
        const cost = Number(levelCost(level, 1));
        const stats = hero.getEffectiveStats?.() || hero;
        const damage = Number(stats.damage || hero.damage || 0);
        const fireRate = Number(stats.fireRate || hero.fireRate || 1);
        const range = Number(stats.range || hero.range || 100);
        const control = Number(hero.config?.teamMetrics?.control || hero.teamMetrics?.control || 0);
        const detection = hero.canSeeStealth || stats.canSeeStealth ? 1 : 0;
        const pressureBonus = pressureState.id === 'critical' ? control * 1.2 + range / 120 : control * 0.8;
        return {
            hero,
            cost,
            level,
            score: damage * fireRate + range / 4 + level * 8 + pressureBonus + detection * 10
        };
    }).sort((a, b) => b.score - a.score);

    const affordable = candidates.find((candidate) => candidate.cost <= credits);
    if (affordable) {
        const name = affordable.hero.name || affordable.hero.config?.name || affordable.hero.id || 'Heroe';
        return {
            type: 'upgrade',
            heroId: affordable.hero.id || affordable.hero.config?.id,
            heroName: name,
            cost: affordable.cost,
            label: `Mejorar ${name}`,
            reason: pressureState.id === 'critical' ? 'Respuesta recomendada para proteger la base.' : 'Refuerzo rapido antes de que escale.',
            signature: `upgrade:${affordable.hero.id || name}:${affordable.level}:${affordable.cost}:${Math.floor(credits)}`
        };
    }

    const cheapest = candidates.reduce((best, candidate) => !best || candidate.cost < best.cost ? candidate : best, null);
    const missing = Math.max(0, (cheapest?.cost || 0) - credits);
    return {
        type: 'hint',
        label: `Faltan $${Math.ceil(missing)}`,
        reason: 'Ahorra para la siguiente mejora clave.',
        signature: `hint:${cheapest?.hero?.id || 'none'}:${cheapest?.cost || 0}:${Math.floor(credits)}`
    };
}

export class UIManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.overlay = document.getElementById('panel-overlay');
        this.panelContent = document.getElementById('panel-content');
        this.heroGrid = document.querySelector('.hero-grid');
        this.selectionStatus = document.getElementById('selection-status');
        this.toastEl = document.getElementById('toast');

        this.livesEl = document.getElementById('ui-lives');
        this.creditsEl = document.getElementById('ui-credits');
        this.waveEl = document.getElementById('ui-wave');
        this.bossCountdownEl = document.getElementById('ui-boss-countdown');
        this.levelNameEl = document.getElementById('ui-level-name');
        this.fpsEl = document.getElementById('fps-display');
        this.starsEl = document.getElementById('ui-stars');
        this.operationTitleEl = document.getElementById('operation-title');
        this.operationCopyEl = document.getElementById('operation-copy');
        this.operationKickerEl = document.getElementById('operation-kicker');

        this.shopInitialized = false;
        this.shopSlots = [null, null, null];
        this.itemPool = [];
        this.toastTimer = null;
        this.gachaRevealTimers = [];
        this.lastFocusedElement = null;
        this.nextWaveSummary = null;
        this.activePanelType = null;
        this.combatPressureSignature = '';
        this.profilePanel = new ProfilePanel(this);
        this.campaignPanel = new CampaignPanel(this);
        this.settingsPanel = new SettingsPanel(this);
        this.inventoryPanel = new InventoryPanel(this);
        this.teamBuilderPanel = new TeamBuilderPanel(this);
        this.modePanel = new ModePanel(this);
        this.panelDialogController = new PanelDialogController(this, { buildPanelNavigationMarkup });
        this.toastPanel = new ToastPanel(this);
        this.topHudPanel = new TopHudPanel(this, {
            buildBossCountdownState,
            buildWaveLaunchState,
            formatHudResource
        });
        this.waveReportPanel = new WaveReportPanel(this, {
            buildState: buildWaveReportState,
            buildAction: buildWaveReportActionState
        });
        this.wavePreviewPanel = new WavePreviewPanel(this, {
            buildBossMilestoneState,
            buildCounterCoverageModel,
            buildEnemyIntel,
            buildEnemyTraitPreview,
            buildStatusLegendModel,
            buildStealthCoverageState,
            buildWaveCounterBrief,
            buildWaveDamageCheckMeter,
            buildWavePrepActionControl,
            buildWavePreparationPlan
        });
        this.combatPressurePanel = new CombatPressurePanel(this, {
            buildCombatPressureState,
            buildPressureActionState
        });
        this.threatHudPanel = new ThreatHudPanel({
            buildBossHudState,
            buildSpawnQueueState
        });
        this.missionStatusPanel = new MissionStatusPanel();
        this.radarPanel = new RadarPanel(this, {
            buildWaveReportState,
            buildWaveReportActionState
        });
        this.shopPanel = new ShopPanel(this, {
            buildShopItemInsight,
            buildShopSetProgress
        });
        this.starterPanel = new StarterPanel(this);
        this.endStatePanel = new EndStatePanel(this);
        this.enemyInfoPanel = new EnemyInfoPanel(this, { buildEnemyIntel });
        this.heroUpgradeController = new HeroUpgradeController(this);
        this.heroDetailsPanel = new HeroDetailsPanel(this, {
            buildHeroCombatIdentity,
            buildRosterWaveFitView,
            evaluateHeroWaveFit,
            targetingPriorities: TARGETING_PRIORITIES
        });
        this.heroRosterPanel = new HeroRosterPanel(this, {
            buildTargetingControlState,
            getNextTargetingPriority
        });
        this.tooltipController = new TooltipController();

        this.initListeners();
        this.renderOnboardingCoach();
    }

    initListeners() {
        document.querySelectorAll('.hub-btn').forEach((button) => {
            button.addEventListener('click', () => this.handleHubButtonClick(button.dataset.panel));
        });

        document.getElementById('close-panel-btn')?.addEventListener('click', () => this.closePanel());
        this.overlay?.addEventListener('pointerdown', (event) => this.handlePanelBackdropPointerDown(event));
        document.getElementById('next-wave-btn')?.addEventListener('click', () => {
            if (this.game.waveManager && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
        });

        const btnPause = document.getElementById('btn-pause');
        const btnAuto = document.getElementById('btn-auto');
        const btnSpeed = document.getElementById('btn-speed');

        this.updateSpeedButton(btnSpeed);
        this.updateAutoWaveButton(btnAuto);

        btnPause?.addEventListener('click', () => {
            this.setManualPause(!this.game.isManuallyPaused);
        });

        btnAuto?.addEventListener('click', () => {
            if (!this.game.waveManager) return;
            this.game.waveManager.autoWave = !this.game.waveManager.autoWave;
            this.updateAutoWaveButton(btnAuto);
            if (this.game.waveManager.autoWave && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
        });

        btnSpeed?.addEventListener('click', () => {
            const speeds = [1, 2, 3, 4];
            const nextIndex = (speeds.indexOf(this.game.gameSpeed) + 1) % speeds.length;
            this.game.gameSpeed = speeds[nextIndex];
            this.updateSpeedButton(btnSpeed);
        });

        this.heroGrid?.addEventListener('click', (event) => {
            const quickUpgradeButton = event.target.closest('[data-quick-upgrade-id]');
            if (!quickUpgradeButton || !this.heroGrid.contains(quickUpgradeButton)) return;

            event.preventDefault();
            event.stopPropagation();
            this.quickUpgradeHeroById(quickUpgradeButton.dataset.quickUpgradeId);
        });

        window.addEventListener('pointerdown', () => this.game.audio?.unlock(), { once: true });
        window.addEventListener('keydown', () => this.game.audio?.unlock(), { once: true });
        window.addEventListener('keydown', (event) => this.handleDialogKeydown(event));
    }

    handleHubButtonClick(type) {
        return this.getPanelDialogController().handleHubButtonClick(type);
    }

    openPanel(type) {
        return this.getPanelDialogController().openPanel(type);
    }

    closePanel() {
        return this.getPanelDialogController().closePanel();
    }

    setActiveHubButton(type = null) {
        return this.getPanelDialogController().setActiveHubButton(type);
    }

    showPanelOverlay(showCloseButton = true) {
        return this.getPanelDialogController().showPanelOverlay(showCloseButton);
    }

    hidePanelOverlay() {
        return this.getPanelDialogController().hidePanelOverlay();
    }

    handlePanelBackdropPointerDown(event) {
        return this.getPanelDialogController().handlePanelBackdropPointerDown(event);
    }

    handleDialogKeydown(event) {
        return this.getPanelDialogController().handleDialogKeydown(event);
    }

    getPanelDialogController() {
        if (!this.panelDialogController) this.panelDialogController = new PanelDialogController(this, { buildPanelNavigationMarkup });
        return this.panelDialogController;
    }

    setSelectionStatus(text) {
        if (this.selectionStatus) this.selectionStatus.textContent = text;
    }

    updateSpeedButton(button = document.getElementById('btn-speed')) {
        return this.getTopHudPanel().updateSpeedButton(button);
    }

    updateAutoWaveButton(button = document.getElementById('btn-auto')) {
        return this.getTopHudPanel().updateAutoWaveButton(button);
    }

    setManualPause(paused, announce = true) {
        return this.getTopHudPanel().setManualPause(paused, announce);
    }

    setNextWaveEnabled(enabled, summary = null) {
        return this.getTopHudPanel().setNextWaveEnabled(enabled, summary);
    }

    updatePlacementSuggestion(state = null) {
        const button = document.getElementById('suggested-placement-action');
        if (!button) return;
        const idleLabel = 'Usar celda sugerida';
        if (!state) {
            button.classList.add('hidden');
            button.innerHTML = '';
            button.onclick = null;
            button.setAttribute('aria-label', idleLabel);
            button.title = idleLabel;
            button.dataset.tooltip = idleLabel;
            this.renderOnboardingCoach();
            return;
        }

        const suggestionLabel = `${state.label}. ${state.detail}`;
        button.className = `suggested-placement-action ${state.qualityId || 'solid'}`;
        button.setAttribute('aria-label', suggestionLabel);
        button.title = suggestionLabel;
        button.dataset.tooltip = suggestionLabel;
        button.innerHTML = `
            <i class="fas fa-location-crosshairs"></i>
            <span><strong>${escapeHtml(state.label)}</strong><small>${escapeHtml(state.detail)}</small></span>
            <b>${escapeHtml(state.actionLabel || 'Usar')}</b>
        `;
        button.onclick = () => this.game.inputManager?.confirmSuggestedPlacement?.();
        this.renderOnboardingCoach();
    }

    renderOnboardingCoach() {
        const coach = document.getElementById('onboarding-coach');
        if (coach) coach.remove();
        return null;
    }

    shouldShowFps() {
        return this.game.progression?.state.settings?.showFps === true;
    }

    updateFpsDisplay(text, { warning = false, title = '' } = {}) {
        return this.getTopHudPanel().updateFpsDisplay(text, { warning, title });
    }

    updateUI(lives, credits, wave, fps, stars) {
        return this.getTopHudPanel().updateUI(lives, credits, wave, fps, stars);
    }

    updateBossCountdown(wave = 1) {
        return this.getTopHudPanel().updateBossCountdown(wave);
    }

    getTopHudPanel() {
        if (!this.topHudPanel) {
            this.topHudPanel = new TopHudPanel(this, {
                buildBossCountdownState,
                buildWaveLaunchState,
                formatHudResource
            });
        }
        return this.topHudPanel;
    }

    updateCombatPressure(enemies = [], path = [], waveActive = false) {
        const container = document.getElementById('combat-pressure');
        if (container) {
            container.classList.add('hidden');
            container.innerHTML = '';
        }
        return buildCombatPressureState(enemies, path, waveActive);
    }

    renderCombatPressurePanel(enemies = [], path = [], waveActive = false) {
        return this.getCombatPressurePanel().render(enemies, path, waveActive);
    }

    getCombatPressurePanel() {
        if (!this.combatPressurePanel) {
            this.combatPressurePanel = new CombatPressurePanel(this, {
                buildCombatPressureState,
                buildPressureActionState
            });
        }
        return this.combatPressurePanel;
    }

    updateBossHud(enemies = [], waveActive = false) {
        return this.getThreatHudPanel().updateBoss(enemies, waveActive);
    }

    updateSpawnQueue(queue = [], spawnTimer = 0, waveActive = false) {
        return this.getThreatHudPanel().updateSpawnQueue(queue, spawnTimer, waveActive);
    }

    getThreatHudPanel() {
        if (!this.threatHudPanel) {
            this.threatHudPanel = new ThreatHudPanel({
                buildBossHudState,
                buildSpawnQueueState
            });
        }
        return this.threatHudPanel;
    }

    clearWaveReport() {
        return this.waveReportPanel.clear();
    }

    renderWaveReport(report) {
        return this.waveReportPanel.render(report);
    }

    updatePerformance(snapshot, poolStats = {}) {
        this.updateFpsDisplay(`${Math.round(snapshot.fps)} FPS`, {
            warning: snapshot.p95Ms > 16.67,
            title: `Frame promedio ${snapshot.averageMs.toFixed(2)} ms · p95 ${snapshot.p95Ms.toFixed(2)} ms · pico ${snapshot.peakEntities} entidades · ${poolStats.reused || 0} proyectiles reutilizados`
        });
    }

    updateLevelTheme(levelConfig) {
        if (this.levelNameEl) this.levelNameEl.textContent = levelConfig.theme?.label || levelConfig.name || 'Mapa';
        document.documentElement.style.setProperty('--level-accent', levelConfig.theme?.accent || '#40c9ff');
        if (this.operationTitleEl) this.operationTitleEl.textContent = levelConfig.theme?.label || levelConfig.name || 'Mapa';
        this.game.audio?.setTheme(levelConfig.theme?.id || 'new-york');
    }

    updateMissionStatus(snapshot) {
        return this.getMissionStatusPanel().update(snapshot);
    }

    getMissionStatusPanel() {
        if (!this.missionStatusPanel) this.missionStatusPanel = new MissionStatusPanel();
        return this.missionStatusPanel;
    }

    updateModeStatus(snapshot) {
        return this.modePanel.updateStatus(snapshot);
    }

    showDraftChoice(heroes, onChoose) {
        return this.modePanel.showDraftChoice(heroes, onChoose);
    }

    showModeResult(title, snapshot) {
        return this.modePanel.showResult(title, snapshot);
    }

    showToast(message, type = 'info') {
        return this.getToastPanel().show(message, type);
    }

    getToastPanel() {
        if (!this.toastPanel) this.toastPanel = new ToastPanel(this);
        return this.toastPanel;
    }

    renderWavePreview(uniqueEnemies, modifier = null, faction = null, waveNumber = 1, summary = null) {
        this.getWavePreviewPanel().render(uniqueEnemies, modifier, faction, waveNumber, summary);
    }

    renderWaveDamageCheck(check) {
        return this.getWavePreviewPanel().renderDamageCheck(check);
    }

    getWavePreviewPanel() {
        if (!this.wavePreviewPanel) {
            this.wavePreviewPanel = new WavePreviewPanel(this, {
                buildBossMilestoneState,
                buildCounterCoverageModel,
                buildEnemyIntel,
                buildEnemyTraitPreview,
                buildStatusLegendModel,
                buildStealthCoverageState,
                buildWaveCounterBrief,
                buildWaveDamageCheckMeter,
                buildWavePrepActionControl,
                buildWavePreparationPlan
            });
        }
        return this.wavePreviewPanel;
    }

    inspectUnit(unit, isEnemyFlag = false) {
        if (!unit) return;
        this.tooltipController.hide();

        const isEnemy = isEnemyFlag || (unit.hp !== undefined && unit.takeDamage !== undefined);
        if (isEnemy) {
            this.getEnemyInfoPanel().render(unit);
            return;
        }

        this.game.pause();
        this.showPanelOverlay(true);
        this.renderHeroDetails(unit);
    }

    switchHeroDetailView(hero, view = 'summary', focusTab = false) {
        const nextView = view || 'summary';
        this.renderHeroDetails(hero, nextView);
        if (!focusTab) return;
        this.panelContent.querySelector?.(`[data-view="${nextView}"]`)?.focus?.();
    }

    bindHeroDetailTabs(hero) {
        const tabs = [...this.panelContent.querySelectorAll('.hero-detail-tab')];
        tabs.forEach((button, index) => {
            button.addEventListener('click', () => this.switchHeroDetailView(hero, button.dataset.view || 'summary'));
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
                this.switchHeroDetailView(hero, tabs[nextIndex]?.dataset.view || 'summary', true);
            });
        });
    }

    renderHeroCombatIdentity(hero) {
        return this.getHeroDetailsPanel().renderHeroCombatIdentity(hero);
    }

    renderHeroQuickIdentityStrip(hero) {
        return this.getHeroDetailsPanel().renderHeroQuickIdentityStrip(hero);
    }

    renderTargetingPriorityLegend(currentTargeting = TARGETING_PRIORITIES[0]) {
        return this.getHeroDetailsPanel().renderTargetingPriorityLegend(currentTargeting);
    }

    renderHeroDetails(hero, detailView = 'summary') {
        this.getHeroDetailsPanel().render(hero, detailView);
    }

    getHeroDetailsPanel() {
        if (!this.heroDetailsPanel) {
            this.heroDetailsPanel = new HeroDetailsPanel(this, {
                buildHeroCombatIdentity,
                buildRosterWaveFitView,
                evaluateHeroWaveFit,
                targetingPriorities: TARGETING_PRIORITIES
            });
        }
        return this.heroDetailsPanel;
    }

    getEnemyInfoPanel() {
        if (!this.enemyInfoPanel) this.enemyInfoPanel = new EnemyInfoPanel(this, { buildEnemyIntel });
        return this.enemyInfoPanel;
    }

    getHeroLevel(unit) {
        return this.getHeroUpgradeController().getHeroLevel(unit);
    }

    calculateLevelCost(currentLevel, amount = 1) {
        return this.getHeroUpgradeController().calculateLevelCost(currentLevel, amount);
    }

    getHeroUpgradeCost(unit, amount = 1) {
        return this.getHeroUpgradeController().getHeroUpgradeCost(unit, amount);
    }

    renderHeroLevelPreview(unit, amount = 1) {
        return this.getHeroDetailsPanel().renderHeroLevelPreview(unit, amount);
    }

    getHeroLevelPreviewLabel(unit, amount = 1) {
        return this.getHeroUpgradeController().getHeroLevelPreviewLabel(unit, amount);
    }

    getHeroLevelPreviewRows(unit, amount = 1) {
        return this.getHeroUpgradeController().getHeroLevelPreviewRows(unit, amount);
    }

    formatSignedPreviewValue(value, suffix = '', precision = 0) {
        return this.getHeroUpgradeController().formatSignedPreviewValue(value, suffix, precision);
    }

    getMissionCredits() {
        return this.getHeroUpgradeController().getMissionCredits();
    }

    canAffordHeroUpgrade(unit, amount = 1) {
        return this.getHeroUpgradeController().canAffordHeroUpgrade(unit, amount);
    }

    findDeployedHeroById(heroId) {
        return this.getHeroUpgradeController().findDeployedHeroById(heroId);
    }

    quickUpgradeHeroById(heroId) {
        return this.getHeroUpgradeController().quickUpgradeHeroById(heroId);
    }

    spendMissionCredits(cost) {
        return this.getHeroUpgradeController().spendMissionCredits(cost);
    }

    refreshHeroUpgradeUi(unit) {
        return this.getHeroUpgradeController().refreshHeroUpgradeUi(unit);
    }

    processUpgrade(unit, amount) {
        return this.getHeroUpgradeController().processUpgrade(unit, amount);
    }

    quickUpgradeHero(unit) {
        return this.getHeroUpgradeController().quickUpgradeHero(unit);
    }

    applyHeroLevelUpgrade(unit, amount) {
        return this.getHeroUpgradeController().applyHeroLevelUpgrade(unit, amount);
    }

    getHeroUpgradeController() {
        if (!this.heroUpgradeController) this.heroUpgradeController = new HeroUpgradeController(this);
        return this.heroUpgradeController;
    }

    refillShop() {
        for (let i = 0; i < 3; i++) {
            if (!this.shopSlots[i] && this.itemPool.length > 0) this.shopSlots[i] = this.itemPool.shift();
        }
    }

    setPanelDialogLabel(title = 'Panel del juego') {
        return this.getPanelDialogController().setPanelDialogLabel(title);
    }

    renderPanel(type) {
        return this.getPanelDialogController().renderPanel(type);
    }

    renderPanelNavigation(activeType = '') {
        return this.getPanelDialogController().renderPanelNavigation(activeType);
    }

    renderRadarPanel(title = 'Radar tactico') {
        return this.radarPanel.render(title);
    }

    renderRadarSection(sourceId, title, icon, emptyMessage) {
        return this.radarPanel.renderSection(sourceId, title, icon, emptyMessage);
    }

    bindRadarPanelActions() {
        return this.radarPanel.bindActions();
    }

    getShopPanel() {
        if (!this.shopPanel) {
            this.shopPanel = new ShopPanel(this, {
                buildShopItemInsight,
                buildShopSetProgress
            });
        }
        return this.shopPanel;
    }

    renderShop(title) {
        return this.getShopPanel().render(title);
    }

    formatStatDelta(current, base, suffix = '', decimals = 0) {
        const difference = current - base;
        if (Math.abs(difference) < 0.001) return '';
        const value = Math.abs(difference).toFixed(decimals);
        return `<small class="stat-delta ${difference < 0 ? 'negative' : ''}">${difference > 0 ? '+' : '-'}${value}${suffix}</small>`;
    }

    renderShopItem(item, purchased = false) {
        return this.getShopPanel().renderItem(item, purchased);
    }

    buyItem(itemId) {
        return this.getShopPanel().buyItem(itemId);
    }

    renderSkinShop(title = 'Skins') {
        return this.getShopPanel().renderSkinShop(title);
    }

    renderProfile(title) {
        this.profilePanel.render(title);
    }

    renderMap(title) {
        this.campaignPanel.render(title);
    }

    renderMissionBriefing(level) {
        this.campaignPanel.renderBriefing(level);
    }

    renderSettings(title) {
        this.settingsPanel.render(title);
    }

    getStarterPanel() {
        if (!this.starterPanel) this.starterPanel = new StarterPanel(this);
        return this.starterPanel;
    }

    renderStarterSelector(starters, onSelect) {
        return this.getStarterPanel().render(starters, onSelect);
    }

    getHeroRosterPanel() {
        if (!this.heroRosterPanel) {
            this.heroRosterPanel = new HeroRosterPanel(this, {
                buildTargetingControlState,
                getNextTargetingPriority
            });
        }
        return this.heroRosterPanel;
    }

    renderHeroRoster(activeTeam, onSelect) {
        return this.getHeroRosterPanel().render(activeTeam, onSelect);
    }

    buildGachaRevealSequence(finalHero, count = 12) {
        return this.getShopPanel().buildGachaRevealSequence(finalHero, count);
    }

    renderGachaReveal(result) {
        return this.getShopPanel().renderGachaReveal(result);
    }

    startGachaRevealAnimation(result, onComplete = () => {}) {
        return this.getShopPanel().startGachaRevealAnimation(result, onComplete);
    }

    handleGacha() {
        return this.getShopPanel().handleGacha();
    }

    getEndStatePanel() {
        if (!this.endStatePanel) this.endStatePanel = new EndStatePanel(this);
        return this.endStatePanel;
    }

    showGameOver() {
        this.game.audio?.play('warning');
        return this.getEndStatePanel().showGameOver();
    }

    showVictory() {
        this.game.audio?.play('victory');
        return this.getEndStatePanel().showVictory();
    }

    renderMissionSummary(summary) {
        return this.getEndStatePanel().renderMissionSummary(summary);
    }

    showFatalError(error) {
        return this.getEndStatePanel().showFatalError(error);
    }

    getTerrainText(terrains) {
        return getAllowedTerrainLabels(terrains);
    }

    getEnemyRole(archetype, isBoss = false) {
        return getEnemyRoleLabel(archetype, isBoss);
    }

    getResistanceText(unit) {
        const labels = Object.entries(unit.resistances || {})
            .filter(([, value]) => value > 0)
            .map(([type, value]) => `${type} ${Math.round(value * 100)}%`);
        if (unit.statusResistance > 0) labels.push(`Estados ${Math.round(unit.statusResistance * 100)}%`);
        if (unit.stealth) labels.push('Detección requerida');
        return labels.join(', ') || 'Ninguna';
    }

    renderSprite(src, name = '') {
        const label = String(name || 'Sprite');
        const fallback = label.charAt(0) || '?';
        const safeLabel = escapeHtml(label);
        const safeFallback = escapeHtml(fallback);
        if (!src) return `<span class="sprite-fallback">${safeFallback}</span>`;
        return `<img src="${escapeHtml(versionAssetSource(src))}" alt="${safeLabel}" data-fallback="${safeFallback}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'sprite-fallback', textContent: this.dataset.fallback || '?' }))">`;
    }

    getHeroDisplaySprite(hero) {
        if (!hero) return null;
        return pickHeroDisplaySprite(hero, this.game);
    }
}
