import { ITEM_SLOTS, SET_BONUSES, SLOT_LABELS } from '../systems/ItemEffectSystem.js';

export class InventoryPanel {
    constructor(ui) {
        this.ui = ui;
        this.heroId = null;
        this.pendingEquipItemId = null;
        this.tierFilter = 0;
        this.slotFilter = 'all';
    }

    render(title = 'Inventario') {
        const game = this.ui.game;
        const entries = this.getInventoryEntries().filter(({ item, totalCount }) => {
            return totalCount > 0
                && (this.tierFilter === 0 || item.tier === this.tierFilter)
                && (this.slotFilter === 'all' || item.slot === this.slotFilter);
        });
        const equippedCount = entries.reduce((total, entry) => total + entry.equippedHeroes.length, 0);
        const freeCount = entries.reduce((total, entry) => total + entry.freeCount, 0);

        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong><i class="fas fa-gem"></i> 1 objeto por heroe</strong>
            </div>
            <section class="inventory-command-header">
                <div>
                    <span class="briefing-kicker">ARSENAL S.H.I.E.L.D.</span>
                    <h3>Objetos disponibles</h3>
                    <p>Elegí un objeto para abrir la colección y asignarlo a un héroe.</p>
                </div>
                <div class="inventory-loadout-readout">
                    <span><b>${entries.length}</b><small>tipos</small></span>
                    <span><b>${freeCount}</b><small>libres</small></span>
                    <span><b>${equippedCount}</b><small>equipados</small></span>
                </div>
            </section>

            <div class="inventory-filters">
                <div class="tier-filters" aria-label="Filtrar por tier">
                    ${[0, 1, 2, 3, 4].map((tier) => `<button class="tier-filter ${this.tierFilter === tier ? 'active' : ''}" data-tier="${tier}">${tier === 0 ? 'Todos' : `T${tier}`}</button>`).join('')}
                </div>
                <div class="slot-filters" aria-label="Filtrar por tipo">
                    ${['all', ...ITEM_SLOTS].map((slot) => `<button class="slot-filter ${this.slotFilter === slot ? 'active' : ''}" data-slot="${slot}">${slot === 'all' ? 'Todas' : SLOT_LABELS[slot]}</button>`).join('')}
                </div>
            </div>

            <div class="inventory-grid inventory-grid-v2">
                ${entries.length ? entries.map((entry) => this.renderItemCard(entry)).join('') : '<p class="empty-copy">No hay objetos con estos filtros.</p>'}
            </div>
        `;

        this.bindListeners();
    }

    getInventoryEntries() {
        const game = this.ui.game;
        const ownedCounts = new Map();
        (game.progression.state.ownedItemIds || []).forEach((itemId) => {
            ownedCounts.set(itemId, (ownedCounts.get(itemId) || 0) + 1);
        });
        const equippedByItem = new Map();
        Object.entries(game.progression.state.equippedItems || {}).forEach(([heroId, slots]) => {
            Object.values(slots || {}).forEach((itemId) => {
                if (!game.itemDatabase[itemId]) return;
                const hero = game.heroDatabase[heroId];
                const list = equippedByItem.get(itemId) || [];
                list.push({ heroId, hero });
                equippedByItem.set(itemId, list);
            });
        });

        return Object.values(game.itemDatabase)
            .map((item) => {
                const freeCount = ownedCounts.get(item.id) || 0;
                const equippedHeroes = equippedByItem.get(item.id) || [];
                return {
                    item,
                    freeCount,
                    equippedHeroes,
                    totalCount: freeCount + equippedHeroes.length
                };
            })
            .filter((entry) => entry.totalCount > 0)
            .sort((a, b) => a.item.tier - b.item.tier || a.item.name.localeCompare(b.item.name));
    }

    renderEquippedItem(item, slot) {
        if (!item) {
            return `<article class="equipment-slot empty single"><span>Objeto</span><strong>Ranura libre</strong><small>Equipa una sola pieza clave para este heroe.</small></article>`;
        }
        return `
            <article class="equipment-slot filled single">
                ${this.ui.renderSprite(item.icon, item.name)}
                <div><span>${SLOT_LABELS[item.slot]} | ${SET_BONUSES[item.set]?.name || 'Sin familia'}</span><strong>${item.name}</strong><small>${item.desc}</small></div>
                <div class="slot-actions">
                    <button class="icon-command unequip-item" data-slot="${slot}" aria-label="Desequipar ${item.name}" title="Desequipar"><i class="fas fa-eject"></i></button>
                </div>
            </article>
        `;
    }

    renderItemCard(entry) {
        const { item, freeCount, equippedHeroes, totalCount } = entry;
        const primaryHero = equippedHeroes[0]?.hero || null;
        const ownerLabel = equippedHeroes.length
            ? equippedHeroes.map(({ hero }) => hero?.name || 'Heroe').join(', ')
            : 'Sin equipar';
        return `
            <article class="inventory-card item-card-v2 inventory-object-card" data-item-id="${item.id}" role="button" tabindex="0" aria-label="Elegir ${item.name} para equipar">
                <b class="item-quantity-badge">x${totalCount}</b>
                ${primaryHero ? `<span class="item-owner-corner" title="Equipado por ${primaryHero.name}">${this.ui.renderSprite(this.ui.getHeroDisplaySprite(primaryHero), primaryHero.name)}</span>` : ''}
                <div class="item-sprite-frame">${this.ui.renderSprite(item.icon, item.name)}</div>
                <h3>${item.name}</h3>
                <small>${SLOT_LABELS[item.slot]} | T${item.tier} | ${SET_BONUSES[item.set]?.name || 'Sin familia'}</small>
                <p>${item.desc}</p>
                <div class="item-card-status">
                    <span>${freeCount} libre${freeCount === 1 ? '' : 's'}</span>
                    <b>${ownerLabel}</b>
                </div>
                <div class="item-card-actions">
                    <button class="btn-primary equip-item" data-id="${item.id}"><i class="fas fa-users"></i> Elegir héroe</button>
                </div>
            </article>
        `;
    }

    bindListeners() {
        const game = this.ui.game;
        this.ui.panelContent.querySelectorAll('.tier-filter').forEach((button) => button.addEventListener('click', () => {
            this.tierFilter = Number(button.dataset.tier);
            this.render();
        }));
        this.ui.panelContent.querySelectorAll('.slot-filter').forEach((button) => button.addEventListener('click', () => {
            this.slotFilter = button.dataset.slot;
            this.render();
        }));
        const chooseItem = (itemId) => {
            const item = game.itemDatabase[itemId];
            if (!item) return;
            this.pendingEquipItemId = item.id;
            this.ui.teamBuilderPanel.viewMode = 'heroes';
            this.ui.teamBuilderPanel.searchQuery = '';
            this.ui.showToast(`Elegí un héroe para ${item.name}`, 'info');
            this.ui.renderPanel('collection');
        };
        this.ui.panelContent.querySelectorAll('.inventory-object-card').forEach((card) => {
            card.addEventListener('click', () => chooseItem(card.dataset.itemId));
            card.addEventListener('keydown', (event) => {
                if (!['Enter', ' '].includes(event.key)) return;
                event.preventDefault();
                chooseItem(card.dataset.itemId);
            });
        });
        this.ui.panelContent.querySelectorAll('.equip-item').forEach((button) => button.addEventListener('click', (event) => {
            event.stopPropagation();
            chooseItem(button.dataset.id);
        }));
        this.ui.panelContent.querySelectorAll('.unequip-item').forEach((button) => button.addEventListener('click', () => {
            game.progression.unequipItem(this.heroId, button.dataset.slot);
            this.ui.showToast('Objeto devuelto al inventario', 'success');
            this.render();
        }));
    }
}
