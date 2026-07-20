export class TacticalActionSystem {
    constructor(game) {
        this.game = game;
    }

    getCurrentWave() {
        return this.game.waveManager?.currentWave || 1;
    }

    getSellRefund(hero) {
        return 0;
    }

    canReposition(hero) {
        if (!hero || this.game.isGameOver || !this.game.heroes.includes(hero)) {
            return { ok: false, reason: 'El héroe no está desplegado.' };
        }
        return { ok: true, reason: '' };
    }

    markRepositioned(hero) {
        const permission = this.canReposition(hero);
        if (!permission.ok) return permission;
        return { ok: true, reason: '' };
    }

    canSell(hero) {
        if (!hero || !this.game.heroes.includes(hero)) {
            return { ok: false, reason: 'El héroe no está desplegado.' };
        }
        return { ok: true, reason: '' };
    }

    sell(hero) {
        const permission = this.canSell(hero);
        if (!permission.ok) return permission;

        const index = this.game.heroes.indexOf(hero);
        this.game.heroes.splice(index, 1);
        if (this.game.selectedUnit === hero) this.game.selectedUnit = null;
        return { ok: true, refund: 0 };
    }
}
