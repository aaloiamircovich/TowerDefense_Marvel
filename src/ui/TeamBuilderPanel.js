import { formatEffectSummary, getNextSynergyRecommendation, getSynergyMenuModel } from '../systems/TeamSynergySystem.js';
import { EVOLUTION_CATALOG } from '../systems/EvolutionSystem.js';
import { buildVillainCodexModel } from '../systems/VillainCodexSystem.js';
import { HERO_RARITIES, getRarityClass, normalizeRarity } from '../utils/Rarity.js';
import { resolveEvolutionVisualContract } from '../utils/HeroVisuals.js';
import { buildItemEquipDeltaRows, renderItemDeltaRows } from './InventoryPanel.js';
import { TERRAIN } from '../utils/TerrainRules.js';

const METRIC_LABELS = {
    coverage: 'Cobertura',
    control: 'Control',
    damage: 'Daño',
    detection: 'Detección',
};

const HERO_TACTIC_FILTERS = [
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

function normalizeSearchText(value = '') {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function getTacticFilterConfig(filterId) {
    return HERO_TACTIC_FILTERS.find((filter) => filter.id === filterId) || null;
}

function getHeroTraitText(hero = {}) {
    return normalizeSearchText([
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
            || hero.formationRole === 'artillery'
            || hero.damage >= 35
            || traitText.includes('laser')
            || traitText.includes('explosivo'));
    }
    if (filter === 'frontline') {
        return Boolean(hero.formationRole === 'vanguard'
            || hero.rangePattern === 'ring'
            || hero.range <= 95
            || traitText.includes('cuerpo a cuerpo')
            || traitText.includes('frente')
            || traitText.includes('tanque'));
    }
    if (filter === 'support') {
        return Boolean(hero.formationRole === 'support'
            || metrics.support >= 4
            || special.supportAura?.type
            || special.economyOnHit
            || traitText.includes('soporte')
            || traitText.includes('aura')
            || traitText.includes('detector')
            || traitText.includes('economia'));
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
    const searchableText = (hero) => normalizeSearchText([hero.ability, hero.abilityDesc, hero.niche, ...(hero.tags || [])].join(' '));
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
    if (!sorted.length) return [{ id: 'ready', label: 'Equipo estable', detail: 'cubre counters y terrenos principales', icon: 'fa-shield-halved', tone: 'good' }];
    return sorted.slice(0, 5);
}

export class TeamBuilderPanel {
    constructor(ui) {
        this.ui = ui;
        this.searchQuery = '';
        this.sortMode = 'az';
        this.rarityFilter = 'all';
        this.ownershipFilter = 'all';
        this.tacticalFilter = 'all';
        this.synergyExpanded = false;
        this.viewMode = 'heroes';
    }

    getCollectionSprite(hero) {
        return this.ui.getHeroDisplaySprite?.(hero) || hero.visual?.portrait || hero.sprite;
    }

    render(title = 'Equipo') {
        const game = this.ui.game;
        const unlockedIds = new Set(game.progression.state.unlockedHeroIds);
        const pendingItem = this.getPendingInventoryItem();
        const readyHeroes = Object.values(game.heroDatabase)
            .filter((hero) => hero.visual)
            .sort((a, b) => Number(unlockedIds.has(b.id)) - Number(unlockedIds.has(a.id)) || a.name.localeCompare(b.name));
        const filteredHeroes = this.getFilteredHeroes(readyHeroes, unlockedIds);
        const snapshot = game.teamSynergy.getSnapshot();

        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong>${game.activeTeam.length}/6 activos · despliegue libre</strong>
            </div>
            ${this.renderCollectionCommandHeader({ readyHeroes, filteredHeroes, unlockedIds, snapshot })}
            ${this.renderCollectionTabs()}

            ${this.viewMode === 'heroes' ? `<section id="collection-panel-heroes" class="collection-tab-panel" role="tabpanel" aria-labelledby="collection-tab-heroes">
                <section class="team-builder-summary">
                ${pendingItem ? this.renderPendingItemBanner(pendingItem) : ''}
                <div class="team-slot-strip">
                    ${Array.from({ length: 6 }, (_, index) => this.renderTeamSlot(game.activeTeam[index], index)).join('')}
                </div>
                ${this.renderMapTeamLoadoutControls()}
                <div class="team-metrics">
                    ${Object.entries(METRIC_LABELS).map(([key, label]) => `
                        <div class="team-metric"><span>${label}</span><div><i style="width:${snapshot.metrics[key]}%"></i></div><b>${snapshot.metrics[key]}</b></div>
                    `).join('')}
                </div>
                ${this.renderTeamReadinessAlerts(snapshot, game.activeTeam)}
                ${this.renderSynergyMenu(snapshot, readyHeroes, unlockedIds)}
                </section>

                ${this.renderCollectionFilters(filteredHeroes.length, readyHeroes.length)}
                <div class="collection-grid team-collection-grid">
                    ${filteredHeroes.length
                        ? filteredHeroes.map((hero) => this.renderHeroCard(hero, unlockedIds.has(hero.id))).join('')
                        : '<p class="empty-copy collection-empty">No hay heroes con esos filtros.</p>'}
                </div>
            </section>` : this.viewMode === 'villains'
                ? `<section id="collection-panel-villains" class="collection-tab-panel" role="tabpanel" aria-labelledby="collection-tab-villains">${this.renderVillainCodex()}</section>`
                : `<section id="collection-panel-evolutions" class="collection-tab-panel" role="tabpanel" aria-labelledby="collection-tab-evolutions">${this.renderEvolutionCodex()}</section>`}
        `;

        this.bindListeners();
    }

    renderTeamReadinessAlerts(snapshot, team = []) {
        const alerts = buildTeamReadinessAlerts(snapshot, team);
        const chips = alerts.map((alert) => '<span class="team-readiness-chip ' + this.escapeAttribute(alert.tone) + '" title="' + this.escapeAttribute(alert.detail) + '"><i class="fas ' + this.escapeAttribute(alert.icon) + '"></i><b>' + this.escapeHtml(alert.label) + '</b><small>' + this.escapeHtml(alert.detail) + '</small></span>').join('');
        return '<div class="team-readiness-strip" aria-label="Lectura tactica del equipo">' + chips + '</div>';
    }

    renderTeamSlot(hero, index) {
        if (!hero) return `<div class="team-slot-empty" aria-label="Espacio ${index + 1} libre"><span>${index + 1}</span><i class="fas fa-plus"></i></div>`;
        return `
            <button class="team-slot-filled remove-team-hero" type="button" data-id="${hero.id}" aria-label="Quitar a ${hero.name}" title="Quitar del equipo" data-tooltip="Quitar del equipo">
                ${this.ui.renderSprite(this.getCollectionSprite(hero), hero.name)}
                <span>${hero.name}</span>
                <i class="fas fa-xmark"></i>
            </button>
        `;
    }

    renderMapTeamLoadoutControls() {
        const game = this.ui.game;
        const level = game.currentLevel || game.levelsData?.[0] || { id: 'level_1', name: 'Mapa actual' };
        const saved = game.progression.getMapTeamLoadout?.(level.id) || { count: 0, label: 'Sin equipo guardado' };
        const hasTeam = (game.activeTeam || []).length > 0;
        const hasSaved = saved.count > 0;
        const currentLabel = (game.activeTeam || []).map((hero) => hero.name).join(' + ') || 'Equipo vacio';
        const savedLabel = hasSaved ? saved.label : 'Sin preset guardado';
        return `
            <div class="map-team-loadout" aria-label="Preset de equipo para ${this.escapeAttribute(level.name)}">
                <div>
                    <span><i class="fas fa-map-location-dot"></i> Equipo de mapa</span>
                    <strong>${this.escapeHtml(level.name)}</strong>
                    <small title="${this.escapeAttribute(savedLabel)}">${this.escapeHtml(savedLabel)}</small>
                </div>
                <button id="save-map-team-loadout" class="btn-primary ghost" type="button" aria-label="Guardar equipo actual para ${this.escapeAttribute(level.name)}: ${this.escapeAttribute(currentLabel)}" title="Guardar equipo actual" data-tooltip="Guardar equipo actual" ${hasTeam ? '' : 'disabled'}>
                    <i class="fas fa-floppy-disk"></i> Guardar
                </button>
                <button id="apply-map-team-loadout" class="btn-primary ghost" type="button" aria-label="Aplicar equipo guardado para ${this.escapeAttribute(level.name)}: ${this.escapeAttribute(savedLabel)}" title="Aplicar equipo guardado" data-tooltip="Aplicar equipo guardado" ${hasSaved ? '' : 'disabled'}>
                    <i class="fas fa-rotate-left"></i> Aplicar
                </button>
            </div>
        `;
    }

    renderSynergyMenu(snapshot, readyHeroes, unlockedIds) {
        const groups = getSynergyMenuModel(snapshot, readyHeroes, unlockedIds);
        const activeCount = groups.filter((group) => group.state === 'active').length;
        const collapsed = !this.synergyExpanded;
        return `
            <section class="allegiance-menu ${collapsed ? 'collapsed' : 'expanded'}" aria-label="Agrupaciones">
                <div class="allegiance-heading">
                    <div>
                        <h3>Agrupaciones</h3>
                        <span>${collapsed ? 'Minimizadas para ver heroes' : 'Vista completa de bonus'}</span>
                        ${collapsed ? this.renderSynergySummaryPills(groups) : ''}
                    </div>
                    <strong>${activeCount}/${groups.length} activas</strong>
                    <button class="icon-command toggle-synergies" type="button" aria-expanded="${this.synergyExpanded}" aria-label="${this.synergyExpanded ? 'Minimizar agrupaciones' : 'Expandir agrupaciones'}" title="${this.synergyExpanded ? 'Minimizar agrupaciones' : 'Expandir agrupaciones'}" data-tooltip="${this.synergyExpanded ? 'Minimizar agrupaciones' : 'Expandir agrupaciones'}">
                        <i class="fas fa-chevron-${this.synergyExpanded ? 'up' : 'down'}"></i>
                    </button>
                </div>
                ${collapsed ? '' : this.renderSynergyOverview(snapshot)}
                ${collapsed ? '' : `
                    <div class="allegiance-grid">
                        ${groups.map((group) => this.renderSynergyGroup(group)).join('')}
                    </div>
                `}
            </section>
        `;
    }

    renderSynergyOverview(snapshot) {
        return `
            <div class="synergy-overview">
                ${snapshot.families.filter((family) => family.count > 0).map((family) => {
                    const rarity = normalizeRarity(family.definition.rarity);
                    const rarityClass = getRarityClass(rarity);
                    return `
                    <span class="synergy-chip ${rarityClass} ${family.activeTier ? 'active' : ''}" style="--synergy-color:${family.definition.color}">
                        <b>${family.tag}</b> ${family.nextTier ? `${family.count}/${family.nextTier.count}` : `${family.count}/${family.activeTier?.count || 0}`}${family.activeTier ? ` · ${family.activeTier.label}` : ''} <i>${rarity}</i>
                    </span>
                `;
                }).join('')}
                ${snapshot.pairs.filter((pair) => pair.active).map((pair) => `<span class="synergy-chip pair active"><b>${pair.label}</b></span>`).join('')}
            </div>
        `;
    }

    renderSynergySummaryPills(groups = []) {
        const highlights = groups
            .filter((group) => group.state === 'active' || group.state === 'near')
            .slice(0, 3);
        if (!highlights.length) {
            return '<div class="allegiance-quick-summary muted"><b>Sin bonus activo</b></div>';
        }
        return `
            <div class="allegiance-quick-summary">
                ${highlights.map((group) => `
                    <span class="${group.rarityClass} ${group.state}" style="--synergy-color:${group.color}">
                        <b>${this.escapeHtml(group.label)}</b>
                        <small>${this.escapeHtml(group.progressLabel)} ${group.state === 'active' ? 'activo' : 'a 1'}</small>
                    </span>
                `).join('')}
            </div>
        `;
    }

    renderSynergyGroup(group) {
        const tier = group.activeTier || group.nextTier;
        const memberLabel = group.memberNames.length ? group.memberNames.join(', ') : 'Sin heroes asociados';
        const selectedLabel = group.selectedNames.length ? group.selectedNames.join(', ') : 'Ninguno';
        const missingLabel = group.missingNames.length ? group.missingNames.join(', ') : 'Completa';
        const stateLabel = group.activeTier ? group.activeTier.label : group.needed === 1 ? 'A un heroe' : `${group.needed} faltan`;
        return `
            <article class="allegiance-card ${group.state} ${group.rarityClass}" data-rarity="${group.rarity}" style="--synergy-color:${group.color}">
                <div>
                    <span>${group.progressLabel}</span>
                    <strong>${group.label}</strong>
                </div>
                <b class="rarity-badge ${group.rarityClass}">${group.rarity}</b>
                <p>${group.description}</p>
                <small>${tier?.label || 'Sin umbral'} - ${formatEffectSummary(tier?.effects || {})}</small>
                <em><b>Necesitas:</b> ${memberLabel}</em>
                <em><b>En equipo:</b> ${selectedLabel}</em>
                <em><b>${group.needed > 0 ? 'Faltan' : 'Estado'}:</b> ${group.needed > 0 ? missingLabel : stateLabel}</em>
            </article>
        `;
    }

    renderCollectionCommandHeader({ readyHeroes, filteredHeroes, unlockedIds, snapshot }) {
        const ownedCount = readyHeroes.filter((hero) => unlockedIds.has(hero.id)).length;
        const activeSynergyCount = snapshot.families.filter((family) => family.activeTier).length
            + snapshot.pairs.filter((pair) => pair.active).length;
        const recommendation = getNextSynergyRecommendation(snapshot, readyHeroes, unlockedIds);
        const pendingItem = this.getPendingInventoryItem();
        const filterLabels = this.getActiveFilterLabels();
        const modeText = pendingItem
            ? `Equipando ${pendingItem.name}`
            : `${filteredHeroes.length}/${readyHeroes.length} visibles`;
        return `
            <section class="collection-command-header" aria-label="Resumen de coleccion">
                <div class="collection-command-copy">
                    <span class="briefing-kicker">ARCHIVO DE EQUIPO</span>
                    <strong>${this.getViewLabel()}</strong>
                    <small>${modeText}</small>
                    <div class="collection-filter-pills">
                        ${filterLabels.map((label) => `<span>${this.escapeHtml(label)}</span>`).join('')}
                    </div>
                </div>
                <div class="collection-command-readout">
                    <span><i class="fas fa-user-shield"></i><small>Equipo</small><b>${this.ui.game.activeTeam.length}/6</b></span>
                    <span><i class="fas fa-id-badge"></i><small>Heroes</small><b>${ownedCount}/${readyHeroes.length}</b></span>
                    <span><i class="fas fa-people-group"></i><small>Agrup.</small><b>${activeSynergyCount} activas</b></span>
                    <span><i class="fas fa-filter"></i><small>Filtros</small><b>${Math.max(0, filterLabels.length - (filterLabels[0] === 'Sin filtros' ? 1 : 0))}</b></span>
                </div>
                ${recommendation ? this.renderSynergyRecommendation(recommendation) : ''}
            </section>
        `;
    }

    renderSynergyRecommendation(recommendation) {
        const actionLabel = recommendation.unlocked
            ? `Añadir ${recommendation.heroName} para ${recommendation.groupLabel}`
            : `${recommendation.heroName} falta por reclutar para ${recommendation.groupLabel}`;
        const afterLabel = recommendation.neededAfter === 0
            ? 'bonus listo'
            : `${recommendation.neededAfter} faltan luego`;
        return `
            <div class="collection-synergy-recommendation ${recommendation.rarityClass}" style="--synergy-color:${recommendation.color || 'var(--level-accent)'}" aria-label="Recomendacion de agrupacion: ${this.escapeAttribute(actionLabel)}">
                <i class="fas fa-people-arrows"></i>
                <div>
                    <span>${this.escapeHtml(recommendation.action)} · ${this.escapeHtml(recommendation.progressLabel)}</span>
                    <strong>${this.escapeHtml(recommendation.heroName)} → ${this.escapeHtml(recommendation.groupLabel)}</strong>
                    <small>${this.escapeHtml(recommendation.effectLabel || afterLabel)} · ${this.escapeHtml(afterLabel)}</small>
                </div>
                <b class="rarity-badge ${recommendation.rarityClass}">${this.escapeHtml(recommendation.rarity)}</b>
                <button class="btn-primary ghost synergy-recommendation-action ${recommendation.unlocked ? 'btn-equip' : ''}" type="button" data-id="${this.escapeAttribute(recommendation.heroId)}" aria-label="${this.escapeAttribute(actionLabel)}" title="${this.escapeAttribute(actionLabel)}" data-tooltip="${this.escapeAttribute(actionLabel)}" aria-disabled="${!recommendation.unlocked}" ${recommendation.unlocked ? '' : 'disabled'}>
                    ${recommendation.unlocked ? 'Añadir' : 'Por reclutar'}
                </button>
            </div>
        `;
    }

    getViewLabel() {
        const labels = {
            heroes: 'Heroes disponibles',
            villains: 'Diccionario de villanos',
            evolutions: 'Diccionario de evoluciones'
        };
        return labels[this.viewMode] || labels.heroes;
    }

    hasActiveHeroFilters() {
        return Boolean(this.searchQuery.trim())
            || this.rarityFilter !== 'all'
            || this.ownershipFilter !== 'all'
            || this.tacticalFilter !== 'all'
            || this.sortMode !== 'az';
    }

    resetHeroFilters() {
        this.searchQuery = '';
        this.sortMode = 'az';
        this.rarityFilter = 'all';
        this.ownershipFilter = 'all';
        this.tacticalFilter = 'all';
    }

    getActiveFilterLabels() {
        const labels = [];
        const query = this.searchQuery.trim();
        if (query) labels.push(`Busqueda: ${query}`);
        if (this.rarityFilter !== 'all') labels.push(`Rareza: ${normalizeRarity(this.rarityFilter)}`);
        if (this.ownershipFilter !== 'all') {
            const ownershipLabels = {
                owned: 'Solo obtenidos',
                missing: 'Solo faltantes',
                favorites: 'Solo favoritos'
            };
            labels.push(ownershipLabels[this.ownershipFilter] || 'Solo estado');
        }
        if (this.tacticalFilter !== 'all') labels.push(`Tactica: ${this.getTacticalFilterLabel(this.tacticalFilter)}`);
        if (this.sortMode !== 'az') labels.push(`Orden: ${this.getSortLabel(this.sortMode)}`);
        return labels.length ? labels : ['Sin filtros'];
    }

    getSortLabel(sortMode) {
        const labels = {
            za: 'Z-A',
            'rarity-desc': 'Rareza alta',
            'rarity-asc': 'Rareza baja'
        };
        return labels[sortMode] || 'A-Z';
    }

    getTacticalFilterLabel(filterId = this.tacticalFilter) {
        return HERO_TACTIC_FILTERS.find((filter) => filter.id === filterId)?.label || 'Todas';
    }

    getHeroTraitText(hero) {
        return getHeroTraitText(hero);
    }

    heroMatchesTacticalFilter(hero) {
        return heroMatchesTacticId(hero, this.tacticalFilter || 'all');
    }

    getPendingInventoryItem() {
        const itemId = this.ui.inventoryPanel?.pendingEquipItemId;
        return itemId ? this.ui.game.itemDatabase[itemId] || null : null;
    }

    getHeroEquippedItem(heroId) {
        const game = this.ui.game;
        const slots = game.progression.state.equippedItems[heroId] || {};
        const itemId = Object.values(slots)[0] || null;
        return itemId ? game.itemDatabase[itemId] || null : null;
    }

    renderPendingItemBanner(item) {
        return `
            <div class="pending-item-banner">
                <div class="pending-item-preview">
                    ${this.ui.renderSprite(item.icon, item.name)}
                    <div>
                        <span class="briefing-kicker">EQUIPAR OBJETO</span>
                        <strong>${item.name}</strong>
                        <small>Elegí un héroe de la colección para asignarlo.</small>
                    </div>
                </div>
                <div class="pending-item-actions">
                    <button id="cancel-pending-item" class="btn-primary ghost" type="button" aria-label="Cancelar equipamiento" title="Cancelar equipamiento" data-tooltip="Cancelar equipamiento"><i class="fas fa-xmark"></i> Cancelar</button>
                    <button id="back-to-inventory" class="btn-primary ghost" type="button" aria-label="Volver al inventario" title="Volver al inventario" data-tooltip="Volver al inventario"><i class="fas fa-box-open"></i> Inventario</button>
                </div>
            </div>
        `;
    }

    renderCollectionTabs() {
        const tabs = [
            ['heroes', 'fa-users', 'Heroes'],
            ['villains', 'fa-skull', 'Villanos'],
            ['evolutions', 'fa-dna', 'Evoluciones']
        ];
        return `
            <div class="collection-tabs" role="tablist" aria-label="Secciones de coleccion">
                ${tabs.map(([view, icon, label]) => {
                    const active = this.viewMode === view;
                    return `<button id="collection-tab-${view}" class="collection-view-tab ${active ? 'active' : ''}" data-view="${view}" type="button" role="tab" aria-selected="${active}" aria-controls="collection-panel-${view}" tabindex="${active ? '0' : '-1'}" aria-label="${label}" title="${label}" data-tooltip="${label}">
                        <i class="fas ${icon}"></i> ${label}
                    </button>`;
                }).join('')}
            </div>
        `;
    }
    getRarityRank(hero) {
        return HERO_RARITIES.indexOf(normalizeRarity(hero.rarity));
    }

    getFilteredHeroes(heroes, unlockedIds = new Set()) {
        const query = normalizeSearchText(this.searchQuery.trim());
        const favoriteIds = new Set(this.ui.game.progression.state.favoriteHeroIds || []);
        return [...heroes]
            .filter((hero) => {
                const rarity = normalizeRarity(hero.rarity);
                if (this.rarityFilter !== 'all' && rarity !== this.rarityFilter) return false;
                const unlocked = unlockedIds.has(hero.id);
                if (this.ownershipFilter === 'owned' && !unlocked) return false;
                if (this.ownershipFilter === 'missing' && unlocked) return false;
                if (this.ownershipFilter === 'favorites' && !favoriteIds.has(hero.id)) return false;
                if (!this.heroMatchesTacticalFilter(hero)) return false;
                if (!query) return true;

                return normalizeSearchText([
                    hero.name,
                    hero.category,
                    hero.ability,
                    hero.niche,
                    ...(hero.tags || [])
                ]
                    .filter(Boolean)
                    .join(' '))
                    .includes(query);
            })
            .sort((a, b) => {
                if (this.sortMode === 'za') return b.name.localeCompare(a.name);
                if (this.sortMode === 'rarity-desc') return this.getRarityRank(b) - this.getRarityRank(a) || a.name.localeCompare(b.name);
                if (this.sortMode === 'rarity-asc') return this.getRarityRank(a) - this.getRarityRank(b) || a.name.localeCompare(b.name);
                return a.name.localeCompare(b.name);
            });
    }

    renderCollectionFilters(visibleCount, totalCount) {
        const hasActiveFilters = this.hasActiveHeroFilters();
        return `
            <section class="collection-toolbar" aria-label="Filtros de coleccion">
                <label class="collection-search">
                    <i class="fas fa-search"></i>
                    <input id="collection-search-input" type="search" value="${this.escapeAttribute(this.searchQuery)}" placeholder="Buscar heroe, rol o grupo" autocomplete="off" aria-label="Buscar heroe, rol o grupo">
                </label>
                <label class="collection-sort">
                    <span>Orden</span>
                    <select id="collection-sort-select" aria-label="Ordenar coleccion">
                        <option value="az" ${this.sortMode === 'az' ? 'selected' : ''}>A-Z</option>
                        <option value="za" ${this.sortMode === 'za' ? 'selected' : ''}>Z-A</option>
                        <option value="rarity-desc" ${this.sortMode === 'rarity-desc' ? 'selected' : ''}>Rareza alta</option>
                        <option value="rarity-asc" ${this.sortMode === 'rarity-asc' ? 'selected' : ''}>Rareza baja</option>
                    </select>
                </label>
                <label class="collection-sort">
                    <span>Estado</span>
                    <select id="collection-ownership-select" aria-label="Filtrar heroes por estado de obtencion">
                        <option value="all" ${this.ownershipFilter === 'all' ? 'selected' : ''}>Todos</option>
                        <option value="owned" ${this.ownershipFilter === 'owned' ? 'selected' : ''}>Obtenidos</option>
                        <option value="missing" ${this.ownershipFilter === 'missing' ? 'selected' : ''}>Faltantes</option>
                        <option value="favorites" ${this.ownershipFilter === 'favorites' ? 'selected' : ''}>Favoritos</option>
                    </select>
                </label>
                <label class="collection-sort">
                    <span>Tactica</span>
                    <select id="collection-tactical-select" aria-label="Filtrar heroes por respuesta tactica">
                        ${HERO_TACTIC_FILTERS.map((filter) => `<option value="${filter.id}" ${this.tacticalFilter === filter.id ? 'selected' : ''}>${filter.label}</option>`).join('')}
                    </select>
                </label>
                ${this.renderTacticQuickFilters()}
                <div class="collection-rarity-filters" aria-label="Filtrar por rareza">
                    ${['all', ...HERO_RARITIES].map((rarity) => {
                        const active = this.rarityFilter === rarity;
                        const label = rarity === 'all' ? 'Todas' : rarity;
                        const rarityClass = rarity === 'all' ? '' : getRarityClass(rarity);
                        return `<button class="rarity-filter ${rarityClass} ${active ? 'active' : ''}" type="button" data-rarity="${rarity}" aria-pressed="${active}" aria-label="Filtrar rareza ${label}" title="Filtrar rareza ${label}" data-tooltip="Filtrar rareza ${label}">${label}</button>`;
                    }).join('')}
                </div>
                <button id="collection-clear-filters" class="collection-clear-filters icon-command" type="button" ${hasActiveFilters ? '' : 'disabled'} title="Limpiar filtros" aria-label="Limpiar filtros" data-tooltip="Limpiar filtros">
                    <i class="fas fa-broom"></i>
                </button>
                <strong>${visibleCount}/${totalCount}</strong>
            </section>
        `;
    }

    renderTacticQuickFilters() {
        return `
            <div class="team-tactic-chipbar" aria-label="Filtros tacticos rapidos">
                ${HERO_TACTIC_FILTERS.map((filter) => {
                    const active = this.tacticalFilter === filter.id;
                    const label = filter.id === 'all' ? 'Ver todos los heroes' : `Filtrar ${filter.label}`;
                    return `<button class="team-tactic-chip ${active ? 'active' : ''}" type="button" data-tactic="${this.escapeAttribute(filter.id)}" aria-pressed="${active}" aria-label="${this.escapeAttribute(label)}" title="${this.escapeAttribute(label)}" data-tooltip="${this.escapeAttribute(label)}">
                        <i class="fas ${this.escapeAttribute(filter.icon)}"></i>
                        <span>${this.escapeHtml(filter.label)}</span>
                    </button>`;
                }).join('')}
            </div>
        `;
    }

    renderHeroCard(hero, unlocked) {
        const game = this.ui.game;
        const equipped = game.activeTeam.some((active) => active.id === hero.id);
        const pendingItem = this.getPendingInventoryItem();
        const equippedItem = this.getHeroEquippedItem(hero.id);
        const evolution = hero.evolutionId ? game.progression.getHeroEvolution(hero.id) : null;
        const availableEvolution = hero.evolutionId ? EVOLUTION_CATALOG[hero.evolutionId] : null;
        const rarity = normalizeRarity(hero.rarity);
        const rarityClass = getRarityClass(rarity);
        const favorite = game.progression.isHeroFavorite?.(hero.id)
            || game.progression.state.favoriteHeroIds?.includes(hero.id)
            || false;
        const alreadyHasPendingItem = equippedItem?.id === pendingItem?.id;
        const itemDeltaPreview = pendingItem && unlocked
            ? `<div class="hero-item-delta-preview">${renderItemDeltaRows(buildItemEquipDeltaRows(pendingItem, equippedItem))}</div>`
            : '';
        const heroStateLabel = unlocked
            ? equipped ? 'en equipo activo' : 'desbloqueado'
            : 'bloqueado';
        const cardAriaLabel = `${hero.name}. Rareza ${rarity}. ${heroStateLabel}.`;
        const previewLabel = `Ver ficha de ${hero.name}`;
        const equipActionLabel = pendingItem
            ? alreadyHasPendingItem
                ? `${pendingItem.name} ya esta equipado en ${hero.name}`
                : unlocked
                    ? `${equippedItem ? 'Reemplazar objeto de' : 'Equipar'} ${hero.name} con ${pendingItem.name}`
                    : `${hero.name} requiere reclutamiento antes de equipar ${pendingItem.name}`
            : unlocked
                ? equipped
                    ? `Quitar ${hero.name} del equipo`
                    : `Anadir ${hero.name} al equipo`
                : `${hero.name} bloqueado, pendiente de reclutar`;
        const favoriteLabel = favorite ? `Quitar ${hero.name} de favoritos` : `Marcar ${hero.name} como favorito`;
        const tacticBadges = getHeroTacticBadges(hero);
        const tacticBadgeLabels = tacticBadges.map((badge) => badge.label).join(', ');
        return `
            <article class="collection-card team-hero-card ${rarityClass} ${unlocked ? '' : 'locked'} ${equipped ? 'equipped' : ''} ${favorite ? 'favorite' : ''} ${pendingItem ? 'item-target-mode' : ''}" data-rarity="${rarity}" role="listitem" aria-label="${this.escapeAttribute(cardAriaLabel)}">
                ${equippedItem ? `<span class="hero-item-corner" title="${equippedItem.name} equipado">${this.ui.renderSprite(equippedItem.icon, equippedItem.name)}</span>` : ''}
                ${this.ui.renderSprite(this.getCollectionSprite(hero), hero.name)}
                <h3>${hero.name}</h3>
                ${evolution ? `<strong class="evolution-badge" style="--evolution-color:${evolution.color}">${evolution.name}</strong>` : ''}
                <small><b class="rarity-badge ${rarityClass}">${rarity}</b></small>
                ${tacticBadges.length ? `<div class="hero-tactic-badges" aria-label="Respuestas tacticas: ${this.escapeAttribute(tacticBadgeLabels)}">
                    ${tacticBadges.map((badge) => `<span data-tactic="${this.escapeAttribute(badge.id)}" title="${this.escapeAttribute(badge.label)}" data-tooltip="${this.escapeAttribute(badge.label)}"><i class="fas ${this.escapeAttribute(badge.icon)}"></i><em>${this.escapeHtml(badge.label)}</em></span>`).join('')}
                </div>` : ''}
                <div class="collection-actions">
                    <button class="btn-favorite-hero icon-command ${favorite ? 'active' : ''}" type="button" data-id="${hero.id}" aria-label="${this.escapeAttribute(favoriteLabel)}" title="${this.escapeAttribute(favoriteLabel)}" data-tooltip="${this.escapeAttribute(favoriteLabel)}" aria-pressed="${favorite}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="btn-preview-hero icon-command" type="button" data-id="${hero.id}" aria-label="${this.escapeAttribute(previewLabel)}" title="Ver ficha" data-tooltip="Ver ficha"><i class="fas fa-eye"></i></button>
                    ${pendingItem ? `
                        <button class="${unlocked && !alreadyHasPendingItem ? 'btn-assign-item' : ''} btn-primary ${alreadyHasPendingItem ? 'ghost' : ''}" type="button" data-id="${hero.id}" aria-label="${this.escapeAttribute(equipActionLabel)}" title="${this.escapeAttribute(equipActionLabel)}" data-tooltip="${this.escapeAttribute(equipActionLabel)}" aria-disabled="${unlocked && !alreadyHasPendingItem ? 'false' : 'true'}" ${unlocked && !alreadyHasPendingItem ? '' : 'disabled'}>
                            ${unlocked ? (alreadyHasPendingItem ? 'Ya equipado' : (equippedItem ? 'Reemplazar' : 'Equipar')) : 'Por reclutar'}
                        </button>
                    ` : `
                        <button class="${unlocked ? 'btn-equip' : ''} btn-primary ${equipped ? 'danger' : 'ghost'}" type="button" data-id="${hero.id}" aria-label="${this.escapeAttribute(equipActionLabel)}" title="${this.escapeAttribute(equipActionLabel)}" data-tooltip="${this.escapeAttribute(equipActionLabel)}" aria-pressed="${equipped}" aria-disabled="${!unlocked}" ${unlocked ? '' : 'disabled'}>
                            ${unlocked ? (equipped ? 'Quitar' : 'Añadir') : 'Por reclutar'}
                        </button>
                    `}
                </div>
                ${itemDeltaPreview}
                ${availableEvolution ? `<small class="evolution-requirement">${evolution ? 'Evolucion activa' : `Evoluciona al nivel ${availableEvolution.requiredLevel}`}</small>` : ''}
            </article>
        `;
    }

    renderVillainCodex() {
        const game = this.ui.game;
        const model = buildVillainCodexModel(game.enemyDatabase, game.progression.state.codexDiscovered.enemies);
        const bossCount = model.entries.filter((entry) => entry.isBoss).length;
        const lockedCount = model.total - model.discovered;
        return `
            ${this.renderCodexHeader({
                title: 'Diccionario de villanos',
                description: 'Los registros se desbloquean cuando el enemigo aparece en una oleada.',
                stats: [
                    { icon: 'fa-eye', label: 'Avistados', value: `${model.discovered}/${model.total}` },
                    { icon: 'fa-lock', label: 'Bloqueados', value: lockedCount },
                    { icon: 'fa-crown', label: 'Jefes', value: bossCount }
                ]
            })}
            <div class="villain-codex-grid">
                ${model.entries.map((entry) => this.renderVillainCard(entry)).join('')}
            </div>
        `;
    }

    renderVillainCard(entry) {
        const sprite = entry.sprite
            ? this.ui.renderSprite(entry.sprite, entry.name)
            : '<div class="villain-silhouette"><i class="fas fa-question"></i></div>';
        return `
            <article class="villain-card villain-card--compact ${entry.unlocked ? 'unlocked' : 'locked'} ${entry.isBoss ? 'boss' : ''}">
                ${sprite}
                <div>
                    <h3>${entry.name}</h3>
                    <small>${entry.category} · ${entry.role}</small>
                    <span>${entry.faction}</span>
                </div>
                <b>${entry.unlocked ? '◆'.repeat(entry.threat) : '?????'}</b>
                <div class="hero-tag-list">${entry.traits.map((trait) => `<span>${trait}</span>`).join('')}</div>
            </article>
        `;
    }

    renderEvolutionCodex() {
        const game = this.ui.game;
        const entries = Object.values(EVOLUTION_CATALOG)
            .filter((evolution) => game.heroDatabase?.[evolution.baseHeroId])
            .sort((a, b) => game.heroDatabase[a.baseHeroId].name.localeCompare(game.heroDatabase[b.baseHeroId].name, 'es'));
        const signatureCount = entries.filter((evolution) => (evolution.itemTransforms || []).length > 0).length;
        const lateGameCount = entries.filter((evolution) => Number(evolution.requiredLevel) >= 100).length;
        return `
            ${this.renderCodexHeader({
                title: 'Diccionario de evoluciones',
                description: 'Las evoluciones por nivel se activan automaticamente. Los objetos signature agregan mecanicas extra.',
                stats: [
                    { icon: 'fa-dna', label: 'Registros', value: entries.length },
                    { icon: 'fa-gem', label: 'Signature', value: signatureCount },
                    { icon: 'fa-arrow-trend-up', label: 'Nivel 100', value: lateGameCount }
                ]
            })}
            <div class="villain-codex-grid evolution-codex-grid">
                ${entries.map((evolution) => {
                    const hero = game.heroDatabase[evolution.baseHeroId];
                    const visualContract = resolveEvolutionVisualContract(game.evolutionVisualDatabase, evolution)
                        || (evolution.itemTransforms || []).map((entry) => game.evolutionVisualDatabase?.[entry.id]).find(Boolean);
                    const sprite = visualContract?.visual?.idle?.south
                        || visualContract?.visual?.portrait
                        || this.getCollectionSprite(hero);
                    const transforms = (evolution.itemTransforms || [])
                        .map((entry) => game.itemDatabase?.[entry.itemId]?.name || entry.itemId)
                        .join(', ');
                    return `
                        <article class="villain-card villain-card--compact unlocked evolution-card">
                            ${this.ui.renderSprite(sprite, evolution.name)}
                            <div>
                                <h3>${hero.name}</h3>
                                <small>Nivel ${evolution.requiredLevel} · ${evolution.name}</small>
                                <span>${transforms ? `Signature: ${transforms}` : 'Evolucion por nivel'}</span>
                            </div>
                            <b><i class="fas fa-dna"></i></b>
                            <div class="hero-tag-list">
                                <span>Daño +${Math.round((evolution.stats.damage || 0) * 100)}%</span>
                                <span>Cadencia +${Math.round((evolution.stats.fireRate || 0) * 100)}%</span>
                                <span>Alcance +${Math.round((evolution.stats.range || 0) * 100)}%</span>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderCodexHeader({ title, description, stats }) {
        return `
            <section class="villain-codex-header codex-command-header">
                <div>
                    <span class="briefing-kicker">ARCHIVO HEROICO</span>
                    <h3>${title}</h3>
                    <p>${description}</p>
                </div>
                <div class="codex-readout">
                    ${stats.map((stat) => `<span><i class="fas ${stat.icon}"></i><small>${stat.label}</small><b>${stat.value}</b></span>`).join('')}
                </div>
            </section>
        `;
    }

    switchCollectionView(view = 'heroes', focusTab = false) {
        this.viewMode = view || 'heroes';
        this.render('Constructor de equipo');
        if (!focusTab) return;
        this.ui.panelContent.querySelector?.(`[data-view="${this.viewMode}"]`)?.focus?.();
    }

    bindListeners() {
        const game = this.ui.game;
        const tabs = [...this.ui.panelContent.querySelectorAll('.collection-view-tab')];
        tabs.forEach((button, index) => {
            button.addEventListener('click', () => this.switchCollectionView(button.dataset.view || 'heroes'));
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
                this.switchCollectionView(tabs[nextIndex]?.dataset.view || 'heroes', true);
            });
        });
        if (this.viewMode !== 'heroes') return;
        this.ui.panelContent.querySelector('#collection-search-input')?.addEventListener('input', (event) => {
            this.searchQuery = event.target.value;
            this.render('Constructor de equipo');
            const input = this.ui.panelContent.querySelector('#collection-search-input');
            input?.focus();
            input?.setSelectionRange(input.value.length, input.value.length);
        });
        this.ui.panelContent.querySelector('#collection-sort-select')?.addEventListener('change', (event) => {
            this.sortMode = event.target.value;
            this.render('Constructor de equipo');
        });
        this.ui.panelContent.querySelector('#collection-ownership-select')?.addEventListener('change', (event) => {
            this.ownershipFilter = event.target.value;
            this.render('Constructor de equipo');
        });
        this.ui.panelContent.querySelector('#collection-tactical-select')?.addEventListener('change', (event) => {
            this.tacticalFilter = event.target.value;
            this.render('Constructor de equipo');
        });
        this.ui.panelContent.querySelectorAll('.team-tactic-chip').forEach((button) => button.addEventListener('click', () => {
            this.tacticalFilter = button.dataset.tactic || 'all';
            this.render('Constructor de equipo');
        }));
        this.ui.panelContent.querySelectorAll('.rarity-filter').forEach((button) => button.addEventListener('click', () => {
            this.rarityFilter = button.dataset.rarity || 'all';
            this.render('Constructor de equipo');
        }));
        this.ui.panelContent.querySelector('#collection-clear-filters')?.addEventListener('click', () => {
            this.resetHeroFilters();
            this.render('Constructor de equipo');
        });
        this.ui.panelContent.querySelector('.toggle-synergies')?.addEventListener('click', () => {
            this.synergyExpanded = !this.synergyExpanded;
            this.render('Constructor de equipo');
        });
        this.ui.panelContent.querySelector('#save-map-team-loadout')?.addEventListener('click', () => {
            const result = game.progression.saveMapTeamLoadout?.(game.currentLevel?.id) || { ok: false, reason: 'Preset no disponible' };
            this.ui.showToast(result.ok ? `Equipo guardado para ${game.currentLevel?.name || 'este mapa'}` : result.reason, result.ok ? 'success' : 'warning');
            this.render('Constructor de equipo');
        });
        this.ui.panelContent.querySelector('#apply-map-team-loadout')?.addEventListener('click', () => {
            const result = game.progression.applyMapTeamLoadout?.(game.currentLevel?.id) || { ok: false, reason: 'Preset no disponible' };
            this.ui.showToast(result.ok ? `Equipo de ${game.currentLevel?.name || 'mapa'} aplicado` : result.reason, result.ok ? 'success' : 'warning');
            if (result.ok) this.ui.renderHeroRoster(game.activeTeam, (entry) => game.inputManager.setPlacementMode(entry));
            this.render('Constructor de equipo');
        });
        this.ui.panelContent.querySelector('#cancel-pending-item')?.addEventListener('click', () => {
            this.ui.inventoryPanel.pendingEquipItemId = null;
            this.render('Constructor de equipo');
        });
        this.ui.panelContent.querySelector('#back-to-inventory')?.addEventListener('click', () => {
            this.ui.inventoryPanel.pendingEquipItemId = null;
            this.ui.renderPanel('inventory');
        });
        this.ui.panelContent.querySelectorAll('.btn-favorite-hero').forEach((button) => button.addEventListener('click', () => {
            const hero = game.heroDatabase[button.dataset.id];
            const result = game.progression.toggleHeroFavorite?.(button.dataset.id) || { ok: false, reason: 'Favoritos no disponibles' };
            this.ui.showToast(
                result.ok ? `${hero?.name || 'Heroe'} ${result.favorite ? 'marcado como favorito' : 'quitado de favoritos'}` : result.reason,
                result.ok ? 'success' : 'warning'
            );
            this.render('Constructor de equipo');
        }));
        this.ui.panelContent.querySelectorAll('.btn-assign-item').forEach((button) => button.addEventListener('click', () => {
            const pendingItem = this.getPendingInventoryItem();
            if (!pendingItem) return;
            const hero = game.heroDatabase[button.dataset.id];
            const ok = game.progression.equipItem(hero.id, pendingItem.id);
            this.ui.inventoryPanel.pendingEquipItemId = null;
            this.ui.renderHeroRoster(game.activeTeam, (entry) => game.inputManager.setPlacementMode(entry));
            this.ui.showToast(ok ? `${pendingItem.name} equipado en ${hero.name}` : 'No se pudo equipar el objeto', ok ? 'success' : 'warning');
            this.render('Constructor de equipo');
        }));
        this.ui.panelContent.querySelectorAll('.btn-equip').forEach((button) => button.addEventListener('click', () => {
            const teamIds = game.activeTeam.map((hero) => hero.id);
            const equipped = teamIds.includes(button.dataset.id);
            if (!equipped && teamIds.length >= 6) {
                this.ui.showToast('Tu equipo activo está lleno', 'warning');
                return;
            }
            game.progression.setActiveTeam(equipped
                ? teamIds.filter((id) => id !== button.dataset.id)
                : [...teamIds, button.dataset.id]);
            this.syncAndRender();
        }));
        this.ui.panelContent.querySelectorAll('.remove-team-hero').forEach((button) => button.addEventListener('click', () => {
            game.progression.setActiveTeam(game.activeTeam.map((hero) => hero.id).filter((id) => id !== button.dataset.id));
            this.syncAndRender();
        }));
        this.ui.panelContent.querySelectorAll('.btn-preview-hero').forEach((button) => button.addEventListener('click', () => {
            this.ui.renderHeroDetails(game.heroDatabase[button.dataset.id]);
        }));
        this.ui.panelContent.querySelectorAll('.btn-evolution').forEach((button) => button.addEventListener('click', () => {
            const active = game.progression.getHeroEvolution(button.dataset.id);
            game.progression.setHeroEvolution(button.dataset.id, active ? null : button.dataset.evolution);
            this.ui.showToast(active ? 'Forma base restaurada' : `${game.progression.getHeroEvolution(button.dataset.id).name} activado`, 'success');
            this.syncAndRender();
        }));
    }

    syncAndRender() {
        const game = this.ui.game;
        this.ui.renderHeroRoster(game.activeTeam, (hero) => game.inputManager.setPlacementMode(hero));
        this.ui.showToast('Composición actualizada', 'success');
        this.render('Constructor de equipo');
    }

    escapeAttribute(value = '') {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
    }

    escapeHtml(value = '') {
        return this.escapeAttribute(value);
    }
}
