import test from 'node:test';
import assert from 'node:assert/strict';
import { TooltipController } from '../src/ui/TooltipController.js';

test('tooltip preserves descriptions, avoids child flicker and fits above viewport edge', (t) => {
    const previousWindow = globalThis.window;
    globalThis.window = { innerWidth: 390, innerHeight: 844 };
    t.after(() => { globalThis.window = previousWindow; });
    const attributes = new Map([['aria-describedby', 'existing-help']]);
    const child = {};
    const target = {
        dataset: { tooltip: 'Ayuda extensa' },
        getAttribute: (key) => attributes.get(key),
        setAttribute: (key, value) => attributes.set(key, value),
        removeAttribute: (key) => attributes.delete(key),
        getBoundingClientRect: () => ({ left: 350, width: 32, top: 740, bottom: 772 }),
        contains: (node) => node === child,
        closest: () => target
    };
    const classes = new Set(['hidden']);
    const tooltip = {
        id: 'ui-tooltip', style: {}, offsetWidth: 240, offsetHeight: 110,
        classList: {
            add: (value) => classes.add(value), remove: (value) => classes.delete(value),
            contains: (value) => classes.has(value)
        }
    };
    const controller = Object.assign(Object.create(TooltipController.prototype), { tooltip, target: null });
    controller.show(target, 'Ayuda extensa');
    assert.equal(attributes.get('aria-describedby'), 'existing-help ui-tooltip');
    assert.equal(tooltip.style.left, '142px');
    assert.equal(tooltip.style.top, '622px');
    controller.handleHide({ target, relatedTarget: child });
    assert.equal(classes.has('hidden'), false);
    controller.handleHide({ target, relatedTarget: null });
    assert.equal(classes.has('hidden'), true);
    assert.equal(attributes.get('aria-describedby'), 'existing-help');
    controller.show(target, '');
    assert.equal(classes.has('hidden'), true);
});
