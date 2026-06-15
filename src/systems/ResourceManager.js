export class ResourceManager {
    constructor(game) {
        this.game = game;
        this.lives = 20;
        this.credits = 1500;
    }
    addCredits(amount) {
        this.credits += amount;
        this.game.playerProfile.stats.lifetimeCreditsEarned += amount;
    }
    removeCredits(amount) {
        if (this.game.isAdmin) return; // Créditos infinitos
        this.credits -= amount;
        this.game.playerProfile.stats.lifetimeCreditsSpent += amount;
        if (this.game.playerProfile.stats.lifetimeCreditsSpent >= 100000) {
            this.game.unlockAchievement('rich');
        }
        this.game.checkQuestProgress('spendCredits', amount);
    }
    addGems(amount) {
        this.game.playerProfile.gems += amount;
    }
    removeGems(amount) {
        if (this.game.isAdmin) return; // Gemas infinitas
        this.game.playerProfile.gems -= amount;
    }
    removeLife(amount) {
        if (this.game.isAdmin) return; // Invulnerabilidad
        this.lives -= amount;
        if (this.lives <= 0) {
            if (this.game.uiManager && this.game.uiManager.retryActive) {
                this.game.repeatWave();
            } else if (this.game.uiManager && this.game.uiManager.restartActive) {
                this.game.restartLevel();
            } else {
                this.game.gameOver();
            }
        }
    }
}