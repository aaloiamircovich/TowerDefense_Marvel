import { FORMATION_DEFINITIONS } from '../systems/TeamSynergySystem.js';

const METRIC_LABELS = {
    coverage: 'Cobertura',
    control: 'Control',
    damage: 'Daño',
    detection: 'Detección',
    support: 'Apoyo'
};

export class TeamBuilderPanel {
    constructor(ui) {
        this.ui = ui;
    }

    render(title = 'Equipo') {
        const game = this.ui.game;
        const unlockedIds = new Set(game.progression.state.unlockedHeroIds);
        const readyHeroes = Object.values(game.heroDatabase)
            .filter((hero) => hero.visual)
            .sort((a, b) => Number(unlockedIds.has(b.id)) - Number(unlockedIds.has(a.id)) || a.name.localeCompare(b.name));
        const snapshot = game.teamSynergy.getSnapshot();

        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong>${game.activeTeam.length}/6 activos · $${snapshot.cost}</strong>
            </div>

            <section class="team-builder-summary">
                <div class="team-slot-strip">
                    ${Array.from({ length: 6 }, (_, index) => this.renderTeamSlot(game.activeTeam[index], index)).join('')}
                </div>
                <div class="team-metrics">
                    ${Object.entries(METRIC_LABELS).map(([key, label]) => `
                        <div class="team-metric"><span>${label}</span><div><i style="width:${snapshot.metrics[key]}%"></i></div><b>${snapshot.metrics[key]}</b></div>
                    `).join('')}
                </div>
                <div class="synergy-overview">
                    ${snapshot.families.filter((family) => family.count > 0).map((family) => `
                        <span class="synergy-chip ${family.activeTier ? 'active' : ''}" style="--synergy-color:${family.definition.color}">
                            <b>${family.tag}</b> ${family.count}/4${family.activeTier ? ` · ${family.activeTier.label}` : ''}
                        </span>
                    `).join('')}
                    ${snapshot.pairs.filter((pair) => pair.active).map((pair) => `<span class="synergy-chip pair active"><b>${pair.label}</b></span>`).join('')}
                    ${snapshot.versatile ? '<span class="synergy-chip versatile active"><b>Equipo versátil</b> · +2.5% daño y alcance</span>' : ''}
                </div>
                <div class="formation-summary">
                    ${Object.entries(FORMATION_DEFINITIONS).map(([role, definition]) => `<span style="--formation-color:${definition.color}"><i></i>${definition.label} <b>${snapshot.formationCounts[role] || 0}</b></span>`).join('')}
                </div>
            </section>

            <div class="collection-grid team-collection-grid">
                ${readyHeroes.map((hero) => this.renderHeroCard(hero, unlockedIds.has(hero.id))).join('')}
            </div>
        `;

        this.bindListeners();
    }

    renderTeamSlot(hero, index) {
        if (!hero) return `<div class="team-slot-empty" aria-label="Espacio ${index + 1} libre"><span>${index + 1}</span><i class="fas fa-plus"></i></div>`;
        return `
            <button class="team-slot-filled remove-team-hero" data-id="${hero.id}" aria-label="Quitar a ${hero.name}" title="Quitar del equipo">
                ${this.ui.renderSprite(hero.visual?.portrait || hero.sprite, hero.name)}
                <span>${hero.name}</span>
                <i class="fas fa-xmark"></i>
            </button>
        `;
    }

    renderHeroCard(hero, unlocked) {
        const game = this.ui.game;
        const equipped = game.activeTeam.some((active) => active.id === hero.id);
        const role = FORMATION_DEFINITIONS[hero.formationRole] || FORMATION_DEFINITIONS.artillery;
        return `
            <article class="collection-card team-hero-card ${unlocked ? '' : 'locked'} ${equipped ? 'equipped' : ''}">
                <div class="formation-role" style="--formation-color:${role.color}">${role.label}</div>
                ${this.ui.renderSprite(hero.visual?.portrait || hero.sprite, hero.name)}
                <h3>${hero.name}</h3>
                <small>${hero.category} · ${hero.rarity || 'Common'} · $${hero.cost || 0}</small>
                <div class="hero-tag-list">${(hero.tags || []).map((tag) => `<span>${tag}</span>`).join('')}</div>
                <div class="collection-actions">
                    <button class="btn-preview-hero icon-command" data-id="${hero.id}" aria-label="Ver ficha de ${hero.name}" title="Ver ficha"><i class="fas fa-eye"></i></button>
                    <button class="${unlocked ? 'btn-equip' : ''} btn-primary ${equipped ? 'danger' : 'ghost'}" data-id="${hero.id}" ${unlocked ? '' : 'disabled'}>
                        ${unlocked ? (equipped ? 'Quitar' : 'Añadir') : 'Por reclutar'}
                    </button>
                </div>
            </article>
        `;
    }

    bindListeners() {
        const game = this.ui.game;
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
    }

    syncAndRender() {
        const game = this.ui.game;
        this.ui.renderHeroRoster(game.activeTeam, (hero) => game.inputManager.setPlacementMode(hero));
        this.ui.showToast('Composición actualizada', 'success');
        this.render('Constructor de equipo');
    }
}
