import { CombatSystem } from './CombatSystem.js';
import { applyCooldownReductions } from '../utils/AbilityModifiers.js';

const STREET_CONTROLS = {
    shang_chi: {
        label: 'Patron de los Diez Anillos',
        defaultMode: 'orbit',
        options: [
            { id: 'orbit', label: 'Orbita' },
            { id: 'volley', label: 'Rafaga' },
            { id: 'guard', label: 'Guardia' }
        ]
    }
};

const MOON_PHASES = [
    { id: 'crescent', label: 'Creciente', color: '#9bdcff' },
    { id: 'full', label: 'Luna llena', color: '#fff4c7' },
    { id: 'waning', label: 'Menguante', color: '#b69cff' }
];

export class StreetKitSystem {
    constructor(hero) {
        this.hero = hero;
        this.mode = STREET_CONTROLS[hero.id]?.defaultMode || null;
        this.attackCount = 0;
        this.cooldownRemaining = 0;
        this.radarTimer = 0;
        this.radarPulseTimer = 0.4;
        this.moonTimer = 0;
        this.moonPhase = 0;
        this.bloodTally = 0;
        this.lifeStealCooldown = 0;
        this.ringAngle = 0;
    }

    update(dt, enemies, stats) {
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
        this.lifeStealCooldown = Math.max(0, this.lifeStealCooldown - dt);
        this.radarTimer = Math.max(0, this.radarTimer - dt);
        this.ringAngle = (this.ringAngle + dt * 2.8) % (Math.PI * 2);

        if (this.hero.id === 'daredevil') this.updateDaredevil(dt);
        if (this.hero.id === 'moon_knight') this.updateMoonCycle(dt);
        if (this.hero.id === 'ghost_rider') this.updatePenance(enemies, stats);
        if (this.hero.id === 'luke_cage') this.updateInterception(enemies);
    }

    onAttack(target, stats) {
        this.attackCount++;
        if (this.hero.id === 'daredevil' && this.attackCount % 4 === 0) this.counterDaredevil(target, stats);
        if (this.hero.id === 'ghost_rider' && this.attackCount % 5 === 0) this.pullWithChain(target);
        if (this.hero.id === 'she_hulk' && this.attackCount % 3 === 0) this.impactSheHulk(target, stats);
        if (this.hero.id === 'shang_chi' && this.mode === 'guard' && this.attackCount % 4 === 0) {
            this.hero.game.resourceManager?.addCredits?.(2);
            this.hero.recordGold?.(2);
        }
    }

    onKill(target) {
        if (this.hero.id !== 'blade') return;
        this.bloodTally++;
        if (this.bloodTally < 6 || this.lifeStealCooldown > 0) return;
        const resources = this.hero.game.resourceManager;
        if (resources?.lives < resources?.maxLives) {
            resources.addLife(1);
            this.hero.recordAbility();
            this.hero.game.audio?.play('blood');
        }
        this.bloodTally = 0;
        this.lifeStealCooldown = 24;
    }

    applyStatModifiers(stats) {
        const heroes = this.hero.game?.heroes || [];
        const radarActive = heroes.some((candidate) => candidate.id === 'daredevil'
            && candidate.abilitySystem?.streetKit?.radarTimer > 0);
        if (radarActive) stats.canSeeStealth = true;

        const luke = heroes.find((candidate) => candidate.id === 'luke_cage'
            && candidate !== this.hero && distance(candidate, this.hero) <= 135);
        if (luke) {
            stats.range *= 1.06;
            stats.fireRate *= 1.08;
        }

        if (this.hero.id === 'moon_knight') {
            if (this.moonPhase === 0) stats.range *= 1.22;
            if (this.moonPhase === 1) stats.damage *= 1.3;
            if (this.moonPhase === 2) stats.fireRate *= 1.16;
        }
        if (this.hero.id === 'blade') {
            stats.damage *= 1.08;
            stats.fireRate *= 1 + Math.min(0.18, this.bloodTally * 0.025);
        }
        if (this.hero.id === 'shang_chi') {
            if (this.mode === 'orbit') stats.range *= 1.15;
            if (this.mode === 'volley') {
                stats.damage *= 1.2;
                stats.fireRate *= 0.88;
            }
            if (this.mode === 'guard') {
                stats.damage *= 0.9;
                stats.fireRate *= 1.22;
            }
        }
        return stats;
    }

    getAttackEffects(target) {
        if (this.hero.id === 'moon_knight' && this.moonPhase === 2) {
            return [{ type: 'slow', duration: 2.2, power: 0.46, chance: 1 }];
        }
        if (this.hero.id === 'blade') {
            const elite = target?.isBoss || (target?.threat || 0) >= 4;
            return [{ type: 'bleed', duration: elite ? 5 : 3.6, power: elite ? 10 : 7, chance: 1 }];
        }
        if (this.hero.id === 'ghost_rider') {
            return [{ type: 'burn', duration: 4, power: 9, chance: 1 }];
        }
        if (this.hero.id === 'luke_cage') {
            return [{ type: 'armorBreak', duration: 3.5, power: 0.28, chance: 0.7 }];
        }
        if (this.hero.id === 'she_hulk') {
            return [
                { type: 'knockback', duration: 0, power: 34, chance: 0.48 },
                { type: 'mark', duration: 2.4, power: 0.12, chance: 0.48 }
            ];
        }
        return [];
    }

