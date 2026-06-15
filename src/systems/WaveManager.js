import { Enemy } from '../entities/Enemy.js';

export class WaveManager {
    constructor(game, enemyData) {
        this.game = game;
        this.enemyData = enemyData;
        this.currentWave = 1;
        this.isWaveActive = false;
        this.autoWave = false;
        this.spawnTimer = 0;
        this.enemiesToSpawn = [];
        this.maxWaves = 100;
        this.checkpoints = [1, 25, 50, 75];
    }

    startNextWave() {
        if (this.currentWave > this.maxWaves) {
            this.game.victory();
            return;
        }

        this.isWaveActive = true;
        this.livesAtStart = this.game.resourceManager.lives;
        this.enemiesToSpawn = [];
        
        let count = 5 + Math.floor(this.currentWave * 1.2);
        let pool = Object.values(this.enemyData);

        // Filtrado por segmentos de dificultad estilo PokéPath
        let availableEnemies = pool.filter(e => {
            if (this.currentWave <= 20) return e.id === "basic";
            if (this.currentWave <= 50) return e.id === "basic" || e.id === "fast";
            return true; // Late game usa todo el pool incluyendo bosses como enemigos comunes
        });

        // Lógica de Minibosses y Bosses Finales cada 25 rondas
        let bossConfig = null;
        if (this.currentWave % 25 === 0) {
            let bossPool = [];
            let wave = this.currentWave;
            let type = wave === 100 ? 'BOSS' : 'MINIBOSS';
            
            if (wave === 25) {
                bossPool = ["green_goblin", "kingpin", "red_skull", "vulture"];
            } else if (wave === 50) {
                bossPool = ["venom", "loki", "carnage", "mystique", "bullseye"];
            } else if (wave === 75) {
                bossPool = ["magneto", "ultron", "apocalypse", "kang"];
            } else if (wave === 100) {
                bossPool = ["thanos", "galactus", "doctor_doom", "dormammu", "knull"];
            }

            const bossId = bossPool[Math.floor(Math.random() * bossPool.length)];
            const bossBase = this.enemyData[bossId] || pool[0];
            
            // Escalado exponencial de Boss: HP Base * 1.25^(Ola-1) * Multiplicador (x10) * 0.85 (Reducción 15%)
            const bossHp = Math.floor(bossBase.hp * Math.pow(1.25, wave - 1) * 10 * 0.85);
            // Escalado de Recompensa de Boss: Base * 1.15^(Ola-1)
            const bossReward = Math.floor(bossBase.reward * Math.pow(1.15, wave - 1));
            bossConfig = { ...bossBase, hp: bossHp, reward: bossReward, name: bossBase.name.toUpperCase(), bossType: type };
            
            if (this.game.uiManager) this.game.uiManager.showBossWarning(type);
            
            // En la ronda 100 el boss viene solo, en las otras viene con escolta reducida
            count = wave === 100 ? 0 : Math.floor(count / 2);
        }

        for(let i=0; i<count; i++) {
            let base = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
            // Escalado exponencial de súbditos: HP Base * 1.25^(Ola-1) * 0.85 (Reducción 15%)
            let scaledHp = Math.floor(base.hp * Math.pow(1.25, this.currentWave - 1) * 0.85);
            // Escalado de regeneración igual que la vida
            let scaledRegen = base.regeneration ? Math.floor(base.regeneration * Math.pow(1.25, this.currentWave - 1) * 0.85) : 0;
            // Escalado exponencial de recompensa: Base * 1.12^(Ola-1)
            let scaledReward = Math.floor(base.reward * Math.pow(1.12, this.currentWave - 1));
            this.enemiesToSpawn.push({ ...base, hp: scaledHp, regeneration: scaledRegen, reward: scaledReward });
        }

        // El jefe aparece al final de la oleada
        if (bossConfig) {
            this.enemiesToSpawn.push(bossConfig);
        }
        
        // Extraer enemigos unicos para preview
        const unique = [];
        const uniqueIds = new Set();
        this.enemiesToSpawn.forEach(e => {
            if(!uniqueIds.has(e.id)) { uniqueIds.add(e.id); unique.push(e); }
        });
        
        if(this.game.uiManager) this.game.uiManager.renderWavePreview(unique);
    }

    update(dt) {
        if(!this.isWaveActive) return;
        this.spawnTimer += dt;
        
        // Mayor densidad en oleadas finales
        let spawnRate = this.currentWave > 80 ? 0.5 : 1.2;
        if(this.spawnTimer >= spawnRate && this.enemiesToSpawn.length > 0) {
            this.spawnTimer = 0;
            let cfg = this.enemiesToSpawn.shift();
            this.game.enemies.push(new Enemy(cfg, this.game.path, this.game));
        }
        
        if(this.enemiesToSpawn.length === 0 && this.game.enemies.length === 0) {
            this.isWaveActive = false;
            
            // Bono de Ola Perfecta (Sin perder vida)
            if (this.game.resourceManager.lives === this.livesAtStart) {
                const perfectGems = 2 + Math.floor(this.currentWave / 20);
                this.game.resourceManager.addGems(perfectGems);
                console.log(`¡OLA PERFECTA! +${perfectGems} Gemas de bonificación.`);
                this.game.checkQuestProgress('perfectWaves', 1);
            }

            if (this.game.resourceManager.lives === 1) {
                this.game.unlockAchievement('survivor');
            }

            // Lógica de Estrellas (Solo por primera vez en este nivel)
            const levelId = this.game.currentLevelId;
            const progress = this.game.completedWavesByLevel[levelId] || 0;

            // Recompensa de 500 gemas por completar el mapa (Ola 100) por primera vez
            if (this.currentWave === 100 && progress < 100) {
                this.game.resourceManager.addGems(500);
                console.log(`¡MAPA ${levelId.toUpperCase()} COMPLETADO! +500 Gemas de bonificación.`);
            }

            if (this.currentWave > progress) {
                this.game.stars++;
                this.game.completedWavesByLevel[levelId] = this.currentWave;
                this.game.savePersistence();
            }

            // Actualizar estadísticas de Perfil
            if (this.game.playerProfile) {
                this.game.playerProfile.stats.totalWavesCleared++;
                if(this.currentWave > (this.game.playerProfile.stats.highestWaveReached || 0)) 
                    this.game.playerProfile.stats.highestWaveReached = this.currentWave;
                this.game.addXP(50 + (this.currentWave * 5));
                this.game.checkQuestProgress('wavesCleared', 1);
            }
            
            if (this.checkpoints.includes(this.currentWave)) {
                this.game.saveCheckpoint(this.currentWave);
            }
            
            if (this.game.gameSpeed >= 4) {
                this.game.unlockAchievement('speedster');
            }

            this.currentWave++;
            this.game.resourceManager.addCredits(100 + (this.currentWave * 20));
            this.game.resourceManager.addGems(5); // Recompensa constante por cada oleada superada
            if(this.autoWave) this.startNextWave();
        }
    }
}