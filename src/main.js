import { GameLoop } from './core/GameLoop.js';
import { Loader } from './utils/Loader.js';
import { UIManager } from './systems/UIManager.js';
import { InputManager } from './core/InputManager.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { WaveManager } from './systems/WaveManager.js';
import { normalizePath } from './utils/PathUtils.js';
import { preloadImages } from './rendering/ImageCache.js';
import { collectVisualSources } from './rendering/SpriteAnimator.js';

async function initGame() {
    try {
        const game = new GameLoop('gameCanvas');
        const ui = new UIManager(game);
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

        const input = new InputManager(game.canvas, game, ui, resources);
        game.inputManager = input;

        game.loadLevel = (levelConfig) => {
            if (!levelConfig) throw new Error('Nivel no encontrado.');

            game.currentLevel = levelConfig;
            game.heroes = [];
            game.enemies = [];
            game.projectiles = [];
            game.vfx.effects = [];
            game.path = normalizePath(levelConfig.path, game.canvas.width, game.canvas.height);
            document.body.dataset.levelTheme = levelConfig.theme?.id || 'new-york';
            game.generateLevelMap();
            game.waveManager = new WaveManager(game, data.enemies, data.waves);
            game.resourceManager.reset(20, 650);
            ui.showToast(`${levelConfig.name} cargado`, 'info');
            ui.updateLevelTheme(levelConfig);
        };

        game.loadLevel(data.levels[0]);

        const starterPool = [
            data.heroes.iron_man,
            data.heroes.spiderman,
            data.heroes.capitan_america
        ].filter(Boolean);

        if (starterPool.length === 0) {
            throw new Error('No se encontraron héroes iniciales.');
        }

        ui.renderStarterSelector(starterPool, (chosen) => {
            game.unlockedHeroes.push(chosen);
            game.activeTeam.push(chosen);
            ui.renderHeroRoster(game.activeTeam, (hero) => input.setPlacementMode(hero));
            ui.showToast(`${chosen.name} se unió al equipo`, 'success');
            game.start();
        });
    } catch (error) {
        alert('Error crítico al cargar. Revisa la consola F12.');
        console.error('Detalle del fallo:', error);
    }
}

initGame();
