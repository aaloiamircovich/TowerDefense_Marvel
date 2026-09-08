import { buildEnemyIntel } from './EnemyIntelState.js';
import { formatHeroDetailMetric } from './HeroDetailViewModel.js';
import {
    evaluateHeroWaveFit,
    getHeroCost,
    getHeroDps,
    getHeroName,
    heroControlsCrowd,
    heroCoversCounter,
    heroDetectsStealth,
    heroPiercesArmor
} from './HeroTacticsState.js';

const COUNTER_COPY = {
    detection: {
        label: 'Deteccion',
        detail: 'revela sigilo y faseadores',
        icon: 'fa-eye',
        missing: 'Sin detector',
        bench: 'Detector disponible',
        ready: 'Detector listo'
    },
    piercing: {
        label: 'Perforacion',
        detail: 'rompe blindaje y barreras',
        icon: 'fa-bullseye',
        missing: 'Sin perforacion',
        bench: 'Perforacion disponible',
        ready: 'Perforacion lista'
    },
    control: {
        label: 'Control',
        detail: 'corta corredores antes de la base',
        icon: 'fa-hand-paper',
        missing: 'Sin control',
        bench: 'Control disponible',
        ready: 'Control activo'
    },
    reach: {
        label: 'Alcance',
        detail: 'cubre voladores y rutas largas',
        icon: 'fa-location-arrow',
        missing: 'Sin alcance',
        bench: 'Alcance disponible',
        ready: 'Alcance listo'
    },
    focus: {
        label: 'Foco',
        detail: 'elimina soporte e invocadores',
        icon: 'fa-crosshairs',
        missing: 'Sin foco claro',
        bench: 'Foco disponible',
        ready: 'Foco listo'
    },
    dps: {
        label: 'DPS',
        detail: 'sostiene jefes y elites',
        icon: 'fa-bolt',
        missing: 'DPS bajo',
        bench: 'DPS disponible',
        ready: 'DPS listo'
    }
};

export const TACTICAL_COUNTER_LEGEND = Object.entries(COUNTER_COPY)
    .map(([id, copy]) => ({ id, label: copy.label, detail: copy.detail, icon: copy.icon }));