    getProjectileProfile() {
        if (this.hero.id === 'moon_knight') {
            if (this.moonPhase === 0) return { returning: true, chainCount: 1, chainRange: 105, chainFactor: 0.58 };
            if (this.moonPhase === 1) return { returning: true, armorPenetration: 0.35 };
            return { returning: true, splashRadius: 44, splashFactor: 0.42 };
        }
        if (this.hero.id === 'shang_chi') {
            if (this.mode === 'orbit') return { chainCount: 3, chainRange: 92, chainFactor: 0.7, returning: true };
            if (this.mode === 'volley') return { splashRadius: 62, splashFactor: 0.54, armorPenetration: 0.3 };
            return { chainCount: 1, chainRange: 115, chainFactor: 0.82, returning: true };
        }
        return {};
    }

    getProjectileColor() {
        if (this.hero.id === 'daredevil') return '#e84545';
        if (this.hero.id === 'moon_knight') return MOON_PHASES[this.moonPhase].color;
        if (this.hero.id === 'blade') return '#ff4d68';
        if (this.hero.id === 'ghost_rider') return '#ff7a1a';
        if (this.hero.id === 'luke_cage') return '#f2c94c';
        if (this.hero.id === 'shang_chi') return '#ffd447';
        if (this.hero.id === 'she_hulk') return '#91ed55';
        return null;
    }

    getProjectileVisualStyle() {
        if (this.hero.id === 'moon_knight') return 'crescent';
        if (this.hero.id === 'ghost_rider') return 'hellfire';
        if (this.hero.id === 'shang_chi') return 'ring';
        if (this.hero.id === 'blade') return 'blade';
        return null;
    }

    getDisplayState() {
        if (this.hero.id === 'daredevil') return timerState(this.radarTimer > 0 ? 'Radar global activo' : 'Radar recargando', this.radarTimer > 0 ? this.radarTimer / 4.5 : 1 - this.radarPulseTimer / 12, this.radarTimer > 0);
        if (this.hero.id === 'moon_knight') return timerState(`Ciclo: ${MOON_PHASES[this.moonPhase].label}`, this.moonTimer / 10, this.moonPhase === 1);
        if (this.hero.id === 'blade') return timerState(`Sed de sangre ${this.bloodTally}/6`, this.bloodTally / 6, this.bloodTally >= 5);
        if (this.hero.id === 'ghost_rider') return timerState(this.cooldownRemaining <= 0 ? 'Penitencia lista' : `Penitencia ${this.cooldownRemaining.toFixed(1)} s`, this.cooldownRemaining <= 0 ? 1 : 1 - this.cooldownRemaining / 11, this.cooldownRemaining <= 0);
        if (this.hero.id === 'luke_cage') return timerState(this.cooldownRemaining <= 0 ? 'Intercepcion lista' : `Intercepcion ${this.cooldownRemaining.toFixed(1)} s`, this.cooldownRemaining <= 0 ? 1 : 1 - this.cooldownRemaining / 10, this.cooldownRemaining <= 0);
        if (this.hero.id === 'shang_chi') return staticState(`Anillos: ${this.getModeLabel()}`);
        if (this.hero.id === 'she_hulk') return staticState('Provocacion e impacto cada 3 golpes');
        return null;
    }

    getControlState() {
        const config = STREET_CONTROLS[this.hero.id];
        return config ? { ...config, value: this.mode } : null;
    }

    setMode(mode) {
        const config = STREET_CONTROLS[this.hero.id];
        if (!config?.options.some((option) => option.id === mode)) return false;
        this.mode = mode;
        return true;
    }

    getMode() {
        return this.mode;
    }

