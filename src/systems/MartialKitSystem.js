import { CombatSystem } from './CombatSystem.js';
import { isPointInRangePattern } from '../utils/RangePattern.js';
import { TERRAIN } from '../utils/TerrainRules.js';

const RECOVERY = { valkyrie: 5, rogue: 6, beast: 3 };

export class MartialKitSystem {
    constructor(hero) { this.hero = hero; this.reset(); }

    reset() {
        this.x = this.hero.x;
        this.y = this.hero.y;
        this.cooldown = RECOVERY[this.hero.id];
        this.trait = null;
        this.remaining = 0;
        this.pair = null;
        this.charge = 0;
        this.idle = 0;
    }

    stationary() {
        return this.hero.x === this.x && this.hero.y === this.y && !(this.hero.stunTimer > 0)
            && this.hero.game.heroes?.includes(this.hero);
    }

    onHighGround() {
        const { gridSize, terrainMap } = this.hero.game;
        return gridSize > 0 && terrainMap?.[Math.floor(this.hero.y / gridSize)]?.[Math.floor(this.hero.x / gridSize)] === TERRAIN.mountain;
    }

    covered(target, stats = this.hero.getEffectiveStats()) {
        return target?.isAlive && !target.hasReachedEnd && (!target.stealth || stats.canSeeStealth)
            && isPointInRangePattern(this.hero, target, stats.range, this.hero.rangePattern, stats.rangeGeometryScale);
    }

    update(dt) {
        if (!this.stationary()) { this.reset(); return; }
        this.remaining = Math.max(0, this.remaining - dt);
        this.idle += dt;
        if (this.remaining === 0) this.trait = null;
        if (this.hero.id === 'valkyrie' && !this.onHighGround()) this.cooldown = 5;
        else this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.pair && (this.idle >= 2.5 || !this.pair.every(enemy => this.covered(enemy)) || distance(...this.pair) > 80)) {
            this.pair = null; this.charge = 0;
        }
    }

    damageMultiplier(target) {
        return this.hero.id === 'valkyrie' && this.stationary() && this.onHighGround()
            && this.cooldown === 0 && this.covered(target) ? 1.75 : 1;
    }

    applyStats(stats) {
        if (!this.stationary() || this.remaining <= 0) return;
        if (this.trait === 'runner') stats.fireRate *= 1.15;
        if (this.trait === 'flying') stats.range *= 1.15;
    }

    getProjectileProfile() {
        return this.stationary() && this.remaining > 0 && this.trait === 'armor' ? { armorPenetration: 0.2 } : {};
    }

    onAttack(target, stats) {
        if (!this.stationary() || !this.covered(target, stats)) return;
        if (this.hero.id === 'valkyrie' && this.damageMultiplier(target) > 1) {
            this.cooldown = 5;
            // Visual charge only: the occupied tile and legal placement never change.
            this.hero.game.vfx?.addBeam(this.hero, target, { color: '#facc15', width: 6, duration: 0.25 });
            this.hero.recordAbility();
        }
        if (this.hero.id === 'rogue' && this.cooldown === 0) {
            if (target.isBoss || target.isMiniBoss || target.isFinalBoss || target.config?.isBoss
                || target.config?.isMiniBoss || target.config?.isFinalBoss) return;
            const trait = target.armor > 0 ? 'armor' : target.archetype === 'runner' ? 'runner' : target.flying ? 'flying' : null;
            if (!trait) return;
            this.trait = trait; this.remaining = 3; this.cooldown = 6;
            this.hero.recordAbility();
        }
        if (this.hero.id === 'beast') this.acrobatics(target, stats);
    }

    acrobatics(target, stats) {
        this.idle = 0;
        const other = (this.hero.game.enemies || []).filter(enemy => enemy !== target && this.covered(enemy, stats)
            && distance(enemy, target) <= 80).sort((a, b) => distance(a, target) - distance(b, target))[0];
        if (!other) { this.pair = null; this.charge = 0; return; }
        const samePair = this.pair?.includes(target) && this.pair.includes(other);
        const prepared = samePair && this.charge === 2 && this.cooldown === 0;
        this.pair = [target, other];
        if (!prepared) { this.charge = samePair ? Math.min(2, this.charge + 1) : 1; return; }
        this.charge = 0; this.cooldown = 3;
        CombatSystem.applyDamage({ damage: stats.damage * 0.65, attackerType: this.hero.category }, other,
            this.hero, this.hero.game.resourceManager, 1);
        if (other.isAlive) other.applyStatus?.({ type: 'slow', power: 0.35, duration: 1.5 }, this.hero);
        this.hero.game.vfx?.addBeam(target, other, { color: '#60a5fa', width: 4, duration: 0.25 });
        this.hero.recordAbility();
    }

    getDisplayState() {
        if (this.hero.id === 'beast') return { label: `Acrobacia ${this.charge}/2 | ${this.cooldown.toFixed(1)}s`,
            progress: this.charge / 2, ready: this.charge === 2 && this.cooldown === 0 && this.stationary() };
        const labels = { armor: 'Perforacion +20%', runner: 'Cadencia +15%', flying: 'Alcance +15%' };
        const active = this.stationary() && this.remaining > 0 && this.trait;
        const label = this.hero.id === 'valkyrie' ? (this.onHighGround() ? 'Carga de altura' : 'Requiere montana/techo')
            : active ? `${labels[this.trait]} ${this.remaining.toFixed(1)}s` : 'Absorcion';
        return { label: `${label} | ${this.cooldown.toFixed(1)}s`, progress: 1 - this.cooldown / RECOVERY[this.hero.id],
            ready: this.cooldown === 0 && this.stationary() && (this.hero.id !== 'valkyrie' || this.onHighGround()) };
    }
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
