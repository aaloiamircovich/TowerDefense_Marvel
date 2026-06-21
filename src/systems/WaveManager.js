import { Enemy } from '../entities/Enemy.js';

const FACTIONS = {
    'new-york': {
        label: 'Hydra / A.I.M.',
        roster: [
            ['hydra_soldier', 1], ['aim_scientist', 1], ['hand_ninja', 4],
            ['doombot', 8], ['dark_elf', 14], ['sentinel', 22]
        ],
        bosses: ['loki', 'magneto']
    },
    avengers: {
        label: 'Legión de Ultrón',
        roster: [
            ['ultron_drone', 1], ['doombot', 1], ['aim_scientist', 4],
            ['chitauri_warrior', 8], ['skrull_infiltrator', 14], ['sentinel', 20]
        ],
        bosses: ['ultron_prime', 'magneto']
    },
    wakanda: {
        label: 'Mercenarios / Outriders',
        roster: [
            ['outrider', 1], ['mercenary_raider', 1], ['chitauri_warrior', 4],
            ['sakaaran_soldier', 8], ['symbiote_spawn', 14], ['hellfire_guard', 20]
        ],
        bosses: ['killmonger', 'loki']
    }
};

const MODIFIERS = [
    { id: 'standard', label: 'Patrulla estándar', description: 'Composición equilibrada.' },
    { id: 'rush', label: 'Asalto relámpago', description: '+22% velocidad.', speedFactor: 1.22 },
    { id: 'shielded', label: 'Frente protegido', description: 'Todos despliegan barrera.', barrierRatio: 0.16 },
    { id: 'covert', label: 'Operación encubierta', description: 'La oleada entra en sigilo.', stealth: true },
    { id: 'swarm', label: 'Enjambre', description: '+35% unidades, -20% salud.', countFactor: 1.35, hpFactor: 0.8 },
    { id: 'elite', label: 'Escuadrón élite', description: '+25% salud y +10% armadura.', hpFactor: 1.25, armorBonus: 0.1 }
];

const DIFFICULTIES = {
    easy: { hp: 0.85, speed: 0.95, count: 0.9, reward: 0.9 },
    normal: { hp: 1, speed: 1, count: 1, reward: 1 },
    hard: { hp: 1.3, speed: 1.1, count: 1.15, reward: 1.25 }
};

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
        this.waveModifier = MODIFIERS[0];
        this.faction = this.getFaction();

        this.prepareNextWave();
    }

    prepareNextWave() {
        this.preparedQueue = [];
        if (this.currentWave > this.maxWaves) return;

        this.faction = this.getFaction();
        this.waveModifier = this.getWaveModifier();

        if (this.currentWave === this.maxWaves) {
            const config = this.data.bosses.thanos_final;
            this.preparedQueue.push({ config: this.scaleEnemy(config, 1.25, true), delay: 0 });
        } else if (this.currentWave % 10 === 0) {
            const config = this.getBossForWave();
            this.preparedQueue.push({ config: this.scaleEnemy(config, 1 + this.currentWave * 0.08, true), delay: 0 });
        } else {
            const baseCount = 7 + Math.floor(this.currentWave * 0.55);
            const difficulty = DIFFICULTIES[this.game.difficulty || 'normal'];
            const count = Math.max(1, Math.round(baseCount * (this.waveModifier.countFactor || 1) * difficulty.count));
            const interval = Math.max(0.45, 1.45 - this.currentWave / 65);
            const normalPool = this.getEnemyPoolForWave();

            for (let index = 0; index < count; index++) {
                const config = normalPool[(index + this.currentWave) % normalPool.length];
                this.preparedQueue.push({
                    config: this.scaleEnemy(config, 1 + this.currentWave * 0.045, false),
                    delay: index === 0 ? 0.2 : interval
                });
            }
        }

        if (this.game.uiManager) {
            this.game.uiManager.renderWavePreview(this.getUniqueEnemies(), this.waveModifier, this.faction, this.currentWave);
            this.game.uiManager.setNextWaveEnabled(true);
        }
    }

    getFaction() {
        const theme = this.game.currentLevel?.theme?.id || 'new-york';
        return FACTIONS[theme] || FACTIONS['new-york'];
    }

    getEnemyPoolForWave() {
        return this.faction.roster
            .filter(([, unlockWave]) => this.currentWave >= unlockWave)
            .map(([id]) => this.data.normal[id])
            .filter(Boolean);
    }

    getBossForWave() {
        const bossIndex = Math.max(0, this.currentWave / 10 - 1);
        const id = this.faction.bosses[bossIndex % this.faction.bosses.length];
        return this.data.bosses[id] || this.data.bosses.loki;
    }

    getWaveModifier() {
        if (this.currentWave % 10 === 0 || this.currentWave === this.maxWaves) {
            return { id: 'boss', label: 'Amenaza máxima', description: 'Jefe con múltiples fases.' };
        }
        return MODIFIERS[(this.currentWave - 1) % MODIFIERS.length];
    }

    scaleEnemy(config, multiplier, isBoss) {
        const modifier = isBoss ? {} : this.waveModifier;
        const difficulty = DIFFICULTIES[this.game.difficulty || 'normal'];
        return {
            ...config,
            hp: Math.round(config.hp * multiplier * (modifier.hpFactor || 1) * difficulty.hp),
            speed: Math.round(config.speed * (modifier.speedFactor || 1) * difficulty.speed),
            armor: Math.min(0.8, (config.armor || 0) + (modifier.armorBonus || 0)),
            barrierRatio: Math.max(config.barrierRatio || 0, modifier.barrierRatio || 0),
            stealth: modifier.stealth || config.stealth || false,
            reward: Math.round((config.reward ?? 10) * (isBoss ? 1 : 1 + this.currentWave * 0.02) * difficulty.reward),
            isBoss: isBoss || config.isBoss || false,
            waveModifier: this.waveModifier.id
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
            this.game.uiManager.showToast(`Oleada ${this.currentWave}: ${this.waveModifier.label}`, 'info');
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
            if (this.game.spawnEnemy) this.game.spawnEnemy(enemyData.config);
            else this.game.enemies.push(new Enemy(enemyData.config, this.game.path, this.game));
            this.spawnTimer = 0;
            return;
        }

        if (this.enemiesQueue.length === 0 && this.game.enemies.length === 0) this.finishWave();
    }

    finishWave() {
        this.isWaveActive = false;
        const waveBounty = 110 + this.currentWave * 24;
        this.game.resourceManager.addCredits(waveBounty);

        let metaReward = 0;
        if (!this.game.completedWaves.includes(this.currentWave)) {
            this.game.completedWaves.push(this.currentWave);
            if (this.game.progression) metaReward = this.game.progression.recordWave(this.game, this.currentWave);
            else this.game.stars += this.currentWave % 10 === 0 ? 3 : 1;
        }

        const metaCopy = metaReward > 0 ? ` · +${metaReward} Fondos` : '';
        this.game.uiManager?.showToast(`Oleada superada: +$${waveBounty}${metaCopy}`, 'success');
        this.currentWave++;

        if (this.currentWave > this.maxWaves) {
            this.game.uiManager?.showVictory();
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
