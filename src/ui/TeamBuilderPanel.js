import { formatEffectSummary, getSynergyMenuModel } from '../systems/TeamSynergySystem.js';
import { EVOLUTION_CATALOG } from '../systems/EvolutionSystem.js';
import { buildVillainCodexModel } from '../systems/VillainCodexSystem.js';
import { HERO_RARITIES, getRarityClass, normalizeRarity } from '../utils/Rarity.js';

const METRIC_LABELS = {
    coverage: 'Cobertura',
    control: 'Control',
    damage: 'Daño',
    detection: 'Detección',
};

export class TeamBuilderPanel {
    constructor(ui) {
        this.ui = ui;
        this.searchQuery = '';
        this.sortMode = 'az';
        this.rarityFilter = 'all';
        this.synergyExpanded = false;
        this.viewMode = 'heroes';
    }

    getCollectionSprite(hero) {
        return this.ui.getHeroDisplaySprite?.(hero) || hero.visual?.portrait || hero.sprite;
    }

    render(title = 'Equipo') {
        const game = this.ui.game;
        const unlockedIds = new Set(game.progression.state.unlockedHeroIds);
        const readyHeroes = Object.values(game.heroDatabase)
            .filter((hero) => hero.visual)
            .sort((a, b) => Number(unlockedIds.has(b.id)) - Number(unlockedIds.has(a.id)) || a.name.localeCompare(b.name));
        const filteredHeroes = this.getFilteredHeroes(readyHeroes);
        const snapshot = game.teamSynergy.getSnapshot();

        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong>${game.activeTeam.length}/6 activos · despliegue libre</strong>
            </div>
            ${this.renderCollectionTabs()}

            ${this.viewMode === 'heroes' ? `<section class="team-builder-summary">
                <div class="team-slot-strip">
                    ${Array.from({ length: 6 }, (_, index) => this.renderTeamSlot(game.activeTeam[index], index)).join('')}
                </div>
                <div class="team-metrics">
                    ${Object.entries(METRIC_LABELS).map(([key, label]) => `
                        <div class="team-metric"><span>${label}</span><div><i style="width:${snapshot.metrics[key]}%"></i></div><b>${snapshot.metrics[key]}</b></div>
                    `).join('')}
                </div>
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
                    ${snapshot.versatile ? '<span class="synergy-chip versatile active"><b>Equipo versátil</b> · +2.5% daño y alcance</span>' : ''}
                </div>
                ${this.renderSynergyMenu(snapshot, readyHeroes, unlockedIds)}
            </section>

            ${this.renderCollectionFilters(filteredHeroes.length, readyHeroes.length)}
            <div class="collection-grid team-collection-grid">
                ${filteredHeroes.length
                    ? filteredHeroes.map((hero) => this.renderHeroCard(hero, unlockedIds.has(hero.id))).join('')
                    : '<p class="empty-copy collection-empty">No hay heroes con esos filtros.</p>'}
            </div>` : this.renderVillainCodex()}
        `;

        this.bindListeners();
    }

    renderTeamSlot(hero, index) {
        if (!hero) return `<div class="team-slot-empty" aria-label="Espacio ${index + 1} libre"><span>${index + 1}</span><i class="fas fa-plus"></i></div>`;
        return `
            <button class="team-slot-filled remove-team-hero" data-id="${hero.id}" aria-label="Quitar a ${hero.name}" title="Quitar del equipo">
                ${this.ui.renderSprite(this.getCollectionSprite(hero), hero.name)}
                <span>${hero.name}</span>
                <i class="fas fa-xmark"></i>
            </button>
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
                    </div>
                    <strong>${activeCount}/${groups.length} activas</strong>
                    <button class="icon-command toggle-synergies" type="button" aria-expanded="${this.synergyExpanded}" aria-label="${this.synergyExpanded ? 'Minimizar agrupaciones' : 'Expandir agrupaciones'}" title="${this.synergyExpanded ? 'Minimizar agrupaciones' : 'Expandir agrupaciones'}">
                        <i class="fas fa-chevron-${this.synergyExpanded ? 'up' : 'down'}"></i>
                    </button>
                </div>
                <div class="allegiance-grid" ${collapsed ? 'hidden' : ''}>
                    ${groups.map((group) => this.renderSynergyGroup(group)).join('')}
                </div>
            </section>
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

    renderCollectionTabs() {
        return `
            <div class="collection-tabs" role="tablist" aria-label="Secciones de coleccion">
                <button class="collection-view-tab ${this.viewMode === 'heroes' ? 'active' : ''}" data-view="heroes" type="button" aria-selected="${this.viewMode === 'heroes'}">
                    <i class="fas fa-users"></i> Heroes
                </button>
                <button class="collection-view-tab ${this.viewMode === 'villains' ? 'active' : ''}" data-view="villains" type="button" aria-selected="${this.viewMode === 'villains'}">
                    <i class="fas fa-skull"></i> Diccionario de villanos
                </button>
            </div>
        `;
    }
    getRarityRank(hero) {
        return HERO_RARITIES.indexOf(normalizeRarity(hero.rarity));
    }

    getFilteredHeroes(heroes) {
        const query = this.searchQuery.trim().toLowerCase();
        return [...heroes]
            .filter((hero) => {
                const rarity = normalizeRarity(hero.rarity);
                if (this.rarityFilter !== 'all' && rarity !== this.rarityFilter) return false;
                if (!query) return true;

                return [
                    hero.name,
                    hero.category,
                    hero.ability,
                    hero.niche,
                    ...(hero.tags || [])
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
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
        return `
            <section class="collection-toolbar" aria-label="Filtros de coleccion">
                <label class="collection-search">
                    <i class="fas fa-search"></i>
                    <input id="collection-search-input" type="search" value="${this.escapeAttribute(this.searchQuery)}" placeholder="Buscar heroe, rol o grupo" autocomplete="off">
                </label>
                <label class="collection-sort">
                    <span>Orden</span>
                    <select id="collection-sort-select">
                        <option value="az" ${this.sortMode === 'az' ? 'selected' : ''}>A-Z</option>
                        <option value="za" ${this.sortMode === 'za' ? 'selected' : ''}>Z-A</option>
                        <option value="rarity-desc" ${this.sortMode === 'rarity-desc' ? 'selected' : ''}>Rareza alta</option>
                        <option value="rarity-asc" ${this.sortMode === 'rarity-asc' ? 'selected' : ''}>Rareza baja</option>
                    </select>
                </label>
                <div class="collection-rarity-filters" aria-label="Filtrar por rareza">
                    ${['all', ...HERO_RARITIES].map((rarity) => {
                        const active = this.rarityFilter === rarity;
                        const label = rarity === 'all' ? 'Todas' : rarity;
                        const rarityClass = rarity === 'all' ? '' : getRarityClass(rarity);
                        return `<button class="rarity-filter ${rarityClass} ${active ? 'active' : ''}" data-rarity="${rarity}" aria-pressed="${active}">${label}</button>`;
                    }).join('')}
                </div>
                <strong>${visibleCount}/${totalCount}</strong>
            </section>
        `;
    }

    renderHeroCard(hero, unlocked) {
        const game = this.ui.game;
        const equipped = game.activeTeam.some((active) => active.id === hero.id);
        const evolution = hero.evolutionId ? game.progression.getHeroEvolution(hero.id) : null;
        const availableEvolution = hero.evolutionId ? EVOLUTION_CATALOG[hero.evolutionId] : null;
        const rarity = normalizeRarity(hero.rarity);
        const rarityClass = getRarityClass(rarity);
        return `
            <article class="collection-card team-hero-card ${rarityClass} ${unlocked ? '' : 'locked'} ${equipped ? 'equipped' : ''}" data-rarity="${rarity}">
                ${this.ui.renderSprite(this.getCollectionSprite(hero), hero.name)}
                <h3>${hero.name}</h3>
                ${evolution ? `<strong class="evolution-badge" style="--evolution-color:${evolution.color}">${evolution.name}</strong>` : ''}
                <small>${hero.category} · <b class="rarity-badge ${rarityClass}">${rarity}</b></small>
                <div class="hero-tag-list">${(hero.tags || []).map((tag) => `<span>${tag}</span>`).join('')}</div>
                <div class="collection-actions">
                    <button class="btn-preview-hero icon-command" data-id="${hero.id}" aria-label="Ver ficha de ${hero.name}" title="Ver ficha"><i class="fas fa-eye"></i></button>
                    <button class="${unlocked ? 'btn-equip' : ''} btn-primary ${equipped ? 'danger' : 'ghost'}" data-id="${hero.id}" ${unlocked ? '' : 'disabled'}>
                        ${unlocked ? (equipped ? 'Quitar' : 'Añadir') : 'Por reclutar'}
                    </button>
                </div>
                ${unlocked && availableEvolution ? `<button class="btn-evolution" data-id="${hero.id}" data-evolution="${availableEvolution.id}">${evolution ? 'Volver a forma base' : `Activar ${availableEvolution.shortName || availableEvolution.name}`}</button>` : ''}
            </article>
        `;
    }

    renderVillainCodex() {
        const game = this.ui.game;
        const model = buildVillainCodexModel(game.enemyDatabase, game.progression.state.codexDiscovered.enemies);
        return `
            <section class="villain-codex-header">
                <div>
                    <span class="briefing-kicker">ARCHIVO S.H.I.E.L.D.</span>
                    <h3>Diccionario de villanos</h3>
                    <p>Los registros se desbloquean cuando el enemigo aparece en una oleada.</p>
                </div>
                <strong>${model.discovered}/${model.total} avistados</strong>
            </section>
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
            <article class="villain-card ${entry.unlocked ? 'unlocked' : 'locked'} ${entry.isBoss ? 'boss' : ''}">
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

    bindListeners() {
        const game = this.ui.game;
        this.ui.panelContent.querySelectorAll('.collection-view-tab').forEach((button) => button.addEventListener('click', () => {
            this.viewMode = button.dataset.view || 'heroes';
            this.render('Constructor de equipo');
        }));
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
        this.ui.panelContent.querySelectorAll('.rarity-filter').forEach((button) => button.addEventListener('click', () => {
            this.rarityFilter = button.dataset.rarity || 'all';
            this.render('Constructor de equipo');
        }));
        this.ui.panelContent.querySelector('.toggle-synergies')?.addEventListener('click', () => {
            this.synergyExpanded = !this.synergyExpanded;
            this.render('Constructor de equipo');
        });
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
}
