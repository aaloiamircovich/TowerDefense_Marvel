export const SYNERGY_DEFINITIONS = {
    Avengers: family('Avengers', '#e63946',
        tier(2, 'Iniciativa Avengers', { damagePct: 0.04 }),
        tier(4, 'Vengadores unidos', { damagePct: 0.07, fireRatePct: 0.03 })),
    Defenders: family('Defenders', '#f4d35e',
        tier(2, 'Guardia urbana', { rangePct: 0.06, critChance: 2 }),
        tier(4, 'Defensa sin descanso', { rangePct: 0.09, damagePct: 0.04 })),
    Guardianes: family('Guardianes', '#ff6bd6',
        tier(2, 'Tripulación improvisada', { fireRatePct: 0.05, rangePct: 0.03 }),
        tier(4, 'Guardianes de la galaxia', { fireRatePct: 0.08, damagePct: 0.04 })),
    'X-Men': family('X-Men', '#f4d35e',
        tier(2, 'Entrenamiento mutante', { critChance: 3, rangePct: 0.03 }),
        tier(4, 'Equipo dorado', { critChance: 5, damagePct: 0.05 })),
    'Místico': family('Místico', '#b865ff',
        tier(2, 'Círculo arcano', { abilityPower: 0.05, cooldown: 0.03 }),
        tier(4, 'Convergencia mística', { abilityPower: 0.09, cooldown: 0.05 })),
    Callejero: family('Callejero', '#40c9ff',
        tier(2, 'Red de informantes', { rangePct: 0.04, detectStealth: true }),
        tier(4, 'Héroes del barrio', { rangePct: 0.07, fireRatePct: 0.04, detectStealth: true })),
    Wakanda: family('Wakanda', '#9c7cff',
        tier(2, 'Tecnología de Wakanda', { damagePct: 0.05, critChance: 2 }),
        tier(4, 'Wakanda por siempre', { damagePct: 0.08, abilityPower: 0.06 })),
    'Tecnología': family('Tecnología', '#5be7ff',
        tier(2, 'Red táctica', { fireRatePct: 0.04, rangePct: 0.03 }),
        tier(4, 'Protocolo integrado', { fireRatePct: 0.07, rangePct: 0.05 }))
};

export const PAIR_SYNERGIES = [
    pair('ciencia_y_escudo', 'Ciencia y escudo', ['iron_man', 'capitan_america'], { damagePct: 0.03, abilityPower: 0.04 }),
    pair('dios_y_monstruo', 'Dios y monstruo', ['thor', 'hulk'], { damagePct: 0.04, cooldown: 0.03 }),
    pair('caos_y_orden', 'Caos y orden', ['doctor_strange', 'scarlet_witch'], { abilityPower: 0.08, cooldown: 0.05 }),
    pair('reyes_wakanda', 'Reyes de Wakanda', ['black_panther', 'shuri'], { damagePct: 0.05, rangePct: 0.04 })
];

export const FORMATION_DEFINITIONS = {
    vanguard: { label: 'Vanguardia', radius: 110, color: '#ff7b86' },
    support: { label: 'Apoyo', radius: 150, color: '#69e6a6' },
    artillery: { label: 'Artillería', radius: 185, color: '#67d9ff' }
};

export class TeamSynergySystem {
    constructor(game) {
        this.game = game;
    }

    applyHeroStats(hero, stats) {
        const effects = getHeroTeamEffects(hero, this.game.activeTeam || []);
        const formation = this.getFormationEffects(hero);
        const combined = mergeEffects(effects, formation);
        stats.damage *= 1 + (combined.damagePct || 0);
        stats.fireRate *= 1 + (combined.fireRatePct || 0);
        stats.range *= 1 + (combined.rangePct || 0);
        stats.critChance += combined.critChance || 0;
        if (combined.detectStealth) stats.canSeeStealth = true;
        return stats;
    }

    getAbilityModifiers(hero) {
        const effects = getHeroTeamEffects(hero, this.game.activeTeam || []);
        return { abilityPower: effects.abilityPower || 0, cooldown: effects.cooldown || 0 };
    }

    getSnapshot() {
        return analyzeTeam(this.game.activeTeam || []);
    }

