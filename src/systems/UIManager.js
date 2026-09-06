import { CampaignPanel } from '../ui/CampaignPanel.js';
import { ProfilePanel } from '../ui/ProfilePanel.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import { TooltipController } from '../ui/TooltipController.js';
import { PanelDialogController } from '../ui/PanelDialogController.js';
import { InventoryPanel } from '../ui/InventoryPanel.js';
import { TeamBuilderPanel } from '../ui/TeamBuilderPanel.js';
import { ModePanel } from '../ui/ModePanel.js';
import { WaveReportPanel } from '../ui/WaveReportPanel.js';
import { RadarPanel } from '../ui/RadarPanel.js';
import { ShopPanel } from '../ui/ShopPanel.js';
import { StarterPanel } from '../ui/StarterPanel.js';
import { EndStatePanel } from '../ui/EndStatePanel.js';
import { HeroRosterPanel } from '../ui/HeroRosterPanel.js';
import { HeroDetailsPanel } from '../ui/HeroDetailsPanel.js';
import { HeroUpgradeController } from '../ui/HeroUpgradeController.js';
import { WavePreviewPanel } from '../ui/WavePreviewPanel.js';
import { EnemyInfoPanel } from '../ui/EnemyInfoPanel.js';
import { CombatPressurePanel } from '../ui/CombatPressurePanel.js';
import { ThreatHudPanel } from '../ui/ThreatHudPanel.js';
import { MissionStatusPanel } from '../ui/MissionStatusPanel.js';
import { ToastPanel } from '../ui/ToastPanel.js';
import { TopHudPanel } from '../ui/TopHudPanel.js';
import { SET_BONUSES } from './ItemEffectSystem.js';
import { getAllowedTerrainLabels } from '../utils/TerrainRules.js';
import { getRarityClass, normalizeRarity } from '../utils/Rarity.js';
import { pickHeroDisplaySprite } from '../utils/HeroVisuals.js';
import { TARGETING_PRIORITIES, buildTargetingControlState, getNextTargetingPriority } from '../utils/TargetingPriority.js';
import { buildBossCountdownState, buildWaveLaunchState, formatHudResource } from '../ui/HudState.js';
import { buildPanelNavigationMarkup } from '../ui/PanelNavigation.js';

export { TARGETING_PRIORITIES, buildTargetingControlState, getNextTargetingPriority } from '../utils/TargetingPriority.js';
export { buildBossCountdownState, buildWaveLaunchState, formatHudResource } from '../ui/HudState.js';
export { buildPanelNavigationMarkup } from '../ui/PanelNavigation.js';

const ASSET_VERSION = 'evolution-enemy-sprites-20260812';

