export class ReplaySystem {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset(seed = 'campaign', levelId = 'level_1', modeId = 'campaign') {
        this.replay = { format: 'marvel-td-replay', version: 1, seed, levelId, modeId, actions: [] };
    }

    record(type, payload = {}) {
        this.replay.actions.push({ wave: this.game.waveManager?.currentWave || 1, type, payload });
    }

    exportReplay() {
        return JSON.stringify(this.replay, null, 2);
    }

    importReplay(source) {
        try {
            const replay = typeof source === 'string' ? JSON.parse(source) : source;
            if (replay?.format !== 'marvel-td-replay' || replay.version !== 1 || typeof replay.seed !== 'string' || !Array.isArray(replay.actions)) throw new Error('Replay no valido');
            this.replay = structuredClone(replay);
            return { ok: true, replay: this.replay };
        } catch (error) {
            return { ok: false, reason: error.message || 'Replay no valido' };
        }
    }
}
