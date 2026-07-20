import { CombatSystem } from './CombatSystem.js';
import { getLineEndpoint, getLineTargets } from '../utils/LineTargeting.js';
import { applyCooldownReductions } from '../utils/AbilityModifiers.js';

const CONTROL_MODES = {
    hawkeye: {
        label: 'Munición',
        defaultMode: 'explosive',
        options: [
            { id: 'explosive', label: 'Explosiva' },
            { id: 'cryo', label: 'Criogénica' },
            { id: 'piercing', label: 'Perforante' }
        ]
    },
    vision: {
        label: 'Densidad',
        defaultMode: 'phase',
        options: [
            { id: 'phase', label: 'Intangible' },
            { id: 'dense', label: 'Densa' }
        ]
    },
    falcon: {
        label: 'Redwing',
        defaultMode: 'recon',
        options: [
            { id: 'recon', label: 'Reconocimiento' },
            { id: 'assault', label: 'Asalto' }
        ]
    }
};

export class AvengerKitSystem {
    constructor(hero) {
        this.hero = hero;
        this.mode = CONTROL_MODES[hero.id]?.defaultMode || null;
        this.resource = 0;
        this.attackCount = 0;
        this.cooldownRemaining = 0;
        this.lastLives = hero.game?.resourceManager?.lives ?? 20;
        this.lastTargetId = null;
        this.redwingAngle = 0;
        this.counteredTargets = new Set();
    }

    update(dt, enemies, stats) {
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
        this.redwingAngle = (this.redwingAngle + dt * 2.4) % (Math.PI * 2);

        if (this.hero.id === 'hulk') this.updateHulk(enemies, stats);
        if (this.hero.id === 'black_panther') this.updateBlackPanther(enemies, stats);
        if (this.hero.id === 'falcon') this.updateRedwing(enemies, stats);
    }

    onAttack(target, stats) {
        this.attackCount++;
        if (this.hero.id === 'hulk') this.resource = Math.min(100, this.resource + 8);
        if (this.hero.id === 'black_widow') this.activateWidowKit(target, stats);
        if (this.hero.id === 'hawkeye') this.hero.game.audio?.play('arrow');
        if (this.hero.id === 'black_panther') this.chargeKineticEnergy(target);
        if (this.hero.id === 'vision' && this.attackCount % 3 === 0) this.fireDensityBeam(target, stats);
    }

    applyStatModifiers(stats) {
        if (this.hero.id === 'hulk') {
            stats.damage *= 1 + this.resource * 0.004;
            stats.fireRate *= 1 + this.resource * 0.0015;
        }
        if (this.hero.id === 'black_panther') {
            stats.damage *= 1 + this.resource * 0.0025;
            stats.critChance += this.resource * 0.04;
        }
        if (this.hero.id === 'vision') {
            if (this.mode === 'phase') {
                stats.range *= 1.18;
                stats.fireRate *= 1.12;
                stats.damage *= 0.88;
            } else {
                stats.damage *= 1.3;
                stats.fireRate *= 0.78;
            }
        }

        const allies = this.hero.game?.heroes || [];
        const panther = allies.find((candidate) => candidate.id === 'black_panther'
            && Math.hypot(candidate.x - this.hero.x, candidate.y - this.hero.y) <= 145);
        if (panther && panther !== this.hero) {
            stats.damage *= 1.06;
            stats.critChance += 3;
        }

        const reconFalcon = allies.find((candidate) => candidate.id === 'falcon'
            && candidate.abilitySystem?.getCombatMode?.() === 'recon'
            && Math.hypot(candidate.x - this.hero.x, candidate.y - this.hero.y) <= 165);
        if (reconFalcon) stats.canSeeStealth = true;
        return stats;
    }

    getAttackEffects(target) {
        if (this.hero.id === 'black_widow') {
            const support = ['support', 'summoner'].includes(target?.archetype);
            return support
                ? [{ type: 'armorBreak', duration: 4, power: 0.3, chance: 1 }, { type: 'mark', duration: 4, power: 0.18, chance: 1 }]
                : [{ type: 'stun', duration: 0.35, power: 1, chance: 0.22 }];
        }
        if (this.hero.id === 'hawkeye' && this.mode === 'cryo') {
            return [{ type: 'slow', duration: 2.4, power: 0.48, chance: 1 }];
        }
        return [];
    }

    getProjectileProfile() {
        if (this.hero.id === 'hawkeye') {
            if (this.mode === 'explosive') return { splashRadius: 68, splashFactor: 0.58 };
            if (this.mode === 'piercing') return { armorPenetration: 0.65 };
        }
        if (this.hero.id === 'vision') {
            return { armorPenetration: this.mode === 'dense' ? 0.55 : 0.25 };
        }
        return {};
    }

