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
            niche: 'saboteo de soporte',
            teamMetrics: { damage: 2, control: 3, support: 1, detection: 4 }
        },
        {
            id: 'hawkeye',
            name: 'Hawkeye',
            category: 'Táctico',
            rarity: 'Common',
            sprite: 'hawkeye.png',
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
        assert.match(panelContent.innerHTML, /Black Widow/);
        assert.match(panelContent.innerHTML, /saboteo de soporte/);
        assert.match(panelContent.innerHTML, /Radar/);
        assert.match(panelContent.innerHTML, /Control/);

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
        addEventListener(event, handler) {
            this.listeners[event] = handler;
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
