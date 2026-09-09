import { TERRAIN } from '../utils/TerrainRules.js';

export const HERO_TACTIC_FILTERS = [
    { id: 'all', label: 'Todas', icon: 'fa-filter' },
    { id: 'grass', label: 'Pasto', icon: 'fa-seedling' },
    { id: 'water', label: 'Agua', icon: 'fa-water' },
    { id: 'mountain', label: 'Montaña', icon: 'fa-mountain' },
    { id: 'detection', label: 'Detección', icon: 'fa-eye' },
    { id: 'antiarmor', label: 'Antiarmadura', icon: 'fa-bullseye' },
    { id: 'dps', label: 'DPS', icon: 'fa-bolt' },
    { id: 'frontline', label: 'Cercano', icon: 'fa-street-view' },
    { id: 'support', label: 'Soporte', icon: 'fa-user-shield' },
    { id: 'control', label: 'Control', icon: 'fa-hand-paper' },
    { id: 'area', label: 'Área/Rebote', icon: 'fa-project-diagram' },
    { id: 'dot', label: 'Persistente', icon: 'fa-fire' },
    { id: 'boss', label: 'Jefes', icon: 'fa-crown' },
    { id: 'crit', label: 'Crítico', icon: 'fa-crosshairs' },
    { id: 'aura', label: 'Aura', icon: 'fa-broadcast-tower' },
    { id: 'economy', label: 'Economía', icon: 'fa-coins' }
];

const CONTROL_EFFECT_TYPES = new Set(['slow', 'stun', 'freeze', 'web', 'knockback']);
const HERO_TACTIC_BADGE_IDS = ['aura', 'economy', 'detection', 'antiarmor', 'control', 'dot', 'area', 'boss', 'crit', 'support', 'dps', 'frontline', 'water', 'mountain'];
const HERO_TACTIC_BADGE_LIMIT = 3;
const FRONTLINE_TRAITS = ['asalto', 'cadena', 'cadenas', 'cercan', 'corta', 'corto', 'cuerpo a cuerpo', 'duelista', 'frente', 'golpe', 'tanque', 'vanguardia'];
const DPS_TRAITS = ['artilleria', 'daño sostenido', 'dano sostenido', 'explosivo', 'laser', 'linea', 'perfora', 'splash'];
const SUPPORT_TRAITS = ['anti-soporte', 'aura', 'detector', 'economia', 'marca', 'revela', 'soporte'];