    getProjectileColor() {
        if (this.hero.id === 'hawkeye') {
            return { explosive: '#ff9d3d', cryo: '#7ce7ff', piercing: '#d8f0ff' }[this.mode];
        }
        if (this.hero.id === 'black_widow') return '#73e9ff';
        if (this.hero.id === 'black_panther') return '#9c7cff';
        if (this.hero.id === 'vision') return this.mode === 'dense' ? '#ffd54a' : '#65f5d1';
        if (this.hero.id === 'falcon') return '#ff5d5d';
        if (this.hero.id === 'hulk') return '#8df05b';
        return null;
    }

    getProjectileVisualStyle() {
        if (this.hero.id === 'black_widow') return 'lightning';
        if (this.hero.id === 'vision') return 'density';
        if (this.hero.id === 'hawkeye') return 'arrow';
        return null;
    }

    getDisplayState() {
        if (this.hero.id === 'hulk') return meterState(`Furia gamma ${Math.round(this.resource)}/100`, this.resource);
        if (this.hero.id === 'black_widow') {
            const charge = this.attackCount % 4;
            return meterState(`Descarga Widow ${charge}/4`, charge * 25, charge === 3);
        }
        if (this.hero.id === 'hawkeye') return staticState(`Flecha ${this.getModeLabel().toLowerCase()}`);
        if (this.hero.id === 'black_panther') return meterState(`Energía cinética ${Math.round(this.resource)}/100`, this.resource);
        if (this.hero.id === 'vision') return staticState(`Densidad ${this.getModeLabel().toLowerCase()}`);
        if (this.hero.id === 'falcon') {
            const ready = this.cooldownRemaining <= 0;
            return { label: `Redwing: ${this.getModeLabel()}`, progress: ready ? 1 : 1 - this.cooldownRemaining / 2.4, ready };
        }
        return null;
    }

    getControlState() {
        const config = CONTROL_MODES[this.hero.id];
        return config ? { ...config, value: this.mode } : null;
    }

    setMode(mode) {
        const config = CONTROL_MODES[this.hero.id];
        if (!config?.options.some((option) => option.id === mode)) return false;
        this.mode = mode;
        return true;
    }

    getMode() {
        return this.mode;
    }

    render(ctx) {
        if (this.hero.id !== 'falcon') return;
        const distance = this.mode === 'recon' ? 28 : 22;
        const x = this.hero.x + Math.cos(this.redwingAngle) * distance;
        const y = this.hero.y + Math.sin(this.redwingAngle) * distance * 0.55 - 7;
        ctx.save();
        ctx.fillStyle = '#dce9f7';
        ctx.strokeStyle = '#ef3340';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x + 8, y + 3);
        ctx.lineTo(x, y + 1);
        ctx.lineTo(x - 8, y + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    updateHulk(enemies, stats) {
        const lives = this.hero.game.resourceManager?.lives ?? this.lastLives;
        if (lives < this.lastLives) this.resource = Math.min(100, this.resource + (this.lastLives - lives) * 35);
        this.lastLives = lives;
        if (this.resource < 50 || this.cooldownRemaining > 0) return;
        const target = enemies
            .filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range * 2.25)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!target) return;

