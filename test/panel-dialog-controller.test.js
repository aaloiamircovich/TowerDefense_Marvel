import test from 'node:test';
import assert from 'node:assert/strict';
import { PanelDialogController } from '../src/ui/PanelDialogController.js';

test('dialog keyboard skips collapsed controls and recovers missing focus', (t) => {
    const focused = [];
    const control = (id, overrides = {}) => ({
        tabIndex: 0,
        matches: () => false,
        closest: () => null,
        getClientRects: () => [{}],
        focus: () => focused.push(id),
        ...overrides
    });
    const first = control('first');
    const last = control('last');
    const controls = [first, control('collapsed', { closest: () => ({}) }),
        control('disabled', { matches: () => true }),
        control('unrendered', { getClientRects: () => [] }),
        control('closed-details', { parentElement: {
            tagName: 'DETAILS', open: false, querySelector: () => ({ contains: () => false })
        } }),
        control('negative', { tabIndex: -1 }), last];
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    t.after(() => {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
    });
    globalThis.document = { activeElement: {}, getElementById: () => control('dialog') };
    globalThis.window = { getComputedStyle: () => ({ visibility: 'visible' }) };
    const controller = new PanelDialogController({ overlay: {
        classList: { contains: () => false }, querySelectorAll: () => controls
    } });
    assert.deepEqual(controller.getFocusableElements(), [first, last]);
    let prevented = 0;
    const tab = (shiftKey = false) => controller.handleDialogKeydown({
        key: 'Tab', shiftKey, preventDefault: () => prevented++
    });
    tab();
    tab(true);
    document.activeElement = last;
    tab();
    document.activeElement = first;
    tab(true);
    controls.length = 0;
    tab();
    assert.deepEqual(focused, ['first', 'last', 'first', 'last', 'dialog']);
    assert.equal(prevented, 5);
});
