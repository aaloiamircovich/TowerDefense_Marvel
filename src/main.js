import { GameLoop } from './core/GameLoop.js';
import { Loader } from './utils/Loader.js';
import { UIManager } from './systems/UIManager.js';
import { InputManager } from './core/InputManager.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { WaveManager } from './systems/WaveManager.js';
import { normalizePath } from './utils/PathUtils.js';
import { AssetPreloader } from './rendering/AssetPreloader.js';
import { ProgressionManager } from './systems/ProgressionManager.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { MissionSystem } from './systems/MissionSystem.js';
import { GameModeSystem } from './systems/GameModeSystem.js';
import { ReplaySystem } from './systems/ReplaySystem.js';
import { registerPwa } from './pwa/register.js';
import { getFixedDifficultyKey, isLevelUnlockedByStars } from './utils/LevelProgression.js';

async function initGame() {
    let ui = null;
    setBootStatus('Preparando nucleo tactico...');
    try {
        const game = new GameLoop('gameCanvas');
        window.__SUPER_HERO_TD_GAME__ = game;
        ui = new UIManager(game);
        const resources = new ResourceManager(game, 20, 650);

        game.uiManager = ui;
        game.resourceManager = resources;

        setBootStatus('Cargando datos de heroes, mapas y oleadas...');
        const data = await Loader.loadManifest({
            heroes: './data/heroes.json',
            enemies: './data/enemies.json',
            waves: './data/waves.json',
            levels: './data/levels.json',
            items: './data/items.json'
        });

        if (!data.heroes || !data.enemies || !data.levels || !data.items) {
            throw new Error('Faltan datos esenciales o algún JSON tiene errores de sintaxis.');
        }

        game.heroDatabase = data.heroes;
        game.enemyDatabase = data.enemies;
        game.itemDatabase = data.items;
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
            game.path = normalizePath(levelConfig.path, game.canvas.width, game.canvas.height);
            document.body.dataset.levelTheme = levelConfig.theme?.id || 'new-york';
            game.generateLevelMap();
            game.missionSystem.loadLevel(levelConfig);
            game.assetPreloader?.preloadTeamForLevel(game.activeTeam, levelConfig);
            game.waveManager = new WaveManager(game, data.enemies, data.waves);
            game.resourceManager.reset(20, 650);
            game.modeSystem.configureRun();
            game.replaySystem.reset(`${game.modeSystem.getSeed() || 'campaign'}:${levelConfig.id}`, levelConfig.id, game.modeSystem.modeId);
            ui.showToast(`${levelConfig.name} cargado`, 'info');
            ui.updateLevelTheme(levelConfig);
        };

        const starterPool = [
            data.heroes.iron_man,
            data.heroes.spiderman,
            data.heroes.capitan_america
        ].filter(Boolean);

        const rawSavedLevel = data.levels.find((level) => level.id === game.progression.state.lastLevelId);
        const savedLevel = rawSavedLevel && game.isLevelUnlocked(rawSavedLevel) ? rawSavedLevel : data.levels[0];
        setBootStatus('Precargando equipo inicial...');
        await game.assetPreloader.preloadTeamForLevel([...game.activeTeam, ...starterPool], savedLevel);

        setBootStatus('Abriendo la primera operacion...');
        game.loadLevel(savedLevel);

        if (game.progression.recoveredFromCorruptSave) {
            ui.showToast('Guardado danado recuperado. Se restauro un perfil seguro.', 'warning');
        }

        if (starterPool.length === 0) {
            throw new Error('No se encontraron héroes iniciales.');
        }

        if (game.unlockedHeroes.length > 0) {
            ui.renderHeroRoster(game.activeTeam, (hero) => input.setPlacementMode(hero));
            game.waveManager?.refreshWaveIntel?.();
            hideBootScreen();
            game.start();
        } else {
            ui.renderStarterSelector(starterPool, (chosen) => {
                game.progression.startProfile(chosen.id);
                game.assetPreloader?.preloadHeroes([chosen]);
                ui.renderHeroRoster(game.activeTeam, (hero) => input.setPlacementMode(hero));
                game.waveManager?.refreshWaveIntel?.();
                ui.showToast(`${chosen.name} se unió al equipo`, 'success');
                game.start();
            });
            hideBootScreen();
        }
    } catch (error) {
        hideBootScreen();
        document.body.dataset.appState = 'fatal';
        ui?.showFatalError(error);
        console.error('Detalle del fallo:', error);
    }
}

function setBootStatus(message) {
    document.body.dataset.appState = 'loading';
    const status = document.getElementById('boot-status');
    if (status) status.textContent = message;
}

function hideBootScreen() {
    document.body.dataset.appState = 'ready';
    document.getElementById('boot-screen')?.classList.add('hidden');
}

initGame();
registerPwa();
