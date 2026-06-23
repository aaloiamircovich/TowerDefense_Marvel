import { GameLoop } from './core/GameLoop.js';
import { Loader } from './utils/Loader.js';
import { UIManager } from './systems/UIManager.js';
import { InputManager } from './core/InputManager.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { WaveManager } from './systems/WaveManager.js';
import { normalizePath } from './utils/PathUtils.js';
import { preloadImages } from './rendering/ImageCache.js';
import { collectVisualSources } from './rendering/SpriteAnimator.js';
import { ProgressionManager } from './systems/ProgressionManager.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { MissionSystem } from './systems/MissionSystem.js';
import { GameModeSystem } from './systems/GameModeSystem.js';
import { ReplaySystem } from './systems/ReplaySystem.js';
import { registerPwa } from './pwa/register.js';

async function initGame() {
    let ui = null;
    try {
        const game = new GameLoop('gameCanvas');
        ui = new UIManager(game);
        const resources = new ResourceManager(game, 20, 650);

        game.uiManager = ui;
        game.resourceManager = resources;

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

        const visualSources = Object.values(data.heroes)
            .flatMap((hero) => collectVisualSources(hero.visual));
        await preloadImages(visualSources);

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

        const input = new InputManager(game.canvas, game, ui, resources);
        game.inputManager = input;

        game.loadLevel = (levelConfig, options = {}) => {
            if (!levelConfig) throw new Error('Nivel no encontrado.');

            if (!options.preserveMode) {
                game.modeSystem.setCampaign();
                game.progression.syncGame();
            }

            game.currentLevel = levelConfig;
            if (!options.preserveMode) {
                game.progression.state.lastLevelId = levelConfig.id;
                game.progression.save();
            }
            game.difficulty = game.progression.getMapProgress(levelConfig.id).difficulty;
            game.heroes = [];
            game.enemies = [];
            game.selectedUnit = null;
            game.clearProjectiles();
            game.vfx.clear();
            game.completedWaves = [];
            game.isGameOver = false;
            game.missionSummaryRecorded = false;
            game.path = normalizePath(levelConfig.path, game.canvas.width, game.canvas.height);
            document.body.dataset.levelTheme = levelConfig.theme?.id || 'new-york';
            game.generateLevelMap();
            game.missionSystem.loadLevel(levelConfig);
            game.waveManager = new WaveManager(game, data.enemies, data.waves);
            game.resourceManager.reset(20, 650);
            game.modeSystem.configureRun();
            game.replaySystem.reset(`${game.modeSystem.getSeed() || 'campaign'}:${levelConfig.id}`, levelConfig.id, game.modeSystem.modeId);
            ui.showToast(`${levelConfig.name} cargado`, 'info');
            ui.updateLevelTheme(levelConfig);
        };

        const savedLevel = data.levels.find((level) => level.id === game.progression.state.lastLevelId) || data.levels[0];
        game.loadLevel(savedLevel);

        const starterPool = [
            data.heroes.iron_man,
            data.heroes.spiderman,
            data.heroes.capitan_america
        ].filter(Boolean);

        if (starterPool.length === 0) {
            throw new Error('No se encontraron héroes iniciales.');
        }

        if (game.unlockedHeroes.length > 0) {
            ui.renderHeroRoster(game.activeTeam, (hero) => input.setPlacementMode(hero));
            game.start();
        } else {
            ui.renderStarterSelector(starterPool, (chosen) => {
                game.progression.startProfile(chosen.id);
                ui.renderHeroRoster(game.activeTeam, (hero) => input.setPlacementMode(hero));
                ui.showToast(`${chosen.name} se unió al equipo`, 'success');
                game.start();
            });
        }
    } catch (error) {
        ui?.showFatalError(error);
        console.error('Detalle del fallo:', error);
    }
}

initGame();
registerPwa();
