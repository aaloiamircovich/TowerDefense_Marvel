import { CampaignPanel } from '../ui/CampaignPanel.js';
import { ProfilePanel } from '../ui/ProfilePanel.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import { TooltipController } from '../ui/TooltipController.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { TeamBuilderPanel } from '../ui/TeamBuilderPanel.js';
import { ModePanel } from '../ui/ModePanel.js';
import { WaveReportPanel } from '../ui/WaveReportPanel.js';
import { RadarPanel } from '../ui/RadarPanel.js';
import { ShopPanel } from '../ui/ShopPanel.js';
import { StarterPanel } from '../ui/StarterPanel.js';
import { EndStatePanel } from '../ui/EndStatePanel.js';
import { HeroRosterPanel } from '../ui/HeroRosterPanel.js';
import { SET_BONUSES, SLOT_LABELS } from './ItemEffectSystem.js';
import { getAllowedTerrainLabels } from '../utils/TerrainRules.js';
import { getRarityClass, normalizeRarity } from '../utils/Rarity.js';
import { HERO_MAX_LEVEL, calculateHeroLevelCost, getHeroDamageAtLevel, getHeroLevelUpgradeSteps, getScaledSupportAura, normalizeHeroLevel } from '../utils/HeroLevel.js';
import { pickHeroDisplaySprite } from '../utils/HeroVisuals.js';
import { CAMPAIGN_MAX_WAVES, MINI_BOSS_WAVE_INTERVAL } from '../utils/LevelProgression.js';

const ASSET_VERSION = 'evolution-enemy-sprites-20260812';

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
        secondary: perfectBonus > 0 ? `${bossCopy}${tierLabel} | ${score}${bonusCopy}` : `${bossCopy}${tierLabel} \u00B7 ${score}`,
        ariaLabel: `${primary}. ${bossCopy}${tierLabel}. Puntaje ${score}.${perfectBonus > 0 ? ` Bonus perfecto ${perfectBonus}.` : ''}${bossWarning}`,
        tooltip: bossMilestone?.warning || summary?.threatTier?.advice || 'Iniciar siguiente oleada'
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

