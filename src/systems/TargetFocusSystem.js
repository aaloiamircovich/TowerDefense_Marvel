import { isPointInRangePattern } from '../utils/RangePattern.js';

export class TargetFocusSystem {
    constructor(hero) {
        this.hero = hero;
        this.shockCooldown = 2;
        this.reset();
    }

    reset() {
        this.target = null;
        this.elapsed = 0;
        this.stacks = 0;
        this.idle = 0;
        this.x = this.hero.x;
        this.y = this.hero.y;
    }

    isEligible(target) {
        if (this.hero.id !== 'cable') return true;
        return Boolean(target?.isBoss || target?.isFinalBoss || target?.isMiniBoss
            || target?.config?.isBoss || target?.config?.isFinalBoss || target?.config?.isMiniBoss
            || (target?.threat || 0) >= 4);
    }

    matches(target) {
        if (!target?.isAlive || target !== this.target || this.hero.stunTimer > 0
            || this.x !== this.hero.x || this.y !== this.hero.y || !this.isEligible(target)) return false;
        const stats = this.hero.getEffectiveStats();
        return (!target.stealth || stats.canSeeStealth)
            && isPointInRangePattern(this.hero, target, stats.range, this.hero.rangePattern, stats.rangeGeometryScale);
    }

    update(dt, enemies = this.hero.game.enemies || []) {
        this.shockCooldown = Math.max(0, this.shockCooldown - dt);
        if (this.hero.stunTimer > 0 || this.x !== this.hero.x || this.y !== this.hero.y) {
            this.reset();
            return;
        }
        if (this.hero.id !== 'cable') {
            this.idle += dt;
            if (!this.matches(this.target) || this.idle >= 2.5) this.reset();
            return;
        }
        const target = this.hero.getBestTarget(enemies, this.hero.getEffectiveStats());
        if (!target || !this.isEligible(target)) { this.reset(); return; }
        if (target !== this.target) { this.reset(); this.target = target; return; }
        this.elapsed = Math.min(3, this.elapsed + dt);
    }

    damageMultiplier(target) {
        if (this.hero.id === 'mockingbird') return this.matches(target) && this.stacks === 1 ? 1.4 : 1;
        return this.hero.id === 'cable' && this.matches(target) && this.elapsed >= 3 ? 1.9 : 1;
    }

    attackEffects(target) {
        return this.hero.id === 'mockingbird' && this.matches(target) && this.stacks === 1 && this.shockCooldown <= 0
            ? [{ type: 'stun', duration: 0.35, power: 1, chance: 1 }] : [];
    }

    penetration(target = this.target) {
        if (this.hero.id !== 'nebula' || !this.matches(target) || !this.stacks) return 0;
        const category = String(target.category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return this.stacks * 0.1 + (category === 'tecnologico' ? 0.1 : 0);
    }

    onAttack(target) {
        if (this.hero.id === 'mockingbird') {
            const paired = this.matches(target) && this.stacks === 1;
            if (this.attackEffects(target).length) this.shockCooldown = 2;
            if (paired) this.hero.recordAbility();
            this.reset(); this.target = target; this.stacks = paired ? 0 : 1;
            return;
        }
        if (this.hero.id === 'cable') {
            if (this.damageMultiplier(target) > 1) { this.elapsed = 0; this.hero.recordAbility(); }
            return;
        }
        const stacks = this.matches(target) ? Math.min(5, this.stacks + 1) : 1;
        this.reset();
        this.target = target;
        this.stacks = stacks;
    }

    getDisplayState() {
        const valid = this.matches(this.target);
        if (this.hero.id === 'mockingbird') return {
            label: valid && this.stacks ? 'Segundo baston preparado' : 'Preparando doble baston',
            progress: valid ? this.stacks : 0, ready: valid && this.stacks === 1
        };
        if (this.hero.id === 'cable') return {
            label: valid && this.elapsed >= 3 ? 'Disparo temporal listo' : `Mira temporal ${valid ? this.elapsed.toFixed(1) : '0.0'}/3 s`,
            progress: valid ? this.elapsed / 3 : 0, ready: valid && this.elapsed >= 3
        };
        return { label: `Adaptacion: ${Math.round(this.penetration() * 100)}% penetracion`,
            progress: valid ? this.stacks / 5 : 0, ready: valid && this.stacks === 5 };
    }
}
