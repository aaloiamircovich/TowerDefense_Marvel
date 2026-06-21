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

    takeDamage(amount, options = {}) {
        const baseArmor = this.armor > 1 ? this.armor / 100 : this.armor;
        const armorBreak = this.debuffs
            .filter((debuff) => debuff.type === 'armorBreak')
            .reduce((total, debuff) => total + debuff.power, 0);
        const penetration = Math.max(0, Math.min(1, options.armorPenetration || 0));
        const armorRatio = options.ignoreArmor
            ? 0
            : Math.max(0, Math.min(baseArmor - armorBreak, 0.85)) * (1 - penetration);
        const finalDamage = Math.max(1, amount * (1 - armorRatio));
        const appliedDamage = Math.min(this.hp, finalDamage);
        this.hp -= appliedDamage;

        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
        }

        return { damage: appliedDamage, killed: !this.isAlive };
    }

    applyDebuff(type, duration = 1, power = 0.5) {
        return this.applyStatus({ type, duration, power });
    }

    applyStatus(effect, source = null) {
        const { type, duration = 1, power = 0.5 } = effect;
        if (type === 'slow' && this.config.immuneToSlow) return false;
        if (type === 'stun' && this.config.immuneToStun) return false;
        if (type === 'knockback') {
            this.moveBackward(power);
            return true;
        }

        const existing = this.debuffs.find((debuff) => debuff.type === type);
        if (existing) {
            existing.duration = Math.max(existing.duration, duration);
            existing.power = Math.max(existing.power, power);
            existing.source = source || existing.source;
        } else {
            this.debuffs.push({ type, duration, power, source, tickTimer: 0 });
        }
        return true;
    }

    updateDebuffs(dt) {
        this.debuffs.forEach((debuff) => {
            if ((debuff.type === 'burn' || debuff.type === 'bleed') && this.isAlive) {
                const interval = debuff.type === 'burn' ? 0.5 : 0.4;
                debuff.tickTimer += Math.min(dt, debuff.duration);
                while (debuff.tickTimer >= interval && this.isAlive) {
                    const result = this.takeDamage(debuff.power * interval, { ignoreArmor: true });
                    debuff.source?.recordDamage?.(result.damage);
                    if (result.killed && !this.killCredited) {
                        this.killCredited = true;
                        debuff.source?.recordKill?.(debuff.source?.game?.resourceManager);
                    }
                    debuff.tickTimer -= interval;
                }
            }
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

    getDamageTakenMultiplier() {
        const mark = this.debuffs
            .filter((debuff) => debuff.type === 'mark')
            .reduce((strongest, debuff) => Math.max(strongest, debuff.power), 0);
        return 1 + mark;
    }

    update(dt) {
        if (!this.isAlive || this.hasReachedEnd) return;
        this.updateDebuffs(dt);
        if (this.speed <= 0) return;

        this.moveForward(this.speed * dt);
    }

    moveForward(distance) {
        let remaining = Math.max(0, distance);

        while (remaining > 0) {
            const target = this.path[this.pathIndex + 1];
            if (!target) {
                this.hasReachedEnd = true;
                return;
            }

            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const segmentRemaining = Math.hypot(dx, dy);
            if (segmentRemaining <= remaining) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
                this.distanceTravelled += segmentRemaining;
                remaining -= segmentRemaining;
            } else {
                this.x += (dx / segmentRemaining) * remaining;
                this.y += (dy / segmentRemaining) * remaining;
                this.snapToPathSegment(target);
                this.distanceTravelled += remaining;
                remaining = 0;
            }
        }
    }

    moveBackward(distance) {
        let remaining = Math.max(0, distance);
        let moved = 0;

        while (remaining > 0) {
            const segmentStart = this.path[this.pathIndex];
            if (!segmentStart) break;

            const dx = segmentStart.x - this.x;
            const dy = segmentStart.y - this.y;
            const distanceToStart = Math.hypot(dx, dy);
            if (distanceToStart > remaining) {
                this.x += (dx / distanceToStart) * remaining;
                this.y += (dy / distanceToStart) * remaining;
                moved += remaining;
                remaining = 0;
            } else {
                this.x = segmentStart.x;
                this.y = segmentStart.y;
                moved += distanceToStart;
                remaining -= distanceToStart;
                if (this.pathIndex === 0) break;
                this.pathIndex--;
            }
        }

        this.hasReachedEnd = false;
        this.distanceTravelled = Math.max(0, this.distanceTravelled - moved);
        const target = this.path[this.pathIndex + 1];
        if (target) this.snapToPathSegment(target);
        return moved;
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
        const colors = {
            stun: '#ffd166',
            slow: '#40c9ff',
            burn: '#ff6b35',
            bleed: '#e63946',
            armorBreak: '#b8b8b8',
            mark: '#d86cff'
        };
        this.debuffs.forEach((debuff, index) => {
            ctx.fillStyle = colors[debuff.type] || '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x - 8 + index * 8, this.y + this.size / 2 + 7, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
