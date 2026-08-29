import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildItemEffectPills, buildItemEquipDeltaRows, InventoryPanel } from '../src/ui/InventoryPanel.js';
import { buildTeamReadinessAlerts, TeamBuilderPanel } from '../src/ui/TeamBuilderPanel.js';
import { UIManager } from '../src/systems/UIManager.js';
import { analyzeTeam } from '../src/systems/TeamSynergySystem.js';

const data = {
    heroes: JSON.parse(fs.readFileSync(new URL('../data/heroes.json', import.meta.url), 'utf8')),
    items: JSON.parse(fs.readFileSync(new URL('../data/items.json', import.meta.url), 'utf8')),
    enemies: JSON.parse(fs.readFileSync(new URL('../data/enemies.json', import.meta.url), 'utf8'))
};

function createUiStub() {
    const state = {
        unlockedHeroIds: ['iron_man', 'spiderman'],
        ownedItemIds: ['lentes_edith'],
        equippedItems: { iron_man: { weapon: 'reactor_arc' } },
        codexDiscovered: { enemies: [] },
        mapTeamLoadouts: { level_1: ['iron_man'] },
        favoriteHeroIds: ['spiderman']
    };
    return {
        inventoryPanel: { pendingEquipItemId: 'reactor_arc' },
        game: {
            heroDatabase: data.heroes,
            itemDatabase: data.items,
            enemyDatabase: data.enemies,
            evolutionVisualDatabase: {},
            activeTeam: [],
            currentLevel: { id: 'level_1', name: 'Base de los Vengadores' },
            teamSynergy: { getSnapshot: () => analyzeTeam([]) },
            progression: {
                state,
                getHeroEvolution: () => null,
                getOwnedQuantity: (itemId) => state.ownedItemIds.filter((id) => id === itemId).length,
                getMapTeamLoadout: () => ({ levelId: 'level_1', teamIds: ['iron_man'], heroes: [data.heroes.iron_man], count: 1, label: 'Iron Man' }),
                saveMapTeamLoadout: () => ({ ok: true, count: 2 }),
                applyMapTeamLoadout: () => ({ ok: true, count: 1 }),
                isHeroFavorite: (heroId) => state.favoriteHeroIds.includes(heroId),
                toggleHeroFavorite: (heroId) => {
                    const favorite = !state.favoriteHeroIds.includes(heroId);
                    state.favoriteHeroIds = favorite
                        ? [...state.favoriteHeroIds, heroId]
                        : state.favoriteHeroIds.filter((id) => id !== heroId);
                    return { ok: true, favorite };
                }
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
    assert.match(html, /aria-label="Elegir REACTOR ARC para equipar\. Rareza Rare\. 0 copias libres\. Equipado por Iron Man"/);
    assert.match(html, /aria-label="Elegir heroe para REACTOR ARC" title="Elegir heroe para REACTOR ARC" data-tooltip="Elegir heroe para REACTOR ARC"/);
    assert.match(html, /Equipado por Iron Man/);
    assert.match(html, /item-effect-pills/);
    assert.match(html, /Cadencia[\s\S]*\+18%/);

    const equippedHtml = panel.renderEquippedItem(reactorEntry.item, 'weapon');
    assert.match(equippedHtml, /class="icon-command unequip-item" type="button" data-slot="weapon" aria-label="Desequipar REACTOR ARC"/);
    assert.match(equippedHtml, /title="Desequipar" data-tooltip="Desequipar"/);
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
    ui.panelContent = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
    const panel = new InventoryPanel(ui);

    panel.statusFilter = 'equipped';
    panel.render();
    assert.match(ui.panelContent.innerHTML, /inventory-rarity-strip[\s\S]*rarity-common[\s\S]*x1[\s\S]*rarity-rare[\s\S]*x1/);
    assert.match(ui.panelContent.innerHTML, /type="button" data-status="equipped" aria-pressed="true"/);
    assert.match(ui.panelContent.innerHTML, /aria-label="Filtrar objetos: Equipados" title="Filtrar objetos: Equipados" data-tooltip="Filtrar objetos: Equipados"/);
    assert.match(ui.panelContent.innerHTML, /data-item-id="reactor_arc"/);
    assert.doesNotMatch(ui.panelContent.innerHTML, /data-item-id="lentes_edith"/);

    panel.statusFilter = 'free';
    panel.render();
    assert.match(ui.panelContent.innerHTML, /type="button" data-status="free" aria-pressed="true"/);
    assert.match(ui.panelContent.innerHTML, /tier-filter active" type="button" data-tier="0" aria-pressed="true"/);
    assert.match(ui.panelContent.innerHTML, /slot-filter active" type="button" data-slot="all" aria-pressed="true"/);
    assert.match(ui.panelContent.innerHTML, /data-item-id="lentes_edith"/);
    assert.doesNotMatch(ui.panelContent.innerHTML, /data-item-id="reactor_arc"/);
});

test('inventario filtra objetos por rareza desde la vista compacta', () => {
    const ui = createUiStub();
    ui.panelContent = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
    const panel = new InventoryPanel(ui);

    panel.rarityFilter = 'Rare';
    panel.render();
    assert.match(ui.panelContent.innerHTML, /class="rarity-filter inventory-rarity-filter rarity-rare active" type="button" data-rarity="Rare" aria-pressed="true"/);
    assert.match(ui.panelContent.innerHTML, /data-item-id="reactor_arc"/);
    assert.doesNotMatch(ui.panelContent.innerHTML, /data-item-id="lentes_edith"/);
    assert.match(ui.panelContent.innerHTML, /inventory-filter-count">1\/2/);

    panel.rarityFilter = 'Common';
    panel.render();
    assert.match(ui.panelContent.innerHTML, /class="rarity-filter inventory-rarity-filter rarity-common active" type="button" data-rarity="Common" aria-pressed="true"/);
    assert.match(ui.panelContent.innerHTML, /data-item-id="lentes_edith"/);
    assert.doesNotMatch(ui.panelContent.innerHTML, /data-item-id="reactor_arc"/);
});
test('inventario permite limpiar filtros de objeto en un click', () => {
    const ui = createUiStub();
    ui.panelContent = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
    const panel = new InventoryPanel(ui);

    assert.equal(panel.hasActiveInventoryFilters(), false);
    panel.render();
    assert.match(ui.panelContent.innerHTML, /inventory-clear-filters[\s\S]*disabled/);
    assert.match(ui.panelContent.innerHTML, /inventory-clear-filters[\s\S]*data-tooltip="Limpiar filtros"/);

    panel.statusFilter = 'equipped';
    panel.tierFilter = 2;
    panel.slotFilter = 'artifact';
    panel.rarityFilter = 'Rare';

    assert.equal(panel.hasActiveInventoryFilters(), true);
    panel.render();
    assert.doesNotMatch(ui.panelContent.innerHTML, /inventory-clear-filters[\s\S]*disabled/);

    panel.resetInventoryFilters();

    assert.equal(panel.statusFilter, 'all');
    assert.equal(panel.tierFilter, 0);
    assert.equal(panel.slotFilter, 'all');
    assert.equal(panel.rarityFilter, 'all');
    assert.equal(panel.hasActiveInventoryFilters(), false);
});

test('coleccion muestra el objeto equipado y permite elegir heroe destino', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);
    const pendingBannerHtml = panel.renderPendingItemBanner(data.items.reactor_arc);
    assert.match(pendingBannerHtml, /id="cancel-pending-item" class="btn-primary ghost" type="button" aria-label="Cancelar equipamiento" title="Cancelar equipamiento" data-tooltip="Cancelar equipamiento"/);
    assert.match(pendingBannerHtml, /id="back-to-inventory" class="btn-primary ghost" type="button" aria-label="Volver al inventario" title="Volver al inventario" data-tooltip="Volver al inventario"/);

    const ironManHtml = panel.renderHeroCard(data.heroes.iron_man, true);
    assert.match(ironManHtml, /role="listitem" aria-label="Iron Man\. Rareza [^\.]+\. desbloqueado\."/);
    assert.match(ironManHtml, /hero-item-corner/);
    assert.match(ironManHtml, /type="button" data-id="iron_man" aria-label="REACTOR ARC ya esta equipado en Iron Man" title="REACTOR ARC ya esta equipado en Iron Man" data-tooltip="REACTOR ARC ya esta equipado en Iron Man" aria-disabled="true" disabled/);
    assert.match(ironManHtml, /Ya equipado/);

    const spiderManHtml = panel.renderHeroCard(data.heroes.spiderman, true);
    assert.match(spiderManHtml, /btn-assign-item/);
    assert.match(spiderManHtml, /type="button" data-id="spiderman" aria-label="Equipar Spider-Man con REACTOR ARC" title="Equipar Spider-Man con REACTOR ARC" data-tooltip="Equipar Spider-Man con REACTOR ARC" aria-disabled="false"/);
    assert.match(spiderManHtml, /Equipar/);
});


test('coleccion anuncia estado y accion principal al armar equipo', () => {
    const ui = createUiStub();
    ui.inventoryPanel.pendingEquipItemId = null;
    ui.game.activeTeam = [data.heroes.spiderman];
    const panel = new TeamBuilderPanel(ui);

    const activeHtml = panel.renderHeroCard(data.heroes.spiderman, true);
    assert.match(activeHtml, /role="listitem" aria-label="Spider-Man\. Rareza [^\.]+\. en equipo activo\."/);
    assert.match(activeHtml, /class="btn-equip btn-primary danger" type="button" data-id="spiderman" aria-label="Quitar Spider-Man del equipo" title="Quitar Spider-Man del equipo" data-tooltip="Quitar Spider-Man del equipo" aria-pressed="true" aria-disabled="false"/);
    assert.match(activeHtml, /class="btn-favorite-hero icon-command active" type="button" data-id="spiderman"/);
    assert.match(activeHtml, /aria-label="Quitar Spider-Man de favoritos"/);
    assert.match(activeHtml, /data-tooltip="Ver ficha"/);

    const lockedHtml = panel.renderHeroCard(data.heroes.thor, false);
    assert.match(lockedHtml, /role="listitem" aria-label="Thor\. Rareza [^\.]+\. bloqueado\."/);
    assert.match(lockedHtml, /aria-label="Thor bloqueado, pendiente de reclutar" title="Thor bloqueado, pendiente de reclutar" data-tooltip="Thor bloqueado, pendiente de reclutar" aria-pressed="false" aria-disabled="true" disabled/);
});
test('coleccion muestra preset de equipo por mapa', () => {
    const ui = createUiStub();
    ui.inventoryPanel.pendingEquipItemId = null;
    ui.game.activeTeam = [data.heroes.iron_man, data.heroes.spiderman];
    const panel = new TeamBuilderPanel(ui);
    const html = panel.renderMapTeamLoadoutControls();

    assert.match(html, /map-team-loadout/);
    assert.match(html, /Base de los Vengadores/);
    assert.match(html, /Iron Man/);
    assert.match(html, /id="save-map-team-loadout"/);
    assert.match(html, /id="apply-map-team-loadout"/);
    assert.match(html, /Guardar equipo actual/);
    assert.match(html, /Aplicar equipo guardado/);
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
    assert.match(html, /aria-label="Elegir LENTES E\.D\.I\.T\.H\. para equipar\. Rareza Common\. 1 copia libre\. Sin equipar" title="Elegir LENTES E\.D\.I\.T\.H\. para equipar\. Rareza Common\. 1 copia libre\. Sin equipar" data-tooltip="Elegir LENTES E\.D\.I\.T\.H\. para equipar\. Rareza Common\. 1 copia libre\. Sin equipar"/);
    assert.match(html, /Alcance \+4%/);
    assert.match(html, /Cadencia -18%/);
});

test('coleccion expone diccionario de evoluciones completo', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);

    assert.match(panel.renderCollectionTabs(), /data-view="evolutions"/);
    assert.match(panel.renderCollectionTabs(), /role="tab"/);
    assert.match(panel.renderCollectionTabs(), /aria-controls="collection-panel-heroes"/);
    assert.match(panel.renderCollectionTabs(), /aria-label="Heroes" title="Heroes" data-tooltip="Heroes"/);
    assert.match(panel.renderCollectionTabs(), /tabindex="0"/);
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

test('coleccion conecta tabs con panel activo', () => {
    const ui = createUiStub();
    ui.inventoryPanel.pendingEquipItemId = null;
    ui.panelContent = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
    const panel = new TeamBuilderPanel(ui);

    panel.viewMode = 'heroes';
    panel.render('Constructor de equipo');
    assert.match(ui.panelContent.innerHTML, /id="collection-tab-heroes"[\s\S]*aria-controls="collection-panel-heroes"/);
    assert.match(ui.panelContent.innerHTML, /id="collection-panel-heroes" class="collection-tab-panel" role="tabpanel" aria-labelledby="collection-tab-heroes"/);
    assert.match(ui.panelContent.innerHTML, /class="team-builder-summary"/);

    panel.viewMode = 'villains';
    panel.render('Constructor de equipo');
    assert.match(ui.panelContent.innerHTML, /id="collection-panel-villains" class="collection-tab-panel" role="tabpanel" aria-labelledby="collection-tab-villains"/);

    panel.viewMode = 'evolutions';
    panel.render('Constructor de equipo');
    assert.match(ui.panelContent.innerHTML, /id="collection-panel-evolutions" class="collection-tab-panel" role="tabpanel" aria-labelledby="collection-tab-evolutions"/);
});
test('coleccion navega tabs con teclado', () => {
    const calls = [];
    const makeTab = (view) => ({
        dataset: { view },
        listeners: {},
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        },
        focus() {
            calls.push(`focus:${view}`);
        }
    });
    const tabs = [makeTab('heroes'), makeTab('villains'), makeTab('evolutions')];
    const panel = Object.create(TeamBuilderPanel.prototype);
    panel.viewMode = 'heroes';
    panel.render = (title) => calls.push(`render:${title}:${panel.viewMode}`);
    panel.ui = {
        game: {},
        panelContent: {
            querySelectorAll(selector) {
                return selector === '.collection-view-tab' ? tabs : [];
            },
            querySelector(selector) {
                const match = selector.match(/data-view="([^\"]+)"/);
                return tabs.find((tab) => tab.dataset.view === match?.[1]) || null;
            }
        }
    };

    panel.bindListeners();
    let prevented = 0;
    tabs[0].listeners.keydown({ key: 'ArrowRight', preventDefault: () => { prevented += 1; } });
    tabs[1].listeners.keydown({ key: 'End', preventDefault: () => { prevented += 1; } });

    assert.equal(prevented, 2);
    assert.equal(panel.viewMode, 'evolutions');
    assert.ok(calls.includes('render:Constructor de equipo:villains'));
    assert.ok(calls.includes('focus:villains'));
    assert.ok(calls.includes('render:Constructor de equipo:evolutions'));
    assert.ok(calls.includes('focus:evolutions'));
});
test('coleccion filtra heroes obtenidos, faltantes y favoritos', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);
    const heroes = [data.heroes.iron_man, data.heroes.spiderman, data.heroes.thor];
    const unlockedIds = new Set(ui.game.progression.state.unlockedHeroIds);

    panel.ownershipFilter = 'owned';
    assert.deepEqual(panel.getFilteredHeroes(heroes, unlockedIds).map((hero) => hero.id), ['iron_man', 'spiderman']);

    panel.ownershipFilter = 'missing';
    assert.deepEqual(panel.getFilteredHeroes(heroes, unlockedIds).map((hero) => hero.id), ['thor']);

    panel.ownershipFilter = 'favorites';
    assert.deepEqual(panel.getFilteredHeroes(heroes, unlockedIds).map((hero) => hero.id), ['spiderman']);

    const filtersHtml = panel.renderCollectionFilters(2, 3);
    assert.match(filtersHtml, /collection-ownership-select/);
    assert.match(filtersHtml, /aria-label="Buscar heroe, rol o grupo"/);
    assert.match(filtersHtml, /aria-label="Ordenar coleccion"/);
    assert.match(filtersHtml, /aria-label="Filtrar heroes por estado de obtencion"/);
    assert.match(filtersHtml, /<option value="favorites" selected>Favoritos<\/option>/);
    assert.match(filtersHtml, /aria-label="Filtrar heroes por respuesta tactica"/);
    assert.match(filtersHtml, /class="rarity-filter\s+active" type="button" data-rarity="all" aria-pressed="true" aria-label="Filtrar rareza Todas"/);
    assert.match(filtersHtml, /title="Filtrar rareza Todas" data-tooltip="Filtrar rareza Todas"/);
});

