export const SYNERGY_DEFINITIONS = {
    Avengers: family('Avengers', '#e63946', 'Ataque coordinado para equipos de primera linea.',
        tier(3, 'Asamblea tactica', { damagePct: 0.04, fireRatePct: 0.02 }),
        tier(5, 'Vengadores unidos', { damagePct: 0.07, fireRatePct: 0.03, critChance: 1 })),
    Mutantes: family('Mutantes', '#f4d35e', 'Talento mutante que escala critico y control de mapa.',
        tier(3, 'Entrenamiento mutante', { critChance: 4, rangePct: 0.04 }),
        tier(5, 'Equipo dorado', { critChance: 7, damagePct: 0.06, rangePct: 0.04 })),
    Defenders: family('Defenders', '#f4d35e', 'Defensa urbana resistente y precisa.',
        tier(3, 'Guardia urbana', { rangePct: 0.07, critChance: 3 }),
        tier(5, 'Defensa sin descanso', { rangePct: 0.1, damagePct: 0.05, detectStealth: true })),
    Guardianes: family('Guardianes', '#ff6bd6', 'Cadencia cosmica para rutas largas.',
        tier(3, 'Tripulacion improvisada', { fireRatePct: 0.07, rangePct: 0.03 }),
        tier(5, 'Guardianes de la galaxia', { fireRatePct: 0.1, damagePct: 0.05 })),
    'Místico': family('Místico', '#b865ff', 'Habilidades mas fuertes y enfriamientos mas cortos.',
        tier(3, 'Circulo arcano', { abilityPower: 0.07, cooldown: 0.04 }),
        tier(5, 'Convergencia mistica', { abilityPower: 0.12, cooldown: 0.07 })),
    Callejero: family('Callejero', '#40c9ff', 'Lectura de amenaza, sigilo y control de barrio.',
        tier(3, 'Red de informantes', { rangePct: 0.05, detectStealth: true }),
        tier(5, 'Heroes del barrio', { rangePct: 0.08, fireRatePct: 0.05, detectStealth: true })),
    Wakanda: family('Wakanda', '#9c7cff', 'Tecnologia vibranium y disciplina real.',
        tier(3, 'Wakanda por siempre', { damagePct: 0.08, abilityPower: 0.06, critChance: 2 })),
    'Tecnología': family('Tecnología', '#5be7ff', 'Red tactica para cadencia y cobertura.',
        tier(3, 'Red tactica', { fireRatePct: 0.04, rangePct: 0.03 }),
        tier(5, 'Protocolo integrado', { fireRatePct: 0.05, rangePct: 0.04 })),
    'Cósmico': family('Cósmico', '#ffdf6f', 'Energia estelar para romper oleadas densas.',
        tier(3, 'Orbita ofensiva', { damagePct: 0.06, rangePct: 0.05 }),
        tier(5, 'Frente galactico', { damagePct: 0.1, rangePct: 0.07, abilityPower: 0.04 })),
    Espías: family('Espías', '#94a3b8', 'Inteligencia S.H.I.E.L.D. contra elites y sigilo.',
        tier(3, 'Operacion encubierta', { critChance: 4, detectStealth: true }),
        tier(5, 'Red de inteligencia', { critChance: 6, rangePct: 0.06, detectStealth: true })),
    Oscuros: family('Oscuros', '#7c3aed', 'Anti-heroes sobrenaturales con control sostenido.',
        tier(3, 'Pacto nocturno', { abilityPower: 0.07, damagePct: 0.04 }),
        tier(5, 'Medianoche viva', { abilityPower: 0.1, cooldown: 0.05, damagePct: 0.05 })),
    Marciales: family('Marciales', '#fb923c', 'Duelistas de corto alcance con golpes criticos.',
        tier(3, 'Dojo de combate', { critChance: 5, fireRatePct: 0.04 }),
        tier(5, 'Maestros del cuerpo a cuerpo', { critChance: 8, damagePct: 0.06 })),
    Inhumanos: family('Inhumanos', '#38bdf8', 'Control elemental y presion de area.',
        tier(3, 'Consejo de Attilan', { abilityPower: 0.06, rangePct: 0.05, cooldown: 0.03 })),
    Atlánticos: family('Atlánticos', '#22d3ee', 'Defensa anfibia y ruptura de blindaje.',
        tier(3, 'Marea real', { damagePct: 0.07, rangePct: 0.04, allowWater: true })),
    Rivales: family('Rivales', '#ff4fd8', 'Equipos mixtos de choque que convierten variedad en tempo.',
        tier(3, 'Choque coordinado', { abilityPower: 0.04, fireRatePct: 0.01 }),
        tier(5, 'Convergencia rival', { damagePct: 0.015, rangePct: 0.015, detectStealth: true }))
};

