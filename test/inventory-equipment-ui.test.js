import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildItemEquipDeltaRows, InventoryPanel } from '../src/ui/InventoryPanel.js';
import { TeamBuilderPanel } from '../src/ui/TeamBuilderPanel.js';
import { UIManager } from '../src/systems/UIManager.js';

const data = {
    heroes: JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8')),
    items: JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'))
};

function createUiStub() {
    const state = {
        unlockedHeroIds: ['iron_man', 'spiderman'],
        ownedItemIds: ['lentes_edith'],
        equippedItems: { iron_man: { weapon: 'reactor_arc' } }
    };
    return {
        inventoryPanel: { pendingEquipItemId: 'reactor_arc' },
        game: {
            heroDatabase: data.heroes,
            itemDatabase: data.items,
            activeTeam: [],
            progression: {
                state,
                getHeroEvolution: () => null,
                getOwnedQuantity: (itemId) => state.ownedItemIds.filter((id) => id === itemId).length
            }
        },
        renderSprite: (source, name) => `<img src="${source || ''}" alt="${name}">`,
        getHeroDisplaySprite: (hero) => hero.visual?.portrait || hero.sprite
    };
}

test('inventario muestra objetos equipados con el sprite del heroe dueño', () => {
    const ui = createUiStub();
    const panel = new InventoryPanel(ui);
    const reactorEntry = panel.getInventoryEntries().find((entry) => entry.item.id === 'reactor_arc');

    assert.equal(reactorEntry.freeCount, 0);
    assert.equal(reactorEntry.equippedHeroes[0].hero.id, 'iron_man');

    const html = panel.renderItemCard(reactorEntry);
    assert.match(html, /inventory-object-card/);
    assert.match(html, /rarity-rare/);
    assert.match(html, /Rare/);
    assert.match(html, /item-owner-corner/);
    assert.match(html, /Equipado por Iron Man/);
});

test('coleccion muestra el objeto equipado y permite elegir heroe destino', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);

    const ironManHtml = panel.renderHeroCard(data.heroes.iron_man, true);
    assert.match(ironManHtml, /hero-item-corner/);
    assert.match(ironManHtml, /Ya equipado/);

    const spiderManHtml = panel.renderHeroCard(data.heroes.spiderman, true);
    assert.match(spiderManHtml, /btn-assign-item/);
    assert.match(spiderManHtml, /Equipar/);
});

test('previsualizacion de objeto compara mejoras y perdidas numericas', () => {
    const rows = buildItemEquipDeltaRows(data.items.lentes_edith, data.items.reactor_arc);
    const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));

    assert.equal(byKey.rangePct.value, 0.05);
    assert.equal(byKey.fireRatePct.value, -0.25);

    const ui = createUiStub();
    const panel = new InventoryPanel(ui);
    panel.heroId = 'iron_man';
    const html = panel.renderItemCard({
        item: data.items.lentes_edith,
        freeCount: 1,
        equippedHeroes: [],
        totalCount: 1
    });

    assert.match(html, /item-equip-preview/);
    assert.match(html, /Alcance \+5%/);
    assert.match(html, /Cadencia -25%/);
});

test('coleccion expone diccionario de evoluciones vacio', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);

    assert.match(panel.renderCollectionTabs(), /data-view="evolutions"/);
    assert.match(panel.renderEvolutionCodex(), /Diccionario de evoluciones/);
    assert.match(panel.renderEvolutionCodex(), /Reservado para futuras evoluciones/);
});

test('coleccion filtra heroes obtenidos y faltantes', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);
    const heroes = [data.heroes.iron_man, data.heroes.spiderman, data.heroes.thor];
    const unlockedIds = new Set(ui.game.progression.state.unlockedHeroIds);

    panel.ownershipFilter = 'owned';
    assert.deepEqual(panel.getFilteredHeroes(heroes, unlockedIds).map((hero) => hero.id), ['iron_man', 'spiderman']);

    panel.ownershipFilter = 'missing';
    assert.deepEqual(panel.getFilteredHeroes(heroes, unlockedIds).map((hero) => hero.id), ['thor']);

    assert.match(panel.renderCollectionFilters(2, 3), /collection-ownership-select/);
});

test('tienda de skins queda como panel independiente vacio', () => {
    const ui = Object.create(UIManager.prototype);
    ui.panelContent = { innerHTML: '' };

    ui.renderSkinShop('Skins');

    assert.match(ui.panelContent.innerHTML, /skins-shop-panel/);
    assert.match(ui.panelContent.innerHTML, /Skins de héroes/);
    assert.match(ui.panelContent.innerHTML, /Próximamente/);
});
