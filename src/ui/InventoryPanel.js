import { aggregateItemEffects, ITEM_SLOTS, SET_BONUSES, SLOT_LABELS } from '../systems/ItemEffectSystem.js';
import { HERO_RARITIES, getRarityClass, normalizeRarity } from '../utils/Rarity.js';

const ITEM_EFFECT_LABELS = {
    damagePct: 'Dano',
    fireRatePct: 'Cadencia',
    rangePct: 'Alcance',
    critChance: 'Critico',
    armorPenetration: 'Perforacion',
    armorDamagePct: 'Anti-blindaje',
    critDamageBonus: 'Dano critico',
    consecutiveDamagePct: 'Combo',
    splashRadius: 'Area',
    splashFactor: 'Splash',
    chainCount: 'Rebotes',
    chainRange: 'Cadena',
    chainFactor: 'Dano cadena',
    onHitCreditPct: 'Creditos',
    slowPower: 'Ralentizar',
    slowChance: 'Chance slow',
    stunChance: 'Aturdir',
    stunDuration: 'Duracion stun',
    burnChance: 'Quemar',
    burnPower: 'Dano quemadura',
    poisonChance: 'Veneno',
    poisonPower: 'Dano veneno',
    poisonStacks: 'Cargas veneno',
    curseChance: 'Maldicion',
    cursePower: 'Dano maldicion',
    statusDamagePct: 'Dano por estado',
    statusDamageCap: 'Tope estados',
    bossDamagePct: 'Dano jefe',
    longRangeDamagePct: 'Dano lejano',
    closeRangeDamagePenaltyPct: 'Penalizacion cerca',
    detectStealth: 'Detecta sigilo',
    allowWater: 'Agua',
    allowMountain: 'Montana',
    allowGrass: 'Pasto',
    burnDuration: 'Quemadura',
    stunDuration: 'Aturdimiento',
    poisonDuration: 'Veneno',
    curseDuration: 'Maldicion'
};

const PERCENT_EFFECTS = new Set([
    'damagePct',
    'fireRatePct',
    'rangePct',
    'armorDamagePct',
    'critDamageBonus',
    'consecutiveDamagePct',
    'splashFactor',
    'chainFactor',
    'onHitCreditPct',
    'slowPower',
    'slowChance',
    'stunChance',
    'burnChance',
    'burnPower',
    'poisonChance',
    'poisonPower',
    'curseChance',
    'cursePower',
    'statusDamagePct',
    'statusDamageCap',
    'bossDamagePct',
    'longRangeDamagePct',
    'closeRangeDamagePenaltyPct'
]);

export function buildItemEquipDeltaRows(nextItem, currentItem = null) {
    const current = aggregateItemEffects(currentItem ? [currentItem] : []);
    const next = aggregateItemEffects(nextItem ? [nextItem] : []);
    const keys = [...new Set([...Object.keys(current), ...Object.keys(next)])]
        .filter((key) => typeof current[key] !== 'boolean' && typeof next[key] !== 'boolean');

    return keys
        .map((key) => ({
            key,
            label: ITEM_EFFECT_LABELS[key] || key,
            value: Number(next[key] || 0) - Number(current[key] || 0),
            suffix: PERCENT_EFFECTS.has(key) ? '%' : '',
            precision: PERCENT_EFFECTS.has(key) ? 1 : 0,
            multiplier: PERCENT_EFFECTS.has(key) ? 100 : 1
        }))
        .filter((row) => Math.abs(row.value) > 0.0001);
}

export function renderItemDeltaRows(rows) {
    if (!rows.length) return '<em class="neutral">Sin cambios numericos</em>';
    return rows.map((row) => {
        const value = row.value * row.multiplier;
        const fixed = Math.abs(value).toFixed(row.precision);
        const clean = row.precision > 0 ? fixed.replace(/\.0$/, '') : fixed;
        return `<em class="${value < 0 ? 'negative' : 'positive'}">${row.label} ${value >= 0 ? '+' : '-'}${clean}${row.suffix}</em>`;
    }).join('');
}

export function buildItemEffectPills(item, limit = 3) {
    const effects = aggregateItemEffects(item ? [item] : []);
    const pills = Object.entries(effects)
        .map(([key, value]) => formatItemEffectPill(key, value))
        .filter(Boolean);
    const visible = pills.slice(0, limit);
    const hidden = Math.max(0, pills.length - visible.length);
    if (hidden) visible.push({ label: `+${hidden}`, value: 'extras', tone: 'neutral' });
    return visible;
}

function formatItemEffectPill(key, value) {
    const label = ITEM_EFFECT_LABELS[key] || key;
    if (value === true) return { label, value: 'activo', tone: 'utility' };
    if (!Number.isFinite(value) || Math.abs(value) <= 0.0001) return null;
    const isPercent = PERCENT_EFFECTS.has(key);
    const scaled = value * (isPercent ? 100 : 1);
    const precision = Number.isInteger(scaled) ? 0 : 1;
    const fixed = Math.abs(scaled).toFixed(precision).replace(/\.0$/, '');
    const suffix = isPercent ? '%' : key.toLowerCase().includes('duration') ? 's' : '';
    return {
        label,
        value: `${scaled >= 0 ? '+' : '-'}${fixed}${suffix}`,
        tone: scaled < 0 ? 'negative' : 'positive'
    };
}

