import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { InventoryPanel } from '../src/ui/InventoryPanel.js';
import { TeamBuilderPanel } from '../src/ui/TeamBuilderPanel.js';

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

test('coleccion expone diccionario de evoluciones vacio', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);

    assert.match(panel.renderCollectionTabs(), /data-view="evolutions"/);
    assert.match(panel.renderEvolutionCodex(), /Diccionario de evoluciones/);
    assert.match(panel.renderEvolutionCodex(), /Reservado para futuras evoluciones/);
});
