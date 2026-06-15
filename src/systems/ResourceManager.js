export class ResourceManager {
    constructor(gameInstance, initialLives = 20, initialCredits = 650) {
        this.game = gameInstance;
        this.reset(initialLives, initialCredits);
    }

    reset(initialLives = 20, initialCredits = 650) {
        this.maxLives = initialLives;
        this.lives = initialLives;
        this.credits = initialCredits;
    }

    addCredits(amount) {
        this.credits += Math.max(0, amount);
    }

    removeCredits(amount) {
        if (this.credits >= amount) {
            this.credits -= amount;
            return true;
        }
        return false;
    }

    addLife(amount = 1) {
        this.lives = Math.min(this.maxLives, this.lives + amount);
    }

    removeLife(amount = 1) {
        this.lives = Math.max(0, this.lives - amount);
        if (this.lives <= 0 && this.game && typeof this.game.gameOver === 'function') {
            this.game.gameOver();
        }
    }
}
