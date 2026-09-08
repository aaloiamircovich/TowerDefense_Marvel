import { getLevelUnlockRequirement, isLevelUnlockedByStars } from '../utils/LevelProgression.js';

export function formatEndStateNumber(value = 0) {
    return Math.round(Number(value) || 0).toLocaleString('es-AR');
}

export function formatSavedCredits(value = 0) {
    return value === Number.POSITIVE_INFINITY ? '∞' : `$${formatEndStateNumber(value)}`;
}

export function buildNextMapStatus(levels = [], totalStars = 0) {
    const safeStars = Math.max(0, Math.round(Number(totalStars) || 0));
    const nextLockedIndex = levels.findIndex((_level, index) => !isLevelUnlockedByStars(index, safeStars));
    if (nextLockedIndex < 0) {
        return {
            title: 'Progreso conservado',
            detail: levels.length ? 'Todas las operaciones desbloqueadas.' : 'Campaña lista.',
            complete: true
        };
    }
    const requirement = getLevelUnlockRequirement(nextLockedIndex);
    const remaining = Math.max(0, requirement - safeStars);
    return {
        title: `Siguiente mapa: ${levels[nextLockedIndex]?.name || 'Operacion clasificada'}`,
        detail: `${formatEndStateNumber(remaining)} estrellas restantes (${formatEndStateNumber(safeStars)}/${formatEndStateNumber(requirement)}).`,
        complete: false
    };
}

export function buildProgressCarryoverModel({
    type = 'defeat',
    levels = [],
    totalStars = 0,
    credits = 0
} = {}) {
    const nextMap = buildNextMapStatus(levels, totalStars);
    const actionHint = type === 'victory'
        ? nextMap.complete
            ? 'Puedes repetir mapas, buscar estrellas o ajustar el equipo.'
            : 'Puedes seguir con el siguiente mapa.'
        : 'Solo vuelve a oleada 1; progreso y equipo quedan guardados.';
    return {
        ...nextMap,
        rows: [
            { icon: 'fa-star', label: 'Estrellas guardadas', value: formatEndStateNumber(totalStars), hint: nextMap.detail },
            { icon: 'fa-coins', label: 'Creditos disponibles', value: formatSavedCredits(credits), hint: 'Se conservan entre intentos.' },
            { icon: 'fa-user-shield', label: 'Equipo', value: 'Niveles y objetos guardados', hint: actionHint }
        ]
    };
}

export function buildMissionSummaryModel(summary = null) {
    if (!summary) return null;
    const totals = summary.totals || {};
    const tactical = summary.tactical || {};
    const tacticalScore = Math.round(Number(tactical.score ?? tactical.tacticalScore ?? 0) || 0);
    const tacticalStats = [
        { label: 'Control', value: Math.round(Number(tactical.controlSeconds || 0)), suffix: 's' },
        { label: 'Rupturas', value: Math.round(Number(tactical.armorBreaks || 0)), suffix: '' },
        { label: 'Marcas', value: Math.round(Number(tactical.marks || 0)), suffix: '' },
        { label: 'Deteccion', value: Math.round(Number(tactical.detectionReveals || 0)), suffix: '' }
    ].filter((entry) => entry.value > 0);
    const hasTactical = tacticalScore > 0 || Boolean(tactical.mvp) || tacticalStats.length > 0;
    const tacticalHighlights = [
        tactical.mvp ? `MVP táctico: ${tactical.mvp}` : '',
        ...tacticalStats.slice(0, 3).map((entry) => `${entry.label} ${formatEndStateNumber(entry.value)}${entry.suffix}`)
    ].filter(Boolean);
    const rows = [
        { label: 'Daño', value: formatEndStateNumber(totals.damage), icon: 'fa-bolt' },
        { label: 'Bajas', value: formatEndStateNumber(totals.kills), icon: 'fa-skull' },
        hasTactical
            ? { label: 'Táctico', value: formatEndStateNumber(tacticalScore), icon: 'fa-satellite-dish' }
            : { label: 'Habilidades', value: formatEndStateNumber(totals.abilities), icon: 'fa-star' },
        { label: 'Créditos', value: `$${formatEndStateNumber(totals.credits)}`, icon: 'fa-coins' }
    ];

    return {
        rows,
        title: 'Informe de mision',
        subtitle: `Destacado: ${summary.bestHero || 'Equipo'} | ${formatEndStateNumber(summary.lives)} vidas restantes`,
        tacticalDetail: tacticalHighlights.join(' | ')
    };
}

export function buildOutcomeCoachModel(type = 'defeat', context = {}) {
    const isVictory = type === 'victory';
    const summary = context.summary;
    return {
        tone: isVictory ? 'victory' : 'defeat',
        title: isVictory ? 'Siguiente objetivo' : 'Plan de recuperacion',
        cards: isVictory
            ? [
                { icon: 'fa-star', label: 'Objetivo', value: 'Buscar mas estrellas' },
                { icon: 'fa-list-check', label: 'Desafios', value: 'Completar misiones pendientes' },
                { icon: 'fa-box-open', label: 'Progreso', value: 'Invertir creditos en arsenal' }
            ]
            : [
                { icon: 'fa-signal', label: 'Corte', value: `Oleada ${formatEndStateNumber(context.wave || 1)}` },
                { icon: 'fa-arrow-up-right-dots', label: 'Prioridad', value: summary?.bestHero ? `Mejorar ${summary.bestHero}` : 'Reforzar el equipo' },
                { icon: 'fa-satellite-dish', label: 'Lectura', value: context.modeSnapshot ? 'Revisar modo especial' : 'Abrir radar antes de salir' }
            ]
    };
}
