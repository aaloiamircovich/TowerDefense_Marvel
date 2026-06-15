import { GameLoop } from './core/GameLoop.js';
import { UIManager } from './systems/UIManager.js';
import { WaveManager } from './systems/WaveManager.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { InputManager } from './systems/InputManager.js';

window.onload = async () => {
    const game = new GameLoop('gameCanvas');
    game.uiManager = new UIManager(game);
    game.resourceManager = new ResourceManager(game);
    game.inputManager = new InputManager(game);
    window.gameUI = game.uiManager; // Global ref

    // Cargar Datos
    const heroesRes = await fetch('data/heroes.json');
    game.heroDatabase = await heroesRes.json();
    
    const itemsRes = await fetch('data/items.json');
    game.itemDatabase = await itemsRes.json();

    const savedData = game.loadPersistence();

    // Mock enemies para demostración
    game.enemyDatabase = {
        "basic": { "id": "basic", "name": "Soldado Hydra", "hp": 60, "speed": 45, "reward": 10, "armor": 0 },
        "fast": { "id": "fast", "name": "Dron Ultron", "hp": 40, "speed": 85, "reward": 15, "armor": 0 },
        "extremis": { "id": "extremis", "name": "Soldado Extremis", "hp": 180, "speed": 50, "reward": 35, "armor": 5, "regeneration": 12 },
        "vampire": { "id": "vampire", "name": "Vampiro Noble", "hp": 220, "speed": 65, "reward": 45, "armor": 2, "regeneration": 20 },

        // ENEMIGOS CLONADORES
        "multiple_man": { "id": "multiple_man", "name": "Multiple Man", "hp": 400, "speed": 50, "reward": 50, "armor": 5, "splitInto": "multiple_man_clone", "splitCount": 3 },
        "multiple_man_clone": { "id": "multiple_man_clone", "name": "Clone", "hp": 80, "speed": 65, "reward": 10, "armor": 0 },
        "skrull_dron": { "id": "skrull_dron", "name": "Dron Skrull", "hp": 300, "speed": 75, "reward": 40, "armor": 10, "isFlying": true, "splitInto": "basic", "splitCount": 2 },
        
        // UNIDADES VOLADORAS
        "chitauri_scout": { "id": "chitauri_scout", "name": "Explorador Chitauri", "hp": 100, "speed": 75, "reward": 25, "armor": 2, "isFlying": true },
        "hydra_jet": { "id": "hydra_jet", "name": "Jet Hydra", "hp": 250, "speed": 110, "reward": 45, "armor": 5, "isFlying": true },
        
        // TIER 1 MINIBOSSES (Ronda 25)
        "green_goblin": { "id": "green_goblin", "name": "Duende Verde", "hp": 800, "speed": 70, "reward": 200, "armor": 5 },
        "kingpin": { "id": "kingpin", "name": "Kingpin", "hp": 1500, "speed": 30, "reward": 200, "armor": 15 },
        "red_skull": { "id": "red_skull", "name": "Red Skull", "hp": 1000, "speed": 50, "reward": 200, "armor": 8 },
        "vulture": { "id": "vulture", "name": "El Buitre", "hp": 700, "speed": 90, "reward": 200, "armor": 2, "isSwimmer": true },

        // TIER 2 MINIBOSSES (Ronda 50)
        "venom": { "id": "venom", "name": "Venom", "hp": 3000, "speed": 55, "reward": 400, "armor": 20 },
        "loki": { "id": "loki", "name": "Loki", "hp": 2000, "speed": 50, "reward": 400, "armor": 10, "stealth": true },
        "carnage": { "id": "carnage", "name": "Carnage", "hp": 2200, "speed": 80, "reward": 400, "armor": 5 },
        "mystique": { "id": "mystique", "name": "Mística", "hp": 1800, "speed": 60, "reward": 400, "armor": 0, "stealth": true },
        "bullseye": { "id": "bullseye", "name": "Bullseye", "hp": 1500, "speed": 65, "reward": 400, "armor": 5 },

        // TIER 3 MINIBOSSES (Ronda 75)
        "magneto": { "id": "magneto", "name": "Magneto", "hp": 6000, "speed": 40, "reward": 600, "armor": 40 },
        "ultron": { "id": "ultron", "name": "Ultrón", "hp": 7000, "speed": 45, "reward": 600, "armor": 50 },
        "apocalypse": { "id": "apocalypse", "name": "Apocalipsis", "hp": 10000, "speed": 30, "reward": 800, "armor": 60 },
        "kang": { "id": "kang", "name": "Kang el Conquistador", "hp": 8000, "speed": 50, "reward": 700, "armor": 35 },

        // FINAL BOSSES (Ronda 100)
        "thanos": { "id": "thanos", "name": "THANOS", "hp": 25000, "speed": 25, "reward": 2000, "armor": 80 },
        "galactus": { "id": "galactus", "name": "GALACTUS", "hp": 50000, "speed": 15, "reward": 5000, "armor": 100 },
        "doctor_doom": { "id": "doctor_doom", "name": "DOCTOR DOOM", "hp": 30000, "speed": 35, "reward": 3000, "armor": 90 },
        "dormammu": { "id": "dormammu", "name": "DORMAMMU", "hp": 40000, "speed": 20, "reward": 4000, "armor": 70, "stealth": true },
        "knull": { "id": "knull", "name": "KNULL", "hp": 35000, "speed": 40, "reward": 3500, "armor": 75 }
    };

    // Pre-cargar héroes desbloqueados si existen en el guardado para que la UI los vea
    if (savedData && savedData.unlockedHeroesIds) {
        game.unlockedHeroes = savedData.unlockedHeroesIds.map(id => game.heroDatabase[id]).filter(h => h);
    }

    game.generateLevelMap(); // Generar después de cargar el ID del nivel
    game.waveManager = new WaveManager(game, game.enemyDatabase);

    const startNewGame = () => {
        const starters = [ 
            game.heroDatabase["iron_man"], 
            game.heroDatabase["spiderman"], 
            game.heroDatabase["capitan_america"] 
        ].filter(h => h); // Seguridad contra IDs inexistentes

        game.uiManager.renderStarterSelector(starters, (selected) => {
            game.resetGame(); // Ahora sí limpia gemas, estrellas e historial de oleadas
            game.unlockedHeroes.push(selected);
            game.activeTeam.push(selected);
            game.savePersistence(); // GUARDADO CRÍTICO: Registrar el héroe inicial inmediatamente
            game.uiManager.renderHeroRoster(game.activeTeam, (h) => game.inputManager.setPlacementMode(h));
            game.uiManager.updateUI(game.resourceManager.lives, game.resourceManager.credits, 1, 60, game.stars);
            game.uiManager.showTutorial(); // Iniciar Protocolo de Inducción
        });
    };

    const continueGame = () => {
        // Sincronizar equipo activo (los primeros 6 héroes desbloqueados)
        game.activeTeam = game.unlockedHeroes.slice(0, 6);
        game.waveManager.currentWave = savedData.checkpointWave;
        game.uiManager.renderHeroRoster(game.activeTeam, (h) => game.inputManager.setPlacementMode(h));
        game.uiManager.updateUI(game.resourceManager.lives, game.resourceManager.credits, game.waveManager.currentWave, 60, game.stars);
        game.start();
    };

    const logoutAction = () => {
        const starters = [ game.heroDatabase["iron_man"], game.heroDatabase["spiderman"], game.heroDatabase["capitan_america"] ];
        game.uiManager.renderStarterSelector(starters, (selected) => {
            // LIMPIEZA DE SESIÓN (Sin borrar progreso global)
            game.heroes = [];
            game.enemies = [];
            game.projectiles = [];
            
            // Asegurar que el starter esté desbloqueado pero no borrar otros héroes
            if (!game.unlockedHeroes.find(h => h.id === selected.id)) {
                game.unlockedHeroes.push(selected);
            }
            
            game.activeTeam = [selected];
            game.waveManager.currentWave = 1;
            game.resourceManager.lives = 20;
            game.resourceManager.credits = 1500;
            
            game.savePersistence();
            game.uiManager.renderHeroRoster(game.activeTeam, (h) => game.inputManager.setPlacementMode(h));
            game.uiManager.updateUI(game.resourceManager.lives, game.resourceManager.credits, 1, 60, game.stars);
            game.start();
        });
    };

    // Si existe CUALQUIER dato guardado (estrellas, gemas o progreso), mostrar el Menú Principal
    if (savedData && savedData.unlockedHeroesIds && savedData.unlockedHeroesIds.length > 0) {
        game.uiManager.renderMainMenu(continueGame, startNewGame, logoutAction);
    } else {
        startNewGame();
    }
};