function normalizeCounterText(value = '') {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function resolveCounterIdFromText(value = '') {
    const text = normalizeCounterText(value);
    if (/detec|sigilo|fase/.test(text)) return 'detection';
    if (/perfor|penetr|blind|barrera|armor/.test(text)) return 'piercing';
    if (/control|slow|stun|web|ralent|congel|aturd/.test(text)) return 'control';
    if (/alcance|rango|volador|aereo|cadena/.test(text)) return 'reach';
    if (/foco|soporte|invoc|aura|comand/.test(text)) return 'focus';
    return 'dps';
}

function getRequiredCounterIds(summary = null) {
    if (!summary) return [];
    const roles = new Set(summary.roles || []);
    const ids = [];
    const add = (id) => {
        if (!ids.includes(id)) ids.push(id);
    };

    if (summary.stealthCount > 0 || roles.has('stealth') || roles.has('phaser')) add('detection');
    if (summary.armoredCount > 0 || summary.barrierCount > 0 || roles.has('tank') || roles.has('shield')) add('piercing');
    if (roles.has('runner') || Number(summary.fastest || 0) >= 90) add('control');
    if (roles.has('flying')) add('reach');
    if (roles.has('support') || roles.has('summoner') || roles.has('commander')) add('focus');
    if (summary.hasBoss || Number(summary.maxThreat || 0) >= 5) add('dps');
    if (!ids.length && summary.counter) add('dps');
    return ids;
}

export function buildCounterCoverageModel(summary = null, activeTeam = [], deployedHeroes = []) {
    const required = getRequiredCounterIds(summary);
    if (!required.length) return null;

    const deployed = (deployedHeroes || []).filter(Boolean);
    const deployedIds = new Set(deployed.map((hero) => hero.id || hero.config?.id).filter(Boolean));
    const bench = (activeTeam || [])
        .filter((hero) => hero && !deployedIds.has(hero.id || hero.config?.id));

    const entries = required.map((id) => {
        const copy = COUNTER_COPY[id] || COUNTER_COPY.dps;
        const deployedMatches = deployed.filter((hero) => heroCoversCounter(hero, id));
        const benchMatches = bench.filter((hero) => heroCoversCounter(hero, id));
        const tone = deployedMatches.length ? 'ready' : benchMatches.length ? 'warning' : 'danger';
        const names = (deployedMatches.length ? deployedMatches : benchMatches)
            .slice(0, 2)
            .map(getHeroName)
            .join(' + ');
        const label = tone === 'ready' ? copy.ready : tone === 'warning' ? copy.bench : copy.missing;
        const detail = names || `El equipo actual no cubre ${copy.label.toLowerCase()}.`;

        return {
            id,
            icon: copy.icon,
            counter: copy.label,
            label,
            detail,
            tone,
            covered: tone === 'ready',
            available: tone !== 'danger'
        };
    });

    const covered = entries.filter((entry) => entry.covered).length;
    return {
        label: 'Cobertura tactica',
        covered,
        total: entries.length,
        ready: covered === entries.length,
        entries
    };
}

export function buildWaveCounterBrief(summary = null, counterCoverage = null) {
    if (!summary) return null;

    const label = summary.counter || 'Dano equilibrado';
    const counterId = resolveCounterIdFromText(label);
    const coverageEntry = counterCoverage?.entries?.find((entry) => entry.id === counterId) || null;
    const copy = COUNTER_COPY[counterId] || COUNTER_COPY.dps;
    const tone = coverageEntry?.tone || (counterCoverage?.ready ? 'ready' : 'neutral');
    const stateCopy = coverageEntry
        ? `${coverageEntry.label}: ${coverageEntry.detail}.`
        : copy.detail;
    let detail = stateCopy;

    if (summary.hasBoss || summary.bossMilestone) {
        detail = `${stateCopy} Si el boss cruza la base, pierdes.`;
    }

    return {
        id: counterId,
        label,
        detail,
        icon: coverageEntry?.icon || copy.icon,
        tone
    };
}

export function buildBossMilestoneState(uniqueEnemies = [], waveNumber = 1, summary = null) {
    const milestone = summary?.bossMilestone || null;
    const boss = (uniqueEnemies || []).find((enemy) => enemy?.isBoss) || null;
    if (!milestone && !boss && !summary?.hasBoss) return null;

    const wave = Math.max(1, Math.floor(Number(milestone?.wave || waveNumber) || 1));
    const isFinalBoss = Boolean(milestone?.isFinalBoss || boss?.isFinalBoss || wave >= 100);
    const mergedBoss = {
        ...(boss || {}),
        isBoss: true,
        isFinalBoss,
        name: milestone?.bossName || boss?.name || 'Jefe',
        hp: milestone?.hp ?? boss?.hp,
        armor: milestone?.armor ?? boss?.armor,
        speed: milestone?.speed ?? boss?.speed,
        reward: milestone?.reward ?? boss?.reward,
        threat: milestone?.threat ?? boss?.threat ?? 5
    };
    const intel = buildEnemyIntel(mergedBoss);
    const phaseCount = Number(milestone?.phaseCount ?? (Array.isArray(boss?.phases) ? boss.phases.length : 0));
    const armorPct = Math.round(Number(mergedBoss.armor || 0) * 100);
    const hp = Math.max(0, Math.round(Number(mergedBoss.hp || 0)));
    const speed = Math.max(0, Math.round(Number(mergedBoss.speed || 0)));
    const counters = [];
    const addCounter = (condition, label) => {
        if (condition && !counters.includes(label)) counters.push(label);
    };

    addCounter(true, 'DPS sostenido');
    addCounter(armorPct >= 20, 'Perforacion');
    addCounter(Boolean(mergedBoss.stealth), 'Deteccion');
    addCounter(Number(mergedBoss.statusResistance || 0) >= 0.25 || mergedBoss.immuneToStun || mergedBoss.immuneToSlow, 'Control dosificado');
    addCounter(phaseCount > 0, 'Leer fases');

    return {
        wave,
        tone: isFinalBoss ? 'final' : 'mini',
        title: milestone?.label || (isFinalBoss ? 'Final boss' : `Mini boss ${Math.max(1, Math.floor(wave / 25))}/3`),
        name: mergedBoss.name,
        portrait: mergedBoss.visual?.portrait || mergedBoss.sprite || '',
        warning: milestone?.warning || (isFinalBoss ? 'Si el final boss llega a la base, pierdes.' : 'Si el boss llega a la base, pierdes la run.'),
        counter: intel.counter,
        counterDetail: intel.counterDetail,
        counters: counters.slice(0, 5),
        stats: [
            { label: 'Vida', value: hp > 0 ? hp.toLocaleString('es-AR') : '?' },
            { label: 'Armadura', value: `${armorPct}%` },
            { label: 'Velocidad', value: speed || '?' },
            { label: 'Fases', value: phaseCount || 1 }
        ],
        reward: Math.max(0, Math.round(Number(mergedBoss.reward || 0))),
        traits: intel.traits,
        isFinalBoss
    };
}

export function buildStatusLegendModel(summary = null) {
    if (!summary) return null;
    const entries = getRequiredCounterIds(summary)
        .map((id) => TACTICAL_COUNTER_LEGEND.find((candidate) => candidate.id === id))
        .filter(Boolean);
    if (!entries.length) return null;

    return {
        label: 'Counters clave',
        entries: entries.slice(0, 4)
    };
}

export function buildStealthCoverageState(summary = null, activeTeam = [], deployedHeroes = [], credits = 0) {
    if (!waveNeedsDetection(summary)) return null;

    const threatLabel = getDetectionThreatLabel(summary);
    const deployed = (deployedHeroes || []).filter(Boolean);
    const deployedDetectors = deployed.filter(heroDetectsStealth);
    if (deployedDetectors.length) {
        const names = deployedDetectors.slice(0, 2).map(getHeroName).join(' + ');
        return {
            tone: 'ready',
            label: `${threatLabel} cubierto`,
            detail: `Detectores listos: ${names}.`,
            detectorCount: deployedDetectors.length
        };
    }

    const deployedIds = new Set(deployed.map((hero) => hero.id || hero.config?.id).filter(Boolean));
    const benchDetectors = (activeTeam || [])
        .filter((hero) => hero && !deployedIds.has(hero.id || hero.config?.id) && heroDetectsStealth(hero))
        .sort((a, b) => getHeroCost(a) - getHeroCost(b));

    if (benchDetectors.length) {
        const detector = benchDetectors[0];
        return {
            tone: 'warning',
            label: `${threatLabel} sin desplegar`,
            detail: `Coloca ${getHeroName(detector)} antes de iniciar.`,
            detectorCount: 0,
            heroId: detector.id || detector.config?.id || ''
        };
    }

    return {
        tone: 'danger',
        label: `${threatLabel} descubierto`,
        detail: `No hay detector disponible; ${threatLabel.toLowerCase()} puede cruzar.`,
        detectorCount: 0
    };
}

export function buildWavePreparationPlan(summary = null, activeTeam = [], deployedHeroes = [], credits = 0, levelCost = (level) => level * 120) {
    if (!summary) return [];

    const availableCredits = Number(credits || 0);
    const deployed = (deployedHeroes || []).filter(Boolean);
    const deployedIds = new Set(deployed.map((hero) => hero.id || hero.config?.id).filter(Boolean));
    const bench = (activeTeam || []).filter((hero) => hero && !deployedIds.has(hero.id || hero.config?.id));
    const plan = [];
    const used = new Set();
    const add = (entry) => {
        if (!entry) return;
        const key = `${entry.type}:${entry.heroId || entry.label}`;
        if (used.has(key)) return;
        used.add(key);
        plan.push(entry);
    };
    const urgency = new Set(['empty', 'underbuilt', 'thin']);
    const isUrgent = urgency.has(summary.readiness?.id)
        || ['high', 'critical'].includes(summary.threatTier?.id)
        || Number(summary.pressureScore || 0) >= 18;

    const pickDeploy = (predicate, reason) => {
        const candidate = bench
            .filter((hero) => predicate(hero))
            .map((hero) => ({ hero, fit: evaluateHeroWaveFit(hero, summary, availableCredits), cost: getHeroCost(hero) }))
            .sort((a, b) => b.fit.score - a.fit.score || a.cost - b.cost)[0];

        return candidate ? {
            type: 'deploy',
            heroId: candidate.hero.id || candidate.hero.config?.id,
            label: `Colocar ${getHeroName(candidate.hero)}`,
            reason,
            cost: 0,
            priority: candidate.fit.id,
            signature: `deploy:${candidate.hero.id || candidate.hero.config?.id}:free:${summary.pressureScore}`
        } : null;
    };

    if (waveNeedsDetection(summary) && !deployed.some(heroDetectsStealth)) {
        add(pickDeploy(heroDetectsStealth, 'Necesitas deteccion antes de que sigilo o fase crucen la ruta.'));
    }

    if ((summary.armoredCount > 0 || summary.barrierCount > 0 || summary.hasBoss) && !deployed.some((hero) => heroPiercesArmor(hero) || getHeroDps(hero) >= 42)) {
        add(pickDeploy((hero) => heroPiercesArmor(hero) || getHeroDps(hero) >= 42, 'Amenaza blindada: prioriza perforacion o DPS sostenido.'));
    }

    if ((summary.roles || []).includes('runner') || Number(summary.fastest || 0) >= 90) {
        add(pickDeploy(heroControlsCrowd, 'Oleada rapida: suma control para cortar corredores.'));
    }

    const upgrade = deployed
        .map((hero) => {
            const level = Number(hero.level || hero.config?.level || 1);
            const cost = Number(levelCost(level, 1));
            const fit = evaluateHeroWaveFit(hero, summary, availableCredits);
            return { hero, level, cost, fit, score: fit.score + getHeroDps(hero) / 12 + level };
        })
        .filter((candidate) => candidate.cost <= availableCredits)
        .sort((a, b) => b.score - a.score || a.cost - b.cost)[0];

    if (isUrgent && upgrade) {
        add({
            type: 'upgrade',
            heroId: upgrade.hero.id || upgrade.hero.config?.id,
            label: `Mejorar ${getHeroName(upgrade.hero)}`,
            reason: summary.threatTier?.id === 'critical' ? 'Sube tu mejor defensa antes de iniciar con riesgo.' : 'Convierte tu defensa central en respuesta principal.',
            cost: upgrade.cost,
            priority: upgrade.fit.id,
            signature: `upgrade:${upgrade.hero.id || upgrade.hero.config?.id}:${upgrade.level}:${upgrade.cost}:${summary.pressureScore}`
        });
    }

    if (!plan.length && isUrgent) {
        const fallback = bench
            .map((hero) => ({ hero, fit: evaluateHeroWaveFit(hero, summary, availableCredits), cost: getHeroCost(hero) }))
            .sort((a, b) => b.fit.score - a.fit.score || a.cost - b.cost)[0];
        add(fallback ? {
            type: 'deploy',
            heroId: fallback.hero.id || fallback.hero.config?.id,
            label: `Colocar ${getHeroName(fallback.hero)}`,
            reason: fallback.fit.reasons[0] || 'Aumenta cobertura antes de lanzar la oleada.',
            cost: 0,
            priority: fallback.fit.id,
            signature: `deploy:${fallback.hero.id || fallback.hero.config?.id}:free:${summary.pressureScore}`
        } : null);
    }

    if (!plan.length && !isUrgent) {
        add({
            type: 'hold',
            label: 'Mantener reserva',
            reason: summary.readiness?.advice || 'Puedes iniciar y guardar creditos para la siguiente amenaza.',
            cost: 0,
            priority: summary.readiness?.id || 'stable',
            signature: `hold:${summary.pressureScore}:${summary.readiness?.id || 'stable'}`
        });
    }

    if (!plan.length) {
        const upgradeCosts = deployed.map((hero) => Number(levelCost(Number(hero.level || hero.config?.level || 1), 1))).filter((cost) => cost > availableCredits);
        const nextCost = Math.min(...upgradeCosts);
        if (Number.isFinite(nextCost)) {
            add({
                type: 'save',
                label: `Faltan $${Math.ceil(nextCost - availableCredits)}`,
                reason: 'Reserva creditos para una mejora o counter antes de escalar.',
                cost: nextCost,
                priority: summary.readiness?.id || 'save',
                signature: `save:${nextCost}:${Math.floor(availableCredits)}:${summary.pressureScore}`
            });
        }
    }

    return plan.slice(0, 3);
}

function waveNeedsDetection(summary = null) {
    const roles = new Set(summary?.roles || []);
    return Number(summary?.stealthCount || 0) > 0 || roles.has('stealth') || roles.has('phaser');
}

function getDetectionThreatLabel(summary = null) {
    const roles = new Set(summary?.roles || []);
    const hasStealth = Number(summary?.stealthCount || 0) > 0 || roles.has('stealth');
    const hasPhaser = roles.has('phaser');
    if (hasStealth && hasPhaser) return 'Sigilo/fase';
    if (hasPhaser) return 'Fase';
    return 'Sigilo';
}

export function buildWaveDamageCheckMeter(check = {}) {
    const expected = Math.max(0, Number(check.expectedDamage || 0));
    const required = Math.max(0, Number(check.requiredDamage || 0));
    const ratio = required > 0 ? expected / required : expected > 0 ? 1 : 0;
    const ratioPct = Math.max(0, Math.round(ratio * 100));
    const fillPct = Math.max(0, Math.min(100, ratioPct));
    const gap = Math.round(expected - required);
    const gapTone = required <= 0 ? 'neutral' : gap >= 0 ? 'surplus' : 'deficit';
    const gapLabel = required <= 0
        ? 'Sin objetivo'
        : gap >= 0
            ? `Margen +${formatHeroDetailMetric(gap)}`
            : `Faltan ${formatHeroDetailMetric(Math.abs(gap))}`;
    return {
        ratio,
        ratioPct,
        fillPct,
        gap,
        gapTone,
        gapLabel,
        label: `${ratioPct}% cubierto`,
        ariaLabel: `Daño estimado ${ratioPct}% del total requerido. ${gapLabel}`
    };
}

export function buildWavePrepActionControl(item = {}) {
    const actionable = Boolean(item.heroId && ['deploy', 'upgrade'].includes(item.type));
    const verb = item.type === 'upgrade' ? 'Mejorar ahora' : 'Preparar colocacion';
    const ariaLabel = actionable ? `${verb}: ${item.label}` : item.label || 'Preparacion recomendada';
    const detail = actionable
        ? `${item.reason || ''}${item.cost ? ` | $${item.cost}` : ''}`.trim()
        : '';
    const tooltip = detail || ariaLabel;
    return {
        actionable,
        tag: actionable ? 'button' : 'div',
        ariaLabel,
        title: actionable ? tooltip : '',
        tooltip
    };
}

export function buildRosterWaveFitView(fit = null) {
    if (!fit || fit.id === 'neutral') return null;
    const reasons = (fit.reasons || []).filter(Boolean).slice(0, 2);
    const reasonText = reasons.length ? reasons.join(' + ') : 'respuesta flexible';
    const score = Math.max(0, Math.round(Number(fit.score || 0)));
    return {
        id: fit.id,
        label: fit.label || 'Buen ajuste',
        reasonText,
        scoreLabel: `${score} pts`,
        ariaLabel: `${fit.label || 'Buen ajuste'} contra esta oleada: ${reasonText}. Puntaje ${score}.`
    };
}
