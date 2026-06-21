import { getActiveSets, getForgeMultiplier, ITEM_SLOTS, SET_BONUSES, SLOT_LABELS } from '../systems/ItemEffectSystem.js';

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
        const equippedItems = Object.values(slots).map((id) => game.itemDatabase[id]).filter(Boolean);
        const activeSets = getActiveSets(equippedItems);
        const available = Object.values(game.itemDatabase).filter((item) => {
            const quantity = game.progression.getOwnedQuantity(item.id);
            return quantity > 0
                && (this.tierFilter === 0 || item.tier === this.tierFilter)
                && (this.slotFilter === 'all' || item.slot === this.slotFilter);
        });

        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong><i class="fas fa-hammer"></i> ${game.progression.state.forgeMaterials} materiales</strong>
            </div>
            <div class="inventory-toolbar inventory-toolbar-v2">
                <label>Héroe
                    <select id="inventory-hero-select">
                        ${game.unlockedHeroes.map((entry) => `<option value="${entry.id}" ${entry.id === this.heroId ? 'selected' : ''}>${entry.name}</option>`).join('')}
                    </select>
                </label>
                <div class="loadout-actions">
                    <button id="save-loadout" class="btn-primary ghost"><i class="fas fa-save"></i> Guardar loadout</button>
                    <button id="apply-loadout" class="btn-primary ghost"><i class="fas fa-folder-open"></i> Aplicar loadout</button>
                </div>
            </div>

            <section class="equipment-slots">
                ${ITEM_SLOTS.map((slot) => this.renderEquippedSlot(slot, slots[slot])).join('')}
            </section>
            <div class="set-status ${activeSets.length ? 'active' : ''}">
                <strong>Bonos de set</strong>
                <span>${activeSets.length ? activeSets.map((set) => set.description).join(' · ') : 'Equipa dos piezas de la misma familia para activar un bonus.'}</span>
            </div>

            <div class="inventory-filters">
                <div class="tier-filters" aria-label="Filtrar por tier">
                    ${[0, 1, 2, 3, 4].map((tier) => `<button class="tier-filter ${this.tierFilter === tier ? 'active' : ''}" data-tier="${tier}">${tier === 0 ? 'Todos' : `T${tier}`}</button>`).join('')}
                </div>
                <div class="slot-filters" aria-label="Filtrar por ranura">
                    ${['all', ...ITEM_SLOTS].map((slot) => `<button class="slot-filter ${this.slotFilter === slot ? 'active' : ''}" data-slot="${slot}">${slot === 'all' ? 'Todas' : SLOT_LABELS[slot]}</button>`).join('')}
                </div>
            </div>

            <div class="inventory-grid inventory-grid-v2">
                ${available.length ? available.map((item) => this.renderItemCard(item)).join('') : '<p class="empty-copy">No hay copias disponibles con estos filtros.</p>'}
            </div>
        `;

        this.bindListeners();
    }

    renderEquippedSlot(slot, itemId) {
        const game = this.ui.game;
        const item = game.itemDatabase[itemId];
        if (!item) {
            return `<article class="equipment-slot empty"><span>${SLOT_LABELS[slot]}</span><strong>Ranura libre</strong></article>`;
        }
        const level = game.progression.getItemLevel(item.id);
        const upgradeCost = game.progression.getForgeCost(item.id);
        return `
            <article class="equipment-slot filled">
                ${this.ui.renderSprite(item.icon, item.name)}
                <div><span>${SLOT_LABELS[slot]} · ${SET_BONUSES[item.set]?.name || 'Sin set'}</span><strong>${item.name}</strong><small>Nivel ${level}</small></div>
                <div class="slot-actions">
                    <button class="icon-command upgrade-item" data-id="${item.id}" aria-label="Mejorar ${item.name}" title="${level >= 3 ? 'Nivel máximo' : `Mejorar por ${upgradeCost} materiales`}" ${level >= 3 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                    <button class="icon-command unequip-item" data-slot="${slot}" aria-label="Desequipar ${item.name}" title="Desequipar"><i class="fas fa-eject"></i></button>
                </div>
            </article>
        `;
    }

    renderItemCard(item) {
        const progression = this.ui.game.progression;
        const quantity = progression.getOwnedQuantity(item.id);
        const level = progression.getItemLevel(item.id);
        const upgradeCost = progression.getForgeCost(item.id);
        const salvage = item.tier * 20;
        return `
            <article class="inventory-card item-card-v2">
                <div class="item-card-heading">
                    ${this.ui.renderSprite(item.icon, item.name)}
                    <div><span>${SLOT_LABELS[item.slot]} · ${SET_BONUSES[item.set]?.name || 'Sin set'}</span><h3>${item.name}</h3></div>
                    <b>x${quantity}</b>
                </div>
                <p>${item.desc}</p>
                <small>T${item.tier} · Nivel ${level} · potencia x${getForgeMultiplier(level).toFixed(1)}</small>
                <div class="item-card-actions">
                    <button class="btn-primary equip-item" data-id="${item.id}">Equipar</button>
                    <button class="btn-primary ghost upgrade-item" data-id="${item.id}" ${level >= 3 ? 'disabled' : ''}>Mejorar ${level >= 3 ? 'MAX' : upgradeCost}</button>
                    <button class="btn-primary danger salvage-item" data-id="${item.id}">Reciclar +${salvage}</button>
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
        this.ui.panelContent.querySelectorAll('.salvage-item').forEach((button) => button.addEventListener('click', () => {
            const result = game.progression.salvageItem(button.dataset.id);
            this.ui.showToast(result.ok ? `+${result.materials} materiales de forja` : result.reason, result.ok ? 'reward' : 'warning');
            this.render();
        }));
        this.ui.panelContent.querySelectorAll('.upgrade-item').forEach((button) => button.addEventListener('click', () => {
            const result = game.progression.upgradeItem(button.dataset.id);
            this.ui.showToast(result.ok ? `Objeto mejorado a nivel ${result.level}` : result.reason, result.ok ? 'success' : 'warning');
            this.render();
        }));
        document.getElementById('save-loadout')?.addEventListener('click', () => {
            game.progression.saveLoadout(this.heroId);
            this.ui.showToast('Loadout guardado', 'success');
        });
        document.getElementById('apply-loadout')?.addEventListener('click', () => {
            const result = game.progression.applyLoadout(this.heroId);
            this.ui.showToast(result.ok ? 'Loadout aplicado' : result.reason, result.ok ? 'success' : 'warning');
            this.render();
        });
    }
}