    render(ctx) {
        if (this.hero.id === 'daredevil' && this.radarTimer > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(232, 69, 69, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.hero.x, this.hero.y, 34 + (4.5 - this.radarTimer) * 16, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        if (this.hero.id === 'moon_knight') {
            ctx.save();
            ctx.fillStyle = MOON_PHASES[this.moonPhase].color;
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            ctx.arc(this.hero.x + 20, this.hero.y - 22, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        if (this.hero.id === 'shang_chi') {
            const count = this.mode === 'volley' ? 5 : this.mode === 'guard' ? 8 : 10;
            ctx.save();
            ctx.strokeStyle = '#ffd447';
            ctx.lineWidth = 2;
            for (let index = 0; index < count; index++) {
                const angle = this.ringAngle + index / count * Math.PI * 2;
                const radius = this.mode === 'guard' ? 24 : 31;
                ctx.beginPath();
                ctx.arc(this.hero.x + Math.cos(angle) * radius, this.hero.y + Math.sin(angle) * radius * 0.55, 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    updateDaredevil(dt) {
        this.radarPulseTimer -= dt;
        if (this.radarPulseTimer > 0) return;
        this.radarTimer = 4.5;
        this.radarPulseTimer = this.getCooldown(12);
        this.hero.game.vfx?.addRing(this.hero.x, this.hero.y, { color: '#e84545', radius: 190, duration: 0.7 });
        this.hero.game.audio?.play('radar');
        this.hero.recordAbility();
    }

    updateMoonCycle(dt) {
        this.moonTimer += dt;
        if (this.moonTimer < 10) return;
        this.moonTimer -= 10;
        this.moonPhase = (this.moonPhase + 1) % MOON_PHASES.length;
        this.hero.game.audio?.play('moon');
    }

    updatePenance(enemies, stats) {
        if (this.cooldownRemaining > 0) return;
        const boss = enemies.filter((enemy) => enemy.isAlive && enemy.isBoss && distance(enemy, this.hero) <= stats.range * 1.3)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!boss) return;
        const missingHealth = 1 - boss.hp / boss.maxHp;
        const damage = Math.min(boss.maxHp * 0.12, stats.damage * (1.4 + missingHealth * 2.2)) * this.getPowerScale();
        CombatSystem.applyDamage({ attackerType: this.hero.category, damage, armorPenetration: 0.55 }, boss, this.hero, this.hero.game.resourceManager, 1);
        this.hero.game.vfx?.addBeam(this.hero, boss, { color: '#ff7a1a', width: 10, duration: 0.35 });
        this.hero.game.audio?.play('penance');
        this.hero.recordAbility();
        this.cooldownRemaining = this.getCooldown(11);
    }

    updateInterception(enemies) {
        if (this.cooldownRemaining > 0) return;
        const target = enemies.filter((enemy) => enemy.isAlive && !enemy.flying && pathProgress(enemy) >= 0.82)
            .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];
        if (!target) return;
        const moved = target.moveBackward?.(target.isBoss ? 42 : 92) || 0;
        if (moved <= 0) return;
        target.applyStatus?.({ type: 'armorBreak', duration: 4, power: 0.3 }, this.hero);
        this.hero.game.vfx?.addBeam(this.hero, target, { color: '#f2c94c', width: 7, duration: 0.28 });
        this.hero.game.audio?.play('intercept');
        this.hero.recordAbility();
        this.hero.recordLifeSaved?.(target.isBoss ? 3 : 1);
        this.cooldownRemaining = this.getCooldown(10);
    }

    counterDaredevil(target, stats) {
        if (!target?.isAlive) return;
        CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.72 * this.getPowerScale(), armorPenetration: 0.2 }, target, this.hero, this.hero.game.resourceManager, 1);
        this.hero.game.vfx?.addBurst(target.x, target.y, { color: '#e84545', radius: 28, duration: 0.2 });
        this.hero.game.audio?.play('counter');
        this.hero.recordAbility();
    }

    pullWithChain(target) {
        if (!target?.isAlive || target.flying) return;
        const moved = target.moveBackward?.(target.isBoss ? 24 : 58) || 0;
        if (moved <= 0) return;
        this.hero.game.vfx?.addBeam(this.hero, target, { color: '#ff7a1a', width: 5, duration: 0.25 });
        this.hero.game.audio?.play('chain');
        this.hero.recordAbility();
    }

    impactSheHulk(target, stats) {
        const victims = (this.hero.game.enemies || []).filter((enemy) => enemy.isAlive && distance(enemy, target) <= 58);
        victims.forEach((enemy) => {
            CombatSystem.applyDamage({ attackerType: this.hero.category, damage: stats.damage * 0.55 * this.getPowerScale(), armorPenetration: 0.15 }, enemy, this.hero, this.hero.game.resourceManager, 1);
            if (enemy.isAlive) {
                enemy.moveBackward?.(enemy.isBoss ? 18 : 38);
                enemy.applyStatus?.({ type: 'mark', duration: 2.4, power: 0.14 }, this.hero);
            }
        });
        this.hero.game.vfx?.addRing(target.x, target.y, { color: '#91ed55', radius: 62, duration: 0.32 });
        this.hero.game.audio?.play('impact');
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
        const config = STREET_CONTROLS[this.hero.id];
        return config?.options.find((option) => option.id === this.mode)?.label || '';
    }
}

function timerState(label, progress, ready) {
    return { label, progress: Math.max(0, Math.min(1, progress)), ready };
}

function staticState(label) {
    return { label, progress: null, ready: true };
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function pathProgress(enemy) {
    if (!enemy.path?.length) return 0;
    let total = 0;
    for (let index = 1; index < enemy.path.length; index++) total += distance(enemy.path[index - 1], enemy.path[index]);
    return total > 0 ? enemy.distanceTravelled / total : 0;
}

export { MOON_PHASES, STREET_CONTROLS };
