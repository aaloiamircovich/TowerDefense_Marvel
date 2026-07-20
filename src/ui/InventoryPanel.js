import { ITEM_SLOTS, SET_BONUSES, SLOT_LABELS } from '../systems/ItemEffectSystem.js';

export class InventoryPanel {
    constructor(ui) {
        this.ui = ui;
        this.heroId = null;
        this.tierFilter = 0;
        this.slotFilter = 'all';
    }

    render(title = 'Inventario') {
        const game = this.ui.game;
        this.heroId ||= game.activeTeam[0]?.id || game.unlockedHeroes[0]?.id || null;
        const hero = game.heroDatabase[this.heroId];
        const slots = game.progression.state.equippedItems[this.heroId] || {};
        const equippedItemId = Object.values(slots)[0] || null;
        const equippedSlot = Object.keys(slots)[0] || null;
        const equippedItem = equippedItemId ? game.itemDatabase[equippedItemId] : null;
        const available = Object.values(game.itemDatabase).filter((item) => {
            const quantity = game.progression.getOwnedQuantity(item.id);
            return quantity > 0
                && (this.tierFilter === 0 || item.tier === this.tierFilter)
                && (this.slotFilter === 'all' || item.slot === this.slotFilter);
        });

        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong><i class="fas fa-gem"></i> 1 objeto por heroe</strong>
            </div>
            <section class="inventory-command-header">
                <div>
                    <span class="briefing-kicker">ARSENAL ACTIVO</span>
                    <h3>${hero?.name || 'Heroe'}</h3>
                    <p>${equippedItem ? `${equippedItem.name} equipado` : 'Sin objeto equipado'}</p>
                </div>
                <div class="inventory-loadout-readout">
                    <span><b>${available.length}</b><small>objetos</small></span>
                    <span><b>${equippedItem ? 1 : 0}</b><small>equipado</small></span>
                </div>
            </section>
            <div class="inventory-toolbar inventory-toolbar-v2">
                <label>Heroe
                    <select id="inventory-hero-select">
                        ${game.unlockedHeroes.map((entry) => `<option value="${entry.id}" ${entry.id === this.heroId ? 'selected' : ''}>${entry.name}</option>`).join('')}
                    </select>
                </label>
                <div class="loadout-actions">
                    <button id="save-loadout" class="btn-primary ghost"><i class="fas fa-save"></i> Guardar objeto</button>
                    <button id="apply-loadout" class="btn-primary ghost"><i class="fas fa-folder-open"></i> Aplicar objeto</button>
                </div>
            </div>

            <section class="equipment-slots single-equipment-slot">
                ${this.renderEquippedItem(equippedItem, equippedSlot)}
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
                ${available.length ? available.map((item) => this.renderItemCard(item)).join('') : '<p class="empty-copy">No hay copias disponibles con estos filtros.</p>'}
            </div>
        `;

        this.bindListeners();
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

    renderItemCard(item) {
        const progression = this.ui.game.progression;
        const quantity = progression.getOwnedQuantity(item.id);
        return `
            <article class="inventory-card item-card-v2">
                <div class="item-card-heading">
                    ${this.ui.renderSprite(item.icon, item.name)}
                    <div><span>${SLOT_LABELS[item.slot]} | ${SET_BONUSES[item.set]?.name || 'Sin familia'}</span><h3>${item.name}</h3></div>
                    <b>x${quantity}</b>
                </div>
                <p>${item.desc}</p>
                <small>T${item.tier} | pieza unica equipada</small>
                <div class="item-card-actions">
                    <button class="btn-primary equip-item" data-id="${item.id}">Equipar</button>
                </div>
            </article>
        `;
    }

    bindListeners() {
        const game = this.ui.game;
        document.getElementById('inventory-hero-select')?.addEventListener('change', (event) => {
            this.heroId = event.target.value;
            this.render();
        });
        this.ui.panelContent.querySelectorAll('.tier-filter').forEach((button) => button.addEventListener('click', () => {
            this.tierFilter = Number(button.dataset.tier);
            this.render();
        }));
        this.ui.panelContent.querySelectorAll('.slot-filter').forEach((button) => button.addEventListener('click', () => {
            this.slotFilter = button.dataset.slot;
            this.render();
        }));
        this.ui.panelContent.querySelectorAll('.equip-item').forEach((button) => button.addEventListener('click', () => {
            const item = game.itemDatabase[button.dataset.id];
            if (game.progression.equipItem(this.heroId, item.id)) this.ui.showToast(`${item.name} equipado`, 'success');
            this.render();
        }));
        this.ui.panelContent.querySelectorAll('.unequip-item').forEach((button) => button.addEventListener('click', () => {
            game.progression.unequipItem(this.heroId, button.dataset.slot);
            this.ui.showToast('Objeto devuelto al inventario', 'success');
            this.render();
        }));
        document.getElementById('save-loadout')?.addEventListener('click', () => {
            game.progression.saveLoadout(this.heroId);
            this.ui.showToast('Objeto guardado', 'success');
        });
        document.getElementById('apply-loadout')?.addEventListener('click', () => {
            const result = game.progression.applyLoadout(this.heroId);
            this.ui.showToast(result.ok ? 'Objeto aplicado' : result.reason, result.ok ? 'success' : 'warning');
            this.render();
        });
    }
}
