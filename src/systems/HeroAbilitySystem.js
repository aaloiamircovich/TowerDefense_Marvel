import { Projectile } from '../entities/Projectile.js';
import { CombatSystem } from './CombatSystem.js';
import { AvengerKitSystem } from './AvengerKitSystem.js';
import { CosmicKitSystem } from './CosmicKitSystem.js';
import { StreetKitSystem } from './StreetKitSystem.js';

const ACTIVE_COOLDOWNS = {
    thor: 11,
    doctor_strange: 9
};

export class HeroAbilitySystem {
    constructor(hero) {
        this.hero = hero;
        this.attackCount = 0;
        this.cooldownRemaining = 0;
        this.avengerKit = new AvengerKitSystem(hero);
        this.cosmicKit = new CosmicKitSystem(hero);
        this.streetKit = new StreetKitSystem(hero);
    }

    update(dt, enemies, stats, projectiles) {
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
        this.avengerKit.update(dt, enemies, stats, projectiles);
        this.cosmicKit.update(dt, enemies, stats, projectiles);
        this.streetKit.update(dt, enemies, stats, projectiles);
        if (this.cooldownRemaining > 0) return;

        const targets = this.getTargetsInRange(enemies, stats.range);
        if (this.hero.id === 'thor' && targets.length >= 2) {
            this.activateThorStorm(targets, stats);
        } else if (this.hero.id === 'doctor_strange' && targets.length >= 1) {
            this.activateTemporalField(targets);
        }
    }

    onAttack(target, stats, projectileConfig, projectiles) {
        this.attackCount++;
        this.avengerKit.onAttack(target, stats, projectileConfig, projectiles);
        this.cosmicKit.onAttack(target, stats, projectileConfig, projectiles);
        this.streetKit.onAttack(target, stats, projectileConfig, projectiles);

        if (this.hero.id === 'iron_man') {
            this.hero.game.audio?.play('repulsor');
            if (this.attackCount % 3 === 0) this.activateArcOverload(target, stats);
        }

        if (this.hero.id === 'spiderman') this.hero.game.audio?.play('web');
        if (this.hero.id === 'capitan_america') this.hero.game.audio?.play('shield');

        if (this.hero.id === 'doctor_strange' && this.attackCount % 2 === 0) {
            this.duplicateThroughPortal(target, projectileConfig, projectiles);
        }
    }

    getAttackEffects(target) {
        const effects = [...this.avengerKit.getAttackEffects(target), ...this.cosmicKit.getAttackEffects(target), ...this.streetKit.getAttackEffects(target)];
        if (this.hero.id === 'spiderman') {
            effects.push({ type: 'web', duration: 2.6, power: 0.2, chance: 1 });
        }
        return effects;
    }

    applyStatModifiers(stats) {
        const leader = this.hero.game?.heroes?.find((candidate) => (
            candidate !== this.hero
            && candidate.id === 'capitan_america'
            && Math.hypot(candidate.x - this.hero.x, candidate.y - this.hero.y) <= 150
        ));

        if (leader) {
            stats.damage *= 1.1;
            stats.fireRate *= 1.15;
        }
        this.avengerKit.applyStatModifiers(stats);
        this.cosmicKit.applyStatModifiers(stats);
        return this.streetKit.applyStatModifiers(stats);
    }

    activateArcOverload(target, stats) {
        const targets = HeroAbilitySystem.getLineTargets(
            this.hero,
            target,
            this.hero.game.enemies,
            stats.range * 1.2,
            24
        );
        const endpoint = HeroAbilitySystem.getLineEndpoint(this.hero, target, stats.range * 1.2);
        const damage = stats.damage * 0.9 * this.getPowerScale();

        targets.forEach((enemy) => CombatSystem.applyDamage({
            attackerType: this.hero.category,
            damage,
            armorPenetration: 0.35
        }, enemy, this.hero, this.hero.game.resourceManager, 1));

        this.hero.game.vfx?.addBeam(this.hero, endpoint, { color: '#42dcff', width: 12, duration: 0.24 });
        this.hero.game.audio?.play('arc');
        this.hero.recordAbility();
    }

    activateThorStorm(targets, stats) {
        const selected = [...targets]
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)
            .slice(0, 5);
        const damage = stats.damage * 1.45 * this.getPowerScale();

        selected.forEach((enemy) => {
            CombatSystem.applyDamage({ attackerType: this.hero.category, damage }, enemy, this.hero, this.hero.game.resourceManager, 1);
            if (enemy.isAlive) enemy.applyStatus?.({ type: 'stun', duration: 0.4, power: 1 }, this.hero);
            this.hero.game.vfx?.addLightning(enemy.x, enemy.y);
        });

