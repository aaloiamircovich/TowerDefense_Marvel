import test from 'node:test';
import assert from 'node:assert/strict';
import { ToastPanel } from '../src/ui/ToastPanel.js';

test('ToastPanel muestra aviso, sincroniza clase, audio y cierre diferido', () => {
    const previousWindow = globalThis.window;
    const calls = [];
    const toastEl = {
        textContent: '',
        className: '',
        classList: {
            add(value) { calls.push(`class:${value}`); }
        }
    };
    globalThis.window = {
        clearTimeout(timer) { calls.push(`clear:${timer}`); },
        setTimeout(handler, delay) {
            calls.push(`timeout:${delay}`);
            handler();
            return 22;
        }
    };
    const ui = {
        toastEl,
        toastTimer: 11,
        game: { audio: { play: (sound) => calls.push(`audio:${sound}`) } }
    };

    try {
        new ToastPanel(ui).show('Listo', 'success');

        assert.equal(toastEl.textContent, 'Listo');
        assert.equal(toastEl.className, 'toast success');
        assert.equal(ui.toastTimer, 22);
        assert.deepEqual(calls, ['clear:11', 'audio:confirm', 'timeout:2200', 'class:hidden']);
    } finally {
        globalThis.window = previousWindow;
    }
});
