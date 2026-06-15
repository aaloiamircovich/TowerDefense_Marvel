import { GameLoop } from './core/GameLoop.js';
import { Loader } from './utils/Loader.js';
import { UIManager } from './systems/UIManager.js';
import { InputManager } from './core/InputManager.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { WaveManager } from './systems/WaveManager.js';

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

function normalizePath(path, width, height) {
    if (!Array.isArray(path) || path.length < 2) {
        return [
            { x: -40, y: 120 },
            { x: width * 0.35, y: 120 },
            { x: width * 0.35, y: height * 0.75 },
            { x: width * 0.72, y: height * 0.75 },
            { x: width * 0.72, y: height * 0.35 },
            { x: width + 40, y: height * 0.35 }
        ];
    }

    const insidePoints = path.map((point) => ({
        x: clamp(point.x, 0, width),
        y: clamp(point.y, 0, height)
    }));

    const safePath = [outsidePoint(insidePoints[0], width, height, true), insidePoints[0]];

    for (let i = 1; i < insidePoints.length; i++) {
        const previous = safePath[safePath.length - 1];
        const next = insidePoints[i];

        if (previous.x !== next.x && previous.y !== next.y) {
            safePath.push({ x: next.x, y: previous.y });
        }

        safePath.push(next);
    }

    safePath.push(outsidePoint(insidePoints[insidePoints.length - 1], width, height, false));
    return removeDuplicatePoints(safePath);
}

function outsidePoint(point, width, height, isStart) {
    const margin = 40;

    if (point.x <= 0) return { x: -margin, y: point.y };
    if (point.x >= width) return { x: width + margin, y: point.y };
    if (point.y <= 0) return { x: point.x, y: -margin };
    if (point.y >= height) return { x: point.x, y: height + margin };

    return isStart ? { x: -margin, y: point.y } : { x: width + margin, y: point.y };
}

function removeDuplicatePoints(points) {
    return points.filter((point, index) => {
        const previous = points[index - 1];
        return !previous || previous.x !== point.x || previous.y !== point.y;
    });
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

initGame();
