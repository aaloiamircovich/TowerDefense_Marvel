import { getRarityClass, normalizeRarity } from '../utils/Rarity.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export class HeroRosterPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.evaluateHeroWaveFit = builders.evaluateHeroWaveFit || (() => ({ id: 'neutral', score: 0, reasons: [] }));
        this.buildTargetingControlState = builders.buildTargetingControlState || (() => null);
        this.getNextTargetingPriority = builders.getNextTargetingPriority || ((priority) => priority);
        this.buildRosterWaveFitView = builders.buildRosterWaveFitView || (() => null);
    }

    render(activeTeam = [], onSelect = () => {}) {
        if (!this.ui.heroGrid) return;
        this.ui.heroGrid.innerHTML = '';
        const waveSummary = this.ui.nextWaveSummary || (!this.ui.game.waveManager?.isWaveActive ? this.ui.game.waveManager?.buildPreparedSummary?.() : null);
        const credits = this.ui.game.resourceManager?.credits || 0;

        activeTeam.forEach((hero) => {
            const card = this.renderCard(hero, { waveSummary, credits, onSelect });
            this.ui.heroGrid.appendChild(card);
        });
        this.ui.renderOnboardingCoach();
    }

    renderCard(hero, context) {
        const deployedHero = (this.ui.game.heroes || []).find((unit) => unit.id === hero.id);
        const deployed = Boolean(deployedHero);
        const liveHero = deployedHero || hero;
        const fit = this.evaluateHeroWaveFit(liveHero, context.waveSummary, context.credits);
        const fitView = this.buildRosterWaveFitView(fit);
        const quickUpgradeCost = deployedHero ? this.ui.getHeroUpgradeCost(deployedHero, 1) : 0;
        const canQuickUpgrade = this.ui.canAffordHeroUpgrade(deployedHero, 1);
        const quickUpgradeTooltip = Number.isFinite(quickUpgradeCost) ? `Mejora rapida $${quickUpgradeCost}` : 'Nivel maximo';
        const targetingState = deployedHero ? this.buildTargetingControlState(deployedHero.targetingPriority || hero.targetingPriority) : null;
        const rarity = normalizeRarity(hero.rarity);
        const rarityClass = getRarityClass(rarity);
        const level = this.getHeroLevel(liveHero);
        const card = document.createElement('article');
        card.className = `hero-card ${rarityClass} ${deployed ? 'deployed' : ''} wave-fit-${fit.id}`;
        card.dataset.testid = `hero-card-${hero.id}`;
        card.dataset.rarity = rarity;
        card.dataset.waveFit = fit.id;
        card.innerHTML = `
            <div class="hero-card-sprite">${this.ui.renderSprite(this.ui.getHeroDisplaySprite(hero), hero.name)}</div>
            <div class="hero-card-main">
                <div class="hero-card-heading">
                    <strong>${escapeHtml(hero.name)}</strong>
                    <span class="rarity-badge ${rarityClass}">${rarity}</span>
                </div>
                <div class="hero-card-status">
                    <span class="hero-card-level">Nv. ${level}</span>
                    <span class="hero-card-field-state ${deployed ? 'active' : 'bench'}">${deployed ? 'Campo' : 'Banco'}</span>
                </div>
                ${fitView ? this.renderFitView(fitView) : ''}
            </div>
            <div class="hero-actions">
                <button class="btn-action place-btn" data-testid="hero-place-${escapeHtml(hero.id)}" title="${deployed ? 'Reposicionar' : 'Colocar'}" aria-label="${deployed ? 'Reposicionar' : 'Colocar'}" data-tooltip="${deployed ? 'Mover libremente' : 'Colocar héroe gratis'}"><i class="fas ${deployed ? 'fa-arrows-alt' : 'fa-map-marker-alt'}"></i></button>
                ${deployedHero ? `<button class="btn-action upgrade-btn ${canQuickUpgrade ? '' : 'is-unaffordable'}" data-testid="hero-upgrade-${escapeHtml(hero.id)}" data-quick-upgrade-id="${escapeHtml(hero.id)}" data-affordable="${canQuickUpgrade ? 'true' : 'false'}" title="Mejorar en campo" aria-label="Mejorar ${escapeHtml(hero.name)}" data-tooltip="${quickUpgradeTooltip}"><i class="fas fa-arrow-up"></i></button>` : ''}
                ${targetingState ? `<button class="btn-action target-btn" data-testid="hero-target-${escapeHtml(hero.id)}" title="${escapeHtml(targetingState.tooltip)}" aria-label="${escapeHtml(targetingState.ariaLabel)}" data-tooltip="${escapeHtml(targetingState.tooltip)}"><i class="fas ${targetingState.icon}"></i><span>${escapeHtml(targetingState.label)}</span></button>` : ''}
                <button class="btn-action stats-btn" title="Mejoras" aria-label="Mejoras" data-tooltip="Estadísticas y mejoras"><i class="fas fa-chart-bar"></i></button>
            </div>
        `;
        this.bindCardActions(card, hero, deployedHero, context.onSelect);
        return card;
    }

    renderFitView(fitView) {
        return `
            <div class="roster-wave-fit" aria-label="${escapeHtml(fitView.ariaLabel)}">
                <span><i class="fas fa-crosshairs"></i>${escapeHtml(fitView.label)}</span>
                <b>${escapeHtml(fitView.scoreLabel)}</b>
                <span>${escapeHtml(fitView.reasonText)}</span>
            </div>
        `;
    }

    bindCardActions(card, hero, deployedHero, onSelect) {
        card.querySelector('.place-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            if (deployedHero) this.ui.game.inputManager.setRepositionMode(deployedHero);
            else onSelect(hero);
        });
        card.querySelector('.stats-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            const liveHero = this.ui.findDeployedHeroById(hero.id);
            this.ui.inspectUnit(liveHero || hero);
        });
        card.querySelector('.target-btn')?.addEventListener('click', (event) => {
            event.stopPropagation();
            const nextPriority = this.getNextTargetingPriority(deployedHero.targetingPriority || hero.targetingPriority);
            deployedHero.targetingPriority = nextPriority;
            if (deployedHero.config) deployedHero.config.targetingPriority = nextPriority;
            hero.targetingPriority = nextPriority;
            this.ui.showToast(`${deployedHero.name || hero.name}: objetivo ${nextPriority}`, 'info');
            this.render(this.ui.game.activeTeam, (config) => this.ui.game.inputManager.setPlacementMode(config));
        });
    }

    getHeroLevel(hero) {
        return this.ui.getHeroLevel?.(hero) || hero?.level || 1;
    }
}
