import { SET_BONUSES, SLOT_LABELS } from '../systems/ItemEffectSystem.js';
import { getHeroBoxCost } from '../systems/ShopSystem.js';
import { getRarityClass, normalizeRarity } from '../utils/Rarity.js';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
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
        const credits = this.ui.game.progression.getCredits();
        const fundsText = this.ui.game.progression.state.settings.adminMode ? '∞' : `$${credits}`;
        const recruitCost = getHeroBoxCost(this.ui.game.progression.state.shop);

        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row"><h2>${title}</h2><strong>${fundsText} creditos</strong></div>
            <div class="shop-layout">
                <section class="shop-feature">
                    <h3>Caja de reclutamiento</h3>
                    <p>Recluta un héroe sin duplicados. Tras cuatro aperturas comunes, la siguiente garantiza Rare o superior.</p>
                    <div class="pity-track">Garantía: ${Math.min(4, this.ui.game.progression.state.shop.heroPity)}/4</div>
                    <button class="btn-primary" id="gacha-btn">RECLUTAR POR $${recruitCost}</button>
                    <div id="gacha-res" class="result-copy"></div>
                </section>
                <section>
                    <h3>Arsenal progresivo</h3>
                    <p class="empty-copy">Se muestran los 3 objetos mas basicos disponibles. Al comprar uno, entra el siguiente del arsenal.</p>
                    <div class="shop-grid">
                        ${rotation.map((slot) => this.renderItem(slot.item, slot.purchased)).join('') || '<p class="empty-copy">Arsenal completado.</p>'}
                    </div>
                </section>
            </div>
        `;

        this.queryPanel('#gacha-btn')?.addEventListener('click', () => this.handleGacha());
        this.ui.panelContent.querySelectorAll('.btn-buy-item').forEach((button) => {
            button.addEventListener('click', () => this.buyItem(button.dataset.id));
        });
    }

    renderItem(item, purchased = false) {
        if (!item) return '<div class="shop-card empty-copy">Agotado</div>';
        const owned = this.ui.game.progression.getOwnedQuantity(item.id);
        const rarity = normalizeRarity(item.rarity);
        const rarityClass = getRarityClass(rarity);
        const summary = this.ui.nextWaveSummary || (!this.ui.game.waveManager?.isWaveActive ? this.ui.game.waveManager?.buildPreparedSummary?.() : null);
        const insight = this.buildShopItemInsight(item, summary);
        const setProgress = this.buildShopSetProgress(
            item,
            this.ui.game.progression.state.ownedItemIds,
            this.ui.game.progression.state.equippedItems,
            this.ui.game.itemDatabase
        );
        return `
            <div class="shop-card ${rarityClass} ${purchased ? 'purchased' : ''}" data-rarity="${rarity}">
                <div class="item-badge rarity-badge ${rarityClass}">${rarity}</div>
                <div class="shop-item-heading">
                    ${this.ui.renderSprite(item.icon, item.name)}
                    <div><small>${SLOT_LABELS[item.slot]} · ${SET_BONUSES[item.set]?.name || item.set}</small><h4>${item.name}</h4></div>
                </div>
                <p>${item.desc}</p>
                <div class="shop-insight ${insight.tone}" aria-label="Recomendado por ${escapeHtml(insight.reasons.join(', '))}">
                    <strong>${escapeHtml(insight.label)}</strong>
                    <span>${insight.reasons.map(escapeHtml).join(' | ')}</span>
                </div>
                ${setProgress ? `<div class="shop-set-progress ${setProgress.status}" aria-label="${escapeHtml(setProgress.ariaLabel)}">
                    <strong>${escapeHtml(setProgress.label)}</strong>
                    <span>${escapeHtml(setProgress.detail)}</span>
                </div>` : ''}
                <small>Copias disponibles: ${owned}</small>
                <button class="btn-buy-item btn-primary ghost" data-id="${item.id}" ${purchased ? 'disabled' : ''}>${purchased ? 'ADQUIRIDO' : `$${item.price}`}</button>
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
                <button class="gacha-skip-btn btn-primary ghost" type="button"><i class="fas fa-forward"></i> Saltear</button>
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
        const timers = this.getTimerHost();

        this.gachaRevealTimers.forEach((timer) => timers.clearTimeout(timer));
        this.gachaRevealTimers = [];

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
            this.gachaRevealTimers.forEach((timer) => timers.clearTimeout(timer));
            this.gachaRevealTimers = [];
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
        }
        const pityTrack = this.ui.panelContent.querySelector('.pity-track');
        if (pityTrack) pityTrack.textContent = `Garantia: ${Math.min(4, this.ui.game.progression.state.shop.heroPity)}/4`;

        this.startGachaRevealAnimation(result, () => {
            const nextPool = Object.values(this.ui.game.heroDatabase || {})
                .filter((hero) => hero.visual)
                .filter((hero) => !this.ui.game.progression.state.unlockedHeroIds.includes(hero.id));
            if (button) {
                button.disabled = nextPool.length === 0;
                const nextCost = getHeroBoxCost(this.ui.game.progression.state.shop);
                button.textContent = nextPool.length === 0 ? 'PLANTILLA COMPLETA' : `RECLUTAR POR $${nextCost}`;
            }
        });
    }

    queryPanel(selector) {
        return this.ui.panelContent?.querySelector?.(selector) || globalThis.document?.querySelector?.(selector) || null;
    }

    getTimerHost() {
        return globalThis.window || globalThis;
    }
}