function versionAssetSource(source) {
    if (!source?.startsWith?.('assets/images/')) return source;
    return `${source}${source.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;
}

const PIERCING_HERO_IDS = new Set(['iron_man', 'vision', 'hawkeye', 'winter_soldier', 'cyclops', 'silver_surfer']);

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

const ATTACK_EFFECT_COPY = {
    slow: 'Slow',
    stun: 'Stun',
    freeze: 'Freeze',
    web: 'Red',
    knockback: 'Empuje',
    poison: 'Veneno',
    burn: 'Quemadura',
    curse: 'Maldición',
    mark: 'Marca',
    armorBreak: 'Armor break',
    bleed: 'Sangrado'
};

const SUPPORT_AURA_TYPE_COPY = {
    damage: 'daño',
    fireRate: 'cadencia',
    range: 'rango'
};

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
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
        counterDetail = 'Velocidad alta; slow, stun o web en curvas protege la base.';
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

export function buildHeroCombatIdentity(hero = {}) {
    const config = getHeroConfig(hero);
    const special = config.special || {};
    const profile = special.projectileProfile || {};
    const effects = special.attackEffects || [];
    const aura = special.supportAura || config.supportAura || null;
    const economy = special.economyOnHit || config.economyOnHit || null;
    const counters = [
        heroDetectsStealth(hero) ? 'Detección' : '',
        heroPiercesArmor(hero) ? 'Perforación' : '',
        heroControlsCrowd(hero) ? 'Control' : '',
        heroHasReach(hero) ? 'Alcance' : '',
        heroHasFocusDamage(hero) ? 'DPS' : ''
    ].filter(Boolean);

    return [
        {
            label: 'Rango',
            value: getHeroRangePatternLabel(config, profile, aura),
            icon: 'fa-draw-polygon',
            tone: 'range'
        },
        {
            label: 'Impacto',
            value: getHeroImpactLabel(config, profile, effects, aura, economy),
            icon: 'fa-bolt',
            tone: 'impact'
        },
        {
            label: 'Counters',
            value: counters.slice(0, 3).join(' · ') || 'DPS',
            icon: 'fa-crosshairs',
            tone: counters.length >= 3 ? 'prime' : counters.length ? 'ready' : 'neutral'
        },
        {
            label: 'Rol',
            value: getHeroCombatRoleLabel(config, profile, effects, aura, economy),
            icon: 'fa-id-badge',
            tone: aura || economy ? 'support' : 'neutral'
        }
    ];
}

function getHeroRangePatternLabel(config = {}, profile = {}, aura = null) {
    const pattern = String(config.rangeShape || config.rangePattern || config.special?.rangeShape || config.special?.rangePattern || '').toLowerCase();
    if (aura) return 'Aura';
    if (pattern.includes('ring') || pattern.includes('anillo')) return 'Anillo';
    if (pattern.includes('cross') || pattern.includes('cruz') || pattern.includes('x')) return 'Cruz/X';
    if (profile.lineWidth || profile.lineRange) return 'Línea';
    return 'Círculo';
}

function getHeroImpactLabel(config = {}, profile = {}, effects = [], aura = null, economy = null) {
    if (aura) return `Aura ${SUPPORT_AURA_TYPE_COPY[aura.type] || 'táctica'}`;
    const labels = [];
    if (profile.splashRadius > 0) labels.push('AoE');
    if (profile.chainCount > 0) labels.push('Rebote');
    if (profile.propagationCount > 0) labels.push('Propagación');
    if (profile.armorPenetration > 0) labels.push('Perfora');
    if (economy?.rewardPct) labels.push('Créditos');
    effects.forEach((effect) => {
        const label = ATTACK_EFFECT_COPY[effect.type];
        if (label && !labels.includes(label)) labels.push(label);
    });
    if (!labels.length && config.canSeeStealth) labels.push('Detección');
    return labels.slice(0, 3).join(' + ') || 'Directo';
}

function getHeroCombatRoleLabel(config = {}, profile = {}, effects = [], aura = null, economy = null) {
    if (aura) {
        const power = Math.round(Number(aura.power || 0) * 100);
        return `${SUPPORT_AURA_TYPE_COPY[aura.type] || 'aura'} +${power}%`;
    }
    if (economy?.rewardPct) return `Créditos ${Math.round(Number(economy.rewardPct || 0) * 100)}%`;
    if (profile.splashRadius > 0 || profile.chainCount > 0 || profile.propagationCount > 0) return 'Grupos';
    if ((profile.armorPenetration || 0) >= 0.2) return 'Blindaje';
    if ((effects || []).some((effect) => ['slow', 'stun', 'freeze', 'web', 'knockback'].includes(effect.type))) return 'Control';
    if (config.canSeeStealth) return 'Detección';
    return 'Daño';
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
            label: 'Sigilo sin desplegar',
            detail: `Coloca ${getHeroName(detector)} antes de iniciar.`,
            detectorCount: 0,
            heroId: detector.id || detector.config?.id || ''
        };
    }

    return {
        tone: 'danger',
        label: 'Sigilo descubierto',
        detail: 'No hay detector disponible; prioriza control y base.',
        detectorCount: 0
    };
}

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

export function buildWaveDamageCheckMeter(check = {}) {
    const expected = Math.max(0, Number(check.expectedDamage || 0));
    const required = Math.max(0, Number(check.requiredDamage || 0));
    const ratio = required > 0 ? expected / required : expected > 0 ? 1 : 0;
    const ratioPct = Math.max(0, Math.round(ratio * 100));
    const fillPct = Math.max(0, Math.min(100, ratioPct));
    return {
        ratio,
        ratioPct,
        fillPct,
        label: `${ratioPct}% cubierto`,
        ariaLabel: `Daño estimado ${ratioPct}% del total requerido`
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
    add(effects.lowLifeDamagePct || effects.lowLifeFireRatePct, 'seguro de base');

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
    if (score >= 0.92 || lead.progress >= 0.9) state = { id: 'critical', label: 'Base critica', advice: 'Pausa, mejora o reposiciona ya.' };
    else if (score >= 0.72 || dangerCount > 0) state = { id: 'warning', label: 'Presión alta', advice: 'Refuerza la base o activa control.' };
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
            reason: 'Coloca defensa antes de que el frente llegue a la base.',
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
            reason: pressureState.id === 'critical' ? 'Respuesta recomendada para proteger la base.' : 'Refuerzo rapido antes de que escale.',
            signature: `upgrade:${affordable.hero.id || name}:${affordable.level}:${affordable.cost}:${Math.floor(credits)}`
        };
    }

    const cheapest = candidates.reduce((best, candidate) => !best || candidate.cost < best.cost ? candidate : best, null);
    const missing = Math.max(0, (cheapest?.cost || 0) - credits);
    return {
        type: 'hint',
        label: `Faltan $${Math.ceil(missing)}`,
        reason: 'Ahorra para la siguiente mejora clave.',
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
        this.profilePanel = new ProfilePanel(this);
        this.campaignPanel = new CampaignPanel(this);
        this.settingsPanel = new SettingsPanel(this);
        this.inventoryPanel = new InventoryPanel(this);
        this.teamBuilderPanel = new TeamBuilderPanel(this);
        this.modePanel = new ModePanel(this);
        this.panelDialogController = new PanelDialogController(this, { buildPanelNavigationMarkup });
        this.toastPanel = new ToastPanel(this);
        this.topHudPanel = new TopHudPanel(this, {
            buildBossCountdownState,
            buildWaveLaunchState,
            formatHudResource
        });
        this.waveReportPanel = new WaveReportPanel(this, {
            buildState: buildWaveReportState,
            buildAction: buildWaveReportActionState
        });
        this.wavePreviewPanel = new WavePreviewPanel(this, {
            buildBossMilestoneState,
            buildCounterCoverageModel,
            buildEnemyIntel,
            buildEnemyTraitPreview,
            buildStatusLegendModel,
            buildStealthCoverageState,
            buildWaveCounterBrief,
            buildWaveDamageCheckMeter,
            buildWavePrepActionControl,
            buildWavePreparationPlan
        });
        this.combatPressurePanel = new CombatPressurePanel(this, {
            buildCombatPressureState,
            buildPressureActionState
        });
        this.threatHudPanel = new ThreatHudPanel({
            buildBossHudState,
            buildSpawnQueueState
        });
        this.missionStatusPanel = new MissionStatusPanel();
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
        this.enemyInfoPanel = new EnemyInfoPanel(this, { buildEnemyIntel });
        this.heroUpgradeController = new HeroUpgradeController(this);
        this.heroDetailsPanel = new HeroDetailsPanel(this, {
            buildHeroCombatIdentity,
            buildRosterWaveFitView,
            evaluateHeroWaveFit,
            targetingPriorities: TARGETING_PRIORITIES
        });
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
        this.updateAutoWaveButton(btnAuto);

        btnPause?.addEventListener('click', () => {
            this.setManualPause(!this.game.isManuallyPaused);
        });

        btnAuto?.addEventListener('click', () => {
            if (!this.game.waveManager) return;
            this.game.waveManager.autoWave = !this.game.waveManager.autoWave;
            this.updateAutoWaveButton(btnAuto);
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
        return this.getPanelDialogController().handleHubButtonClick(type);
    }

    openPanel(type) {
        return this.getPanelDialogController().openPanel(type);
    }

    closePanel() {
        return this.getPanelDialogController().closePanel();
    }

    setActiveHubButton(type = null) {
        return this.getPanelDialogController().setActiveHubButton(type);
    }

    showPanelOverlay(showCloseButton = true) {
        return this.getPanelDialogController().showPanelOverlay(showCloseButton);
    }

    hidePanelOverlay() {
        return this.getPanelDialogController().hidePanelOverlay();
    }

    handlePanelBackdropPointerDown(event) {
        return this.getPanelDialogController().handlePanelBackdropPointerDown(event);
    }

    handleDialogKeydown(event) {
        return this.getPanelDialogController().handleDialogKeydown(event);
    }

    getPanelDialogController() {
        if (!this.panelDialogController) this.panelDialogController = new PanelDialogController(this, { buildPanelNavigationMarkup });
        return this.panelDialogController;
    }

    setSelectionStatus(text) {
        if (this.selectionStatus) this.selectionStatus.textContent = text;
    }

    updateSpeedButton(button = document.getElementById('btn-speed')) {
        return this.getTopHudPanel().updateSpeedButton(button);
    }

    updateAutoWaveButton(button = document.getElementById('btn-auto')) {
        return this.getTopHudPanel().updateAutoWaveButton(button);
    }

    setManualPause(paused, announce = true) {
        return this.getTopHudPanel().setManualPause(paused, announce);
    }

    setNextWaveEnabled(enabled, summary = null) {
        return this.getTopHudPanel().setNextWaveEnabled(enabled, summary);
    }

    updatePlacementSuggestion(state = null) {
        const button = document.getElementById('suggested-placement-action');
        if (!button) return;
        const idleLabel = 'Usar celda sugerida';
        if (!state) {
            button.classList.add('hidden');
            button.innerHTML = '';
            button.onclick = null;
            button.setAttribute('aria-label', idleLabel);
            button.title = idleLabel;
            button.dataset.tooltip = idleLabel;
            this.renderOnboardingCoach();
            return;
        }

        const suggestionLabel = `${state.label}. ${state.detail}`;
        button.className = `suggested-placement-action ${state.qualityId || 'solid'}`;
        button.setAttribute('aria-label', suggestionLabel);
        button.title = suggestionLabel;
        button.dataset.tooltip = suggestionLabel;
        button.innerHTML = `
            <i class="fas fa-location-crosshairs"></i>
            <span><strong>${escapeHtml(state.label)}</strong><small>${escapeHtml(state.detail)}</small></span>
            <b>${escapeHtml(state.actionLabel || 'Usar')}</b>
        `;
        button.onclick = () => this.game.inputManager?.confirmSuggestedPlacement?.();
        this.renderOnboardingCoach();
    }

    renderOnboardingCoach() {
        const coach = document.getElementById('onboarding-coach');
        if (coach) coach.remove();
        return null;
    }

    shouldShowFps() {
        return this.game.progression?.state.settings?.showFps === true;
    }

    updateFpsDisplay(text, { warning = false, title = '' } = {}) {
        return this.getTopHudPanel().updateFpsDisplay(text, { warning, title });
    }

    updateUI(lives, credits, wave, fps, stars) {
        return this.getTopHudPanel().updateUI(lives, credits, wave, fps, stars);
    }

    updateBossCountdown(wave = 1) {
        return this.getTopHudPanel().updateBossCountdown(wave);
    }

    getTopHudPanel() {
        if (!this.topHudPanel) {
            this.topHudPanel = new TopHudPanel(this, {
                buildBossCountdownState,
                buildWaveLaunchState,
                formatHudResource
            });
        }
        return this.topHudPanel;
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
        return this.getCombatPressurePanel().render(enemies, path, waveActive);
    }

    getCombatPressurePanel() {
        if (!this.combatPressurePanel) {
            this.combatPressurePanel = new CombatPressurePanel(this, {
                buildCombatPressureState,
                buildPressureActionState
            });
        }
        return this.combatPressurePanel;
    }

    updateBossHud(enemies = [], waveActive = false) {
        return this.getThreatHudPanel().updateBoss(enemies, waveActive);
    }

    updateSpawnQueue(queue = [], spawnTimer = 0, waveActive = false) {
        return this.getThreatHudPanel().updateSpawnQueue(queue, spawnTimer, waveActive);
    }

    getThreatHudPanel() {
        if (!this.threatHudPanel) {
            this.threatHudPanel = new ThreatHudPanel({
                buildBossHudState,
                buildSpawnQueueState
            });
        }
        return this.threatHudPanel;
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
        return this.getMissionStatusPanel().update(snapshot);
    }

    getMissionStatusPanel() {
        if (!this.missionStatusPanel) this.missionStatusPanel = new MissionStatusPanel();
        return this.missionStatusPanel;
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
        return this.getToastPanel().show(message, type);
    }

    getToastPanel() {
        if (!this.toastPanel) this.toastPanel = new ToastPanel(this);
        return this.toastPanel;
    }

    renderWavePreview(uniqueEnemies, modifier = null, faction = null, waveNumber = 1, summary = null) {
        this.getWavePreviewPanel().render(uniqueEnemies, modifier, faction, waveNumber, summary);
    }

    renderWaveDamageCheck(check) {
        return this.getWavePreviewPanel().renderDamageCheck(check);
    }

    getWavePreviewPanel() {
        if (!this.wavePreviewPanel) {
            this.wavePreviewPanel = new WavePreviewPanel(this, {
                buildBossMilestoneState,
                buildCounterCoverageModel,
                buildEnemyIntel,
                buildEnemyTraitPreview,
                buildStatusLegendModel,
                buildStealthCoverageState,
                buildWaveCounterBrief,
                buildWaveDamageCheckMeter,
                buildWavePrepActionControl,
                buildWavePreparationPlan
            });
        }
        return this.wavePreviewPanel;
    }

    inspectUnit(unit, isEnemyFlag = false) {
        if (!unit) return;
        this.tooltipController.hide();

        const isEnemy = isEnemyFlag || (unit.hp !== undefined && unit.takeDamage !== undefined);
        if (isEnemy) {
            this.getEnemyInfoPanel().render(unit);
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

    renderHeroCombatIdentity(hero) {
        return this.getHeroDetailsPanel().renderHeroCombatIdentity(hero);
    }

    renderHeroQuickIdentityStrip(hero) {
        return this.getHeroDetailsPanel().renderHeroQuickIdentityStrip(hero);
    }

    renderTargetingPriorityLegend(currentTargeting = TARGETING_PRIORITIES[0]) {
        return this.getHeroDetailsPanel().renderTargetingPriorityLegend(currentTargeting);
    }

    renderHeroDetails(hero, detailView = 'summary') {
        this.getHeroDetailsPanel().render(hero, detailView);
    }

    getHeroDetailsPanel() {
        if (!this.heroDetailsPanel) {
            this.heroDetailsPanel = new HeroDetailsPanel(this, {
                buildHeroCombatIdentity,
                buildRosterWaveFitView,
                evaluateHeroWaveFit,
                targetingPriorities: TARGETING_PRIORITIES
            });
        }
        return this.heroDetailsPanel;
    }

    getEnemyInfoPanel() {
        if (!this.enemyInfoPanel) this.enemyInfoPanel = new EnemyInfoPanel(this, { buildEnemyIntel });
        return this.enemyInfoPanel;
    }

    getHeroLevel(unit) {
        return this.getHeroUpgradeController().getHeroLevel(unit);
    }

    calculateLevelCost(currentLevel, amount = 1) {
        return this.getHeroUpgradeController().calculateLevelCost(currentLevel, amount);
    }

    getHeroUpgradeCost(unit, amount = 1) {
        return this.getHeroUpgradeController().getHeroUpgradeCost(unit, amount);
    }

    renderHeroLevelPreview(unit, amount = 1) {
        return this.getHeroDetailsPanel().renderHeroLevelPreview(unit, amount);
    }

    getHeroLevelPreviewLabel(unit, amount = 1) {
        return this.getHeroUpgradeController().getHeroLevelPreviewLabel(unit, amount);
    }

    getHeroLevelPreviewRows(unit, amount = 1) {
        return this.getHeroUpgradeController().getHeroLevelPreviewRows(unit, amount);
    }

    formatSignedPreviewValue(value, suffix = '', precision = 0) {
        return this.getHeroUpgradeController().formatSignedPreviewValue(value, suffix, precision);
    }

    getMissionCredits() {
        return this.getHeroUpgradeController().getMissionCredits();
    }

    canAffordHeroUpgrade(unit, amount = 1) {
        return this.getHeroUpgradeController().canAffordHeroUpgrade(unit, amount);
    }

    findDeployedHeroById(heroId) {
        return this.getHeroUpgradeController().findDeployedHeroById(heroId);
    }

    quickUpgradeHeroById(heroId) {
        return this.getHeroUpgradeController().quickUpgradeHeroById(heroId);
    }

    spendMissionCredits(cost) {
        return this.getHeroUpgradeController().spendMissionCredits(cost);
    }

    refreshHeroUpgradeUi(unit) {
        return this.getHeroUpgradeController().refreshHeroUpgradeUi(unit);
    }

    processUpgrade(unit, amount) {
        return this.getHeroUpgradeController().processUpgrade(unit, amount);
    }

    quickUpgradeHero(unit) {
        return this.getHeroUpgradeController().quickUpgradeHero(unit);
    }

    applyHeroLevelUpgrade(unit, amount) {
        return this.getHeroUpgradeController().applyHeroLevelUpgrade(unit, amount);
    }

    getHeroUpgradeController() {
        if (!this.heroUpgradeController) this.heroUpgradeController = new HeroUpgradeController(this);
        return this.heroUpgradeController;
    }

    refillShop() {
        for (let i = 0; i < 3; i++) {
            if (!this.shopSlots[i] && this.itemPool.length > 0) this.shopSlots[i] = this.itemPool.shift();
        }
    }

    setPanelDialogLabel(title = 'Panel del juego') {
        return this.getPanelDialogController().setPanelDialogLabel(title);
    }

    renderPanel(type) {
        return this.getPanelDialogController().renderPanel(type);
    }

    renderPanelNavigation(activeType = '') {
        return this.getPanelDialogController().renderPanelNavigation(activeType);
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

    renderSprite(src, name = '') {
        const label = String(name || 'Sprite');
        const fallback = label.charAt(0) || '?';
        const safeLabel = escapeHtml(label);
        const safeFallback = escapeHtml(fallback);
        if (!src) return `<span class="sprite-fallback">${safeFallback}</span>`;
        return `<img src="${escapeHtml(versionAssetSource(src))}" alt="${safeLabel}" data-fallback="${safeFallback}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'sprite-fallback', textContent: this.dataset.fallback || '?' }))">`;
    }

    getHeroDisplaySprite(hero) {
        if (!hero) return null;
        return pickHeroDisplaySprite(hero, this.game);
    }
}
