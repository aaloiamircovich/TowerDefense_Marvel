import { GameLoop } from './core/GameLoop.js';
import { Loader } from './utils/Loader.js';
import { UIManager } from './systems/UIManager.js';
import { InputManager } from './core/InputManager.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { WaveManager } from './systems/WaveManager.js';
import { normalizeLevelPath } from './utils/PathUtils.js';
import { AssetPreloader } from './rendering/AssetPreloader.js';
import { ProgressionManager } from './systems/ProgressionManager.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { MissionSystem } from './systems/MissionSystem.js';
import { GameModeSystem } from './systems/GameModeSystem.js';
import { ReplaySystem } from './systems/ReplaySystem.js';
import { registerPwa } from './pwa/register.js';
import { getFixedDifficultyKey, isLevelUnlockedByStars } from './utils/LevelProgression.js';

function escapeModalText(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function showGameConfirm({
    eyebrow = 'Operacion critica',
    title = 'Confirmar accion',
    message = '',
    confirmLabel = 'Aceptar',
    cancelLabel = 'Cancelar',
    tone = 'warning'
} = {}) {
    return new Promise((resolve) => {
        document.querySelector('.game-confirm-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.className = `game-confirm-overlay game-confirm-overlay--${tone}`;
        overlay.innerHTML = `
            <section class="game-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="game-confirm-title" aria-describedby="game-confirm-message">
                <div class="game-confirm-icon" aria-hidden="true"><i class="fas fa-triangle-exclamation"></i></div>
                <div class="game-confirm-copy">
                    <span class="briefing-kicker">${escapeModalText(eyebrow)}</span>
                    <h2 id="game-confirm-title">${escapeModalText(title)}</h2>
                    <p id="game-confirm-message">${escapeModalText(message)}</p>
                </div>
                <div class="game-confirm-actions">
                    <button class="game-confirm-cancel" type="button">${escapeModalText(cancelLabel)}</button>
                    <button class="game-confirm-accept" type="button">${escapeModalText(confirmLabel)}</button>
                </div>
            </section>
        `;

        const acceptButton = overlay.querySelector('.game-confirm-accept');
        const cancelButton = overlay.querySelector('.game-confirm-cancel');
        let settled = false;
        const close = (confirmed) => {
            if (settled) return;
            settled = true;
            document.removeEventListener('keydown', onKeydown);
            overlay.classList.add('closing');
            window.setTimeout(() => overlay.remove(), 150);
            resolve(confirmed);
        };
        const onKeydown = (event) => {
            if (event.key === 'Escape') close(false);
        };

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) close(false);
        });
        cancelButton?.addEventListener('click', () => close(false), { once: true });
        acceptButton?.addEventListener('click', () => close(true), { once: true });
        document.addEventListener('keydown', onKeydown);
        document.body.appendChild(overlay);
        window.requestAnimationFrame(() => cancelButton?.focus());
    });
}

window.showGameConfirm = showGameConfirm;

