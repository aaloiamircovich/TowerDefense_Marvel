let enemyUid = 0;
const imageCache = new Map();

export class Enemy {
    constructor(config, path) {
        this.uid = `enemy-${enemyUid++}`;
        this.config = config;
        this.name = config.name || 'Enemigo';
        this.hp = config.hp || 50;
        this.maxHp = this.hp;
        this.baseSpeed = config.speed || 50;
        this.speed = this.baseSpeed;
        this.reward = config.reward || 10;
        this.armor = config.armor || 0;
        this.category = config.category || 'Urbano';
        this.stealth = Boolean(config.stealth);
        this.isBoss = Boolean(config.isBoss);
        this.sprite = config.sprite;
        this.debuffs = [];

        this.path = path;
        this.pathIndex = 0;
        this.x = path?.[0]?.x || 0;
        this.y = path?.[0]?.y || 0;
        this.size = this.isBoss ? 44 : 30;
        this.isAlive = true;
        this.hasReachedEnd = false;
        this.distanceTravelled = 0;
        this.processed = false;
        this.rewarded = false;

        if (this.sprite && !imageCache.has(this.sprite)) {
            const img = new Image();
            img.src = this.sprite;
            imageCache.set(this.sprite, img);
        }
    }

    takeDamage(amount) {
        const armorRatio = this.armor > 1 ? Math.min(this.armor / 100, 0.85) : Math.min(this.armor, 0.85);
        const finalDamage = Math.max(1, amount * (1 - armorRatio));
        this.hp -= finalDamage;

        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
        }

        return { damage: finalDamage, killed: !this.isAlive };
    }

    applyDebuff(type, duration = 1, power = 0.5) {
        if (type === 'slow' && this.config.immuneToSlow) return;
        if (type === 'stun' && this.config.immuneToStun) return;

        const existing = this.debuffs.find((debuff) => debuff.type === type);
        if (existing) {
            existing.duration = Math.max(existing.duration, duration);
            existing.power = Math.max(existing.power, power);
        } else {
            this.debuffs.push({ type, duration, power });
        }
    }

    updateDebuffs(dt) {
        this.debuffs.forEach((debuff) => {
            debuff.duration -= dt;
        });
        this.debuffs = this.debuffs.filter((debuff) => debuff.duration > 0);

        const slow = this.debuffs.find((debuff) => debuff.type === 'slow');
        const stunned = this.debuffs.some((debuff) => debuff.type === 'stun');

        if (stunned) {
            this.speed = 0;
        } else if (slow) {
            this.speed = this.baseSpeed * Math.max(0.2, 1 - slow.power);
        } else {
            this.speed = this.baseSpeed;
        }
    }

    update(dt) {
        if (!this.isAlive || this.hasReachedEnd) return;
        this.updateDebuffs(dt);
        if (this.speed <= 0) return;

        const target = this.path[this.pathIndex + 1];
        if (!target) {
            this.hasReachedEnd = true;
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        const moveDist = this.speed * dt;

        if (distance <= moveDist) {
            this.x = target.x;
            this.y = target.y;
            this.pathIndex++;
            this.distanceTravelled += distance;
        } else {
            this.x += (dx / distance) * moveDist;
            this.y += (dy / distance) * moveDist;
            this.snapToPathSegment(target);
            this.distanceTravelled += moveDist;
        }
    }

    snapToPathSegment(target) {
        const current = this.path[this.pathIndex];
        if (!current || !target) return;

        if (current.y === target.y) this.y = current.y;
        if (current.x === target.x) this.x = current.x;
    }

    render(ctx) {
        if (!this.isAlive) return;

        ctx.save();
        if (this.stealth) ctx.globalAlpha = 0.72;

        const img = this.sprite ? imageCache.get(this.sprite) : null;
        if (img?.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        } else {
            this.renderFallback(ctx);
        }

        this.renderHealthBar(ctx);
        this.renderDebuffPips(ctx);
        ctx.restore();
    }

    renderFallback(ctx) {
        const colors = {
            Tecnologico: '#40c9ff',
            Tecnológico: '#40c9ff',
            Mistico: '#b865ff',
            Místico: '#b865ff',
            Urbano: '#e63946',
            Cosmico: '#ff8bd1',
            Cósmico: '#ff8bd1',
            Mutante: '#c7f464'
        };

        ctx.fillStyle = colors[this.category] || '#e63946';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.isBoss ? '#ffd166' : 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = this.isBoss ? 3 : 1.5;
        ctx.stroke();

        ctx.fillStyle = '#071018';
        ctx.font = `bold ${this.isBoss ? 14 : 11}px Segoe UI`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name.charAt(0), this.x, this.y + 1);
    }

    renderHealthBar(ctx) {
        const width = this.isBoss ? 48 : 34;
        const hpPercent = Math.max(0, this.hp / this.maxHp);

        ctx.fillStyle = 'rgba(10, 12, 16, 0.9)';
        ctx.fillRect(this.x - width / 2, this.y - this.size / 2 - 10, width, 5);
        ctx.fillStyle = hpPercent > 0.45 ? '#46d369' : hpPercent > 0.2 ? '#fca311' : '#e63946';
        ctx.fillRect(this.x - width / 2, this.y - this.size / 2 - 10, width * hpPercent, 5);
    }

    renderDebuffPips(ctx) {
        this.debuffs.forEach((debuff, index) => {
            ctx.fillStyle = debuff.type === 'stun' ? '#ffd166' : '#40c9ff';
            ctx.beginPath();
            ctx.arc(this.x - 8 + index * 8, this.y + this.size / 2 + 7, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