test('coleccion filtra heroes por terreno y respuesta tactica', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);
    const heroes = [
        data.heroes.iron_man,
        data.heroes.black_widow,
        data.heroes.capitan_america,
        data.heroes.invisible_woman,
        data.heroes.war_machine,
        data.heroes.domino
    ];
    const unlockedIds = new Set(heroes.map((hero) => hero.id));
    const ids = () => panel.getFilteredHeroes(heroes, unlockedIds).map((hero) => hero.id).sort();

    panel.tacticalFilter = 'water';
    assert.deepEqual(ids(), ['invisible_woman', 'iron_man']);

    panel.tacticalFilter = 'mountain';
    assert.deepEqual(ids(), ['domino', 'invisible_woman', 'iron_man', 'war_machine']);

    panel.tacticalFilter = 'antiarmor';
    assert.deepEqual(ids(), ['black_widow', 'iron_man', 'war_machine']);

    panel.tacticalFilter = 'aura';
    assert.deepEqual(ids(), ['capitan_america', 'invisible_woman']);

    panel.tacticalFilter = 'economy';
    assert.deepEqual(ids(), ['domino']);

    panel.tacticalFilter = 'detection';
    assert.ok(ids().includes('black_widow'));
    assert.match(panel.renderCollectionFilters(3, 6), /collection-tactical-select/);
    assert.match(panel.renderCollectionFilters(3, 6), /aria-label="Filtrar heroes por respuesta tactica"/);
    assert.match(panel.renderCollectionFilters(3, 6), /<option value="detection" selected>Detección<\/option>/);
    assert.deepEqual(panel.getActiveFilterLabels(), ['Tactica: Detección']);

    panel.resetHeroFilters();
    assert.equal(panel.tacticalFilter, 'all');
});

