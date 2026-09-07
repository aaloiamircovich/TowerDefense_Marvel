export function buildLeakIntel(events = [], fallbackLeaks = 0) {
    const cleanEvents = (events || [])
        .filter(Boolean)
        .map((event) => {
            const segment = Number.isFinite(Number(event.segmentPct)) ? Math.max(0, Math.min(100, Math.round(Number(event.segmentPct)))) : null;
            const lifeLoss = Math.max(0, Number(event.lifeLoss || 0));
            const counter = event.counter || 'Cubre la base';
            const name = event.name || 'Enemigo';
            const lossCopy = lifeLoss > 0 ? `-${lifeLoss} vida` : 'sin dano';
            return {
                name,
                counter,
                tone: lifeLoss >= 3 ? 'boss' : 'leak',
                detail: `${counter} | ${segment ?? 100}% ruta | ${lossCopy}`,
                traits: (event.traits || []).filter(Boolean).slice(0, 3)
            };
        });

    if (!cleanEvents.length && fallbackLeaks > 0) {
        cleanEvents.push({
            name: 'Daño a la base',
            counter: 'Cubre la base',
            tone: fallbackLeaks >= 3 ? 'boss' : 'leak',
            detail: `${fallbackLeaks} vida perdida; falta detalle de enemigo.`,
            traits: []
        });
    }

    return {
        label: cleanEvents.length ? 'Lectura de base' : 'Base intacta',
        items: cleanEvents.slice(0, 3),
        overflow: Math.max(0, cleanEvents.length - 3)
    };
}

export function buildTacticalContributionModel(tactical = {}) {
    const metrics = [
        { id: 'control', label: 'Control', value: Math.round(Number(tactical.controlSeconds || 0)), suffix: 's', icon: 'fa-hand-paper' },
        { id: 'armor', label: 'Rupturas', value: Math.round(Number(tactical.armorBreaks || 0)), suffix: '', icon: 'fa-shield-halved' },
        { id: 'marks', label: 'Marcas', value: Math.round(Number(tactical.marks || 0)), suffix: '', icon: 'fa-crosshairs' },
        { id: 'detect', label: 'Deteccion', value: Math.round(Number(tactical.detectionReveals || 0)), suffix: '', icon: 'fa-eye' }
    ].filter((metric) => metric.value > 0);

    const heroes = (tactical.heroes || [])
        .filter((hero) => Number(hero.tacticalScore || 0) > 0)
        .map((hero) => ({
            id: hero.id || '',
            name: hero.name || 'Heroe',
            score: Math.round(Number(hero.tacticalScore || 0)),
            detail: [
                hero.controlSeconds > 0 ? `${Math.round(hero.controlSeconds)}s control` : '',
                hero.armorBreaks > 0 ? `${Math.round(hero.armorBreaks)} ruptura` : '',
                hero.marks > 0 ? `${Math.round(hero.marks)} marca` : '',
                hero.detectionReveals > 0 ? `${Math.round(hero.detectionReveals)} deteccion` : ''
            ].filter(Boolean).join(' | ')
        }));

    return {
        active: metrics.length > 0 || heroes.length > 0,
        score: Math.round(Number(tactical.score || 0)),
        mvp: tactical.mvp || '',
        metrics,
        heroes
    };
}

export function buildWaveReportLesson(report = {}) {
    const leaks = Math.max(0, Number(report.leaks || 0));
    const kills = Math.max(0, Number(report.kills || 0));
    const damage = Math.max(0, Number(report.damage || 0));
    const bestHeroDamage = Math.max(0, Number(report.bestHeroDamage || 0));
    const bestShare = damage > 0 ? bestHeroDamage / damage : 0;

    if (leaks >= 3) {
        return {
            tone: 'breach',
            label: 'Prioridad: base',
            detail: 'Invierte en control o dano en el ultimo tramo antes de escalar.'
        };
    }
    if (leaks > 0) {
        return {
            tone: 'leak',
            label: 'Refuerzo final',
            detail: 'Una mejora en el ultimo tramo puede frenar enemigos antes de la base.'
        };
    }
    if (kills === 0 && damage === 0) {
        return {
            tone: 'warning',
            label: 'Falta despliegue',
            detail: 'Coloca dano antes de iniciar la siguiente oleada.'
        };
    }
    if (bestShare >= 0.65 && report.bestHero && report.bestHero !== 'Sin MVP') {
        return {
            tone: 'focus',
            label: `Dependes de ${report.bestHero}`,
            detail: 'Acompana al MVP con soporte, control o un segundo carry.'
        };
    }
    if (Number(report.mastery || 0) > 0) {
        return {
            tone: 'mastery',
            label: 'Maestria lista',
            detail: 'Revisa recompensas heroicas antes de cambiar de mapa.'
        };
    }
    return {
        tone: 'economy',
        label: 'Economia estable',
        detail: 'Puedes ahorrar para set, tienda o siguiente power spike.'
    };
}

