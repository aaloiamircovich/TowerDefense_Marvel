import test from 'node:test';
import assert from 'node:assert/strict';
import { ShopPanel } from '../src/ui/ShopPanel.js';

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
    assert.match(panelContent.innerHTML, /shop-grid--compact/);
    assert.match(panelContent.innerHTML, /RECLUTAR POR \$500/);
    assert.match(panelContent.innerHTML, /id="gacha-btn" type="button" data-affordability="ready"/);
    assert.match(panelContent.innerHTML, /aria-label="Reclutar heroe aleatorio por 500 creditos" aria-disabled="false"/);
    assert.match(panelContent.innerHTML, /shop-reveal-dock" role="status" aria-live="polite"/);
    assert.match(panelContent.innerHTML, /data-affordability="ready"/);
    assert.match(panelContent.innerHTML, /Lentes E.D.I.T.H./);
    assert.match(panelContent.innerHTML, /shop-effect-pills/);
    assert.match(panelContent.innerHTML, /Detecta sigilo[\s\S]*activo/);
    assert.match(panelContent.innerHTML, /Buena respuesta/);
    assert.match(panelContent.innerHTML, /class="btn-buy-item btn-primary ghost" type="button" data-id="lentes_edith"/);
    assert.match(panelContent.innerHTML, /aria-label="Comprar Lentes E\.D\.I\.T\.H\. por 500 creditos" aria-disabled="false"/);

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
    assert.match(panelContent.innerHTML, /aria-label="No alcanza para reclutar\. Faltan 400 creditos" aria-disabled="true" disabled/);
    assert.match(panelContent.innerHTML, /Faltan \$400/);
    assert.match(panelContent.innerHTML, /data-affordability="locked"/);
    assert.match(panelContent.innerHTML, /BLOQUEADO/);
    assert.match(panelContent.innerHTML, /aria-label="No alcanza para comprar Lentes E\.D\.I\.T\.H\.\. Faltan 400 creditos" aria-disabled="true" disabled/);
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
    assert.match(resultNode.innerHTML, /aria-label="Saltear animacion de reclutamiento"/);
    assert.equal(fundsLabel.textContent, '$1200 creditos');
    assert.equal(creditsReadout.textContent, '$1200');
    assert.equal(boxReadout.textContent, 'Completa');
    assert.equal(pityReadout.textContent, '1/4');
    assert.match(pityTrack.innerHTML, /Garantía/);
    assert.match(pityTrack.innerHTML, /1\/4/);
    assert.equal(gachaButton.disabled, true);
    assert.equal(gachaButton.textContent, 'PLANTILLA COMPLETA');
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
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        }
    };
}

function createNodeStub() {
    return {
        innerHTML: '',
        textContent: ''
    };
}