test('coleccion filtra counters avanzados y busqueda sin acentos', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);
    const heroes = [
        data.heroes.black_widow,
        data.heroes.ghost_rider,
        data.heroes.scarlet_witch,
        data.heroes.elektra,
        data.heroes.gamora,
        data.heroes.capitan_america
    ];
    const unlockedIds = new Set(heroes.map((hero) => hero.id));
    const ids = () => panel.getFilteredHeroes(heroes, unlockedIds).map((hero) => hero.id).sort();

    panel.tacticalFilter = 'dot';
    assert.deepEqual(ids(), ['black_widow', 'elektra', 'ghost_rider', 'scarlet_witch']);

    panel.tacticalFilter = 'boss';
    assert.deepEqual(ids(), ['black_widow', 'gamora', 'ghost_rider']);

    panel.tacticalFilter = 'crit';
    assert.deepEqual(ids(), ['elektra']);

    panel.tacticalFilter = 'all';
    panel.searchQuery = 'capitan';
    assert.deepEqual(ids(), ['capitan_america']);
    assert.match(panel.renderCollectionFilters(1, 6), /<option value="dot"[^>]*>Persistente<\/option>/);
    assert.match(panel.renderCollectionFilters(1, 6), /<option value="boss"[^>]*>Jefes<\/option>/);
    assert.match(panel.renderCollectionFilters(1, 6), /<option value="crit"[^>]*>Crítico<\/option>/);
});

