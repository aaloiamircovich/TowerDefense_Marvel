import { SET_BONUSES, SLOT_LABELS } from '../systems/ItemEffectSystem.js';
import { EVOLUTION_CATALOG } from '../systems/EvolutionSystem.js';
import { ITEM_SIGNATURES } from '../systems/ItemSignatureSystem.js';
import { HERO_BOX_COST_GROWTH, HERO_RARITY_WEIGHTS, getHeroBoxCost } from '../systems/ShopSystem.js';
import { HERO_RARITIES, getRarityClass, normalizeRarity } from '../utils/Rarity.js';
import { buildItemEffectPills } from './InventoryPanel.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function buildShopAffordabilityState(credits = 0, cost = 0, adminMode = false) {
    const normalizedCost = Math.max(0, Math.ceil(Number(cost) || 0));
    const normalizedCredits = Math.max(0, Math.floor(Number(credits) || 0));

    if (adminMode) {
        return {
            canAfford: true,
            progress: 100,
            missing: 0,
            current: normalizedCost,
            max: normalizedCost || 1,
            label: 'Creditos ilimitados'
        };
    }

    if (normalizedCost <= 0) {
        return {
            canAfford: true,
            progress: 100,
            missing: 0,
            current: 0,
            max: 1,
            label: 'Sin coste'
        };
    }

    const current = Math.min(normalizedCredits, normalizedCost);
    const missing = Math.max(0, normalizedCost - normalizedCredits);
    return {
        canAfford: missing <= 0,
        progress: Math.max(0, Math.min(100, Math.round((current / normalizedCost) * 100))),
        missing,
        current,
        max: normalizedCost,
        label: missing <= 0 ? 'Listo para comprar' : '$' + missing + ' faltan'
    };
}

export function buildItemSignatureHint(item = {}, heroDatabase = {}) {
    const heroIds = new Set(Object.keys(ITEM_SIGNATURES[item.id] || {}));
    Object.values(EVOLUTION_CATALOG).forEach((evolution) => {
        (evolution.itemTransforms || []).forEach((transform) => {
            if (transform.itemId === item.id && evolution.baseHeroId) heroIds.add(evolution.baseHeroId);
        });
    });

    const heroes = [...heroIds]
        .map((heroId) => heroDatabase[heroId] || { id: heroId, name: formatSignatureHeroName(heroId) })
        .filter((hero) => hero?.id);
    if (!heroes.length) return null;

    const visible = heroes.slice(0, 3).map((hero) => hero.name);
    const extra = Math.max(0, heroes.length - visible.length);
    return {
        heroIds: heroes.map((hero) => hero.id),
        detail: `${visible.join(', ')}${extra ? ` +${extra}` : ''}`,
        fullDetail: heroes.map((hero) => hero.name).join(', ')
    };
}

export function buildHeroBoxOdds(recruitPool = [], pity = 0) {
    const guaranteed = Number(pity || 0) >= 4;
    const visiblePool = (recruitPool || []).filter((hero) => hero?.id);
    const guaranteedPool = guaranteed
        ? visiblePool.filter((hero) => normalizeRarity(hero.rarity) !== 'Common')
        : visiblePool;
    const candidatePool = guaranteedPool.length ? guaranteedPool : visiblePool;
    const weightByRarity = new Map();
    const countByRarity = new Map();

    candidatePool.forEach((hero) => {
        const rarity = normalizeRarity(hero.rarity);
        const weight = HERO_RARITY_WEIGHTS[rarity] || HERO_RARITY_WEIGHTS.Rare;
        weightByRarity.set(rarity, (weightByRarity.get(rarity) || 0) + weight);
        countByRarity.set(rarity, (countByRarity.get(rarity) || 0) + 1);
    });

    const totalWeight = [...weightByRarity.values()].reduce((total, weight) => total + weight, 0);
    const entries = HERO_RARITIES
        .map((rarity) => {
            const weight = weightByRarity.get(rarity) || 0;
            if (!weight || !totalWeight) return null;
            const percent = (weight / totalWeight) * 100;
            return {
                rarity,
                count: countByRarity.get(rarity) || 0,
                percent,
                label: `${percent.toFixed(percent >= 10 ? 0 : 1).replace(/\.0$/, '')}%`
            };
        })
        .filter(Boolean);

    return {
        entries,
        guaranteedActive: guaranteed && guaranteedPool.length > 0,
        empty: visiblePool.length === 0
    };
}

