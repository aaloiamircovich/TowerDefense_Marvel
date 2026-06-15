import { Hero } from '../entities/Hero.js';
import { Enemy } from '../entities/Enemy.js';

export class GameLoop {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.fps = 0;
        this.isRunning = false;

        this.heroes = [];
        this.enemies = [];
        this.projectiles = [];
        this.damagePopups = [];
        this.path = [];
        this.stars = 0;
        this.isAdmin = false;
        
        this.waveManager = null;
        this.uiManager = null;
        this.resourceManager = null;
        this.inputManager = null;
        
        this.gameSpeed = 1; 
        this.isManuallyPaused = false; 
        this.gridSize = 40; 
        this.terrainMap = []; 
        this.completedWavesByLevel = {};
        this.currentLevelId = 'avengers_tower';
        this.checkpointWave = 1;

        // Perfil de Jugador estilo PokéPath
        this.playerProfile = {
            username: "Avenger_Guest",
            title: "RECLUTA DE S.H.I.E.L.D.",
            unlockedTitles: ["RECLUTA DE S.H.I.E.L.D."],
            level: 1,
            xp: 0,
            gems: 100,
            gachaPrice: 50,
            avatar: "assets/images/heroes/spiderman/portrait.png",
            banner: "rgba(20, 20, 20, 0.9)",
            stats: {
                totalWavesCleared: 0,
                highestWaveReached: 0,
                totalEnemiesDefeated: 0,
                bossesDefeated: 0,
                lifetimeCreditsEarned: 0,
                lifetimeCreditsSpent: 0,
                totalRuns: 0
            },
            quests: {
                enemiesKilled: { current: 0, goal: 500, reward: 50, title: "Cazador de Hydra" },
                wavesCleared: { current: 0, goal: 200, reward: 100, title: "Veterano de Guerra" },
                bossesDefeated: { current: 0, goal: 20, reward: 200, title: "Asesino de Titanes" },
                spendCredits: { current: 0, goal: 25000, reward: 150, title: "Inversionista Stark" },
                totalEvolution: { current: 0, goal: 5, reward: 250, title: "Maestro Evolutivo" },
                criticalHits: { current: 0, goal: 500, reward: 100, title: "Ojo de Halcón" },
                collector: { current: 0, goal: 10, reward: 300, title: "Coleccionista Galáctico" },
                perfectWaves: { current: 0, goal: 50, reward: 200, title: "Operación Limpia" },
                superAttacks: { current: 0, goal: 200, reward: 150, title: "Fuerza Desatada" },
                itemsOwned: { current: 0, goal: 15, reward: 200, title: "Arsenal de S.H.I.E.L.D." },
                gachaSummons: { current: 0, goal: 30, reward: 100, title: "Invocador Supremo" }
            }
        };

        this.hiddenAchievements = {
            'inevitable': { id: 'inevitable', title: 'EL INEVITABLE', desc: 'Derrotar a Thanos.', rewardGems: 500 },
            'survivor': { id: 'survivor', title: 'AL BORDE DEL ABISMO', desc: 'Completar una ola con solo 1 vida restante.', rewardGems: 200 },
            'rich': { id: 'rich', title: 'FILÁNTROPO', desc: 'Gastar más de 100,000 créditos totales.', rewardGems: 500 },
            'god': { id: 'god', title: 'DIOS DEL TRUENO', desc: 'Llevar a Thor al nivel 100.', rewardGems: 400 },
            'collector': { id: 'collector', title: 'EL COLECCIONISTA', desc: 'Poseer 20 héroes diferentes.', rewardGems: 600 },
            'cosmic_luck': { id: 'cosmic_luck', title: 'FAVOR DEL COSMOS', desc: 'Obtener un héroe de rareza Cosmic.', rewardGems: 1000 },
            'avengers_assemble': { id: 'avengers_assemble', title: 'VENGADORES REUNIDOS', desc: 'Desplegar 6 héroes simultáneamente.', rewardGems: 300 },
            'tactician': { id: 'tactician', title: 'ESTRATEGA SUPREMO', desc: 'Equipar un objeto exclusivo en su héroe correspondiente.', rewardGems: 300 },
            'full_roster': { id: 'full_roster', title: 'INICIATIVA VENGADORES', desc: 'Desbloquear a todos los héroes disponibles.', rewardGems: 2000 },
            'speedster': { id: 'speedster', title: 'A TODA MÁQUINA', desc: 'Completar una oleada a velocidad x4.', rewardGems: 150 }
        };

