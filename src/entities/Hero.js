import { Projectile } from './Projectile.js';
import { getCachedImage } from '../rendering/ImageCache.js';
import { SpriteAnimator } from '../rendering/SpriteAnimator.js';
import { HeroAbilitySystem } from '../systems/HeroAbilitySystem.js';
import { aggregateItemEffects } from '../systems/ItemEffectSystem.js';

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
        this.baseAllowedTerrains = [...(config.allowedTerrains || [1])];
        this.allowedTerrains = [...this.baseAllowedTerrains];
        this.targetingPriority = config.targetingPriority || 'Primero';
        this.deployedCost = config.cost || 0;
        this.lastRepositionWave = -1;
        this.timer = 0;
        this.items = [];
        this.consecutiveHits = 0;
        this.lastTargetId = null;
        this.killCount = 0;
        this.combatStats = {
            damageDealt: 0,
            kills: 0,
            shots: 0,
            crits: 0,
            goldGenerated: 0,
            abilityActivations: 0
        };
        this.size = 36;
        this.flashTimer = 0;
        this.visualTime = 0;
        this.animator = config.visual ? new SpriteAnimator(config.visual) : null;
        this.legacyImage = getCachedImage(config.sprite);
        this.abilitySystem = new HeroAbilitySystem(this);
    }

    getEffectiveStats() {
        this.allowedTerrains = [...this.baseAllowedTerrains];
        const stats = {
            damage: this.damage,
            fireRate: this.fireRate,
            range: this.range,
            critChance: this.critChance,
            canSeeStealth: this.config.canSeeStealth || false
        };

        const progression = this.game.progression?.getHeroBonuses(this.id);
        if (progression) {
            stats.damage *= 1 + progression.damage;
            stats.fireRate *= 1 + progression.fireRate;
            stats.range *= 1 + progression.range;
            stats.critChance += progression.critChance;
        }

        const itemEffects = aggregateItemEffects(this.items);
        stats.damage *= 1 + (itemEffects.damagePct || 0);
        stats.fireRate *= 1 + (itemEffects.fireRatePct || 0);
        stats.range *= 1 + (itemEffects.rangePct || 0);
        stats.critChance += itemEffects.critChance || 0;
        if (itemEffects.detectStealth) stats.canSeeStealth = true;
        if (itemEffects.allowWater && !this.allowedTerrains.includes(0)) this.allowedTerrains.push(0);

        if (this.game.resourceManager.lives <= 10) {
            stats.damage *= 1 + (itemEffects.lowLifeDamagePct || 0);
            stats.fireRate *= 1 + (itemEffects.lowLifeFireRatePct || 0);
        }

        this.abilitySystem.applyStatModifiers(stats);
        return this.game.teamSynergy?.applyHeroStats(this, stats) || stats;
    }

    update(dt, enemies, projectiles) {
        this.timer += dt;
        this.flashTimer = Math.max(0, this.flashTimer - dt);
        this.visualTime += dt;
        this.animator?.update(dt);
        const stats = this.getEffectiveStats();
        this.abilitySystem.update(dt, enemies, stats, projectiles);

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
            case 'Rápido':
                return inRange.sort((a, b) => b.speed - a.speed || b.distanceTravelled - a.distanceTravelled)[0];
            case 'Sigilo':
                return inRange.sort((a, b) => Number(b.stealth) - Number(a.stealth) || b.distanceTravelled - a.distanceTravelled)[0];
            case 'Jefe':
                return inRange.sort((a, b) => Number(b.isBoss) - Number(a.isBoss) || (b.threat || 1) - (a.threat || 1) || b.distanceTravelled - a.distanceTravelled)[0];
            default:
                return inRange[0];
        }
    }

    shoot(target, stats, projectiles) {
        this.animator?.faceVector(target.x - this.x, target.y - this.y);
        this.animator?.playAttack();

        const roll = this.game?.random?.next?.() ?? Math.random();
        const isCrit = roll * 100 < stats.critChance;
        let finalDamage = isCrit ? stats.damage * 2 : stats.damage;
        this.combatStats.shots++;
        if (isCrit) this.combatStats.crits++;

        const itemEffects = aggregateItemEffects(this.items);
        if (itemEffects.consecutiveDamagePct) {
            if (this.lastTargetId === target.uid) {
                this.consecutiveHits++;
                finalDamage *= 1 + this.consecutiveHits * itemEffects.consecutiveDamagePct;
            } else {
                this.consecutiveHits = 0;
                this.lastTargetId = target.uid;
            }
        }

        const projectileConfig = {
            attacker: this,
            damage: finalDamage,
            attackerType: this.category,
            effects: this.getProjectileEffects(target),
            ...this.getProjectileProfile(),
            color: this.getProjectileColor(),
            radius: isCrit ? 7 : 5,
            visualStyle: this.getProjectileVisualStyle()
        };
        if (this.game?.spawnProjectile) this.game.spawnProjectile(this.x, this.y, target, projectileConfig);
        else projectiles.push(new Projectile(this.x, this.y, target, projectileConfig));
        this.abilitySystem.onAttack(target, stats, projectileConfig, projectiles);
    }

    getProjectileEffects(target = null) {
        const effects = [];

        effects.push(...this.abilitySystem.getAttackEffects(target));
        if (this.id === 'groot') effects.push({ type: 'slow', duration: 1.8, power: 0.6, chance: 0.5 });
        if (this.id === 'storm') effects.push({ type: 'slow', duration: 1.1, power: 0.35, chance: 0.7 });
        if (this.id === 'scarlet_witch') effects.push({ type: 'mark', duration: 2.5, power: 0.25, chance: 0.65 });
        if (this.id === 'jean_grey') effects.push({ type: 'knockback', duration: 0, power: 42, chance: 0.25 });
        const itemEffects = aggregateItemEffects(this.items);
        if (itemEffects.slowChance) effects.push({ type: 'slow', duration: 1.2, power: itemEffects.slowPower || 0.2, chance: itemEffects.slowChance });
        if (itemEffects.armorBreakChance) effects.push({ type: 'armorBreak', duration: 3, power: itemEffects.armorBreakPower || 0.15, chance: itemEffects.armorBreakChance });

        return effects;
    }

    getProjectileProfile() {
        const profiles = {
            capitan_america: { chainCount: 2, chainRange: 115, chainFactor: 0.6, returning: true },
            thor: { chainCount: 3, chainRange: 130, chainFactor: 0.7 },
            winter_soldier: { armorPenetration: 0.45 },
            cyclops: { armorPenetration: 0.35 },
            moon_knight: { returning: true }
        };
        const base = { ...(profiles[this.id] || {}), ...this.abilitySystem.getProjectileProfile() };
        const itemEffects = aggregateItemEffects(this.items);
        return {
            ...base,
            chainCount: (base.chainCount || 0) + Math.round(itemEffects.chainCount || 0),
            chainRange: Math.max(base.chainRange || 0, itemEffects.chainRange || 0),
            chainFactor: Math.max(base.chainFactor || 0, itemEffects.chainFactor || 0),
            splashRadius: Math.max(base.splashRadius || 0, itemEffects.splashRadius || 0),
            splashFactor: Math.max(base.splashFactor || 0, itemEffects.splashFactor || 0),
            armorPenetration: Math.min(0.85, (base.armorPenetration || 0) + (itemEffects.armorPenetration || 0))
        };
    }

    recordDamage(amount) {
        this.combatStats.damageDealt += Math.max(0, amount || 0);
    }

    recordKill(resourceManager) {
        this.combatStats.kills++;
        this.killCount++;
        this.abilitySystem.onKill();

        const healEvery = aggregateItemEffects(this.items).killHealEvery;
        if (healEvery && this.killCount >= healEvery) {
            resourceManager?.addLife(1);
            this.killCount = 0;
        }
    }

    recordGold(amount) {
        this.combatStats.goldGenerated += Math.max(0, amount || 0);
    }

    recordAbility() {
        this.combatStats.abilityActivations++;
    }

    getProjectileVisualStyle() {
        const kitStyle = this.abilitySystem.getProjectileVisualStyle();
        if (kitStyle) return kitStyle;
        if (this.id === 'capitan_america') return 'shield';
        if (this.id === 'thor') return 'lightning';
        if (this.id === 'doctor_strange') return 'mystic';
        return 'energy';
    }

    getProjectileColor() {
        const kitColor = this.abilitySystem.getProjectileColor();
        if (kitColor) return kitColor;
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

        ctx.save();
        if (this.game.showHeroRanges) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, stats.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.stroke();
        }

        if (this.flashTimer > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(252, 163, 17, 0.25)';
            ctx.fill();
        }

        const animated = this.animator?.render(ctx, this.x, this.y) || false;
        if (!animated && this.legacyImage?.complete && this.legacyImage.naturalWidth > 0) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this.legacyImage, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        } else if (!animated) {
            this.renderFallback(ctx);
        }
        this.abilitySystem.render(ctx);

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 10px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${this.level}`, this.x, this.y - 24);
        this.renderAbilityIndicator(ctx);
        ctx.restore();
    }

    renderAbilityIndicator(ctx) {
        const state = this.abilitySystem.getDisplayState();
        if (!state || state.progress === null) return;

        const width = 30;
        const y = this.y + 23;
        ctx.fillStyle = 'rgba(5, 7, 11, 0.85)';
        ctx.fillRect(this.x - width / 2, y, width, 4);
        ctx.fillStyle = state.ready ? '#ffd166' : '#40c9ff';
        ctx.fillRect(this.x - width / 2, y, width * Math.max(0, Math.min(1, state.progress)), 4);
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
