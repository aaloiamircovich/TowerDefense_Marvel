import { Enemy } from '../entities/Enemy.js';
import { EncounterDirector } from './EncounterDirector.js';

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
    },
    sanctum: {
        label: 'Dimensión Oscura',
        roster: [
            ['dark_elf', 1], ['hand_ninja', 1], ['frost_giant_scout', 5],
            ['symbiote_spawn', 10], ['hellfire_guard', 16], ['skrull_infiltrator', 22]
        ],
        bosses: ['dormammu', 'loki']
    },
    'x-mansion': {
        label: 'Centinelas / Hermandad',
        roster: [
            ['sentinel', 1], ['brotherhood_mutant', 1], ['mercenary_raider', 5],
            ['hellfire_guard', 10], ['skrull_infiltrator', 16], ['doombot', 22]
        ],
        bosses: ['magneto', 'apocalypse']
    },
    knowhere: {
        label: 'Kree / Chitauri / Orden Negra',
        roster: [
            ['chitauri_warrior', 1], ['chitauri_skimmer', 1], ['kree_sentry', 5],
            ['chitauri_phaser', 9], ['kree_commander', 14], ['black_order_hunter', 19], ['black_order_magus', 24]
        ],
        bosses: ['kang', 'galactus']
    },
    latveria: {
        label: 'Ejército de Doom',
        roster: [
            ['doombot', 1], ['aim_scientist', 1], ['hydra_soldier', 5],
            ['ultron_drone', 10], ['hellfire_guard', 16], ['sentinel', 22]
        ],
        bosses: ['doctor_doom', 'red_skull']
    },
    asgard: {
        label: 'Elfos Oscuros / Gigantes',
        roster: [
            ['dark_elf_skirmisher', 1], ['frost_giant_scout', 1], ['asgardian_traitor', 5],
            ['dark_elf', 9], ['hellfire_guard', 15], ['mindless_one', 22]
        ],
        bosses: ['malekith', 'hela']
    },
    'dark-dimension': {
        label: 'Dimensión Oscura / Zealots',
        roster: [
            ['dark_zealot', 1], ['dark_elf', 1], ['mindless_one', 5],
            ['hellfire_guard', 10], ['black_order_magus', 16], ['symbiote_spawn', 22]
        ],
        bosses: ['baron_mordo', 'dormammu']
    },
    'savage-land': {
        label: 'Bestias / Mutados',
        roster: [
            ['savage_raptor', 1], ['mercenary_raider', 1], ['savage_brute', 5],
            ['brotherhood_mutant', 10], ['sakaaran_soldier', 16], ['sentinel', 22]
        ],
        bosses: ['sauron', 'apocalypse']
    },
    'the-raft': {
        label: 'Prisioneros / Saboteadores',
        roster: [
            ['raft_escapee', 1], ['raft_saboteur', 1], ['mercenary_raider', 5],
            ['symbiote_spawn', 10], ['hellfire_guard', 16], ['ultron_drone', 22]
        ],
        bosses: ['abomination', 'green_goblin']
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

const OPENING_WAVES = {
    'new-york': [
        { label: 'Reconocimiento Hydra', counter: 'Coloca daño temprano junto a la avenida', enemies: [['hydra_soldier', 4], ['aim_scientist', 3]] },
        { label: 'Tecnicos A.I.M.', counter: 'Prioriza soportes antes de que curen', enemies: [['aim_scientist', 4], ['hydra_soldier', 4]] },
        { label: 'Escudos en la Quinta', counter: 'Perforacion y dano sostenido', enemies: [['hydra_soldier', 7], ['aim_scientist', 2]] },
        { label: 'La Mano tantea tejados', counter: 'Detección si está disponible; si no, contención', enemies: [['hand_ninja', 3], ['hydra_soldier', 5], ['aim_scientist', 2]] },
        { label: 'Bloqueo coordinado', counter: 'Mejora un héroe antes del élite', enemies: [['hydra_soldier', 6], ['aim_scientist', 3], ['hand_ninja', 2]], elite: 'hydra_soldier' }
    ],
    avengers: [
        { label: 'Drones de intrusión', counter: 'Cobertura antiaérea temprana', enemies: [['ultron_drone', 5], ['doombot', 2]] },
        { label: 'Doombots de apoyo', counter: 'Controla invocadores primero', enemies: [['doombot', 3], ['ultron_drone', 4]] },
        { label: 'Red sincronizada', counter: 'Daño sostenido contra blindaje', enemies: [['ultron_drone', 6], ['doombot', 3]] },
        { label: 'Hackeo de hangar', counter: 'Usa la puerta de seguridad', enemies: [['doombot', 4], ['aim_scientist', 3], ['ultron_drone', 3]] },
        { label: 'Nodo Prime menor', counter: 'Mejora un héroe antes del élite', enemies: [['ultron_drone', 5], ['doombot', 4]], elite: 'doombot' }
    ]
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
        this.director = new EncounterDirector(gameInstance);
        this.selectedBranch = null;
        this.waveStartSnapshot = null;

        this.prepareNextWave();
    }

    prepareNextWave() {
        this.preparedQueue = [];
        if (this.currentWave > this.maxWaves) return;

        this.faction = this.getFaction();
        this.waveModifier = this.director.sanitizeModifier(this.getWaveModifier(), this.getTeamCapabilities());
        const modeQueue = this.game.modeSystem?.buildWave(this.currentWave, this);
        const scriptedQueue = this.getScriptedOpeningWave();

        if (modeQueue) {
            this.preparedQueue.push(...modeQueue);
        } else if (scriptedQueue) {
            this.preparedQueue.push(...scriptedQueue);
        } else if (this.currentWave === this.maxWaves) {
            const config = this.data.bosses.thanos_final;
            this.preparedQueue.push({ config: this.scaleEnemy(config, 1.25, true), delay: 0 });
        } else if (this.currentWave % 10 === 0) {
            const config = this.getBossForWave();
            this.preparedQueue.push({ config: this.scaleEnemy(config, 1 + this.currentWave * 0.08, true), delay: 0 });
        } else {
            const difficulty = DIFFICULTIES[this.game.difficulty || 'normal'];
            const interval = Math.max(0.45, 1.45 - this.currentWave / 65);
            const normalPool = this.getEnemyPoolForWave();
            const encounter = this.director.compose(normalPool, this.currentWave, this.selectedBranch || 'safe', this.getTeamCapabilities());
            const countFactor = (this.waveModifier.countFactor || 1) * difficulty.count;
            const adjustedEncounter = countFactor > 1 ? [...encounter, ...encounter.slice(0, Math.round(encounter.length * (countFactor - 1)))] : [...encounter];
            while (this.currentWave <= 2 && adjustedEncounter.length < 7 && encounter.length) {
                adjustedEncounter.push(encounter[adjustedEncounter.length % encounter.length]);
            }

            for (let index = 0; index < adjustedEncounter.length; index++) {
                const config = adjustedEncounter[index];
                this.preparedQueue.push({
                    config: this.scaleEnemy(config, 1 + this.currentWave * 0.045, false),
                    delay: index === 0 ? 0.2 : interval
                });
            }
        }

        if (this.game.uiManager) {
            const summary = this.buildPreparedSummary();
            this.game.uiManager.renderWavePreview(
                this.getUniqueEnemies(),
                this.waveModifier,
                this.faction,
                this.currentWave,
                summary
            );
            this.game.uiManager.setNextWaveEnabled(true, summary);
        }
    }

    buildPreparedSummary() {
        return {
            ...this.getWaveSummary(),
            spawnTimeline: this.getSpawnTimeline(),
            perfectBonus: this.getPerfectWaveBonus(),
            branchOptions: this.director.getBranchOptions(this.currentWave),
            selectedBranch: this.selectedBranch || 'safe'
        };
    }

    refreshWaveIntel() {
        if (!this.game.uiManager || this.isWaveActive || this.currentWave > this.maxWaves) return null;
        const summary = this.buildPreparedSummary();
        this.game.uiManager.renderWavePreview(
            this.getUniqueEnemies(),
            this.waveModifier,
            this.faction,
            this.currentWave,
            summary
        );
        this.game.uiManager.setNextWaveEnabled(true, summary);
        return summary;
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
        const scripted = this.getOpeningScript();
        if (scripted) {
            return {
                id: `opening-${this.currentWave}`,
                label: scripted.label,
                description: scripted.counter || 'Apertura dirigida de campaña.'
            };
        }
        if (this.currentWave % 10 === 0 || this.currentWave === this.maxWaves) {
            return { id: 'boss', label: 'Amenaza máxima', description: 'Jefe con múltiples fases.' };
        }
        return MODIFIERS[(this.currentWave - 1) % MODIFIERS.length];
    }

    getOpeningScript() {
        if (this.currentWave > 5 || (this.game.modeSystem?.modeId && this.game.modeSystem.modeId !== 'campaign')) return null;
        if (this.director.getBranchOptions(this.currentWave).length > 0) return null;
        const theme = this.game.currentLevel?.theme?.id || 'new-york';
        const scripted = OPENING_WAVES[theme]?.[this.currentWave - 1];
        if (scripted) return scripted;

        const roster = this.faction?.roster || FACTIONS['new-york'].roster;
        const primary = roster[0]?.[0];
        const secondary = roster[1]?.[0] || primary;
        return {
            label: `Apertura ${this.currentWave}`,
            counter: 'Lee la composición antes de gastar créditos',
            enemies: [[primary, 4 + this.currentWave], [secondary, 2 + Math.floor(this.currentWave / 2)]],
            elite: this.currentWave === 5 ? primary : null
        };
    }

    getScriptedOpeningWave() {
        const script = this.getOpeningScript();
        if (!script) return null;

        const capabilities = this.getTeamCapabilities();
        const difficulty = DIFFICULTIES[this.game.difficulty || 'normal'];
        const fallbackId = this.faction.roster[0]?.[0];
        const queue = [];
        for (const [enemyId, count] of script.enemies) {
            const base = this.getCounterSafeEnemy(enemyId, fallbackId, capabilities);
            if (!base) continue;
            const adjustedCount = Math.max(1, Math.round(count * difficulty.count));
            for (let index = 0; index < adjustedCount; index++) {
                queue.push({
                    config: this.scaleEnemy(base, 0.88 + this.currentWave * 0.035, false),
                    delay: index === 0 && queue.length === 0 ? 0.2 : Math.max(0.52, 1.08 - this.currentWave * 0.04)
                });
            }
        }

        if (script.elite) {
            const eliteBase = this.getCounterSafeEnemy(script.elite, fallbackId, capabilities);
            if (eliteBase) queue.push({
                config: this.director.createMiniBoss(eliteBase, { id: 'commander', label: 'Comandante' }, 1),
                delay: 1.15
            });
        }

        return queue.length ? queue : null;
    }

    getCounterSafeEnemy(enemyId, fallbackId, capabilities) {
        const isUnsafe = (enemy) => capabilities.detection === false && (enemy?.stealth || enemy?.archetype === 'stealth' || enemy?.archetype === 'phaser');
        const candidate = this.data.normal[enemyId];
        if (candidate && !isUnsafe(candidate)) return candidate;
        const fallback = this.data.normal[fallbackId];
        if (fallback && !isUnsafe(fallback)) return fallback;
        return this.getEnemyPoolForWave().find((enemy) => !isUnsafe(enemy));
    }

    getTeamCapabilities() {
        const heroes = (this.game.heroes?.length ? this.game.heroes : this.game.activeTeam || []).map((entry) => entry.config || entry);
        if (!heroes.length) return { detection: true, penetration: true, control: true };
        return {
            detection: heroes.some((hero) => hero.canSeeStealth || (hero.teamMetrics?.detection || 0) >= 4),
            penetration: heroes.some((hero) => ['iron_man', 'vision', 'hawkeye', 'winter_soldier', 'cyclops', 'silver_surfer'].includes(hero.id)),
            control: heroes.some((hero) => (hero.teamMetrics?.control || 0) >= 4)
        };
    }

    chooseBranch(branchId) {
        if (!this.director.getBranchOptions(this.currentWave).some((option) => option.id === branchId)) return false;
        this.selectedBranch = branchId;
        this.game.replaySystem?.record('branch', { branchId });
        this.prepareNextWave();
        return true;
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

    getSpawnTimeline(limit = 5) {
        const groups = [];
        let elapsed = 0;
        let overflow = 0;

        for (const entry of this.preparedQueue) {
            elapsed += Math.max(0, Number(entry.delay || 0));
            const config = entry.config || {};
            const id = config.id || config.name || 'enemy';
            const previous = groups.at(-1);

            if (previous && previous.id === id) {
                previous.count++;
                previous.lastEta = Number(elapsed.toFixed(1));
                previous.maxThreat = Math.max(previous.maxThreat, Number(config.threat || 1));
                previous.danger = this.getTimelineDanger(previous);
                continue;
            }

            if (groups.length >= limit) {
                overflow++;
                continue;
            }

            const group = {
                id,
                name: config.name || 'Enemigo',
                count: 1,
                firstEta: Number(elapsed.toFixed(1)),
                lastEta: Number(elapsed.toFixed(1)),
                maxThreat: Math.max(1, Number(config.threat || 1)),
                role: config.archetype || (config.isBoss ? 'boss' : 'soldier'),
                isBoss: Boolean(config.isBoss),
                isElite: Boolean(config.isElite || config.affix || config.phaseLabel || Number(config.threat || 0) >= 5)
            };
            group.danger = this.getTimelineDanger(group);
            groups.push(group);
        }

        return {
            entries: groups.map((group) => ({
                ...group,
                etaLabel: group.firstEta === group.lastEta ? `${group.firstEta}s` : `${group.firstEta}-${group.lastEta}s`
            })),
            overflow,
            totalEnemies: this.preparedQueue.length,
            totalDuration: Number(elapsed.toFixed(1))
        };
    }

    getTimelineDanger(group) {
        if (group.isBoss) return 'critical';
        if (group.isElite || group.maxThreat >= 5) return 'high';
        if (group.maxThreat >= 3) return 'guarded';
        return 'low';
    }

    getWaveSummary() {
        const roles = new Set();
        let reward = 110 + this.currentWave * 24;
        let fastest = 0;
        let maxThreat = 1;
        let stealthCount = 0;
        let barrierCount = 0;
        let armoredCount = 0;
        let hasBoss = false;

        this.preparedQueue.forEach(({ config }) => {
            roles.add(config.archetype || (config.isBoss ? 'boss' : 'soldier'));
            reward += config.reward || 0;
            fastest = Math.max(fastest, config.speed || 0);
            maxThreat = Math.max(maxThreat, config.threat || 1);
            if (config.stealth) stealthCount++;
            if ((config.barrierRatio || 0) > 0) barrierCount++;
            if ((config.armor || 0) >= 0.15) armoredCount++;
            if (config.isBoss) hasBoss = true;
        });

        let counter = 'Daño equilibrado';
        if (this.getOpeningScript()?.counter) counter = this.getOpeningScript().counter;
        else if (hasBoss) counter = 'Daño sostenido';
        else if (stealthCount > 0) counter = 'Detección de sigilo';
        else if (roles.has('shield') || roles.has('tank')) counter = 'Perforación y control';
        else if (roles.has('runner')) counter = 'Ralentización';
        else if (roles.has('flying')) counter = 'Alcance y cadenas';

        const pressureScore = Math.round(
            this.preparedQueue.length * 0.65
            + maxThreat * 2.2
            + fastest / 34
            + stealthCount * 1.5
            + barrierCount * 0.85
            + armoredCount * 0.75
            + (hasBoss ? 8 : 0)
        );

        return {
            total: this.preparedQueue.length,
            reward,
            fastest,
            maxThreat,
            stealthCount,
            barrierCount,
            armoredCount,
            hasBoss,
            roles: [...roles],
            counter,
            pressureScore,
            threatTier: this.getThreatTier(pressureScore),
            readiness: this.getReadinessForSummary(pressureScore)
        };
    }

    getThreatTier(score) {
        if (score >= 24) return { id: 'critical', label: 'Amenaza critica', advice: 'Invierte o reposiciona antes de iniciar.' };
        if (score >= 18) return { id: 'high', label: 'Amenaza alta', advice: 'Refuerza dano o control.' };
        if (score >= 12) return { id: 'guarded', label: 'Amenaza media', advice: 'Revisa counters y cobertura.' };
        return { id: 'low', label: 'Amenaza baja', advice: 'Buen momento para ahorrar.' };
    }

    getReadinessForSummary(pressureScore) {
        const heroes = this.game.heroes || [];
        if (!heroes.length) {
            return {
                id: 'empty',
                label: 'Sin defensa',
                score: 0,
                margin: -pressureScore,
                advice: 'Despliega al menos un heroe antes de iniciar.'
            };
        }

        const teamScore = heroes.reduce((total, hero) => {
            const stats = hero.getEffectiveStats?.() || hero;
            const damage = Number(stats.damage || hero.damage || 0);
            const fireRate = Number(stats.fireRate || hero.fireRate || 1);
            const range = Number(stats.range || hero.range || 100);
            const level = Number(hero.level || hero.config?.level || 1);
            const detection = hero.canSeeStealth || stats.canSeeStealth ? 1.6 : 0;
            const control = (hero.config?.teamMetrics?.control || hero.teamMetrics?.control || 0) >= 4 ? 1.4 : 0;
            return total + 4 + damage * fireRate / 36 + Math.min(2.4, range / 95) + level * 0.65 + detection + control;
        }, 0);
        const creditReserve = Math.min(4, (this.game.resourceManager?.credits || 0) / 180);
        const score = Math.round(teamScore + creditReserve);
        const margin = score - pressureScore;

        if (margin >= 7) return { id: 'ready', label: 'Preparado', score, margin, advice: 'Puedes iniciar o ahorrar para escalar.' };
        if (margin >= 0) return { id: 'stable', label: 'Defensa estable', score, margin, advice: 'Listo, pero vigila counters y fugas.' };
        if (margin >= -7) return { id: 'thin', label: 'Defensa justa', score, margin, advice: 'Mejora o coloca apoyo si tienes creditos.' };
        return { id: 'underbuilt', label: 'Defensa debil', score, margin, advice: 'Coloca otro heroe antes de iniciar.' };
    }

    startNextWave() {
        if (this.currentWave > this.maxWaves || this.isWaveActive || this.game.isGameOver || this.game.modeSystem?.pendingDraft?.length) return;

        this.waveStartSnapshot = this.captureWaveSnapshot(this.currentWave);
        this.game.missionSystem?.onWaveStart(this.currentWave);
        this.game.audio?.play('wave');
        this.isWaveActive = true;
        this.spawnTimer = 0;
        this.enemiesQueue = [...this.preparedQueue];
        this.resetWaveLimitedItems();

        if (this.game.uiManager) {
            this.game.uiManager.setNextWaveEnabled(false);
            this.game.uiManager.clearWaveReport?.();
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
            let spawnedEnemy;
            if (this.game.spawnEnemy) {
                spawnedEnemy = this.game.spawnEnemy(enemyData.config);
            } else {
                spawnedEnemy = new Enemy(enemyData.config, this.game.path, this.game);
                this.game.enemies.push(spawnedEnemy);
            }
            this.announceSpawn(spawnedEnemy, enemyData.config);
            this.spawnTimer = 0;
            return;
        }

        if (this.enemiesQueue.length === 0 && this.game.enemies.length === 0) this.finishWave();
    }

    announceSpawn(enemy, config = {}) {
        if (!enemy && !config) return;
        const isBoss = Boolean(config.isBoss || enemy?.isBoss);
        const isElite = Boolean(
            config.isElite ||
            config.affix ||
            config.phaseLabel ||
            Number(config.threat || enemy?.threat || 0) >= 5
        );
        if (!isBoss && !isElite) return;

        const name = config.name || enemy?.name || (isBoss ? 'Jefe' : 'Elite');
        const label = isBoss ? 'Jefe' : 'Elite';
        const color = isBoss ? '#ff3b3b' : '#fca311';
        const radius = isBoss ? 86 : 58;
        const x = Number.isFinite(enemy?.x) ? enemy.x : this.game.path?.[0]?.x || 0;
        const y = Number.isFinite(enemy?.y) ? enemy.y : this.game.path?.[0]?.y || 0;

        this.game.uiManager?.showToast(`${label} en ruta: ${name}`, 'warning');
        this.game.audio?.play(isBoss ? 'boss' : 'warning');
        this.game.vfx?.addRing?.(x, y, { color, radius, duration: isBoss ? 0.82 : 0.55 });
        this.game.vfx?.addFloatingText?.(x, y - 28, label.toUpperCase(), {
            color,
            size: isBoss ? 20 : 16,
            velocityY: -26,
            duration: 0.92
        });
    }

    finishWave() {
        this.isWaveActive = false;
        this.game.uiManager?.updateCombatPressure?.([], this.game.path, false);
        this.game.missionSystem?.onWaveFinished(this.currentWave);
        this.game.modeSystem?.onWaveFinished(this.currentWave);
        const waveBounty = 110 + this.currentWave * 24;
        const cleanBonus = this.getCleanWaveBonus();
        this.game.resourceManager.addCredits(waveBounty);
        if (cleanBonus > 0) this.game.resourceManager.addCredits(cleanBonus);

        let metaReward = 0;
        if (!this.game.completedWaves.includes(this.currentWave)) {
            this.game.completedWaves.push(this.currentWave);
            if (this.game.progression && (!this.game.modeSystem || this.game.modeSystem.modeId === 'campaign')) metaReward = this.game.progression.recordWave(this.game, this.currentWave);
            else this.game.stars += this.currentWave % 10 === 0 ? 3 : 1;
        }
        const masteryUnlocked = (this.game.heroes || []).flatMap((hero) => this.game.progression?.evaluateHeroMastery?.(hero) || []);
        this.game.uiManager?.renderWaveReport?.(this.buildWaveReport(waveBounty, metaReward, masteryUnlocked, cleanBonus));

        const metaCopy = metaReward > 0 ? ` · +${metaReward} Fondos` : '';
        const masteryCopy = masteryUnlocked.length ? ` · ${masteryUnlocked.length} maestria` : '';
        this.game.uiManager?.showToast(`Oleada superada: +$${waveBounty}${metaCopy}${masteryCopy}`, 'reward');
        this.currentWave++;
        this.selectedBranch = null;

        if (this.currentWave > this.maxWaves) {
            this.game.modeSystem?.finishRun('victory');
            this.game.progression?.recordMissionSummary?.(this.game, 'victory');
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

    getCleanWaveBonus() {
        if (!this.waveStartSnapshot) return 0;
        const startLives = Number(this.waveStartSnapshot.lives || 0);
        const currentLives = Number(this.game.resourceManager?.lives || 0);
        if (startLives <= 0 || currentLives < startLives) return 0;
        return this.getPerfectWaveBonus();
    }

    getPerfectWaveBonus(wave = this.currentWave) {
        return Math.min(140, 24 + Math.max(1, Number(wave || 1)) * 6);
    }

    captureWaveSnapshot(wave = this.currentWave) {
        const heroStats = {};
        for (const hero of this.game.heroes || []) {
            const stats = hero.combatStats || {};
            const id = hero.id || hero.config?.id || hero.name;
            if (!id) continue;
            heroStats[id] = {
                name: hero.name || hero.config?.name || id,
                damage: Number(stats.damageDealt || 0),
                kills: Number(stats.kills || 0),
                gold: Number(stats.goldGenerated || 0),
                abilities: Number(stats.abilityActivations || 0)
            };
        }

        return {
            wave,
            lives: Number(this.game.resourceManager?.lives || 0),
            credits: Number(this.game.resourceManager?.credits || 0),
            heroStats
        };
    }

    buildWaveReport(waveBounty = 0, metaReward = 0, masteryUnlocked = [], cleanBonus = 0) {
        const start = this.waveStartSnapshot || this.captureWaveSnapshot(this.currentWave);
        const currentLives = Number(this.game.resourceManager?.lives || 0);
        const currentCredits = Number(this.game.resourceManager?.credits || 0);
        const heroDeltas = (this.game.heroes || []).map((hero) => {
            const id = hero.id || hero.config?.id || hero.name;
            const startStats = start.heroStats?.[id] || {};
            const stats = hero.combatStats || {};
            const damage = Math.max(0, Number(stats.damageDealt || 0) - Number(startStats.damage || 0));
            const kills = Math.max(0, Number(stats.kills || 0) - Number(startStats.kills || 0));
            return {
                id,
                name: hero.name || hero.config?.name || startStats.name || id || 'Heroe',
                damage,
                kills,
                score: damage + kills * 120
            };
        });

        const totals = heroDeltas.reduce((sum, hero) => ({
            damage: sum.damage + hero.damage,
            kills: sum.kills + hero.kills
        }), { damage: 0, kills: 0 });
        const best = heroDeltas.sort((a, b) => b.score - a.score)[0];
        const leaks = Math.max(0, Number(start.lives || currentLives) - currentLives);
        const credits = Math.max(0, Math.round(currentCredits - Number(start.credits || 0)));

        return {
            wave: start.wave || this.currentWave,
            leaks,
            lives: currentLives,
            kills: totals.kills,
            damage: totals.damage,
            credits,
            bounty: waveBounty,
            cleanBonus: Math.max(0, Number(cleanBonus || 0)),
            metaReward,
            mastery: masteryUnlocked.length,
            bestHero: best?.score > 0 ? best.name : 'Sin MVP',
            bestHeroId: best?.score > 0 ? best.id : '',
            bestHeroKills: best?.kills || 0,
            bestHeroDamage: best?.damage || 0,
            pressure: leaks > 0 ? 'thin' : 'stable'
        };
    }
}