async function initGame() {
    let ui = null;
    setBootStatus('Preparando nucleo tactico...', 8);
    try {
        const game = new GameLoop('gameCanvas');
        window.__SUPER_HERO_TD_GAME__ = game;
        ui = new UIManager(game);
        const resources = new ResourceManager(game, 20, 650);

        game.uiManager = ui;
        game.resourceManager = resources;

        setBootStatus('Cargando datos de heroes, mapas y oleadas...', 24);
        const data = await Loader.loadManifest({
            heroes: './data/heroes.json',
            enemies: './data/enemies.json',
            waves: './data/waves.json',
            levels: './data/levels.json',
            items: './data/items.json',
            evolutionVisuals: './data/evolutionVisuals.json'
        });

        if (!data.heroes || !data.enemies || !data.levels || !data.items) {
            throw new Error('Faltan datos esenciales o algún JSON tiene errores de sintaxis.');
        }

        game.heroDatabase = data.heroes;
        game.enemyDatabase = data.enemies;
        game.itemDatabase = data.items;
        game.evolutionVisualDatabase = data.evolutionVisuals || {};
        game.levelsData = data.levels;
        game.waveData = data.waves || [];
        game.unlockedHeroes = [];
        game.activeTeam = [];
        game.ownedItems = [];
        game.stars = 0;
        game.completedWaves = [];
        game.progression = new ProgressionManager();
        game.progression.initialize(game, data);
        game.modeSystem = new GameModeSystem(game, game.progression);
        game.replaySystem = new ReplaySystem(game);
        game.shopSystem = new ShopSystem(game, game.progression);
        game.missionSystem = new MissionSystem(game);
        game.assetPreloader = new AssetPreloader();
        game.isLevelUnlocked = (levelConfig) => {
            const index = game.levelsData.findIndex((level) => level.id === levelConfig?.id);
            return index <= 0 || isLevelUnlockedByStars(index, game.stars || game.progression?.getTotalStars?.() || 0);
        };

        const input = new InputManager(game.canvas, game, ui, resources);
        game.inputManager = input;

        game.loadLevel = (levelConfig, options = {}) => {
            if (!levelConfig) throw new Error('Nivel no encontrado.');
            if (!options.ignoreUnlock && !game.isLevelUnlocked(levelConfig)) {
                ui.showToast('Mapa bloqueado: consigue más estrellas en la campaña.', 'warning');
                levelConfig = game.levelsData[0];
            }

            if (!options.preserveMode) {
                game.modeSystem.setCampaign();
                game.progression.syncGame();
            }

            game.currentLevel = levelConfig;
            if (!options.preserveMode) {
                game.progression.state.lastLevelId = levelConfig.id;
                game.progression.save();
            }
            game.difficulty = getFixedDifficultyKey(levelConfig);
            game.heroes = [];
            game.enemies = [];
            game.selectedUnit = null;
            game.clearProjectiles();
            game.vfx.clear();
            game.completedWaves = [];
            game.isGameOver = false;
            game.missionSummaryRecorded = false;
            game.gridSize = levelConfig.rendering?.tileSize || 40;
            game.path = normalizeLevelPath(levelConfig, game.canvas.width, game.canvas.height);
            document.body.dataset.levelTheme = levelConfig.theme?.id || 'new-york';
            game.generateLevelMap();
            game.missionSystem.loadLevel(levelConfig);
            game.assetPreloader?.preloadTeamForLevel(game.activeTeam, levelConfig);
            game.waveManager = new WaveManager(game, data.enemies, data.waves);
            game.resourceManager.reset(20, game.progression?.getCredits?.() ?? 650);
            game.modeSystem.configureRun();
            game.replaySystem.reset(`${game.modeSystem.getSeed() || 'campaign'}:${levelConfig.id}`, levelConfig.id, game.modeSystem.modeId);
            ui.showToast(`${levelConfig.name} cargado`, 'info');
            ui.updateLevelTheme(levelConfig);
        };

        const starterPool = [
            data.heroes.black_widow,
            data.heroes.hawkeye,
            data.heroes.korg
        ].filter(Boolean);

        const rawSavedLevel = data.levels.find((level) => level.id === game.progression.state.lastLevelId);
        const savedLevel = rawSavedLevel && game.isLevelUnlocked(rawSavedLevel) ? rawSavedLevel : data.levels[0];
        setBootStatus('Precargando equipo inicial...', 62);
        await game.assetPreloader.preloadTeamForLevel([...game.activeTeam, ...starterPool], savedLevel);

        setBootStatus('Abriendo la primera operacion...', 86);
        game.loadLevel(savedLevel);

        if (game.progression.recoveredFromCorruptSave) {
            ui.showToast('Guardado danado recuperado. Se restauro un perfil seguro.', 'warning');
        }

        if (starterPool.length === 0) {
            throw new Error('No se encontraron héroes iniciales.');
        }

        const startStarterSelection = () => {
            hideStartScreen();
            ui.renderStarterSelector(starterPool, (chosen) => {
                game.progression.startProfile(chosen.id);
                game.assetPreloader?.preloadHeroes([chosen]);
                ui.renderHeroRoster(game.activeTeam, (hero) => input.setPlacementMode(hero));
                game.waveManager?.refreshWaveIntel?.();
                ui.showToast(`${chosen.name} se unió al equipo`, 'success');
                game.start();
            });
        };

        const continueRun = () => {
            hideStartScreen();
            if (game.unlockedHeroes.length === 0) {
                startStarterSelection();
                return;
            }
            ui.renderHeroRoster(game.activeTeam, (hero) => input.setPlacementMode(hero));
            game.waveManager?.refreshWaveIntel?.();
            game.start();
        };

        const createNewRun = async () => {
            const hasProgress = game.unlockedHeroes.length > 0
                || game.progression.getTotalStars?.() > 0
                || game.progression.state.ownedItemIds?.length > 0;
            if (hasProgress) {
                const confirmed = await showGameConfirm({
                    title: 'Nueva partida',
                    message: 'Crear una nueva partida reinicia el progreso guardado. Queres continuar?',
                    confirmLabel: 'Si, reiniciar',
                    cancelLabel: 'Cancelar'
                });
                if (!confirmed) return;
            }
            game.pause();
            game.progression.resetAllProgress();
            game.loadLevel(data.levels[0], { ignoreUnlock: true });
            startStarterSelection();
        };

        setBootStatus('Operacion lista', 100);
        hideBootScreen();
        showStartScreen({
            hasSave: game.unlockedHeroes.length > 0,
            onContinue: continueRun,
            onNewGame: createNewRun,
            onOptions: () => ui.openPanel('settings')
        });
    } catch (error) {
        hideBootScreen();
        document.body.dataset.appState = 'fatal';
        ui?.showFatalError(error);
        console.error('Detalle del fallo:', error);
    }
}

