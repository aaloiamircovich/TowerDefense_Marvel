import { CombatSystem } from '../systems/CombatSystem.js';

export class Projectile {
    constructor(x, y, target, config = {}) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.attacker = config.attacker || null;
        this.damage = config.damage || 10;
        this.attackerType = config.attackerType || 'Urbano';
        this.speed = config.projectileSpeed || 420;
        this.effects = config.effects || [];
        this.color = config.color || '#ffd166';
        this.radius = config.radius || 5;
        this.isActive = true;
    }

    update(dt) {
        if (!this.isActive || !this.target || !this.target.isAlive) {
            this.isActive = false;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 15 || distance === 0) {
            CombatSystem.applyImpact(this, this.target, this.attacker, this.attacker?.game?.resourceManager);
            this.isActive = false;
            return;
        }

        this.x += (dx / distance) * this.speed * dt;
        this.y += (dy / distance) * this.speed * dt;
    }

    render(ctx) {
        if (!this.isActive) return;

        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
