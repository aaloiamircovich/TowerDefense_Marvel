import { TypeChart } from '../../data/TypeChart.js';

export class CombatSystem {
    static applyImpact(projectile, target, attacker, resourceManager) {
        if (!target || !target.isAlive) return;

        const multiplier = TypeChart[projectile.attackerType]?.[target.category] || 1;
        const result = target.takeDamage(projectile.damage * multiplier);

        if (attacker?.items?.length) {
            CombatSystem.applyItemEffects(attacker, target, resourceManager, result.killed);
        }

        (projectile.effects || []).forEach((effect) => {
            if (Math.random() <= (effect.chance || 1)) {
                target.applyDebuff(effect.type, effect.duration, effect.power);
            }
        });

        if (result.killed && attacker) {
            attacker.killCount++;
            if (attacker.items.some((item) => item.id === 'protocolo_extremis') && attacker.killCount >= 15) {
                resourceManager?.addLife(1);
                attacker.killCount = 0;
            }
        }
    }

    static applyItemEffects(attacker, target, resourceManager) {
        attacker.items.forEach((item) => {
            if (item.flags?.includes('slow_on_armor') && target.armor > 0) {
                target.applyDebuff('slow', 1, 0.5);
            }

            if (item.id === 'contrato_stark') {
                resourceManager?.addCredits(1);
            }

            if (item.id === 'leftovers') {
                if (item.usedThisWave === undefined) item.usedThisWave = false;
                if (!item.usedThisWave && Math.random() <= 0.01) {
                    resourceManager?.addLife(1);
                    item.usedThisWave = true;
                }
            }
        });
    }
}
