import { RandomSource } from '../utils/Random.js';

export const GAME_MODES = {
    daily: { id: 'daily', name: 'Operación diaria', icon: 'fa-calendar-day', description: 'Mapa, equipo y semilla compartidos durante el día.', maxWaves: 20 },
    boss_rush: { id: 'boss_rush', name: 'Boss Rush', icon: 'fa-skull-crossbones', description: 'Diez jefes consecutivos con recompensa entre combates.', maxWaves: 10 },
    survival: { id: 'survival', name: 'Supervivencia', icon: 'fa-infinity', description: 'Oleadas sin límite, hitos y extracción voluntaria.', maxWaves: Number.MAX_SAFE_INTEGER },
    draft: { id: 'draft', name: 'Draft heroico', icon: 'fa-layer-group', description: 'Empieza con tres héroes y elige refuerzos cada tres rondas.', maxWaves: 15 },
    convoy: { id: 'convoy', name: 'Defensa de convoy', icon: 'fa-truck-medical', description: 'Protege un objetivo móvil que avanza por el camino.', maxWaves: 20 }
};

export class GameModeSystem {
    constructor(game, progression) {
        this.game = game;
        this.progression = progression;
        this.reset();
    }

    reset() {
        this.modeId = 'campaign';
        this.score = 0;
        this.cleanStreak = 0;
        this.lastWaveScore = 0;
        this.lastStreakBonus = 0;
        this.finished = false;
        this.seedKey = 'campaign';
        this.draftPool = [];
        this.pendingDraft = [];
        this.convoy = { progress: 0.04, integrity: 100 };
    }

    setCampaign() {
        this.reset();
        this.publish();
    }

    start(modeId) {
        const mode = GAME_MODES[modeId];
        if (!mode) return false;
        const levels = this.game.levelsData || [];
        const dateKey = new Date().toISOString().slice(0, 10);
        const random = new RandomSource(`${modeId}:${dateKey}`);
        const level = modeId === 'daily' ? levels[Math.floor(random.next() * levels.length)] : this.game.currentLevel || levels[0];

        this.reset();
        this.modeId = modeId;
        this.seedKey = modeId === 'daily' ? `${modeId}:${dateKey}` : `${modeId}:${level.id}`;
        if (modeId === 'draft') this.prepareDraftRoster(random);
        if (modeId === 'daily') this.prepareDailyRoster(random);
        this.game.loadLevel(level, { preserveMode: true });
        return true;
    }

    configureRun() {
        if (this.modeId === 'campaign') return;
        const mode = GAME_MODES[this.modeId];
        this.game.waveManager.maxWaves = mode.maxWaves;
        if (this.modeId === 'boss_rush') this.game.resourceManager.reset(30, 900);
        if (this.modeId === 'survival') this.game.resourceManager.reset(20, 750);
        if (this.modeId === 'convoy') {
            this.game.resourceManager.reset(20, 700);
            this.convoy = { progress: 0.04, integrity: 100 };
        }
        this.publish();
    }

    prepareDailyRoster(random) {
        const heroes = Object.values(this.game.heroDatabase || {});
        this.game.activeTeam = sampleUnique(heroes, 6, random);
    }

    prepareDraftRoster(random) {
        const heroes = Object.values(this.game.heroDatabase || {});
        const shuffled = sampleUnique(heroes, heroes.length, random);
        this.game.activeTeam = shuffled.slice(0, 3);
        this.draftPool = shuffled.slice(3);
    }

    buildWave(waveNumber, manager) {
        if (this.modeId !== 'boss_rush') return null;
        const bosses = Object.values(manager.data.bosses);
        const boss = bosses[(waveNumber - 1) % bosses.length];
        return [{ config: manager.scaleEnemy(boss, 0.8 + waveNumber * 0.16, true), delay: 0.2 }];
    }

    onWaveFinished(waveNumber) {
        if (this.modeId === 'campaign' || this.finished) return;
        const lives = this.game.resourceManager.lives;
        const startLives = this.game.waveManager?.waveStartSnapshot?.lives ?? lives;
        const leaks = Math.max(0, startLives - lives);
        this.cleanStreak = leaks === 0 ? this.cleanStreak + 1 : 0;
        this.lastStreakBonus = this.cleanStreak >= 2 ? Math.min(250, this.cleanStreak * 35) : 0;
        this.lastWaveScore = Math.round(100 * waveNumber + lives * 12 + (this.modeId === 'boss_rush' ? 250 : 0) + this.lastStreakBonus);
        this.score += this.lastWaveScore;
        if (this.modeId === 'boss_rush') this.game.resourceManager.addCredits(180 + waveNumber * 35);
        if (this.modeId === 'survival' && waveNumber % 5 === 0) {
            this.game.resourceManager.addCredits(300);
            this.game.resourceManager.addLife(1);
            this.game.uiManager?.showToast(`Hito ${waveNumber}: +$300 y +1 vida`, 'reward');
        }
        if (this.modeId === 'draft' && waveNumber % 3 === 0 && this.draftPool.length) this.offerDraft();
        this.publish();
    }

    offerDraft() {
        this.pendingDraft = this.draftPool.splice(0, Math.min(3, this.draftPool.length));
        this.game.pause();
        this.game.uiManager?.showDraftChoice(this.pendingDraft, (heroId) => this.chooseDraft(heroId));
    }