        this.settings = {
            gameplay: { autoWave: false, autoRetry: false, autoRestart: false, purchaseConfirm: true, showDamage: true, vfxHeavy: true, tutorials: true },
            audio: { master: 80, music: 50, sfx: 70, ui: 60, alerts: 100 },
            graphics: { quality: 'High', shadows: true, particles: true, reducedEffects: false, performanceMode: false, complexAnims: true },
            ui: { scale: 100, transparency: 0.9, showDamage: true, timers: true, waveIndicators: true, enemyInfo: true, compactUI: false },
            qol: { skipIntros: false, skipAnims: false, autoClaim: true, hidePopups: false, fastTransitions: false, reducedNotifs: false }
        };

        this.unlockedHeroes = [];
        this.activeTeam = [];
        this.ownedItems = [
            { id: "gema_poder", name: "GEMA DEL PODER", desc: "Aumenta Daño un 50%", icon: "" },
            { id: "contrato_stark", name: "CONTRATO STARK", desc: "Genera $1 por ataque", icon: "" }
        ];
        
        this.levelDatabase = {
            'avengers_tower': {
                name: "Torre de los Vengadores",
                starsRequired: 0,
                path: [{ x: -40, y: 100 }, { x: 260, y: 100 }, { x: 260, y: 460 }, { x: 580, y: 460 }, { x: 580, y: 220 }, { x: 840, y: 220 }],
                terrainConfig: { water: 0.1, mountain: 0.1, bush: 0.1 },
                art: 'assets/images/levels/avengers_tower_art.png',
                bosses: { 25: "red_skull", 50: "loki", 75: "ultron", 100: "thanos" }
            },
            'sewers': {
                name: "Alcantarillas de New York",
                starsRequired: 20,
                path: [{ x: -40, y: 220 }, { x: 220, y: 220 }, { x: 220, y: 100 }, { x: 580, y: 100 }, { x: 580, y: 340 }, { x: 840, y: 340 }],
                terrainConfig: { water: 0.6, mountain: 0.05, bush: 0.2 },
                art: 'assets/images/levels/sewers_art.png',
                bosses: { 25: "vulture", 50: "bullseye", 75: "kang", 100: "knull" }
            },
            'x_mansion': {
                name: "Jardines Mansión X",
                starsRequired: 45,
                path: [{ x: 400, y: -40 }, { x: 400, y: 220 }, { x: 100, y: 220 }, { x: 100, y: 460 }, { x: 840, y: 460 }],
                terrainConfig: { water: 0.05, mountain: 0.05, bush: 0.1 },
                art: 'assets/images/levels/x_mansion_art.png',
                bosses: { 25: "kingpin", 50: "mystique", 75: "magneto", 100: "apocalypse" }
            },
            'himalayas': {
                name: "Himalayas (Kamar-Taj)",
                starsRequired: 80,
                path: [{ x: -40, y: 460 }, { x: 840, y: 40 }],
                terrainConfig: { water: 0.1, mountain: 0.7, bush: 0.05 },
                art: 'assets/images/levels/himalayas_art.png',
                bosses: { 25: "red_skull", 50: "carnage", 75: "kang", 100: "dormammu" }
            },
            'wakanda': {
                name: "Wakanda",
                starsRequired: 120,
                path: [{ x: -40, y: 300 }, { x: 400, y: 300 }, { x: 400, y: 100 }, { x: 840, y: 100 }],
                terrainConfig: { water: 0.2, mountain: 0.1, bush: 0.4 },
                art: 'assets/images/levels/wakanda_art.png',
                bosses: { 25: "vulture", 50: "venom", 75: "ultron", 100: "galactus" }
            },
            'asgard': {
                name: "Asgard (Puente Bifrost)",
                starsRequired: 160,
                path: [{ x: -40, y: 220 }, { x: 840, y: 220 }],
                terrainConfig: { water: 0.4, mountain: 0.2, bush: 0.1 },
                art: 'assets/images/levels/asgard_art.png',
                bosses: { 25: "loki", 50: "mystique", 75: "magneto", 100: "doctor_doom" }
            },
            'vormir': {
                name: "Vormir",
                starsRequired: 200,
                path: [{ x: -40, y: 260 }, { x: 300, y: 260 }, { x: 300, y: 400 }, { x: 500, y: 400 }, { x: 500, y: 100 }, { x: 840, y: 100 }],
                terrainConfig: { water: 0.3, mountain: 0.6, bush: 0.0 },
                art: 'assets/images/levels/vormir_art.png',
                bosses: { 25: "kingpin", 50: "loki", 75: "thanos", 100: "galactus" }
            }
        };
        this.path = this.levelDatabase[this.currentLevelId].path;