    getFormationEffects(hero) {
        const deployed = this.game.heroes || [];
        const role = hero.config?.formationRole || hero.formationRole || 'artillery';
        if (role === 'vanguard') {
            const partner = deployed.some((candidate) => candidate !== hero
                && getRole(candidate) === 'vanguard' && distance(candidate, hero) <= FORMATION_DEFINITIONS.vanguard.radius);
            return partner ? { damagePct: 0.06, critChance: 2 } : {};
        }
        if (role === 'support') {
            const allies = deployed.filter((candidate) => candidate !== hero && distance(candidate, hero) <= FORMATION_DEFINITIONS.support.radius);
            return allies.length >= 2 ? { rangePct: 0.05, fireRatePct: 0.04 } : {};
        }
        const screen = deployed.some((candidate) => candidate !== hero && getRole(candidate) === 'vanguard'
            && distance(candidate, hero) >= 70 && distance(candidate, hero) <= FORMATION_DEFINITIONS.artillery.radius);
        return screen ? { damagePct: 0.07, rangePct: 0.05 } : {};
    }

    getFormationStatus(hero) {
        const definition = FORMATION_DEFINITIONS[getRole(hero)] || FORMATION_DEFINITIONS.artillery;
        return { ...definition, active: Object.keys(this.getFormationEffects(hero)).length > 0 };
    }

    renderFormationRadius(ctx, hero) {
        if (this.game.selectedUnit !== hero && !this.game.isManuallyPaused) return;
        const status = this.getFormationStatus(hero);
        ctx.save();
        ctx.strokeStyle = status.color;
        ctx.globalAlpha = status.active ? 0.75 : 0.36;
        ctx.lineWidth = status.active ? 3 : 2;
        ctx.setLineDash([8, 7]);
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, status.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

export function analyzeTeam(team = []) {
    const tagCounts = {};
    team.forEach((hero) => (hero.tags || []).forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
    const families = Object.entries(SYNERGY_DEFINITIONS).map(([tag, definition]) => {
        const count = tagCounts[tag] || 0;
        const activeTier = [...definition.tiers].reverse().find((entry) => count >= entry.count) || null;
        return { tag, count, definition, activeTier };
    });
    const ids = new Set(team.map((hero) => hero.id));
    const pairs = PAIR_SYNERGIES.map((definition) => ({ ...definition, active: definition.heroIds.every((id) => ids.has(id)) }));
    const distinctTags = Object.values(tagCounts).filter((count) => count > 0).length;
    const metrics = ['damage', 'control', 'support', 'detection'].reduce((result, key) => {
        result[key] = team.length ? Math.round(team.reduce((sum, hero) => sum + (hero.teamMetrics?.[key] || 1), 0) / (team.length * 5) * 100) : 0;
        return result;
    }, {});
    metrics.coverage = team.length ? Math.min(100, Math.round(team.reduce((sum, hero) => sum + Math.min(1, (hero.range || 100) / 220), 0) / team.length * 100)) : 0;
    return {
        size: team.length,
        cost: team.reduce((sum, hero) => sum + (hero.cost || 0), 0),
        tagCounts,
        families,
        pairs,
        distinctTags,
        versatile: team.length >= 4 && distinctTags >= 4,
        formationCounts: Object.fromEntries(Object.keys(FORMATION_DEFINITIONS).map((role) => [role, team.filter((hero) => (hero.formationRole || 'artillery') === role).length])),
        metrics
    };
}

export function getHeroTeamEffects(hero, team) {
    const snapshot = analyzeTeam(team);
    let effects = {};
    snapshot.families.forEach((familySnapshot) => {
        if (familySnapshot.activeTier && hero.tags?.includes(familySnapshot.tag)) {
            effects = mergeEffects(effects, familySnapshot.activeTier.effects);
        }
    });
    snapshot.pairs.forEach((pairSnapshot) => {
        if (pairSnapshot.active && pairSnapshot.heroIds.includes(hero.id)) effects = mergeEffects(effects, pairSnapshot.effects);
    });
    if (snapshot.versatile) effects = mergeEffects(effects, { damagePct: 0.025, rangePct: 0.025 });
    return effects;
}

function family(label, color, ...tiers) {
    return { label, color, tiers };
}

function tier(count, label, effects) {
    return { count, label, effects };
}

function pair(id, label, heroIds, effects) {
    return { id, label, heroIds, effects };
}

function mergeEffects(...sources) {
    const result = {};
    sources.forEach((source) => Object.entries(source || {}).forEach(([key, value]) => {
        result[key] = typeof value === 'boolean' ? Boolean(result[key] || value) : (result[key] || 0) + value;
    }));
    return result;
}

function getRole(hero) {
    return hero.config?.formationRole || hero.formationRole || 'artillery';
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export { mergeEffects };