function setBootStatus(message, progress = 12) {
    document.body.dataset.appState = 'loading';
    const status = document.getElementById('boot-status');
    if (status) status.textContent = message;
    const progressBar = document.getElementById('boot-progress');
    if (progressBar) progressBar.style.width = `${Math.max(6, Math.min(100, Number(progress) || 12))}%`;
}

function hideBootScreen() {
    document.body.dataset.appState = 'ready';
}

function setStartScreenView(view = 'home') {
    const screen = document.getElementById('start-screen');
    if (!screen) return;
    screen.dataset.view = view;
    screen.querySelectorAll('[data-start-panel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', panel.dataset.startPanel === view ? 'false' : 'true');
    });
}

function showStartScreen({ hasSave = false, onContinue, onNewGame, onOptions } = {}) {
    const screen = document.getElementById('start-screen');
    if (!screen) return;

    document.body.classList.add('title-screen-active');
    screen.classList.remove('hidden');
    setStartScreenView('home');

    const playButton = document.getElementById('start-play-btn');
    const optionsButton = document.getElementById('start-options-btn');
    const continueButton = document.getElementById('start-continue-btn');
    const newGameButton = document.getElementById('start-new-game-btn');
    const backButtons = screen.querySelectorAll('[data-start-back]');

    if (continueButton) {
        const continueTooltip = hasSave ? 'Continuar la partida guardada' : 'No hay una partida guardada para continuar';
        continueButton.disabled = !hasSave;
        continueButton.setAttribute('aria-disabled', String(!hasSave));
        continueButton.setAttribute('aria-label', hasSave ? 'Continuar partida guardada' : 'Continuar no disponible: sin partida guardada');
        continueButton.title = continueTooltip;
        continueButton.dataset.tooltip = continueTooltip;
    }

    playButton?.addEventListener('click', () => setStartScreenView('play'));
    optionsButton?.addEventListener('click', () => onOptions?.());
    continueButton?.addEventListener('click', () => {
        if (!continueButton.disabled) onContinue?.();
    });
    newGameButton?.addEventListener('click', () => onNewGame?.());
    backButtons.forEach((button) => button.addEventListener('click', () => setStartScreenView('home')));

    window.requestAnimationFrame(() => playButton?.focus());
}

function hideStartScreen() {
    document.body.classList.remove('title-screen-active');
    document.getElementById('start-screen')?.classList.add('hidden');
}

initGame();
registerPwa();