export class InventoryPanel {
    constructor(ui) {
        this.ui = ui;
        this.heroId = null;
        this.pendingEquipItemId = null;
        this.tierFilter = 0;
        this.slotFilter = 'all';
        this.statusFilter = 'all';
    }

    hasActiveInventoryFilters() {
        return this.tierFilter !== 0
            || this.slotFilter !== 'all'
            || this.statusFilter !== 'all';
    }

    resetInventoryFilters() {
        this.tierFilter = 0;
        this.slotFilter = 'all';
        this.statusFilter = 'all';
    }

    render(title = 'Inventario') {
        const game = this.ui.game;
        const allEntries = this.getInventoryEntries();
        const entries = allEntries.filter((entry) => this.passesInventoryFilters(entry));
        const equippedCount = allEntries.reduce((total, entry) => total + entry.equippedHeroes.length, 0);
        const freeCount = allEntries.reduce((total, entry) => total + entry.freeCount, 0);
        const raritySummary = this.buildRaritySummary(allEntries);
        const statusOptions = [
            ['all', 'Todos'],
            ['free', 'Libres'],
            ['equipped', 'Equipados']
        ];
        const hasActiveFilters = this.hasActiveInventoryFilters();

        this.ui.panelContent.innerHTML = `
            <div class="panel-title-row">
                <h2>${title}</h2>
                <strong><i class="fas fa-gem"></i> 1 objeto por heroe</strong>
            </div>
            <section class="inventory-command-header inventory-command-header--compact">
                <div>
                    <span class="briefing-kicker">ARSENAL HEROICO</span>
                    <h3>Objetos</h3>
                    <p>Click en un objeto para elegir a qué héroe equiparlo.</p>
                </div>
                <div class="inventory-command-stack">
                    <div class="inventory-loadout-readout">
                        <span><b>${allEntries.length}</b><small>tipos</small></span>
                        <span><b>${freeCount}</b><small>libres</small></span>
                        <span><b>${equippedCount}</b><small>equipados</small></span>
                    </div>
                    <div class="inventory-rarity-strip" aria-label="Objetos por rareza">
                        ${raritySummary.length
                            ? raritySummary.map(({ rarity, count }) => `<span class="${getRarityClass(rarity)}"><b>${rarity}</b><small>x${count}</small></span>`).join('')
                            : '<span><b>Sin objetos</b><small>x0</small></span>'}
                    </div>
                </div>
            </section>

            <div class="inventory-filters inventory-filters--compact">
                <div class="inventory-status-filters" aria-label="Filtrar por estado">
                    ${statusOptions.map(([status, label]) => {
                        const active = this.statusFilter === status;
                        return `<button class="status-filter ${active ? 'active' : ''}" type="button" data-status="${status}" aria-pressed="${active}" aria-label="Filtrar objetos: ${label}" title="Filtrar objetos: ${label}" data-tooltip="Filtrar objetos: ${label}">${label}</button>`;
                    }).join('')}
                </div>
                <div class="tier-filters" aria-label="Filtrar por tier">
                    ${[0, 1, 2, 3, 4].map((tier) => {
                        const label = tier === 0 ? 'Todos' : `T${tier}`;
                        const filterLabel = tier === 0 ? 'Mostrar todos los tiers' : `Filtrar tier ${tier}`;
                        return `<button class="tier-filter ${this.tierFilter === tier ? 'active' : ''}" type="button" data-tier="${tier}" aria-pressed="${this.tierFilter === tier}" aria-label="${filterLabel}" title="${filterLabel}" data-tooltip="${filterLabel}">${label}</button>`;
                    }).join('')}
                </div>
                <div class="slot-filters" aria-label="Filtrar por tipo">
                    ${['all', ...ITEM_SLOTS].map((slot) => {
                        const label = slot === 'all' ? 'Todas' : SLOT_LABELS[slot];
                        const filterLabel = slot === 'all' ? 'Mostrar todos los tipos de objeto' : `Filtrar tipo ${label}`;
                        return `<button class="slot-filter ${this.slotFilter === slot ? 'active' : ''}" type="button" data-slot="${slot}" aria-pressed="${this.slotFilter === slot}" aria-label="${filterLabel}" title="${filterLabel}" data-tooltip="${filterLabel}">${label}</button>`;
                    }).join('')}
                </div>
                <button id="inventory-clear-filters" class="inventory-clear-filters icon-command" type="button" ${hasActiveFilters ? '' : 'disabled'} title="Limpiar filtros" aria-label="Limpiar filtros" data-tooltip="Limpiar filtros">
                    <i class="fas fa-broom"></i>
                </button>
                <strong class="inventory-filter-count">${entries.length}/${allEntries.length}</strong>
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

    buildRaritySummary(entries) {
        const counts = new Map();
        entries.forEach(({ item, totalCount }) => {
            const rarity = normalizeRarity(item.rarity);
            counts.set(rarity, (counts.get(rarity) || 0) + totalCount);
        });
        return HERO_RARITIES
            .map((rarity) => ({ rarity, count: counts.get(rarity) || 0 }))
            .filter((entry) => entry.count > 0);
    }

    passesInventoryFilters({ item, totalCount, freeCount, equippedHeroes }) {
        return totalCount > 0
            && (this.statusFilter === 'all'
                || (this.statusFilter === 'free' && freeCount > 0)
                || (this.statusFilter === 'equipped' && equippedHeroes.length > 0))
            && (this.tierFilter === 0 || item.tier === this.tierFilter)
            && (this.slotFilter === 'all' || item.slot === this.slotFilter);
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
                    <button class="icon-command unequip-item" type="button" data-slot="${slot}" aria-label="Desequipar ${item.name}" title="Desequipar" data-tooltip="Desequipar"><i class="fas fa-eject"></i></button>
                </div>
            </article>
        `;
    }