function formatSignatureHeroName(heroId = '') {
    return String(heroId)
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export class ShopPanel {
    constructor(ui, builders = {}) {
        this.ui = ui;
        this.buildShopItemInsight = builders.buildShopItemInsight || (() => ({ tone: 'neutral', label: 'Uso flexible', reasons: ['Sin lectura tactica'] }));
        this.buildShopSetProgress = builders.buildShopSetProgress || (() => null);
        this.gachaRevealTimers = [];
    }

    render(title = 'Tienda') {
        const rotation = this.ui.game.shopSystem.getRotation();
        const shopQueue = this.ui.game.shopSystem.getProgressiveQueue?.() || [];
        const nextQueueItem = shopQueue[rotation.length] || null;
        const credits = this.ui.game.progression.getCredits();
        const adminMode = Boolean(this.ui.game.progression.state.settings.adminMode);
        const fundsText = adminMode ? '∞' : `$${credits}`;
        const recruitCost = getHeroBoxCost(this.ui.game.progression.state.shop);
        const pityValue = Math.min(4, this.ui.game.progression.state.shop.heroPity);
        const nextRecruitCost = Math.ceil(recruitCost * HERO_BOX_COST_GROWTH);
        const recruitPool = Object.values(this.ui.game.heroDatabase || {})
            .filter((hero) => hero.visual)
            .filter((hero) => !this.ui.game.progression.state.unlockedHeroIds.includes(hero.id));
        const odds = buildHeroBoxOdds(recruitPool, pityValue);
        const recruitAffordability = buildShopAffordabilityState(credits, recruitCost, adminMode);
        const canRecruit = recruitPool.length > 0 && recruitAffordability.canAfford;
        const recruitMissing = recruitAffordability.missing;
        const recruitButtonText = recruitPool.length === 0
            ? 'PLANTILLA COMPLETA'
            : canRecruit
                ? `RECLUTAR POR $${recruitCost}`
                : `FALTAN $${recruitMissing}`;
        const recruitAriaLabel = recruitPool.length === 0
            ? 'Plantilla completa'
            : canRecruit
                ? `Reclutar heroe aleatorio por ${recruitCost} creditos`
                : `No alcanza para reclutar. Faltan ${recruitMissing} creditos`;

        this.ui.panelContent.innerHTML = `
            <section class="shop-command-header">
                <div class="panel-title-row shop-title-row"><h2>${title}</h2><strong>${fundsText} creditos</strong></div>
                <div class="shop-economy-readout">
                    <span><small>Creditos</small><b data-shop-readout="credits">${fundsText}</b></span>
                    <span><small>Caja</small><b data-shop-readout="box-cost">$${recruitCost}</b></span>
                    <span><small>Garantia</small><b data-shop-readout="pity">${pityValue}/4</b></span>
                    <span><small>Arsenal</small><b>${rotation.length}/3</b></span>
                    <span><small>Siguiente</small><b>+$${nextRecruitCost - recruitCost}</b></span>
                </div>
            </section>
            <section class="shop-recruit-strip">
                <div class="shop-recruit-copy">
                    <span class="briefing-kicker">CAJA DE RECLUTAMIENTO</span>
                    <strong>Héroe aleatorio sin duplicados</strong>
                    <small>La quinta apertura común garantiza Rare o superior. Costo +${Math.round((HERO_BOX_COST_GROWTH - 1) * 100)}% por apertura.</small>
                </div>
                ${this.renderPityTrack(pityValue, odds.guaranteedActive)}
                ${this.renderHeroBoxOdds(odds)}
                <div class="shop-buy-stack">
                    <button class="btn-primary" id="gacha-btn" type="button" data-affordability="${canRecruit ? 'ready' : 'locked'}" aria-label="${escapeHtml(recruitAriaLabel)}" title="${escapeHtml(recruitAriaLabel)}" data-tooltip="${escapeHtml(recruitAriaLabel)}" aria-disabled="${!canRecruit}" ${canRecruit ? '' : 'disabled'}>${recruitButtonText}</button>
                    ${this.renderAffordabilityMeter(recruitAffordability, 'Progreso para caja')}
                </div>
            </section>
            <div id="gacha-res" class="result-copy shop-reveal-dock" role="status" aria-live="polite"></div>
            <section class="shop-section-heading">
                <div>
                    <h3>Arsenal progresivo</h3>
                    <p class="empty-copy">Siempre ves los 3 objetos mas basicos disponibles; al comprar uno entra el siguiente.</p>
                </div>
                <div class="shop-heading-meta">
                    ${this.renderNextQueuePreview(nextQueueItem)}
                    <strong>${rotation.length}/3 visibles</strong>
                </div>
            </section>
            <div class="shop-grid shop-grid--compact">
                ${rotation.map((slot) => this.renderItem(slot.item, slot.purchased)).join('') || '<p class="empty-copy">Arsenal completado.</p>'}
            </div>
        `;

        this.queryPanel('#gacha-btn')?.addEventListener('click', () => this.handleGacha());
        this.ui.panelContent.querySelectorAll('.btn-buy-item').forEach((button) => {
            button.addEventListener('click', () => this.buyItem(button.dataset.id));
        });
    }

    renderPityTrack(pityValue = 0, guaranteedActive = false) {
        const value = Math.max(0, Math.min(4, Math.floor(Number(pityValue) || 0)));
        return `<div class="pity-track compact ${guaranteedActive ? 'ready' : ''}" aria-label="Garantía de rareza ${value} de 4">
            ${this.renderPityTrackBody(value)}
        </div>`;
    }

    renderPityTrackBody(pityValue = 0) {
        const value = Math.max(0, Math.min(4, Math.floor(Number(pityValue) || 0)));
        return `<span>Garantía</span><b>${value}/4</b><div class="pity-pips" aria-hidden="true">
            ${Array.from({ length: 4 }, (_, index) => `<i class="${index < value ? 'filled' : ''}"></i>`).join('')}
        </div>`;
    }

    renderAffordabilityMeter(state, label = 'Progreso de compra') {
        const progress = Math.max(0, Math.min(100, Math.round(Number(state?.progress) || 0)));
        const max = Math.max(1, Math.ceil(Number(state?.max) || 1));
        const current = Math.max(0, Math.min(max, Math.ceil(Number(state?.current) || 0)));
        const tone = state?.canAfford ? 'ready' : 'locked';
        const text = state?.label || 'Sin datos';
        return `<div class="shop-afford-meter ${tone}" role="meter" aria-label="${escapeHtml(label)}: ${escapeHtml(text)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${current}"><span style="width:${progress}%"></span><small>${escapeHtml(text)}</small></div>`;
    }

    renderHeroBoxOdds(model) {
        if (!model || model.empty) {
            return '<div class="shop-odds-strip complete" aria-label="Caja sin heroes pendientes"><strong>Plantilla completa</strong></div>';
        }
        const label = model.guaranteedActive ? 'Garantía activa' : 'Probabilidades actuales';
        return `
            <div class="shop-odds-strip" aria-label="${escapeHtml(label)} por rareza">
                <strong>${escapeHtml(label)}</strong>
                <div>
                    ${model.entries.map((entry) => {
                        const rarityClass = getRarityClass(entry.rarity);
                        const tooltip = `${entry.rarity}: ${entry.label}, ${entry.count} heroes posibles`;
                        return `<span class="${rarityClass}" title="${escapeHtml(tooltip)}" data-tooltip="${escapeHtml(tooltip)}"><b>${escapeHtml(entry.rarity)}</b><small>${escapeHtml(entry.label)}</small></span>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderNextQueuePreview(item) {
        if (!item) {
            return '<span class="shop-next-preview complete"><i class="fas fa-check"></i><b>Arsenal completo</b></span>';
        }

        const rarity = normalizeRarity(item.rarity);
        const rarityClass = getRarityClass(rarity);
        const price = Number(item.price || 0);
        const label = `Proximo al comprar: ${item.name} por ${price} creditos`;
        return `<span class="shop-next-preview ${rarityClass}" aria-label="${escapeHtml(label)}"><i class="fas fa-arrow-right"></i><small>En cola</small><b>${escapeHtml(item.name)}</b><em>$${price}</em></span>`;
    }
    renderItem(item, purchased = false) {
        if (!item) return '<div class="shop-card empty-copy">Agotado</div>';
        const owned = this.ui.game.progression.getOwnedQuantity(item.id);
        const credits = this.ui.game.progression.getCredits();
        const adminMode = Boolean(this.ui.game.progression.state.settings.adminMode);
        const price = Number(item.price || 0);
        const affordability = buildShopAffordabilityState(credits, price, adminMode);
        const canBuy = !purchased && affordability.canAfford;
        const missing = affordability.missing;
        const rarity = normalizeRarity(item.rarity);
        const rarityClass = getRarityClass(rarity);
        const summary = this.ui.nextWaveSummary || (!this.ui.game.waveManager?.isWaveActive ? this.ui.game.waveManager?.buildPreparedSummary?.() : null);
        const insight = this.buildShopItemInsight(item, summary);
        const signatureHint = buildItemSignatureHint(item, this.ui.game.heroDatabase || {});
        const setProgress = this.buildShopSetProgress(
            item,
            this.ui.game.progression.state.ownedItemIds,
            this.ui.game.progression.state.equippedItems,
            this.ui.game.itemDatabase
        );
        const effectPills = buildItemEffectPills(item);
        const buyAriaLabel = purchased
            ? `${item.name} ya adquirido`
            : canBuy
                ? `Comprar ${item.name} por ${price} creditos`
                : `No alcanza para comprar ${item.name}. Faltan ${missing} creditos`;
        return `
            <div class="shop-card shop-card--compact ${rarityClass} ${purchased ? 'purchased' : ''} ${canBuy ? 'can-buy' : 'locked'}" data-rarity="${rarity}" data-affordability="${canBuy ? 'ready' : 'locked'}" aria-label="${escapeHtml(buyAriaLabel)}">
                <div class="item-badge rarity-badge ${rarityClass}">${rarity}</div>
                <div class="shop-item-heading">
                    ${this.ui.renderSprite(item.icon, item.name)}
                    <div><small>${SLOT_LABELS[item.slot]} · ${SET_BONUSES[item.set]?.name || item.set}</small><h4>${item.name}</h4></div>
                </div>
                ${signatureHint ? `<div class="shop-signature-hint" aria-label="Objeto firma para ${escapeHtml(signatureHint.fullDetail)}" title="Objeto firma para ${escapeHtml(signatureHint.fullDetail)}" data-tooltip="Objeto firma para ${escapeHtml(signatureHint.fullDetail)}">
                    <i class="fas fa-file-signature"></i>
                    <strong>Firma</strong>
                    <span>${escapeHtml(signatureHint.detail)}</span>
                </div>` : ''}
                <p>${item.desc}</p>
                <div class="shop-effect-pills item-effect-pills" aria-label="Efectos principales">
                    ${effectPills.map((pill) => `<span class="${pill.tone}"><b>${pill.label}</b><small>${pill.value}</small></span>`).join('')}
                </div>
                <div class="shop-insight ${insight.tone}" aria-label="Recomendado por ${escapeHtml(insight.reasons.join(', '))}">
                    <strong>${escapeHtml(insight.label)}</strong>
                    <span>${insight.reasons.map(escapeHtml).join(' | ')}</span>
                </div>
                ${setProgress ? `<div class="shop-set-progress ${setProgress.status}" aria-label="${escapeHtml(setProgress.ariaLabel)}">
                    <strong>${escapeHtml(setProgress.label)}</strong>
                    <span>${escapeHtml(setProgress.detail)}</span>
                </div>` : ''}
                <div class="shop-card-footer">
                    ${this.renderAffordabilityMeter(affordability, `Progreso para comprar ${item.name}`)}
                    <small>${purchased ? 'Adquirido' : canBuy ? `Copias: ${owned}` : `Faltan $${missing}`}</small>
                    <button class="btn-buy-item btn-primary ghost" type="button" data-id="${item.id}" aria-label="${escapeHtml(buyAriaLabel)}" title="${escapeHtml(buyAriaLabel)}" data-tooltip="${escapeHtml(buyAriaLabel)}" aria-disabled="${purchased || !canBuy}" ${purchased || !canBuy ? 'disabled' : ''}>${purchased ? 'ADQUIRIDO' : canBuy ? `$${price}` : 'BLOQUEADO'}</button>
                </div>
            </div>
        `;
    }

    buyItem(itemId) {
        const result = this.ui.game.shopSystem.purchaseItem(itemId);
        if (!result.ok) {
            this.ui.showToast(result.reason, 'warning');
            return;
        }
        this.ui.showToast(`${result.item.name} comprado`, 'success');
        this.render('Tienda');
    }

    renderSkinShop(title = 'Skins') {
        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong>Próximamente</strong>
            </div>
            <section class="skins-shop-panel">
                <div>
                    <span class="briefing-kicker">TIENDA COSMÉTICA</span>
                    <h3>Skins de héroes</h3>
                    <p>Este menú queda reservado para skins cuando estén listas.</p>
                </div>
                <i class="fas fa-shirt"></i>
            </section>
        `;
    }

    buildGachaRevealSequence(finalHero, count = 12) {
        const roster = Object.values(this.ui.game.heroDatabase || {})
            .filter((hero) => hero.visual && hero.id !== finalHero.id);
        const seed = `${finalHero.id}:${Date.now()}`;
        const score = (hero) => [...`${seed}:${hero.id}`]
            .reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
        const ordered = [...roster].sort((a, b) => score(a) - score(b));
        return [...ordered.slice(0, count - 1), finalHero];
    }

    renderGachaReveal(result) {
        const hero = result.hero;
        const rarity = normalizeRarity(hero.rarity);
        const rarityClass = getRarityClass(rarity);
        const sequence = this.buildGachaRevealSequence(hero);
        const firstPreview = sequence[0] || hero;
        const firstRarity = normalizeRarity(firstPreview.rarity);
        const firstRarityClass = getRarityClass(firstRarity);
        return `
            <div class="gacha-reveal ${firstRarityClass}" data-final-rarity-class="${rarityClass}" data-rarity="${firstRarity}" data-final-rarity="${rarity}">
                <div class="gacha-aura"></div>
                <div class="gacha-case">
                    <i class="fas fa-box-open"></i>
                    <span>Caja de reclutamiento</span>
                </div>
                <button class="gacha-skip-btn btn-primary ghost" type="button" aria-label="Saltear animacion de reclutamiento" title="Saltear animacion de reclutamiento" data-tooltip="Saltear animacion de reclutamiento"><i class="fas fa-forward"></i> Saltear</button>
                <div class="gacha-roller" aria-hidden="true">
                    <div class="gacha-roll-sprite">${this.ui.renderSprite(this.ui.getHeroDisplaySprite(firstPreview), firstPreview.name)}</div>
                </div>
                <div class="gacha-final">
                    <span class="rarity-badge ${rarityClass}">${rarity}</span>
                    <strong>${hero.name}</strong>
                    <small>${result.guaranteed ? 'Garantia activada' : 'Nuevo recluta'}</small>
                </div>
            </div>
        `;
    }

    startGachaRevealAnimation(result, onComplete = () => {}) {
        const reveal = globalThis.document?.querySelector?.('#gacha-res .gacha-reveal') || this.queryPanel('#gacha-res .gacha-reveal');
        const slot = reveal?.querySelector('.gacha-roll-sprite');
        const finalCopy = reveal?.querySelector('.gacha-final');
        const skipButton = reveal?.querySelector('.gacha-skip-btn');
        if (!reveal || !slot || !finalCopy) {
            onComplete();
            return;
        }

        const sequence = this.buildGachaRevealSequence(result.hero);
        const delays = [320, 360, 400, 440, 500, 560, 640, 720, 820, 940, 1080, 1220];
        let index = 0;
        let finished = false;
        this.clearGachaRevealTimers();

        const applyEntry = (entry) => {
            const rarity = normalizeRarity(entry.rarity);
            const rarityClass = getRarityClass(rarity);
            reveal.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary', 'rarity-mythic', 'rarity-secret');
            reveal.classList.add(rarityClass);
            reveal.dataset.rarity = rarity;
            slot.innerHTML = this.ui.renderSprite(this.ui.getHeroDisplaySprite(entry), entry.name);
            slot.classList.remove('tick');
            void slot.offsetWidth;
            slot.classList.add('tick');
        };

        const finishReveal = () => {
            if (finished) return;
            finished = true;
            this.clearGachaRevealTimers();
            applyEntry(result.hero);
            reveal.classList.add('is-final');
            finalCopy.classList.add('is-visible');
            skipButton?.classList.add('hidden');
            onComplete();
        };

        const showEntry = () => {
            if (finished) return;
            const entry = sequence[Math.min(index, sequence.length - 1)];
            applyEntry(entry);

            if (index >= sequence.length - 1) {
                finishReveal();
                return;
            }

            const delay = delays[Math.min(index, delays.length - 1)];
            index += 1;
            this.gachaRevealTimers.push(timers.setTimeout(showEntry, delay));
        };

        skipButton?.addEventListener('click', finishReveal, { once: true });
        Promise.resolve(this.ui.game.assetPreloader?.preloadHeroes?.(sequence))
            .catch(() => null)
            .finally(() => {
                if (finished) return;
                this.gachaRevealTimers.push(timers.setTimeout(showEntry, 220));
            });
    }

    handleGacha() {
        const result = this.ui.game.shopSystem.recruitHero();
        if (!result.ok) {
            this.ui.showToast(result.reason, 'warning');
            return;
        }

        const button = this.queryPanel('#gacha-btn');
        const resultNode = this.queryPanel('#gacha-res');
        if (button) button.disabled = true;
        if (resultNode) resultNode.innerHTML = this.renderGachaReveal(result);

        this.ui.showToast(`${result.hero.name} se unio a la plantilla`, 'success');
        this.ui.renderHeroRoster(this.ui.game.activeTeam, (hero) => this.ui.game.inputManager.setPlacementMode(hero));

        const fundsLabel = this.ui.panelContent.querySelector('.panel-title-row strong');
        if (fundsLabel) {
            const fundsText = this.ui.game.progression.state.settings.adminMode ? '∞' : `$${this.ui.game.progression.getCredits()}`;
            fundsLabel.textContent = `${fundsText} creditos`;
            const creditsReadout = this.ui.panelContent.querySelector('[data-shop-readout="credits"]');
            if (creditsReadout) creditsReadout.textContent = fundsText;
        }
        const pityTrack = this.ui.panelContent.querySelector('.pity-track');
        const pityValue = Math.min(4, this.ui.game.progression.state.shop.heroPity);
        if (pityTrack) {
            pityTrack.innerHTML = this.renderPityTrackBody(pityValue);
            pityTrack.classList?.toggle('ready', pityValue >= 4);
            pityTrack.setAttribute?.('aria-label', `Garantía de rareza ${pityValue} de 4`);
        }
        const pityReadout = this.ui.panelContent.querySelector('[data-shop-readout="pity"]');
        if (pityReadout) pityReadout.textContent = `${pityValue}/4`;

        this.startGachaRevealAnimation(result, () => {
            const nextPool = Object.values(this.ui.game.heroDatabase || {})
                .filter((hero) => hero.visual)
                .filter((hero) => !this.ui.game.progression.state.unlockedHeroIds.includes(hero.id));
            if (button) {
                const nextCost = getHeroBoxCost(this.ui.game.progression.state.shop);
                const adminMode = Boolean(this.ui.game.progression.state.settings.adminMode);
                const credits = this.ui.game.progression.getCredits();
                const nextAffordability = buildShopAffordabilityState(credits, nextCost, adminMode);
                const canRecruit = nextPool.length > 0 && nextAffordability.canAfford;
                const missing = nextAffordability.missing;
                const buttonLabel = nextPool.length === 0
                    ? 'Plantilla completa'
                    : canRecruit
                        ? `Reclutar heroe aleatorio por ${nextCost} creditos`
                        : `No alcanza para reclutar. Faltan ${missing} creditos`;
                button.disabled = !canRecruit;
                button.textContent = nextPool.length === 0
                    ? 'PLANTILLA COMPLETA'
                    : canRecruit
                        ? `RECLUTAR POR $${nextCost}`
                        : `FALTAN $${missing}`;
                button.dataset.affordability = canRecruit ? 'ready' : 'locked';
                button.setAttribute?.('aria-label', buttonLabel);
                button.setAttribute?.('title', buttonLabel);
                button.setAttribute?.('data-tooltip', buttonLabel);
                button.setAttribute?.('aria-disabled', String(!canRecruit));
                const boxReadout = this.ui.panelContent.querySelector('[data-shop-readout="box-cost"]');
                if (boxReadout) boxReadout.textContent = nextPool.length === 0 ? 'Completa' : `$${nextCost}`;
                const recruitMeter = this.ui.panelContent.querySelector('.shop-buy-stack .shop-afford-meter');
                if (recruitMeter) {
                    const meterState = nextPool.length === 0
                        ? { canAfford: false, progress: 100, missing: 0, current: 1, max: 1, label: 'Plantilla completa' }
                        : nextAffordability;
                    recruitMeter.outerHTML = this.renderAffordabilityMeter(meterState, 'Progreso para caja');
                }
            }
        });
    }

    queryPanel(selector) {
        return this.ui.panelContent?.querySelector?.(selector) || globalThis.document?.querySelector?.(selector) || null;
    }

    clearGachaRevealTimers() {
        const timers = this.getTimerHost();
        this.gachaRevealTimers.forEach((timer) => timers.clearTimeout(timer));
        this.gachaRevealTimers = [];
    }

    getTimerHost() {
        return globalThis.window || globalThis;
    }
}

