import { Projectile } from '../entities/Projectile.js';
import { CombatSystem } from './CombatSystem.js';
import { getLineEndpoint, getLineTargets } from '../utils/LineTargeting.js';
import { applyCooldownReductions } from '../utils/AbilityModifiers.js';

const COSMIC_CONTROLS = {
    star_lord: {
        label: 'Munición elemental',
        defaultMode: 'plasma',
        options: [
            { id: 'plasma', label: 'Plasma' },
            { id: 'cryo', label: 'Criogénica' },
            { id: 'incendiary', label: 'Incendiaria' }
        ]
    },
    silver_surfer: {
        label: 'Poder Cósmico',
        defaultMode: 'power',
        options: [
            { id: 'power', label: 'Poder' },
            { id: 'control', label: 'Control' },
            { id: 'support', label: 'Resonancia' }
        ]
    }
};

export class CosmicKitSystem {
    constructor(hero) {
        this.hero = hero;
        this.mode = COSMIC_CONTROLS[hero.id]?.defaultMode || null;
        this.attackCount = 0;
        this.resource = 0;
        this.cooldownRemaining = 0;
        this.flightTimer = 0;
        this.flightOrigin = null;
        this.rootWall = null;
        this.guardianHealTimer = 18;
    }

    update(dt, enemies, stats) {
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
        if (this.hero.id === 'captain_marvel') this.updateCaptainMarvel(dt, enemies, stats);
        if (this.hero.id === 'groot') this.updateGroot(dt, enemies, stats);
    }

    onAttack(target, stats, projectileConfig, projectiles) {
        this.attackCount++;
        if (this.hero.id === 'captain_marvel') this.resource = Math.min(100, this.resource + 12);
        if (this.hero.id === 'star_lord') this.fireSecondBlaster(target, projectileConfig, projectiles);
        if (this.hero.id === 'gamora') this.activateGamoraCombo(target, stats);
        if (this.hero.id === 'silver_surfer' && this.attackCount % 2 === 0) this.fireCosmicTrajectory(target, stats);
    }

    onKill() {
        if (this.hero.id === 'captain_marvel') this.resource = Math.min(100, this.resource + 24);
    }

    applyStatModifiers(stats) {
        if (this.hero.id === 'captain_marvel') {
            stats.damage *= 1 + this.resource * 0.0035;
            stats.fireRate *= 1 + this.resource * 0.0018;
        }
        if (this.hero.id === 'silver_surfer') {
            if (this.mode === 'power') stats.damage *= 1.22;
            if (this.mode === 'control') stats.range *= 1.16;
            if (this.mode === 'support') {
                stats.fireRate *= 1.12;
                stats.damage *= 0.92;
            }
        }
        return stats;
    }

    getAttackEffects() {
        if (this.hero.id === 'star_lord' && this.mode === 'cryo') return [{ type: 'slow', duration: 2, power: 0.42, chance: 1 }];
        if (this.hero.id === 'star_lord' && this.mode === 'incendiary') return [{ type: 'burn', duration: 3, power: 7, chance: 1 }];
        if (this.hero.id === 'silver_surfer' && this.mode === 'control') return [{ type: 'slow', duration: 1.8, power: 0.36, chance: 1 }];
        if (this.hero.id === 'silver_surfer' && this.mode === 'support') return [{ type: 'mark', duration: 2.8, power: 0.12, chance: 1 }];
        return [];
    }

    getProjectileProfile() {
        if (this.hero.id === 'star_lord' && this.mode === 'plasma') return { armorPenetration: 0.28 };
        if (this.hero.id === 'silver_surfer') {
            if (this.mode === 'power') return { splashRadius: 82, splashFactor: 0.62, armorPenetration: 0.3 };
            if (this.mode === 'control') return { chainCount: 2, chainRange: 120, chainFactor: 0.62 };
            return { splashRadius: 54, splashFactor: 0.45 };
        }
        return {};
    }

    getProjectileColor() {
        if (this.hero.id === 'captain_marvel') return '#ffd45f';
        if (this.hero.id === 'star_lord') return { plasma: '#7ce7ff', cryo: '#8ff4ff', incendiary: '#ff7b45' }[this.mode];
        if (this.hero.id === 'groot') return '#85d46a';
        if (this.hero.id === 'gamora') return '#7dff8a';
        if (this.hero.id === 'silver_surfer') return { power: '#fff3b0', control: '#8de8ff', support: '#ff8bd1' }[this.mode];
        return null;
    }