        this.tilesetImage = new Image();
        this.tilesetImage.src = 'assets/images/tiles/tileset.png';
        this.tileSizeSource = 16; 

        this.tileMapping = {
            0: { sx: 512,  sy: 848 }, // Agua 
            1: { sx: 16,   sy: 0   }, // Hierba base
            11: { sx: 64,  sy: 0   }, // Hierba flor
            12: { sx: 80,  sy: 16  }, // Hierba alta
            2: { sx: 896,  sy: 336 }, // Camino
            3: { sx: 976,  sy: 0   }, // Montaña
            4: { sx: 160,  sy: 0   }  // Arbusto
        };

        this.terrainColors = {
            0: '#1e6091', 1: '#386641', 11: '#407a4b', 12: '#2d5234', 2: '#7f5539', 3: '#4a4e69', 4: '#1a3320'
        };
        
        requestAnimationFrame((t) => this.loop(t));
    }

    generateLevelMap() {
        this.terrainMap = [];
        const level = this.levelDatabase[this.currentLevelId] || this.levelDatabase['avengers_tower'];
        const config = level.terrainConfig || { water: 0.1, mountain: 0.1, bush: 0.1 };

        const cols = Math.ceil(this.canvas.width / this.gridSize);
        const rows = Math.ceil(this.canvas.height / this.gridSize);
        const totalTiles = cols * rows;

        // 1. Inicializar todo el mapa como Hierba (1)
        for (let y = 0; y < rows; y++) {
            this.terrainMap[y] = new Array(cols).fill(1);
        }

        // Función interna para generar biomas mediante crecimiento de semillas
        const growBiomes = (type, probability) => {
            if (probability <= 0) return;
            const targetCount = Math.floor(totalTiles * probability);
            let currentCount = 0;
            
            // Colocar semillas iniciales (puntos de origen del bioma)
            const seedCount = Math.max(1, Math.floor(targetCount / 8)); 
            const frontier = [];

            for (let i = 0; i < seedCount; i++) {
                const rx = Math.floor(Math.random() * cols);
                const ry = Math.floor(Math.random() * rows);
                if (this.terrainMap[ry][rx] === 1) {
                    this.terrainMap[ry][rx] = type;
                    currentCount++;
                    frontier.push({ x: rx, y: ry });
                }
            }

            // Expandir desde las semillas hasta alcanzar la cuota
            let iterations = 0;
            while (currentCount < targetCount && frontier.length > 0 && iterations < 1000) {
                const idx = Math.floor(Math.random() * frontier.length);
                const cell = frontier[idx];
                const neighbors = [
                    { x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y },
                    { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 }
                ];

                const validNeighbors = neighbors.filter(n => 
                    n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows && this.terrainMap[n.y][n.x] === 1
                );

                if (validNeighbors.length > 0) {
                    const chosen = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    this.terrainMap[chosen.y][chosen.x] = type;
                    currentCount++;
                    frontier.push(chosen);
                } else {
                    frontier.splice(idx, 1);
                }
                iterations++;
            }
        };

        // 2. Generar Biomas en orden (Agua, luego Montaña, luego Arbustos)
        growBiomes(0, config.water);
        growBiomes(3, config.mountain);
        growBiomes(4, config.bush);

        // 3. Añadir detalles estéticos finales (flores y hierba alta)
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (this.terrainMap[y][x] === 1) {
                    const r = Math.random();
                    if (r < 0.05) this.terrainMap[y][x] = 11;
                    else if (r < 0.10) this.terrainMap[y][x] = 12;
                }
            }
        }

        if (this.path && this.path.length > 1) {
            for (let i = 0; i < this.path.length - 1; i++) {
                let start = this.path[i];
                let end = this.path[i+1];
                let startX = Math.floor(start.x / this.gridSize);
                let startY = Math.floor(start.y / this.gridSize);
                let endX = Math.floor(end.x / this.gridSize);
                let endY = Math.floor(end.y / this.gridSize);

                let minX = Math.min(startX, endX);
                let maxX = Math.max(startX, endX);
                for (let x = minX; x <= maxX; x++) if (this.terrainMap[startY]) this.terrainMap[startY][x] = 2;
                
                let minY = Math.min(startY, endY);
                let maxY = Math.max(startY, endY);
                for (let y = minY; y <= maxY; y++) if (this.terrainMap[y]) this.terrainMap[y][endX] = 2;
            }
        }
    }

    spawnHero(config, x, y) {
        if (this.heroes.some(h => h.id === config.id)) {
            alert(`¡${config.name} ya está en el campo! No puedes repetir héroes.`);
            return;
        }
        this.heroes.push(new Hero(config, x, y, this));
        if (this.heroes.length >= 6) {
            this.unlockAchievement('avengers_assemble');
        }
    }

    activateAdminMode() {
        this.isAdmin = true;
        this.stars = 999;
        this.resourceManager.credits = 999999;
        this.playerProfile.gems = 999999;

        // Desbloquear todos los héroes al máximo
        this.unlockedHeroes = Object.values(this.heroDatabase).map(h => ({
            ...h, stars: 5, level: 100, evolutionTier: 3
        }));
        
        // Desbloquear todos los objetos
        this.ownedItems = Object.values(this.itemDatabase);

        this.savePersistence();
        alert("ACCESO NIVEL 7 CONCEDIDO. Bienvenido, Director.");
    }

    addDamagePopup(x, y, text, color = 'white', isCrit = false) {
        this.damagePopups.push({
            x: x + (Math.random() * 20 - 10),
            y: y - 20,
            text: text,
            color: color,
            size: isCrit ? 22 : 16,
            life: 1.0
        });
    }

    saveCheckpoint(wave) {
        this.checkpointWave = wave;
        this.savePersistence();
    }

    savePersistence() {
        const data = {
            stars: this.stars,
            checkpointWave: this.checkpointWave,
            unlockedHeroesIds: this.unlockedHeroes.map(h => h.id),
            ownedItems: this.ownedItems,
            completedWavesByLevel: this.completedWavesByLevel,
            currentLevelId: this.currentLevelId,
            playerProfile: this.playerProfile,
            settings: this.settings,
            isAdmin: this.isAdmin,
            credits: this.resourceManager ? this.resourceManager.credits : 1500
        };
        localStorage.setItem('marvel_td_save', JSON.stringify(data));
    }

    loadPersistence() {
        const saved = localStorage.getItem('marvel_td_save');
        if (saved) {
            const data = JSON.parse(saved);
            this.stars = data.stars || 0;
            this.checkpointWave = data.checkpointWave || 1;
            this.completedWavesByLevel = data.completedWavesByLevel || {};
            this.currentLevelId = data.currentLevelId || 'avengers_tower';
            this.isAdmin = data.isAdmin || false;
            
            if (data.credits !== undefined && this.resourceManager) {
                this.resourceManager.credits = data.credits;
            }

            if (data.ownedItems) this.ownedItems = data.ownedItems;
            if (data.settings) this.settings = { ...this.settings, ...data.settings };
            
            if (data.playerProfile) {
                // Mezclar progreso de misiones de forma segura preservando las nuevas definiciones
                if (data.playerProfile.quests) {
                    for (const key in data.playerProfile.quests) {
                        if (this.playerProfile.quests[key]) {
                            this.playerProfile.quests[key].current = data.playerProfile.quests[key].current;
                        }
                    }
                }
                // Fusionar perfil pero mantener el objeto de misiones actualizado con 11 entradas
                this.playerProfile = { 
                    ...this.playerProfile, 
                    ...data.playerProfile,
                    quests: this.playerProfile.quests,
                    gachaPrice: data.playerProfile.gachaPrice || 50
                };
            }
            
            if (this.levelDatabase[this.currentLevelId]) {
                this.path = this.levelDatabase[this.currentLevelId].path;
            }
            return data;
        }
        return null;
    }

    addXP(amount) {
        this.playerProfile.xp += amount;
        const nextLevelXP = this.playerProfile.level * 1000;
        if (this.playerProfile.xp >= nextLevelXP) {
            this.playerProfile.xp -= nextLevelXP;
            this.playerProfile.level++;
            if (this.resourceManager) this.resourceManager.addGems(100); // Bono de PokéPath por nivel
            console.log(`¡Subida de Nivel! Ahora eres nivel ${this.playerProfile.level}. +100 Gemas`);
        }
        this.savePersistence();
    }

    unlockAchievement(id) {
        const ach = this.hiddenAchievements[id];
        if (!ach || this.playerProfile.unlockedTitles.includes(ach.title)) return;

        this.playerProfile.unlockedTitles.push(ach.title);
        this.resourceManager.addGems(ach.rewardGems);
        console.log(`%c ¡LOGRO OCULTO! Desbloqueado: ${ach.title} `, 'background: #222; color: #ff00ff; font-weight: bold; border: 1px solid #ff00ff;');
        alert(`¡LOGRO OCULTO! \n\n Título Desbloqueado: "${ach.title}" \n Recompensa: ${ach.rewardGems} Gemas`);
        this.savePersistence();
    }

    checkQuestProgress(type, amount = 1) {
        const quest = this.playerProfile.quests[type];
        if (quest && quest.current < quest.goal) {
            quest.current += amount;
            if (quest.current >= quest.goal) {
                this.resourceManager.addGems(quest.reward);
                console.log(`¡Misión Cumplida: ${quest.title}! +${quest.reward} Gemas`);
            }
            this.savePersistence();
        }
    }

    loadLevel(levelId) {
        const level = this.levelDatabase[levelId];
        if (!level) return;
        if (this.stars < level.starsRequired) return alert(`Necesitas ${level.starsRequired} estrellas.`);
        
        this.currentLevelId = levelId;
        this.path = level.path;

        // REINICIO SUAVE: Limpiar el campo para el nuevo nivel sin borrar el progreso global
        this.enemies = [];
        this.heroes = [];
        this.projectiles = [];
        this.damagePopups = [];
        
        if (this.waveManager) {
            this.waveManager.currentWave = 1;
            this.waveManager.isWaveActive = false;
        }
        if (this.resourceManager) {
            this.resourceManager.lives = 20;
            this.resourceManager.credits = 1500; // Créditos iniciales para el nuevo mapa
        }

        this.generateLevelMap();
        if (this.uiManager) this.uiManager.closePanel();
        this.savePersistence();
        this.start();
    }

    resetGame() {
        this.enemies = [];
        this.heroes = [];
        this.projectiles = [];
        this.checkpointWave = 1;
        this.stars = 0;
        this.unlockedHeroes = [];
        this.activeTeam = [];
        this.completedWavesByLevel = {};
        
        // Resetear Inventario a estado inicial
        this.ownedItems = [
            { id: "gema_poder", name: "GEMA DEL PODER", desc: "Aumenta Daño un 50%", icon: "" },
            { id: "contrato_stark", name: "CONTRATO STARK", desc: "Genera $1 por ataque", icon: "" }
        ];

        if (this.waveManager) this.waveManager.currentWave = 1;
        if (this.resourceManager) { 
            this.resourceManager.lives = 20; 
            this.resourceManager.credits = 1500; 
        }
        
        // Resetear Perfil de Jugador por completo (incluye gemas y XP)
        this.playerProfile.level = 1;
        this.playerProfile.xp = 0;
        this.playerProfile.gems = 100;
        this.playerProfile.title = "RECLUTA DE S.H.I.E.L.D.";
        this.playerProfile.unlockedTitles = ["RECLUTA DE S.H.I.E.L.D."];
        
        // Resetear misiones
        Object.values(this.playerProfile.quests).forEach(q => q.current = 0);
        
        // Resetear estadísticas históricas
        Object.keys(this.playerProfile.stats).forEach(k => this.playerProfile.stats[k] = 0);

        this.savePersistence();
        this.start();
    }

    repeatWave() {
        this.enemies = [];
        this.projectiles = [];
        if (this.waveManager) {
            this.waveManager.isWaveActive = false;
            // No aumentamos ni disminuimos currentWave
        }
        if (this.resourceManager) this.resourceManager.lives = 20;
        this.start();
    }

    restartLevel() {
        this.enemies = [];
        this.projectiles = [];
        if (this.waveManager) {
            this.waveManager.currentWave = 1;
            this.waveManager.isWaveActive = false;
        }
        if (this.resourceManager) this.resourceManager.lives = 20;

        // Resetear progreso de misiones al reiniciar el nivel
        if (this.playerProfile && this.playerProfile.quests) {
            Object.values(this.playerProfile.quests).forEach(q => q.current = 0);
        }

        this.savePersistence();
        this.start();
    }

    retryFromCheckpoint() {
        this.enemies = [];
        this.projectiles = [];
        this.waveManager.currentWave = this.checkpointWave;
        this.resourceManager.lives = 20; 
        this.resourceManager.credits += 1000; // Bono inicial de recuperación
        this.start();
    }

    gameOver() {
        this.isRunning = false;
        if (this.uiManager) this.uiManager.showGameOver(false);
    }

    victory() {
        this.isRunning = false;
        this.stars += 5; // Recompensa por terminar Wave 100
        this.savePersistence();
        if (this.uiManager) this.uiManager.showGameOver(true);
    }

    start() { this.isRunning = true; this.lastTime = performance.now(); }
    pause() { this.isRunning = false; }
    togglePause() { this.isManuallyPaused = !this.isManuallyPaused; return this.isManuallyPaused; }

    loop(timestamp) {
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        if (this.deltaTime > 0.1) this.deltaTime = 0.1; 

        if (this.isRunning && !this.isManuallyPaused) {
            this.fps = 1 / this.deltaTime;
            this.update(this.deltaTime * this.gameSpeed);
        }

        this.render(this.ctx);
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if (this.waveManager) this.waveManager.update(dt);
        if (this.uiManager && this.resourceManager) {
            const currentWave = this.waveManager ? this.waveManager.currentWave : 1;
            this.uiManager.updateUI(this.resourceManager.lives, this.resourceManager.credits, currentWave, this.fps, this.stars);
        }

        this.enemies.forEach(enemy => {
            enemy.update(dt);
            if (enemy.hasReachedEnd && !enemy.processed) {
                if (enemy.bossType) {
                    // ALERTA: El Boss ha penetrado las defensas. Pérdida total de vidas.
                    this.resourceManager.removeLife(this.resourceManager.lives);
                } else {
                    this.resourceManager.removeLife(1);
                }
                enemy.processed = true;
            }
        });

        this.heroes.forEach(h => h.update(dt, this.enemies, this.projectiles));
        this.projectiles.forEach(p => p.update(dt));

        // Actualizar y limpiar textos de daño flotantes
        this.damagePopups.forEach(p => {
            p.y -= 40 * dt; // Subir el texto
            p.life -= dt * 1.5; // Reducir vida (desvanecimiento)
        });
        this.damagePopups = this.damagePopups.filter(p => p.life > 0);

        const clonesToSpawn = [];
        this.enemies = this.enemies.filter(e => {
            if (!e.isAlive && !e.hasReachedEnd) {
                this.resourceManager.addCredits(e.config.reward || 10);
                if (e.config.id === "boss") {
                    this.resourceManager.addGems(25); // Bono por derrotar jefes
                    this.checkQuestProgress('bossesDefeated', 1);
                    if (e.name.includes("THANOS")) {
                        this.unlockAchievement('inevitable');
                    }
                } else {
                    // 5% de probabilidad de que un enemigo común suelte una gema
                    if (Math.random() < 0.05) this.resourceManager.addGems(1);
                }

                // LÓGICA DE CLONACIÓN / DIVISIÓN
                if (e.config.splitInto) {
                    const childCfg = this.enemyDatabase[e.config.splitInto];
                    const count = e.config.splitCount || 2;
                    for (let i = 0; i < count; i++) {
                        const child = new Enemy(childCfg, this.path, this);
                        child.x = e.x + (Math.random() * 20 - 10); // Pequeño offset visual
                        child.y = e.y + (Math.random() * 20 - 10);
                        child.pathIndex = e.pathIndex;
                        child.distanceTravelled = e.distanceTravelled;
                        clonesToSpawn.push(child);
                    }
                }
            }
            
            // REGLA DE JEFE: Si es un Boss/Miniboss y llegó al final pero sigue vivo,
            // lo mantenemos en el mapa. La oleada no terminará hasta que sea eliminado.
            if (e.bossType && e.hasReachedEnd && e.isAlive) return true;

            return e.isAlive && !e.hasReachedEnd;
        });

        if (clonesToSpawn.length > 0) this.enemies.push(...clonesToSpawn);
        
        this.projectiles = this.projectiles.filter(p => p.isActive);
    }

    render(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        for (let y = 0; y < this.terrainMap.length; y++) {
            for (let x = 0; x < this.terrainMap[y].length; x++) {
                const terrainType = this.terrainMap[y][x];
                if (this.tilesetImage.complete && this.tilesetImage.naturalWidth > 0) {
                    const map = this.tileMapping[terrainType];
                    ctx.drawImage(
                        this.tilesetImage, 
                        map.sx, map.sy, this.tileSizeSource, this.tileSizeSource,
                        x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize
                    );
                } else {
                    ctx.fillStyle = this.terrainColors[terrainType];
                    ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
                }
            }
        }

        this.enemies.forEach(e => e.render(ctx));
        this.heroes.forEach(h => h.render(ctx));
        this.projectiles.forEach(p => p.render(ctx));
        
        // Dibujar números de daño
        this.damagePopups.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.font = `bold ${p.size}px Arial`;
            ctx.globalAlpha = p.life;
            ctx.fillText(p.text, p.x, p.y);
            ctx.globalAlpha = 1.0;
        });
        ctx.restore();

        // Efecto de Niebla para Vormir
        if (this.currentLevelId === 'vormir') {
            this.renderVormirFog(ctx);
        }

        if (this.inputManager) this.inputManager.draw(ctx);
    }

    renderVormirFog(ctx) {
        ctx.save();
        const time = performance.now() * 0.001;
        // Crear un degradado que se mueve sutilmente
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        const drift = Math.sin(time * 0.5) * 0.1;
        
        gradient.addColorStop(0, `rgba(45, 20, 60, ${0.3 + drift})`);
        gradient.addColorStop(0.5, `rgba(20, 10, 40, ${0.5 + drift})`);
        gradient.addColorStop(1, `rgba(45, 20, 60, ${0.3 + drift})`);

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }
}