    renderItemCard(entry) {
        const { item, freeCount, equippedHeroes, totalCount } = entry;
        const primaryHero = equippedHeroes[0]?.hero || null;
        const rarity = normalizeRarity(item.rarity);
        const rarityClass = getRarityClass(rarity);
        const ownerLabel = equippedHeroes.length
            ? equippedHeroes.map(({ hero }) => hero?.name || 'Heroe').join(', ')
            : 'Sin equipar';
        const freeLabel = `${freeCount} ${freeCount === 1 ? 'copia libre' : 'copias libres'}`;
        const ownerStateLabel = equippedHeroes.length ? `Equipado por ${ownerLabel}` : 'Sin equipar';
        const itemAriaLabel = `Elegir ${item.name} para equipar. Rareza ${rarity}. ${freeLabel}. ${ownerStateLabel}`;
        const equipPreview = this.heroId ? this.renderEquipPreview(item) : '';
        const effectPills = buildItemEffectPills(item);
        return `
            <article class="inventory-card item-card-v2 inventory-object-card ${rarityClass}" data-item-id="${item.id}" data-rarity="${rarity}" role="button" tabindex="0" aria-label="${itemAriaLabel}">
                <b class="item-quantity-badge">x${totalCount}</b>
                ${primaryHero ? `<span class="item-owner-corner" title="Equipado por ${primaryHero.name}">${this.ui.renderSprite(this.ui.getHeroDisplaySprite(primaryHero), primaryHero.name)}</span>` : ''}
                <div class="item-sprite-frame">${this.ui.renderSprite(item.icon, item.name)}</div>
                <h3>${item.name}</h3>
                <small>${SLOT_LABELS[item.slot]} | <b class="rarity-badge ${rarityClass}">${rarity}</b> | ${SET_BONUSES[item.set]?.name || 'Sin familia'}</small>
                <p>${item.desc}</p>
                <div class="item-effect-pills" aria-label="Efectos principales">
                    ${effectPills.map((pill) => `<span class="${pill.tone}"><b>${pill.label}</b><small>${pill.value}</small></span>`).join('')}
                </div>
                <div class="item-card-status">
                    <span>${freeCount} libre${freeCount === 1 ? '' : 's'}</span>
                    <b>${ownerLabel}</b>
                </div>
                <div class="item-card-actions">
                    <button class="btn-primary equip-item" type="button" data-id="${item.id}" aria-label="Elegir heroe para ${item.name}" title="Elegir heroe para ${item.name}" data-tooltip="Elegir heroe para ${item.name}"><i class="fas fa-users"></i> Elegir héroe</button>
                </div>
                ${equipPreview}
            </article>
        `;
    }

    renderEquipPreview(item) {
        const currentItem = this.getHeroCurrentItem(this.heroId);
        const rows = buildItemEquipDeltaRows(item, currentItem);
        return `
            <div class="item-equip-preview">
                <strong>${currentItem ? `vs ${currentItem.name}` : 'Al equipar'}</strong>
                ${renderItemDeltaRows(rows)}
            </div>
        `;
    }

    getHeroCurrentItem(heroId) {
        if (!heroId) return null;
        const slots = this.ui.game.progression.state.equippedItems[heroId] || {};
        const itemId = Object.values(slots)[0] || null;
        return itemId ? this.ui.game.itemDatabase[itemId] || null : null;
    }

    bindListeners() {
        const game = this.ui.game;
        this.ui.panelContent.querySelectorAll('.tier-filter').forEach((button) => button.addEventListener('click', () => {
            this.tierFilter = Number(button.dataset.tier);
            this.render();
        }));
        this.ui.panelContent.querySelectorAll('.status-filter').forEach((button) => button.addEventListener('click', () => {
            this.statusFilter = button.dataset.status;
            this.render();
        }));
        this.ui.panelContent.querySelectorAll('.slot-filter').forEach((button) => button.addEventListener('click', () => {
            this.slotFilter = button.dataset.slot;
            this.render();
        }));
        this.ui.panelContent.querySelector('#inventory-clear-filters')?.addEventListener('click', () => {
            this.resetInventoryFilters();
            this.render();
        });
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