    getProjectileVisualStyle() {
        if (this.hero.id === 'star_lord') return 'blaster';
        if (this.hero.id === 'silver_surfer') return 'cosmic';
        return null;
    }

    getDisplayState() {
        if (this.hero.id === 'captain_marvel') return meter(`Energía binaria ${Math.round(this.resource)}/100`, this.resource);
        if (this.hero.id === 'star_lord') return staticState(`Blásters: ${this.getModeLabel()}`);
        if (this.hero.id === 'groot') {
            const ready = this.cooldownRemaining <= 0;
            return { label: ready ? 'Muro de raíces listo' : `Raíces ${this.cooldownRemaining.toFixed(1)} s`, progress: ready ? 1 : 1 - this.cooldownRemaining / 10, ready };
        }
        if (this.hero.id === 'gamora') return staticState('Ejecución bajo 25% · cadena x2');
        if (this.hero.id === 'silver_surfer') return staticState(`Poder Cósmico: ${this.getModeLabel()}`);
        return null;
    }

    getControlState() {
        const config = COSMIC_CONTROLS[this.hero.id];
        return config ? { ...config, value: this.mode } : null;
    }

    setMode(mode) {
        const config = COSMIC_CONTROLS[this.hero.id];
        if (!config?.options.some((option) => option.id === mode)) return false;
        this.mode = mode;
        return true;
    }

    getMode() {
        return this.mode;
    }

