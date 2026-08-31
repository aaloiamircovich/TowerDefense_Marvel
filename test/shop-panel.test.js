import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHeroBoxOdds, buildItemSignatureHint, buildShopAffordabilityState, ShopPanel } from '../src/ui/ShopPanel.js';

test('buildShopAffordabilityState normaliza progreso de compra', () => {
    assert.deepEqual(buildShopAffordabilityState(100, 500), {
        canAfford: false,
        progress: 20,
        missing: 400,
        current: 100,
        max: 500,
        label: '$400 faltan'
    });

    assert.deepEqual(buildShopAffordabilityState(650, 500), {
        canAfford: true,
        progress: 100,
        missing: 0,
        current: 500,
        max: 500,
        label: 'Listo para comprar'
    });

    assert.deepEqual(buildShopAffordabilityState(0, 500, true), {
        canAfford: true,
        progress: 100,
        missing: 0,
        current: 500,
        max: 500,
        label: 'Creditos ilimitados'
    });
});

test('buildItemSignatureHint cruza firmas de combate y evolucion', () => {
    assert.deepEqual(buildItemSignatureHint({ id: 'baliza_fury' }), null);

    const hint = buildItemSignatureHint({ id: 'carga_viuda' }, {
        black_widow: { id: 'black_widow', name: 'Black Widow' },
        yelena_belova: { id: 'yelena_belova', name: 'Yelena Belova' }
    });

    assert.deepEqual(hint.heroIds, ['black_widow', 'yelena_belova']);
    assert.equal(hint.detail, 'Black Widow, Yelena Belova');
    assert.equal(hint.fullDetail, 'Black Widow, Yelena Belova');
});

test('buildHeroBoxOdds calcula probabilidades segun heroes pendientes', () => {
    const pool = [
        { id: 'spiderman', rarity: 'Common' },
        { id: 'iron_man', rarity: 'Rare' },
        { id: 'scarlet_witch', rarity: 'Secret' }
    ];
    const normal = buildHeroBoxOdds(pool, 1);
    const guaranteed = buildHeroBoxOdds(pool, 4);

    assert.equal(normal.guaranteedActive, false);
    assert.deepEqual(normal.entries.map((entry) => [entry.rarity, entry.count, entry.label]), [
        ['Common', 1, '61%'],
        ['Rare', 1, '38%'],
        ['Secret', 1, '1.3%']
    ]);
    assert.equal(guaranteed.guaranteedActive, true);
    assert.deepEqual(guaranteed.entries.map((entry) => [entry.rarity, entry.count, entry.label]), [
        ['Rare', 1, '97%'],
        ['Secret', 1, '3.2%']
    ]);
});

test('ShopPanel muestra garantia de caja con pips compactos', () => {
    const panel = new ShopPanel(createShopUi(createPanelContentStub({}), []));
    const html = panel.renderPityTrack(3, false);
    const readyHtml = panel.renderPityTrack(9, true);

    assert.match(html, /pity-track compact/);
    assert.match(html, /Garantía de rareza 3 de 4/);
    assert.match(html, /3\/4/);
    assert.equal((html.match(/class="filled"/g) || []).length, 3);
    assert.match(readyHtml, /pity-track compact ready/);
    assert.match(readyHtml, /Garantía de rareza 4 de 4/);
    assert.equal((readyHtml.match(/class="filled"/g) || []).length, 4);
});

test('ShopPanel destaca objetos signature antes de compra', () => {
    const panelContent = createPanelContentStub({ '.btn-buy-item': [] });
    const calls = [];
    const ui = createShopUi(panelContent, calls);
    const signatureItem = {
        id: 'carga_viuda',
        name: 'CARGA WIDOW',
        rarity: 'Common',
        slot: 'weapon',
        set: 'street',
        desc: '12% de aturdir brevemente y +4% cadencia.',
        price: 820,
        tier: 1,
        effects: { stunChance: 0.12, stunDuration: 0.18, fireRatePct: 0.04 },
        icon: 'widow.png'
    };
    ui.game.heroDatabase = {
        black_widow: { id: 'black_widow', name: 'Black Widow', rarity: 'Rare', visual: { idle: 'black_widow.png' } },
        yelena_belova: { id: 'yelena_belova', name: 'Yelena Belova', rarity: 'Common', visual: { idle: 'yelena.png' } }
    };
    ui.game.itemDatabase = { carga_viuda: signatureItem };
    ui.game.shopSystem.getRotation = () => [{ item: signatureItem, purchased: false }];
    ui.game.shopSystem.getProgressiveQueue = () => [signatureItem];
    ui.game.progression.getCredits = () => 1200;

    const panel = new ShopPanel(ui);
    panel.render('Tienda');

    assert.match(panelContent.innerHTML, /shop-signature-hint/);
    assert.match(panelContent.innerHTML, /Objeto firma para Black Widow, Yelena Belova/);
    assert.match(panelContent.innerHTML, /fa-file-signature/);
    assert.match(panelContent.innerHTML, /<strong>Firma<\/strong>/);
    assert.match(panelContent.innerHTML, /Black Widow, Yelena Belova/);
});

