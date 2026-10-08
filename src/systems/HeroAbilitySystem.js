import { Projectile } from '../entities/Projectile.js';
import { CombatSystem } from './CombatSystem.js';
import { AvengerKitSystem } from './AvengerKitSystem.js';
import { CosmicKitSystem } from './CosmicKitSystem.js';
import { StreetKitSystem } from './StreetKitSystem.js';
import { MutantKitSystem } from './MutantKitSystem.js';
import { TargetFocusSystem } from './TargetFocusSystem.js';
import { FieldDeviceSystem } from './FieldDeviceSystem.js';
import { getLineEndpoint, getLineTargets } from '../utils/LineTargeting.js';
import { applyCooldownReductions } from '../utils/AbilityModifiers.js';
import { getHeroRangePattern, isPointInRangePattern } from '../utils/RangePattern.js';
import { getEffectiveSupportAura, getSupportAuraDisplayState } from './SupportAuraSystem.js';

const ACTIVE_COOLDOWNS = {
    thor: 11,
    doctor_strange: 9
};

export const ARC_COOLING_SECONDS = 2;

export class HeroAbilitySystem {
    constructor(hero) {
        this.hero = hero;
        this.attackCount = 0;
        this.arcCharge = 0;
        // Re-deploying must not bypass the reactor's thermal limit.
        this.arcCooling = hero.id === 'iron_man' ? ARC_COOLING_SECONDS : 0;
        this.cooldownRemaining = 0;
        this.avengerKit = new AvengerKitSystem(hero);
        this.cosmicKit = new CosmicKitSystem(hero);
        this.streetKit = new StreetKitSystem(hero);
        this.mutantKit = new MutantKitSystem(hero);
        this.focusKit = ['cable', 'nebula', 'mockingbird', 'yelena_belova', 'x_23', 'okoye'].includes(hero.id) ? new TargetFocusSystem(hero) : null;
        this.fieldDevice = ['rocket_raccoon', 'peni_parker'].includes(hero.id) ? new FieldDeviceSystem(hero) : null;
    }

    update(dt, enemies, stats, projectiles) {
        this.arcCooling = Math.max(0, this.arcCooling - dt);
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
        this.avengerKit.update(dt, enemies, stats, projectiles);
        this.cosmicKit.update(dt, enemies, stats, projectiles);
        this.streetKit.update(dt, enemies, stats, projectiles);
        this.mutantKit.update(dt, enemies, stats, projectiles);
        if (this.cooldownRemaining > 0) return;

        const targets = this.getTargetsInRange(enemies, stats.range, stats);
        if (this.hero.id === 'thor' && targets.length >= 2) {
            this.activateThorStorm(targets, stats);
        } else if (this.hero.id === 'doctor_strange' && targets.length >= 1) {
            this.activateTemporalField(targets, stats);
        }
    }

    onAttack(target, stats, projectileConfig, projectiles) {
        this.attackCount++;
        this.fieldDevice?.onAttack(projectileConfig);
        this.focusKit?.onAttack(target);
        this.avengerKit.onAttack(target, stats, projectileConfig, projectiles);
        this.cosmicKit.onAttack(target, stats, projectileConfig, projectiles);
        this.streetKit.onAttack(target, stats, projectileConfig, projectiles);
        this.mutantKit.onAttack(target, stats, projectileConfig, projectiles);

        if (this.hero.id === 'iron_man') {
            this.hero.game.audio?.play('repulsor');
            this.arcCharge = Math.min(this.getArcInterval(), this.arcCharge + 1);
            if (this.arcCharge >= this.getArcInterval() && this.arcCooling <= 1e-9
                && this.activateArcOverload(target, stats)) {
                this.arcCharge = 0;
                this.arcCooling = ARC_COOLING_SECONDS;
            }
        }

        if (this.hero.id === 'spiderman') this.hero.game.audio?.play('web');
        if (this.hero.id === 'capitan_america') this.hero.game.audio?.play('shield');

        if (this.hero.id === 'doctor_strange' && this.attackCount % 2 === 0) {
            this.duplicateThroughPortal(target, projectileConfig, projectiles, stats);
        }
    }

