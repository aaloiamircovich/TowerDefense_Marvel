import { Projectile } from './Projectile.js';

const imageCache = new Map();

export class Hero {
    constructor(config, x, y, game) {
        this.game = game;
        this.config = { ...config };
        this.id = config.id;
        this.name = config.name;
        this.category = config.category || 'Urbano';
        this.x = x;
        this.y = y;
        this.level = config.level || 1;
        this.damage = config.damage || 10;
        this.range = config.range || 120;
        this.fireRate = config.fireRate || 1;
        this.critChance = config.critChance || 5;
        this.attackType = config.attackType || this.category;
        this.allowedTerrains = [...(config.allowedTerrains || [1])];
        this.targetingPriority = config.targetingPriority || 'Primero';
        this.timer = 0;
        this.items = [];
        this.consecutiveHits = 0;
        this.lastTargetId = null;
        this.killCount = 0;
        this.size = 36;
        this.flashTimer = 0;

        if (config.sprite && !imageCache.has(config.sprite)) {
            const img = new Image();
            img.src = config.sprite;
            imageCache.set(config.sprite, img);
        }
    }

    getEffectiveStats() {
        const stats = {
            damage: this.damage,
            fireRate: this.fireRate,
            range: this.range,
            canSeeStealth: this.config.canSeeStealth || false
        };

        this.items.forEach((item) => {
            if (item.id === 'reactor_arc') stats.fireRate *= 1.25;
            if (item.id === 'particulas_pym') stats.fireRate *= 1.5;
            if (item.id === 'gema_poder') stats.damage *= 1.5;
            if (item.id === 'lentes_edith') stats.canSeeStealth = true;
            if (item.id === 'aerodeslizador' && !this.allowedTerrains.includes(0)) this.allowedTerrains.push(0);
        });

        if (this.items.some((item) => item.id === 'suero_supersoldado') && this.game.resourceManager.lives <= 10) {
            stats.damage *= 1.3;
            stats.fireRate *= 1.3;
        }

        return stats;
    }

    update(dt, enemies, projectiles) {
        this.timer += dt;
        this.flashTimer = Math.max(0, this.flashTimer - dt);
        const stats = this.getEffectiveStats();

        if (this.timer >= 1 / stats.fireRate) {
            const target = this.getBestTarget(enemies, stats);
            if (target) {
                this.shoot(target, stats, projectiles);
                this.timer = 0;
                this.flashTimer = 0.08;
            }
        }
    }

    getBestTarget(enemies, stats) {
        const inRange = enemies.filter((enemy) => {
            if (!enemy.isAlive) return false;
            if (enemy.stealth && !stats.canSeeStealth) return false;
            return Math.hypot(enemy.x - this.x, enemy.y - this.y) <= stats.range;
        });

        if (inRange.length === 0) return null;

        switch (this.targetingPriority) {
            case 'Primero':
                return inRange.sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
            case 'Último':
                return inRange.sort((a, b) => a.distanceTravelled - b.distanceTravelled)[0];
            case 'Fuerte':
                return inRange.sort((a, b) => b.hp - a.hp)[0];
            case 'Débil':
                return inRange.sort((a, b) => a.hp - b.hp)[0];
            default:
                return inRange[0];
        }
    }

    shoot(target, stats, projectiles) {
        const isCrit = Math.random() * 100 < this.critChance;
        let finalDamage = isCrit ? stats.damage * 2 : stats.damage;

        if (this.items.some((item) => item.id === 'simbionte')) {
            if (this.lastTargetId === target.uid) {
                this.consecutiveHits++;
                finalDamage *= 1 + this.consecutiveHits * 0.025;
            } else {
                this.consecutiveHits = 0;
                this.lastTargetId = target.uid;
            }
        }

        projectiles.push(new Projectile(this.x, this.y, target, {
            attacker: this,
            damage: finalDamage,
            attackerType: this.category,
            effects: this.getProjectileEffects(),
            color: this.getProjectileColor(),
            radius: isCrit ? 7 : 5
        }));
    }

    getProjectileEffects() {
        const effects = [];

        if (this.id === 'spiderman') effects.push({ type: 'slow', duration: 1.4, power: 0.45, chance: 0.75 });
        if (this.id === 'black_widow') effects.push({ type: 'stun', duration: 0.45, power: 1, chance: 0.18 });
        if (this.id === 'groot') effects.push({ type: 'slow', duration: 1.8, power: 0.6, chance: 0.5 });
        if (this.id === 'storm') effects.push({ type: 'slow', duration: 1.1, power: 0.35, chance: 0.7 });
        if (this.items.some((item) => item.id === 'telarana_sintetica')) {
            effects.push({ type: 'slow', duration: 1.2, power: 0.35, chance: 0.4 });
        }

        return effects;
    }

    getProjectileColor() {
        const colors = {
            Tecnológico: '#40c9ff',
            Místico: '#b865ff',
            Urbano: '#ffffff',
            Cósmico: '#ff8bd1',
            Mutante: '#d7ff57'
        };
        return colors[this.category] || '#ffd166';
    }

    render(ctx) {
        const stats = this.getEffectiveStats();
        const img = this.config.sprite ? imageCache.get(this.config.sprite) : null;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, stats.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.stroke();

        if (this.flashTimer > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(252, 163, 17, 0.25)';
            ctx.fill();
        }

        if (img?.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        } else {
            this.renderFallback(ctx);
        }

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 10px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${this.level}`, this.x, this.y - 24);
        ctx.restore();
    }

    renderFallback(ctx) {
        ctx.fillStyle = this.getProjectileColor();
        ctx.beginPath();
        ctx.roundRect(this.x - 17, this.y - 17, 34, 34, 8);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#071018';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name.charAt(0), this.x, this.y + 1);
    }
}
