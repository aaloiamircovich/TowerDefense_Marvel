import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Hero } from '../src/entities/Hero.js';
import { Enemy } from '../src/entities/Enemy.js';
import { getEffectiveSupportAura } from '../src/systems/SupportAuraSystem.js';

const heroes = JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8'));
export const SUPPORT_STACKING_SCENARIOS = [
    { name: 'Seis atacantes', supports: [] },
    { name: 'Dos auras de dano', supports: ['capitan_america', 'black_panther'] },
    { name: 'Tres auras de cadencia', supports: ['nick_fury', 'wasp', 'profesor_x'] },
    { name: 'Tres auras de alcance', supports: ['invisible_woman', 'mister_fantastic', 'wong'] },
    { name: 'Cinco soportes y un atacante', supports: ['capitan_america', 'black_panther', 'nick_fury', 'wasp', 'profesor_x'] },
    { name: 'Hill con dano y cadencia', supports: ['capitan_america', 'black_panther', 'maria_hill', 'nick_fury', 'wasp'] }
];

// Frozen baseline from before additive stacking, only for this comparison's instances.
function applyLegacyAuras(stats, origin = this) {
    for (const source of this.game.heroes) {
        if (source === this || source.stunTimer > 0) continue;
        const aura = getEffectiveSupportAura(source, { recipient: this });
        if (!aura?.type || Math.hypot(source.x - origin.x, source.y - origin.y) > aura.range) continue;
        if (aura.type === 'damage' && !aura.targetCondition) stats.damage *= 1 + aura.power;
        if (aura.type === 'fireRate') stats.fireRate *= 1 + aura.power;
        if (aura.type === 'range') stats.range *= 1 + aura.power;
        if (aura.detectStealth) stats.canSeeStealth = true;
    }
}

export function simulateSupportStacking(supportIds, { level = 100, legacy = false, seconds = 60 } = {}) {
    if (supportIds.length > 5 || new Set(supportIds).size !== supportIds.length
        || supportIds.some((id) => !heroes[id]?.special?.supportAura)) throw new Error('Expected up to five distinct supports');
    const game = {
        heroes: [], enemies: [], projectiles: [], random: { next: () => 0.99 },
        resourceManager: { lives: 20, credits: 0, addCredits(n) { this.credits += n; } }
    };
    const supports = supportIds.map((id) => new Hero({ ...heroes[id], level }, 0, 0, game));
    const attackers = Array.from({ length: 6 - supports.length }, (_, i) => new Hero({
        id: `probe_${i}`, damage: 100, fireRate: 1, range: 200, critChance: 0.01
    }, 50, 0, game));
    game.heroes = [...supports, ...attackers];
    if (legacy) for (const hero of game.heroes) hero.applySupportAuras = applyLegacyAuras;
    const enemy = new Enemy({ id: 'probe', hp: 1e9, speed: 1, reward: 100 }, [{ x: 100, y: 0 }, { x: 3000, y: 0 }], game);
    enemy.applyStatus({ type: 'mark', duration: seconds + 1, power: 0.2 });
    game.enemies = [enemy];
    let peakRange = 0;
    let peakCadence = 0;
    const dt = 0.05;
    for (let step = 0; step < Math.round(seconds / dt); step++) {
        enemy.updateDebuffs(dt);
        for (const hero of game.heroes) hero.update(dt, game.enemies, game.projectiles);
        for (const shot of game.projectiles) {
            shot.x = shot.target.x;
            shot.y = shot.target.y;
            shot.update(0);
        }
        game.projectiles = [];
        const stats = attackers[0].getEffectiveStats();
        peakRange = Math.max(peakRange, stats.range);
        peakCadence = Math.max(peakCadence, stats.fireRate);
    }
    return {
        damage: attackers.reduce((n, h) => n + h.combatStats.damageDealt, 0),
        shots: attackers.reduce((n, h) => n + h.combatStats.shots, 0),
        supportShots: supports.reduce((n, h) => n + h.combatStats.shots, 0),
        peakRange, peakCadence, lives: game.resourceManager.lives, credits: game.resourceManager.credits
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    console.log('6 plazas, 60 s, soportes nivel 100, atacantes normalizados 100 dano/1 ataque por segundo.');
    console.log('Blanco estacionario marcado, cobertura completa, impactos inmediatos, sin objetos/evolucion.');
    console.log('Compara la politica, no presupuestos de campana ni equipos optimos.');
    for (const scenario of SUPPORT_STACKING_SCENARIOS) {
        const before = simulateSupportStacking(scenario.supports, { legacy: true });
        const after = simulateSupportStacking(scenario.supports);
        console.log(JSON.stringify({ scenario: scenario.name, before, after, damageRatio: after.damage / before.damage }));
    }
}