export function buildWaveReportGrade(report = {}) {
    const leaks = Math.max(0, Number(report.leaks || 0));
    const kills = Math.max(0, Number(report.kills || 0));
    const damage = Math.max(0, Number(report.damage || 0));
    const credits = Math.max(0, Number(report.credits || 0));
    const mastery = Math.max(0, Number(report.mastery || 0));
    const bestHeroDamage = Math.max(0, Number(report.bestHeroDamage || 0));
    const bestShare = damage > 0 ? bestHeroDamage / damage : 0;
    const teamBonus = bestShare > 0 && bestShare < 0.6 && kills >= 6 ? 6 : 0;
    const score = Math.max(0, Math.min(100, Math.round(
        55
        + Math.min(18, kills * 1.2)
        + Math.min(18, damage / 120)
        + Math.min(10, credits / 55)
        + teamBonus
        + Math.min(6, mastery * 3)
        - leaks * 24
        - (leaks >= 3 ? 10 : 0)
    )));

    let medal = 'D';
    let tone = 'critical';
    let label = 'Zona critica';
    if (score >= 96) {
        medal = 'S';
        tone = 'elite';
        label = 'Control absoluto';
    } else if (score >= 86) {
        medal = 'A';
        tone = 'strong';
        label = 'Control superior';
    } else if (score >= 72) {
        medal = 'B';
        tone = 'stable';
        label = 'Defensa estable';
    } else if (score >= 55) {
        medal = 'C';
        tone = 'thin';
        label = 'Margen fino';
    }

    let detail = 'Sostuviste la ruta; prepara el proximo salto de amenaza.';
    if (leaks >= 3) detail = 'La base quedo expuesta; suma control final antes de acelerar.';
    else if (leaks > 0) detail = 'La base recibio dano menor; una mejora en el ultimo tramo puede sellar la defensa.';
    else if (kills === 0 && damage === 0) detail = 'No hubo lectura ofensiva; despliega dano antes de la siguiente oleada.';
    else if (medal === 'S') detail = 'Ejecucion dominante: buen momento para greed de economia.';
    else if (bestShare >= 0.65) detail = 'El MVP cargo demasiado peso; agrega soporte para evitar dependencia.';
    else if (teamBonus > 0) detail = 'Dano bien repartido: la composicion esta escalando como escuadron.';
    else if (credits >= 400) detail = 'Tienes margen economico para tienda, set o mejora clave.';

    return { score, medal, tone, label, detail };
}

export function buildWaveReportState(report = {}) {
    const leaks = Math.max(0, Number(report.leaks || 0));
    const kills = Math.max(0, Number(report.kills || 0));
    const damage = Math.max(0, Number(report.damage || 0));
    const credits = Math.max(0, Number(report.credits || 0));
    const mastery = Math.max(0, Number(report.mastery || 0));
    const bestHero = report.bestHero || 'Sin MVP';
    const pressure = report.pressure || 'stable';

    let tone = 'clean';
    let label = 'Oleada asegurada';
    let advice = 'Defensa estable: puedes ahorrar o acelerar la siguiente oleada.';

    if (leaks > 0) {
        tone = leaks >= 3 ? 'breach' : 'leak';
        label = leaks >= 3 ? 'Base en riesgo' : 'Daño contenido';
        advice = leaks >= 3
            ? 'Refuerza la base y prioriza control antes de iniciar.'
            : 'Sube una defensa en el ultimo tramo del camino.';
    } else if (kills === 0 && damage === 0) {
        tone = 'warning';
        label = 'Sin lectura ofensiva';
        advice = 'Despliega dano antes de lanzar la proxima oleada.';
    } else if (mastery > 0) {
        tone = 'mastery';
        label = 'Progreso heroico';
        advice = 'Revisa maestrias desbloqueadas para potenciar el equipo.';
    } else if (pressure === 'thin') {
        tone = 'warning';
        label = 'Defensa justa';
        advice = 'Gasta creditos en dano o control antes del siguiente salto.';
    }

    return {
        wave: Math.max(1, Number(report.wave || 1)),
        tone,
        label,
        advice,
        leaks,
        lives: Math.max(0, Number(report.lives || 0)),
        kills,
        damage: Math.round(damage),
        credits: Math.round(credits),
        bounty: Math.max(0, Number(report.bounty || 0)),
        metaReward: Math.max(0, Number(report.metaReward || 0)),
        mastery,
        bestHero,
        bestHeroId: report.bestHeroId || '',
        bestHeroKills: Math.max(0, Number(report.bestHeroKills || 0)),
        bestHeroDamage: Math.round(Math.max(0, Number(report.bestHeroDamage || 0))),
        lesson: buildWaveReportLesson(report),
        grade: buildWaveReportGrade(report),
        leakIntel: buildLeakIntel(report.leakEvents || [], leaks),
        tacticalContribution: buildTacticalContributionModel(report.tactical || {})
    };
}

export function buildWaveReportActionState(report = {}, heroes = [], credits = 0, levelCost = (level) => level * 120) {
    const heroId = report.bestHeroId;
    if (!heroId || report.bestHero === 'Sin MVP') return null;
    const hero = heroes.find((unit) => (unit.id || unit.config?.id) === heroId);
    if (!hero) return null;

    const level = Number(hero.level || hero.config?.level || 1);
    const cost = Number(levelCost(level, 1));
    const name = hero.name || hero.config?.name || report.bestHero || 'Heroe';
    const available = Number(credits || 0);

    if (cost > available) {
        return {
            type: 'saving',
            heroId,
            label: `Faltan $${Math.ceil(cost - available)}`,
            missing: Math.ceil(cost - available),
            available: Math.floor(available),
            cost,
            reason: report.leaks > 0
                ? 'Ahorra para reforzar al heroe que mas protegio la base.'
                : 'Guarda creditos para convertir al MVP en carry.',
            signature: `saving:${heroId}:${cost}:${Math.floor(available)}`
        };
    }

    return {
        type: 'upgrade',
        heroId,
        label: `Mejorar ${name}`,
        cost,
        available: Math.floor(available),
        remaining: Math.max(0, Math.floor(available - cost)),
        reason: report.leaks > 0
            ? 'Recomendado tras dano a base: potencia tu defensa mas efectiva.'
            : 'Aprovecha el rendimiento del MVP antes de escalar amenaza.',
        signature: `upgrade:${heroId}:${level}:${cost}:${Math.floor(available)}`
    };
}