test('coleccion permite limpiar todos los filtros de heroes', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);

    assert.equal(panel.hasActiveHeroFilters(), false);
    assert.match(panel.renderCollectionFilters(3, 3), /collection-clear-filters[\s\S]*disabled/);
    assert.match(panel.renderCollectionFilters(3, 3), /collection-clear-filters[\s\S]*data-tooltip="Limpiar filtros"/);

    panel.searchQuery = 'iron';
    panel.rarityFilter = 'rare';
    panel.ownershipFilter = 'owned';
    panel.sortMode = 'rarity-desc';

    assert.equal(panel.hasActiveHeroFilters(), true);
    assert.doesNotMatch(panel.renderCollectionFilters(1, 3), /collection-clear-filters[\s\S]*disabled/);

    panel.resetHeroFilters();

    assert.equal(panel.searchQuery, '');
    assert.equal(panel.rarityFilter, 'all');
    assert.equal(panel.ownershipFilter, 'all');
    assert.equal(panel.tacticalFilter, 'all');
    assert.equal(panel.sortMode, 'az');
    assert.equal(panel.hasActiveHeroFilters(), false);
});

test('coleccion muestra alertas compactas de composicion tactica', () => {
    const alerts = buildTeamReadinessAlerts(
        analyzeTeam([data.heroes.spiderman, data.heroes.hulk, data.heroes.groot]),
        [data.heroes.spiderman, data.heroes.hulk, data.heroes.groot]
    );

    assert.ok(alerts.some((alert) => alert.id === 'slots'));
    assert.ok(alerts.some((alert) => alert.id === 'antiarmor'));
    assert.ok(alerts.every((alert) => ['danger', 'warning', 'info', 'good'].includes(alert.tone)));

    const ui = createUiStub();
    ui.game.activeTeam = [data.heroes.spiderman, data.heroes.hulk, data.heroes.groot];
    const panel = new TeamBuilderPanel(ui);
    const html = panel.renderTeamReadinessAlerts(analyzeTeam(ui.game.activeTeam), ui.game.activeTeam);

    assert.match(html, /team-readiness-strip/);
    assert.match(html, /Lectura tactica del equipo/);
    assert.match(html, /team-readiness-chip/);
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

test('coleccion recomienda el siguiente heroe para completar agrupacion', () => {
    const ui = createUiStub();
    ui.inventoryPanel.pendingEquipItemId = null;
    ui.game.activeTeam = [data.heroes.iron_man];
    const panel = new TeamBuilderPanel(ui);
    const readyHeroes = [data.heroes.iron_man, data.heroes.capitan_america, data.heroes.thor];
    const unlockedIds = new Set(['iron_man', 'capitan_america', 'thor']);
    const html = panel.renderCollectionCommandHeader({
        readyHeroes,
        filteredHeroes: readyHeroes,
        unlockedIds,
        snapshot: analyzeTeam(ui.game.activeTeam)
    });

    assert.match(html, /collection-synergy-recommendation/);
    assert.match(html, /Capitán América|Capitan America/);
    assert.match(html, /Ciencia y escudo/);
    assert.match(html, /class="btn-primary ghost synergy-recommendation-action btn-equip"/);
    assert.match(html, /Añadir/);
});

test('agrupaciones minimizadas muestran resumen compacto de bonus cercanos', () => {
    const ui = createUiStub();
    const panel = new TeamBuilderPanel(ui);
    const team = [data.heroes.iron_man, data.heroes.capitan_america, data.heroes.thor];
    const html = panel.renderSynergyMenu(
        analyzeTeam(team),
        team,
        new Set(team.map((hero) => hero.id))
    );

    assert.match(html, /allegiance-menu collapsed/);
    assert.match(html, /allegiance-quick-summary/);
    assert.match(html, /Avengers/);
    assert.match(html, /activo/);
    assert.match(html, /allegiance-grid" hidden/);
});

test('tienda de skins queda como panel independiente vacio', () => {
    const ui = Object.create(UIManager.prototype);
    ui.panelContent = { innerHTML: '' };

    ui.renderSkinShop('Skins');

    assert.match(ui.panelContent.innerHTML, /skins-shop-panel/);
    assert.match(ui.panelContent.innerHTML, /Skins de héroes/);
    assert.match(ui.panelContent.innerHTML, /Próximamente/);
});