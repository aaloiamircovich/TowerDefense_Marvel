import { CombatSystem } from './CombatSystem.js';
import { getLineEndpoint, getLineTargets } from '../utils/LineTargeting.js';
import { applyCooldownReductions } from '../utils/AbilityModifiers.js';

const MUTANT_CONTROLS = {
    cyclops: {
        label: 'Visor optico', defaultMode: 'focus',
        options: [{ id: 'focus', label: 'Penetrante' }, { id: 'ricochet', label: 'Rebote' }]
    },
    storm: {
        label: 'Clima', defaultMode: 'blizzard',
        options: [{ id: 'blizzard', label: 'Ventisca' }, { id: 'lightning', label: 'Tormenta' }]
    },
    ant_man: {
        label: 'Particulas Pym', defaultMode: 'tiny',
        options: [{ id: 'tiny', label: 'Hormiga' }, { id: 'giant', label: 'Gigante' }]
    },
    winter_soldier: {
        label: 'Municion', defaultMode: 'piercing',
        options: [{ id: 'piercing', label: 'Perforante' }, { id: 'shock', label: 'Electrica' }, { id: 'explosive', label: 'Explosiva' }]
    }
};

export class MutantKitSystem {
    constructor(hero) {
        this.hero = hero;
        this.mode = MUTANT_CONTROLS[hero.id]?.defaultMode || null;
        this.attackCount = 0;
        this.resource = 0;
        this.cooldownRemaining = 0;
        this.secondaryCooldown = 0;
        this.jumpTimer = 0;
        this.jumpOrigin = null;
        this.weatherZone = null;
        this.regenerationTimer = 28;
    }

    update(dt, enemies, stats) {
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
        this.secondaryCooldown = Math.max(0, this.secondaryCooldown - dt);
        if (this.hero.id === 'wolverine') this.updateWolverine(dt, enemies, stats);
        if (this.hero.id === 'jean_grey') this.updatePhoenix(enemies, stats);
        if (this.hero.id === 'storm') this.updateWeather(dt, enemies, stats);
        if (this.hero.id === 'domino') this.updateDomino(enemies);
        if (this.hero.id === 'scarlet_witch') this.updateHexTime(enemies, stats);
    }

    onAttack(target, stats) {
        this.attackCount++;
        if (this.hero.id === 'wolverine') this.resource = Math.min(100, this.resource + 7);
        if (this.hero.id === 'jean_grey') {
            const phoenix = this.hero.game.progression?.getHeroEvolution?.(this.hero.id)?.id === 'phoenix';
            this.resource = Math.min(100, this.resource + (phoenix ? 14 : 9));
            if (this.attackCount % 4 === 0) this.telekineticPush(target, stats);
        }
        if (this.hero.id === 'cyclops' && this.attackCount % (this.mode === 'focus' ? 3 : 2) === 0) this.fireOpticLine(target, stats);
        if (this.hero.id === 'domino' && this.attackCount % 5 === 0) this.luckyShot(target, stats);
        if (this.hero.id === 'scarlet_witch') this.linkHexes(target);
        if (this.hero.id === 'ant_man' && this.mode === 'giant' && this.attackCount % 3 === 0) this.giantImpact(target, stats);
    }

    onKill() {
        if (this.hero.id === 'wolverine') this.resource = Math.min(100, this.resource + 18);
        if (this.hero.id === 'jean_grey') {
            const phoenix = this.hero.game.progression?.getHeroEvolution?.(this.hero.id)?.id === 'phoenix';
            this.resource = Math.min(100, this.resource + (phoenix ? 24 : 16));
        }
    }