const COUNTER_COPY = {
    detection: {
        label: 'Deteccion',
        detail: 'revela sigilo y faseadores',
        icon: 'fa-eye',
        missing: 'Sin detector',
        bench: 'Detector en banco',
        ready: 'Detector en campo'
    },
    piercing: {
        label: 'Perforacion',
        detail: 'rompe blindaje y barreras',
        icon: 'fa-bullseye',
        missing: 'Sin perforacion',
        bench: 'Perforacion en banco',
        ready: 'Perforacion lista'
    },
    control: {
        label: 'Control',
        detail: 'corta corredores antes de meta',
        icon: 'fa-hand-paper',
        missing: 'Sin control',
        bench: 'Control en banco',
        ready: 'Control activo'
    },
    reach: {
        label: 'Alcance',
        detail: 'cubre voladores y rutas largas',
        icon: 'fa-location-arrow',
        missing: 'Sin alcance',
        bench: 'Alcance en banco',
        ready: 'Alcance listo'
    },
    focus: {
        label: 'Foco',
        detail: 'elimina soporte e invocadores',
        icon: 'fa-crosshairs',
        missing: 'Sin foco claro',
        bench: 'Foco en banco',
        ready: 'Foco listo'
    },
    dps: {
        label: 'DPS',
        detail: 'sostiene jefes y elites',
        icon: 'fa-bolt',
        missing: 'DPS bajo',
        bench: 'DPS en banco',
        ready: 'DPS en campo'
    }
};

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatCompactMetric(value = 0) {
    const amount = Math.max(0, Number(value) || 0);
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
    return `${Math.round(amount)}`;
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

function setHudResourceElement(element, value = 0) {
    if (!element) return;
    const exact = value === Number.POSITIVE_INFINITY ? 'Infinity' : `${Math.floor(Math.max(0, Number(value) || 0))}`;
    element.textContent = formatHudResource(value);
    if (!element.dataset) element.dataset = {};
    element.dataset.value = exact;
    element.title = exact === 'Infinity' ? 'Recursos infinitos' : exact;
}

export function buildEnemyTraitPreview(traits = [], limit = 3) {
    const uniqueTraits = [...new Set((traits || []).filter(Boolean))];
    const visible = uniqueTraits.slice(0, Math.max(1, Number(limit) || 3));
    return {
        visible,
        overflow: Math.max(0, uniqueTraits.length - visible.length),
        title: uniqueTraits.join(', ')
    };
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

    let counterId = 'dps';
    let counter = 'Dano estable';
    let counterDetail = 'Dano constante y buena posicion bastan contra esta amenaza.';
    if (enemy.isBoss) {
        counter = 'DPS sostenido';
        counterDetail = enemy.isFinalBoss
            ? 'Si el jefe final llega a la base pierdes; concentra dano, control y perforacion.'
            : 'Si el jefe llega a la base pierdes; sube dano y mantenlo controlado en curvas.';
    } else if (enemy.stealth || enemy.archetype === 'stealth' || enemy.archetype === 'phaser') {
        counterId = 'detection';
        counter = 'Deteccion';
        counterDetail = 'Requiere heroes con vision de sigilo; sin deteccion puede cruzar sin recibir foco.';
    } else if (enemy.archetype === 'support' || enemy.healPower > 0) {
        counterId = 'focus';
        counter = 'Foco al soporte';
        counterDetail = 'Cura o protege a la oleada; priorizalo antes que tanques y soldados.';
    } else if (enemy.archetype === 'summoner' || enemy.summonId) {
        counterId = 'focus';
        counter = 'Corta invocador';
        counterDetail = 'Genera refuerzos; eliminarlo temprano reduce la saturacion del camino.';
    } else if (enemy.archetype === 'commander' || enemy.auraPower) {
        counterId = 'focus';
        counter = 'Elimina aura';
        counterDetail = 'Potencia enemigos cercanos; cae primero para bajar la presion general.';
    } else if ((enemy.armor || 0) >= 0.25 || enemy.barrierRatio > 0 || ['tank', 'shield'].includes(enemy.archetype)) {
        counterId = 'piercing';
        counter = 'Perforacion';
        counterDetail = 'Blindaje o barrera reducen dano plano; usa perforacion, armor break o criticos altos.';
    } else if (enemy.archetype === 'runner' || Number(enemy.speed || 0) >= 85) {
        counterId = 'control';
        counter = 'Control';
        counterDetail = 'Velocidad alta; slow, stun o web en curvas evita fugas tempranas.';
    } else if (enemy.archetype === 'flying' || enemy.flying) {
        counterId = 'reach';
        counter = 'Alcance';
        counterDetail = 'Amenaza de ruta larga; conviene rango alto, cadenas o cobertura cruzada.';
    }

    const danger = enemy.isBoss || threat >= 5 ? 'critical' : threat >= 4 ? 'high' : threat >= 3 ? 'guarded' : 'low';
    return {
        name: enemy.name || 'Enemigo',
        initial: (enemy.name || '?').charAt(0).toUpperCase(),
        roleLabel,
        traits: traits.slice(0, 4),
        counterId,
        counter,
        counterDetail,
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

function heroHasReach(hero = {}) {
    const config = getHeroConfig(hero);
    const stats = hero.getEffectiveStats?.() || hero;
    return Number(stats.range || hero.range || config.range || 0) >= 150
        || hasTextMatch(config, ['alcance', 'francotirador', 'larga distancia', 'rebote', 'cadena']);
}

function heroHasFocusDamage(hero = {}) {
    const config = getHeroConfig(hero);
    const dps = getHeroDps(hero);
    return dps >= 34
        || Number(config.teamMetrics?.damage || hero.teamMetrics?.damage || 0) >= 4
        || hasTextMatch(config, ['critico', 'boss', 'jefe', 'ejecucion', 'burst', 'marca']);
}

function heroCoversCounter(hero = {}, counterId = '') {
    if (counterId === 'detection') return heroDetectsStealth(hero);
    if (counterId === 'piercing') return heroPiercesArmor(hero);
    if (counterId === 'control') return heroControlsCrowd(hero);
    if (counterId === 'reach') return heroHasReach(hero);
    if (counterId === 'focus' || counterId === 'dps') return heroHasFocusDamage(hero);
    return false;
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

export const TACTICAL_COUNTER_LEGEND = Object.entries(COUNTER_COPY)
    .map(([id, copy]) => ({ id, label: copy.label, detail: copy.detail, icon: copy.icon }));

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
    add((effects.armorPenetration || effects.armorBreakChance || effects.armorDamagePct) && (summary?.armoredCount > 0 || summary?.barrierCount > 0 || (summary?.roles || []).some((role) => ['tank', 'shield'].includes(role))), 'rompe blindaje');
    add((effects.slowChance || effects.stunChance) && ((summary?.roles || []).includes('runner') || Number(summary?.fastest || 0) >= 90), 'frena corredores');
    add((effects.damagePct || effects.fireRatePct || effects.critChance || effects.critDamageBonus || effects.consecutiveDamagePct || effects.bossDamagePct) && (summary?.hasBoss || Number(summary?.pressureScore || 0) >= 16), 'sube DPS');
    add((effects.chainCount || effects.splashRadius) && Number(summary?.total || 0) >= 8, 'limpia grupos');
    add(effects.rangePct && ((summary?.roles || []).includes('flying') || Number(summary?.fastest || 0) >= 90), 'mejora cobertura');
    add(effects.allowWater || effects.allowGrass || effects.allowMountain, 'abre posiciones');
    add(effects.onHitCredit || effects.onHitCreditPct, 'economia por impacto');
    add(effects.burnChance || effects.poisonChance || effects.curseChance || effects.statusDamagePct, 'escala con estados');
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
        label = 'Defensa perfecta';
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
            missing: Math.ceil(cost - available),
            available: Math.floor(available),
            cost,
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
        available: Math.floor(available),
        remaining: Math.max(0, Math.floor(available - cost)),
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
        this.bossCountdownEl = document.getElementById('ui-boss-countdown');
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
        this.activePanelType = null;
        this.combatPressureSignature = '';
        this.dismissedOnboardingSteps = new Set();
        this.profilePanel = new ProfilePanel(this);
        this.campaignPanel = new CampaignPanel(this);
        this.settingsPanel = new SettingsPanel(this);
        this.inventoryPanel = new InventoryPanel(this);
        this.teamBuilderPanel = new TeamBuilderPanel(this);
        this.modePanel = new ModePanel(this);
        this.waveReportPanel = new WaveReportPanel(this, {
            buildState: buildWaveReportState,
            buildAction: buildWaveReportActionState
        });
        this.radarPanel = new RadarPanel(this, {
            buildWaveReportState,
            buildWaveReportActionState
        });
        this.shopPanel = new ShopPanel(this, {
            buildShopItemInsight,
            buildShopSetProgress
        });
        this.starterPanel = new StarterPanel(this);
        this.endStatePanel = new EndStatePanel(this);
        this.heroRosterPanel = new HeroRosterPanel(this, {
            buildTargetingControlState,
            getNextTargetingPriority
        });
        this.tooltipController = new TooltipController();

        this.initListeners();
        this.renderOnboardingCoach();
    }

    initListeners() {
        document.querySelectorAll('.hub-btn').forEach((button) => {
            button.addEventListener('click', () => this.handleHubButtonClick(button.dataset.panel));
        });

        document.getElementById('close-panel-btn')?.addEventListener('click', () => this.closePanel());
        this.overlay?.addEventListener('pointerdown', (event) => this.handlePanelBackdropPointerDown(event));
        document.getElementById('next-wave-btn')?.addEventListener('click', () => {
            if (this.game.waveManager && !this.game.waveManager.isWaveActive) this.game.waveManager.startNextWave();
        });

        const btnPause = document.getElementById('btn-pause');
        const btnAuto = document.getElementById('btn-auto');
        const btnSpeed = document.getElementById('btn-speed');

        this.updateSpeedButton(btnSpeed);

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
            this.updateSpeedButton(btnSpeed);
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

    handleHubButtonClick(type) {
        const closeButtonHidden = document.getElementById('close-panel-btn')?.classList.contains('hidden');
        const panelOpen = !this.overlay?.classList.contains('hidden');
        if (type && this.activePanelType === type && panelOpen && !closeButtonHidden) {
            this.closePanel();
            return;
        }
        this.openPanel(type);
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
        this.shopPanel?.clearGachaRevealTimers?.();
        this.hidePanelOverlay();
        this.setActiveHubButton(null);
        if (!document.body.classList.contains('title-screen-active') && !this.game.isManuallyPaused && !this.game.isGameOver) this.game.start();
        const restoreFocus = this.lastFocusedElement;
        this.lastFocusedElement = null;
        if (restoreFocus?.isConnected !== false) restoreFocus?.focus?.();
    }

    setActiveHubButton(type = null) {
        this.activePanelType = type || null;
        document.querySelectorAll?.('.hub-btn').forEach((button) => {
            const active = Boolean(type && button.dataset.panel === type);
            button.classList.toggle('active', active);
            button.setAttribute('aria-current', active ? 'dialog' : 'false');
            button.setAttribute('aria-expanded', String(active));
            button.setAttribute('aria-controls', 'panel-container');
        });
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

    handlePanelBackdropPointerDown(event) {
        if (event.target !== this.overlay) return;
        if (document.getElementById('close-panel-btn')?.classList.contains('hidden')) return;
        event.preventDefault();
        this.closePanel();
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

    updateSpeedButton(button = document.getElementById('btn-speed')) {
        if (!button) return;
        const speed = Number(this.game?.gameSpeed || 1);
        const label = `Cambiar velocidad de juego. Velocidad actual x${speed}`;
        button.innerHTML = `x${speed} <i class="fas fa-rocket"></i>`;
        button.setAttribute('aria-label', label);
        button.title = `Velocidad actual x${speed}`;
        button.dataset.tooltip = `Velocidad actual x${speed}`;
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

    shouldShowFps() {
        return this.game.progression?.state.settings?.showFps === true;
    }

    updateFpsDisplay(text, { warning = false, title = '' } = {}) {
        if (!this.fpsEl) return;
        const visible = this.shouldShowFps();
        this.fpsEl.classList?.toggle('hidden', !visible);
        this.fpsEl.classList?.toggle('performance-warning', visible && warning);
        if (!visible) {
            this.fpsEl.removeAttribute?.('title');
            return;
        }
        this.fpsEl.textContent = text;
        if (title) this.fpsEl.title = title;
        else this.fpsEl.removeAttribute?.('title');
    }

    updateUI(lives, credits, wave, fps, stars) {
        if (this.livesEl) this.livesEl.textContent = lives;
        if (this.creditsEl) setHudResourceElement(this.creditsEl, credits);
        if (this.waveEl) this.waveEl.textContent = wave;
        this.updateBossCountdown(wave);
        this.updateFpsDisplay(`${Math.round(fps || 0)} FPS`);
        if (this.starsEl && stars !== undefined) setHudResourceElement(this.starsEl, stars);
    }

    updateBossCountdown(wave = 1) {
        if (!this.bossCountdownEl) return null;
        const state = buildBossCountdownState(
            wave,
            this.game.waveManager?.maxWaves || CAMPAIGN_MAX_WAVES,
            MINI_BOSS_WAVE_INTERVAL
        );
        this.bossCountdownEl.className = `status-item boss-countdown boss-countdown-${state.tone}`;
        this.bossCountdownEl.setAttribute('aria-label', state.ariaLabel);
        this.bossCountdownEl.innerHTML = `<i class="fas fa-skull"></i><span>${escapeHtml(state.label)}</span><b>${escapeHtml(state.detail)}</b>`;
        return state;
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
                    ? `<button id="pressure-upgrade" class="btn-mode-action" type="button" aria-label="${escapeHtml(`${action.label} por ${action.cost} creditos. ${action.reason}`)}">${action.label} $${action.cost}</button>`
                    : `<small>${action.label}</small>`}
            </div>` : ''}
            ${state.id === 'warning' || state.id === 'critical' ? '<button id="pressure-pause" class="btn-mode-action" type="button" aria-label="Activar pausa tactica por presion de ruta">Pausa táctica</button>' : ''}
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
        return this.waveReportPanel.clear();
    }

    renderWaveReport(report) {
        return this.waveReportPanel.render(report);
    }

    updatePerformance(snapshot, poolStats = {}) {
        this.updateFpsDisplay(`${Math.round(snapshot.fps)} FPS`, {
            warning: snapshot.p95Ms > 16.67,
            title: `Frame promedio ${snapshot.averageMs.toFixed(2)} ms · p95 ${snapshot.p95Ms.toFixed(2)} ms · pico ${snapshot.peakEntities} entidades · ${poolStats.reused || 0} proyectiles reutilizados`
        });
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
    }

    showDraftChoice(heroes, onChoose) {
        return this.modePanel.showDraftChoice(heroes, onChoose);
    }

    showModeResult(title, snapshot) {
        return this.modePanel.showResult(title, snapshot);
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
        const counterCoverage = summary
            ? buildCounterCoverageModel(
                summary,
                this.game.activeTeam || [],
                this.game.heroes || []
            )
            : null;
        const bossMilestone = buildBossMilestoneState(uniqueEnemies, waveNumber, summary);

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
                    ${bossMilestone ? `<div class="wave-boss-telegraph ${bossMilestone.tone}" data-testid="wave-boss-telegraph" aria-label="${escapeHtml(`${bossMilestone.title}: ${bossMilestone.name}. ${bossMilestone.warning}`)}">
                        <div class="wave-boss-portrait">
                            ${bossMilestone.portrait
                                ? `<img src="${escapeHtml(bossMilestone.portrait)}" alt="" loading="lazy">`
                                : `<span>${escapeHtml(bossMilestone.name.charAt(0))}</span>`}
                        </div>
                        <div class="wave-boss-copy">
                            <span>${escapeHtml(bossMilestone.title)} · Oleada ${bossMilestone.wave}</span>
                            <strong>${escapeHtml(bossMilestone.name)}</strong>
                            <small><i class="fas fa-triangle-exclamation"></i>${escapeHtml(bossMilestone.warning)}</small>
                        </div>
                        <div class="wave-boss-stats">
                            ${bossMilestone.stats.map((stat) => `<span><b>${escapeHtml(stat.value)}</b><small>${escapeHtml(stat.label)}</small></span>`).join('')}
                        </div>
                        <div class="wave-boss-counters">
                            ${bossMilestone.counters.map((counter) => `<b>${escapeHtml(counter)}</b>`).join('')}
                        </div>
                    </div>` : ''}
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
                    ${counterCoverage ? `<div class="wave-counter-coverage ${counterCoverage.ready ? 'ready' : 'warning'}" aria-label="${escapeHtml(counterCoverage.label)}: ${counterCoverage.covered} de ${counterCoverage.total} counters cubiertos">
                        <strong>${escapeHtml(counterCoverage.label)} <b>${counterCoverage.covered}/${counterCoverage.total}</b></strong>
                        <div>
                            ${counterCoverage.entries.map((entry) => `<span class="${entry.tone}" data-tooltip="${escapeHtml(`${entry.counter}: ${entry.detail}`)}">
                                <i class="fas ${escapeHtml(entry.icon)}"></i>
                                <b>${escapeHtml(entry.counter)}</b>
                                <small>${escapeHtml(entry.label)}</small>
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
            card.dataset.tooltip = intel.counterDetail;
            card.title = `${intel.name} | ${intel.roleLabel} | ${intel.counter} | Amenaza ${intel.threat}/5`;
            card.setAttribute('aria-label', `${intel.name}. ${intel.roleLabel}. Respuesta: ${intel.counter}. Amenaza ${intel.threat} de 5.`);
            const traitPreview = buildEnemyTraitPreview(intel.traits, 3);
            const traitsMarkup = [
                ...traitPreview.visible.map((trait) => `<b>${escapeHtml(trait)}</b>`),
                traitPreview.overflow > 0 ? `<b class="trait-overflow">+${traitPreview.overflow}</b>` : ''
            ].filter(Boolean).join('');
            const portrait = enemy.visual?.portrait || enemy.sprite;
            card.innerHTML = `
                ${portrait
                    ? `<span class="enemy-token enemy-token-sprite"><img src="${escapeHtml(portrait)}" alt="" loading="lazy"></span>`
                    : `<span class="enemy-token">${escapeHtml(intel.initial)}</span>`}
                <span class="enemy-count">x${enemy.previewCount || 1}</span>
                <strong>${escapeHtml(intel.name)}</strong>
                <span class="enemy-role">${escapeHtml(intel.roleLabel)} | ${escapeHtml(intel.pips)}</span>
                <small class="enemy-traits" title="${escapeHtml(traitPreview.title)}">${traitsMarkup}</small>
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
            const intel = buildEnemyIntel(unit);
            const content = document.getElementById('enemy-info-content');
            content?.querySelector('.enemy-tactical-brief')?.remove();
            content?.insertAdjacentHTML('beforeend', `
                <div class="enemy-tactical-brief ${escapeHtml(intel.danger)}">
                    <strong><i class="fas fa-crosshairs"></i>${escapeHtml(intel.counter)}</strong>
                    <span>${escapeHtml(intel.counterDetail)}</span>
                    ${intel.traits.length ? `<small>${intel.traits.map((trait) => escapeHtml(trait)).join(' | ')}</small>` : ''}
                </div>
            `);
            return;
        }

        this.game.pause();
        this.showPanelOverlay(true);
        this.renderHeroDetails(unit);
    }

    switchHeroDetailView(hero, view = 'summary', focusTab = false) {
        const nextView = view || 'summary';
        this.renderHeroDetails(hero, nextView);
        if (!focusTab) return;
        this.panelContent.querySelector?.(`[data-view="${nextView}"]`)?.focus?.();
    }

    bindHeroDetailTabs(hero) {
        const tabs = [...this.panelContent.querySelectorAll('.hero-detail-tab')];
        tabs.forEach((button, index) => {
            button.addEventListener('click', () => this.switchHeroDetailView(hero, button.dataset.view || 'summary'));
            button.addEventListener('keydown', (event) => {
                const keyOffset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
                const isEdgeKey = event.key === 'Home' || event.key === 'End';
                if (!keyOffset && !isEdgeKey) return;
                event.preventDefault();
                const nextIndex = event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                        ? tabs.length - 1
                        : (index + keyOffset + tabs.length) % tabs.length;
                this.switchHeroDetailView(hero, tabs[nextIndex]?.dataset.view || 'summary', true);
            });
        });
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
        const identityTags = [...new Set([...(config.tags || [])].filter(Boolean))];
        const isDeployed = this.game.heroes.includes(hero);
        const repositionPermission = isDeployed ? this.game.tacticalActions?.canReposition(hero) : null;
        const sellPermission = isDeployed ? this.game.tacticalActions?.canSell(hero) : null;
        const activeDetailView = ['equipment', 'combat'].includes(detailView) ? detailView : 'summary';
        const isMaxLevel = level >= HERO_MAX_LEVEL;
        const currentTargeting = hero.targetingPriority || config.targetingPriority || TARGETING_PRIORITIES[0];
        const waveSummary = this.nextWaveSummary || (!this.game.waveManager?.isWaveActive ? this.game.waveManager?.buildPreparedSummary?.() : null);
        const waveFitView = buildRosterWaveFitView(evaluateHeroWaveFit(hero, waveSummary, this.getMissionCredits()));
        const supportAura = config.special?.supportAura || config.supportAura || null;
        const scaledAura = getScaledSupportAura(supportAura, level, rarity);
        const supportAuraLabel = {
            damage: 'Daño',
            fireRate: 'Cad.',
            range: 'Rango'
        }[scaledAura?.type] || 'Aura';
        const isAuraOnly = hero.isSupportAuraOnly?.() || Boolean(scaledAura?.type && config.formationRole === 'support');
        const summaryBadge = isAuraOnly && scaledAura?.type
            ? `${supportAuraLabel} +${Math.round(Number(scaledAura.power || 0) * 100)}%`
            : `DPS ${formatCompactMetric(damage * Number(fireRate || 0))}`;
        const equipmentBadge = equippedItem ? 'Equipado' : 'Libre';
        const combatBadge = `${formatCompactMetric(combat.kills || 0)} bajas`;
        const compactStats = [
            ['Daño', `${damage}${this.formatStatDelta(damage, baseDamage)}`],
            ['Recarga', `${fireRate}/s${this.formatStatDelta(Number(fireRate), baseFireRate, '', 1)}`],
            ['Crítico', `${critChance}%${this.formatStatDelta(critChance, baseCritChance, '%')}`],
            ['Alcance', `${range}${this.formatStatDelta(range, baseRange)}`]
        ];
        const detailTabs = [
            { id: 'summary', label: 'Resumen', icon: 'fa-id-card', badge: summaryBadge },
            { id: 'equipment', label: 'Objeto', icon: 'fa-shield-alt', badge: equipmentBadge },
            { id: 'combat', label: 'Combate', icon: 'fa-chart-line', badge: combatBadge }
        ];
        let detailBody = '';

        if (activeDetailView === 'equipment') {
            detailBody = `
                <div class="equipment-card hero-tab-equipment">
                    <h3>Equipamiento</h3>
                    <div class="hero-equipment-slots single-equipment-slot">
                        <div class="item-slot ${equippedItem ? 'filled' : ''}">
                            <span>${equippedItem ? `${SLOT_LABELS[equippedItem.slot]} | ${SET_BONUSES[equippedItem.set]?.name || 'Sin familia'}` : 'Objeto'}</span>
                            <strong>${equippedItem?.name || 'Ranura libre'}</strong>
                            ${equippedItem ? `<small>${equippedItem.desc}</small><button class="btn-unequip-modal icon-command" type="button" data-slot="${equippedSlot}" aria-label="Desequipar ${equippedItem.name}" title="Desequipar" data-tooltip="Desequipar"><i class="fas fa-eject"></i></button>` : '<small>Un solo objeto equipado por heroe.</small>'}
                        </div>
                    </div>
                    <button id="open-inventory-panel" class="btn-primary ghost" type="button" aria-label="${escapeHtml(isUnlocked ? `Abrir inventario para ${heroName}` : `${heroName} no reclutado: inventario bloqueado`)}" title="${escapeHtml(isUnlocked ? `Abrir inventario para ${heroName}` : `${heroName} no reclutado: inventario bloqueado`)}" data-tooltip="${escapeHtml(isUnlocked ? `Abrir inventario para ${heroName}` : `${heroName} no reclutado: inventario bloqueado`)}" aria-disabled="${!isUnlocked}" ${isUnlocked ? '' : 'disabled'}><i class="fas fa-box-open"></i> ${isUnlocked ? 'Abrir inventario' : 'Recluta para equipar'}</button>
                </div>
            `;
        } else if (activeDetailView === 'combat') {
            detailBody = `
                <div class="hero-detail-subpanel detail-card hero-tab-combat">
                    <h3>Combate</h3>
                    <p><span>Daño total</span><strong>${Math.round(combat.damageDealt || 0)}</strong></p>
                    <p><span>Bajas</span><strong>${combat.kills || 0}</strong></p>
                    <p><span>Disparos</span><strong>${combat.shots || 0}</strong></p>
                    <p><span>Críticos</span><strong>${combat.crits || 0}</strong></p>
                    <p><span>Habilidades</span><strong>${combat.abilityActivations || 0}</strong></p>
                </div>
            `;
        } else {
            detailBody = `
                <div class="hero-identity-card">
                    <span><small>Tipo</small><strong>${escapeHtml(config.category || 'Heroe')}</strong></span>
                    <span><small>Rareza</small><b class="rarity-badge ${rarityClass}">${rarity}</b></span>
                    ${identityTags.length ? `<div class="hero-tag-list">${identityTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                </div>

                <div class="hero-ability-compact">
                    <div>
                        <h3>${config.ability || 'Ataque básico'}</h3>
                        <p>${config.abilityDesc || 'Ataca al enemigo objetivo con su daño base.'}</p>
                    </div>
                    ${config.niche ? `<b>${config.niche}</b>` : ''}
                </div>

                ${waveFitView ? `
                    <div class="hero-wave-fit-compact ${escapeHtml(waveFitView.id)}" aria-label="${escapeHtml(waveFitView.ariaLabel)}">
                        <span><small>Lectura de oleada</small><strong><i class="fas fa-crosshairs"></i>${escapeHtml(waveFitView.label)}</strong></span>
                        <b>${escapeHtml(waveFitView.scoreLabel)}</b>
                        <em>${escapeHtml(waveFitView.reasonText)}</em>
                    </div>
                ` : ''}

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
                            ${kitControl.options.map((option) => `<button class="kit-mode-btn ${option.id === kitControl.value ? 'active' : ''}" type="button" data-mode="${option.id}" aria-pressed="${option.id === kitControl.value}" aria-label="${escapeHtml(`${kitControl.label}: ${option.label}`)}" title="${escapeHtml(`${kitControl.label}: ${option.label}`)}" data-tooltip="${escapeHtml(`${kitControl.label}: ${option.label}`)}">${option.label}</button>`).join('')}
                        </div>
                    </div>
                ` : ''}
            `;
        }

        this.panelContent.innerHTML = `
            <div class="hero-detail">
                <section class="hero-portrait ${rarityClass}" data-rarity="${rarity}">
                    <div class="hero-portrait-header">
                        <div>
                            <small>Ficha de heroe</small>
                            <h2>${escapeHtml(heroName)}</h2>
                        </div>
                        <b class="rarity-badge ${rarityClass}">${rarity}</b>
                    </div>
                    <div class="portrait-frame">${this.renderSprite(this.getHeroDisplaySprite(config), heroName)}</div>
                    <div class="hero-level-readout">
                        <span><small>Nivel</small><b>${level}/${HERO_MAX_LEVEL}</b></span>
                        <span><small>Mejora</small><b>${isMaxLevel ? 'MAX' : `$${this.getHeroUpgradeCost(hero, 1)}`}</b></span>
                    </div>
                    ${isUnlocked ? `<div class="upgrade-list hero-upgrade-grid" aria-label="Mejoras de nivel">
                        ${[1, 5, 10].map((amount) => {
                            const cost = this.getHeroUpgradeCost(hero, amount);
                            const steps = getHeroLevelUpgradeSteps(level, amount);
                            const preview = isMaxLevel ? '' : this.renderHeroLevelPreview(hero, steps);
                            const upgradeLabel = isMaxLevel ? `${heroName} ya esta en nivel maximo` : `Mejorar ${heroName} ${steps} niveles por ${cost} creditos`;
                            return `<button class="modal-btn-upgrade hero-upgrade-card btn-primary ghost" type="button" data-amt="${amount}" data-cost="${cost}" aria-label="${escapeHtml(upgradeLabel)}" title="${escapeHtml(upgradeLabel)}" data-tooltip="${escapeHtml(upgradeLabel)}" aria-disabled="${isMaxLevel}" ${isMaxLevel ? 'disabled' : ''}>
                                <span class="hero-upgrade-step">${isMaxLevel ? 'MAX' : `+${steps}`}</span>
                                <span class="hero-upgrade-cost">${isMaxLevel ? 'Nivel maximo' : `$${cost}`}</span>
                                ${preview}
                            </button>`;
                        }).join('')}
                    </div>` : '<div class="locked-hero-note"><i class="fas fa-lock"></i> Recluta al héroe para mejorarlo</div>'}
                    ${isDeployed ? `
                        <div class="tactical-actions">
                            <button id="reposition-hero" class="btn-primary ghost" type="button" aria-label="${escapeHtml(`Reposicionar ${heroName}: ${repositionPermission?.reason || 'Mover libremente'}`)}" title="${escapeHtml(`Reposicionar ${heroName}: ${repositionPermission?.reason || 'Mover libremente'}`)}" data-tooltip="${escapeHtml(`Reposicionar ${heroName}: ${repositionPermission?.reason || 'Mover libremente'}`)}" aria-disabled="${!repositionPermission?.ok}" ${repositionPermission?.ok ? '' : 'disabled'}><i class="fas fa-arrows-alt"></i> Reposicionar</button>
                            <button id="sell-hero" class="btn-primary danger" type="button" aria-label="${escapeHtml(`Retirar ${heroName}: ${sellPermission?.reason || 'Retirar heroe'}`)}" title="${escapeHtml(`Retirar ${heroName}: ${sellPermission?.reason || 'Retirar heroe'}`)}" data-tooltip="${escapeHtml(`Retirar ${heroName}: ${sellPermission?.reason || 'Retirar heroe'}`)}" aria-disabled="${!sellPermission?.ok}" ${sellPermission?.ok ? '' : 'disabled'}><i class="fas fa-eject"></i> Retirar</button>
                        </div>
                    ` : ''}
                </section>

                <section class="detail-stack">
                    <div class="hero-summary-card">
                        <div class="hero-stat-strip">
                            ${compactStats.map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`).join('')}
                        </div>

                        <div class="hero-detail-tabs" role="tablist" aria-label="Detalle de heroe">
                            ${detailTabs.map((tab) => {
                                const tabAriaLabel = escapeHtml(`${tab.label}: ${tab.badge}`);
                                return `<button id="hero-detail-tab-${tab.id}" class="hero-detail-tab ${activeDetailView === tab.id ? 'active' : ''}" data-view="${tab.id}" role="tab" aria-selected="${activeDetailView === tab.id}" aria-controls="hero-detail-panel" tabindex="${activeDetailView === tab.id ? '0' : '-1'}" type="button" aria-label="${tabAriaLabel}" title="${tabAriaLabel}" data-tooltip="${tabAriaLabel}"><i class="fas ${tab.icon}"></i><span>${tab.label}</span><b class="hero-detail-tab-badge">${escapeHtml(tab.badge)}</b></button>`;
                            }).join('')}
                        </div>

                        <div id="hero-detail-panel" class="hero-detail-tab-panel ${activeDetailView}" role="tabpanel" aria-labelledby="hero-detail-tab-${activeDetailView}">
                            ${detailBody}
                        </div>
                    </div>
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

        this.bindHeroDetailTabs(hero);

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
        const rarity = targetData.rarity || databaseHero.rarity || 'Common';
        const baseDamage = Number(targetData.baseDamage ?? databaseHero.baseDamage ?? databaseHero.damage ?? targetData.damage ?? unit?.damage ?? 0);
        const currentDamage = getHeroDamageAtLevel(baseDamage, currentLevel, rarity);
        const nextDamage = getHeroDamageAtLevel(baseDamage, currentLevel + steps, rarity);
        const rows = [];
        if (nextDamage !== currentDamage) rows.push({ label: 'Dano', value: nextDamage - currentDamage });

        const aura = targetData.special?.supportAura || databaseHero.special?.supportAura || targetData.supportAura || databaseHero.supportAura;
        const currentAura = getScaledSupportAura(aura, currentLevel, rarity);
        const nextAura = getScaledSupportAura(aura, currentLevel + steps, rarity);
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

        const hudValue = this.creditsEl?.dataset?.value;
        if (hudValue === 'Infinity' || this.creditsEl?.textContent === '∞') return Number.POSITIVE_INFINITY;
        const hudCredits = Number(String(hudValue ?? (this.creditsEl?.textContent || '')).replace(/[^\d.-]/g, ''));
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
        targetData.damage = getHeroDamageAtLevel(targetData.baseDamage, targetData.level, targetData.rarity || unit.rarity);
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

    setPanelDialogLabel(title = 'Panel del juego') {
        const dialog = document.getElementById('panel-container');
        dialog?.setAttribute('aria-label', title || 'Panel del juego');
    }

    renderPanel(type) {
        const panelTitles = {
            profile: 'Perfil',
            radar: 'Radar tactico',
            collection: 'Colección',
            inventory: 'Inventario',
            shop: 'Tienda',
            skins: 'Skins',
            map: 'Mapa',
            settings: 'Ajustes'
        };
        const title = panelTitles[type] || type;
        this.setPanelDialogLabel(title);
        this.setActiveHubButton(panelTitles[type] ? type : null);

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
        return this.radarPanel.render(title);
    }

    renderRadarSection(sourceId, title, icon, emptyMessage) {
        return this.radarPanel.renderSection(sourceId, title, icon, emptyMessage);
    }

    bindRadarPanelActions() {
        return this.radarPanel.bindActions();
    }

    getShopPanel() {
        if (!this.shopPanel) {
            this.shopPanel = new ShopPanel(this, {
                buildShopItemInsight,
                buildShopSetProgress
            });
        }
        return this.shopPanel;
    }

    renderShop(title) {
        return this.getShopPanel().render(title);
    }

    formatStatDelta(current, base, suffix = '', decimals = 0) {
        const difference = current - base;
        if (Math.abs(difference) < 0.001) return '';
        const value = Math.abs(difference).toFixed(decimals);
        return `<small class="stat-delta ${difference < 0 ? 'negative' : ''}">${difference > 0 ? '+' : '-'}${value}${suffix}</small>`;
    }

    renderShopItem(item, purchased = false) {
        return this.getShopPanel().renderItem(item, purchased);
    }

    buyItem(itemId) {
        return this.getShopPanel().buyItem(itemId);
    }

    renderSkinShop(title = 'Skins') {
        return this.getShopPanel().renderSkinShop(title);
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

    getStarterPanel() {
        if (!this.starterPanel) this.starterPanel = new StarterPanel(this);
        return this.starterPanel;
    }

    renderStarterSelector(starters, onSelect) {
        return this.getStarterPanel().render(starters, onSelect);
    }

    getHeroRosterPanel() {
        if (!this.heroRosterPanel) {
            this.heroRosterPanel = new HeroRosterPanel(this, {
                buildTargetingControlState,
                getNextTargetingPriority
            });
        }
        return this.heroRosterPanel;
    }

    renderHeroRoster(activeTeam, onSelect) {
        return this.getHeroRosterPanel().render(activeTeam, onSelect);
    }

    buildGachaRevealSequence(finalHero, count = 12) {
        return this.getShopPanel().buildGachaRevealSequence(finalHero, count);
    }

    renderGachaReveal(result) {
        return this.getShopPanel().renderGachaReveal(result);
    }

    startGachaRevealAnimation(result, onComplete = () => {}) {
        return this.getShopPanel().startGachaRevealAnimation(result, onComplete);
    }

    handleGacha() {
        return this.getShopPanel().handleGacha();
    }

    getEndStatePanel() {
        if (!this.endStatePanel) this.endStatePanel = new EndStatePanel(this);
        return this.endStatePanel;
    }

    showGameOver() {
        this.game.audio?.play('warning');
        return this.getEndStatePanel().showGameOver();
    }

    showVictory() {
        this.game.audio?.play('victory');
        return this.getEndStatePanel().showVictory();
    }

    renderMissionSummary(summary) {
        return this.getEndStatePanel().renderMissionSummary(summary);
    }

    showFatalError(error) {
        return this.getEndStatePanel().showFatalError(error);
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
        return pickHeroDisplaySprite(hero, this.game);
    }
}
