import test from 'node:test';
import assert from 'node:assert/strict';
import { clampPercent, escapeHtml, normalizeClassToken, normalizeControlTag, normalizeCssColor, normalizeIconClass } from '../src/ui/HtmlSanitizer.js';

test('HtmlSanitizer escapa texto y normaliza tokens visuales', () => {
    assert.equal(escapeHtml('<img src=x onerror="bad()">'), '&lt;img src=x onerror=&quot;bad()&quot;&gt;');
    assert.equal(normalizeClassToken('warning" onclick="x'), 'warning-onclick-x');
    assert.equal(normalizeClassToken('123 invalid', 'fallback'), 'fallback');
    assert.equal(normalizeIconClass('fa-solid fa-eye" onclick="x'), 'fa-solid');
    assert.equal(normalizeIconClass('fa-solid fa-eye'), 'fa-solid fa-eye');
    assert.equal(clampPercent(140), 100);
    assert.equal(clampPercent('bad'), 0);
    assert.equal(normalizeControlTag('button'), 'button');
    assert.equal(normalizeControlTag('script'), 'div');
    assert.equal(normalizeCssColor('#40c9ff'), '#40c9ff');
    assert.equal(normalizeCssColor('var(--level-accent)'), 'var(--level-accent)');
    assert.equal(normalizeCssColor('url(javascript:bad)'), 'var(--level-accent)');
});