        this.hero.game.audio?.play('thunder');
        this.hero.recordAbility();
        this.cooldownRemaining = this.getCooldown();
    }

    activateTemporalField(targets) {
        targets.forEach((enemy) => enemy.applyStatus?.({
            type: 'slow',
            duration: 3,
            power: 0.62
        }, this.hero));

        this.hero.game.vfx?.addRing(this.hero.x, this.hero.y, {
            color: '#f5a623',
            radius: this.hero.range,
            duration: 0.65
        });
        this.hero.game.audio?.play('portal');
        this.hero.recordAbility();
        this.cooldownRemaining = this.getCooldown();
    }

    duplicateThroughPortal(primaryTarget, projectileConfig, projectiles) {
        const candidates = this.getTargetsInRange(this.hero.game.enemies, this.hero.range)
            .filter((enemy) => enemy !== primaryTarget);
        const target = candidates[0] || primaryTarget;
        const angle = Math.atan2(target.y - this.hero.y, target.x - this.hero.x);
        const portalX = this.hero.x + Math.cos(angle) * 26;
        const portalY = this.hero.y + Math.sin(angle) * 26;

        const duplicateConfig = {
            ...projectileConfig,
            damage: projectileConfig.damage * 0.65 * this.getPowerScale(),
            radius: Math.max(3, projectileConfig.radius - 1),
            visualStyle: 'mystic'
        };
        if (this.hero.game.spawnProjectile) this.hero.game.spawnProjectile(portalX, portalY, target, duplicateConfig);
        else projectiles.push(new Projectile(portalX, portalY, target, duplicateConfig));
        this.hero.game.vfx?.addRing(portalX, portalY, { color: '#f5a623', radius: 24, duration: 0.38 });
        this.hero.game.audio?.play('portal');
        this.hero.recordAbility();
    }

    getTargetsInRange(enemies, range) {
        return enemies.filter((enemy) => enemy.isAlive
            && Math.hypot(enemy.x - this.hero.x, enemy.y - this.hero.y) <= range);
    }

    getCooldown() {
        const base = ACTIVE_COOLDOWNS[this.hero.id] || 0;
        const reduction = Math.min(0.25, Math.max(0, this.hero.level - 1) * 0.02);
        const progression = this.hero.game.progression?.getHeroBonuses(this.hero.id);
        const synergy = this.hero.game.teamSynergy?.getAbilityModifiers(this.hero);
        return base * (1 - reduction) * (1 - (progression?.cooldown || 0)) * (1 - (synergy?.cooldown || 0));
    }

    getPowerScale() {
        const progression = this.hero.game.progression?.getHeroBonuses(this.hero.id);
        const synergy = this.hero.game.teamSynergy?.getAbilityModifiers(this.hero);
        return 1 + Math.min(0.4, Math.max(0, this.hero.level - 1) * 0.04) + (progression?.abilityPower || 0) + (synergy?.abilityPower || 0);
    }

    getDisplayState() {
        if (this.hero.id === 'iron_man') {
            const charge = this.attackCount % 3;
            return { label: `Carga ARC ${charge}/3`, progress: charge / 3, ready: charge === 2 };
        }
        if (this.hero.id === 'spiderman') {
            return { label: '3 redes inmovilizan', progress: null, ready: true };
        }
        if (this.hero.id === 'capitan_america') {
            return { label: 'Liderazgo: +10% daño, +15% cadencia', progress: null, ready: true };
        }
        if (ACTIVE_COOLDOWNS[this.hero.id]) {
            const cooldown = this.getCooldown();
            const ready = this.cooldownRemaining <= 0;
            return {
                label: ready ? 'Habilidad lista' : `${this.cooldownRemaining.toFixed(1)} s`,
                progress: ready ? 1 : 1 - this.cooldownRemaining / cooldown,
                ready
            };
        }
        return this.avengerKit.getDisplayState() || this.cosmicKit.getDisplayState() || this.streetKit.getDisplayState();
    }

    getControlState() {
        return this.avengerKit.getControlState() || this.cosmicKit.getControlState() || this.streetKit.getControlState();
    }

    setCombatMode(mode) {
        return this.avengerKit.setMode(mode) || this.cosmicKit.setMode(mode) || this.streetKit.setMode(mode);
    }

    getCombatMode() {
        return this.avengerKit.getMode() || this.cosmicKit.getMode() || this.streetKit.getMode();
    }

    getProjectileProfile() {
        return { ...this.avengerKit.getProjectileProfile(), ...this.cosmicKit.getProjectileProfile(), ...this.streetKit.getProjectileProfile() };
    }

    getProjectileColor() {
        return this.avengerKit.getProjectileColor() || this.cosmicKit.getProjectileColor() || this.streetKit.getProjectileColor();
    }

    getProjectileVisualStyle() {
        return this.avengerKit.getProjectileVisualStyle() || this.cosmicKit.getProjectileVisualStyle() || this.streetKit.getProjectileVisualStyle();
    }

    render(ctx) {
        this.avengerKit.render(ctx);
        this.cosmicKit.render(ctx);
        this.streetKit.render(ctx);
    }

    onKill(target) {
        this.cosmicKit.onKill();
        this.streetKit.onKill(target);
    }

    static getLineEndpoint(origin, target, distance) {
        const dx = target.x - origin.x;
        const dy = target.y - origin.y;
        const length = Math.hypot(dx, dy) || 1;
        return {
            x: origin.x + dx / length * distance,
            y: origin.y + dy / length * distance
        };
    }

    static getLineTargets(origin, target, enemies, distance, width) {
        const endpoint = HeroAbilitySystem.getLineEndpoint(origin, target, distance);
        const vx = endpoint.x - origin.x;
        const vy = endpoint.y - origin.y;
        const lengthSquared = vx * vx + vy * vy;

        return enemies.filter((enemy) => {
            if (!enemy.isAlive) return false;
            const projection = ((enemy.x - origin.x) * vx + (enemy.y - origin.y) * vy) / lengthSquared;
            if (projection < 0 || projection > 1) return false;
            const closestX = origin.x + projection * vx;
            const closestY = origin.y + projection * vy;
            return Math.hypot(enemy.x - closestX, enemy.y - closestY) <= width;
        });
    }
}
