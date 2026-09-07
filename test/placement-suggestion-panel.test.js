import test from 'node:test';
import assert from 'node:assert/strict';
import { PlacementSuggestionPanel } from '../src/ui/PlacementSuggestionPanel.js';

function createButtonStub() {
    const attributes = {};
    return {
        attributes,
        className: '',
        innerHTML: 'old',
        onclick: () => {},
        title: '',
        dataset: {},
        classList: {
            values: new Set(),
            add(value) {
                this.values.add(value);
            }
        },
        setAttribute(name, value) {
            attributes[name] = value;
        },
        getAttribute(name) {
            return attributes[name];
        }
    };
}

test('PlacementSuggestionPanel oculta la accion cuando no hay sugerencia', () => {
    const previousDocument = globalThis.document;
    const button = createButtonStub();
    let coachRenders = 0;
    globalThis.document = { getElementById: (id) => id === 'suggested-placement-action' ? button : null };

    try {
        const panel = new PlacementSuggestionPanel({ renderOnboardingCoach: () => { coachRenders += 1; }, game: {} });
        panel.update(null);

        assert.equal(button.classList.values.has('hidden'), true);
        assert.equal(button.innerHTML, '');
        assert.equal(button.onclick, null);
        assert.equal(button.getAttribute('aria-label'), 'Usar celda sugerida');
        assert.equal(coachRenders, 1);
    } finally {
        globalThis.document = previousDocument;
    }
});

test('PlacementSuggestionPanel renderiza detalle escapado y confirma colocacion', () => {
    const previousDocument = globalThis.document;
    const button = createButtonStub();
    let confirmed = 0;
    let coachRenders = 0;
    globalThis.document = { getElementById: (id) => id === 'suggested-placement-action' ? button : null };

    try {
        const panel = new PlacementSuggestionPanel({
            renderOnboardingCoach: () => { coachRenders += 1; },
            game: { inputManager: { confirmSuggestedPlacement: () => { confirmed += 1; } } }
        });
        panel.update({
            label: 'Celda <ideal>',
            detail: 'Pasto con "cobertura"',
            qualityId: 'excellent',
            actionLabel: 'Colocar'
        });

        assert.equal(button.className, 'suggested-placement-action excellent');
        assert.equal(button.getAttribute('aria-label'), 'Celda <ideal>. Pasto con "cobertura"');
        assert.match(button.innerHTML, /Celda &lt;ideal&gt;/);
        assert.match(button.innerHTML, /Pasto con &quot;cobertura&quot;/);
        button.onclick();
        assert.equal(confirmed, 1);
        assert.equal(coachRenders, 1);
    } finally {
        globalThis.document = previousDocument;
    }
});