        const victims = enemies.filter((enemy) => enemy.isAlive && distance(enemy, target) <= 72);
        victims.forEach((enemy) => {
            CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 1.2 * this.getPowerScale(), armorPenetration: 0.2 }, enemy, this.hero, this.hero.game.resourceManager, 1);
            if (enemy.isAlive) enemy.applyStatus?.({ type: 'stun', duration: 0.65, power: 1 }, this.hero);
        });
        this.hero.game.vfx?.addRing(target.x, target.y, { color: '#76ff45', radius: 80, duration: 0.5 });
        this.hero.game.vfx?.addBurst(target.x, target.y, { color: '#b4ff7d', radius: 70, duration: 0.35 });
        this.hero.game.audio?.play('gamma');
        this.hero.recordAbility();
        this.resource -= 50;
        this.cooldownRemaining = this.getCooldown(8);
    }

    activateWidowKit(target, stats) {
        if (this.attackCount % 4 !== 0) return;
        const candidates = (this.hero.game.enemies || [])
            .filter((enemy) => enemy.isAlive && enemy !== target && distance(enemy, target) <= 125)
            .sort((a, b) => Number(['support', 'summoner'].includes(b.archetype)) - Number(['support', 'summoner'].includes(a.archetype)))
            .slice(0, 3);
        [target, ...candidates].forEach((enemy, index) => {
            if (index > 0) CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.55 * this.getPowerScale() }, enemy, this.hero, this.hero.game.resourceManager, 1);
            if (enemy.isAlive) enemy.applyStatus?.({ type: 'stun', duration: 0.55, power: 1 }, this.hero);
            if (index > 0) this.hero.game.vfx?.addBeam(target, enemy, { color: '#6ee8ff', width: 3, duration: 0.18 });
        });
        this.hero.game.audio?.play('taser');
        this.hero.recordAbility();
    }

    chargeKineticEnergy(target) {
        const sameTarget = this.lastTargetId === target.uid;
        this.resource = Math.min(100, this.resource + (sameTarget ? 12 : 6));
        this.lastTargetId = target.uid;
    }

    updateBlackPanther(enemies, stats) {
        for (const enemy of enemies) {
            if (!enemy.isAlive || distance(enemy, this.hero) > 48 || this.counteredTargets.has(enemy.uid)) continue;
            this.counteredTargets.add(enemy.uid);
            CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.7 * this.getPowerScale(), armorPenetration: 0.45 }, enemy, this.hero, this.hero.game.resourceManager, 1);
            if (enemy.isAlive) enemy.applyStatus?.({ type: 'knockback', duration: 0, power: 24 }, this.hero);
            this.resource = Math.min(100, this.resource + 20);
            this.hero.game.vfx?.addBurst(enemy.x, enemy.y, { color: '#a783ff', radius: 30, duration: 0.22 });
            this.hero.game.audio?.play('vibranium');
            this.hero.recordAbility();
        }
        if (this.resource < 100 || this.cooldownRemaining > 0) return;
        const victims = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= stats.range + 35);
        if (!victims.length) return;
        victims.forEach((enemy) => CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.8 * this.getPowerScale() }, enemy, this.hero, this.hero.game.resourceManager, 1));
        this.hero.game.vfx?.addRing(this.hero.x, this.hero.y, { color: '#9b7bff', radius: stats.range + 35, duration: 0.48 });
        this.hero.game.audio?.play('vibranium');
        this.hero.recordAbility();
        this.resource = 0;
        this.cooldownRemaining = this.getCooldown(5);
    }

    fireDensityBeam(target, stats) {
        const distanceLimit = stats.range * (this.mode === 'dense' ? 1.05 : 1.35);
        const width = this.mode === 'dense' ? 18 : 28;
        const damage = stats.damage * (this.mode === 'dense' ? 1.1 : 0.7) * this.getPowerScale();
        const targets = getLineTargets(this.hero, target, this.hero.game.enemies || [], distanceLimit, width);
        targets.forEach((enemy) => CombatSystem.applyDamage({ attackerType: this.hero.category, damage, armorPenetration: this.mode === 'dense' ? 0.7 : 0.35 }, enemy, this.hero, this.hero.game.resourceManager, 1));
        const endpoint = getLineEndpoint(this.hero, target, distanceLimit);
        this.hero.game.vfx?.addBeam(this.hero, endpoint, { color: this.mode === 'dense' ? '#ffd84a' : '#65f5d1', width: this.mode === 'dense' ? 12 : 7, duration: 0.24 });
        this.hero.game.audio?.play('density');
        this.hero.recordAbility();
    }

    updateRedwing(enemies, stats) {
        if (this.cooldownRemaining > 0) return;
        const range = stats.range * (this.mode === 'recon' ? 1.85 : 1.45);
        const candidates = enemies.filter((enemy) => enemy.isAlive && distance(enemy, this.hero) <= range);
        const target = this.mode === 'recon'
            ? candidates.sort((a, b) => Number(Boolean(b.stealth) || ['support', 'summoner'].includes(b.archetype)) - Number(Boolean(a.stealth) || ['support', 'summoner'].includes(a.archetype)) || b.distanceTravelled - a.distanceTravelled)[0]
            : candidates.sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!target) return;
        const factor = this.mode === 'recon' ? 0.38 : 0.72;
        CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * factor * this.getPowerScale(), armorPenetration: 0.25 }, target, this.hero, this.hero.game.resourceManager, 1);
        if (target.isAlive && this.mode === 'recon') target.applyStatus?.({ type: 'mark', duration: 3.2, power: 0.16 }, this.hero);
        const drone = {
            x: this.hero.x + Math.cos(this.redwingAngle) * 28,
            y: this.hero.y + Math.sin(this.redwingAngle) * 15 - 7
        };
        this.hero.game.vfx?.addBeam(drone, target, { color: '#ff5d5d', width: 3, duration: 0.18 });
        this.hero.game.audio?.play('redwing');
        this.hero.recordAbility();
        this.cooldownRemaining = this.getCooldown(this.mode === 'recon' ? 2.4 : 1.65);
    }

    getModeLabel() {
        const config = CONTROL_MODES[this.hero.id];
        return config?.options.find((option) => option.id === this.mode)?.label || this.mode || '';
    }

    getPowerScale() {
        const progression = this.hero.game.progression?.getHeroBonuses(this.hero.id);
        const synergy = this.hero.game.teamSynergy?.getAbilityModifiers(this.hero);
        return 1 + Math.min(0.35, Math.max(0, this.hero.level - 1) * 0.035) + (progression?.abilityPower || 0) + (synergy?.abilityPower || 0);
    }

    getCooldown(base) {
        const levelReduction = Math.min(0.2, Math.max(0, this.hero.level - 1) * 0.015);
        return applyCooldownReductions(this.hero, base, levelReduction);
    }
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function meterState(label, percent, ready = percent >= 100) {
    return { label, progress: Math.max(0, Math.min(1, percent / 100)), ready };
}

function staticState(label) {
    return { label, progress: null, ready: true };
}

export { CONTROL_MODES };
