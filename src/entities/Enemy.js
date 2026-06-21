import { EnemyBehaviorSystem } from '../systems/EnemyBehaviorSystem.js';

let enemyUid = 0;
const imageCache = new Map();

export class Enemy {
    constructor(config, path, game = null) {
        this.uid = `enemy-${enemyUid++}`;
        this.config = config;
        this.name = config.name || 'Enemigo';
        this.hp = config.hp || 50;
        this.maxHp = this.hp;
        this.baseSpeed = config.speed || 50;
        this.speed = this.baseSpeed;
        this.reward = config.reward ?? 10;
        this.armor = config.armor || 0;
        this.category = config.category || 'Urbano';
        this.faction = config.faction || 'Independiente';
        this.archetype = config.archetype || 'soldier';
        this.threat = config.threat || 1;
        this.resistances = { ...(config.resistances || {}) };
        this.statusResistance = config.statusResistance || 0;
        this.stealth = Boolean(config.stealth);
        this.flying = Boolean(config.flying || this.archetype === 'flying');
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
        this.telegraph = null;
        this.currentPhase = config.phaseLabel || (this.isBoss ? 'Fase inicial' : null);
        this.behavior = new EnemyBehaviorSystem(this, game);

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
        const resistance = Math.max(0, Math.min(0.8, this.resistances[options.attackerType] || 0));
        const finalDamage = Math.max(1, amount * (1 - resistance) * (1 - armorRatio));
        const barrierResult = this.behavior.absorbDamage(finalDamage);
        const appliedDamage = Math.min(this.hp, barrierResult.remaining);
        this.hp -= appliedDamage;

        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
        }

        return { damage: appliedDamage + barrierResult.absorbed, killed: !this.isAlive };
    }

    applyDebuff(type, duration = 1, power = 0.5) {
        return this.applyStatus({ type, duration, power });
    }

    applyStatus(effect, source = null) {
        const { type, duration = 1, power = 0.5 } = effect;
        if (type === 'slow' && this.config.immuneToSlow) return false;
        if (type === 'stun' && this.config.immuneToStun) return false;
        if (type === 'knockback') {
            if (this.flying || this.config.immuneToKnockback) return false;
            this.moveBackward(power);
            return true;
        }

        const specificResistance = this.config.statusResistances?.[type] || 0;
        const adjustedDuration = duration * Math.max(0.2, 1 - this.statusResistance - specificResistance);

        if (type === 'web') {
            const web = this.debuffs.find((debuff) => debuff.type === 'web');
            if (web) {
                web.duration = Math.max(web.duration, adjustedDuration);
                web.stacks = (web.stacks || 0) + 1;
                web.source = source || web.source;
                if (web.stacks >= 3) {
                    web.stacks = 0;
                    this.applyStatus({ type: 'stun', duration: 0.7, power: 1 }, source);
                    source?.recordAbility?.();
                }
            } else {
                this.debuffs.push({ type, duration: adjustedDuration, power, source, stacks: 1, tickTimer: 0 });
            }
            return true;
        }

        const existing = this.debuffs.find((debuff) => debuff.type === type);
        if (existing) {
            existing.duration = Math.max(existing.duration, adjustedDuration);
            existing.power = Math.max(existing.power, power);
            existing.source = source || existing.source;
        } else {
            this.debuffs.push({ type, duration: adjustedDuration, power, source, tickTimer: 0 });
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
        const web = this.debuffs.find((debuff) => debuff.type === 'web' && debuff.stacks > 0);
        const stunned = this.debuffs.some((debuff) => debuff.type === 'stun');

        if (stunned) {
            this.speed = 0;
        } else if (slow || web) {
            const slowPower = Math.max(slow?.power || 0, (web?.power || 0) * (web?.stacks || 0));
            this.speed = this.baseSpeed * Math.max(0.2, 1 - slowPower);
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
        if (!this.isAlive) return;
        this.behavior.update(dt);
        this.speed *= this.behavior.getSpeedMultiplier();
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

    copyPathPosition(source, backwardOffset = 0) {
        this.pathIndex = source.pathIndex;
        this.x = source.x;
        this.y = source.y;
        this.distanceTravelled = source.distanceTravelled;
        if (backwardOffset > 0) this.moveBackward(backwardOffset);
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
        if (this.flying) ctx.translate(0, Math.sin(this.behavior.elapsed * 5) * 4 - 6);

        const img = this.sprite ? imageCache.get(this.sprite) : null;
        if (img?.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        } else {
            this.renderFallback(ctx);
        }

        this.renderHealthBar(ctx);
        this.renderBarrier(ctx);
        this.renderDebuffPips(ctx);
        this.renderTelegraph(ctx);
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

        if (this.archetype === 'runner') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(this.x - this.size / 2 - 6, this.y - 5, 6, 2);
            ctx.fillRect(this.x - this.size / 2 - 9, this.y + 3, 9, 2);
        } else if (this.archetype === 'shield') {
            ctx.strokeStyle = '#7be0ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2 + 4, -Math.PI * 0.7, Math.PI * 0.7);
            ctx.stroke();
        } else if (this.archetype === 'support') {
            ctx.fillStyle = '#69e58c';
            ctx.fillRect(this.x - 2, this.y - 8, 4, 16);
            ctx.fillRect(this.x - 8, this.y - 2, 16, 4);
        } else if (this.archetype === 'summoner') {
            ctx.strokeStyle = '#d86cff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

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

    renderBarrier(ctx) {
        if (this.behavior.barrier <= 0 || this.behavior.barrierMax <= 0) return;
        const percent = Math.min(1, this.behavior.barrier / this.behavior.barrierMax);
        ctx.strokeStyle = 'rgba(123, 224, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2 + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
        ctx.stroke();
    }

    renderTelegraph(ctx) {
        if (!this.telegraph) return;
        const progress = 1 - this.telegraph.duration / this.telegraph.maxDuration;
        const radius = this.size / 2 + 10 + progress * 18;
        ctx.strokeStyle = this.telegraph.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.telegraph.color;
        ctx.font = 'bold 9px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(this.telegraph.label.toUpperCase(), this.x, this.y - this.size / 2 - 18);
    }

    renderDebuffPips(ctx) {
        const colors = {
            stun: '#ffd166',
            slow: '#40c9ff',
            burn: '#ff6b35',
            bleed: '#e63946',
            armorBreak: '#b8b8b8',
            mark: '#d86cff',
            web: '#f4f7ff'
        };
        this.debuffs.forEach((debuff, index) => {
            ctx.fillStyle = colors[debuff.type] || '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x - 8 + index * 8, this.y + this.size / 2 + 7, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
