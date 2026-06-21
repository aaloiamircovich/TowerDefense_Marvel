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
        this.splashRadius = config.splashRadius || 0;
        this.splashFactor = config.splashFactor ?? 0.5;
        this.chainCount = config.chainCount || 0;
        this.chainRange = config.chainRange || 100;
        this.chainFactor = config.chainFactor ?? 0.65;
        this.armorPenetration = config.armorPenetration || 0;
        this.returning = Boolean(config.returning);
        this.phase = 'outbound';
        this.isActive = true;
    }

    update(dt) {
        if (!this.isActive || !this.target) {
            this.isActive = false;
            return;
        }

        if (this.phase === 'outbound' && !this.target.isAlive) {
            this.isActive = false;
            return;
        }

        const destination = this.phase === 'returning' ? this.attacker : this.target;
        if (!destination) {
            this.isActive = false;
            return;
        }

        const dx = destination.x - this.x;
        const dy = destination.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 15 || distance === 0) {
            if (this.phase === 'returning') {
                this.isActive = false;
                return;
            }

            CombatSystem.applyImpact(this, this.target, this.attacker, this.attacker?.game?.resourceManager);
            if (this.returning && this.attacker) {
                this.phase = 'returning';
            } else {
                this.isActive = false;
            }
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