    getAttackEffects(target) {
        const effects = [...this.avengerKit.getAttackEffects(target), ...this.cosmicKit.getAttackEffects(target), ...this.streetKit.getAttackEffects(target), ...this.mutantKit.getAttackEffects(target)];
        effects.push(...(this.focusKit?.attackEffects(target) || []));
        if (this.hero.id === 'spiderman') {
            const evolved = this.hero.game.progression?.getHeroEvolution?.(this.hero.id)?.id === 'iron_spider';
            effects.push({ type: 'web', duration: evolved ? 3.2 : 2.6, power: evolved ? 0.28 : 0.2, chance: 1 });
        }
        return effects;
    }

    applyStatModifiers(stats) {
        this.avengerKit.applyStatModifiers(stats);
        this.cosmicKit.applyStatModifiers(stats);
        this.streetKit.applyStatModifiers(stats);
        return this.mutantKit.applyStatModifiers(stats);
    }

    getAttackDamageMultiplier(target) {
        return this.avengerKit.getAttackDamageMultiplier()
            * this.mutantKit.getAttackDamageMultiplier()
            * this.streetKit.getAttackDamageMultiplier(target)
            * (this.focusKit?.damageMultiplier(target) || 1)
            * (this.fieldDevice?.damageMultiplier() || 1);
    }