test('ShopPanel renderiza tienda progresiva y delega compra de objetos', () => {
    const buyButton = createButtonStub({ id: 'lentes_edith' });
    const gachaButton = createButtonStub({});
    const panelContent = createPanelContentStub({
        '#gacha-btn': gachaButton,
        '.btn-buy-item': [buyButton]
    });
    const calls = [];
    const ui = createShopUi(panelContent, calls);
    const panel = new ShopPanel(ui, {
        buildShopItemInsight: () => ({ tone: 'good', label: 'Buena respuesta', reasons: ['Detecta sigilo'] }),
        buildShopSetProgress: () => ({ status: 'ready', ariaLabel: 'Listo', label: 'Set listo', detail: '1/1' })
    });

    panel.render('Tienda');

    assert.match(panelContent.innerHTML, /Tienda/);
    assert.match(panelContent.innerHTML, /shop-command-header/);
    assert.match(panelContent.innerHTML, /shop-economy-readout/);
    assert.match(panelContent.innerHTML, /\+\$60/);
    assert.match(panelContent.innerHTML, /shop-recruit-strip/);
    assert.match(panelContent.innerHTML, /shop-recruit-details/);
    assert.match(panelContent.innerHTML, /Garantía y odds/);
    assert.match(panelContent.innerHTML, /Costo \+12% por apertura/);
    assert.match(panelContent.innerHTML, /Garantía de rareza 0 de 4/);
    assert.match(panelContent.innerHTML, /pity-pips/);
    assert.match(panelContent.innerHTML, /shop-odds-strip/);
    assert.match(panelContent.innerHTML, /Probabilidades actuales/);
    assert.match(panelContent.innerHTML, /Rare[\s\S]*100%/);
    assert.match(panelContent.innerHTML, /shop-afford-meter ready/);
    assert.match(panelContent.innerHTML, /role="meter" aria-label="Progreso para caja: Listo para comprar" aria-valuemin="0" aria-valuemax="500" aria-valuenow="500"/);
    assert.match(panelContent.innerHTML, /shop-heading-meta/);
    assert.match(panelContent.innerHTML, /shop-next-preview rarity-common/);
    assert.match(panelContent.innerHTML, /Brazalete Web/);
    assert.match(panelContent.innerHTML, /shop-grid--compact/);
    assert.match(panelContent.innerHTML, /RECLUTAR POR \$500/);
    assert.match(panelContent.innerHTML, /id="gacha-btn" type="button" data-affordability="ready"/);
    assert.match(panelContent.innerHTML, /aria-label="Reclutar heroe aleatorio por 500 creditos" title="Reclutar heroe aleatorio por 500 creditos" data-tooltip="Reclutar heroe aleatorio por 500 creditos" aria-disabled="false"/);
    assert.match(panelContent.innerHTML, /shop-reveal-dock" role="status" aria-live="polite"/);
    assert.match(panelContent.innerHTML, /data-affordability="ready"/);
    assert.match(panelContent.innerHTML, /Lentes E.D.I.T.H./);
    assert.match(panelContent.innerHTML, /shop-card-details/);
    assert.match(panelContent.innerHTML, />Detalles</);
    assert.match(panelContent.innerHTML, /shop-effect-pills/);
    assert.match(panelContent.innerHTML, /Detecta sigilo[\s\S]*activo/);
    assert.match(panelContent.innerHTML, /Buena respuesta/);
    assert.match(panelContent.innerHTML, /class="btn-buy-item btn-primary ghost" type="button" data-id="lentes_edith"/);
    assert.match(panelContent.innerHTML, /aria-label="Comprar Lentes E\.D\.I\.T\.H\. por 500 creditos" title="Comprar Lentes E\.D\.I\.T\.H\. por 500 creditos" data-tooltip="Comprar Lentes E\.D\.I\.T\.H\. por 500 creditos" aria-disabled="false"/);

    buyButton.listeners.click();

    assert.ok(calls.includes('purchase:lentes_edith'));
    assert.ok(calls.includes('toast:success:Lentes E.D.I.T.H. comprado'));
});

test('ShopPanel muestra creditos faltantes sin esperar al error de compra', () => {
    const panelContent = createPanelContentStub({
        '.btn-buy-item': []
    });
    const calls = [];
    const ui = createShopUi(panelContent, calls);
    ui.game.progression.getCredits = () => 100;

    const panel = new ShopPanel(ui);
    panel.render('Tienda');

    assert.match(panelContent.innerHTML, /FALTAN \$400/);
    assert.match(panelContent.innerHTML, /aria-label="No alcanza para reclutar\. Faltan 400 creditos" title="No alcanza para reclutar\. Faltan 400 creditos" data-tooltip="No alcanza para reclutar\. Faltan 400 creditos" aria-disabled="true" disabled/);
    assert.match(panelContent.innerHTML, /Faltan \$400/);
    assert.match(panelContent.innerHTML, /data-affordability="locked"/);
    assert.match(panelContent.innerHTML, /shop-afford-meter locked/);
    assert.match(panelContent.innerHTML, /role="meter" aria-label="Progreso para caja: \$400 faltan" aria-valuemin="0" aria-valuemax="500" aria-valuenow="100"/);
    assert.match(panelContent.innerHTML, /BLOQUEADO/);
    assert.match(panelContent.innerHTML, /aria-label="No alcanza para comprar Lentes E\.D\.I\.T\.H\.\. Faltan 400 creditos" title="No alcanza para comprar Lentes E\.D\.I\.T\.H\.\. Faltan 400 creditos" data-tooltip="No alcanza para comprar Lentes E\.D\.I\.T\.H\.\. Faltan 400 creditos" aria-disabled="true" disabled/);
});

test('ShopPanel recluta heroe, actualiza costo y permite tienda de skins vacia', () => {
    const gachaButton = createButtonStub({});
    const resultNode = createNodeStub();
    const fundsLabel = createNodeStub();
    const pityTrack = createNodeStub();
    const creditsReadout = createNodeStub();
    const boxReadout = createNodeStub();
    const pityReadout = createNodeStub();
    const panelContent = createPanelContentStub({
        '#gacha-btn': gachaButton,
        '#gacha-res': resultNode,
        '.panel-title-row strong': fundsLabel,
        '.pity-track': pityTrack,
        '[data-shop-readout="credits"]': creditsReadout,
        '[data-shop-readout="box-cost"]': boxReadout,
        '[data-shop-readout="pity"]': pityReadout,
        '.btn-buy-item': []
    });
    const calls = [];
    const ui = createShopUi(panelContent, calls);
    ui.game.progression.state.shop.heroPity = 1;
    ui.game.progression.state.shop.heroBoxCost = 560;
    ui.game.progression.getCredits = () => 1200;
    ui.game.progression.state.unlockedHeroIds = ['spiderman'];
    ui.game.shopSystem.recruitHero = () => ({
        ok: true,
        hero: { id: 'spiderman', name: 'Spider-Man', rarity: 'Common', visual: { idle: 'spiderman.png' } },
        guaranteed: false
    });
    ui.game.heroDatabase = {
        spiderman: { id: 'spiderman', name: 'Spider-Man', rarity: 'Common', visual: { idle: 'spiderman.png' } }
    };

    const panel = new ShopPanel(ui);
    panel.startGachaRevealAnimation = (_result, onComplete) => onComplete();

    panel.render('Tienda');
    gachaButton.listeners.click();

    assert.match(resultNode.innerHTML, /gacha-reveal/);
    assert.match(resultNode.innerHTML, /Spider-Man/);
    assert.match(resultNode.innerHTML, /aria-label="Saltear animacion de reclutamiento" title="Saltear animacion de reclutamiento" data-tooltip="Saltear animacion de reclutamiento"/);
    assert.equal(fundsLabel.textContent, '$1200 creditos');
    assert.equal(creditsReadout.textContent, '$1200');
    assert.equal(boxReadout.textContent, 'Completa');
    assert.equal(pityReadout.textContent, '1/4');
    assert.match(pityTrack.innerHTML, /Garantía/);
    assert.match(pityTrack.innerHTML, /1\/4/);
    assert.match(pityTrack.innerHTML, /pity-pips/);
    assert.equal((pityTrack.innerHTML.match(/class="filled"/g) || []).length, 1);
    assert.equal(gachaButton.disabled, true);
    assert.equal(gachaButton.textContent, 'PLANTILLA COMPLETA');
    assert.equal(gachaButton.dataset.affordability, 'locked');
    assert.equal(gachaButton.attributes['aria-label'], 'Plantilla completa');
    assert.equal(gachaButton.attributes.title, 'Plantilla completa');
    assert.equal(gachaButton.attributes['data-tooltip'], 'Plantilla completa');
    assert.ok(calls.includes('roster:0'));

    panel.renderSkinShop('Skins');
    assert.match(panelContent.innerHTML, /skins-shop-panel/);
    assert.match(panelContent.innerHTML, /Próximamente/);
});

test('ShopPanel limpia timers pendientes de apertura al cerrar tienda', () => {
    const panel = new ShopPanel(createShopUi(createPanelContentStub({}), []));
    const cleared = [];
    panel.getTimerHost = () => ({ clearTimeout: (timer) => cleared.push(timer) });
    panel.gachaRevealTimers = [11, 22, 33];

    panel.clearGachaRevealTimers();

    assert.deepEqual(cleared, [11, 22, 33]);
    assert.deepEqual(panel.gachaRevealTimers, []);
});
function createShopUi(panelContent, calls) {
    const item = {
        id: 'lentes_edith',
        name: 'Lentes E.D.I.T.H.',
        rarity: 'Rare',
        slot: 'tech',
        set: 'stark',
        desc: 'Detecta amenazas ocultas.',
        price: 500,
        tier: 1,
        effects: { detectStealth: true },
        icon: 'edith.png'
    };
    const nextItem = {
        id: 'brazalete_web',
        name: 'Brazalete Web',
        rarity: 'Common',
        slot: 'tech',
        set: 'spider',
        desc: 'Aumenta el control de ruta.',
        price: 620,
        tier: 1,
        effects: { rangePct: 0.04 },
        icon: 'web.png'
    };
    return {
        panelContent,
        nextWaveSummary: null,
        game: {
            activeTeam: [],
            heroDatabase: {
                iron_man: { id: 'iron_man', name: 'Iron Man', rarity: 'Rare', visual: { idle: 'iron_man.png' } }
            },
            itemDatabase: { lentes_edith: item },
            inputManager: {
                setPlacementMode(hero) {
                    calls.push(`place:${hero.id}`);
                }
            },
            waveManager: {
                isWaveActive: false,
                buildPreparedSummary: () => ({ stealthCount: 1, roles: ['stealth'] })
            },
            shopSystem: {
                getRotation: () => [{ item, purchased: false }],
                getProgressiveQueue: () => [item, nextItem],
                purchaseItem(id) {
                    calls.push(`purchase:${id}`);
                    return { ok: true, item };
                },
                recruitHero: () => ({ ok: false, reason: 'Sin cupos' })
            },
            progression: {
                state: {
                    settings: { adminMode: false },
                    shop: { heroPity: 0, heroBoxCost: 500 },
                    ownedItemIds: ['lentes_edith'],
                    equippedItems: {},
                    unlockedHeroIds: []
                },
                getCredits: () => 650,
                getOwnedQuantity: (id) => (id === 'lentes_edith' ? 1 : 0)
            }
        },
        renderSprite(source, name) {
            return `<img src="${source}" alt="${name}">`;
        },
        getHeroDisplaySprite(hero) {
            return hero.visual?.idle || `${hero.id}.png`;
        },
        showToast(message, type) {
            calls.push(`toast:${type}:${message}`);
        },
        renderHeroRoster(team) {
            calls.push(`roster:${team.length}`);
        }
    };
}

function createPanelContentStub(elementsBySelector) {
    return {
        innerHTML: '',
        querySelector(selector) {
            return elementsBySelector[selector] || null;
        },
        querySelectorAll(selector) {
            const value = elementsBySelector[selector];
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        }
    };
}

function createButtonStub(dataset) {
    return {
        dataset,
        disabled: false,
        textContent: '',
        listeners: {},
        attributes: {},
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        },
        setAttribute(name, value) {
            this.attributes[name] = value;
        }
    };
}

function createNodeStub() {
    return {
        innerHTML: '',
        textContent: ''
    };
}

