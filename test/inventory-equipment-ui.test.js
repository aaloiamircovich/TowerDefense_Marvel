import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildItemEffectPills, buildItemEquipDeltaRows, InventoryPanel } from '../src/ui/InventoryPanel.js';
import { TeamBuilderPanel } from '../src/ui/TeamBuilderPanel.js';
import { UIManager } from '../src/systems/UIManager.js';

const data = {
    heroes: JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8')),
    items: JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8')),
    enemies: JSON.parse(fs.readFileSync(new URL('../data/enemies.json', import.meta.url), 'utf8'))
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
            enemyDatabase: data.enemies,
            evolutionVisualDatabase: {},
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
    assert.match(html, /item-effect-pills/);
    assert.match(html, /Cadencia[\s\S]*\+18%/);
});

test('inventario resume efectos principales de cada objeto', () => {
    const pills = buildItemEffectPills(data.items.lentes_edith);

    assert.deepEqual(pills.slice(0, 3), [
        { label: 'Detecta sigilo', value: 'activo', tone: 'utility' },
        { label: 'Alcance', value: '+4%', tone: 'positive' },
        { label: 'Critico', value: '+2', tone: 'positive' }
    ]);
});

test('inventario filtra objetos libres y equipados desde la vista compacta', () => {
    const ui = createUiStub();
    ui.panelContent = { innerHTML: '', querySelectorAll: () => [] };
    const panel = new InventoryPanel(ui);

    panel.statusFilter = 'equipped';
    panel.render();
    assert.match(ui.panelContent.innerHTML, /inventory-rarity-strip[\s\S]*rarity-common[\s\S]*x1[\s\S]*rarity-rare[\s\S]*x1/);
    assert.match(ui.panelContent.innerHTML, /data-status="equipped" aria-pressed="true"/);
    assert.match(ui.panelContent.innerHTML, /data-item-id="reactor_arc"/);
    assert.doesNotMatch(ui.panelContent.innerHTML, /data-item-id="lentes_edith"/);

    panel.statusFilter = 'free';
    panel.render();
    assert.match(ui.panelContent.innerHTML, /data-status="free" aria-pressed="true"/);
    assert.match(ui.panelContent.innerHTML, /data-item-id="lentes_edith"/);
    assert.doesNotMatch(ui.panelContent.innerHTML, /data-item-id="reactor_arc"/);
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

    assert.equal(byKey.rangePct.value, 0.04);
    assert.equal(byKey.fireRatePct.value, -0.18);

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
    assert.match(html, /Alcance \+4%/);
    assert.match(html, /Cadencia -18%/);
});

test('coleccion expone diccionario de evoluciones completo', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);

    assert.match(panel.renderCollectionTabs(), /data-view="evolutions"/);
    assert.match(panel.renderCollectionTabs(), /fa-skull"><\/i> Villanos/);
    assert.match(panel.renderCollectionTabs(), /fa-dna"><\/i> Evoluciones/);
    assert.match(panel.renderEvolutionCodex(), /Diccionario de evoluciones/);
    assert.match(panel.renderEvolutionCodex(), /codex-command-header/);
    assert.match(panel.renderEvolutionCodex(), /codex-readout/);
    assert.match(panel.renderEvolutionCodex(), /Signature/);
    assert.match(panel.renderEvolutionCodex(), /Nivel 100/);
    assert.match(panel.renderEvolutionCodex(), /Nivel 50/);
    assert.match(panel.renderEvolutionCodex(), /Los objetos signature agregan mecanicas extra/);
});

test('coleccion compacta diccionario de villanos con metricas', () => {
    const ui = createUiStub();
    ui.game.progression.state.codexDiscovered = { enemies: ['hydra_soldier'] };
    const panel = new TeamBuilderPanel(ui);
    const html = panel.renderVillainCodex();

    assert.match(html, /Diccionario de villanos/);
    assert.match(html, /codex-command-header/);
    assert.match(html, /codex-readout/);
    assert.match(html, /Avistados/);
    assert.match(html, /Jefes/);
    assert.match(html, /villain-card--compact/);
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

test('coleccion resume equipo filtros y agrupaciones en cabecera compacta', () => {
    const ui = createUiStub();
    ui.inventoryPanel.pendingEquipItemId = null;
    ui.game.activeTeam = [data.heroes.iron_man, data.heroes.spiderman];
    const panel = new TeamBuilderPanel(ui);
    panel.searchQuery = 'iron';
    panel.rarityFilter = 'Rare';
    panel.ownershipFilter = 'owned';
    panel.sortMode = 'rarity-desc';

    const readyHeroes = [data.heroes.iron_man, data.heroes.spiderman, data.heroes.thor];
    const unlockedIds = new Set(ui.game.progression.state.unlockedHeroIds);
    const html = panel.renderCollectionCommandHeader({
        readyHeroes,
        filteredHeroes: [data.heroes.iron_man],
        unlockedIds,
        snapshot: {
            families: [{ activeTier: { count: 2 } }, { activeTier: null }],
            pairs: [{ active: true }, { active: false }]
        }
    });

    assert.match(html, /collection-command-header/);
    assert.match(html, /Heroes disponibles/);
    assert.match(html, /1\/3 visibles/);
    assert.match(html, /2\/6/);
    assert.match(html, /2\/3/);
    assert.match(html, /2 activas/);
    assert.match(html, /Busqueda: iron/);
    assert.match(html, /Rareza: Rare/);
    assert.match(html, /Solo obtenidos/);
    assert.match(html, /Orden: Rareza alta/);
});

test('tienda de skins queda como panel independiente vacio', () => {
    const ui = Object.create(UIManager.prototype);
    ui.panelContent = { innerHTML: '' };

    ui.renderSkinShop('Skins');

    assert.match(ui.panelContent.innerHTML, /skins-shop-panel/);
    assert.match(ui.panelContent.innerHTML, /Skins de héroes/);
    assert.match(ui.panelContent.innerHTML, /Próximamente/);
});
