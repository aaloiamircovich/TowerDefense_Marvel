const PIERCING_HERO_IDS = new Set(['iron_man', 'vision', 'hawkeye', 'winter_soldier', 'cyclops', 'silver_surfer']);

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

    if (score >= 6) return { id: 'prime', label: 'Respuesta ideal', score, reasons: reasons.slice(0, 3) };
    if (score >= 3) return { id: 'good', label: 'Buen ajuste', score, reasons: reasons.slice(0, 3) };
    return { id: 'neutral', label: 'Neutro', score, reasons: reasons.slice(0, 2) };
}

export function getHeroConfig(hero = {}) {
    return hero?.config || hero || {};
}

export function getHeroName(hero = {}) {
    const config = getHeroConfig(hero);
    return hero.name || config.name || config.id || 'Heroe';
}

export function getHeroCost(hero = {}) {
    const config = getHeroConfig(hero);
    return Number(config.cost ?? hero.cost ?? 0);
}

export function getHeroDps(hero = {}) {
    const config = getHeroConfig(hero);
    const stats = hero.getEffectiveStats?.() || hero;
    const damage = Number(stats.damage || hero.damage || config.damage || 0);
    const fireRate = Number(stats.fireRate || hero.fireRate || config.fireRate || 1);
    return damage * fireRate;
}

export function heroDetectsStealth(hero = {}) {
    const config = getHeroConfig(hero);
    return Boolean(hero.canSeeStealth || config.canSeeStealth)
        || Number(config.teamMetrics?.detection || hero.teamMetrics?.detection || 0) >= 4
        || hasTextMatch(config, ['sigilo', 'deteccion', 'rastreo', 'edith']);
}

export function heroPiercesArmor(hero = {}) {
    const config = getHeroConfig(hero);
    return PIERCING_HERO_IDS.has(config.id || hero.id)
        || hasTextMatch(config, ['armadura', 'perfor', 'atraviesa', 'antiarmadura', 'laser']);
}

export function heroControlsCrowd(hero = {}) {
    const config = getHeroConfig(hero);
    return Number(config.teamMetrics?.control || hero.teamMetrics?.control || 0) >= 4
        || hasTextMatch(config, ['ralent', 'inmovil', 'aturd', 'control', 'red']);
}

export function heroHasReach(hero = {}) {
    const config = getHeroConfig(hero);
    const stats = hero.getEffectiveStats?.() || hero;
    return Number(stats.range || hero.range || config.range || 0) >= 150
        || hasTextMatch(config, ['alcance', 'francotirador', 'larga distancia', 'rebote', 'cadena']);
}

export function heroHasFocusDamage(hero = {}) {
    const config = getHeroConfig(hero);
    const dps = getHeroDps(hero);
    return dps >= 34
        || Number(config.teamMetrics?.damage || hero.teamMetrics?.damage || 0) >= 4
        || hasTextMatch(config, ['critico', 'boss', 'jefe', 'ejecucion', 'burst', 'marca']);
}

export function heroCoversCounter(hero = {}, counterId = '') {
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
            label: 'Respuestas',
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
