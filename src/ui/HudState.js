import { CAMPAIGN_MAX_WAVES, MINI_BOSS_WAVE_INTERVAL } from '../utils/LevelProgression.js';

export function buildWaveLaunchState(enabled, summary = null) {
    if (!enabled) {
        return {
            tier: 'active',
            primary: 'OLEADA EN CURSO',
            secondary: 'Defensa activa',
            ariaLabel: 'Oleada en curso',
            tooltip: 'La oleada actual sigue activa'
        };
    }

    const tier = summary?.threatTier?.id || 'low';
    const tierLabel = summary?.threatTier?.label || 'Amenaza baja';
    const score = summary?.pressureScore ?? 0;
    const bossMilestone = summary?.bossMilestone || null;
    const primary = bossMilestone?.isFinalBoss
        ? 'ENFRENTAR FINAL BOSS'
        : bossMilestone
            ? 'ENFRENTAR BOSS'
            : tier === 'critical'
        ? 'INICIAR CON RIESGO'
        : tier === 'high'
            ? 'INICIAR ALERTA'
            : 'INICIAR OLEADA';
    const bossCopy = bossMilestone ? `${bossMilestone.label || 'Boss'} · ` : '';
    const bossWarning = bossMilestone?.warning ? ` ${bossMilestone.warning}` : '';

    return {
        tier,
        primary,
        secondary: `${bossCopy}${tierLabel} · ${score}`,
        ariaLabel: `${primary}. ${bossCopy}${tierLabel}. Puntaje ${score}.${bossWarning}`,
        tooltip: bossMilestone?.warning || summary?.threatTier?.advice || 'Iniciar siguiente oleada'
    };
}

export function buildBossCountdownState(wave = 1, maxWaves = CAMPAIGN_MAX_WAVES, interval = MINI_BOSS_WAVE_INTERVAL) {
    const safeWave = Math.max(1, Math.floor(Number(wave) || 1));
    const safeInterval = Math.max(1, Math.floor(Number(interval) || MINI_BOSS_WAVE_INTERVAL));
    const safeMaxWaves = Math.max(safeInterval, Math.floor(Number(maxWaves) || CAMPAIGN_MAX_WAVES));
    const milestones = [];
    for (let milestone = safeInterval; milestone < safeMaxWaves; milestone += safeInterval) {
        milestones.push({ wave: milestone, final: false });
    }
    milestones.push({ wave: safeMaxWaves, final: true });

    const next = milestones.find((milestone) => milestone.wave >= safeWave) || milestones[milestones.length - 1];
    const remaining = Math.max(0, next.wave - safeWave);
    const bossType = next.final ? 'Jefe final' : 'Mini boss';
    const label = next.final ? 'Final' : 'Boss';
    const detail = remaining === 0 ? 'Ahora' : `${remaining} oleadas`;
    const tone = next.final ? 'final' : remaining <= 5 ? 'soon' : 'normal';
    return {
        wave: next.wave,
        remaining,
        label,
        detail,
        tone,
        ariaLabel: remaining === 0
            ? `${bossType} en esta oleada.`
            : `${bossType} en ${remaining} oleadas, oleada ${next.wave}.`
    };
}

export function formatHudResource(value = 0) {
    if (value === Number.POSITIVE_INFINITY) return '∞';
    const amount = Math.max(0, Number(value) || 0);
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`;
    if (amount >= 10000) return `${(amount / 1000).toFixed(amount >= 100000 ? 0 : 1).replace(/\.0$/, '')}k`;
    return `${Math.floor(amount)}`;
}
