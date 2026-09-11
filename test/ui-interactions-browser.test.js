import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

test('browser: collapsed controls and tooltip accessibility', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        const modules = ['TooltipController.js', 'PanelDialogController.js', 'PanelNavigation.js', 'HtmlSanitizer.js'];
        await page.route('http://ui.test/**', async (route) => {
            const name = new URL(route.request().url()).pathname.slice(1);
            if (modules.includes(name)) {
                await route.fulfill({ contentType: 'text/javascript', body: await readFile(new URL(`../src/ui/${name}`, import.meta.url), 'utf8') });
                return;
            }
            await route.fulfill({ contentType: 'text/html', body: `
                <style>.hidden{display:none} #ui-tooltip{position:fixed;width:240px;background:#05080d;color:white;padding:8px}</style>
                <div id="panel-container" tabindex="-1">
                    <button id="first">First</button>
                    <details><summary>Group</summary><button id="collapsed">Hidden</button></details>
                    <button id="last">Last</button>
                </div>
                <button id="tip" data-tooltip="Long help" aria-describedby="help" style="position:fixed;bottom:50px;right:8px">Help <i>icon</i></button>
            ` });
        });
        await page.goto('http://ui.test/');
        const result = await page.evaluate(async () => {
            const { TooltipController } = await import('/TooltipController.js');
            const { PanelDialogController } = await import('/PanelDialogController.js');
            const dialog = new PanelDialogController({ overlay: document.querySelector('#panel-container') });
            const ids = dialog.getFocusableElements().map((element) => element.id || element.tagName);
            const tips = new TooltipController(document);
            tips.show(document.querySelector('#tip'), 'Extended help '.repeat(30));
            const rect = tips.tooltip.getBoundingClientRect();
            const described = document.querySelector('#tip').getAttribute('aria-describedby');
            document.querySelector('#tip i').dispatchEvent(new PointerEvent('pointerout', {
                bubbles: true, relatedTarget: document.querySelector('#tip')
            }));
            const visible = !tips.tooltip.classList.contains('hidden');
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            return {
                ids, top: rect.top, bottom: rect.bottom, described, visible,
                hidden: tips.tooltip.classList.contains('hidden'),
                restored: document.querySelector('#tip').getAttribute('aria-describedby')
            };
        });
        assert.deepEqual(result.ids, ['first', 'SUMMARY', 'last']);
        assert.ok(result.top >= 8 && result.bottom <= 836);
        assert.equal(result.described, 'help ui-tooltip');
        assert.ok(result.visible && result.hidden);
        assert.equal(result.restored, 'help');
    } finally {
        await browser.close();
    }
});
