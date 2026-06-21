export class TacticalActionSystem {
    constructor(game) {
        this.game = game;
    }

    getCurrentWave() {
        return this.game.waveManager?.currentWave || 1;
    }

    getSellRefund(hero) {
        const invested = Number(hero?.deployedCost ?? hero?.config?.cost ?? 0);
        return Math.max(0, Math.floor(invested * 0.7));
    }

    canReposition(hero) {
        if (!hero || this.game.isGameOver || !this.game.heroes.includes(hero)) {
            return { ok: false, reason: 'El héroe no está desplegado.' };
        }
        if (hero.lastRepositionWave === this.getCurrentWave()) {
            return { ok: false, reason: 'Este héroe ya fue reposicionado en la oleada actual.' };
        }
        return { ok: true, reason: '' };
    }

    markRepositioned(hero) {
        const permission = this.canReposition(hero);
        if (!permission.ok) return permission;
        hero.lastRepositionWave = this.getCurrentWave();
        return { ok: true, reason: '' };
    }

    canSell(hero) {
        if (!hero || !this.game.heroes.includes(hero)) {
            return { ok: false, reason: 'El héroe no está desplegado.' };
        }
        if (this.game.waveManager?.isWaveActive) {
            return { ok: false, reason: 'La venta sólo está disponible entre oleadas.' };
        }
        return { ok: true, reason: '' };
    }

    sell(hero) {
        const permission = this.canSell(hero);
        if (!permission.ok) return permission;

        const refund = this.getSellRefund(hero);
        const index = this.game.heroes.indexOf(hero);
        this.game.heroes.splice(index, 1);
        this.game.resourceManager?.addCredits(refund);
        if (this.game.selectedUnit === hero) this.game.selectedUnit = null;
        return { ok: true, refund };
    }
}