    render(ctx) {
        if (this.rootWall) {
            ctx.save();
            ctx.strokeStyle = '#78c85a';
            ctx.lineWidth = 7;
            ctx.globalAlpha = Math.min(1, this.rootWall.duration);
            ctx.beginPath();
            ctx.moveTo(this.rootWall.x - 24, this.rootWall.y - 18);
            ctx.quadraticCurveTo(this.rootWall.x, this.rootWall.y + 20, this.rootWall.x + 24, this.rootWall.y - 18);
            ctx.stroke();
            ctx.restore();
        }
        if (this.hero.id === 'captain_marvel' && this.flightTimer > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 212, 95, 0.28)';
            ctx.beginPath();
            ctx.arc(this.hero.x, this.hero.y + 18, 22 + this.flightTimer * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    updateCaptainMarvel(dt, enemies, stats) {
        if (this.flightTimer > 0) {
            this.flightTimer -= dt;
            if (this.flightTimer <= 0 && this.flightOrigin) {
                this.hero.x = this.flightOrigin.x;
                this.hero.y = this.flightOrigin.y;
                this.flightOrigin = null;
            }
            return;
        }
        if (this.resource < 60 || this.cooldownRemaining > 0) return;
        const target = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range * 2.2)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!target) return;
        this.flightOrigin = { x: this.hero.x, y: this.hero.y };
        const endpoint = { x: target.x, y: target.y - 34 };
        const victims = getLineTargets(this.hero, target, enemies, stats.range * 2.2, 26);
        victims.forEach((enemy) => CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.85 * this.getPowerScale(), armorPenetration: 0.35 }, enemy, this.hero, this.hero.game.resourceManager, 1));
        this.hero.game.vfx?.addBeam(this.hero, endpoint, { color: '#ffd45f', width: 13, duration: 0.3 });
        this.hero.x = endpoint.x;
        this.hero.y = endpoint.y;
        this.flightTimer = 1.25;
        this.cooldownRemaining = this.getCooldown(9);
        this.resource -= 60;
        this.hero.game.audio?.play('binary');
        this.hero.recordAbility();
    }

    fireSecondBlaster(primaryTarget, projectileConfig, projectiles) {
        const target = (this.hero.game.enemies || [])
            .filter((enemy) => enemy.isAlive && enemy !== primaryTarget && distance(enemy, this.hero) <= this.hero.range)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!target) return;
        const config = { ...projectileConfig, damage: projectileConfig.damage * 0.68 * this.getPowerScale(), radius: 4 };
        if (this.hero.game.spawnProjectile) this.hero.game.spawnProjectile(this.hero.x + 8, this.hero.y, target, config);
        else projectiles.push(new Projectile(this.hero.x + 8, this.hero.y, target, config));
        this.hero.game.audio?.play('blaster');
        this.hero.recordAbility();
    }

    updateGroot(dt, enemies, stats) {
        if (this.rootWall) {
            this.rootWall.duration -= dt;
            enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.rootWall) <= this.rootWall.radius)
                .forEach((enemy) => enemy.applyStatus?.({ type: 'slow', duration: 0.4, power: 0.68 }, this.hero));
            if (this.rootWall.duration <= 0) this.rootWall = null;
        }
        if (!this.rootWall && this.cooldownRemaining <= 0) {
            const target = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range * 1.35)
                .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
            if (target) {
                this.rootWall = { x: target.x, y: target.y, radius: 48, duration: 3.2 };
                this.cooldownRemaining = this.getCooldown(10);
                this.hero.game.vfx?.addRing(target.x, target.y, { color: '#78c85a', radius: 52, duration: 0.5 });
                this.hero.game.audio?.play('roots');
                this.hero.recordAbility();
            }
        }
        this.guardianHealTimer -= dt;
        const guardians = (this.hero.game.heroes || []).filter((hero) => hero.config?.tags?.includes('Guardianes')).length;
        if (guardians >= 2 && this.guardianHealTimer <= 0 && this.hero.game.resourceManager.lives < this.hero.game.resourceManager.maxLives) {
            this.hero.game.resourceManager.addLife(1);
            this.guardianHealTimer = 20;
            this.hero.game.audio?.play('roots');
            this.hero.recordAbility();
        }
    }

    activateGamoraCombo(target, stats) {
        const ratio = target.hp / target.maxHp;
        if (ratio <= 0.25 && !target.isBoss) {
            CombatSystem.applyDamage({ attackerType: this.hero.category, damage: target.hp + 1, armorPenetration: 1 }, target, this.hero, this.hero.game.resourceManager, 1);
            this.hero.recordAbility();
            this.hero.game.audio?.play('cosmicBlade');
            return;
        }
        const chain = (this.hero.game.enemies || [])
            .filter((enemy) => enemy.isAlive && enemy !== target && distance(enemy, target) <= 74)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)
            .slice(0, 2);
        chain.forEach((enemy) => CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.48 * this.getPowerScale(), armorPenetration: 0.25 }, enemy, this.hero, this.hero.game.resourceManager, 1));
        if (chain.length) {
            this.hero.game.vfx?.addBurst(target.x, target.y, { color: '#7dff8a', radius: 32, duration: 0.2 });
            this.hero.recordAbility();
        }
    }

    fireCosmicTrajectory(target, stats) {
        const length = stats.range * 1.25;
        const victims = getLineTargets(this.hero, target, this.hero.game.enemies || [], length, 32);
        const factor = this.mode === 'power' ? 0.75 : this.mode === 'control' ? 0.48 : 0.38;
        victims.forEach((enemy) => CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * factor * this.getPowerScale(), armorPenetration: 0.4 }, enemy, this.hero, this.hero.game.resourceManager, 1));
        this.hero.game.vfx?.addBeam(this.hero, getLineEndpoint(this.hero, target, length), { color: this.getProjectileColor(), width: 9, duration: 0.22 });
        this.hero.game.audio?.play('cosmic');
        this.hero.recordAbility();
    }

    getPowerScale() {
        const progression = this.hero.game.progression?.getHeroBonuses(this.hero.id);
        const synergy = this.hero.game.teamSynergy?.getAbilityModifiers(this.hero);
        return 1 + Math.min(0.35, Math.max(0, this.hero.level - 1) * 0.035) + (progression?.abilityPower || 0) + (synergy?.abilityPower || 0);
    }

    getCooldown(base) {
        return applyCooldownReductions(this.hero, base);
    }

    getModeLabel() {
        const config = COSMIC_CONTROLS[this.hero.id];
        return config?.options.find((option) => option.id === this.mode)?.label || '';
    }
}

function meter(label, value) {
    return { label, progress: Math.max(0, Math.min(1, value / 100)), ready: value >= 60 };
}

function staticState(label) {
    return { label, progress: null, ready: true };
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export { COSMIC_CONTROLS };