export const PAIR_SYNERGIES = [
    pair('ciencia_y_escudo', 'Ciencia y escudo', ['iron_man', 'capitan_america'], { damagePct: 0.03, abilityPower: 0.04 }),
    pair('dios_y_monstruo', 'Dios y monstruo', ['thor', 'hulk'], { damagePct: 0.04, cooldown: 0.03 }),
    pair('caos_y_orden', 'Caos y orden', ['doctor_strange', 'scarlet_witch'], { abilityPower: 0.08, cooldown: 0.05 }),
    pair('reyes_wakanda', 'Reyes de Wakanda', ['black_panther', 'shuri'], { damagePct: 0.05, rangePct: 0.04 }),
    pair('voz_y_reina', 'Voz de Attilan', ['black_bolt', 'medusa'], { abilityPower: 0.06, damagePct: 0.04 }),
    pair('marea_real', 'Marea real', ['namor', 'namora'], { damagePct: 0.05, rangePct: 0.03 })
];

export const FORMATION_DEFINITIONS = {
    vanguard: { label: 'Vanguardia', radius: 110, color: '#ff7b86' },
    support: { label: 'Apoyo', radius: 150, color: '#69e6a6' },
    artillery: { label: 'Artilleria', radius: 185, color: '#67d9ff' }
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
        if (combined.allowWater && Array.isArray(hero.allowedTerrains) && !hero.allowedTerrains.includes(0)) hero.allowedTerrains.push(0);
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
        const nextTier = definition.tiers.find((entry) => count < entry.count) || null;
        return { tag, count, definition, activeTier, nextTier };
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
        ids: [...ids],
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

export function getSynergyMenuModel(snapshot, roster = [], unlockedIds = new Set()) {
    const activeIds = new Set(snapshot?.ids || []);
    return (snapshot?.families || []).map((familySnapshot) => {
        const members = roster.filter((hero) => hero.tags?.includes(familySnapshot.tag));
        const selected = members.filter((hero) => activeIds.has(hero.id));
        const unlocked = members.filter((hero) => unlockedIds.has(hero.id));
        const targetTier = familySnapshot.nextTier || familySnapshot.activeTier || familySnapshot.definition.tiers[0];
        const needed = familySnapshot.nextTier ? Math.max(0, familySnapshot.nextTier.count - familySnapshot.count) : 0;
        const state = familySnapshot.activeTier ? 'active' : needed === 1 ? 'near' : 'locked';
        return {
            tag: familySnapshot.tag,
            label: familySnapshot.definition.label,
            color: familySnapshot.definition.color,
            description: familySnapshot.definition.description,
            count: familySnapshot.count,
            rosterCount: members.length,
            selectedNames: selected.map((hero) => hero.name),
            unlockedNames: unlocked.map((hero) => hero.name),
            activeTier: familySnapshot.activeTier,
            nextTier: familySnapshot.nextTier,
            state,
            needed,
            progressLabel: targetTier ? `${familySnapshot.count}/${targetTier.count}` : `${familySnapshot.count}/0`,
            effectLabel: formatEffectSummary((familySnapshot.activeTier || familySnapshot.nextTier || targetTier)?.effects)
        };
    }).sort((a, b) => {
        const stateScore = { active: 0, near: 1, locked: 2 };
        return stateScore[a.state] - stateScore[b.state] || b.count - a.count || a.label.localeCompare(b.label);
    });
}

export function formatEffectSummary(effects = {}) {
    const labels = [];
    if (effects.damagePct) labels.push(`+${percent(effects.damagePct)} dano`);
    if (effects.fireRatePct) labels.push(`+${percent(effects.fireRatePct)} cadencia`);
    if (effects.rangePct) labels.push(`+${percent(effects.rangePct)} alcance`);
    if (effects.critChance) labels.push(`+${effects.critChance}% critico`);
    if (effects.abilityPower) labels.push(`+${percent(effects.abilityPower)} poder`);
    if (effects.cooldown) labels.push(`-${percent(effects.cooldown)} cooldown`);
    if (effects.detectStealth) labels.push('detecta sigilo');
    if (effects.allowWater) labels.push('permite agua');
    return labels.join(' · ');
}

function family(label, color, description, ...tiers) {
    return { label, color, description, tiers };
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

function percent(value) {
    return Math.round(value * 100);
}

function getRole(hero) {
    return hero.config?.formationRole || hero.formationRole || 'artillery';
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export { mergeEffects };
