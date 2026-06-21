import { TypeChart } from '../../data/TypeChart.js';

export class CombatSystem {
    static applyImpact(projectile, target, attacker, resourceManager) {
        if (!target?.isAlive) return { damage: 0, killed: false, hits: 0 };

        const primary = CombatSystem.applyDamage(projectile, target, attacker, resourceManager, 1);
        let hits = 1;

        if (attacker?.items?.length) {
            CombatSystem.applyItemEffects(attacker, target, resourceManager);
        }

        if (target.isAlive) {
            CombatSystem.applyEffects(projectile.effects, target, attacker);
        }

        const enemies = attacker?.game?.enemies || [];
        if (projectile.splashRadius > 0) {
            attacker?.game?.vfx?.addBurst(target.x, target.y, {
                color: projectile.color,
                radius: projectile.splashRadius,
                duration: 0.32
            });
            enemies
                .filter((enemy) => enemy !== target && enemy.isAlive && CombatSystem.distance(enemy, target) <= projectile.splashRadius)
                .forEach((enemy) => {
                    CombatSystem.applyDamage(projectile, enemy, attacker, resourceManager, projectile.splashFactor);
                    hits++;
                });
        }

        if (projectile.chainCount > 0) {
            let current = target;
            const visited = new Set([target]);
            for (let jump = 0; jump < projectile.chainCount; jump++) {
                const next = enemies
                    .filter((enemy) => enemy.isAlive && !visited.has(enemy) && CombatSystem.distance(enemy, current) <= projectile.chainRange)
                    .sort((a, b) => CombatSystem.distance(a, current) - CombatSystem.distance(b, current))[0];
                if (!next) break;
                CombatSystem.applyDamage(projectile, next, attacker, resourceManager, projectile.chainFactor ** (jump + 1));
                attacker?.game?.vfx?.addBeam(current, next, {
                    color: projectile.color,
                    width: 3,
                    duration: 0.16
                });
                visited.add(next);
                current = next;
                hits++;
            }
        }

        return { ...primary, hits };
    }

    static applyDamage(projectile, target, attacker, resourceManager, factor) {
        if (!target?.isAlive) return { damage: 0, killed: false };

        const typeMultiplier = TypeChart[projectile.attackerType]?.[target.category] || 1;
        const markMultiplier = target.getDamageTakenMultiplier?.() || 1;
        const result = target.takeDamage(projectile.damage * factor * typeMultiplier * markMultiplier, {
            armorPenetration: projectile.armorPenetration || 0,
            attackerType: projectile.attackerType
        });

        attacker?.recordDamage?.(result.damage);
        if (result.killed) CombatSystem.creditKill(target, attacker, resourceManager);
        return result;
    }

    static applyEffects(effects = [], target, attacker) {
        effects.forEach((effect) => {
            if (CombatSystem.random(attacker) > (effect.chance ?? 1)) return;

            if (target.applyStatus) {
                target.applyStatus(effect, attacker);
            } else {
                target.applyDebuff?.(effect.type, effect.duration, effect.power);
            }
        });
    }

    static creditKill(target, attacker, resourceManager) {
        if (!attacker || target.killCredited) return;
        target.killCredited = true;

        if (attacker.recordKill) {
            attacker.recordKill(resourceManager);
            return;
        }

        attacker.killCount = (attacker.killCount || 0) + 1;
        if (attacker.items?.some((item) => item.id === 'protocolo_extremis') && attacker.killCount >= 15) {
            resourceManager?.addLife(1);
            attacker.killCount = 0;
        }
    }

    static applyItemEffects(attacker, target, resourceManager) {
        attacker.items.forEach((item) => {
            if (item.flags?.includes('slow_on_armor') && target.armor > 0) {
                target.applyStatus?.({ type: 'slow', duration: 1, power: 0.5 }, attacker)
                    ?? target.applyDebuff?.('slow', 1, 0.5);
            }

            if (item.id === 'contrato_stark') {
                resourceManager?.addCredits(1);
                attacker.recordGold?.(1);
            }

            if (item.id === 'leftovers') {
                if (item.usedThisWave === undefined) item.usedThisWave = false;
                if (!item.usedThisWave && CombatSystem.random(attacker) <= 0.01) {
                    resourceManager?.addLife(1);
                    item.usedThisWave = true;
                }
            }
        });
    }

    static random(attacker) {
        return attacker?.game?.random?.next?.() ?? Math.random();
    }

    static distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }
}