export function normalizeHeroSearchText(value = '') {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function getTacticFilterConfig(filterId) {
    return HERO_TACTIC_FILTERS.find((filter) => filter.id === filterId) || null;
}

function textIncludesAny(text, fragments = []) {
    return fragments.some((fragment) => text.includes(fragment));
}

export function getHeroTraitText(hero = {}) {
    return normalizeHeroSearchText([
        hero.name,
        hero.category,
        hero.ability,
        hero.abilityDesc,
        hero.niche,
        ...(hero.tags || [])
    ]
        .filter(Boolean)
        .join(' '));
}

export function heroMatchesTacticId(hero = {}, filter = 'all') {
    if (filter === 'all') return true;

    const allowedTerrains = hero.allowedTerrains || [TERRAIN.grass];
    if (filter === 'grass') return allowedTerrains.includes(TERRAIN.grass);
    if (filter === 'water') return allowedTerrains.includes(TERRAIN.water);
    if (filter === 'mountain') return allowedTerrains.includes(TERRAIN.mountain);

    const special = hero.special || {};
    const effects = special.attackEffects || [];
    const profile = special.projectileProfile || {};
    const metrics = hero.teamMetrics || {};
    const traitText = getHeroTraitText(hero);

    if (filter === 'detection') {
        return Boolean(hero.canSeeStealth || special.supportAura?.detectStealth || metrics.detection >= 4 || traitText.includes('sigilo') || traitText.includes('deteccion'));
    }
    if (filter === 'antiarmor') {
        return Boolean(profile.armorPenetration > 0
            || effects.some((effect) => effect.type === 'armorBreak')
            || traitText.includes('antiarmadura')
            || traitText.includes('armadura')
            || traitText.includes('blindaje')
            || traitText.includes('perforacion')
            || traitText.includes('barrera'));
    }
    if (filter === 'dps') {
        return Boolean(metrics.damage >= 4
            || hero.damage >= 35
            || textIncludesAny(traitText, DPS_TRAITS));
    }
    if (filter === 'frontline') {
        const range = Number(hero.range || 0);
        return Boolean(hero.rangePattern === 'ring'
            || (range > 0 && range <= 120 && (metrics.damage >= 3 || metrics.control >= 3))
            || (range > 0 && range <= 155 && metrics.damage >= 4 && textIncludesAny(traitText, FRONTLINE_TRAITS)));
    }
    if (filter === 'support') {
        return Boolean(metrics.support >= 4
            || special.supportAura?.type
            || special.economyOnHit
            || textIncludesAny(traitText, SUPPORT_TRAITS));
    }
    if (filter === 'control') {
        return Boolean(metrics.control >= 4
            || effects.some((effect) => CONTROL_EFFECT_TYPES.has(effect.type))
            || traitText.includes('control')
            || traitText.includes('ralentiza')
            || traitText.includes('paraliza')
            || traitText.includes('congela')
            || traitText.includes('inmoviliza')
            || traitText.includes('aturde'));
    }
    if (filter === 'area') {
        return Boolean(profile.splashRadius > 0
            || profile.chainCount > 0
            || profile.propagationCount > 0
            || ['cross', 'x', 'ring'].includes(hero.rangePattern)
            || traitText.includes('area')
            || traitText.includes('grupo')
            || traitText.includes('rebote')
            || traitText.includes('encadena'));
    }
    if (filter === 'dot') {
        return Boolean(effects.some((effect) => ['burn', 'poison', 'curse', 'bleed'].includes(effect.type))
            || traitText.includes('quemadura')
            || traitText.includes('veneno')
            || traitText.includes('toxina')
            || traitText.includes('maldicion')
            || traitText.includes('sangrado')
            || traitText.includes('persistente'));
    }
    if (filter === 'boss') {
        return Boolean(traitText.includes('jefe')
            || traitText.includes('boss')
            || traitText.includes('elite')
            || traitText.includes('elites')
            || profile.armorPenetration >= 0.25);
    }
    if (filter === 'crit') {
        return Boolean((special.statModifiers?.critChance || 0) > 0
            || (hero.critChance || 0) >= 8
            || traitText.includes('critico')
            || traitText.includes('criticos')
            || traitText.includes('critica')
            || traitText.includes('remate')
            || traitText.includes('suerte'));
    }
    if (filter === 'aura') {
        return Boolean(special.supportAura?.type || traitText.includes('aura'));
    }
    if (filter === 'economy') {
        return Boolean(special.economyOnHit || traitText.includes('economia') || traitText.includes('credito'));
    }
    return true;
}

export function getHeroTacticBadges(hero = {}, limit = HERO_TACTIC_BADGE_LIMIT) {
    return HERO_TACTIC_BADGE_IDS
        .filter((filterId) => heroMatchesTacticId(hero, filterId))
        .slice(0, Math.max(0, Math.floor(Number(limit) || HERO_TACTIC_BADGE_LIMIT)))
        .map((filterId) => {
            const config = getTacticFilterConfig(filterId);
            return {
                id: filterId,
                label: config?.label || filterId,
                icon: config?.icon || 'fa-tag'
            };
        });
}

export function buildTeamReadinessAlerts(snapshot = {}, team = []) {
    const metrics = snapshot.metrics || {};
    const tags = snapshot.tagCounts || {};
    const hasHero = (predicate) => team.some((hero) => predicate(hero || {}));
    const searchableText = (hero) => normalizeHeroSearchText([hero.ability, hero.abilityDesc, hero.niche, ...(hero.tags || [])].join(' '));
    const hasDetection = hasHero((hero) => hero.canSeeStealth || hero.special?.supportAura?.detectStealth || (hero.teamMetrics?.detection || 0) >= 4);
    const hasAntiArmor = hasHero((hero) => {
        const text = searchableText(hero);
        return (hero.special?.projectileProfile?.armorPenetration || 0) > 0
            || (hero.special?.attackEffects || []).some((effect) => effect.type === 'armorBreak')
            || text.includes('armadura')
            || text.includes('blindaje')
            || text.includes('perforacion');
    });
    const hasControl = hasHero((hero) => (hero.teamMetrics?.control || 0) >= 4
        || (hero.special?.attackEffects || []).some((effect) => CONTROL_EFFECT_TYPES.has(effect.type)));
    const hasWater = hasHero((hero) => (hero.allowedTerrains || [TERRAIN.grass]).includes(TERRAIN.water));
    const hasMountain = hasHero((hero) => (hero.allowedTerrains || [TERRAIN.grass]).includes(TERRAIN.mountain));
    const alerts = [];

    const add = (id, label, detail, icon, tone = 'warning') => alerts.push({ id, label, detail, icon, tone });
    if (!team.length) add('empty', 'Sin equipo', 'elige hasta 6 heroes para empezar', 'fa-user-plus', 'danger');
    if (team.length > 0 && team.length < 6) add('slots', String(6 - team.length) + ' huecos', 'completa el escuadron activo', 'fa-users', 'info');
    if (!hasDetection) add('detection', 'Sin deteccion', 'sigilo y faseadores te pueden pasar', 'fa-eye', 'danger');
    if (!hasAntiArmor) add('antiarmor', 'Sin antiarmadura', 'blindaje y barreras van a resistir', 'fa-bullseye', 'warning');
    if (!hasControl && (metrics.control || 0) < 58) add('control', 'Control bajo', 'faltan slows, stuns o redes', 'fa-hand-paper', 'warning');
    if ((metrics.damage || 0) < 54 && team.length >= 3) add('damage', 'Dano bajo', 'sube niveles o suma DPS', 'fa-bolt', 'warning');
    if ((metrics.coverage || 0) < 60 && team.length >= 3) add('coverage', 'Cobertura corta', 'faltan rangos o mejores posiciones', 'fa-location-crosshairs', 'info');
    if (!hasWater) add('water', 'Sin agua', 'mapas anfibios limitaran opciones', 'fa-water', 'info');
    if (!hasMountain) add('mountain', 'Sin montana', 'techos y altura quedan desaprovechados', 'fa-mountain', 'info');
    if (Object.values(tags).some((count) => count >= 2)) add('synergy', 'Bonus cercano', 'revisa agrupaciones antes de cerrar', 'fa-people-group', 'good');

    const priority = { danger: 0, warning: 1, info: 2, good: 3 };
    const sorted = alerts.sort((a, b) => priority[a.tone] - priority[b.tone] || a.label.localeCompare(b.label));
    if (!sorted.length) return [{ id: 'ready', label: 'Equipo estable', detail: 'cubre respuestas y terrenos principales', icon: 'fa-shield-halved', tone: 'good' }];
    const visible = sorted.slice(0, 3);
    const overflow = sorted.length - visible.length;
    if (overflow > 0) {
        visible.push({
            id: 'more',
            label: `+${overflow}`,
            detail: `${overflow} alertas tacticas mas en filtros y radar`,
            icon: 'fa-ellipsis',
            tone: 'info',
            overflow: true
        });
    }
    return visible;
}