    chooseDraft(heroId) {
        const hero = this.pendingDraft.find((candidate) => candidate.id === heroId);
        if (!hero) return false;
        if (this.game.activeTeam.length < 6) this.game.activeTeam.push(hero);
        else this.game.activeTeam[this.game.activeTeam.length - 1] = hero;
        this.pendingDraft = [];
        this.game.replaySystem?.record('draft', { heroId });
        this.game.uiManager?.renderHeroRoster(this.game.activeTeam, (config) => this.game.inputManager.setPlacementMode(config));
        this.game.uiManager?.closePanel();
        this.game.start();
        this.publish();
        return true;
    }

    update(dt) {
        if (this.modeId !== 'convoy' || !this.game.waveManager?.isWaveActive || this.finished) return;
        this.convoy.progress = Math.min(0.96, this.convoy.progress + dt / 95);
        this.publish(false);
    }

    handleLeak(enemy) {
        if (this.modeId !== 'convoy') return false;
        this.convoy.integrity = Math.max(0, this.convoy.integrity - (enemy.isBoss ? 25 : 8));
        if (this.convoy.integrity <= 0) this.game.gameOver();
        this.publish();
        return true;
    }

    render(ctx) {
        if (this.modeId !== 'convoy') return;
        const point = pointAlongPath(this.game.path, this.convoy.progress);
        if (!point) return;
        ctx.save();
        ctx.fillStyle = '#071018';
        ctx.strokeStyle = this.convoy.integrity > 40 ? '#69e58c' : '#ff6b6b';
        ctx.lineWidth = 4;
        ctx.fillRect(point.x - 20, point.y - 13, 40, 26);
        ctx.strokeRect(point.x - 20, point.y - 13, 40, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(`CONVOY ${this.convoy.integrity}%`, point.x, point.y + 2);
        ctx.restore();
    }

    extract() {
        if (this.modeId !== 'survival' || this.finished || this.game.waveManager?.isWaveActive) return false;
        this.finishRun('extracted');
        this.game.pause();
        this.game.uiManager?.showModeResult('Extracción completada', this.getSnapshot());
        return true;
    }

    repair() {
        if (this.modeId !== 'boss_rush' || this.game.waveManager?.isWaveActive || this.game.resourceManager.lives >= this.game.resourceManager.maxLives) return false;
        if (!this.game.resourceManager.removeCredits(120)) return false;
        this.game.resourceManager.addLife(2);
        this.game.uiManager?.showToast('Taller de campo: +2 vidas', 'success');
        this.publish();
        return true;
    }

    finishRun(result = 'defeat') {
        if (this.modeId === 'campaign' || this.finished) return;
        this.finished = true;
        const wave = this.game.waveManager?.currentWave || 1;
        this.progression?.recordModeScore(this.modeId, this.score, wave, result, this.seedKey);
        this.progression?.recordMissionSummary?.(this.game, result === 'victory' ? 'victory' : result);
        this.publish();
    }

    getSeed() {
        return this.seedKey;
    }

    getSnapshot() {
        const mode = GAME_MODES[this.modeId];
        if (!mode) return null;
        const best = this.progression?.getModeRecord(this.modeId)?.bestScore || 0;
        const streakDetail = this.cleanStreak >= 2 ? `Racha limpia x${this.cleanStreak} (+${this.lastStreakBonus})` : null;
        return {
            id: this.modeId, name: mode.name, score: this.score, best,
            wave: this.game.waveManager?.currentWave || 1,
            detail: this.modeId === 'convoy' ? `Integridad ${this.convoy.integrity}%`
                : this.modeId === 'draft' ? `Equipo ${this.game.activeTeam.length}/6`
                    : this.modeId === 'survival' ? 'Extracción disponible entre oleadas' : `Récord ${best}`,
            streakDetail,
            cleanStreak: this.cleanStreak,
            lastWaveScore: this.lastWaveScore,
            lastStreakBonus: this.lastStreakBonus,
            canExtract: this.modeId === 'survival' && !this.game.waveManager?.isWaveActive && !this.finished,
            canRepair: this.modeId === 'boss_rush' && !this.game.waveManager?.isWaveActive && this.game.resourceManager.lives < this.game.resourceManager.maxLives && !this.finished
        };
    }

    publish(force = true) {
        if (!force && Math.floor(this.convoy.progress * 100) % 2) return;
        this.game.uiManager?.updateModeStatus(this.getSnapshot());
    }
}

function sampleUnique(values, count, random) {
    const pool = [...values];
    const result = [];
    while (pool.length && result.length < count) result.push(pool.splice(Math.floor(random.next() * pool.length), 1)[0]);
    return result;
}

function pointAlongPath(path, progress) {
    if (!path?.length) return null;
    const lengths = [];
    let total = 0;
    for (let index = 1; index < path.length; index++) { const length = Math.hypot(path[index].x - path[index - 1].x, path[index].y - path[index - 1].y); lengths.push(length); total += length; }
    let target = total * progress;
    for (let index = 0; index < lengths.length; index++) {
        if (target <= lengths[index]) { const ratio = target / lengths[index]; return { x: path[index].x + (path[index + 1].x - path[index].x) * ratio, y: path[index].y + (path[index + 1].y - path[index].y) * ratio }; }
        target -= lengths[index];
    }
    return path.at(-1);
}
