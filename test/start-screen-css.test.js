import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(file) {
    return fs.readFileSync(path.join(root, file), 'utf8');
}

test('pantalla inicial mantiene loader estable antes de assets listos', () => {
    const index = read('index.html');
    const css = read('styles.css');

    [index, css].forEach((source) => {
        assert.match(source, /body:not\(\.start-assets-ready\) \.start-screen__content/);
        assert.match(source, /align-content: end/);
        assert.match(source, /body:not\(\.start-assets-ready\) \.start-screen__loading/);
        assert.match(source, /body:not\(\.start-assets-ready\) \.start-screen__shade/);
        assert.match(source, /body:not\(\.start-assets-ready\) \.start-screen__frame/);
        assert.match(source, /width: min\(520px, calc\(100vw - 36px\)\)/);
    });
});

test('pantalla inicial adelanta recursos criticos de arranque', () => {
    const index = read('index.html');

    assert.match(index, /rel="modulepreload" href="src\/main\.js"/);
    assert.match(index, /rel="preconnect" href="https:\/\/cdnjs\.cloudflare\.com" crossorigin/);
    assert.match(index, /rel="dns-prefetch" href="https:\/\/cdnjs\.cloudflare\.com"/);
});
