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
import { SkinShopPanel } from '../ui/SkinShopPanel.js';
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
import { PlacementSuggestionPanel } from '../ui/PlacementSuggestionPanel.js';
import { renderSpriteMarkup } from '../ui/SpriteRenderer.js';
import { PerformanceThemeController } from '../ui/PerformanceThemeController.js';
import { getEnemyRoleText, getResistanceText, getTerrainText } from '../ui/UnitInfoText.js';
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
    buildBaseIntegrityIntel,
    buildTacticalContributionModel,
    buildWaveReportActionState,
    buildWaveReportGrade,
    buildWaveReportLesson,
    buildWaveReportState
} from '../ui/WaveReportState.js';
import {
    buildBossHudState,
    buildCombatPressureState,
    buildPressureActionState,
    buildSpawnQueueState
} from '../ui/CombatThreatState.js';
import { buildShopItemInsight, buildShopSetProgress } from '../ui/ShopItemState.js';

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
    buildBaseIntegrityIntel,
    buildTacticalContributionModel,
    buildWaveReportActionState,
    buildWaveReportGrade,
    buildWaveReportLesson,
    buildWaveReportState
} from '../ui/WaveReportState.js';
export {
    buildBossHudState,
    buildCombatPressureState,
    buildPressureActionState,
    buildSpawnQueueState
} from '../ui/CombatThreatState.js';
export { buildShopItemInsight, buildShopSetProgress } from '../ui/ShopItemState.js';
export { ASSET_VERSION, renderSpriteMarkup, versionAssetSource } from '../ui/SpriteRenderer.js';
export { buildLevelThemeState, buildPerformanceTitle, PerformanceThemeController, shouldShowFps } from '../ui/PerformanceThemeController.js';
export { getEnemyRoleText, getResistanceText, getTerrainText } from '../ui/UnitInfoText.js';

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
        this.placementSuggestionPanel = new PlacementSuggestionPanel(this);
        this.performanceThemeController = new PerformanceThemeController(this);
        this.radarPanel = new RadarPanel(this, {
            buildWaveReportState,
            buildWaveReportActionState
        });
        this.shopPanel = new ShopPanel(this, {
            buildShopItemInsight,
            buildShopSetProgress
        });
        this.skinShopPanel = new SkinShopPanel(this);
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
        return this.getPlacementSuggestionPanel().update(state);
    }

    getPlacementSuggestionPanel() {
        if (!this.placementSuggestionPanel) this.placementSuggestionPanel = new PlacementSuggestionPanel(this);
        return this.placementSuggestionPanel;
    }

    renderOnboardingCoach() {
        const coach = document.getElementById('onboarding-coach');
        if (coach) coach.remove();
        return null;
    }

    shouldShowFps() {
        return this.getPerformanceThemeController().shouldShowFps();
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
        return this.getPerformanceThemeController().updatePerformance(snapshot, poolStats);
    }

    updateLevelTheme(levelConfig) {
        return this.getPerformanceThemeController().updateLevelTheme(levelConfig);
    }

    getPerformanceThemeController() {
        if (!this.performanceThemeController) this.performanceThemeController = new PerformanceThemeController(this);
        return this.performanceThemeController;
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

    renderShopItem(item, purchased = false) {
        return this.getShopPanel().renderItem(item, purchased);
    }

    buyItem(itemId) {
        return this.getShopPanel().buyItem(itemId);
    }

    renderSkinShop(title = 'Skins') {
        return this.getSkinShopPanel().render(title);
    }

    getSkinShopPanel() {
        if (!this.skinShopPanel) this.skinShopPanel = new SkinShopPanel(this);
        return this.skinShopPanel;
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
        return getTerrainText(terrains);
    }

    getEnemyRole(archetype, isBoss = false) {
        return getEnemyRoleText(archetype, isBoss);
    }

    getResistanceText(unit) {
        return getResistanceText(unit);
    }

    renderSprite(src, name = '') {
        return renderSpriteMarkup(src, name);
    }

    getHeroDisplaySprite(hero) {
        if (!hero) return null;
        return pickHeroDisplaySprite(hero, this.game);
    }
}
