import { CampaignPanel } from '../ui/CampaignPanel.js';
import { ProfilePanel } from '../ui/ProfilePanel.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import { TooltipController } from '../ui/TooltipController.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { TeamBuilderPanel } from '../ui/TeamBuilderPanel.js';
import { ModePanel } from '../ui/ModePanel.js';
import { SET_BONUSES, SLOT_LABELS } from './ItemEffectSystem.js';
import { getHeroBoxCost } from './ShopSystem.js';
import { getAllowedTerrainLabels } from '../utils/TerrainRules.js';
import { getRarityClass, normalizeRarity } from '../utils/Rarity.js';
import { HERO_MAX_LEVEL, calculateHeroLevelCost, getHeroDamageAtLevel, getHeroLevelUpgradeSteps, getScaledSupportAura, normalizeHeroLevel } from '../utils/HeroLevel.js';

const ASSET_VERSION = 'battle-sprites-20260713';

function versionAssetSource(source) {
    if (!source?.startsWith?.('assets/images/')) return source;
    return `${source}${source.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;
}

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
    const perfectBonus = Math.max(0, Number(summary?.perfectBonus || 0));
    const bonusCopy = perfectBonus > 0 ? ` | Perfecta +$${perfectBonus}` : '';
    const primary = tier === 'critical'
        ? 'INICIAR CON RIESGO'
        : tier === 'high'
            ? 'INICIAR ALERTA'
            : 'INICIAR OLEADA';

    return {
        tier,
        primary,
        secondary: `${tierLabel} · ${score}`,
        ariaLabel: `${primary}. ${tierLabel}. Puntaje ${score}.`,
        tooltip: summary?.threatTier?.advice || 'Iniciar siguiente oleada',
        secondary: perfectBonus > 0 ? `${tierLabel} | ${score}${bonusCopy}` : `${tierLabel} \u00B7 ${score}`,
        ariaLabel: `${primary}. ${tierLabel}. Puntaje ${score}.${perfectBonus > 0 ? ` Bonus perfecto ${perfectBonus}.` : ''}`
    };
}

const PIERCING_HERO_IDS = new Set(['iron_man', 'vision', 'hawkeye', 'winter_soldier', 'cyclops', 'silver_surfer']);
export const TARGETING_PRIORITIES = ['Primero', 'Último', 'Fuerte', 'Débil', 'Rápido', 'Sigilo', 'Jefe'];

const TARGETING_PRIORITY_COPY = {
    Primero: { label: '1ro', icon: 'fa-route', description: 'prioriza al enemigo mas avanzado' },
    Último: { label: 'Ult', icon: 'fa-backward', description: 'limpia rezagados e invocaciones' },
    Fuerte: { label: 'Fte', icon: 'fa-shield-alt', description: 'enfoca tanques y elites' },
    Débil: { label: 'Deb', icon: 'fa-bolt', description: 'remata objetivos bajos' },
    Rápido: { label: 'Rap', icon: 'fa-running', description: 'corta corredores' },
    Sigilo: { label: 'Sig', icon: 'fa-eye', description: 'busca infiltrados detectables' },
    Jefe: { label: 'Jfe', icon: 'fa-skull', description: 'prioriza jefes y amenaza alta' }
};

const ENEMY_ROLE_COPY = {
    runner: 'Corredor',
    tank: 'Tanque',
    shield: 'Escudo',
    stealth: 'Sigilo',
    flying: 'Volador',
    summoner: 'Invocador',
    support: 'Soporte',
    commander: 'Comandante',
    phaser: 'Faseador',
    boss: 'Jefe',
    soldier: 'Soldado'
};

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function buildEnemyIntel(enemy = {}) {
    const threat = Math.max(1, Math.min(5, Math.round(Number(enemy.threat || 1))));
    const roleLabel = ENEMY_ROLE_COPY[enemy.archetype] || (enemy.isBoss ? 'Jefe' : 'Soldado');
    const traits = [];
    const addTrait = (condition, label) => {
        if (condition && !traits.includes(label)) traits.push(label);
    };

    addTrait(enemy.isFinalBoss, 'Jefe final');
    addTrait(enemy.isBoss, 'Jefe');
    addTrait(Boolean(enemy.affix?.label), enemy.affix?.label);
    addTrait(enemy.stealth || enemy.archetype === 'stealth', 'Sigilo');
    addTrait(enemy.barrierRatio > 0, 'Barrera');
    addTrait((enemy.armor || 0) >= 0.25 || enemy.archetype === 'tank' || enemy.archetype === 'shield', 'Blindaje');
    addTrait((enemy.statusResistance || 0) >= 0.25, 'Resiste control');
    addTrait(enemy.archetype === 'support' || enemy.healPower > 0, 'Cura');
    addTrait(enemy.archetype === 'summoner' || enemy.summonId, 'Invoca');
    addTrait(enemy.archetype === 'commander' || enemy.auraPower, 'Aura');
    addTrait(enemy.archetype === 'phaser', 'Fasea');
    addTrait(enemy.archetype === 'flying' || enemy.flying, 'Aereo');
    addTrait(enemy.archetype === 'runner' || Number(enemy.speed || 0) >= 85, 'Rapido');

    let counter = 'Dano estable';
    if (enemy.isBoss) counter = 'DPS sostenido';
    else if (enemy.stealth || enemy.archetype === 'stealth' || enemy.archetype === 'phaser') counter = 'Deteccion';
    else if (enemy.archetype === 'support' || enemy.healPower > 0) counter = 'Foco al soporte';
    else if (enemy.archetype === 'summoner' || enemy.summonId) counter = 'Corta invocador';
    else if (enemy.archetype === 'commander' || enemy.auraPower) counter = 'Elimina aura';
    else if ((enemy.armor || 0) >= 0.25 || enemy.barrierRatio > 0 || ['tank', 'shield'].includes(enemy.archetype)) counter = 'Perforacion';
    else if (enemy.archetype === 'runner' || Number(enemy.speed || 0) >= 85) counter = 'Control';
    else if (enemy.archetype === 'flying' || enemy.flying) counter = 'Alcance';

    const danger = enemy.isBoss || threat >= 5 ? 'critical' : threat >= 4 ? 'high' : threat >= 3 ? 'guarded' : 'low';
    return {
        name: enemy.name || 'Enemigo',
        initial: (enemy.name || '?').charAt(0).toUpperCase(),
        roleLabel,
        traits: traits.slice(0, 4),
        counter,
        danger,
        threat,
        pips: '!'.repeat(threat)
    };
}

export function getNextTargetingPriority(current = 'Primero', direction = 1) {
    const index = TARGETING_PRIORITIES.indexOf(current);
    const safeIndex = index >= 0 ? index : 0;
    const offset = Number(direction || 1);
    const nextIndex = (safeIndex + offset + TARGETING_PRIORITIES.length) % TARGETING_PRIORITIES.length;
    return TARGETING_PRIORITIES[nextIndex];
}

export function buildTargetingControlState(current = 'Primero') {
    const priority = TARGETING_PRIORITIES.includes(current) ? current : 'Primero';
    const next = getNextTargetingPriority(priority);
    const copy = TARGETING_PRIORITY_COPY[priority];
    return {
        priority,
        next,
        label: copy.label,
        icon: copy.icon,
        description: copy.description,
        tooltip: `Objetivo: ${priority}; ${copy.description}. Click: ${next}.`,
        ariaLabel: `Cambiar prioridad de objetivo de ${priority} a ${next}`
    };
}

function hasTextMatch(config, patterns) {
    const text = [
        config.niche,
        config.ability,
        config.abilityDesc,
        ...(config.tags || [])
    ].filter(Boolean).join(' ').toLowerCase();
    return patterns.some((pattern) => text.includes(pattern));
}

export function evaluateHeroWaveFit(hero, summary = null, credits = 0) {
    const config = hero?.config || hero || {};
    if (!summary || !config.id) {
        return { id: 'neutral', label: 'Sin lectura', score: 0, reasons: [] };
    }

    const metrics = config.teamMetrics || {};
    const roles = new Set(summary.roles || []);
    const reasons = [];
    let score = 0;
    const damage = Number(config.damage || 0);
    const fireRate = Number(config.fireRate || 1);
    const range = Number(config.range || 0);
    const dps = damage * fireRate;

    const detectsStealth = Boolean(config.canSeeStealth)
        || Number(metrics.detection || 0) >= 4
        || hasTextMatch(config, ['sigilo', 'deteccion', 'rastreo', 'edith']);
    const piercesArmor = PIERCING_HERO_IDS.has(config.id)
        || hasTextMatch(config, ['armadura', 'perfor', 'atraviesa', 'antiarmadura', 'laser']);
    const controlsCrowd = Number(metrics.control || 0) >= 4
        || hasTextMatch(config, ['ralent', 'inmovil', 'aturd', 'control', 'red']);
    const hasReach = range >= 150;
    if ((summary.stealthCount > 0 || roles.has('stealth') || roles.has('phaser')) && detectsStealth) {
        score += 5;
        reasons.push('detecta sigilo');
    }

    if ((summary.armoredCount > 0 || summary.barrierCount > 0 || roles.has('tank') || roles.has('shield')) && piercesArmor) {
        score += 4;
        reasons.push('rompe armadura');
    }

    if ((roles.has('runner') || Number(summary.fastest || 0) >= 95) && controlsCrowd) {
        score += 4;
        reasons.push('frena corredores');
    }

    if ((roles.has('flying') || Number(summary.fastest || 0) >= 110) && hasReach) {
        score += 2;
        reasons.push('cubre distancia');
    }

    if (summary.hasBoss && dps >= 42) {
        score += 4;
        reasons.push('DPS de jefe');
    } else if (Number(summary.pressureScore || 0) >= 12 && dps >= 34) {
        score += 2;
        reasons.push('dano sostenido');
    }

    if (!reasons.length && dps >= 38 && hasReach) {
        score += 1;
        reasons.push('perfil versatil');
    }

    if (score >= 6) return { id: 'prime', label: 'Counter ideal', score, reasons: reasons.slice(0, 3) };
    if (score >= 3) return { id: 'good', label: 'Buen ajuste', score, reasons: reasons.slice(0, 3) };
    return { id: 'neutral', label: 'Neutro', score, reasons: reasons.slice(0, 2) };
}

function getHeroConfig(hero = {}) {
    return hero?.config || hero || {};
}

function getHeroName(hero = {}) {
    const config = getHeroConfig(hero);
    return hero.name || config.name || config.id || 'Heroe';
}

function getHeroCost(hero = {}) {
    const config = getHeroConfig(hero);
    return Number(config.cost ?? hero.cost ?? 0);
}

function getHeroDps(hero = {}) {
    const config = getHeroConfig(hero);
    const stats = hero.getEffectiveStats?.() || hero;
    const damage = Number(stats.damage || hero.damage || config.damage || 0);
    const fireRate = Number(stats.fireRate || hero.fireRate || config.fireRate || 1);
    return damage * fireRate;
}

function heroDetectsStealth(hero = {}) {
    const config = getHeroConfig(hero);
    return Boolean(hero.canSeeStealth || config.canSeeStealth)
        || Number(config.teamMetrics?.detection || hero.teamMetrics?.detection || 0) >= 4
        || hasTextMatch(config, ['sigilo', 'deteccion', 'rastreo', 'edith']);
}

function heroPiercesArmor(hero = {}) {
    const config = getHeroConfig(hero);
    return PIERCING_HERO_IDS.has(config.id || hero.id)
        || hasTextMatch(config, ['armadura', 'perfor', 'atraviesa', 'antiarmadura', 'laser']);
}

function heroControlsCrowd(hero = {}) {
    const config = getHeroConfig(hero);
    return Number(config.teamMetrics?.control || hero.teamMetrics?.control || 0) >= 4
        || hasTextMatch(config, ['ralent', 'inmovil', 'aturd', 'control', 'red']);
}

export const TACTICAL_COUNTER_LEGEND = [
    { id: 'detection', label: 'Deteccion', detail: 'revela sigilo y faseadores', icon: 'fa-eye' },
    { id: 'piercing', label: 'Perforacion', detail: 'rompe blindaje y barreras', icon: 'fa-bullseye' },
    { id: 'control', label: 'Control', detail: 'corta corredores antes de meta', icon: 'fa-hand-paper' },
    { id: 'reach', label: 'Alcance', detail: 'cubre voladores y rutas largas', icon: 'fa-location-arrow' },
    { id: 'focus', label: 'Foco', detail: 'elimina soporte e invocadores', icon: 'fa-crosshairs' },
    { id: 'dps', label: 'DPS', detail: 'sostiene jefes y elites', icon: 'fa-bolt' }
];

export function buildStatusLegendModel(summary = null) {
    if (!summary) return null;
    const roles = new Set(summary.roles || []);
    const entries = [];
    const add = (id) => {
        const entry = TACTICAL_COUNTER_LEGEND.find((candidate) => candidate.id === id);
        if (entry && !entries.some((candidate) => candidate.id === id)) entries.push(entry);
    };

    if (summary.stealthCount > 0 || roles.has('stealth') || roles.has('phaser')) add('detection');
    if (summary.armoredCount > 0 || summary.barrierCount > 0 || roles.has('tank') || roles.has('shield')) add('piercing');
    if (roles.has('runner') || Number(summary.fastest || 0) >= 90) add('control');
    if (roles.has('flying')) add('reach');
    if (roles.has('support') || roles.has('summoner') || roles.has('commander')) add('focus');
    if (summary.hasBoss || Number(summary.maxThreat || 0) >= 5) add('dps');

    if (!entries.length && summary.counter) add('dps');
    if (!entries.length) return null;

    return {
        label: 'Counters clave',
        entries: entries.slice(0, 4)
    };
}

export function buildStealthCoverageState(summary = null, activeTeam = [], deployedHeroes = [], credits = 0) {
    const roles = new Set(summary?.roles || []);
    const needsDetection = Number(summary?.stealthCount || 0) > 0 || roles.has('stealth') || roles.has('phaser');
    if (!needsDetection) return null;

    const deployed = (deployedHeroes || []).filter(Boolean);
    const deployedDetectors = deployed.filter(heroDetectsStealth);
    if (deployedDetectors.length) {
        const names = deployedDetectors.slice(0, 2).map(getHeroName).join(' + ');
        return {
            tone: 'ready',
            label: 'Sigilo cubierto',
            detail: `Detectores en campo: ${names}.`,
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
            label: 'Sigilo sin desplegar',
            detail: `Coloca ${getHeroName(detector)} antes de iniciar.`,
            detectorCount: 0,
            heroId: detector.id || detector.config?.id || ''
        };
    }

    return {
        tone: 'danger',
        label: 'Sigilo descubierto',
        detail: 'No hay detector disponible; prioriza control y salida.',
        detectorCount: 0
    };
}

export function buildLeakIntel(events = [], fallbackLeaks = 0) {
    const cleanEvents = (events || [])
        .filter(Boolean)
        .map((event) => {
            const segment = Number.isFinite(Number(event.segmentPct)) ? Math.max(0, Math.min(100, Math.round(Number(event.segmentPct)))) : null;
            const lifeLoss = Math.max(0, Number(event.lifeLoss || 0));
            const absorbed = Boolean(event.absorbed);
            const counter = event.counter || 'Cubre salida';
            const name = event.name || 'Enemigo';
            const lossCopy = absorbed ? 'absorbida' : lifeLoss > 0 ? `-${lifeLoss} vida` : 'sin dano';
            return {
                name,
                counter,
                tone: absorbed ? 'absorbed' : lifeLoss >= 3 ? 'boss' : 'leak',
                detail: `${counter} | ${segment ?? 100}% ruta | ${lossCopy}`,
                traits: (event.traits || []).filter(Boolean).slice(0, 3)
            };
        });

    if (!cleanEvents.length && fallbackLeaks > 0) {
        cleanEvents.push({
            name: 'Fugas registradas',
            counter: 'Cubre salida',
            tone: fallbackLeaks >= 3 ? 'boss' : 'leak',
            detail: `${fallbackLeaks} vida perdida; falta detalle de enemigo.`,
            traits: []
        });
    }

    return {
        label: cleanEvents.length ? 'Lectura de fugas' : 'Sin fugas',
        items: cleanEvents.slice(0, 3),
        overflow: Math.max(0, cleanEvents.length - 3)
    };
}

export function buildTacticalContributionModel(tactical = {}) {
    const metrics = [
        { id: 'control', label: 'Control', value: Math.round(Number(tactical.controlSeconds || 0)), suffix: 's', icon: 'fa-hand-paper' },
        { id: 'armor', label: 'Rupturas', value: Math.round(Number(tactical.armorBreaks || 0)), suffix: '', icon: 'fa-shield-halved' },
        { id: 'marks', label: 'Marcas', value: Math.round(Number(tactical.marks || 0)), suffix: '', icon: 'fa-crosshairs' },
        { id: 'detect', label: 'Deteccion', value: Math.round(Number(tactical.detectionReveals || 0)), suffix: '', icon: 'fa-eye' },
        { id: 'saved', label: 'Vidas salvadas', value: Math.round(Number(tactical.livesSaved || 0)), suffix: '', icon: 'fa-heart-pulse' }
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
                hero.detectionReveals > 0 ? `${Math.round(hero.detectionReveals)} deteccion` : '',
                hero.livesSaved > 0 ? `${Math.round(hero.livesSaved)} vida` : ''
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

    if (summary.stealthCount > 0 && !deployed.some(heroDetectsStealth)) {
        add(pickDeploy(heroDetectsStealth, 'Necesitas deteccion antes de que el sigilo cruce la ruta.'));
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

export function buildWavePrepActionControl(item = {}) {
    const actionable = Boolean(item.heroId && ['deploy', 'upgrade'].includes(item.type));
    const verb = item.type === 'upgrade' ? 'Mejorar ahora' : 'Preparar colocacion';
    return {
        actionable,
        tag: actionable ? 'button' : 'div',
        ariaLabel: actionable ? `${verb}: ${item.label}` : item.label || 'Preparacion recomendada',
        title: actionable ? `${item.reason || ''}${item.cost ? ` | $${item.cost}` : ''}`.trim() : ''
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

export function buildShopItemInsight(item = {}, summary = null) {
    const effects = item.effects || {};
    const reasons = [];
    const add = (condition, label) => {
        if (condition && !reasons.includes(label)) reasons.push(label);
    };

    add(effects.detectStealth && (summary?.stealthCount > 0 || (summary?.roles || []).includes('stealth')), 'cubre sigilo');
    add((effects.armorPenetration || effects.armorBreakChance) && (summary?.armoredCount > 0 || summary?.barrierCount > 0 || (summary?.roles || []).some((role) => ['tank', 'shield'].includes(role))), 'rompe blindaje');
    add(effects.slowChance && ((summary?.roles || []).includes('runner') || Number(summary?.fastest || 0) >= 90), 'frena corredores');
    add((effects.damagePct || effects.fireRatePct || effects.critChance || effects.consecutiveDamagePct) && (summary?.hasBoss || Number(summary?.pressureScore || 0) >= 16), 'sube DPS');
    add((effects.chainCount || effects.splashRadius) && Number(summary?.total || 0) >= 8, 'limpia grupos');
    add(effects.rangePct && ((summary?.roles || []).includes('flying') || Number(summary?.fastest || 0) >= 90), 'mejora cobertura');
    add(effects.allowWater, 'abre posiciones');
    add(effects.onHitCredit, 'economia por impacto');
    add(effects.lowLifeDamagePct || effects.lowLifeFireRatePct, 'seguro de fuga');

    const setName = SET_BONUSES[item.set]?.name || item.set || 'sin set';
    if (reasons.length < 3 && item.set) reasons.push(`set ${setName}`);
    const tone = reasons.some((reason) => ['cubre sigilo', 'rompe blindaje', 'frena corredores', 'sube DPS'].includes(reason))
        ? 'counter'
        : item.tier >= 3 ? 'power' : 'utility';
    return {
        tone,
        label: reasons[0] || 'mejora versatil',
        reasons: reasons.slice(0, 3),
        setName
    };
}

export function buildShopSetProgress(item = {}, ownedItemIds = [], equippedItems = {}, itemDatabase = {}) {
    return null;
}

function getPathLength(path = []) {
    if (!Array.isArray(path) || path.length < 2) return 0;
    let total = 0;
    for (let index = 1; index < path.length; index++) {
        total += Math.hypot(path[index].x - path[index - 1].x, path[index].y - path[index - 1].y);
    }
    return total;
}

export function buildCombatPressureState(enemies = [], path = [], waveActive = false) {
    const active = enemies.filter((enemy) => enemy?.isAlive && !enemy.hasReachedEnd);
    if (!waveActive || active.length === 0) {
        return {
            id: 'clear',
            label: waveActive ? 'Ruta despejada' : 'Sin oleada',
            advice: waveActive ? 'Mantén la formación.' : 'Prepara la siguiente oleada.',
            progress: 0,
            activeCount: active.length,
            dangerCount: 0,
            leadEnemyName: '',
            signature: `clear:${waveActive}:${active.length}`
        };
    }

    const pathLength = getPathLength(path);
    const projected = active.map((enemy) => {
        const progress = pathLength > 0 ? Math.max(0, Math.min(1, (enemy.distanceTravelled || 0) / pathLength)) : 0;
        return { enemy, progress };
    }).sort((a, b) => b.progress - a.progress);

    const lead = projected[0];
    const dangerCount = projected.filter(({ progress }) => progress >= 0.78).length;
    const score = lead.progress + dangerCount * 0.08 + Math.min(0.16, active.length * 0.012);

    let state = { id: 'holding', label: 'Controlada', advice: 'Sostén daño y ahorra si puedes.' };
    if (score >= 0.92 || lead.progress >= 0.9) state = { id: 'critical', label: 'Fuga inminente', advice: 'Pausa, mejora o reposiciona ya.' };
    else if (score >= 0.72 || dangerCount > 0) state = { id: 'warning', label: 'Presión alta', advice: 'Refuerza la salida o activa control.' };
    else if (score >= 0.48) state = { id: 'watch', label: 'Vigilar ruta', advice: 'El frente avanza; prepara mejora.' };

    const progress = Math.round(lead.progress * 100);
    return {
        ...state,
        progress,
        activeCount: active.length,
        dangerCount,
        leadEnemyName: lead.enemy.name || 'Enemigo',
        signature: `${state.id}:${progress}:${active.length}:${dangerCount}:${lead.enemy.uid || lead.enemy.name || ''}`
    };
}

export function buildBossHudState(enemies = [], waveActive = false) {
    if (!waveActive) return null;
    const boss = (enemies || [])
        .filter((enemy) => enemy?.isAlive && !enemy.hasReachedEnd && enemy.isBoss)
        .sort((a, b) => (b.threat || 0) - (a.threat || 0) || (b.maxHp || 0) - (a.maxHp || 0))[0];
    if (!boss) return null;

    const maxHp = Math.max(1, Number(boss.maxHp || boss.hp || 1));
    const hp = Math.max(0, Math.min(maxHp, Number(boss.hp || 0)));
    const hpPct = Math.round(hp / maxHp * 100);
    const phase = boss.currentPhase || boss.phaseLabel || (boss.phases?.length ? 'Fase activa' : 'Fase inicial');
    return {
        id: boss.uid || boss.id || boss.name || 'boss',
        name: boss.name || boss.config?.name || 'Jefe',
        phase,
        isFinalBoss: Boolean(boss.isFinalBoss || boss.config?.isFinalBoss),
        hp,
        maxHp,
        hpPct,
        threat: Math.max(1, Number(boss.threat || 5)),
        critical: hpPct <= 30
    };
}

export function buildSpawnQueueState(queue = [], spawnTimer = 0, waveActive = false) {
    if (!waveActive || !queue?.length) return null;
    const next = queue[0]?.config || {};
    const delay = Math.max(0, Number(queue[0]?.delay || 0));
    const eta = Math.max(0, delay - Math.max(0, Number(spawnTimer || 0)));
    const threat = Math.max(1, Number(next.threat || 1));
    const danger = next.isBoss || threat >= 5 ? 'critical' : threat >= 4 ? 'high' : threat >= 3 ? 'guarded' : 'low';

    return {
        name: next.name || 'Enemigo',
        eta: Number(eta.toFixed(1)),
        remaining: queue.length,
        threat,
        danger,
        role: next.archetype || (next.isBoss ? 'boss' : 'soldier'),
        isBoss: Boolean(next.isBoss)
    };
}

export function buildPressureActionState(pressureState, heroes = [], credits = 0, levelCost = (level) => level * 120) {
    if (!pressureState || !['watch', 'warning', 'critical'].includes(pressureState.id)) return null;
    const deployed = heroes.filter((hero) => hero?.isAlive !== false);
    if (!deployed.length) {
        return {
            type: 'hint',
            label: 'Sin heroes desplegados',
            reason: 'Coloca defensa antes de que el frente llegue a la salida.',
            signature: `hint:none:${pressureState.id}`
        };
    }

    const candidates = deployed.map((hero) => {
        const level = Number(hero.level || hero.config?.level || 1);
        const cost = Number(levelCost(level, 1));
        const stats = hero.getEffectiveStats?.() || hero;
        const damage = Number(stats.damage || hero.damage || 0);
        const fireRate = Number(stats.fireRate || hero.fireRate || 1);
        const range = Number(stats.range || hero.range || 100);
        const control = Number(hero.config?.teamMetrics?.control || hero.teamMetrics?.control || 0);
        const detection = hero.canSeeStealth || stats.canSeeStealth ? 1 : 0;
        const pressureBonus = pressureState.id === 'critical' ? control * 1.2 + range / 120 : control * 0.8;
        return {
            hero,
            cost,
            level,
            score: damage * fireRate + range / 4 + level * 8 + pressureBonus + detection * 10
        };
    }).sort((a, b) => b.score - a.score);

    const affordable = candidates.find((candidate) => candidate.cost <= credits);
    if (affordable) {
        const name = affordable.hero.name || affordable.hero.config?.name || affordable.hero.id || 'Heroe';
        return {
            type: 'upgrade',
            heroId: affordable.hero.id || affordable.hero.config?.id,
            heroName: name,
            cost: affordable.cost,
            label: `Mejorar ${name}`,
            reason: pressureState.id === 'critical' ? 'Respuesta recomendada para cortar la fuga.' : 'Refuerzo rapido antes de que escale.',
            signature: `upgrade:${affordable.hero.id || name}:${affordable.level}:${affordable.cost}:${Math.floor(credits)}`
        };
    }

    const cheapest = candidates.reduce((best, candidate) => !best || candidate.cost < best.cost ? candidate : best, null);
    const missing = Math.max(0, (cheapest?.cost || 0) - credits);
    return {
        type: 'hint',
        label: `Faltan $${Math.ceil(missing)}`,
        reason: 'Ahorra para la siguiente mejora de campo.',
        signature: `hint:${cheapest?.hero?.id || 'none'}:${cheapest?.cost || 0}:${Math.floor(credits)}`
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
            label: 'Prioridad: salida',
            detail: 'Invierte en control o alcance final antes de escalar.'
        };
    }
    if (leaks > 0) {
        return {
            tone: 'leak',
            label: 'Refuerzo final',
            detail: 'Una mejora cerca de la meta puede convertir fugas en bajas.'
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

    const cleanBonus = leaks === 0 && (kills > 0 || damage > 0) ? 18 : 0;
    const teamBonus = bestShare > 0 && bestShare < 0.6 && kills >= 6 ? 6 : 0;
    const score = Math.max(0, Math.min(100, Math.round(
        55
        + Math.min(18, kills * 1.2)
        + Math.min(18, damage / 120)
        + Math.min(10, credits / 55)
        + cleanBonus
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
        label = 'S.H.I.E.L.D. perfecto';
    } else if (score >= 86) {
        medal = 'A';
        tone = 'strong';
        label = 'Control superior';
    } else if (score >= 72) {
        medal = 'B';
        tone = 'stable';
        label = 'Linea estable';
    } else if (score >= 55) {
        medal = 'C';
        tone = 'thin';
        label = 'Margen fino';
    }

    let detail = 'Sostuviste la ruta; prepara el proximo salto de amenaza.';
    if (leaks >= 3) detail = 'La salida quedo expuesta; suma control final antes de acelerar.';
    else if (leaks > 0) detail = 'Hubo fugas aisladas; una mejora cerca de meta puede sellar la linea.';
    else if (kills === 0 && damage === 0) detail = 'No hubo lectura ofensiva; despliega dano antes de la siguiente oleada.';
    else if (medal === 'S') detail = 'Oleada limpia con ejecucion dominante: buen momento para greed de economia.';
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
    let advice = 'Sin fugas: puedes ahorrar o acelerar la siguiente oleada.';

    if (leaks > 0) {
        tone = leaks >= 3 ? 'breach' : 'leak';
        label = leaks >= 3 ? 'Brecha seria' : 'Fuga contenida';
        advice = leaks >= 3
            ? 'Refuerza la salida y prioriza control antes de iniciar.'
            : 'Sube una defensa cercana al final del camino.';
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
        cleanBonus: Math.max(0, Number(report.cleanBonus || 0)),
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
            reason: report.leaks > 0
                ? 'Ahorra para reforzar al heroe que mas sostuvo la fuga.'
                : 'Guarda creditos para convertir al MVP en carry.',
            signature: `saving:${heroId}:${cost}:${Math.floor(available)}`
        };
    }

    return {
        type: 'upgrade',
        heroId,
        label: `Mejorar ${name}`,
        cost,
        reason: report.leaks > 0
            ? 'Recomendado tras fugas: potencia tu defensa mas efectiva.'
            : 'Aprovecha el rendimiento del MVP antes de escalar amenaza.',
        signature: `upgrade:${heroId}:${level}:${cost}:${Math.floor(available)}`
    };
}

export const ONBOARDING_STEPS = [
    {
        id: 'squad',
        label: 'Escuadron listo',
        detail: 'Elige tu nucleo inicial y piensa en roles: dano, control y deteccion.',
        actionLabel: 'Abrir equipo',
        icon: 'fa-users'
    },
    {
        id: 'deploy',
        label: 'Primera defensa',
        detail: 'Coloca un heroe donde cubra la mayor cantidad de ruta posible.',
        actionLabel: 'Preparar heroe',
        icon: 'fa-map-marker-alt'
    },
    {
        id: 'suggestion',
        label: 'Celda recomendada',
        detail: 'Usa la sugerencia cuando priorice cobertura, terreno valido y distancia al camino.',
        actionLabel: 'Usar sugerida',
        icon: 'fa-location-crosshairs'
    },
    {
        id: 'radar',
        label: 'Lee el radar',
        detail: 'Antes de iniciar, revisa counters clave y cobertura contra sigilo o blindaje.',
        actionLabel: 'Ver radar',
        icon: 'fa-satellite-dish'
    },
    {
        id: 'report',
        label: 'Ajuste post-oleada',
        detail: 'Tras cada oleada, refuerza lo que fallo: fugas, DPS, control o deteccion.',
        actionLabel: 'Revisar informe',
        icon: 'fa-clipboard-list'
    }
];

export function buildOnboardingCoachState(snapshot = {}, settings = {}) {
    if (settings.tutorialHints === false) return null;
    const dismissed = new Set(snapshot.dismissedSteps || []);
    const activeTeamCount = Number(snapshot.activeTeamCount || 0);
    const deployedCount = Number(snapshot.deployedCount || 0);
    const currentWave = Math.max(1, Number(snapshot.currentWave || 1));
    const waveActive = Boolean(snapshot.waveActive);
    const hasReport = Boolean(snapshot.hasReport);
    const placingHero = Boolean(snapshot.placingHero);
    const hasSuggestion = Boolean(snapshot.hasSuggestion);

    let id = 'radar';
    if (activeTeamCount === 0) id = 'squad';
    else if (placingHero && hasSuggestion) id = 'suggestion';
    else if (deployedCount === 0) id = 'deploy';
    else if (hasReport || currentWave > 1) id = 'report';
    else if (!waveActive) id = 'radar';

    if (dismissed.has(id)) return null;
    const index = ONBOARDING_STEPS.findIndex((step) => step.id === id);
    const step = ONBOARDING_STEPS[index] || ONBOARDING_STEPS[0];
    return {
        ...step,
        index: index + 1,
        total: ONBOARDING_STEPS.length,
        progressLabel: `${index + 1}/${ONBOARDING_STEPS.length}`,
        tone: id === 'report' ? 'report' : id === 'suggestion' ? 'action' : 'guide'
    };
}

export class UIManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.overlay = document.getElementById('panel-overlay');
        this.panelContent = document.getElementById('panel-content');
        this.heroGrid = document.querySelector('.hero-grid');
        this.selectionStatus = document.getElementById('selection-status');
        this.toastEl = document.getElementById('toast');

        this.livesEl = document.getElementById('ui-lives');
        this.creditsEl = document.getElementById('ui-credits');
        this.waveEl = document.getElementById('ui-wave');
        this.levelNameEl = document.getElementById('ui-level-name');
        this.fpsEl = document.getElementById('fps-display');
        this.starsEl = document.getElementById('ui-stars');
        this.operationTitleEl = document.getElementById('operation-title');
        this.operationCopyEl = document.getElementById('operation-copy');
        this.operationKickerEl = document.getElementById('operation-kicker');

        this.shopInitialized = false;
        this.shopSlots = [null, null, null];
        this.itemPool = [];
        this.toastTimer = null;
        this.gachaRevealTimers = [];
        this.lastFocusedElement = null;
        this.nextWaveSummary = null;
        this.combatPressureSignature = '';
        this.dismissedOnboardingSteps = new Set();
        this.profilePanel = new ProfilePanel(this);
        this.campaignPanel = new CampaignPanel(this);
        this.settingsPanel = new SettingsPanel(this);
        this.inventoryPanel = new InventoryPanel(this);
        this.teamBuilderPanel = new TeamBuilderPanel(this);
        this.modePanel = new ModePanel(this);
        this.tooltipController = new TooltipController();

        this.initListeners();
        this.renderOnboardingCoach();
    }

    initListeners() {
        document.querySelectorAll('.hub-btn').forEach((button) => {
            button.addEventListener('click', () => this.openPanel(button.dataset.panel));
        });

        document.getElementById('close-panel-btn')?.addEventListener('click', () => this.closePanel());
        document.getElementById('next-wave-btn')?.addEventListener('click', () => {
            if (this.game.waveManager && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
        });

        const btnPause = document.getElementById('btn-pause');
        const btnAuto = document.getElementById('btn-auto');
        const btnSpeed = document.getElementById('btn-speed');

        btnPause?.addEventListener('click', () => {
            this.setManualPause(!this.game.isManuallyPaused);
        });

        btnAuto?.addEventListener('click', () => {
            if (!this.game.waveManager) return;
            this.game.waveManager.autoWave = !this.game.waveManager.autoWave;
            btnAuto.classList.toggle('active', this.game.waveManager.autoWave);
            btnAuto.classList.toggle('muted', !this.game.waveManager.autoWave);
            btnAuto.setAttribute('aria-pressed', String(this.game.waveManager.autoWave));
            if (this.game.waveManager.autoWave && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
        });

        btnSpeed?.addEventListener('click', () => {
            const speeds = [1, 2, 3, 4];
            const nextIndex = (speeds.indexOf(this.game.gameSpeed) + 1) % speeds.length;
            this.game.gameSpeed = speeds[nextIndex];
            btnSpeed.innerHTML = `x${this.game.gameSpeed} <i class="fas fa-rocket"></i>`;
        });

        this.heroGrid?.addEventListener('click', (event) => {
            const quickUpgradeButton = event.target.closest('[data-quick-upgrade-id]');
            if (!quickUpgradeButton || !this.heroGrid.contains(quickUpgradeButton)) return;

            event.preventDefault();
            event.stopPropagation();
            this.quickUpgradeHeroById(quickUpgradeButton.dataset.quickUpgradeId);
        });

        window.addEventListener('pointerdown', () => this.game.audio?.unlock(), { once: true });
        window.addEventListener('keydown', () => this.game.audio?.unlock(), { once: true });
        window.addEventListener('keydown', (event) => this.handleDialogKeydown(event));
    }

    openPanel(type) {
        this.tooltipController.hide();
        this.lastFocusedElement = document.activeElement;
        this.game.pause();
        this.showPanelOverlay(true);
        this.game.audio?.play('ui');
        this.renderPanel(type);
        window.requestAnimationFrame(() => document.getElementById('close-panel-btn')?.focus());
    }

    closePanel() {
        this.hidePanelOverlay();
        if (!this.game.isManuallyPaused && !this.game.isGameOver) this.game.start();
        this.lastFocusedElement?.focus?.();
    }

    showPanelOverlay(showCloseButton = true) {
        document.body.classList.add('panel-open');
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.toggle('hidden', !showCloseButton);
    }

    hidePanelOverlay() {
        this.overlay.classList.add('hidden');
        document.body.classList.remove('panel-open');
    }

    handleDialogKeydown(event) {
        if (this.overlay.classList.contains('hidden')) return;
        if (event.key === 'Escape' && !document.getElementById('close-panel-btn')?.classList.contains('hidden')) {
            event.preventDefault();
            this.closePanel();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...this.overlay.querySelectorAll('button:not([disabled]), select, input, [tabindex="0"]')]
            .filter((element) => !element.classList.contains('hidden'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    setSelectionStatus(text) {
        if (this.selectionStatus) this.selectionStatus.textContent = text;
    }

    setManualPause(paused, announce = true) {
        this.game.isManuallyPaused = Boolean(paused);
        if (this.game.isManuallyPaused) this.game.pause();
        else this.game.start();

        const button = document.getElementById('btn-pause');
        if (button) {
            button.innerHTML = this.game.isManuallyPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
            button.classList.toggle('active', this.game.isManuallyPaused);
            button.setAttribute('aria-pressed', String(this.game.isManuallyPaused));
            button.setAttribute('aria-label', this.game.isManuallyPaused ? 'Reanudar' : 'Pausar');
            button.dataset.tooltip = this.game.isManuallyPaused ? 'Reanudar partida' : 'Entrar en pausa táctica';
        }
        document.body.classList.toggle('tactical-paused', this.game.isManuallyPaused);
        if (announce) this.showToast(this.game.isManuallyPaused ? 'Pausa táctica: inspecciona y reorganiza' : 'Partida reanudada', 'info');
        return this.game.isManuallyPaused;
    }

    setNextWaveEnabled(enabled, summary = null) {
        const button = document.getElementById('next-wave-btn');
        if (!button) return;
        if (summary) this.nextWaveSummary = summary;
        const state = buildWaveLaunchState(enabled, summary || this.nextWaveSummary);
        button.disabled = !enabled;
        button.className = `btn-primary next-wave-cta threat-${state.tier}`;
        button.dataset.threatTier = state.tier;
        button.dataset.tooltip = state.tooltip;
        button.title = state.tooltip;
        button.setAttribute('aria-label', state.ariaLabel);

        const primary = document.createElement('strong');
        const secondary = document.createElement('small');
        primary.textContent = state.primary;
        secondary.textContent = state.secondary;
        button.replaceChildren(primary, secondary);
        this.renderOnboardingCoach();
    }

    updatePlacementSuggestion(state = null) {
        const button = document.getElementById('suggested-placement-action');
        if (!button) return;
        if (!state) {
            button.classList.add('hidden');
            button.innerHTML = '';
            button.onclick = null;
            this.renderOnboardingCoach();
            return;
        }

        button.className = `suggested-placement-action ${state.qualityId || 'solid'}`;
        button.setAttribute('aria-label', `${state.label}. ${state.detail}`);
        button.innerHTML = `
            <i class="fas fa-location-crosshairs"></i>
            <span><strong>${escapeHtml(state.label)}</strong><small>${escapeHtml(state.detail)}</small></span>
            <b>${escapeHtml(state.actionLabel || 'Usar')}</b>
        `;
        button.onclick = () => this.game.inputManager?.confirmSuggestedPlacement?.();
        this.renderOnboardingCoach();
    }

    getOnboardingSnapshot() {
        return {
            activeTeamCount: this.game.activeTeam?.length || 0,
            deployedCount: this.game.heroes?.length || 0,
            currentWave: this.game.waveManager?.currentWave || 1,
            waveActive: this.game.waveManager?.isWaveActive || false,
            placingHero: Boolean(this.game.inputManager?.placingHero),
            hasSuggestion: Boolean(this.game.inputManager?.suggestedPlacement),
            hasReport: Boolean(this.lastWaveReport),
            dismissedSteps: [...this.dismissedOnboardingSteps]
        };
    }

    renderOnboardingCoach() {
        const coach = document.getElementById('onboarding-coach');
        if (coach) coach.remove();
        return null;
    }

    handleOnboardingAction(state) {
        if (!state) return false;
        if (state.id === 'squad') {
            this.openPanel('collection');
            return true;
        }
        if (state.id === 'deploy') {
            const candidate = (this.game.activeTeam || []).find((hero) => !this.game.heroes?.some((unit) => unit.id === hero.id));
            if (candidate) {
                this.game.inputManager?.setPlacementMode(candidate);
                return true;
            }
        }
        if (state.id === 'suggestion') return Boolean(this.game.inputManager?.confirmSuggestedPlacement?.());
        if (state.id === 'radar') {
            this.openPanel('radar');
            return true;
        }
        if (state.id === 'report') {
            this.openPanel('radar');
            return true;
        }
        return false;
    }

    updateUI(lives, credits, wave, fps, stars) {
        if (this.livesEl) this.livesEl.textContent = lives;
        if (this.creditsEl) this.creditsEl.textContent = credits === Number.POSITIVE_INFINITY ? '∞' : Math.floor(credits);
        if (this.waveEl) this.waveEl.textContent = wave;
        if (this.fpsEl) this.fpsEl.textContent = `${Math.round(fps || 0)} FPS`;
        if (this.starsEl && stars !== undefined) this.starsEl.textContent = stars;
    }

    updateCombatPressure(enemies = [], path = [], waveActive = false) {
        const container = document.getElementById('combat-pressure');
        if (container) {
            container.classList.add('hidden');
            container.innerHTML = '';
        }
        return buildCombatPressureState(enemies, path, waveActive);
    }

    renderCombatPressurePanel(enemies = [], path = [], waveActive = false) {
        const container = document.getElementById('combat-pressure');
        if (!container) return null;
        const state = buildCombatPressureState(enemies, path, waveActive);
        const action = buildPressureActionState(
            state,
            this.game.heroes || [],
            this.game.resourceManager?.credits || 0,
            (level, amount) => this.calculateLevelCost(level, amount)
        );
        const signature = `${state.signature}:${action?.signature || 'none'}`;
        if (signature === this.combatPressureSignature) return state;
        this.combatPressureSignature = signature;

        if (!waveActive && state.id === 'clear') {
            container.classList.add('hidden');
            container.innerHTML = '';
            return state;
        }

        container.className = `combat-pressure pressure-${state.id}`;
        container.setAttribute('aria-label', `${state.label}. ${state.advice}`);
        container.innerHTML = `
            <div class="pressure-copy">
                <strong>${state.label}</strong>
                <span>${state.advice}</span>
            </div>
            <div class="pressure-meter" aria-hidden="true"><i style="width:${state.progress}%"></i></div>
            <div class="pressure-meta">
                <span>${state.activeCount} activos</span>
                <span>${state.leadEnemyName || 'Ruta'} ${state.progress}%</span>
                ${state.dangerCount ? `<b>${state.dangerCount} en salida</b>` : ''}
            </div>
            ${action ? `<div class="pressure-action pressure-action-${action.type}">
                <span>${action.reason}</span>
                ${action.type === 'upgrade'
                    ? `<button id="pressure-upgrade" class="btn-mode-action">${action.label} $${action.cost}</button>`
                    : `<small>${action.label}</small>`}
            </div>` : ''}
            ${state.id === 'warning' || state.id === 'critical' ? '<button id="pressure-pause" class="btn-mode-action">Pausa táctica</button>' : ''}
        `;
        document.getElementById('pressure-upgrade')?.addEventListener('click', () => {
            if (this.quickUpgradeHeroById(action.heroId)) {
                this.combatPressureSignature = '';
                this.renderCombatPressurePanel(enemies, path, waveActive);
            }
        });
        document.getElementById('pressure-pause')?.addEventListener('click', () => this.setManualPause(true));
        return state;
    }

    updateBossHud(enemies = [], waveActive = false) {
        const container = document.getElementById('boss-hud');
        if (!container) return null;
        const state = buildBossHudState(enemies, waveActive);
        if (!state) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return null;
        }

        container.className = `boss-hud ${state.critical ? 'critical' : ''} ${state.isFinalBoss ? 'final-boss' : ''}`;
        container.setAttribute('aria-label', `${state.name}. ${state.phase}. Salud ${state.hpPct} por ciento.`);
        container.innerHTML = `
            <div class="boss-hud-heading">
                <span>${state.isFinalBoss ? 'Jefe final' : 'Jefe activo'}</span>
                <strong>${escapeHtml(state.name)}</strong>
            </div>
            <div class="boss-hud-meter" aria-hidden="true"><i style="width:${state.hpPct}%"></i></div>
            <div class="boss-hud-meta">
                <span>${escapeHtml(state.phase)}</span>
                <b>${state.hpPct}%</b>
            </div>
        `;
        return state;
    }

    updateSpawnQueue(queue = [], spawnTimer = 0, waveActive = false) {
        const container = document.getElementById('spawn-queue');
        if (!container) return null;
        const state = buildSpawnQueueState(queue, spawnTimer, waveActive);
        if (!state) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return null;
        }

        container.className = `spawn-queue ${state.danger}`;
        container.setAttribute('aria-label', `Proximo refuerzo ${state.name} en ${state.eta} segundos. Quedan ${state.remaining}.`);
        container.innerHTML = `
            <span>Refuerzos</span>
            <strong>${escapeHtml(state.name)}</strong>
            <b>${state.eta}s | ${state.remaining} pendientes</b>
        `;
        return state;
    }

    clearWaveReport() {
        const container = document.getElementById('wave-report');
        this.lastWaveReport = null;
        if (!container) return;
        container.classList.add('hidden');
        container.innerHTML = '';
        this.renderOnboardingCoach();
    }

    renderWaveReport(report) {
        const container = document.getElementById('wave-report');
        if (!container) return null;
        const state = buildWaveReportState(report);
        const action = buildWaveReportActionState(
            state,
            this.game.heroes || [],
            this.game.resourceManager?.credits || 0,
            (level, amount) => this.calculateLevelCost(level, amount)
        );
        this.lastWaveReport = report;
        container.className = `wave-report report-${state.tone}`;
        container.setAttribute('aria-label', `${state.label}. ${state.advice}`);
        container.innerHTML = `
            <div class="wave-report-heading">
                <div>
                    <span>Informe oleada ${state.wave}</span>
                    <strong>${state.label}</strong>
                </div>
                <b class="wave-report-grade grade-${state.grade.tone}" title="${escapeHtml(state.grade.detail)}">
                    <em>${state.grade.medal}</em>
                    <small>${state.grade.score}</small>
                </b>
            </div>
            <div class="wave-report-grid">
                <span><b>${state.leaks}</b> fugas</span>
                <span><b>${state.kills}</b> bajas</span>
                <span><b>${state.damage}</b> dano</span>
                <span><b>$${state.credits}</b> creditos</span>
                ${state.cleanBonus > 0 ? `<span><b>+$${state.cleanBonus}</b> perfecta</span>` : ''}
            </div>
            <div class="wave-report-rating grade-${state.grade.tone}" aria-label="${escapeHtml(state.grade.label)}: ${escapeHtml(state.grade.detail)}">
                <strong>${escapeHtml(state.grade.label)}</strong>
                <span>${escapeHtml(state.grade.detail)}</span>
            </div>
            <div class="wave-report-mvp">
                <i class="fas fa-star"></i>
                <span>${state.bestHero}: ${state.bestHeroKills} bajas - ${state.bestHeroDamage} dano</span>
            </div>
            ${state.tacticalContribution.active ? `<div class="wave-tactical-contribution" aria-label="Contribucion tactica de la oleada">
                <strong><i class="fas fa-chart-line"></i> Valor tactico ${state.tacticalContribution.score}</strong>
                <div>
                    ${state.tacticalContribution.metrics.map((metric) => `<span class="${escapeHtml(metric.id)}">
                        <i class="fas ${escapeHtml(metric.icon)}"></i>
                        <b>${metric.value}${escapeHtml(metric.suffix)}</b>
                        <small>${escapeHtml(metric.label)}</small>
                    </span>`).join('')}
                </div>
                ${state.tacticalContribution.heroes.length ? `<em>${state.tacticalContribution.heroes.map((hero) => `${escapeHtml(hero.name)}: ${escapeHtml(hero.detail)}`).join(' / ')}</em>` : ''}
            </div>` : ''}
            <div class="wave-report-lesson lesson-${state.lesson.tone}" aria-label="${escapeHtml(state.lesson.label)}: ${escapeHtml(state.lesson.detail)}">
                <strong>${escapeHtml(state.lesson.label)}</strong>
                <span>${escapeHtml(state.lesson.detail)}</span>
            </div>
            ${state.leakIntel.items.length ? `<div class="wave-leak-intel" aria-label="${escapeHtml(state.leakIntel.label)}">
                <strong><i class="fas fa-route"></i> ${escapeHtml(state.leakIntel.label)}</strong>
                ${state.leakIntel.items.map((item) => `<span class="${escapeHtml(item.tone)}">
                    <b>${escapeHtml(item.name)}</b>
                    <small>${escapeHtml(item.detail)}</small>
                </span>`).join('')}
                ${state.leakIntel.overflow > 0 ? `<em>+${state.leakIntel.overflow} mas</em>` : ''}
            </div>` : ''}
            <p>${state.advice}</p>
            ${action ? `<div class="wave-report-action report-action-${action.type}">
                <span>${action.reason}</span>
                ${action.type === 'upgrade'
                    ? `<button id="wave-report-action" class="btn-mode-action">${action.label} $${action.cost}</button>`
                    : `<small>${action.label}</small>`}
            </div>` : ''}
        `;
        document.getElementById('wave-report-action')?.addEventListener('click', () => {
            if (this.quickUpgradeHeroById(action.heroId)) this.renderWaveReport(this.lastWaveReport);
        });
        this.renderOnboardingCoach();
        return state;
    }

    updatePerformance(snapshot, poolStats = {}) {
        if (!this.fpsEl) return;
        this.fpsEl.textContent = `${Math.round(snapshot.fps)} FPS`;
        this.fpsEl.classList.toggle('performance-warning', snapshot.p95Ms > 16.67);
        this.fpsEl.title = `Frame promedio ${snapshot.averageMs.toFixed(2)} ms · p95 ${snapshot.p95Ms.toFixed(2)} ms · pico ${snapshot.peakEntities} entidades · ${poolStats.reused || 0} proyectiles reutilizados`;
    }

    updateLevelTheme(levelConfig) {
        if (this.levelNameEl) this.levelNameEl.textContent = levelConfig.theme?.label || levelConfig.name || 'Mapa';
        document.documentElement.style.setProperty('--level-accent', levelConfig.theme?.accent || '#40c9ff');
        if (this.operationTitleEl) this.operationTitleEl.textContent = levelConfig.theme?.label || levelConfig.name || 'Mapa';
        this.game.audio?.setTheme(levelConfig.theme?.id || 'new-york');
    }

    updateMissionStatus(snapshot) {
        const container = document.getElementById('mission-status');
        if (!container || !snapshot) return;
        const specialStatus = snapshot.blackout > 0
            ? `<b>Corte: ${snapshot.blackout}s</b>`
            : snapshot.shieldCharges > 0
                ? `<b>Escudo: ${snapshot.shieldCharges} · Vibranium ${snapshot.vibranium}/6</b>`
                : '';
        container.innerHTML = `
            <div class="mission-heading"><strong>${snapshot.operation}</strong><span>${snapshot.mechanicLabel}</span></div>
            <p>${snapshot.message}</p>
            ${specialStatus}
            <div class="mission-objectives-mini">
                ${snapshot.objectives.map((objective) => `<span class="${objective.complete ? 'done' : ''}">${objective.complete ? '✓' : `${objective.value}/${objective.target}`} ${objective.label}</span>`).join('')}
            </div>
        `;
    }

    updateModeStatus(snapshot) {
        return this.modePanel.updateStatus(snapshot);
        const container = document.getElementById('mode-status');
        if (!container) return;
        if (!snapshot) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }
        container.classList.remove('hidden');
        const detail = snapshot.streakDetail || snapshot.detail;
        container.innerHTML = `<div><strong>${snapshot.name}</strong><span>${snapshot.detail}</span></div><b>${snapshot.score} pts</b>${snapshot.canExtract ? '<button id="extract-mode" class="btn-mode-action">Extraer</button>' : ''}${snapshot.canRepair ? '<button id="repair-mode" class="btn-mode-action">Reparar +2 · $120</button>' : ''}`;
        container.querySelector('span').textContent = detail;
        document.getElementById('extract-mode')?.addEventListener('click', () => this.game.modeSystem.extract());
        document.getElementById('repair-mode')?.addEventListener('click', () => this.game.modeSystem.repair());
    }

    showDraftChoice(heroes, onChoose) {
        return this.modePanel.showDraftChoice(heroes, onChoose);
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        this.panelContent.innerHTML = `<div class="draft-choice"><span class="briefing-kicker">DRAFT HEROICO</span><h2>Elige un refuerzo</h2><div>${heroes.map((hero) => `<button data-draft="${hero.id}">${this.renderSprite(this.getHeroDisplaySprite(hero), hero.name)}<strong>${hero.name}</strong><small>${hero.niche || hero.ability}</small></button>`).join('')}</div></div>`;
        this.panelContent.querySelectorAll('[data-draft]').forEach((button) => button.addEventListener('click', () => onChoose(button.dataset.draft)));
    }

    showModeResult(title, snapshot) {
        return this.modePanel.showResult(title, snapshot);
        this.overlay.classList.remove('hidden');
        document.getElementById('close-panel-btn')?.classList.add('hidden');
        this.panelContent.innerHTML = `<div class="end-state"><h2>${title}</h2><p>${snapshot.score} puntos · oleada ${snapshot.wave} · récord ${snapshot.best}</p>${this.renderMissionSummary(this.game.progression?.state.lastMissionSummary)}<button class="btn-primary" id="mode-result-map">Volver a modos</button></div>`;
        document.getElementById('mode-result-map')?.addEventListener('click', () => {
            document.getElementById('close-panel-btn')?.classList.remove('hidden');
            this.renderMap('Mapa y modos');
        });
    }

    showToast(message, type = 'info') {
        if (!this.toastEl) return;
        window.clearTimeout(this.toastTimer);
        this.toastEl.textContent = message;
        this.toastEl.className = `toast ${type}`;
        if (type === 'success') this.game.audio?.play('confirm');
        if (type === 'warning') this.game.audio?.play('warning');
        if (type === 'reward') this.game.audio?.play('reward');
        this.toastTimer = window.setTimeout(() => this.toastEl.classList.add('hidden'), 2200);
    }

    renderWavePreview(uniqueEnemies, modifier = null, faction = null, waveNumber = 1, summary = null) {
        const container = document.getElementById('wave-preview');
        const numberEl = document.getElementById('next-wave-number');
        const intelEl = document.getElementById('wave-intel');
        if (!container) return;
        const prepPlan = summary
            ? buildWavePreparationPlan(
                summary,
                this.game.activeTeam || [],
                this.game.heroes || [],
                this.game.resourceManager?.credits || 0,
                (level, amount = 1) => this.calculateLevelCost(level, amount)
            )
            : [];
        const stealthCoverage = summary
            ? buildStealthCoverageState(
                summary,
                this.game.activeTeam || [],
                this.game.heroes || [],
                this.game.resourceManager?.credits || 0
            )
            : null;
        const statusLegend = buildStatusLegendModel(summary);

        if (numberEl) numberEl.textContent = waveNumber;
        if (intelEl) {
            intelEl.innerHTML = `
                <strong>${faction?.label || 'Amenaza desconocida'}</strong>
                <span>${modifier?.label || 'Oleada estándar'}: ${modifier?.description || ''}</span>
                ${summary ? `
                    <div class="wave-threat ${summary.threatTier?.id || 'low'}" aria-label="${summary.threatTier?.label || 'Amenaza baja'}: ${summary.threatTier?.advice || 'Buen momento para ahorrar.'} Puntaje ${summary.pressureScore || 0}">
                        <div><strong>${summary.threatTier?.label || 'Amenaza baja'}</strong><span>${summary.threatTier?.advice || 'Buen momento para ahorrar.'}</span></div>
                        <b>${summary.pressureScore || 0}</b>
                    </div>
                    <div class="wave-readiness ${summary.readiness?.id || 'empty'}" aria-label="${summary.readiness?.label || 'Sin defensa'}: ${summary.readiness?.advice || 'Despliega al menos un heroe antes de iniciar.'}">
                        <div><strong>${summary.readiness?.label || 'Sin defensa'}</strong><span>${summary.readiness?.advice || 'Despliega al menos un heroe antes de iniciar.'}</span></div>
                        <b>${summary.readiness?.score || 0}</b>
                    </div>
                    <div class="wave-summary">
                        <span><b>${summary.total}</b> enemigos</span>
                        <span><b>$${summary.reward}</b> botín</span>
                        <span><b>${summary.fastest}</b> vel. máx.</span>
                        <span><b>${summary.maxThreat}/5</b> amenaza</span>
                    </div>
                    <small class="wave-counter"><i class="fas fa-crosshairs"></i> Respuesta: ${summary.counter}</small>
                    ${stealthCoverage ? `<div class="wave-stealth-coverage ${stealthCoverage.tone}" aria-label="${escapeHtml(stealthCoverage.label)}: ${escapeHtml(stealthCoverage.detail)}">
                        <i class="fas fa-eye"></i>
                        <div><strong>${escapeHtml(stealthCoverage.label)}</strong><span>${escapeHtml(stealthCoverage.detail)}</span></div>
                    </div>` : ''}
                    ${statusLegend ? `<div class="wave-status-legend" aria-label="${escapeHtml(statusLegend.label)}">
                        <strong>${escapeHtml(statusLegend.label)}</strong>
                        <div>
                            ${statusLegend.entries.map((entry) => `<span title="${escapeHtml(entry.detail)}">
                                <i class="fas ${escapeHtml(entry.icon)}"></i>
                                <b>${escapeHtml(entry.label)}</b>
                            </span>`).join('')}
                        </div>
                    </div>` : ''}
                    ${summary.spawnTimeline?.entries?.length ? `<div class="wave-timeline" data-testid="wave-timeline" aria-label="Cadencia de salida enemiga">
                        <strong>Salida enemiga</strong>
                        <div>
                            ${summary.spawnTimeline.entries.map((entry) => `<span class="${entry.danger}">
                                <b>${escapeHtml(entry.etaLabel)}</b>
                                <em>${entry.count > 1 ? `x${entry.count} ` : ''}${escapeHtml(entry.name)}</em>
                            </span>`).join('')}
                            ${summary.spawnTimeline.overflow > 0 ? `<small>+${summary.spawnTimeline.overflow} entradas mas</small>` : ''}
                        </div>
                    </div>` : ''}
                    ${prepPlan.length ? `<div class="wave-prep-plan" data-testid="wave-prep-plan" aria-label="Preparacion recomendada">
                        <strong>Preparacion recomendada</strong>
                        ${prepPlan.map((item) => {
                            const control = buildWavePrepActionControl(item);
                            const attrs = control.actionable
                                ? `type="button" data-prep-action="${item.type}" data-hero-id="${item.heroId}" aria-label="${control.ariaLabel}" title="${control.title}"`
                                : `role="note" aria-label="${control.ariaLabel}"`;
                            return `<${control.tag} class="wave-prep-item ${item.type}" ${attrs}>
                            <span>${item.label}</span>
                            <small>${item.reason}${item.cost ? ` | $${item.cost}` : ''}</small>
                        </${control.tag}>`;
                        }).join('')}
                    </div>` : ''}
                    ${summary.branchOptions?.length ? `<div class="wave-branches" aria-label="Ruta de encuentro">
                        ${summary.branchOptions.map((option) => `<button type="button" data-branch="${option.id}" class="${summary.selectedBranch === option.id ? 'active' : ''}" title="${option.description}">${option.label}</button>`).join('')}
                    </div>` : ''}
                ` : ''}
            `;
            intelEl.querySelectorAll('[data-prep-action]').forEach((button) => button.addEventListener('click', () => {
                const heroId = button.dataset.heroId;
                if (button.dataset.prepAction === 'deploy') {
                    const hero = this.game.activeTeam?.find((candidate) => candidate.id === heroId);
                    if (!hero) return;
                    this.game.inputManager?.setPlacementMode(hero);
                    this.showToast(`${hero.name}: elige una posicion`, 'info');
                    this.game.audio?.play('ui');
                }
                if (button.dataset.prepAction === 'upgrade') {
                    this.quickUpgradeHeroById(heroId);
                }
            }));
            intelEl.querySelectorAll('[data-branch]').forEach((button) => button.addEventListener('click', () => {
                const changed = this.game.waveManager?.chooseBranch(button.dataset.branch);
                if (changed) this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
                this.game.audio?.play('ui');
            }));
        }
        document.getElementById('enemy-info-empty')?.classList.remove('hidden');
        document.getElementById('enemy-info-content')?.classList.add('hidden');
        container.innerHTML = '';

        const categoryColors = {
            Tecnológico: '#40c9ff', Místico: '#b865ff', Urbano: '#e63946',
            Cósmico: '#ff8bd1', Mutante: '#c7f464'
        };

        uniqueEnemies.forEach((enemy) => {
            const intel = buildEnemyIntel(enemy);
            const card = document.createElement('button');
            card.className = `wave-enemy-card ${intel.danger}`;
            card.dataset.testid = 'wave-enemy-card';
            card.style.setProperty('--enemy-color', categoryColors[enemy.category] || '#fca311');
            card.title = `${intel.name} | ${intel.roleLabel} | ${intel.counter} | Amenaza ${intel.threat}/5`;
            card.setAttribute('aria-label', `${intel.name}. ${intel.roleLabel}. Respuesta: ${intel.counter}. Amenaza ${intel.threat} de 5.`);
            const traitsMarkup = intel.traits.map((trait) => `<b>${escapeHtml(trait)}</b>`).join('');
            const portrait = enemy.visual?.portrait || enemy.sprite;
            card.innerHTML = `
                ${portrait
                    ? `<span class="enemy-token enemy-token-sprite"><img src="${escapeHtml(portrait)}" alt="" loading="lazy"></span>`
                    : `<span class="enemy-token">${escapeHtml(intel.initial)}</span>`}
                <span class="enemy-count">x${enemy.previewCount || 1}</span>
                <strong>${escapeHtml(intel.name)}</strong>
                <span class="enemy-role">${escapeHtml(intel.roleLabel)} | ${escapeHtml(intel.pips)}</span>
                <small class="enemy-traits">${traitsMarkup}</small>
                <em><i class="fas fa-crosshairs"></i>${escapeHtml(intel.counter)}</em>
                <small>${enemy.affix?.label ? `${enemy.affix.label} · ` : ''}${enemy.stealth ? 'Sigilo · ' : ''}${'◆'.repeat(Math.max(1, enemy.threat || 1))}</small>
            `;
            card.addEventListener('click', () => this.inspectUnit(enemy, true));
            container.appendChild(card);
        });
    }

    inspectUnit(unit, isEnemyFlag = false) {
        if (!unit) return;
        this.tooltipController.hide();

        const isEnemy = isEnemyFlag || (unit.hp !== undefined && unit.takeDamage !== undefined);
        if (isEnemy) {
            document.getElementById('enemy-info-empty')?.classList.add('hidden');
            document.getElementById('enemy-info-content')?.classList.remove('hidden');
            document.getElementById('en-info-name').textContent = (unit.name || 'Enemigo').toUpperCase();
            document.getElementById('en-info-hp').textContent = `${Math.ceil(unit.hp || 0)} / ${Math.ceil(unit.maxHp || unit.hp || 0)}`;
            document.getElementById('en-info-speed').textContent = Math.round(unit.speed || 0);
            document.getElementById('en-info-armor').textContent = `${Math.round((unit.armor || 0) * 100)}%`;
            document.getElementById('en-info-reward').textContent = `$${unit.reward ?? 10}`;
            document.getElementById('en-info-faction').textContent = unit.faction || 'Independiente';
            document.getElementById('en-info-role').textContent = this.getEnemyRole(unit.archetype, unit.isBoss);
            document.getElementById('en-info-resists').textContent = this.getResistanceText(unit);
            document.getElementById('en-info-threat').textContent = `${unit.threat || 1} / 5`;
            document.getElementById('en-info-phase').textContent = unit.currentPhase || (unit.phases?.length ? `${unit.phases.length} fases` : '-');
            return;
        }

        this.game.pause();
        this.showPanelOverlay(true);
        this.renderHeroDetails(unit);
    }

    renderHeroDetails(hero, detailView = 'summary') {
        const config = hero.config || hero;
        const heroName = hero.name || config.name;
        const level = this.getHeroLevel(hero);
        const bonuses = this.game.progression?.getHeroBonuses(config.id) || {};
        const effectiveStats = hero.getEffectiveStats?.();
        const baseDamage = Math.round(hero.damage || config.damage || 0);
        const baseRange = Math.round(hero.range || config.range || 0);
        const baseFireRate = Number(hero.fireRate || config.fireRate || 1);
        const baseCritChance = Math.round(hero.critChance || config.critChance || 5);
        const damage = Math.round(effectiveStats?.damage || (hero.damage || config.damage || 0) * (1 + (bonuses.damage || 0)));
        const range = Math.round(effectiveStats?.range || (hero.range || config.range || 0) * (1 + (bonuses.range || 0)));
        const fireRate = Number(effectiveStats?.fireRate || (hero.fireRate || config.fireRate || 1) * (1 + (bonuses.fireRate || 0))).toFixed(1);
        const critChance = Math.round(effectiveStats?.critChance || (hero.critChance || config.critChance || 5) + (bonuses.critChance || 0));
        const terrains = this.getTerrainText(hero.allowedTerrains || config.allowedTerrains || [1]);
        const equippedSlots = this.game.progression?.state.equippedItems[config.id] || {};
        const items = hero.items?.length
            ? hero.items
            : Object.values(equippedSlots).map((itemId) => this.game.itemDatabase?.[itemId]).filter(Boolean);
        const equippedItem = items[0] || null;
        const equippedSlot = Object.keys(equippedSlots)[0] || equippedItem?.slot || null;
        const combat = hero.combatStats || {};
        const abilityState = hero.abilitySystem?.getDisplayState?.() || null;
        const kitControl = hero.abilitySystem?.getControlState?.() || null;
        const isUnlocked = this.game.progression?.state.unlockedHeroIds.includes(config.id) ?? true;
        const rarity = normalizeRarity(config.rarity);
        const rarityClass = getRarityClass(rarity);
        const isDeployed = this.game.heroes.includes(hero);
        const repositionPermission = isDeployed ? this.game.tacticalActions?.canReposition(hero) : null;
        const sellPermission = isDeployed ? this.game.tacticalActions?.canSell(hero) : null;
        const activeDetailView = ['equipment', 'combat'].includes(detailView) ? detailView : 'summary';
        const isMaxLevel = level >= HERO_MAX_LEVEL;
        const currentTargeting = hero.targetingPriority || config.targetingPriority || TARGETING_PRIORITIES[0];
        const compactStats = [
            ['Daño', `${damage}${this.formatStatDelta(damage, baseDamage)}`],
            ['Recarga', `${fireRate}/s${this.formatStatDelta(Number(fireRate), baseFireRate, '', 1)}`],
            ['Crítico', `${critChance}%${this.formatStatDelta(critChance, baseCritChance, '%')}`],
            ['Alcance', `${range}${this.formatStatDelta(range, baseRange)}`]
        ];
        const submenuTitles = {
            equipment: 'Equipar objeto',
            combat: 'Registro de combate'
        };
        let submenu = '';

        if (activeDetailView === 'equipment') {
            submenu = `
                <div class="equipment-card">
                    <h3>Equipamiento</h3>
                    <div class="hero-equipment-slots single-equipment-slot">
                        <div class="item-slot ${equippedItem ? 'filled' : ''}">
                            <span>${equippedItem ? `${SLOT_LABELS[equippedItem.slot]} | ${SET_BONUSES[equippedItem.set]?.name || 'Sin familia'}` : 'Objeto'}</span>
                            <strong>${equippedItem?.name || 'Ranura libre'}</strong>
                            ${equippedItem ? `<small>${equippedItem.desc}</small><button class="btn-unequip-modal icon-command" data-slot="${equippedSlot}" title="Desequipar"><i class="fas fa-eject"></i></button>` : '<small>Un solo objeto equipado por heroe.</small>'}
                        </div>
                    </div>
                    <button id="open-inventory-panel" class="btn-primary ghost" ${isUnlocked ? '' : 'disabled'}><i class="fas fa-box-open"></i> ${isUnlocked ? 'Abrir inventario' : 'Recluta para equipar'}</button>
                </div>
            `;
        } else if (activeDetailView === 'combat') {
            submenu = `
                <div class="hero-detail-subpanel detail-card">
                    <h3>Combate</h3>
                    <p><span>Daño total</span><strong>${Math.round(combat.damageDealt || 0)}</strong></p>
                    <p><span>Bajas</span><strong>${combat.kills || 0}</strong></p>
                    <p><span>Disparos</span><strong>${combat.shots || 0}</strong></p>
                    <p><span>Críticos</span><strong>${combat.crits || 0}</strong></p>
                    <p><span>Habilidades</span><strong>${combat.abilityActivations || 0}</strong></p>
                </div>
            `;
        }

        this.panelContent.innerHTML = `
            <div class="hero-detail">
                <section class="hero-portrait ${rarityClass}" data-rarity="${rarity}">
                    <h2>${heroName}</h2>
                    <b class="rarity-badge ${rarityClass}">${rarity}</b>
                    <div class="portrait-frame">${this.renderSprite(this.getHeroDisplaySprite(config), heroName)}</div>
                    <div class="level-chip">Nivel ${level}/${HERO_MAX_LEVEL}</div>
                    ${isUnlocked ? `<div class="upgrade-list">
                        ${[1, 5, 10].map((amount) => {
                            const cost = this.getHeroUpgradeCost(hero, amount);
                            const steps = getHeroLevelUpgradeSteps(level, amount);
                            const label = isMaxLevel ? 'MAX' : `+${steps} $${cost}`;
                            const preview = isMaxLevel ? '' : this.renderHeroLevelPreview(hero, steps);
                            return `<button class="modal-btn-upgrade btn-primary ghost" data-amt="${amount}" data-cost="${cost}" ${isMaxLevel ? 'disabled' : ''}><span>${label}</span>${preview}</button>`;
                        }).join('')}
                    </div>` : '<div class="locked-hero-note"><i class="fas fa-lock"></i> Recluta al héroe para mejorarlo</div>'}
                    ${isDeployed ? `
                        <div class="tactical-actions">
                            <button id="reposition-hero" class="btn-primary ghost" ${repositionPermission?.ok ? '' : 'disabled'} title="${repositionPermission?.reason || 'Mover libremente'}"><i class="fas fa-arrows-alt"></i> Reposicionar</button>
                            <button id="sell-hero" class="btn-primary danger" ${sellPermission?.ok ? '' : 'disabled'} title="${sellPermission?.reason || 'Retirar héroe'}"><i class="fas fa-eject"></i> Retirar</button>
                        </div>
                    ` : ''}
                </section>

                <section class="detail-stack">
                    <div class="hero-summary-card">
                        <div class="hero-stat-strip">
                            ${compactStats.map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`).join('')}
                        </div>

                        <div class="hero-ability-compact">
                            <div>
                                <h3>${config.ability || 'Ataque básico'}</h3>
                                <p>${config.abilityDesc || 'Ataca al enemigo objetivo con su daño base.'}</p>
                            </div>
                            ${config.niche ? `<b>${config.niche}</b>` : ''}
                        </div>

                        <div class="hero-tactic-compact">
                            <div>
                                <small>Terreno</small>
                                <strong>${terrains}</strong>
                            </div>
                            <label>
                                <small>Apuntar a</small>
                                <select id="targeting-select">
                                    ${TARGETING_PRIORITIES.map((priority) => `<option value="${priority}" ${currentTargeting === priority ? 'selected' : ''}>${priority}</option>`).join('')}
                                </select>
                            </label>
                        </div>

                        ${abilityState ? `
                            <div class="ability-status ${abilityState.ready ? 'ready' : ''}">
                                <span>${abilityState.label}</span>
                                ${abilityState.progress === null ? '' : `<div class="ability-meter"><i style="width:${Math.round(abilityState.progress * 100)}%"></i></div>`}
                            </div>
                        ` : ''}
                        ${kitControl ? `
                            <div class="kit-mode-control" role="group" aria-label="${kitControl.label}">
                                <span>${kitControl.label}</span>
                                <div>
                                    ${kitControl.options.map((option) => `<button class="kit-mode-btn ${option.id === kitControl.value ? 'active' : ''}" data-mode="${option.id}" aria-pressed="${option.id === kitControl.value}">${option.label}</button>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div class="hero-detail-actions">
                            <button class="hero-detail-menu-btn ${activeDetailView === 'equipment' ? 'active' : ''}" data-view="equipment"><i class="fas fa-shield-alt"></i><span>Objeto</span></button>
                            <button class="hero-detail-menu-btn ${activeDetailView === 'combat' ? 'active' : ''}" data-view="combat"><i class="fas fa-chart-line"></i><span>Combate</span></button>
                        </div>
                    </div>

                    ${activeDetailView !== 'summary' ? `
                        <section class="hero-submenu">
                            <header>
                                <h3>${submenuTitles[activeDetailView]}</h3>
                                <button class="hero-detail-back icon-command" title="Volver"><i class="fas fa-times"></i></button>
                            </header>
                            ${submenu}
                        </section>
                    ` : ''}
                </section>
            </div>
        `;

        document.getElementById('targeting-select')?.addEventListener('change', (event) => {
            hero.targetingPriority = event.target.value;
            if (hero.config) hero.config.targetingPriority = event.target.value;
        });

        this.panelContent.querySelectorAll('.modal-btn-upgrade').forEach((button) => {
            button.addEventListener('click', () => {
                this.processUpgrade(hero, Number(button.dataset.amt));
            });
        });

        this.panelContent.querySelectorAll('.kit-mode-btn').forEach((button) => button.addEventListener('click', () => {
            if (!hero.abilitySystem?.setCombatMode?.(button.dataset.mode)) return;
            this.showToast(`${kitControl.label}: ${button.textContent}`, 'success');
            this.renderHeroRoster(this.game.activeTeam, (config) => this.game.inputManager.setPlacementMode(config));
            this.renderHeroDetails(hero, activeDetailView);
        }));

        this.panelContent.querySelectorAll('.hero-detail-menu-btn').forEach((button) => {
            button.addEventListener('click', () => this.renderHeroDetails(hero, button.dataset.view || 'summary'));
        });

        this.panelContent.querySelector('.hero-detail-back')?.addEventListener('click', () => {
            this.renderHeroDetails(hero);
        });

        document.getElementById('reposition-hero')?.addEventListener('click', () => {
            if (this.game.inputManager.setRepositionMode(hero)) this.closePanel();
        });

        document.getElementById('sell-hero')?.addEventListener('click', () => {
            const result = this.game.inputManager.sellHero(hero);
            if (result.ok) this.closePanel();
        });


        this.panelContent.querySelectorAll('.btn-unequip-modal').forEach((button) => button.addEventListener('click', () => {
            this.game.progression.unequipItem(config.id, button.dataset.slot);
            this.showToast('Objeto devuelto al inventario', 'success');
            const deployed = this.game.heroes.find((unit) => unit.id === config.id);
            this.renderHeroDetails(deployed || config, 'equipment');
        }));
        document.getElementById('open-inventory-panel')?.addEventListener('click', () => {
            this.inventoryPanel.heroId = config.id;
            this.renderPanel('inventory');
        });
    }

    getHeroLevel(unit) {
        const heroId = unit?.id || unit?.config?.id;
        return this.game.progression?.getHeroLevel?.(heroId) || normalizeHeroLevel(unit?.level ?? unit?.config?.level ?? 1);
    }

    calculateLevelCost(currentLevel, amount = 1) {
        return calculateHeroLevelCost(currentLevel, amount);
    }

    getHeroUpgradeCost(unit, amount = 1) {
        return this.calculateLevelCost(this.getHeroLevel(unit), amount);
    }

    renderHeroLevelPreview(unit, amount = 1) {
        const rows = this.getHeroLevelPreviewRows(unit, amount);
        if (!rows.length) return '';
        return `
            <span class="upgrade-preview" aria-hidden="true">
                ${rows.map((row) => `<em class="${row.value < 0 ? 'negative' : 'positive'}">${row.label} ${this.formatSignedPreviewValue(row.value, row.suffix, row.precision)}</em>`).join('')}
            </span>
        `;
    }

    getHeroLevelPreviewRows(unit, amount = 1) {
        const targetData = unit?.config || unit || {};
        const heroId = targetData.id || unit?.id;
        const currentLevel = this.getHeroLevel(unit);
        const steps = getHeroLevelUpgradeSteps(currentLevel, amount);
        if (!steps) return [];

        const databaseHero = this.game.heroDatabase?.[heroId] || {};
        const baseDamage = Number(targetData.baseDamage ?? databaseHero.baseDamage ?? databaseHero.damage ?? targetData.damage ?? unit?.damage ?? 0);
        const currentDamage = getHeroDamageAtLevel(baseDamage, currentLevel);
        const nextDamage = getHeroDamageAtLevel(baseDamage, currentLevel + steps);
        const rows = [];
        if (nextDamage !== currentDamage) rows.push({ label: 'Dano', value: nextDamage - currentDamage });

        const aura = targetData.supportAura || databaseHero.supportAura;
        const currentAura = getScaledSupportAura(aura, currentLevel);
        const nextAura = getScaledSupportAura(aura, currentLevel + steps);
        const auraDelta = Number(nextAura?.power || 0) - Number(currentAura?.power || 0);
        if (auraDelta) rows.push({ label: 'Aura', value: auraDelta * 100, suffix: '%', precision: 1 });

        return rows;
    }

    formatSignedPreviewValue(value, suffix = '', precision = 0) {
        const amount = Number(value) || 0;
        const fixed = Math.abs(amount).toFixed(precision);
        const clean = precision > 0 ? fixed.replace(/\.0$/, '') : fixed;
        return `${amount >= 0 ? '+' : '-'}${clean}${suffix}`;
    }

    getMissionCredits() {
        const rawCredits = Number(this.game.resourceManager?.credits);
        if (rawCredits === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
        if (Number.isFinite(rawCredits)) return rawCredits;

        const hudCredits = Number(String(this.creditsEl?.textContent || '').replace(/[^\d.-]/g, ''));
        return Number.isFinite(hudCredits) ? hudCredits : 0;
    }

    canAffordHeroUpgrade(unit, amount = 1) {
        const cost = this.getHeroUpgradeCost(unit, amount);
        return Boolean(unit) && Number.isFinite(cost) && this.getMissionCredits() >= cost;
    }

    findDeployedHeroById(heroId) {
        if (!heroId) return null;
        return this.game.heroes?.find((unit) => (unit.id || unit.config?.id) === heroId) || null;
    }

    quickUpgradeHeroById(heroId) {
        return this.quickUpgradeHero(this.findDeployedHeroById(heroId));
    }

    spendMissionCredits(cost) {
        const resources = this.game.resourceManager;
        const amount = Number(cost);
        if (!Number.isFinite(amount) || amount <= 0 || !resources) return false;

        if (resources.removeCredits?.(amount)) return true;

        const visibleCredits = this.getMissionCredits();
        if (visibleCredits < amount) return false;

        resources.credits = visibleCredits;
        if (resources.removeCredits?.(amount)) return true;

        resources.credits = visibleCredits - amount;
        return true;
    }

    refreshHeroUpgradeUi(unit) {
        const resources = this.game.resourceManager || {};
        this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
        this.updateUI(
            resources.lives,
            this.getMissionCredits(),
            this.game.waveManager?.currentWave || 1,
            this.game.fps,
            this.game.stars
        );
        this.game.waveManager?.refreshWaveIntel?.();
        if (unit && !this.overlay?.classList.contains('hidden')) this.renderHeroDetails(unit);
    }

    processUpgrade(unit, amount) {
        const cost = this.getHeroUpgradeCost(unit, amount);
        const steps = getHeroLevelUpgradeSteps(this.getHeroLevel(unit), amount);
        if (!Number.isFinite(cost) || steps <= 0) {
            this.showToast('Este héroe ya está en nivel máximo', 'info');
            this.refreshHeroUpgradeUi(unit);
            return;
        }
        if (!this.spendMissionCredits(cost)) {
            this.showToast('Créditos insuficientes para esta mejora', 'warning');
            return;
        }

        this.applyHeroLevelUpgrade(unit, steps);
        this.game.replaySystem?.record('upgrade', { heroId: unit.id, level: unit.level, cost });
        this.showToast(`${unit.name} subió a nivel ${unit.level}`, 'success');
        this.refreshHeroUpgradeUi(unit);
    }

    quickUpgradeHero(unit) {
        if (!unit) return false;
        const cost = this.getHeroUpgradeCost(unit, 1);
        if (!Number.isFinite(cost) || getHeroLevelUpgradeSteps(this.getHeroLevel(unit), 1) <= 0) {
            this.showToast('Este héroe ya está en nivel máximo', 'info');
            this.refreshHeroUpgradeUi(unit);
            return false;
        }
        if (!this.spendMissionCredits(cost)) {
            this.showToast('Creditos insuficientes para mejora de campo', 'warning');
            this.refreshHeroUpgradeUi(unit);
            return false;
        }

        this.applyHeroLevelUpgrade(unit, 1);
        this.game.replaySystem?.record('upgrade', { heroId: unit.id, level: unit.level, cost, quick: true });
        this.showToast(`${unit.name} nivel ${unit.level} listo para combate`, 'success');
        this.refreshHeroUpgradeUi(unit);
        return true;
    }

    applyHeroLevelUpgrade(unit, amount) {
        const targetData = unit.config || unit;
        const nextLevel = normalizeHeroLevel(this.getHeroLevel(unit) + Math.max(1, Math.floor(Number(amount) || 1)));
        if (targetData.id && this.game.progression?.setHeroLevel) {
            this.game.progression.setHeroLevel(targetData.id, nextLevel, { save: true, sync: false });
        }
        targetData.level = nextLevel;
        targetData.baseDamage = targetData.baseDamage || targetData.damage || unit.damage || 10;
        targetData.baseRange = targetData.baseRange || targetData.range || unit.range || 100;
        targetData.baseFireRate = targetData.baseFireRate || targetData.fireRate || unit.fireRate || 1;
        targetData.damage = getHeroDamageAtLevel(targetData.baseDamage, targetData.level);
        targetData.range = targetData.baseRange;
        targetData.fireRate = targetData.baseFireRate;

        unit.level = nextLevel;
        unit.damage = targetData.damage;
        unit.range = targetData.range;
        unit.fireRate = targetData.fireRate;
        this.game.progression?.applyHeroLevelStats?.(unit);
    }

    refillShop() {
        for (let i = 0; i < 3; i++) {
            if (!this.shopSlots[i] && this.itemPool.length > 0) this.shopSlots[i] = this.itemPool.shift();
        }
    }

    renderPanel(type) {
        const title = {
            profile: 'Perfil',
            radar: 'Radar tactico',
            collection: 'Colección',
            inventory: 'Inventario',
            shop: 'Tienda',
            skins: 'Skins',
            map: 'Mapa',
            settings: 'Ajustes'
        }[type] || type;

        if (type === 'shop') return this.renderShop(title);
        if (type === 'skins') return this.renderSkinShop(title);
        if (type === 'radar') return this.renderRadarPanel(title);
        if (type === 'collection') return this.teamBuilderPanel.render('Constructor de equipo');
        if (type === 'inventory') return this.inventoryPanel.render(title);
        if (type === 'map') return this.renderMap(title);
        if (type === 'settings') return this.renderSettings(title);
        return this.renderProfile(title);
    }

    renderRadarPanel(title = 'Radar tactico') {
        const wave = this.game.waveManager?.currentWave || 1;
        const map = this.game.currentLevel?.theme?.label || this.game.currentLevel?.name || 'Mapa';
        const sections = [
            this.renderRadarSection('wave-intel', 'Inteligencia de oleada', 'fa-satellite-dish', 'La siguiente oleada aun no tiene lectura.'),
            this.renderRadarSection('mission-status', 'Estado de mision', 'fa-flag', 'Sin objetivos especiales activos.'),
            this.renderRadarSection('mode-status', 'Modo especial', 'fa-layer-group', 'Modo campaña estándar.'),
            this.renderRadarSection('spawn-queue', 'Refuerzos en cola', 'fa-person-running', 'No hay refuerzos pendientes.'),
            this.renderRadarSection('boss-hud', 'Jefe activo', 'fa-skull-crossbones', 'No hay jefe activo.'),
            this.renderRadarSection('wave-report', 'Informe de oleada', 'fa-chart-line', 'Completa una oleada para generar informe.'),
            this.renderRadarSection('enemy-info-panel', 'Archivo enemigo', 'fa-skull', 'Selecciona una carta de enemigo en el panel derecho para inspeccionarlo.')
        ].join('');

        this.panelContent.innerHTML = `
            <section class="radar-panel">
                <div class="radar-hero">
                    <div>
                        <span class="briefing-kicker">CONSOLA DE RADAR</span>
                        <h2>${escapeHtml(title)}</h2>
                        <p>Lecturas tacticas, ayudas, reportes y sistemas que antes ocupaban el panel derecho.</p>
                    </div>
                    <div class="radar-readout">
                        <span><small>Mapa</small><b>${escapeHtml(map)}</b></span>
                        <span><small>Oleada</small><b>${wave}</b></span>
                    </div>
                </div>
                <div class="radar-grid">
                    ${sections}
                </div>
            </section>
        `;
        this.bindRadarPanelActions();
    }

    renderRadarSection(sourceId, title, icon, emptyMessage) {
        const source = document.getElementById(sourceId);
        const hidden = source?.classList.contains('hidden');
        const content = source?.innerHTML?.trim();
        const isEmptyEnemyPanel = sourceId === 'enemy-info-panel'
            && !source?.querySelector('#enemy-info-content:not(.hidden)');
        const hasContent = Boolean(content) && !hidden && !isEmptyEnemyPanel;

        return `
            <article class="radar-section radar-section-${sourceId}">
                <header>
                    <i class="fas ${icon}"></i>
                    <strong>${escapeHtml(title)}</strong>
                </header>
                <div class="radar-section-body">
                    ${hasContent ? content : `<p class="radar-empty">${escapeHtml(emptyMessage)}</p>`}
                </div>
            </article>
        `;
    }

    bindRadarPanelActions() {
        this.panelContent.querySelectorAll('[data-prep-action]').forEach((button) => button.addEventListener('click', () => {
            const heroId = button.dataset.heroId;
            if (button.dataset.prepAction === 'deploy') {
                const hero = this.game.activeTeam?.find((candidate) => candidate.id === heroId);
                if (!hero) return;
                this.closePanel();
                this.game.inputManager?.setPlacementMode(hero);
                this.showToast(`${hero.name}: elige una posicion`, 'info');
                this.game.audio?.play('ui');
            }
            if (button.dataset.prepAction === 'upgrade' && this.quickUpgradeHeroById(heroId)) {
                this.renderRadarPanel('Radar tactico');
            }
        }));
        this.panelContent.querySelectorAll('[data-branch]').forEach((button) => button.addEventListener('click', () => {
            const changed = this.game.waveManager?.chooseBranch(button.dataset.branch);
            if (changed) {
                this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
                this.renderRadarPanel('Radar tactico');
            }
            this.game.audio?.play('ui');
        }));
        this.panelContent.querySelector('#wave-report-action')?.addEventListener('click', () => {
            const report = this.lastWaveReport;
            if (!report) return;
            const action = buildWaveReportActionState(
                buildWaveReportState(report),
                this.game.heroes || [],
                this.game.resourceManager?.credits || 0,
                (level, amount) => this.calculateLevelCost(level, amount)
            );
            if (action?.heroId && this.quickUpgradeHeroById(action.heroId)) this.renderRadarPanel('Radar tactico');
        });
        this.panelContent.querySelector('#extract-mode')?.addEventListener('click', () => this.game.modeSystem.extract());
        this.panelContent.querySelector('#repair-mode')?.addEventListener('click', () => this.game.modeSystem.repair());
    }

    renderShop(title) {
        const rotation = this.game.shopSystem.getRotation();
        const funds = this.game.progression.state.metaCredits;
        const fundsText = this.game.progression.state.settings.adminMode ? '∞' : funds;
        const recruitCost = getHeroBoxCost(this.game.progression.state.shop);

        this.panelContent.innerHTML = `
            <div class="panel-title-row"><h2>${title}</h2><strong>${fundsText} Fondos S.H.I.E.L.D.</strong></div>
            <div class="shop-layout">
                <section class="shop-feature">
                    <h3>Caja S.H.I.E.L.D.</h3>
                    <p>Recluta un héroe sin duplicados. Tras cuatro aperturas comunes, la siguiente garantiza Rare o superior.</p>
                    <div class="pity-track">Garantía: ${Math.min(4, this.game.progression.state.shop.heroPity)}/4</div>
                    <button class="btn-primary" id="gacha-btn">RECLUTAR POR ${recruitCost} F</button>
                    <div id="gacha-res" class="result-copy"></div>
                </section>
                <section>
                    <h3>Arsenal progresivo</h3>
                    <p class="empty-copy">Se muestran los 3 objetos mas basicos disponibles. Al comprar uno, entra el siguiente del arsenal.</p>
                    <div class="shop-grid">
                        ${rotation.map((slot) => this.renderShopItem(slot.item, slot.purchased)).join('') || '<p class="empty-copy">Arsenal completado.</p>'}
                    </div>
                </section>
            </div>
        `;

        document.getElementById('gacha-btn')?.addEventListener('click', () => this.handleGacha());
        this.panelContent.querySelectorAll('.btn-buy-item').forEach((button) => {
            button.addEventListener('click', () => this.buyItem(button.dataset.id));
        });
    }

    formatStatDelta(current, base, suffix = '', decimals = 0) {
        const difference = current - base;
        if (Math.abs(difference) < 0.001) return '';
        const value = Math.abs(difference).toFixed(decimals);
        return `<small class="stat-delta ${difference < 0 ? 'negative' : ''}">${difference > 0 ? '+' : '-'}${value}${suffix}</small>`;
    }

    renderShopItem(item, purchased = false) {
        if (!item) return '<div class="shop-card empty-copy">Agotado</div>';
        const owned = this.game.progression.getOwnedQuantity(item.id);
        const rarity = normalizeRarity(item.rarity);
        const rarityClass = getRarityClass(rarity);
        const summary = this.nextWaveSummary || (!this.game.waveManager?.isWaveActive ? this.game.waveManager?.buildPreparedSummary?.() : null);
        const insight = buildShopItemInsight(item, summary);
        const setProgress = buildShopSetProgress(
            item,
            this.game.progression.state.ownedItemIds,
            this.game.progression.state.equippedItems,
            this.game.itemDatabase
        );
        return `
            <div class="shop-card ${rarityClass} ${purchased ? 'purchased' : ''}" data-rarity="${rarity}">
                <div class="item-badge rarity-badge ${rarityClass}">${rarity}</div>
                <div class="shop-item-heading">
                    ${this.renderSprite(item.icon, item.name)}
                    <div><small>${SLOT_LABELS[item.slot]} · ${SET_BONUSES[item.set]?.name || item.set}</small><h4>${item.name}</h4></div>
                </div>
                <p>${item.desc}</p>
                <div class="shop-insight ${insight.tone}" aria-label="Recomendado por ${escapeHtml(insight.reasons.join(', '))}">
                    <strong>${escapeHtml(insight.label)}</strong>
                    <span>${insight.reasons.map(escapeHtml).join(' | ')}</span>
                </div>
                ${setProgress ? `<div class="shop-set-progress ${setProgress.status}" aria-label="${escapeHtml(setProgress.ariaLabel)}">
                    <strong>${escapeHtml(setProgress.label)}</strong>
                    <span>${escapeHtml(setProgress.detail)}</span>
                </div>` : ''}
                <small>Copias disponibles: ${owned}</small>
                <button class="btn-buy-item btn-primary ghost" data-id="${item.id}" ${purchased ? 'disabled' : ''}>${purchased ? 'ADQUIRIDO' : `${item.price} F`}</button>
            </div>
        `;
    }

    buyItem(itemId) {
        const result = this.game.shopSystem.purchaseItem(itemId);
        if (!result.ok) {
            this.showToast(result.reason, 'warning');
            return;
        }
        this.showToast(`${result.item.name} comprado`, 'success');
        this.renderShop('Tienda');
    }

    renderSkinShop(title = 'Skins') {
        this.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong>Próximamente</strong>
            </div>
            <section class="skins-shop-panel">
                <div>
                    <span class="briefing-kicker">TIENDA COSMÉTICA</span>
                    <h3>Skins de héroes</h3>
                    <p>Este menú queda reservado para skins cuando estén listas.</p>
                </div>
                <i class="fas fa-shirt"></i>
            </section>
        `;
    }

    renderProfile(title) {
        this.profilePanel.render(title);
    }

    renderMap(title) {
        this.campaignPanel.render(title);
    }

    renderMissionBriefing(level) {
        this.campaignPanel.renderBriefing(level);
    }

    renderSettings(title) {
        this.settingsPanel.render(title);
    }

    renderStarterSelector(starters, onSelect) {
        this.game.pause();
        this.showPanelOverlay(false);

        this.panelContent.innerHTML = `
            <div class="starter-header">
                <h2>Elige tu héroe inicial</h2>
                <p>Tu primera defensa define el ritmo de las primeras oleadas.</p>
            </div>
            <div class="starter-grid">
                ${starters.map((hero) => {
                    const rarity = normalizeRarity(hero.rarity);
                    const rarityClass = getRarityClass(rarity);
                    return `
                    <button class="starter-card ${rarityClass}" data-id="${hero.id}" data-testid="starter-${hero.id}" data-rarity="${rarity}">
                        ${this.renderSprite(this.getHeroDisplaySprite(hero), hero.name)}
                        <strong>${hero.name}</strong>
                        <span>${hero.category} | <b class="rarity-badge ${rarityClass}">${rarity}</b> | despliegue libre</span>
                    </button>
                `;
                }).join('')}
            </div>
        `;

        this.panelContent.querySelectorAll('.starter-card').forEach((card) => {
            card.addEventListener('click', () => {
                const selected = starters.find((hero) => hero.id === card.dataset.id);
                document.getElementById('close-panel-btn')?.classList.remove('hidden');
                this.closePanel();
                onSelect(selected);
            });
        });
    }

    renderHeroRoster(activeTeam, onSelect) {
        if (!this.heroGrid) return;
        this.heroGrid.innerHTML = '';
        const waveSummary = this.nextWaveSummary || (!this.game.waveManager?.isWaveActive ? this.game.waveManager?.buildPreparedSummary?.() : null);
        const credits = this.game.resourceManager?.credits || 0;

        activeTeam.forEach((hero) => {
            const deployedHero = this.game.heroes.find((unit) => unit.id === hero.id);
            const deployed = Boolean(deployedHero);
            const fit = evaluateHeroWaveFit(deployedHero || hero, waveSummary, credits);
            const quickUpgradeCost = deployedHero ? this.getHeroUpgradeCost(deployedHero, 1) : 0;
            const canQuickUpgrade = this.canAffordHeroUpgrade(deployedHero, 1);
            const quickUpgradeTooltip = Number.isFinite(quickUpgradeCost) ? `Mejora rapida $${quickUpgradeCost}` : 'Nivel maximo';
            const targetingState = deployedHero ? buildTargetingControlState(deployedHero.targetingPriority || hero.targetingPriority) : null;
            const rarity = normalizeRarity(hero.rarity);
            const rarityClass = getRarityClass(rarity);
            const card = document.createElement('article');
            card.className = `hero-card ${rarityClass} ${deployed ? 'deployed' : ''} wave-fit-${fit.id}`;
            card.dataset.testid = `hero-card-${hero.id}`;
            card.dataset.rarity = rarity;
            card.dataset.waveFit = fit.id;
            card.innerHTML = `
                <div class="hero-card-sprite">${this.renderSprite(this.getHeroDisplaySprite(hero), hero.name)}</div>
                <div>
                    <div class="hero-card-heading">
                        <strong>${hero.name}</strong>
                        <span class="rarity-badge ${rarityClass}">${rarity}</span>
                    </div>
                </div>
                <div class="hero-actions">
                    <button class="btn-action place-btn" data-testid="hero-place-${hero.id}" title="${deployed ? 'Reposicionar' : 'Colocar'}" aria-label="${deployed ? 'Reposicionar' : 'Colocar'}" data-tooltip="${deployed ? 'Mover libremente' : 'Colocar héroe gratis'}"><i class="fas ${deployed ? 'fa-arrows-alt' : 'fa-map-marker-alt'}"></i></button>
                    ${deployedHero ? `<button class="btn-action upgrade-btn ${canQuickUpgrade ? '' : 'is-unaffordable'}" data-testid="hero-upgrade-${hero.id}" data-quick-upgrade-id="${hero.id}" data-affordable="${canQuickUpgrade ? 'true' : 'false'}" title="Mejorar en campo" aria-label="Mejorar ${hero.name}" data-tooltip="${quickUpgradeTooltip}"><i class="fas fa-arrow-up"></i></button>` : ''}
                    ${targetingState ? `<button class="btn-action target-btn" data-testid="hero-target-${hero.id}" title="${targetingState.tooltip}" aria-label="${targetingState.ariaLabel}" data-tooltip="${targetingState.tooltip}"><i class="fas ${targetingState.icon}"></i><span>${targetingState.label}</span></button>` : ''}
                    <button class="btn-action stats-btn" title="Mejoras" aria-label="Mejoras" data-tooltip="Estadísticas y mejoras"><i class="fas fa-chart-bar"></i></button>
                </div>
            `;
            card.querySelector('.place-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                if (deployedHero) this.game.inputManager.setRepositionMode(deployedHero);
                else onSelect(hero);
            });
            card.querySelector('.stats-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                const deployedHero = this.findDeployedHeroById(hero.id);
                this.inspectUnit(deployedHero || hero);
            });
            card.querySelector('.target-btn')?.addEventListener('click', (event) => {
                event.stopPropagation();
                const nextPriority = getNextTargetingPriority(deployedHero.targetingPriority || hero.targetingPriority);
                deployedHero.targetingPriority = nextPriority;
                if (deployedHero.config) deployedHero.config.targetingPriority = nextPriority;
                hero.targetingPriority = nextPriority;
                this.showToast(`${deployedHero.name || hero.name}: objetivo ${nextPriority}`, 'info');
                this.renderHeroRoster(this.game.activeTeam, (config) => this.game.inputManager.setPlacementMode(config));
            });
            this.heroGrid.appendChild(card);
        });
        this.renderOnboardingCoach();
    }

    buildGachaRevealSequence(finalHero, count = 12) {
        const roster = Object.values(this.game.heroDatabase || {})
            .filter((hero) => hero.visual && hero.id !== finalHero.id);
        const seed = `${finalHero.id}:${Date.now()}`;
        const score = (hero) => [...`${seed}:${hero.id}`]
            .reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
        const ordered = [...roster].sort((a, b) => score(a) - score(b));
        return [...ordered.slice(0, count - 1), finalHero];
    }

    renderGachaReveal(result) {
        const hero = result.hero;
        const rarity = normalizeRarity(hero.rarity);
        const rarityClass = getRarityClass(rarity);
        const sequence = this.buildGachaRevealSequence(hero);
        const firstPreview = sequence[0] || hero;
        const firstRarity = normalizeRarity(firstPreview.rarity);
        const firstRarityClass = getRarityClass(firstRarity);
        return `
            <div class="gacha-reveal ${firstRarityClass}" data-final-rarity-class="${rarityClass}" data-rarity="${firstRarity}" data-final-rarity="${rarity}">
                <div class="gacha-aura"></div>
                <div class="gacha-case">
                    <i class="fas fa-box-open"></i>
                    <span>Caja S.H.I.E.L.D.</span>
                </div>
                <button class="gacha-skip-btn btn-primary ghost" type="button"><i class="fas fa-forward"></i> Saltear</button>
                <div class="gacha-roller" aria-hidden="true">
                    <div class="gacha-roll-sprite">${this.renderSprite(this.getHeroDisplaySprite(firstPreview), firstPreview.name)}</div>
                </div>
                <div class="gacha-final">
                    <span class="rarity-badge ${rarityClass}">${rarity}</span>
                    <strong>${hero.name}</strong>
                    <small>${result.guaranteed ? 'Garantia activada' : 'Nuevo recluta'}</small>
                </div>
            </div>
        `;
    }

    startGachaRevealAnimation(result, onComplete = () => {}) {
        const reveal = document.querySelector('#gacha-res .gacha-reveal');
        const slot = reveal?.querySelector('.gacha-roll-sprite');
        const finalCopy = reveal?.querySelector('.gacha-final');
        const skipButton = reveal?.querySelector('.gacha-skip-btn');
        if (!reveal || !slot || !finalCopy) {
            onComplete();
            return;
        }

        const sequence = this.buildGachaRevealSequence(result.hero);
        const delays = [320, 360, 400, 440, 500, 560, 640, 720, 820, 940, 1080, 1220];
        let index = 0;
        let finished = false;

        this.gachaRevealTimers.forEach((timer) => window.clearTimeout(timer));
        this.gachaRevealTimers = [];

        const applyEntry = (entry) => {
            const rarity = normalizeRarity(entry.rarity);
            const rarityClass = getRarityClass(rarity);
            reveal.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary', 'rarity-mythic', 'rarity-secret');
            reveal.classList.add(rarityClass);
            reveal.dataset.rarity = rarity;
            slot.innerHTML = this.renderSprite(this.getHeroDisplaySprite(entry), entry.name);
            slot.classList.remove('tick');
            void slot.offsetWidth;
            slot.classList.add('tick');
        };

        const finishReveal = () => {
            if (finished) return;
            finished = true;
            this.gachaRevealTimers.forEach((timer) => window.clearTimeout(timer));
            this.gachaRevealTimers = [];
            applyEntry(result.hero);
            reveal.classList.add('is-final');
            finalCopy.classList.add('is-visible');
            skipButton?.classList.add('hidden');
            onComplete();
        };

        const showEntry = () => {
            if (finished) return;
            const entry = sequence[Math.min(index, sequence.length - 1)];
            applyEntry(entry);

            if (index >= sequence.length - 1) {
                finishReveal();
                return;
            }

            const delay = delays[Math.min(index, delays.length - 1)];
            index += 1;
            this.gachaRevealTimers.push(window.setTimeout(showEntry, delay));
        };

        skipButton?.addEventListener('click', finishReveal, { once: true });
        Promise.resolve(this.game.assetPreloader?.preloadHeroes?.(sequence))
            .catch(() => null)
            .finally(() => {
                if (finished) return;
                this.gachaRevealTimers.push(window.setTimeout(showEntry, 220));
            });
    }

    handleGacha() {
        const result = this.game.shopSystem.recruitHero();
        if (!result.ok) {
            this.showToast(result.reason, 'warning');
            return;
        }

        const button = document.getElementById('gacha-btn');
        const resultNode = document.getElementById('gacha-res');
        if (button) button.disabled = true;
        if (resultNode) resultNode.innerHTML = this.renderGachaReveal(result);

        this.showToast(`${result.hero.name} se unio a la plantilla`, 'success');
        this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));

        const fundsLabel = this.panelContent.querySelector('.panel-title-row strong');
        if (fundsLabel) {
            const fundsText = this.game.progression.state.settings.adminMode ? '∞' : this.game.progression.state.metaCredits;
            fundsLabel.textContent = `${fundsText} Fondos S.H.I.E.L.D.`;
        }
        const pityTrack = this.panelContent.querySelector('.pity-track');
        if (pityTrack) pityTrack.textContent = `Garantia: ${Math.min(4, this.game.progression.state.shop.heroPity)}/4`;

        this.startGachaRevealAnimation(result, () => {
            const nextPool = Object.values(this.game.heroDatabase || {})
                .filter((hero) => hero.visual)
                .filter((hero) => !this.game.progression.state.unlockedHeroIds.includes(hero.id));
            if (button) {
                button.disabled = nextPool.length === 0;
                const nextCost = getHeroBoxCost(this.game.progression.state.shop);
                button.textContent = nextPool.length === 0 ? 'PLANTILLA COMPLETA' : `RECLUTAR POR ${nextCost} F`;
            }
        });
    }
    showGameOver() {
        this.game.audio?.play('warning');
        this.showPanelOverlay(false);
        const modeSnapshot = this.game.modeSystem?.getSnapshot();
        this.panelContent.innerHTML = `
            <div class="end-state">
                <h2>${modeSnapshot ? `${modeSnapshot.name}: finalizada` : 'Base destruida'}</h2>
                <p>Llegaste hasta la oleada ${this.game.waveManager?.currentWave || 1}.${modeSnapshot ? ` Puntuación ${modeSnapshot.score}.` : ' Ajusta el equipo y vuelve a intentarlo.'}</p>
                ${this.renderMissionSummary(this.game.progression?.state.lastMissionSummary)}
                <button class="btn-primary" id="retry-run">Reintentar</button>
            </div>
        `;
        document.getElementById('retry-run')?.addEventListener('click', () => {
            if (modeSnapshot) this.game.modeSystem.start(modeSnapshot.id);
            else this.game.retryCampaignFromFirstWave?.();
            this.renderHeroRoster(this.game.activeTeam, (hero) => this.game.inputManager.setPlacementMode(hero));
            this.closePanel();
            this.game.start();
        });
    }

    showVictory() {
        this.game.audio?.play('victory');
        const modeSnapshot = this.game.modeSystem?.getSnapshot();
        if (modeSnapshot) {
            this.showModeResult(`${modeSnapshot.name}: completado`, modeSnapshot);
            return;
        }
        this.showPanelOverlay(false);
        this.panelContent.innerHTML = `
            <div class="end-state">
                <h2>Victoria</h2>
                <p>Completaste el mapa con ${this.game.stars} estrellas.</p>
                ${this.renderMissionSummary(this.game.progression?.state.lastMissionSummary)}
                <button class="btn-primary" id="victory-close">Volver al mapa</button>
            </div>
        `;
        document.getElementById('victory-close')?.addEventListener('click', () => {
            document.getElementById('close-panel-btn')?.classList.remove('hidden');
            this.closePanel();
        });
    }

    renderMissionSummary(summary) {
        if (!summary) return '';
        return `<div class="mission-summary"><strong>Informe de mision</strong><span><b>${Math.round(summary.totals.damage)}</b> dano</span><span><b>${summary.totals.kills}</b> bajas</span><span><b>${summary.totals.abilities}</b> habilidades</span><span><b>$${Math.round(summary.totals.credits)}</b> generados</span><small>Destacado: ${summary.bestHero} · ${summary.lives} vidas restantes</small></div>`;
    }

    showFatalError(error) {
        this.game?.pause?.();
        this.showPanelOverlay(false);
        this.panelContent.innerHTML = `
            <div class="end-state error-state" role="alert">
                <i class="fas fa-triangle-exclamation"></i>
                <h2>No se pudo iniciar la misión</h2>
                <p id="fatal-error-copy"></p>
                <button class="btn-primary" id="reload-game">Reintentar carga</button>
            </div>
        `;
        document.getElementById('fatal-error-copy').textContent = error?.message || 'Revisa los datos del juego e inténtalo nuevamente.';
        document.getElementById('reload-game')?.addEventListener('click', () => window.location.reload());
    }

    getTerrainText(terrains) {
        return getAllowedTerrainLabels(terrains);
    }

    getEnemyRole(archetype, isBoss = false) {
        return ENEMY_ROLE_COPY[archetype] || (isBoss ? 'Jefe' : 'Soldado');
    }

    getResistanceText(unit) {
        const labels = Object.entries(unit.resistances || {})
            .filter(([, value]) => value > 0)
            .map(([type, value]) => `${type} ${Math.round(value * 100)}%`);
        if (unit.statusResistance > 0) labels.push(`Estados ${Math.round(unit.statusResistance * 100)}%`);
        if (unit.stealth) labels.push('Detección requerida');
        return labels.join(', ') || 'Ninguna';
    }

    renderSprite(src, name) {
        if (!src) return `<span class="sprite-fallback">${name.charAt(0)}</span>`;
        return `<img src="${versionAssetSource(src)}" alt="${name}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'sprite-fallback', textContent: '${name.charAt(0)}' }))">`;
    }

    getHeroDisplaySprite(hero) {
        if (!hero) return null;
        const config = hero.config || hero;
        if (config.id === 'iron_man' || config.id === 'spiderman') {
            return config.visual?.idle?.south
                || config.visual?.sprites?.south
                || config.visual?.portrait
                || config.sprite;
        }
        return config.visual?.portrait || config.sprite;
    }
}
