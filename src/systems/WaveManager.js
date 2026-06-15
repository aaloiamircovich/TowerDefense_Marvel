import { Enemy } from '../entities/Enemy.js';

export class WaveManager {
    constructor(gameInstance, enemiesDb) {
        this.game = gameInstance;
        this.data = enemiesDb;
        this.currentWave = 1;
        this.maxWaves = 50;
        this.enemiesQueue = [];
        this.preparedQueue = [];
        this.spawnTimer = 0;
        this.isWaveActive = false;
        this.autoWave = false;

        this.prepareNextWave();
    }

    prepareNextWave() {
        this.preparedQueue = [];
        if (this.currentWave > this.maxWaves) return;

        if (this.currentWave === this.maxWaves) {
            const config = this.data.bosses.thanos_final;
            this.preparedQueue.push({ config: this.scaleEnemy(config, 1.9, true), delay: 0 });
        } else if (this.currentWave % 10 === 0) {
            const bosses = Object.values(this.data.bosses).filter((boss) => boss.id !== 'thanos_final');
            const config = bosses[(this.currentWave / 10 - 1) % bosses.length];
            this.preparedQueue.push({ config: this.scaleEnemy(config, 1 + this.currentWave * 0.11, true), delay: 0 });
        } else {
            const count = 7 + Math.floor(this.currentWave * 0.55);
            const interval = Math.max(0.45, 1.45 - this.currentWave / 65);
            const normalPool = this.getEnemyPoolForWave();

            for (let i = 0; i < count; i++) {
                const config = normalPool[(i + this.currentWave) % normalPool.length];
                this.preparedQueue.push({
                    config: this.scaleEnemy(config, 1 + this.currentWave * 0.045, false),
                    delay: i === 0 ? 0.2 : interval
                });
            }
        }

        if (this.game.uiManager) {
            this.game.uiManager.renderWavePreview(this.getUniqueEnemies());
            this.game.uiManager.setNextWaveEnabled(true);
        }
    }

    getEnemyPoolForWave() {
        const normal = this.data.normal;
        const pool = [normal.hydra_soldier, normal.aim_scientist, normal.outrider].filter(Boolean);

        if (this.currentWave >= 4) pool.push(normal.chitauri_warrior, normal.brotherhood_mutant);
        if (this.currentWave >= 8) pool.push(normal.dark_elf, normal.ultron_drone);
        if (this.currentWave >= 14) pool.push(normal.hand_ninja, normal.doombot);
        if (this.currentWave >= 22) pool.push(normal.sentinel, normal.symbiote_spawn);
        if (this.currentWave >= 32) pool.push(normal.frost_giant_scout, normal.hellfire_guard);

        return pool.filter(Boolean);
    }

    scaleEnemy(config, multiplier, isBoss) {
        return {
            ...config,
            hp: Math.round(config.hp * multiplier),
            reward: Math.round((config.reward || 10) * (isBoss ? 1 : 1 + this.currentWave * 0.02)),
            isBoss: isBoss || config.isBoss || false
        };
    }

    getUniqueEnemies() {
        const unique = [];
        const seen = new Set();
        this.preparedQueue.forEach((entry) => {
            if (!seen.has(entry.config.id)) {
                seen.add(entry.config.id);
                const count = this.preparedQueue.filter((candidate) => candidate.config.id === entry.config.id).length;
                unique.push({ ...entry.config, previewCount: count });
            }
        });
        return unique;
    }

    startNextWave() {
        if (this.currentWave > this.maxWaves || this.isWaveActive || this.game.isGameOver) return;

        this.isWaveActive = true;
        this.spawnTimer = 0;
        this.enemiesQueue = [...this.preparedQueue];
        this.resetWaveLimitedItems();

        if (this.game.uiManager) {
            this.game.uiManager.setNextWaveEnabled(false);
            this.game.uiManager.showToast(`Oleada ${this.currentWave} en marcha`, 'info');
        }
    }

    resetWaveLimitedItems() {
        this.game.heroes.forEach((hero) => {
            hero.items.forEach((item) => {
                if (item.usedThisWave !== undefined) item.usedThisWave = false;
            });
        });
    }

    update(dt) {
        if (!this.isWaveActive) return;
        this.spawnTimer += dt;

        if (this.enemiesQueue.length > 0 && this.spawnTimer >= this.enemiesQueue[0].delay) {
            const enemyData = this.enemiesQueue.shift();
            this.game.enemies.push(new Enemy(enemyData.config, this.game.path));
            this.spawnTimer = 0;
            return;
        }

        if (this.enemiesQueue.length === 0 && this.game.enemies.length === 0) {
            this.finishWave();
        }
    }

    finishWave() {
        this.isWaveActive = false;
        const waveBounty = 110 + this.currentWave * 24;
        this.game.resourceManager.addCredits(waveBounty);

        if (!this.game.completedWaves.includes(this.currentWave)) {
            this.game.completedWaves.push(this.currentWave);
            this.game.stars += this.currentWave % 10 === 0 ? 3 : 1;
        }

        if (this.game.uiManager) {
            this.game.uiManager.showToast(`Oleada superada: +$${waveBounty}`, 'success');
        }

        this.currentWave++;

        if (this.currentWave > this.maxWaves) {
            if (this.game.uiManager) this.game.uiManager.showVictory();
            this.game.pause();
            return;
        }

        this.prepareNextWave();

        if (this.autoWave) {
            setTimeout(() => {
                if (this.autoWave && !this.isWaveActive && !this.game.isGameOver) this.startNextWave();
            }, 1600);
        }
    }
}