    applyStatModifiers(stats) {
        if (this.hero.id === 'wolverine') {
            const nearby = (this.hero.game.enemies || []).filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range * 1.3).length;
            stats.fireRate *= 1 + Math.min(0.5, nearby * 0.08) + this.resource * 0.002;
            stats.damage *= 1 + this.resource * 0.0018;
        }
        if (this.hero.id === 'jean_grey') {
            stats.damage *= 1 + this.resource * 0.002;
            stats.range *= 1 + this.resource * 0.001;
        }
        if (this.hero.id === 'cyclops') {
            if (this.mode === 'focus') stats.damage *= 1.24;
            else stats.fireRate *= 1.16;
        }
        if (this.hero.id === 'storm') {
            if (this.mode === 'blizzard') stats.range *= 1.14;
            else stats.damage *= 1.18;
        }
        if (this.hero.id === 'ant_man') {
            if (this.mode === 'tiny') {
                stats.fireRate *= 1.5;
                stats.range *= 1.12;
                stats.damage *= 0.78;
            } else {
                stats.damage *= 1.55;
                stats.range *= 0.88;
                stats.fireRate *= 0.72;
            }
        }
        if (this.hero.id === 'winter_soldier' && this.mode === 'shock') stats.fireRate *= 1.12;
        return stats;
    }

    getAttackEffects() {
        if (this.hero.id === 'jean_grey') return [{ type: 'slow', duration: 1.8, power: 0.34, chance: 0.7 }];
        if (this.hero.id === 'storm' && this.mode === 'blizzard') return [{ type: 'slow', duration: 2.2, power: 0.48, chance: 1 }];
        if (this.hero.id === 'scarlet_witch') return [{ type: 'mark', duration: 4, power: 0.2, chance: 1 }];
        if (this.hero.id === 'winter_soldier' && this.mode === 'shock') return [{ type: 'stun', duration: 0.45, power: 1, chance: 0.45 }];
        return [];
    }

    getProjectileProfile() {
        if (this.hero.id === 'cyclops') {
            return this.mode === 'focus'
                ? { armorPenetration: 0.62 }
                : { chainCount: 3, chainRange: 120, chainFactor: 0.68 };
        }
        if (this.hero.id === 'storm' && this.mode === 'lightning') return { chainCount: 3, chainRange: 130, chainFactor: 0.66 };
        if (this.hero.id === 'scarlet_witch') return { chainCount: 2, chainRange: 140, chainFactor: 0.55 };
        if (this.hero.id === 'ant_man' && this.mode === 'giant') return { splashRadius: 70, splashFactor: 0.58, armorPenetration: 0.2 };
        if (this.hero.id === 'winter_soldier') {
            if (this.mode === 'piercing') return { armorPenetration: 0.65 };
            if (this.mode === 'explosive') return { splashRadius: 64, splashFactor: 0.56 };
        }
        return {};
    }

    getProjectileColor() {
        if (this.hero.id === 'wolverine') return '#f4d03f';
        if (this.hero.id === 'jean_grey') return '#ff8cc8';
        if (this.hero.id === 'cyclops') return '#ff3535';
        if (this.hero.id === 'storm') return this.mode === 'blizzard' ? '#9de9ff' : '#f6f1a4';
        if (this.hero.id === 'domino') return '#d8c8ff';
        if (this.hero.id === 'scarlet_witch') return '#ff3b73';
        if (this.hero.id === 'ant_man') return this.mode === 'tiny' ? '#8de7ff' : '#ef3340';
        if (this.hero.id === 'winter_soldier') return { piercing: '#e9f0f7', shock: '#69dcff', explosive: '#ff9b42' }[this.mode];
        return null;
    }

    getProjectileVisualStyle() {
        if (this.hero.id === 'wolverine') return 'blade';
        if (this.hero.id === 'jean_grey' || this.hero.id === 'scarlet_witch') return 'mystic';
        if (this.hero.id === 'cyclops') return 'optic';
        if (this.hero.id === 'storm' && this.mode === 'lightning') return 'lightning';
        if (this.hero.id === 'ant_man') return 'pym';
        return null;
    }

    getDisplayState() {
        if (this.hero.id === 'wolverine') return meter(`Frenesi ${Math.round(this.resource)}/100`, this.resource, 55);
        if (this.hero.id === 'jean_grey') return meter(`Phoenix ${Math.round(this.resource)}/100`, this.resource, 100);
        if (this.hero.id === 'cyclops') return staticState(`Visor: ${this.getModeLabel()}`);
        if (this.hero.id === 'storm') return staticState(`Clima: ${this.getModeLabel()}`);
        if (this.hero.id === 'domino') return meter(`Suerte controlada ${this.attackCount % 5}/5`, (this.attackCount % 5) * 20, 80);
        if (this.hero.id === 'scarlet_witch') return cooldownState('Alteracion temporal', this.cooldownRemaining, 9);
        if (this.hero.id === 'ant_man') return staticState(`Forma: ${this.getModeLabel()}`);
        if (this.hero.id === 'winter_soldier') return staticState(`Municion: ${this.getModeLabel()}`);
        return null;
    }

    getControlState() {
        const config = MUTANT_CONTROLS[this.hero.id];
        return config ? { ...config, value: this.mode } : null;
    }

    setMode(mode) {
        const config = MUTANT_CONTROLS[this.hero.id];
        if (!config?.options.some((option) => option.id === mode)) return false;
        this.mode = mode;
        return true;
    }

    getMode() {
        return this.mode;
    }

    render(ctx) {
        if (this.weatherZone) {
            ctx.save();
            ctx.strokeStyle = this.mode === 'blizzard' ? 'rgba(157,233,255,.65)' : 'rgba(246,241,164,.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.weatherZone.x, this.weatherZone.y, this.weatherZone.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        if (this.hero.id === 'jean_grey' && this.resource >= 70) {
            ctx.save();
            ctx.strokeStyle = `rgba(255,90,130,${0.3 + this.resource / 250})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.hero.x, this.hero.y, 24 + this.resource / 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        if (this.hero.id === 'ant_man' && this.mode === 'tiny') {
            ctx.save();
            ctx.fillStyle = '#8de7ff';
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 3; i++) ctx.fillRect(this.hero.x - 18 + i * 18, this.hero.y + 15 + i % 2 * 4, 2, 2);
            ctx.restore();
        }
    }

    updateWolverine(dt, enemies, stats) {
        if (this.jumpTimer > 0) {
            this.jumpTimer -= dt;
            if (this.jumpTimer <= 0 && this.jumpOrigin) {
                this.hero.x = this.jumpOrigin.x;
                this.hero.y = this.jumpOrigin.y;
                this.jumpOrigin = null;
            }
            return;
        }
        const resources = this.hero.game.resourceManager;
        if (this.resource < 55 || this.cooldownRemaining > 0) return;
        const target = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range * 3)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!target) return;
        this.jumpOrigin = { x: this.hero.x, y: this.hero.y };
        this.hero.x = target.x;
        this.hero.y = target.y - 30;
        CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 1.25 * this.getPowerScale(), armorPenetration: 0.3 }, target, this.hero, resources, 1);
        this.hero.game.vfx?.addBurst(target.x, target.y, { color: '#f4d03f', radius: 38, duration: 0.26 });
        this.hero.game.audio?.play('claws');
        this.hero.recordAbility();
        this.resource -= 55;
        this.jumpTimer = 0.8;
        this.cooldownRemaining = this.getCooldown(7);
    }

    updatePhoenix(enemies, stats) {
        if (this.resource < 100 || this.cooldownRemaining > 0) return;
        const targets = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range * 1.2);
        if (!targets.length) return;
        targets.forEach((enemy) => {
            const phoenix = this.hero.game.progression?.getHeroEvolution?.(this.hero.id)?.id === 'phoenix';
            CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * (phoenix ? 1.25 : 0.95) * this.getPowerScale(), armorPenetration: phoenix ? 0.5 : 0.35 }, enemy, this.hero, this.hero.game.resourceManager, 1);
            if (enemy.isAlive && !enemy.flying) enemy.moveBackward?.(enemy.isBoss ? 20 : 48);
        });
        this.hero.game.vfx?.addRing(this.hero.x, this.hero.y, { color: '#ff5a82', radius: stats.range * 1.2, duration: 0.55 });
        this.hero.game.audio?.play('phoenix');
        this.hero.recordAbility();
        this.resource = 0;
        this.cooldownRemaining = this.getCooldown(12);
    }

    updateWeather(dt, enemies, stats) {
        if (this.weatherZone) {
            this.weatherZone.duration -= dt;
            const victims = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.weatherZone) <= this.weatherZone.radius);
            if (this.mode === 'blizzard') victims.forEach((enemy) => enemy.applyStatus?.({ type: 'slow', duration: 0.5, power: 0.55 }, this.hero));
            else if (this.weatherZone.tick <= 0) {
                victims.slice(0, 4).forEach((enemy) => CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.42 * this.getPowerScale() }, enemy, this.hero, this.hero.game.resourceManager, 1));
                this.weatherZone.tick = 0.8;
            }
            this.weatherZone.tick -= dt;
            if (this.weatherZone.duration <= 0) this.weatherZone = null;
        }
        if (this.weatherZone || this.cooldownRemaining > 0) return;
        const target = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!target) return;
        this.weatherZone = { x: target.x, y: target.y, radius: 72, duration: 4.2, tick: 0 };
        this.cooldownRemaining = this.getCooldown(9);
        this.hero.game.audio?.play('weather');
        this.hero.recordAbility();
    }

    updateDomino(enemies) {
        if (this.secondaryCooldown > 0) return;
        const target = enemies.filter((enemy) => enemy.isAlive && !enemy.flying && pathProgress(enemy) > 0.88)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!target) return;
        const lucky = (this.hero.game.random?.next?.() ?? Math.random()) < 0.65;
        this.secondaryCooldown = this.getCooldown(13);
        if (!lucky) return;
        target.moveBackward?.(target.isBoss ? 24 : 62);
        this.hero.game.vfx?.addBurst(target.x, target.y, { color: '#d8c8ff', radius: 30, duration: 0.24 });
        this.hero.game.audio?.play('luck');
        this.hero.recordAbility();
    }

    updateHexTime(enemies, stats) {
        if (this.cooldownRemaining > 0) return;
        const targets = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range * 1.25);
        if (!targets.length) return;
        targets.forEach((enemy) => enemy.applyStatus?.({ type: 'slow', duration: 3.2, power: 0.58 }, this.hero));
        this.hero.game.vfx?.addRing(this.hero.x, this.hero.y, { color: '#ff3b73', radius: stats.range * 1.25, duration: 0.45 });
        this.hero.game.audio?.play('hex');
        this.hero.recordAbility();
        this.cooldownRemaining = this.getCooldown(9);
    }

    telekineticPush(target, stats) {
        const victims = (this.hero.game.enemies || []).filter((enemy) => enemy.isAlive && distance(enemy, target) <= 64);
        victims.forEach((enemy) => {
            CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.38 * this.getPowerScale() }, enemy, this.hero, this.hero.game.resourceManager, 1);
            if (enemy.isAlive && !enemy.flying) enemy.moveBackward?.(enemy.isBoss ? 18 : 42);
        });
        this.hero.game.vfx?.addBurst(target.x, target.y, { color: '#ff8cc8', radius: 66, duration: 0.28 });
        this.hero.game.audio?.play('telekinesis');
        this.hero.recordAbility();
    }

    fireOpticLine(target, stats) {
        const length = stats.range * 1.3;
        const victims = getLineTargets(this.hero, target, this.hero.game.enemies || [], length, this.mode === 'focus' ? 24 : 38);
        victims.forEach((enemy) => CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * (this.mode === 'focus' ? 0.86 : 0.55) * this.getPowerScale(), armorPenetration: this.mode === 'focus' ? 0.6 : 0.25 }, enemy, this.hero, this.hero.game.resourceManager, 1));
        this.hero.game.vfx?.addBeam(this.hero, getLineEndpoint(this.hero, target, length), { color: '#ff3535', width: this.mode === 'focus' ? 8 : 5, duration: 0.2 });
        this.hero.game.audio?.play('optic');
        this.hero.recordAbility();
    }

    luckyShot(target, stats) {
        if (!target?.isAlive || target.flying) return;
        target.moveBackward?.(target.isBoss ? 12 : 34);
        target.applyStatus?.({ type: 'mark', duration: 2.4, power: 0.1 }, this.hero);
        this.hero.game.vfx?.addBurst(target.x, target.y, { color: '#d8c8ff', radius: 28, duration: 0.24 });
        this.hero.game.audio?.play('luck');
        this.hero.recordAbility();
    }

    linkHexes(target) {
        const linked = (this.hero.game.enemies || []).filter((enemy) => enemy.isAlive && distance(enemy, target) <= 145)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled).slice(0, 4);
        linked.forEach((enemy) => enemy.applyStatus?.({ type: 'mark', duration: 4, power: 0.18 }, this.hero));
        if (linked.length > 1) this.hero.recordAbility();
    }

    giantImpact(target, stats) {
        const victims = (this.hero.game.enemies || []).filter((enemy) => enemy.isAlive && distance(enemy, target) <= 68);
        victims.forEach((enemy) => {
            CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.5 * this.getPowerScale(), armorPenetration: 0.2 }, enemy, this.hero, this.hero.game.resourceManager, 1);
            if (enemy.isAlive && !enemy.flying) enemy.moveBackward?.(enemy.isBoss ? 15 : 32);
        });
        this.hero.game.vfx?.addRing(target.x, target.y, { color: '#ef3340', radius: 72, duration: 0.3 });
        this.hero.game.audio?.play('pym');
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
        const config = MUTANT_CONTROLS[this.hero.id];
        return config?.options.find((option) => option.id === this.mode)?.label || '';
    }
}

function meter(label, value, readyAt) {
    return { label, progress: Math.max(0, Math.min(1, value / 100)), ready: value >= readyAt };
}
function staticState(label) { return { label, progress: null, ready: true }; }
function cooldownState(label, remaining, total) { return { label: remaining <= 0 ? `${label} lista` : `${label} ${remaining.toFixed(1)} s`, progress: remaining <= 0 ? 1 : 1 - remaining / total, ready: remaining <= 0 }; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function pathProgress(enemy) { if (!enemy.path?.length) return 0; let total = 0; for (let index = 1; index < enemy.path.length; index++) total += distance(enemy.path[index - 1], enemy.path[index]); return total > 0 ? enemy.distanceTravelled / total : 0; }

export { MUTANT_CONTROLS };