    activateArcOverload(target, stats) {
        if (!target?.isAlive || (target.stealth && !stats.canSeeStealth)) return false;
        const targets = getLineTargets(
            this.hero,
            target,
            (this.hero.game.enemies || []).filter((enemy) => !enemy.stealth || stats.canSeeStealth),
            stats.range * 1.2,
            24
        );
        if (!targets.length) return false;
        const endpoint = getLineEndpoint(this.hero, target, stats.range * 1.2);
        const damage = stats.damage * 0.9 * this.getPowerScale();

        targets.forEach((enemy) => CombatSystem.applyDamage({
            attackerType: this.hero.category,
            damage,
            armorPenetration: 0.35
        }, enemy, this.hero, this.hero.game.resourceManager, 1));

        this.hero.game.vfx?.addBeam(this.hero, endpoint, { color: '#42dcff', width: 12, duration: 0.24 });
        this.hero.game.audio?.play('arc');
        this.hero.recordAbility();
        return true;
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

    activateTemporalField(targets, stats = this.hero.getEffectiveStats()) {
        targets.forEach((enemy) => enemy.applyStatus?.({
            type: 'slow',
            duration: 3,
            power: 0.62
        }, this.hero));

        this.hero.game.vfx?.addRing(this.hero.x, this.hero.y, {
            color: '#f5a623',
            radius: stats.range,
            duration: 0.65
        });
        this.hero.game.audio?.play('portal');
        this.hero.recordAbility();
        this.cooldownRemaining = this.getCooldown();
    }

    duplicateThroughPortal(primaryTarget, projectileConfig, projectiles, stats = this.hero.getEffectiveStats()) {
        const candidates = this.getTargetsInRange(this.hero.game.enemies, stats.range, stats);
        const target = candidates.find((enemy) => enemy !== primaryTarget)
            || candidates.find((enemy) => enemy === primaryTarget);
        if (!target) return;
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

    getTargetsInRange(enemies, range, stats = this.hero.getEffectiveStats()) {
        const pattern = getHeroRangePattern(this.hero);
        return enemies.filter((enemy) => enemy.isAlive
            && (!enemy.stealth || stats.canSeeStealth)
            && isPointInRangePattern(this.hero, enemy, range, pattern, stats.rangeGeometryScale));
    }

    getArcInterval() {
        return this.hero.game.progression?.getHeroEvolution?.(this.hero.id)?.id === 'iron_man_extremis' ? 2 : 3;
    }

    getCooldown() {
        const base = ACTIVE_COOLDOWNS[this.hero.id] || 0;
        return applyCooldownReductions(this.hero, base);
    }

    getPowerScale() {
        const progression = this.hero.game.progression?.getHeroBonuses(this.hero.id);
        const synergy = this.hero.game.teamSynergy?.getAbilityModifiers(this.hero);
        return 1 + Math.min(0.4, Math.max(0, this.hero.level - 1) * 0.04) + (progression?.abilityPower || 0) + (synergy?.abilityPower || 0);
    }

    getDisplayState() {
        if (this.fieldDevice) return this.fieldDevice.getDisplayState();
        if (this.focusKit) return this.focusKit.getDisplayState();
        const aura = getEffectiveSupportAura(this.hero);
        if (aura?.type) {
            const networkState = getSupportAuraDisplayState(this.hero);
            if (networkState) return networkState;
            const labels = { damage: 'Daño', fireRate: 'Cadencia', range: 'Alcance' };
            return { label: `${labels[aura.type] || 'Aura'} +${Math.round((aura.power || 0) * 100)}%`, progress: null, ready: true };
        }
        if (this.hero.id === 'iron_man') {
            const interval = this.getArcInterval();
            const charge = Math.min(interval, this.arcCharge);
            if (this.arcCooling > 1e-9) return {
                label: `ARC ${charge}/${interval} · Enfriando ${this.arcCooling.toFixed(1)} s`,
                progress: 1 - this.arcCooling / ARC_COOLING_SECONDS, ready: false
            };
            return { label: `Carga ARC ${charge}/${interval}`, progress: charge / interval, ready: charge >= interval - 1 };
        }
        if (this.hero.id === 'spiderman') {
            const threshold = this.hero.game.progression?.getHeroEvolution?.(this.hero.id)?.id === 'iron_spider' ? 2 : 3;
            return { label: `${threshold} redes inmovilizan`, progress: null, ready: true };
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
        return this.avengerKit.getDisplayState() || this.cosmicKit.getDisplayState() || this.streetKit.getDisplayState() || this.mutantKit.getDisplayState();
    }

    getControlState() {
        return this.avengerKit.getControlState() || this.cosmicKit.getControlState() || this.streetKit.getControlState() || this.mutantKit.getControlState();
    }

    setCombatMode(mode) {
        return this.avengerKit.setMode(mode) || this.cosmicKit.setMode(mode) || this.streetKit.setMode(mode) || this.mutantKit.setMode(mode);
    }

    getCombatMode() {
        return this.avengerKit.getMode() || this.cosmicKit.getMode() || this.streetKit.getMode() || this.mutantKit.getMode();
    }

    getProjectileProfile() {
        const profile = { ...this.avengerKit.getProjectileProfile(), ...this.cosmicKit.getProjectileProfile(), ...this.streetKit.getProjectileProfile(), ...this.mutantKit.getProjectileProfile() };
        if (this.hero.game.progression?.getHeroEvolution?.(this.hero.id)?.id === 'iron_spider') profile.armorPenetration = 0.3;
        return profile;
    }

    getProjectileColor() {
        return this.avengerKit.getProjectileColor() || this.cosmicKit.getProjectileColor() || this.streetKit.getProjectileColor() || this.mutantKit.getProjectileColor();
    }

    getProjectileVisualStyle() {
        return this.avengerKit.getProjectileVisualStyle() || this.cosmicKit.getProjectileVisualStyle() || this.streetKit.getProjectileVisualStyle() || this.mutantKit.getProjectileVisualStyle();
    }

    render(ctx) {
        this.fieldDevice?.render(ctx);
        this.avengerKit.render(ctx);
        this.cosmicKit.render(ctx);
        this.streetKit.render(ctx);
        this.mutantKit.render(ctx);
    }

    onKill(target) {
        this.focusKit?.onKill(target);
        this.cosmicKit.onKill();
        this.streetKit.onKill(target);
        this.mutantKit.onKill(target);
    }

    static getLineEndpoint(origin, target, distance) {
        return getLineEndpoint(origin, target, distance);
    }

    static getLineTargets(origin, target, enemies, distance, width) {
        return getLineTargets(origin, target, enemies, distance, width);
    }
}
