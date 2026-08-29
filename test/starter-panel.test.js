import test from 'node:test';
import assert from 'node:assert/strict';
import { StarterPanel } from '../src/ui/StarterPanel.js';

test('StarterPanel renderiza cartas tacticas y selecciona heroe inicial', () => {
    const previousDocument = globalThis.document;
    const cards = [
        createCardStub('black_widow'),
        createCardStub('hawkeye')
    ];
    const closeButton = createCloseButtonStub();
    globalThis.document = {
        getElementById(id) {
            return id === 'close-panel-btn' ? closeButton : null;
        }
    };

    const calls = [];
    const panelContent = {
        innerHTML: '',
        querySelector(selector) {
            return selector === '.starter-card' ? cards[0] : null;
        },
        querySelectorAll(selector) {
            return selector === '.starter-card' ? cards : [];
        }
    };
    const ui = {
        panelContent,
        game: {
            pause() {
                calls.push('pause');
            }
        },
        showPanelOverlay(closable) {
            calls.push(`overlay:${closable}`);
        },
        closePanel() {
            calls.push('close');
        },
        renderSprite(source, name) {
            return `<img src="${source}" alt="${name}">`;
        },
        getHeroDisplaySprite(hero) {
            return hero.sprite;
        }
    };
    const starters = [
        {
            id: 'black_widow',
            name: 'Black Widow',
            category: 'Urbano',
            rarity: 'Common',
            sprite: 'black_widow.png',
            cost: 195,
            damage: 18,
            range: 130,
            fireRate: 1.8,
            allowedTerrains: [1],
            niche: 'saboteo de soporte',
            teamMetrics: { damage: 2, control: 3, support: 1, detection: 4 }
        },
        {
            id: 'hawkeye',
            name: 'Hawkeye',
            category: 'Táctico',
            rarity: 'Common',
            sprite: 'hawkeye.png',
            cost: 235,
            damage: 27,
            range: 220,
            fireRate: 1.1,
            allowedTerrains: [3],
            niche: 'municiones flexibles',
            teamMetrics: { damage: 3, control: 2, support: 1, detection: 2 }
        }
    ];
    let selected = null;

    try {
        new StarterPanel(ui).render(starters, (hero) => {
            selected = hero;
        });

        assert.ok(calls.includes('pause'));
        assert.ok(calls.includes('overlay:false'));
        assert.match(panelContent.innerHTML, /PRIMER DESPLIEGUE/);
        assert.match(panelContent.innerHTML, /starter-summary-strip/);
        assert.match(panelContent.innerHTML, /Opciones/);
        assert.match(panelContent.innerHTML, /Black Widow/);
        assert.match(panelContent.innerHTML, /starter-card-upgraded rarity-common" type="button"/);
        assert.match(panelContent.innerHTML, /aria-label="Elegir Black Widow\. Rareza Common\. Urbano\. saboteo de soporte\. Radar 4, Control 3\. Coste \$195, Daño 18, Alcance 130, Cadencia 1\.8\/s, Terreno Pasto\. Mejor Control, Mejor Radar" title="Elegir Black Widow\. Rareza Common\. Urbano\. saboteo de soporte\. Radar 4, Control 3\. Coste \$195, Daño 18, Alcance 130, Cadencia 1\.8\/s, Terreno Pasto\. Mejor Control, Mejor Radar" data-tooltip="Elegir Black Widow\. Rareza Common\. Urbano\. saboteo de soporte\. Radar 4, Control 3\. Coste \$195, Daño 18, Alcance 130, Cadencia 1\.8\/s, Terreno Pasto\. Mejor Control, Mejor Radar"/);
        assert.match(panelContent.innerHTML, /starter-spec-strip/);
        assert.match(panelContent.innerHTML, /Coste/);
        assert.match(panelContent.innerHTML, /\$195/);
        assert.match(panelContent.innerHTML, /Alcance/);
        assert.match(panelContent.innerHTML, /Cadencia/);
        assert.match(panelContent.innerHTML, /Terreno/);
        assert.match(panelContent.innerHTML, /Pasto/);
        assert.match(panelContent.innerHTML, /Montaña/);
        assert.match(panelContent.innerHTML, /saboteo de soporte/);
        assert.match(panelContent.innerHTML, /Hawkeye/);
        assert.match(panelContent.innerHTML, /Daño 3/);
        assert.match(panelContent.innerHTML, /Radar/);
        assert.match(panelContent.innerHTML, /Control/);
        assert.match(panelContent.innerHTML, /starter-highlight-row/);
        assert.match(panelContent.innerHTML, /Mejor Daño/);
        assert.match(panelContent.innerHTML, /Mejor Control/);
        assert.match(panelContent.innerHTML, /Mejor Radar/);
        assert.doesNotMatch(panelContent.innerHTML, /Mejor Soporte/);
        assert.equal(cards[0].focused, true);

        cards[1].listeners.click();

        assert.equal(selected.id, 'hawkeye');
        assert.ok(calls.includes('close'));
        assert.equal(closeButton.removedClass, 'hidden');
    } finally {
        globalThis.document = previousDocument;
    }
});

function createCardStub(id) {
    return {
        dataset: { id },
        listeners: {},
        focused: false,
        addEventListener(event, handler) {
            this.listeners[event] = handler;
        },
        focus() {
            this.focused = true;
        }
    };
}

function createCloseButtonStub() {
    const button = {
        removedClass: null,
        classList: {
            remove(className) {
                button.removedClass = className;
            }
        }
    };
    return button;
}
