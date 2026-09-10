import { SLOT_LABELS } from '../systems/ItemEffectSystem.js';
import { HERO_MAX_LEVEL, getHeroLevelUpgradeSteps, getScaledSupportAura } from '../utils/HeroLevel.js';
import { getRarityClass, normalizeRarity } from '../utils/Rarity.js';
import { TARGETING_PRIORITIES, TARGETING_PRIORITY_COPY } from '../utils/TargetingPriority.js';
import { buildHeroDetailViewModel } from './HeroDetailViewModel.js';
import { getItemFamilyName } from './ItemPresentation.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function normalizeClassToken(value = '', fallback = 'neutral') {
    const token = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return token && /^[a-z][a-z0-9-]*$/.test(token) ? token : fallback;
}

function normalizeIconClass(value = '', fallback = 'fa-circle-info') {
    const tokens = String(value || '')
        .split(/\s+/)
        .filter((token) => /^(fa[srb]?|fa-[a-z0-9-]+)$/i.test(token));
    return tokens.length ? tokens.join(' ') : fallback;
}

function clampPercent(value = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

export class HeroDetailsPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.evaluateHeroWaveFit = builders.evaluateHeroWaveFit || (() => null);
        this.buildRosterWaveFitView = builders.buildRosterWaveFitView || (() => null);
        this.buildHeroCombatIdentity = builders.buildHeroCombatIdentity || (() => []);
        this.targetingPriorities = builders.targetingPriorities || TARGETING_PRIORITIES;
    }

    render(hero, detailView = 'summary') {
        const config = hero.config || hero;
        const heroName = hero.name || config.name;
        const level = this.ui.getHeroLevel(hero);
        const bonuses = this.ui.game.progression?.getHeroBonuses(config.id) || {};
        const effectiveStats = hero.getEffectiveStats?.();
        const baseDamage = Math.round(hero.damage || config.damage || 0);
        const baseRange = Math.round(hero.range || config.range || 0);
        const baseFireRate = Number(hero.fireRate || config.fireRate || 1);
        const baseCritChance = Math.round(hero.critChance || config.critChance || 5);
        const damage = Math.round(effectiveStats?.damage || (hero.damage || config.damage || 0) * (1 + (bonuses.damage || 0)));
        const range = Math.round(effectiveStats?.range || (hero.range || config.range || 0) * (1 + (bonuses.range || 0)));
        const fireRate = Number(effectiveStats?.fireRate || (hero.fireRate || config.fireRate || 1) * (1 + (bonuses.fireRate || 0))).toFixed(1);
        const critChance = Math.round(effectiveStats?.critChance || (hero.critChance || config.critChance || 5) + (bonuses.critChance || 0));
        const terrains = this.ui.getTerrainText(hero.allowedTerrains || config.allowedTerrains || [1]);
        const equippedSlots = this.ui.game.progression?.state?.equippedItems?.[config.id] || {};
        const items = hero.items?.length
            ? hero.items
            : Object.values(equippedSlots).map((itemId) => this.ui.game.itemDatabase?.[itemId]).filter(Boolean);
        const equippedItem = items[0] || null;
        const equippedSlot = Object.keys(equippedSlots)[0] || equippedItem?.slot || null;
        const combat = hero.combatStats || {};
        const abilityState = hero.abilitySystem?.getDisplayState?.() || null;
        const kitControl = hero.abilitySystem?.getControlState?.() || null;
        const isUnlocked = this.ui.game.progression?.state?.unlockedHeroIds?.includes(config.id) ?? true;
        const rarity = normalizeRarity(config.rarity);
        const rarityClass = getRarityClass(rarity);
        const identityTags = [...new Set([...(config.tags || [])].filter(Boolean))];
        const isDeployed = this.ui.game.heroes?.includes(hero);
        const repositionPermission = isDeployed ? this.ui.game.tacticalActions?.canReposition(hero) : null;
        const sellPermission = isDeployed ? this.ui.game.tacticalActions?.canSell(hero) : null;
        const isMaxLevel = level >= HERO_MAX_LEVEL;
        const currentTargeting = hero.targetingPriority || config.targetingPriority || this.targetingPriorities[0];
        const waveSummary = this.ui.nextWaveSummary || (!this.ui.game.waveManager?.isWaveActive ? this.ui.game.waveManager?.buildPreparedSummary?.() : null);
        const waveFitView = this.buildRosterWaveFitView(this.evaluateHeroWaveFit(hero, waveSummary, this.ui.getMissionCredits()));
        const supportAura = config.special?.supportAura || config.supportAura || null;
        const scaledAura = getScaledSupportAura(supportAura, level, rarity);
        const supportAuraLabel = {
            damage: 'Daño',
            fireRate: 'Cad.',
            range: 'Rango'
        }[scaledAura?.type] || 'Aura';
        const isAuraOnly = hero.isSupportAuraOnly?.() || Boolean(scaledAura?.type && config.formationRole === 'support');
        const detailViewModel = buildHeroDetailViewModel({
            detailView,
            level,
            maxLevel: HERO_MAX_LEVEL,
            damage,
            fireRate,
            critChance,
            range,
            baseDamage,
            baseFireRate,
            baseCritChance,
            baseRange,
            combat,
            equippedItem,
            isAuraOnly,
            scaledAura,
            supportAuraLabel,
            upgradeCost: this.ui.getHeroUpgradeCost(hero, 1)
        });
        const { activeDetailView, compactStats, detailTabs, upgradeBadge } = detailViewModel;
        const upgradeControls = isUnlocked ? `<div class="upgrade-list hero-upgrade-grid" aria-label="Mejoras de nivel">
            ${[1, 5, 10].map((amount) => {
                const cost = this.ui.getHeroUpgradeCost(hero, amount);
                const steps = getHeroLevelUpgradeSteps(level, amount);
                const previewLabel = isMaxLevel ? '' : this.ui.getHeroLevelPreviewLabel(hero, steps);
                const preview = isMaxLevel ? '' : this.renderHeroLevelPreview(hero, steps);
                const upgradeLabel = isMaxLevel
                    ? `${heroName} ya esta en nivel maximo`
                    : `Mejorar ${heroName} ${steps} niveles por ${cost} creditos${previewLabel ? `. Cambios: ${previewLabel}` : ''}`;
                return `<button class="modal-btn-upgrade hero-upgrade-card btn-primary ghost" type="button" data-amt="${escapeHtml(amount)}" data-cost="${escapeHtml(cost)}" aria-label="${escapeHtml(upgradeLabel)}" title="${escapeHtml(upgradeLabel)}" data-tooltip="${escapeHtml(upgradeLabel)}" aria-disabled="${isMaxLevel}" ${isMaxLevel ? 'disabled' : ''}>
                    <span class="hero-upgrade-step">${escapeHtml(isMaxLevel ? 'MAX' : `+${steps}`)}</span>
                    <span class="hero-upgrade-cost">${escapeHtml(isMaxLevel ? 'Nivel maximo' : `$${cost}`)}</span>
                    ${preview}
                </button>`;
            }).join('')}
        </div>` : '<div class="locked-hero-note"><i class="fas fa-lock"></i> Recluta al héroe para mejorarlo</div>';
        let detailBody = '';

        if (activeDetailView === 'upgrade') {
            detailBody = `
                <div class="hero-detail-subpanel detail-card hero-tab-upgrade">
                    <h3>Mejora de nivel</h3>
                    <p><span>Nivel actual</span><strong>${escapeHtml(level)}/${escapeHtml(HERO_MAX_LEVEL)}</strong></p>
                    <p><span>Siguiente coste</span><strong>${escapeHtml(upgradeBadge)}</strong></p>
                    ${upgradeControls}
                </div>
            `;
        } else if (activeDetailView === 'equipment') {
            detailBody = `
                <div class="equipment-card hero-tab-equipment">
                    <h3>Equipamiento</h3>
                    <div class="hero-equipment-slots single-equipment-slot">
                        <div class="item-slot ${equippedItem ? 'filled' : ''}">
                            <span>${equippedItem ? `${escapeHtml(SLOT_LABELS[equippedItem.slot] || equippedItem.slot || 'Objeto')} | Familia ${escapeHtml(getItemFamilyName(equippedItem))}` : 'Objeto'}</span>
                            <strong>${escapeHtml(equippedItem?.name || 'Ranura libre')}</strong>
                            ${equippedItem ? `<small>${escapeHtml(equippedItem.desc)}</small><button class="btn-unequip-modal icon-command" type="button" data-slot="${escapeHtml(equippedSlot)}" aria-label="${escapeHtml(`Desequipar ${equippedItem.name}`)}" title="Desequipar" data-tooltip="Desequipar"><i class="fas fa-eject"></i></button>` : '<small>Un solo objeto equipado por heroe.</small>'}
                        </div>
                    </div>
                    <button id="open-inventory-panel" class="btn-primary ghost" type="button" aria-label="${escapeHtml(isUnlocked ? `Abrir inventario para ${heroName}` : `${heroName} no reclutado: inventario bloqueado`)}" title="${escapeHtml(isUnlocked ? `Abrir inventario para ${heroName}` : `${heroName} no reclutado: inventario bloqueado`)}" data-tooltip="${escapeHtml(isUnlocked ? `Abrir inventario para ${heroName}` : `${heroName} no reclutado: inventario bloqueado`)}" aria-disabled="${!isUnlocked}" ${isUnlocked ? '' : 'disabled'}><i class="fas fa-box-open"></i> ${isUnlocked ? 'Abrir inventario' : 'Recluta para equipar'}</button>
                </div>
            `;
        } else if (activeDetailView === 'combat') {
            detailBody = `
                <div class="hero-detail-subpanel detail-card hero-tab-combat">
                    <h3>Combate</h3>
                    <p><span>Daño total</span><strong>${escapeHtml(Math.round(combat.damageDealt || 0))}</strong></p>
                    <p><span>Bajas</span><strong>${escapeHtml(combat.kills || 0)}</strong></p>
                    <p><span>Disparos</span><strong>${escapeHtml(combat.shots || 0)}</strong></p>
                    <p><span>Críticos</span><strong>${escapeHtml(combat.crits || 0)}</strong></p>
                    <p><span>Habilidades</span><strong>${escapeHtml(combat.abilityActivations || 0)}</strong></p>
                </div>
            `;
        } else {
            detailBody = `
                <div class="hero-identity-card">
                    <span><small>Tipo</small><strong>${escapeHtml(config.category || 'Heroe')}</strong></span>
                    <span><small>Rareza</small><b class="rarity-badge ${rarityClass}">${escapeHtml(rarity)}</b></span>
                    ${identityTags.length ? `<div class="hero-tag-list">${identityTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                </div>

                <div class="hero-ability-compact">
                    <div>
                        <h3>${escapeHtml(config.ability || 'Ataque básico')}</h3>
                        <p>${escapeHtml(config.abilityDesc || 'Ataca al enemigo objetivo con su daño base.')}</p>
                    </div>
                    ${config.niche ? `<b>${escapeHtml(config.niche)}</b>` : ''}
                </div>

                ${waveFitView ? `
                    <div class="hero-wave-fit-compact ${normalizeClassToken(waveFitView.id, 'neutral')}" aria-label="${escapeHtml(waveFitView.ariaLabel)}">
                        <span><small>Lectura de oleada</small><strong><i class="fas fa-crosshairs"></i>${escapeHtml(waveFitView.label)}</strong></span>
                        <b>${escapeHtml(waveFitView.scoreLabel)}</b>
                        <em>${escapeHtml(waveFitView.reasonText)}</em>
                    </div>
                ` : ''}

                <div class="hero-tactic-compact">
                    <div>
                        <small>Terreno</small>
                        <strong>${escapeHtml(terrains)}</strong>
                    </div>
                    <label>
                        <small>Apuntar a</small>
                        <select id="targeting-select">
                            ${this.targetingPriorities.map((priority) => `<option value="${escapeHtml(priority)}" ${currentTargeting === priority ? 'selected' : ''}>${escapeHtml(priority)}</option>`).join('')}
                        </select>
                    </label>
                    ${this.renderTargetingPriorityLegend(currentTargeting)}
                </div>

                ${abilityState ? `
                    <div class="ability-status ${abilityState.ready ? 'ready' : ''}">
                        <span>${escapeHtml(abilityState.label)}</span>
                        ${abilityState.progress === null ? '' : `<div class="ability-meter"><i style="width:${clampPercent(Number(abilityState.progress) * 100)}%"></i></div>`}
                    </div>
                ` : ''}
                ${kitControl ? `
                    <div class="kit-mode-control" role="group" aria-label="${escapeHtml(kitControl.label)}">
                        <span>${escapeHtml(kitControl.label)}</span>
                        <div>
                            ${kitControl.options.map((option) => `<button class="kit-mode-btn ${option.id === kitControl.value ? 'active' : ''}" type="button" data-mode="${escapeHtml(option.id)}" aria-pressed="${option.id === kitControl.value}" aria-label="${escapeHtml(`${kitControl.label}: ${option.label}`)}" title="${escapeHtml(`${kitControl.label}: ${option.label}`)}" data-tooltip="${escapeHtml(`${kitControl.label}: ${option.label}`)}">${escapeHtml(option.label)}</button>`).join('')}
                        </div>
                    </div>
                ` : ''}
            `;
        }

        this.ui.panelContent.innerHTML = `
            <div class="hero-detail">
                <section class="hero-portrait ${rarityClass}" data-rarity="${escapeHtml(rarity)}">
                    <div class="hero-portrait-header">
                        <div>
                            <small>Ficha de heroe</small>
                            <h2>${escapeHtml(heroName)}</h2>
                        </div>
                        <b class="rarity-badge ${rarityClass}">${escapeHtml(rarity)}</b>
                    </div>
                    <div class="portrait-frame">${this.ui.renderSprite(this.ui.getHeroDisplaySprite(config), heroName)}</div>
                    <div class="hero-level-readout">
                        <span><small>Nivel</small><b>${escapeHtml(level)}/${escapeHtml(HERO_MAX_LEVEL)}</b></span>
                        <span><small>Mejora</small><b>${escapeHtml(isMaxLevel ? 'MAX' : `$${this.ui.getHeroUpgradeCost(hero, 1)}`)}</b></span>
                    </div>
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
                            ${compactStats.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></span>`).join('')}
                        </div>

                        ${activeDetailView === 'summary' ? this.renderHeroQuickIdentityStrip(hero) : ''}

                        <div class="hero-detail-tabs" role="tablist" aria-label="Detalle de heroe">
                            ${detailTabs.map((tab) => {
                                const tabAriaLabel = escapeHtml(`${tab.label}: ${tab.badge}`);
                                return `<button id="hero-detail-tab-${escapeHtml(tab.id)}" class="hero-detail-tab ${activeDetailView === tab.id ? 'active' : ''}" data-view="${escapeHtml(tab.id)}" role="tab" aria-selected="${activeDetailView === tab.id}" aria-controls="hero-detail-panel" tabindex="${activeDetailView === tab.id ? '0' : '-1'}" type="button" aria-label="${tabAriaLabel}" title="${tabAriaLabel}" data-tooltip="${tabAriaLabel}"><i class="fas ${normalizeIconClass(tab.icon)}"></i><span>${escapeHtml(tab.label)}</span><b class="hero-detail-tab-badge">${escapeHtml(tab.badge)}</b></button>`;
                            }).join('')}
                        </div>

                        <div id="hero-detail-panel" class="hero-detail-tab-panel ${normalizeClassToken(activeDetailView, 'summary')}" role="tabpanel" aria-labelledby="hero-detail-tab-${escapeHtml(activeDetailView)}">
                            ${detailBody}
                        </div>
                    </div>
                </section>
            </div>
        `;

        document.getElementById('targeting-select')?.addEventListener('change', (event) => {
            hero.targetingPriority = event.target.value;
            if (hero.config) hero.config.targetingPriority = event.target.value;
            this.ui.game.progression?.setHeroTargetingPriority?.(config.id, event.target.value);
        });

        this.ui.panelContent.querySelectorAll('.modal-btn-upgrade').forEach((button) => {
            button.addEventListener('click', () => {
                this.ui.processUpgrade(hero, Number(button.dataset.amt));
            });
        });

        this.ui.panelContent.querySelectorAll('.kit-mode-btn').forEach((button) => button.addEventListener('click', () => {
            if (!hero.abilitySystem?.setCombatMode?.(button.dataset.mode)) return;
            this.ui.showToast(`${kitControl.label}: ${button.textContent}`, 'success');
            this.ui.renderHeroRoster(this.ui.game.activeTeam, (config) => this.ui.game.inputManager.setPlacementMode(config));
            this.ui.renderHeroDetails(hero, activeDetailView);
        }));

        this.ui.bindHeroDetailTabs(hero);

        document.getElementById('reposition-hero')?.addEventListener('click', () => {
            if (this.ui.game.inputManager.setRepositionMode(hero)) this.ui.closePanel();
        });

        document.getElementById('sell-hero')?.addEventListener('click', () => {
            const result = this.ui.game.inputManager.sellHero(hero);
            if (result.ok) this.ui.closePanel();
        });

        this.ui.panelContent.querySelectorAll('.btn-unequip-modal').forEach((button) => button.addEventListener('click', () => {
            this.ui.game.progression.unequipItem(config.id, button.dataset.slot);
            this.ui.showToast('Objeto devuelto al inventario', 'success');
            const deployed = this.ui.game.heroes.find((unit) => unit.id === config.id);
            this.ui.renderHeroDetails(deployed || config, 'equipment');
        }));
        document.getElementById('open-inventory-panel')?.addEventListener('click', () => {
            this.ui.inventoryPanel.heroId = config.id;
            this.ui.renderPanel('inventory');
        });
    }

    renderHeroCombatIdentity(hero) {
        const chips = this.buildHeroCombatIdentity(hero);
        return `
            <div class="hero-combat-identity" aria-label="Identidad tactica de combate">
                ${chips.map((chip) => `
                    <span class="${normalizeClassToken(chip.tone, 'neutral')}">
                        <i class="fas ${normalizeIconClass(chip.icon)}"></i>
                        <small>${escapeHtml(chip.label)}</small>
                        <b>${escapeHtml(chip.value)}</b>
                    </span>
                `).join('')}
            </div>
        `;
    }

    renderHeroQuickIdentityStrip(hero) {
        const chips = this.buildHeroCombatIdentity(hero);
        return `
            <div class="hero-detail-quick-strip" aria-label="Resumen tactico del heroe">
                ${chips.map((chip) => {
                    const label = `${chip.label}: ${chip.value}`;
                    return `
                        <span class="${normalizeClassToken(chip.tone, 'neutral')}" title="${escapeHtml(label)}" data-tooltip="${escapeHtml(label)}">
                            <i class="fas ${normalizeIconClass(chip.icon)}"></i>
                            <small>${escapeHtml(chip.label)}</small>
                            <b>${escapeHtml(chip.value)}</b>
                        </span>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderTargetingPriorityLegend(currentTargeting = this.targetingPriorities[0]) {
        return `
            <div class="targeting-priority-legend" aria-label="Leyenda de prioridad de objetivo">
                ${this.targetingPriorities.map((priority) => {
                    const copy = TARGETING_PRIORITY_COPY[priority] || { icon: 'fa-crosshairs', label: priority, description: 'Prioridad personalizada' };
                    const active = priority === currentTargeting;
                    const label = `${priority}: ${copy.description}`;
                    return `<span class="${active ? 'active' : ''}" title="${escapeHtml(label)}" data-tooltip="${escapeHtml(label)}">
                        <i class="fas ${normalizeIconClass(copy.icon)}"></i>
                        <b>${escapeHtml(copy.label)}</b>
                        <small>${escapeHtml(copy.description)}</small>
                    </span>`;
                }).join('')}
            </div>
        `;
    }

    renderHeroLevelPreview(unit, amount = 1) {
        const rows = this.ui.getHeroLevelPreviewRows(unit, amount);
        if (!rows.length) return '';
        return `
            <span class="upgrade-preview" aria-hidden="true">
                ${rows.map((row) => `<em class="${row.value < 0 ? 'negative' : 'positive'}">${escapeHtml(row.label)} ${escapeHtml(this.ui.formatSignedPreviewValue(row.value, row.suffix, row.precision))}</em>`).join('')}
            </span>
        `;
    }
}
